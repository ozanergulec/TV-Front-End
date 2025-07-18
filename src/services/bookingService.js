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

    // Telefon numarasını birleştir ve ContactPhone için parse et
    const buildFullPhone = (traveller) => {
      if (!traveller.address?.phone) return '';
      
      const countryCode = traveller.address?.countryCode || '+90';
      const phone = traveller.address?.phone || '';
      
      // Ülke kodu varsa birleştir, yoksa sadece phone'u döndür
      if (countryCode && phone) {
        return `${countryCode} ${phone}`;
      }
      return phone;
    };

    // ContactPhone için parse et
    const parsePhone = (phoneString) => {
      if (!phoneString) return null;
      
      // +90 555 123 4567 formatını parse et
      const cleaned = phoneString.replace(/\D/g, '');
      if (cleaned.length >= 10) {
        // Ülke kodu olarak ilk 2 digit'i al
        let countryCode = cleaned.substring(0, 2);
        let remaining = cleaned.substring(2);
        
        // Eğer 0 ile başlıyorsa, Türkiye için özel durum
        if (cleaned.startsWith('0')) {
          countryCode = '90';
          remaining = cleaned.substring(1);
        }
        
        // Alan kodu ve telefon numarası
        const areaCode = remaining.substring(0, 3) || '555';
        const phoneNumber = remaining.substring(3) || '5555555';
        
        return {
          CountryCode: countryCode,
          AreaCode: areaCode,
          PhoneNumber: phoneNumber
        };
      }
      return {
        CountryCode: '90',
        AreaCode: '555',
        PhoneNumber: '5555555'
      };
    };

    // Tam telefon numarasını oluştur
    const fullPhone = buildFullPhone(traveller);

    const result = {
      TravellerId: (orderNumber || 1).toString(),
      Type: traveller.type || 1,
      Title: traveller.title || 1,
      AcademicTitle: traveller.academicTitle ? { Id: traveller.academicTitle.id || 1 } : { Id: 1 },
      PassengerType: traveller.passengerType || 1,
      Name: traveller.name || '',
      Surname: traveller.surname || '',
      IsLeader: traveller.isLeader || false,
      BirthDate: formatDateTime(traveller.birthDate),
      Nationality: {
        TwoLetterCode: traveller.nationality?.twoLetterCode || 'TR'
      },
      IdentityNumber: traveller.identityNumber || '',
      PassportInfo: {
        Serial: traveller.passportInfo?.serial || '',
        Number: traveller.passportInfo?.number || '',
        ExpireDate: formatDateTime(traveller.passportInfo?.expireDate),
        IssueDate: formatDateTime(traveller.passportInfo?.issueDate),
        CitizenshipCountryCode: traveller.passportInfo?.citizenshipCountryCode || 'TR'
      },
      Address: {
        Phone: fullPhone, // Birleştirilmiş telefon numarası
        Email: traveller.address?.email || '',
        Address: traveller.address?.address || '',
        ZipCode: traveller.address?.zipCode || '',
        City: {
          Id: traveller.address?.city?.id || '',
          Name: traveller.address?.city?.name || ''
        },
        Country: {
          Id: traveller.address?.country?.id || '',
          Name: traveller.address?.country?.name || ''
        }
      },
      DestinationAddress: {},
      OrderNumber: orderNumber || 1,
      Documents: [],
      InsertFields: [],
      Status: traveller.status || 0,
      Gender: traveller.gender || 0
    };

    // Lider yolcu için ContactPhone ekle
    if (traveller.isLeader && fullPhone) {
      result.Address.ContactPhone = parsePhone(fullPhone);
    }

    console.log('📱 Telefon Debug:', {
      countryCode: traveller.address?.countryCode,
      phone: traveller.address?.phone,
      fullPhone: fullPhone,
      contactPhone: result.Address.ContactPhone
    });

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