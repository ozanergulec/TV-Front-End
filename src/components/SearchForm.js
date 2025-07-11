import React, { useState, useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import { useNavigate } from 'react-router-dom';
import hotelService from '../services/hotelService';
import '../components.css';

const SearchForm = forwardRef((props, ref) => {
  const [searchData, setSearchData] = useState({
    destination: '',
    destinationName: '',
    checkIn: '',
    checkOut: '',
    currency: 'EUR',
    nationality: 'TR',
    rooms: [
      {
        adults: 2,
        children: 0,
        childAges: []
      }
    ]
  });

  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showGuestDropdown, setShowGuestDropdown] = useState(false);
  
  // Autocomplete states
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  
  // YENİ DYNAMIC DATA STATES
  const [currencies, setCurrencies] = useState([]);
  const [nationalities, setNationalities] = useState([]);
  const [loadingLookups, setLoadingLookups] = useState(true);
  
  // YENİ SEARCHABLE DROPDOWN STATES
  const [currencySearch, setCurrencySearch] = useState('');
  const [nationalitySearch, setNationalitySearch] = useState('');
  const [showCurrencyDropdown, setShowCurrencyDropdown] = useState(false);
  const [showNationalityDropdown, setShowNationalityDropdown] = useState(false);
  const [filteredCurrencies, setFilteredCurrencies] = useState([]);
  const [filteredNationalities, setFilteredNationalities] = useState([]);
  
  const suggestionTimeoutRef = useRef(null);
  const dropdownRef = useRef(null);
  const guestDropdownRef = useRef(null);
  const currencyDropdownRef = useRef(null);
  const nationalityDropdownRef = useRef(null);

  const navigate = useNavigate();

  // Parent component'a expose edilecek methodlar
  useImperativeHandle(ref, () => ({
    setDestinationFromCity: async (cityName) => {
      try {
        console.log('🏙️ Şehir seçildi:', cityName);
        setLoadingSuggestions(true);
        
        // Autocomplete API'sinden ilk sonucu al
        const result = await hotelService.getArrivalAutocomplete(cityName);
        
        if (result.header?.success && result.body?.items && result.body.items.length > 0) {
          const firstResult = result.body.items[0];
          
          // İlk sonucu destinasyon olarak set et
          let destinationId, displayName;
          
          if (firstResult.type === 1) {
            // Lokasyon seçimi
            destinationId = firstResult.city?.id || firstResult.giataInfo?.destinationId;
            const cityName = firstResult.city?.name || 'Unknown';
            const countryName = firstResult.country?.name || '';
            displayName = countryName ? `${cityName}, ${countryName}` : cityName;
          } else {
            // Otel seçimi
            destinationId = firstResult.hotel?.id || firstResult.giataInfo?.hotelId;
            const hotelName = firstResult.hotel?.name || 'Unknown';
            const cityName = firstResult.city?.name || '';
            displayName = `${hotelName} (${cityName})`;
          }
          
          // Güncellenmiş searchData objesi oluştur
          const updatedSearchData = {
            ...searchData,
            destination: destinationId,
            destinationName: displayName
          };
          
          // State'i güncelle
          setSearchData(updatedSearchData);
          
          console.log('✅ Destinasyon set edildi:', displayName, 'ID:', destinationId);
          
          // ✅ DİREKT OLARAK güncellenmiş data ile arama yap - setTimeout yok!
          await handleAutoSearch(updatedSearchData);
          
        } else {
          console.log('❌ Şehir için sonuç bulunamadı:', cityName);
          alert('Bu şehir için otel bulunamadı');
        }
      } catch (error) {
        console.error('❌ Şehir seçimi hatası:', error);
        alert('Şehir seçiminde hata oluştu');
      } finally {
        setLoadingSuggestions(false);
      }
    }
  }));

  // Otomatik arama fonksiyonu - parametre olarak searchData alabilir
  const handleAutoSearch = async (customSearchData = null) => {
    // Eğer parametre olarak data gelmişse onu kullan, yoksa state'deki data'yı kullan
    const currentSearchData = customSearchData || searchData;
    
    // Temel tarihler yoksa varsayılan tarihler ekle
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dayAfterTomorrow = new Date(today);
    dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);
    
    const checkInDate = currentSearchData.checkIn || tomorrow.toISOString().split('T')[0];
    const checkOutDate = currentSearchData.checkOut || dayAfterTomorrow.toISOString().split('T')[0];
    
    // Final search parametrelerini oluştur
    const searchParams = {
      ...currentSearchData,
      checkIn: checkInDate,
      checkOut: checkOutDate
    };
    
    // Tarihleri state'e de güncelle (eğer eksikse)
    if (!currentSearchData.checkIn || !currentSearchData.checkOut) {
      setSearchData(prev => ({
        ...prev,
        checkIn: checkInDate,
        checkOut: checkOutDate
      }));
    }
    
    // Validasyon
    if (!searchParams.destination) {
      console.log('❌ Destinasyon eksik, arama yapılamıyor');
      return;
    }

    setIsLoading(true);
    
    try {
      console.log('🚀 Otomatik arama başlatılıyor...');
      console.log('📝 Destinasyon:', searchParams.destinationName);
      console.log('🆔 Destinasyon ID:', searchParams.destination);
      console.log('📅 Tarih Aralığı:', `${checkInDate} → ${checkOutDate}`);
      
      const result = await hotelService.priceSearch(searchParams);
      
      if (result.header?.success) {
        console.log('✅ Arama başarılı, results sayfasına yönlendiriliyor...');
        
        // Results sayfasına search data ile birlikte navigate et
        navigate('/results', { 
          state: { 
            searchResults: result,
            searchData: searchParams
          } 
        });
      } else {
        console.log('❌ Arama başarısız:', result);
        alert('Bu bölgede otel bulunamadı');
      }
    } catch (error) {
      console.error('❌ Arama hatası:', error);
      alert('Arama sırasında hata oluştu');
    } finally {
      setIsLoading(false);
    }
  };

  // YENİ LOOKUP DATA ÇEKME EFFECT'İ
  useEffect(() => {
    const loadLookupData = async () => {
      setLoadingLookups(true);
      try {
        console.log('🔄 Lookup verileri yükleniyor...');
        
        const [currenciesData, nationalitiesData] = await Promise.all([
          hotelService.getCurrencies(),
          hotelService.getNationalities()
        ]);
        
        // Currencies mapping - sadece isim, icon yok
        const mappedCurrencies = currenciesData.map(curr => ({
          code: curr.code || curr.internationalCode,
          name: curr.name || curr.code || curr.internationalCode,
          fullName: curr.name
        }));
        
        // Nationalities mapping - backend format to frontend format  
        const mappedNationalities = nationalitiesData.map(nat => ({
          code: nat.threeLetterCode || nat.id,
          name: `${nat.name} (${nat.threeLetterCode || nat.id})`,
          fullName: nat.name,
          isdCode: nat.isdCode
        }));
        
        setCurrencies(mappedCurrencies);
        setNationalities(mappedNationalities);
        setFilteredCurrencies(mappedCurrencies);
        setFilteredNationalities(mappedNationalities);
        
        // İlk değerlerin display name'lerini set et
        const defaultCurrency = mappedCurrencies.find(c => c.code === 'EUR');
        const defaultNationality = mappedNationalities.find(n => n.code === 'TR');
        
        setCurrencySearch(defaultCurrency?.name || 'Euro');
        setNationalitySearch(defaultNationality?.name || 'Türkiye (TR)');
        
        console.log('✅ Lookup verileri yüklendi:');
        console.log('💱 Para birimleri:', mappedCurrencies.length);
        console.log('🌍 Uyrukluk:', mappedNationalities.length);
        
      } catch (error) {
        console.error('❌ Lookup verileri yüklenemedi:', error);
        
        // Fallback data - icon'sız temiz isimler
        const fallbackCurrencies = [
          { code: 'EUR', name: 'Euro', fullName: 'Euro' },
          { code: 'GBP', name: 'British Pound', fullName: 'British Pound' },
          { code: 'USD', name: 'US Dollar', fullName: 'US Dollar' },
          { code: 'TRY', name: 'Turkish Lira', fullName: 'Turkish Lira' }
        ];
        
        const fallbackNationalities = [
          { code: 'TR', name: 'Türkiye (TR)', fullName: 'Türkiye' },
          { code: 'DE', name: 'Almanya (DE)', fullName: 'Almanya' },
          { code: 'GB', name: 'İngiltere (GB)', fullName: 'İngiltere' },
          { code: 'US', name: 'Amerika (US)', fullName: 'Amerika' },
          { code: 'FR', name: 'Fransa (FR)', fullName: 'Fransa' }
        ];
        
        setCurrencies(fallbackCurrencies);
        setNationalities(fallbackNationalities);
        setFilteredCurrencies(fallbackCurrencies);
        setFilteredNationalities(fallbackNationalities);
        setCurrencySearch('Euro');
        setNationalitySearch('Türkiye (TR)');
      } finally {
        setLoadingLookups(false);
      }
    };

    loadLookupData();
  }, []);

  // Misafir özeti hesapla - sadece toplam
  const getGuestSummary = () => {
    const totalAdults = searchData.rooms.reduce((sum, room) => sum + room.adults, 0);
    const totalChildren = searchData.rooms.reduce((sum, room) => sum + room.children, 0);
    const totalGuests = totalAdults + totalChildren;
    const roomCount = searchData.rooms.length;
    
    return `${totalGuests} Misafir, ${roomCount} Oda`;
  };

  // Oda yönetimi fonksiyonları
  const addRoom = () => {
    setSearchData(prev => ({
      ...prev,
      rooms: [...prev.rooms, { adults: 2, children: 0, childAges: [] }]
    }));
  };

  const removeRoom = (roomIndex) => {
    if (searchData.rooms.length > 1) {
      setSearchData(prev => ({
        ...prev,
        rooms: prev.rooms.filter((_, index) => index !== roomIndex)
      }));
    }
  };

  // Yetişkin sayısı artır/azalt
  const updateAdults = (roomIndex, increment) => {
    setSearchData(prev => ({
      ...prev,
      rooms: prev.rooms.map((room, index) => {
        if (index === roomIndex) {
          const newAdults = room.adults + increment;
          return {
            ...room,
            adults: Math.max(1, Math.min(6, newAdults)) // 1-6 arası sınırlama
          };
        }
        return room;
      })
    }));
  };

  // Çocuk sayısı artır/azalt
  const updateChildren = (roomIndex, increment) => {
    setSearchData(prev => ({
      ...prev,
      rooms: prev.rooms.map((room, index) => {
        if (index === roomIndex) {
          const newChildren = room.children + increment;
          const finalChildren = Math.max(0, Math.min(4, newChildren)); // 0-4 arası sınırlama
          return {
            ...room,
            children: finalChildren,
            childAges: finalChildren > 0 ? Array(finalChildren).fill(0) : []
          };
        }
        return room;
      })
    }));
  };

  const updateChildAge = (roomIndex, childIndex, age) => {
    setSearchData(prev => ({
      ...prev,
      rooms: prev.rooms.map((room, index) => {
        if (index === roomIndex) {
          return {
            ...room,
            childAges: room.childAges.map((currentAge, i) => 
              i === childIndex ? parseInt(age) : currentAge
            )
          };
        }
        return room;
      })
    }));
  };

  // Destinasyon input değişikliği
  const handleDestinationInputChange = async (e) => {
    const value = e.target.value;
    
    setSearchData(prev => ({
      ...prev,
      destinationName: value,
      destination: '' // ID'yi temizle
    }));
    
    // Debounce - 300ms sonra API çağır
    if (suggestionTimeoutRef.current) {
      clearTimeout(suggestionTimeoutRef.current);
    }
    
    if (value.length >= 2) {
      setLoadingSuggestions(true);
      
      suggestionTimeoutRef.current = setTimeout(async () => {
        try {
          const result = await hotelService.getArrivalAutocomplete(value);
          
          if (result.header?.success && result.body?.items) {
            setSuggestions(result.body.items.slice(0, 5)); // Max 5 öneri
            setShowSuggestions(true);
          } else {
            setSuggestions([]);
            setShowSuggestions(false);
          }
        } catch (error) {
          console.error('Autocomplete error:', error);
          setSuggestions([]);
          setShowSuggestions(false);
        } finally {
          setLoadingSuggestions(false);
        }
      }, 300);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
      setLoadingSuggestions(false);
    }
  };

  // Öneri seçimi
  const selectDestination = (item) => {
    let destinationId, displayName;
    
    if (item.type === 1) {
      // Lokasyon seçimi
      destinationId = item.city?.id || item.giataInfo?.destinationId;
      const cityName = item.city?.name || 'Unknown';
      const countryName = item.country?.name || '';
      displayName = countryName ? `${cityName}, ${countryName}` : cityName;
    } else {
      // Otel seçimi
      destinationId = item.hotel?.id || item.giataInfo?.hotelId;
      const hotelName = item.hotel?.name || 'Unknown';
      const cityName = item.city?.name || '';
      displayName = `${hotelName} (${cityName})`;
    }
    
    setSearchData(prev => ({
      ...prev,
      destination: destinationId,
      destinationName: displayName
    }));
    
    setShowSuggestions(false);
    setSuggestions([]);
  };

  // Currency search filtering
  const handleCurrencySearch = (e) => {
    const value = e.target.value;
    setCurrencySearch(value);
    
    const filtered = currencies.filter(currency =>
      currency.name.toLowerCase().includes(value.toLowerCase()) ||
      currency.code.toLowerCase().includes(value.toLowerCase())
    );
    setFilteredCurrencies(filtered);
  };

  // Nationality search filtering
  const handleNationalitySearch = (e) => {
    const value = e.target.value;
    setNationalitySearch(value);
    
    const filtered = nationalities.filter(nationality =>
      nationality.name.toLowerCase().includes(value.toLowerCase()) ||
      nationality.code.toLowerCase().includes(value.toLowerCase())
    );
    setFilteredNationalities(filtered);
  };

  // Currency selection
  const selectCurrency = (currency) => {
    setSearchData(prev => ({
      ...prev,
      currency: currency.code
    }));
    setCurrencySearch(currency.name);
    setShowCurrencyDropdown(false);
  };

  // Nationality selection
  const selectNationality = (nationality) => {
    setSearchData(prev => ({
      ...prev,
      nationality: nationality.code
    }));
    setNationalitySearch(nationality.name);
    setShowNationalityDropdown(false);
  };

  // Dışarı tıklayınca dropdown'ları kapat
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (guestDropdownRef.current && !guestDropdownRef.current.contains(event.target)) {
        setShowGuestDropdown(false);
      }
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
      if (currencyDropdownRef.current && !currencyDropdownRef.current.contains(event.target)) {
        setShowCurrencyDropdown(false);
      }
      if (nationalityDropdownRef.current && !nationalityDropdownRef.current.contains(event.target)) {
        setShowNationalityDropdown(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Helper functions
  const getTodayDate = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = (today.getMonth() + 1).toString().padStart(2, '0');
    const day = today.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const getMinCheckOutDate = () => {
    if (!searchData.checkIn) return getTodayDate();
    
    const checkInDate = new Date(searchData.checkIn);
    checkInDate.setDate(checkInDate.getDate() + 1);
    
    const year = checkInDate.getFullYear();
    const month = (checkInDate.getMonth() + 1).toString().padStart(2, '0');
    const day = checkInDate.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // Tarih validasyonu
    if (name === 'checkIn') {
      const today = getTodayDate();
      if (value < today) {
        alert('Giriş tarihi bugünden önceki bir tarih olamaz');
        return;
      }
      
      // Eğer check-out tarihi check-in'den önceyse, check-out'u temizle
      if (searchData.checkOut && value >= searchData.checkOut) {
        setSearchData(prev => ({
          ...prev,
          [name]: value,
          checkOut: '' // Check-out'u temizle
        }));
        return;
      }
    }
    
    if (name === 'checkOut') {
      if (!searchData.checkIn) {
        alert('Önce giriş tarihini seçin');
        return;
      }
      
      if (value <= searchData.checkIn) {
        alert('Çıkış tarihi giriş tarihinden sonra olmalıdır');
        return;
      }
    }
    
    setSearchData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    
    // Validasyon
    if (!searchData.destination) {
      alert('Lütfen bir destinasyon seçin');
      return;
    }
    if (!searchData.checkIn || !searchData.checkOut) {
      alert('Lütfen check-in ve check-out tarihlerini seçin');
      return;
    }

    // Çocuk yaşları validasyonu
    for (let i = 0; i < searchData.rooms.length; i++) {
      const room = searchData.rooms[i];
      if (room.children > 0) {
        const hasInvalidAge = room.childAges.some(age => age === 0);
        if (hasInvalidAge) {
          alert(`${i + 1}. odadaki çocuk yaşlarını belirtiniz`);
          return;
        }
      }
    }

    setIsLoading(true);
    
    try {
      console.log('🚀 =================');
      console.log('🎯 ÇOK ODALI TEST BAŞLADI');
      console.log('📝 Seçilen Şehir:', searchData.destinationName);
      console.log('🆔 Şehir ID:', searchData.destination);
      console.log('📅 Tarih Aralığı:', `${searchData.checkIn} → ${searchData.checkOut}`);
      console.log('🏠 Oda Sayısı:', searchData.rooms.length);
      
      searchData.rooms.forEach((room, index) => {
        console.log(`  📍 Oda ${index + 1}: ${room.adults} yetişkin, ${room.children} çocuk`, 
                   room.children > 0 ? `(Yaşlar: ${room.childAges.join(', ')})` : '');
      });
      
      console.log('💰 Para Birimi:', searchData.currency);
      console.log('🌍 Uyruk:', searchData.nationality);
      
      const result = await hotelService.priceSearch(searchData);
      
      // Detaylı response analizi
      console.log('📥 =================');
      console.log('✅ API Response SUCCESS:', result.header?.success);
      
      if (result.header?.messages?.length > 0) {
        console.log('📢 API Messages:', result.header.messages);
      }
      
      if (result.body) {
        console.log('🏨 Toplam Otel Sayısı:', result.body.hotels?.length || 0);
        console.log('🔍 Search ID:', result.body.searchId);
        console.log('⏰ Expires On:', result.body.expiresOn);
        
        if (result.body.hotels?.length > 0) {
          console.log('🎯 İlk 3 Otel:');
          result.body.hotels.slice(0, 3).forEach((hotel, index) => {
            console.log(`  ${index + 1}. ${hotel.name} - ${hotel.location?.name} (${hotel.offers?.length || 0} teklif)`);
          });
          
          // Fiyat analizi
          const prices = result.body.hotels
            .filter(h => h.offers?.length > 0)
            .map(h => h.offers[0]?.price?.amount)
            .filter(p => p);
          
          if (prices.length > 0) {
            console.log('💰 Fiyat Aralığı:', `${Math.min(...prices)} - ${Math.max(...prices)} ${searchData.currency}`);
          }
          
          alert(`✅ BAŞARILI: ${result.body.hotels.length} otel bulundu!\n\n` +
                `📍 ${searchData.destinationName}\n` +
                `📅 ${searchData.checkIn} → ${searchData.checkOut}\n` +
                `🏠 ${searchData.rooms.length} oda\n\n` +
                `Console'u kontrol edin.`);
          
        } else {
          // Otel bulunamadı durumu
          console.log('❌ =================');
          console.log('⚠️ OTEL BULUNAMADI');
          console.log('🔍 Olası Sebepler:');
          console.log('   1. Seçilen tarihlerde müsait oda yok');
          console.log('   2. Bu şehirde otel yok');
          console.log('   3. Arama kriterleri çok spesifik');
          console.log('   4. API geçici sorunu');
          
          alert(`⚠️ OTEL BULUNAMADI\n\n` +
                `📍 ${searchData.destinationName}\n` +
                `📅 ${searchData.checkIn} → ${searchData.checkOut}\n` +
                `🏠 ${searchData.rooms.length} oda\n\n` +
                `💡 Farklı tarih deneyin veya console'u kontrol edin.`);
        }
      } else {
        console.log('❌ Response body null');
        alert('❌ API\'den veri gelmedi. Console\'u kontrol edin.');
      }
      
    } catch (error) {
      console.error('❌ =================');
      console.error('💥 API HATASI:', error);
      console.error('🔍 Hata Detayı:', error.message);
      alert('❌ Arama sırasında hata:\n' + error.message);
    } finally {
      setIsLoading(false);
      console.log('🏁 Test Tamamlandı');
      console.log('=================');
    }
  };

  // Çocuk satırı render fonksiyonu - özel tasarım
  const renderChildAges = (room, roomIndex) => {
    if (room.children === 0) return null;
    
    return (
      <div className="child-ages-row">
        <span className="child-ages-label">Çocuk Yaşları:</span>
        <div className="child-ages-selects">
          {room.childAges.map((age, childIndex) => (
            <select
              key={childIndex}
              className="age-select-small"
              value={age}
              onChange={(e) => updateChildAge(roomIndex, childIndex, e.target.value)}
              style={{
                padding: '8px 10px',
                fontSize: '13px',
                fontWeight: '500',
                color: '#333',
                backgroundColor: 'white',
                border: '2px solid #0a825a',
                borderRadius: '6px',
                minWidth: '80px',
                appearance: 'none',
                backgroundImage: "url(\"data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%23374151' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e\")",
                backgroundPosition: 'right 8px center',
                backgroundRepeat: 'no-repeat',
                backgroundSize: '12px',
                paddingRight: '30px'
              }}
            >
              <option 
                value={0}
                style={{
                  padding: '6px 10px',
                  backgroundColor: 'white',
                  color: '#666',
                  fontSize: '13px'
                }}
              >
                Yaş Seçin
              </option>
              {[...Array(18)].map((_, i) => (
                <option 
                  key={i + 1} 
                  value={i + 1}
                  style={{
                    padding: '6px 10px',
                    backgroundColor: 'white',
                    color: '#333',
                    fontSize: '13px'
                  }}
                >
                  {i + 1} yaş
                </option>
              ))}
            </select>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="booking-search">
      <form onSubmit={handleSearch}>
        <div className="search-bar">
          {/* Destinasyon */}
          <div className="search-field destination-field" ref={dropdownRef}>
            <label>Nereye</label>
            <input
              type="text"
              value={searchData.destinationName}
              onChange={handleDestinationInputChange}
              placeholder="Şehir ara... (Antalya, İstanbul, Ankara)"
            />
            {/* Autocomplete dropdown */}
            {loadingSuggestions && (
              <div className="autocomplete-loading">Aranıyor...</div>
            )}
            {showSuggestions && suggestions.length > 0 && (
              <div className="autocomplete-dropdown">
                {suggestions.map((item, index) => (
                  <div
                    key={index}
                    className="autocomplete-item"
                    onClick={() => selectDestination(item)}
                  >
                    {item.type === 1 ? (
                      // Lokasyon (type: 1)
                      <span>
                        📍 {item.city?.name || item.giataInfo?.destinationId}, {item.country?.name}
                      </span>
                    ) : (
                      // Otel (type: 2)
                      <span>
                        🏨 {item.hotel?.name} 
                        <small style={{color: '#666', marginLeft: '8px'}}>
                          {item.city?.name}, {item.country?.name}
                        </small>
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Giriş Tarihi */}
          <div className="search-field date-field">
            <label>Giriş</label>
            <input
              type="date"
              name="checkIn"
              value={searchData.checkIn}
              onChange={handleInputChange}
              min={getTodayDate()} // Bugünden önceki tarihleri engellle
            />
          </div>

          {/* Çıkış Tarihi */}
          <div className="search-field date-field">
            <label>Çıkış</label>
            <input
              type="date"
              name="checkOut"
              value={searchData.checkOut}
              onChange={handleInputChange}
              min={getMinCheckOutDate()} // Check-in tarihinden sonra olmalı
            />
          </div>

          {/* Misafirler - Özet Button */}
          <div className="search-field guest-field" ref={guestDropdownRef}>
            <label>Misafirler</label>
            <div 
              className="guest-selector"
              onClick={() => setShowGuestDropdown(!showGuestDropdown)}
            >
              <span>{getGuestSummary()}</span>
              <span className="dropdown-arrow">▼</span>
            </div>

            {/* Guest Dropdown */}
            {showGuestDropdown && (
              <div className="guest-dropdown">
                <div className="guest-dropdown-header">
                  <h3>Misafirler</h3>
                </div>

                <div className="rooms-list">
                  {searchData.rooms.map((room, roomIndex) => (
                    <div key={roomIndex} className="room-item">
                      {searchData.rooms.length > 1 && (
                        <div className="room-header">
                          <div className="room-title">{roomIndex + 1}. Oda</div>
                          <button
                            type="button"
                            className="remove-room-link"
                            onClick={() => removeRoom(roomIndex)}
                          >
                            Odayı Kaldır
                          </button>
                        </div>
                      )}

                      <div className="guest-row">
                        <div className="guest-label">
                          <strong>Yetişkin</strong>
                          <small>18 yaş ve üzeri</small>
                        </div>
                        <div className="guest-counter">
                          <button
                            type="button"
                            className="counter-btn"
                            onClick={() => updateAdults(roomIndex, -1)}
                            disabled={room.adults <= 1}
                          >
                            -
                          </button>
                          <span className="counter-num">{room.adults}</span>
                          <button
                            type="button"
                            className="counter-btn"
                            onClick={() => updateAdults(roomIndex, 1)}
                            disabled={room.adults >= 6}
                          >
                            +
                          </button>
                        </div>
                      </div>

                      <div className="guest-row">
                        <div className="guest-label">
                          <strong>Çocuk</strong>
                          <small>0-17 yaş</small>
                        </div>
                        <div className="guest-counter">
                          <button
                            type="button"
                            className="counter-btn"
                            onClick={() => updateChildren(roomIndex, -1)}
                            disabled={room.children <= 0}
                          >
                            -
                          </button>
                          <span className="counter-num">{room.children}</span>
                          <button
                            type="button"
                            className="counter-btn"
                            onClick={() => updateChildren(roomIndex, 1)}
                            disabled={room.children >= 4}
                          >
                            +
                          </button>
                        </div>
                      </div>

                      {renderChildAges(room, roomIndex)}
                    </div>
                  ))}
                </div>

                <div className="add-room-section">
                  <button
                    type="button"
                    className="add-room-link"
                    onClick={addRoom}
                    disabled={searchData.rooms.length >= 4}
                  >
                    Yeni Oda Ekle
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Ara Butonu */}
          <button 
            type="submit" 
            className="search-button"
            disabled={isLoading || !searchData.destination || !searchData.checkIn || !searchData.checkOut}
          >
            {isLoading ? 'Aranıyor...' : 'Ara'}
          </button>
        </div>

        {/* Advanced Options */}
        <button
          type="button"
          className="advanced-toggle"
          onClick={() => setShowAdvanced(!showAdvanced)}
        >
          Gelişmiş Seçenekler {showAdvanced ? '▲' : '▼'}
        </button>

        {showAdvanced && (
          <div className="advanced-options">
            <div className="advanced-grid">
              {/* SEARCHABLE CURRENCY DROPDOWN */}
              <div>
                <label>Para Birimi</label>
                <div className="searchable-dropdown" ref={currencyDropdownRef}>
                  <input
                    type="text"
                    value={currencySearch}
                    onChange={handleCurrencySearch}
                    onFocus={() => setShowCurrencyDropdown(true)}
                    placeholder={loadingLookups ? "Yükleniyor..." : "Para birimi ara..."}
                    disabled={loadingLookups}
                    style={{
                      padding: '12px',
                      fontSize: '14px',
                      fontWeight: '500',
                      color: loadingLookups ? '#999' : '#333',
                      backgroundColor: loadingLookups ? '#f5f5f5' : 'white',
                      border: '2px solid #0a825a',
                      borderRadius: '6px',
                      width: '100%',
                      cursor: loadingLookups ? 'not-allowed' : 'text'
                    }}
                  />
                  {showCurrencyDropdown && !loadingLookups && (
                    <div className="dropdown-list" style={{
                      position: 'absolute',
                      top: '100%',
                      left: 0,
                      right: 0,
                      backgroundColor: 'white',
                      border: '2px solid #0a825a',
                      borderTop: 'none',
                      borderRadius: '0 0 6px 6px',
                      maxHeight: '200px',
                      overflowY: 'auto',
                      zIndex: 1000,
                      boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
                    }}>
                      {filteredCurrencies.length > 0 ? (
                        filteredCurrencies.map((currency) => (
                          <div
                            key={currency.code}
                            className="dropdown-item"
                            onClick={() => selectCurrency(currency)}
                            style={{
                              padding: '10px 12px',
                              cursor: 'pointer',
                              borderBottom: '1px solid #f0f0f0',
                              fontSize: '14px',
                              transition: 'background-color 0.2s'
                            }}
                            onMouseEnter={(e) => e.target.style.backgroundColor = '#f8f9fa'}
                            onMouseLeave={(e) => e.target.style.backgroundColor = 'white'}
                          >
                            <strong>{currency.name}</strong>
                            <small style={{ color: '#666', marginLeft: '8px' }}>({currency.code})</small>
                          </div>
                        ))
                      ) : (
                        <div style={{ padding: '10px 12px', color: '#999', fontSize: '14px' }}>
                          Sonuç bulunamadı
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* SEARCHABLE NATIONALITY DROPDOWN */}
              <div>
                <label>Uyruk</label>
                <div className="searchable-dropdown" ref={nationalityDropdownRef}>
                  <input
                    type="text"
                    value={nationalitySearch}
                    onChange={handleNationalitySearch}
                    onFocus={() => setShowNationalityDropdown(true)}
                    placeholder={loadingLookups ? "Yükleniyor..." : "Ülke ara..."}
                    disabled={loadingLookups}
                    style={{
                      padding: '12px',
                      fontSize: '14px',
                      fontWeight: '500',
                      color: loadingLookups ? '#999' : '#333',
                      backgroundColor: loadingLookups ? '#f5f5f5' : 'white',
                      border: '2px solid #0a825a',
                      borderRadius: '6px',
                      width: '100%',
                      cursor: loadingLookups ? 'not-allowed' : 'text'
                    }}
                  />
                  {showNationalityDropdown && !loadingLookups && (
                    <div className="dropdown-list" style={{
                      position: 'absolute',
                      top: '100%',
                      left: 0,
                      right: 0,
                      backgroundColor: 'white',
                      border: '2px solid #0a825a',
                      borderTop: 'none',
                      borderRadius: '0 0 6px 6px',
                      maxHeight: '200px',
                      overflowY: 'auto',
                      zIndex: 1000,
                      boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
                    }}>
                      {filteredNationalities.length > 0 ? (
                        filteredNationalities.map((nationality) => (
                          <div
                            key={nationality.code}
                            className="dropdown-item"
                            onClick={() => selectNationality(nationality)}
                            style={{
                              padding: '10px 12px',
                              cursor: 'pointer',
                              borderBottom: '1px solid #f0f0f0',
                              fontSize: '14px',
                              transition: 'background-color 0.2s'
                            }}
                            onMouseEnter={(e) => e.target.style.backgroundColor = '#f8f9fa'}
                            onMouseLeave={(e) => e.target.style.backgroundColor = 'white'}
                          >
                            {nationality.name}
                          </div>
                        ))
                      ) : (
                        <div style={{ padding: '10px 12px', color: '#999', fontSize: '14px' }}>
                          Sonuç bulunamadı
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </form>
    </div>
  );
});

// Component display name for debugging
SearchForm.displayName = 'SearchForm';

export default SearchForm;