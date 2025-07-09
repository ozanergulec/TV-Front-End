import apiService from './api';

class HotelService {
  // Destinasyon autocomplete
  async getArrivalAutocomplete(searchText) {
    const request = {
      ProductType: 2,
      Query: searchText,
      Culture: "en-US"
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

  // Check-in tarihleri - FORMAT DÜZELTİLDİ
  async getCheckInDates(destinationId) {
    const request = {
      ProductType: 2,
      arrivalLocations: [
        {
          Id: destinationId,
          Type: 1
        }
      ]
    };
    
    try {
      const response = await apiService.post('/HotelProduct/get-checkin-dates', request);
      console.log('📅 RAW Check-in dates response:', response);
      
      // FORMAT DÜZELTİLDİ - body.dates kullan, header.success yok
      if (response && response.body && response.body.dates && response.body.dates.length > 0) {
        console.log('✅ Check-in dates bulundu:', response.body.dates.length, 'tarih');
        return response.body.dates;
      } else {
        console.log('⚠️ Check-in dates bulunamadı');
        return [];
      }
    } catch (error) {
      console.error('Check-in dates failed:', error);
      return [];
    }
  }

  // Fiyat arama - CHECK-IN DATES KONTROLÜ DÜZELTİLDİ
  async priceSearch(searchData) {
    const nights = this.calculateNights(searchData.checkIn, searchData.checkOut);
    
    let arrivalLocations = [];
    
    if (searchData.destination) {
      // Destinasyon ID'si var
      console.log('🎯 Destinasyon ID olarak geldi:', searchData.destination);
      
      // Check-in dates kontrol et
      console.log('📅 Check-in dates kontrol ediliyor...');
      const availableDates = await this.getCheckInDates(searchData.destination);
      
      if (availableDates.length === 0) {
        console.log('❌ Bu destinasyonda uygun tarih bulunamadı');
        throw new Error('Bu destinasyonda seçilen tarihlerde otel bulunamadı');
      }
      
      console.log('✅ Check-in dates onaylandı, price search devam ediyor...');
      
      arrivalLocations = [{
        id: searchData.destination,
        type: 2  // 1 değil, 2 olmalı!
      }];
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
    
    console.log('📤 Price search request:', JSON.stringify(request, null, 2));
    
    try {
      const response = await apiService.post('/HotelProduct/price-search', request);
      console.log('📥 Price search response:', JSON.stringify(response, null, 2));
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