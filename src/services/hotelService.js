import apiService from './api';

class HotelService {
  constructor() {
    this.checkInDatesCache = new Map(); 
    this.cacheExpiry = 5 * 60 * 1000; 
  }

  
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

  
  async getCheckInDates(destinationId) {
    const cacheKey = `checkin_${destinationId}`;
    const cached = this.checkInDatesCache.get(cacheKey);
    
    // Cache kontrol et
    if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
      console.log('✅ Check-in dates cache\'den alındı');
      return cached.data;
    }
    
    try {
      
      const request = {
        productType: 2,
        includeSubLocations: true,
        product: null,
        arrivalLocations: [
          {
            id: destinationId,
            type: 2
          }
        ]
      };
      
      console.log(' Check-in dates request:', request);
      
      const response = await apiService.post('/HotelProduct/get-checkin-dates', request);
      
      console.log(' RAW Check-in dates response:', response);
      
      if (response && response.body && response.body.dates) {
        const dates = response.body.dates;
        console.log(' Check-in dates bulundu:', dates.length, 'tarih');
        
        // Cache'e kaydet
        this.checkInDatesCache.set(cacheKey, {
          data: dates,
          timestamp: Date.now()
        });
        
        return dates;
      }
      
      return [];
    } catch (error) {
      console.error('Check-in dates failed:', error);
      return [];
    }
  }

  //  Optimized price search 
  async priceSearch(searchData) {
    const nights = this.calculateNights(searchData.checkIn, searchData.checkOut);
    
    let arrivalLocations = [];
    
    if (searchData.destination) {
      console.log(' Destinasyon ID olarak geldi:', searchData.destination);
      
      // Check-in dates'i kontrol et (cache mekanizması ile)
      console.log(' Check-in dates kontrol ediliyor...');
      const availableDates = await this.getCheckInDates(searchData.destination);
      
      if (availableDates.length === 0) {
        console.log(' Bu destinasyonda uygun tarih bulunamadı');
        throw new Error('Bu destinasyonda seçilen tarihlerde otel bulunamadı');
      }
      
      console.log(' Check-in dates onaylandı, price search devam ediyor...');
      
      arrivalLocations = [{
        id: searchData.destination,
        type: 2
      }];
    }

    // ÇOK ODALI ROOM CRITERIA 
    const roomCriteria = searchData.rooms.map(room => ({
      adult: parseInt(room.adults),
      childAges: room.children > 0 ? room.childAges : []
    }));
    
    const request = {
      checkAllotment: true,
      checkStopSale: true,
      getOnlyDiscountedPrice: false,
      getOnlyBestOffers: true,
      productType: 2,
      arrivalLocations: arrivalLocations,
      roomCriteria: roomCriteria,
      nationality: searchData.nationality,
      checkIn: searchData.checkIn,
      night: nights,
      currency: searchData.currency,
      culture: "en-US"
    };
    
    console.log(' Çok odalı price search request:', JSON.stringify(request, null, 2));
    console.log(' Room Criteria Details:');
    roomCriteria.forEach((room, index) => {
      console.log(`  Oda ${index + 1}: ${room.adult} yetişkin, ${room.childAges.length} çocuk`, 
                 room.childAges.length > 0 ? `(Yaşlar: ${room.childAges.join(', ')})` : '');
    });
    
    try {
      const response = await apiService.post('/HotelProduct/price-search', request);
      console.log(' Price search response:', JSON.stringify(response, null, 2));
      return response;
    } catch (error) {
      console.error('Price search failed:', error);
      throw error;
    }
  }

  clearCache() {
    this.checkInDatesCache.clear();
  }

  //  YENİ LOOKUP SERVICE METHODLARI
  async getCurrencies() {
    try {
      const response = await apiService.request('/Lookup/currencies', {
        method: 'GET'
      });
      console.log(' Currencies response:', response);
      
      if (response && response.body && response.body.currencies) {
        return response.body.currencies;
      }
      return [];
    } catch (error) {
      console.error('Get currencies failed:', error);
      throw error;
    }
  }

  async getNationalities() {
    try {
      const response = await apiService.request('/Lookup/nationalities', {
        method: 'GET'
      });
      console.log(' Nationalities response:', response);
      
      if (response && response.body && response.body.nationalities) {
        return response.body.nationalities;
      }
      return [];
    } catch (error) {
      console.error('Get nationalities failed:', error);
      throw error;
    }
  }

  // Helper functions
  calculateNights(checkIn, checkOut) {
    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);
    const diffTime = Math.abs(checkOutDate - checkInDate);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }
}

export default new HotelService();