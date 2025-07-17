const API_BASE_URL = '/api';

class BookingService {
  // Transaction başlatma - Teklif ile
  async beginTransactionWithOffer(offerIds, currency = 'EUR', culture = 'tr-TR') {
    try {
      console.log('🔄 BeginTransaction API çağrısı başlatılıyor...');
      console.log('URL:', `${API_BASE_URL}/BeginTransaction/with-offer`);
      console.log('Payload:', { offerIds, currency, culture });
      
      const response = await fetch(`${API_BASE_URL}/BeginTransaction/with-offer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          offerIds,
          currency,
          culture
        }),
      });

      console.log('📡 Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Response error:', errorText);
        throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log('✅ Response data:', data);
      return data;
    } catch (error) {
      console.error('❌ BeginTransaction error:', error);
      throw error;
    }
  }

  // Transaction başlatma - Rezervasyon ile
  async beginTransactionWithReservation(reservationNumber, currency = 'EUR', culture = 'tr-TR') {
    try {
      console.log('🔄 BeginTransaction with reservation API çağrısı başlatılıyor...');
      
      const response = await fetch(`${API_BASE_URL}/BeginTransaction/with-reservation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reservationNumber,
          currency,
          culture
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('❌ BeginTransaction with reservation error:', error);
      throw error;
    }
  }

  // Yolcu bilgilerini kaydetme
  async setReservationInfo(transactionId, travellers, customerInfo, reservationNote = '', agencyReservationNumber = '') {
    try {
      console.log('🔄 SetReservationInfo API çağrısı başlatılıyor...');
      
      const response = await fetch(`${API_BASE_URL}/SetReservationInfo`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transactionId,
          travellers,
          customerInfo,
          reservationNote,
          agencyReservationNumber
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('❌ SetReservationInfo error:', error);
      throw error;
    }
  }

  // Rezervasyonu tamamlama
  async commitTransaction(transactionId) {
    try {
      console.log('🔄 CommitTransaction API çağrısı başlatılıyor...');
      
      const response = await fetch(`${API_BASE_URL}/CommitTransaction`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transactionId
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('❌ CommitTransaction error:', error);
      throw error;
    }
  }

  // Rezervasyon detaylarını getirme
  async getReservationDetail(reservationNumber) {
    try {
      console.log('🔄 GetReservationDetail API çağrısı başlatılıyor...');
      
      const response = await fetch(`${API_BASE_URL}/GetReservationDetail`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reservationNumber
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('❌ GetReservationDetail error:', error);
      throw error;
    }
  }

  // Yolcu bilgilerini format etme
  formatTravellerForRequest(traveller, orderNumber) {
    return {
      travellerId: traveller.travellerId || '',
      type: traveller.type || 1,
      title: traveller.title || 1,
      academicTitle: traveller.academicTitle || null,
      passengerType: traveller.passengerType || 1,
      name: traveller.name || '',
      surname: traveller.surname || '',
      isLeader: traveller.isLeader || false,
      birthDate: traveller.birthDate || '',
      nationality: {
        twoLetterCode: traveller.nationality?.twoLetterCode || 'TR'
      },
      identityNumber: traveller.identityNumber || '',
      passportInfo: {
        serial: traveller.passportInfo?.serial || '',
        number: traveller.passportInfo?.number || '',
        expireDate: traveller.passportInfo?.expireDate || '',
        issueDate: traveller.passportInfo?.issueDate || '',
        citizenshipCountryCode: traveller.passportInfo?.citizenshipCountryCode || 'TR'
      },
      address: {
        phone: traveller.address?.phone || '',
        email: traveller.address?.email || '',
        address: traveller.address?.address || '',
        zipCode: traveller.address?.zipCode || '',
        city: {
          id: traveller.address?.city?.id || '',
          name: traveller.address?.city?.name || ''
        },
        country: {
          id: traveller.address?.country?.id || '',
          name: traveller.address?.country?.name || ''
        }
      },
      orderNumber: orderNumber,
      status: traveller.status || 1,
      gender: traveller.gender || 1
    };
  }

  // Müşteri bilgilerini format etme
  formatCustomerInfoForRequest(customerInfo) {
    return {
      isCompany: customerInfo.isCompany || false,
      title: customerInfo.title || 1,
      name: customerInfo.name || '',
      surname: customerInfo.surname || '',
      birthDate: customerInfo.birthDate || '',
      identityNumber: customerInfo.identityNumber || '',
      address: {
        email: customerInfo.address?.email || '',
        phone: customerInfo.address?.phone || '',
        address: customerInfo.address?.address || '',
        zipCode: customerInfo.address?.zipCode || '',
        city: {
          id: customerInfo.address?.city?.id || '',
          name: customerInfo.address?.city?.name || ''
        },
        country: {
          id: customerInfo.address?.country?.id || '',
          name: customerInfo.address?.country?.name || ''
        }
      },
      taxInfo: {
        taxOffice: customerInfo.taxInfo?.taxOffice || '',
        taxNumber: customerInfo.taxInfo?.taxNumber || ''
      }
    };
  }
}

export default new BookingService();