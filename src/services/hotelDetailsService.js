import apiService from './api';

class HotelDetailsService {
  async getProductInfo(productId, productType = 2, ownerProvider = 2, culture = "en-US") {
    const request = {
      productType: productType,
      ownerProvider: ownerProvider, 
      product: productId,
      culture: culture
    };
    
    try {
      console.log(' Getting hotel product info for ID:', productId);
      console.log(' Request:', JSON.stringify(request, null, 2));
      const response = await apiService.post('/HotelProduct/getProductInfo', request);
      console.log(' Hotel product info response:', JSON.stringify(response, null, 2));
      return response;
    } catch (error) {
      console.error(' Get product info failed:', error);
      throw error;
    }
  }

  async getOffers(productId, searchData, culture = "tr-TR") {
    const request = {
      searchId: searchData?.searchId || '',
      offerId: searchData?.offerId || '',
      productType: 2,
      productId: productId,
      currency: searchData?.currency || "EUR",
      culture: culture,
      getRoomInfo: true
    };
    
    try {
      console.log(' Getting offers for hotel ID:', productId);
      console.log(' GetOffers Request:', JSON.stringify(request, null, 2));
      
      // Zorunlu alan kontrol 
      if (!request.searchId) {
        throw new Error('searchId is required for GetOffers');
      }
      
      if (!request.productId) {
        throw new Error('productId is required for GetOffers');
      }
      
      const response = await apiService.post('/GetOffers', request);
      console.log(' GetOffers Response:', JSON.stringify(response, null, 2));
      return response;
    } catch (error) {
      console.error(' Get offers failed:', error);
      throw error;
    }
  }

  // Helper functions
  formatOffers(offersResponse) {
    if (!offersResponse?.body?.offers) {
      return [];
    }
    
    console.log(' Formatting offers:', offersResponse.body.offers);
    
    return offersResponse.body.offers.map(offer => {
      console.log(' Processing offer:', offer);
      console.log(' Offer price:', offer.price);
      console.log(' Offer rooms:', offer.rooms);
      
      const formattedOffer = {
        id: offer.offerId,
        checkIn: offer.checkIn,
        checkOut: offer.checkOut || this.calculateCheckOut(offer.checkIn, offer.night),
        nights: offer.night,
        price: {
          amount: offer.price?.amount || 0,
          currency: offer.price?.currency || 'EUR'
        },
        isAvailable: offer.isAvailable,
        isRefundable: offer.isRefundable,
        availability: offer.availability,
        expiresOn: offer.expiresOn,
        rooms: this.formatRooms(offer.rooms || []),
        cancellationPolicies: offer.cancellationPolicies || [],
        provider: offer.provider
      };
      
      console.log(' Formatted offer:', formattedOffer);
      return formattedOffer;
    });
  }

  formatRooms(rooms) {
    console.log('🔍 Formatting rooms:', rooms);
    
    return rooms.map(room => {
      console.log('🔍 Processing room:', room);
      console.log('🔍 Room price:', room.price);
      
      const formattedRoom = {
        id: room.roomId,
        name: room.roomName,
        accommodation: room.accomName,
        boardType: room.boardName,
        price: {
          amount: room.price?.amount || 0,
          currency: room.price?.currency || 'EUR',
          oldAmount: room.price?.oldAmount || null
        },
        allotment: room.allotment,
        travellers: room.travellers || [],
        partNo: room.partNo || 1
      };
      
      console.log(' Formatted room:', formattedRoom);
      return formattedRoom;
    });
  }

  calculateCheckOut(checkIn, nights) {
    if (!checkIn || !nights) return null;
    
    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkInDate);
    checkOutDate.setDate(checkOutDate.getDate() + nights);
    
