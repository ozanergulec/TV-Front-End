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
      
      const requestBody = {
        TransactionId: transactionId,
        Travellers: travellers,
        CustomerInfo: customerInfo,
        ReservationNote: reservationNote,
        AgencyReservationNumber: agencyReservationNumber
      };
      
      console.log('📤 API Request Body:', JSON.stringify(requestBody, null, 2));
      
      const response = await fetch(`${API_BASE_URL}/SetReservationInfo`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ API Response Error:', errorText);
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
    // DateTime alanlarını C# DateTime formatında - "2030-01-01T00:00:00"
    const formatDateTime = (dateString) => {
      if (!dateString || dateString === '') {
        return '2030-01-01T00:00:00'; // Default future date
      }
      
      try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) {
          return '2030-01-01T00:00:00';
        }
        // C# DateTime format: "2030-01-01T00:00:00" (no Z, no milliseconds)
        return date.toISOString().split('.')[0];
      } catch (error) {
        return '2030-01-01T00:00:00';
      }
    };

    // Telefon numarasını parse et
    const parsePhone = (phoneString) => {
      if (!phoneString) return null;
      
      // +90 555 123 4567 formatını parse et
      const cleaned = phoneString.replace(/\D/g, '');
      if (cleaned.length >= 10) {
        return {
          CountryCode: cleaned.substring(0, 2) || '90',    // PascalCase
          AreaCode: cleaned.substring(2, 5) || '555',      // PascalCase
          PhoneNumber: cleaned.substring(5) || '5555555'   // PascalCase
        };
      }
      return {
        CountryCode: '90',     // PascalCase
        AreaCode: '555',       // PascalCase
        PhoneNumber: '5555555' // PascalCase
      };
    };

    const result = {
      TravellerId: (orderNumber || 1).toString(),                              // PascalCase
      Type: traveller.type || 1,                                               // PascalCase
      Title: traveller.title || 1,                                             // PascalCase
      AcademicTitle: traveller.academicTitle ? { Id: traveller.academicTitle.id || 1 } : { Id: 1 }, // PascalCase
      PassengerType: traveller.passengerType || 1,                             // PascalCase
      Name: traveller.name || '',                                              // PascalCase
      Surname: traveller.surname || '',                                        // PascalCase
      IsLeader: traveller.isLeader || false,                                   // PascalCase
      BirthDate: formatDateTime(traveller.birthDate),                          // PascalCase
      Nationality: {                                                           // PascalCase
        TwoLetterCode: traveller.nationality?.twoLetterCode || 'TR'            // PascalCase
      },
      IdentityNumber: traveller.identityNumber || '',                          // PascalCase
      PassportInfo: {                                                          // PascalCase
        Serial: traveller.passportInfo?.serial || '',                         // PascalCase
        Number: traveller.passportInfo?.number || '',                         // PascalCase
        ExpireDate: formatDateTime(traveller.passportInfo?.expireDate),       // PascalCase
        IssueDate: formatDateTime(traveller.passportInfo?.issueDate),         // PascalCase
        CitizenshipCountryCode: traveller.passportInfo?.citizenshipCountryCode || 'TR' // PascalCase
      },
      Address: {                                                               // PascalCase
        Phone: traveller.address?.phone || '',                                // PascalCase
        Email: traveller.address?.email || '',                                // PascalCase
        Address: traveller.address?.address || '',                            // PascalCase
        ZipCode: traveller.address?.zipCode || '',                            // PascalCase
        City: {                                                               // PascalCase
          Id: traveller.address?.city?.id || '',                             // PascalCase
          Name: traveller.address?.city?.name || ''                          // PascalCase
        },
        Country: {                                                            // PascalCase
          Id: traveller.address?.country?.id || '',                          // PascalCase
          Name: traveller.address?.country?.name || ''                       // PascalCase
        }
      },
      DestinationAddress: {},                                                  // PascalCase
      OrderNumber: orderNumber || 1,                                          // PascalCase
      Documents: [],                                                           // PascalCase
      InsertFields: [],                                                        // PascalCase
      Status: traveller.status || 0,                                          // PascalCase
      Gender: traveller.gender || 0                                           // PascalCase
    };

    // Lider yolcu için contactPhone ekle
    if (traveller.isLeader && traveller.address?.phone) {
      result.Address.ContactPhone = parsePhone(traveller.address.phone);      // PascalCase
    }

    return result;
  }

  // Müşteri bilgilerini format etme
  formatCustomerInfoForRequest(customerInfo) {
    const formatDate = (dateString) => {
      if (!dateString || dateString === '') {
        return '1996-01-01'; // Default date (sadece tarih, time yok)
      }
      
      try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) {
          return '1996-01-01';
        }
        return date.toISOString().split('T')[0]; // Sadece tarih kısmını al
      } catch (error) {
        return '1996-01-01';
      }
    };

    return {
      IsCompany: customerInfo.isCompany || false,         // PascalCase
      PassportInfo: {},                                   // PascalCase
      Title: customerInfo.title || 1,                    // PascalCase
      Name: customerInfo.name || '',                     // PascalCase
      Surname: customerInfo.surname || '',               // PascalCase
      BirthDate: formatDate(customerInfo.birthDate),     // PascalCase
      IdentityNumber: customerInfo.identityNumber || '', // PascalCase
      Address: {                                         // PascalCase
        Email: customerInfo.address?.email || '',        // PascalCase
        Phone: customerInfo.address?.phone || '',        // PascalCase
        Address: customerInfo.address?.address || '',    // PascalCase
        ZipCode: customerInfo.address?.zipCode || '',    // PascalCase
        City: {                                          // PascalCase
          Id: customerInfo.address?.city?.id || '',      // PascalCase
          Name: customerInfo.address?.city?.name || ''   // PascalCase
        },
        Country: {                                       // PascalCase
          Id: customerInfo.address?.country?.id || '',   // PascalCase
          Name: customerInfo.address?.country?.name || '' // PascalCase
        }
      },
      TaxInfo: {                                         // PascalCase
        TaxOffice: customerInfo.taxInfo?.taxOffice || '', // PascalCase
        TaxNumber: customerInfo.taxInfo?.taxNumber || ''  // PascalCase
      }
    };
  }
}

export default new BookingService();