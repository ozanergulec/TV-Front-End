import apiService from './api';

class HotelService {
  // Destinasyon autocomplete
  async getArrivalAutocomplete(searchText) {
    const request = {
      ProductType: 2,      // 2 olmalı!
      Query: searchText,
      Culture: "en-US"     // en-US olmalı!
    };
    
    try {
      const response = await apiService.post('/HotelProduct/get-arrival-autocomplete', request);
      console.log('Autocomplete response:', response);
      return response;
    } catch (error) {
      console.error('Autocomplete failed:', error);
      throw error;
    }
  }

  // Check-in tarihleri
  async getCheckInDates(arrivalLocations) {
    const request = {
      ProductType: 1,
      IncludeSubLocations: true,
      Product: null,
      ArrivalLocations: arrivalLocations  // Büyük harfle
    };
    
    try {
      const response = await apiService.post('/HotelProduct/get-checkin-dates', request);
      console.log('Check-in dates response:', response);
      return response;
    } catch (error) {
      console.error('Check-in dates failed:', error);
      throw error;
    }
  }

  // Fiyat arama - DROPDOWN SEÇİMİ DÜZELTİLDİ
async priceSearch(searchData) {
    const nights = this.calculateNights(searchData.checkIn, searchData.checkOut);
    
    let arrivalLocations = [];
    
    if (searchData.destination) {
      // Eğer destination bir ID ise (sadece rakamlardan oluşuyorsa) direkt kullan
      if (/^\d+$/.test(searchData.destination)) {
        console.log('🎯 Destinasyon ID olarak geldi:', searchData.destination);
        arrivalLocations = [{
          id: searchData.destination,
          type: 2
        }];
        console.log('✅ Direkt ID kullanıldı:', arrivalLocations);
        
      } else if (typeof searchData.destination === 'string') {
        // Eğer destination text ise autocomplete yap
        console.log('🔍 Destinasyon text olarak geldi:', searchData.destination);
        
        try {
          const autocompleteResult = await this.getArrivalAutocomplete(searchData.destination);
          
          if (autocompleteResult.header?.success && 
              autocompleteResult.body && 
              autocompleteResult.body.items && 
              autocompleteResult.body.items.length > 0) {
            
            const firstItem = autocompleteResult.body.items[0];
            arrivalLocations = [{
              id: firstItem.city?.id || firstItem.giataInfo?.destinationId,
              type: 2
            }];
            console.log('✅ Autocomplete\'den lokasyon alındı:', arrivalLocations);
            
          } else {
            throw new Error(`"${searchData.destination}" için destinasyon bulunamadı. Lütfen daha spesifik bir şehir adı deneyin.`);
          }
          
        } catch (error) {
          console.error('❌ Autocomplete hatası:', error);
          throw error;
        }
      }
    }
    
    const request = {
      checkAllotment: true,
      checkStopSale: true,
      getOnlyDiscountedPrice: false,
      getOnlyBestOffers: true,
      productType: 2,
      arrivalLocations: arrivalLocations,
      roomCriteria: [{
        adult: parseInt(searchData.adults),
        childAges: searchData.childAges.length > 0 ? searchData.childAges : []
      }],
      nationality: searchData.nationality,
      checkIn: searchData.checkIn,
      night: nights,
      currency: searchData.currency,
      culture: "en-US"
    };
    
    console.log('📤 Price search request:', request);
    
    try {
      const response = await apiService.post('/HotelProduct/price-search', request);
      console.log('📥 Price search response:', response);
      return response;
    } catch (error) {
      console.error('Price search failed:', error);
      throw error;
    }
  }

  // Gece sayısını hesapla
  calculateNights(checkIn, checkOut) {
    if (!checkIn || !checkOut) return 1;
    
    const startDate = new Date(checkIn);
    const endDate = new Date(checkOut);
    const timeDiff = endDate.getTime() - startDate.getTime();
    const nights = Math.ceil(timeDiff / (1000 * 3600 * 24));
    
    return nights > 0 ? nights : 1;
  }
}

export default new HotelService();