    return checkOutDate.toISOString();
  }

  organizeHotelMedia(hotel) {
    // Seasons null olabilir, bu durumda fallback kullan
    const mediaFiles = hotel.seasons?.[0]?.mediaFiles || [];
    const images = mediaFiles.filter(media => media.fileType === 1); 
    
    // Varsayılan resim 
    const defaultImage = '/images/destinations/istanbul.jpg';
    
    return {
      mainImage: images[0]?.urlFull || hotel.thumbnailFull || hotel.thumbnail || defaultImage,
      galleryImages: images.slice(1, 10) || [] // Boş array fallback
    };
  }

  // Otel olanaklarını kategorilere ayır - NULL SAFE
  organizeFacilities(hotel) {
    console.log(' Organizing facilities for hotel:', hotel.name);
    console.log(' Seasons data:', hotel.seasons);
    
    // Seasons null olabilir
    const facilityCategories = hotel.seasons?.[0]?.facilityCategories || [];
    console.log('🔧 Facility categories found:', facilityCategories.length);
    
    if (facilityCategories.length === 0) {
      console.log(' No facility categories found, creating mock data');
      
      return [
        {
          name: 'Genel',
          facilities: [
            { name: 'Klima', isPriced: false },
            { name: 'WiFi', isPriced: false },
            { name: 'Resepsiyon (24 saat)', isPriced: false },
            { name: 'Oda Servisi', isPriced: true }
          ]
        }
      ];
    }
    
    return facilityCategories.map(category => ({
      name: category.name || 'Bilinmeyen Kategori',
      facilities: (category.facilities || []).map(facility => ({
        name: facility.name || 'Bilinmeyen Özellik',
        isPriced: facility.isPriced || false
      }))
    }));
  }

  
  formatHotelInfo(hotel) {
    return {
      id: hotel.id || 'N/A',
      name: hotel.name || 'Hotel Adı Bulunamadı',
      category: hotel.hotelCategory?.name || 'Kategori Belirtilmemiş',
      categoryCode: hotel.hotelCategory?.code || 'N/A',
      description: hotel.description?.text || 'Açıklama mevcut değil',
      location: {
        name: hotel.location?.name || hotel.city?.name || 'Konum Belirtilmemiş',
        city: hotel.city?.name || 'Şehir Belirtilmemiş',
        country: hotel.country?.name || 'Ülke Belirtilmemiş',
        latitude: hotel.geolocation?.latitude || hotel.location?.latitude || '',
        longitude: hotel.geolocation?.longitude || hotel.location?.longitude || ''
      },
      address: {
        street: hotel.address?.street || '',
        streetNumber: hotel.address?.streetNumber || '',
        addressLines: hotel.address?.addressLines || [],
        fullAddress: this.buildFullAddress(hotel.address)
      },
      contact: {
        phone: hotel.phoneNumber || 'Telefon bilgisi mevcut değil',
        fax: hotel.faxNumber || 'Faks bilgisi mevcut değil',
        website: hotel.homePage || ''
      },
      media: this.organizeHotelMedia(hotel),
      facilities: this.organizeFacilities(hotel),
      themes: hotel.themes || [],
      provider: hotel.provider || 'Bilinmeyen Provider',
      
      coordinates: {
        lat: hotel.geolocation?.latitude || hotel.location?.latitude || null,
        lng: hotel.geolocation?.longitude || hotel.location?.longitude || null
      }
    };
  }

  buildFullAddress(address) {
    if (!address) return 'Adres bilgisi mevcut değil';
    
    let fullAddress = '';
    
    if (address.streetNumber) fullAddress += address.streetNumber;
    if (address.street) {
      fullAddress += (fullAddress ? ' ' : '') + address.street;
    }
    
    if (address.addressLines && address.addressLines.length > 0) {
      const addressLinesText = address.addressLines.join(', ');
      fullAddress += (fullAddress ? ', ' : '') + addressLinesText;
    }
    
    return fullAddress || 'Adres bilgisi mevcut değil';
  }

  // Otel temasını renkle eşleştir
  getThemeColor(themes) {
    if (!themes || themes.length === 0) return '#667eea';
    
    const themeColors = {
      'beach': '#17a2b8',
      'city': '#6c757d',
      'mountain': '#28a745',
      'spa': '#e83e8c',
      'business': '#343a40',
      'family': '#fd7e14',
      'luxury': '#6f42c1'
    };

    const firstTheme = themes[0].name?.toLowerCase() || '';
    for (const [key, color] of Object.entries(themeColors)) {
      if (firstTheme.includes(key)) {
        return color;
      }
    }
    
    return '#667eea'; // Default color
  }

  // Koordinatları kontrol et
  hasValidCoordinates(hotel) {
    const formatted = this.formatHotelInfo(hotel);
    return formatted.coordinates.lat && formatted.coordinates.lng;
  }

  // Otel kategorisini yıldız olarak göster
  getCategoryStars(categoryCode) {
    const stars = parseInt(categoryCode) || 0;
    return stars > 0 ? '★'.repeat(Math.min(stars, 5)) : 'Kategori Belirtilmemiş';
  }

  async getOfferDetails(offerIds, currency = "EUR") {
    const request = {
      offerIds: Array.isArray(offerIds) ? offerIds : [offerIds],
      currency: currency,
      getProductInfo: true
    };
    
    try {
      console.log(' Getting offer details for IDs:', offerIds);
      console.log(' GetOfferDetails Request:', JSON.stringify(request, null, 2));
      const response = await apiService.post('/GetOfferDetails/GetOfferDetails', request);
      console.log(' GetOfferDetails Response:', JSON.stringify(response, null, 2));
      return response;
    } catch (error) {
      console.error(' Get offer details failed:', error);
      throw error;
    }
  }

  formatOfferDetails(detailsResponse) {
    console.log(' formatOfferDetails called with:', detailsResponse);
    
    if (!detailsResponse?.body?.offerDetails) {
      console.log(' No offerDetails found in response');
      return null;
    }
    
    console.log(' offerDetails array:', detailsResponse.body.offerDetails);
    
    const detail = detailsResponse.body.offerDetails[0]; 
    
    if (!detail) {
      console.log(' No detail found in offerDetails array');
      return null;
    }
    
    console.log(' Processing detail:', detail);
    
    const formatted = {
      id: detail.offerId,
      expiresOn: detail.expiresOn,
      checkIn: detail.checkIn,
      checkOut: detail.checkOut,
      isSpecial: detail.isSpecial,
      isAvailable: detail.isAvailable,
      availability: detail.availability,
      isRefundable: detail.isRefundable,
      price: {
        amount: detail.price?.amount || 0,
        currency: detail.price?.currency || 'EUR',
        oldAmount: detail.price?.oldAmount || null,
        percent: detail.price?.percent || 0
      },
      hotels: detail.hotels || [],
      cancellationPolicies: detail.cancellationPolicies || [],
      priceBreakdowns: detail.priceBreakdowns || [],
      provider: detail.provider,
      reservableInfo: detail.reservableInfo
    };
    
    console.log(' Formatted offer details:', formatted);
    return formatted;
  }
}

export default new HotelDetailsService();