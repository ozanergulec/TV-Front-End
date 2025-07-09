import React, { useState, useEffect, useRef } from 'react';
import hotelService from '../services/hotelService';

function SearchForm() {
  const [searchData, setSearchData] = useState({
    destination: '',
    destinationName: '', // Görüntülenecek isim
    checkIn: '',
    checkOut: '',
    currency: 'EUR',
    nationality: 'TR',
    adults: 2,
    children: 0,
    childAges: []
  });

  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Autocomplete states
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  
  const suggestionTimeoutRef = useRef(null);
  const dropdownRef = useRef(null);

  const currencies = [
    { code: 'EUR', name: '€' },
    { code: 'GBP', name: '£' },
    { code: 'USD', name: '$' },
    { code: 'TRY', name: '₺' }
  ];

  const countries = [
    { code: 'TR', name: 'TR' },
    { code: 'DE', name: 'DE' },
    { code: 'GB', name: 'GB' },
    { code: 'US', name: 'US' },
    { code: 'FR', name: 'FR' }
  ];

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
    const cityName = item.city?.name || item.giataInfo?.destinationId || 'Unknown';
    const countryName = item.country?.name || '';
    const displayName = countryName ? `${cityName}, ${countryName}` : cityName;
    
    setSearchData(prev => ({
      ...prev,
      destination: item.city?.id || item.giataInfo?.destinationId,
      destinationName: displayName
    }));
    
    setShowSuggestions(false);
    setSuggestions([]);
  };

  // Dışarı tıklayınca dropdown'ı kapat
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setSearchData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleChildrenChange = (count) => {
    setSearchData(prev => ({
      ...prev,
      children: count,
      childAges: count > 0 ? Array(count).fill(0) : []
    }));
  };

  const handleChildAgeChange = (index, age) => {
    setSearchData(prev => ({
      ...prev,
      childAges: prev.childAges.map((currentAge, i) => 
        i === index ? parseInt(age) : currentAge
      )
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

    setIsLoading(true);
    
    try {
      console.log('🚀 =================');
      console.log('🎯 TEST BAŞLADI');
      console.log('📝 Seçilen Şehir:', searchData.destinationName);
      console.log('🆔 Şehir ID:', searchData.destination);
      console.log('📅 Tarih Aralığı:', `${searchData.checkIn} → ${searchData.checkOut}`);
      console.log('👥 Misafir:', `${searchData.adults} yetişkin, ${searchData.children} çocuk`);
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
                `📅 ${searchData.checkIn} → ${searchData.checkOut}\n\n` +
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
                `📅 ${searchData.checkIn} → ${searchData.checkOut}\n\n` +
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

  return (
    <div className="compact-search-container">
      <form className="compact-search-form" onSubmit={handleSearch}>
        
        {/* Main Search Row */}
        <div className="search-main-row">
          {/* Destinasyon Input + Dropdown */}
          <div className="input-group destination-group" ref={dropdownRef}>
            <div className="destination-input-wrapper">
              <input
                type="text"
                value={searchData.destinationName}
                onChange={handleDestinationInputChange}
                placeholder="Şehir ara... (Antalya, İstanbul, Ankara)"
                className="compact-input"
                disabled={isLoading}
                autoComplete="off"
              />
              
              {/* Loading spinner */}
              {loadingSuggestions && (
                <div className="suggestion-loading">Aranıyor...</div>
              )}
              
              {/* Dropdown suggestions */}
              {showSuggestions && suggestions.length > 0 && (
                <div className="suggestions-dropdown">
                  {suggestions.map((item, index) => (
                    <div 
                      key={index}
                      className="suggestion-item"
                      onClick={() => selectDestination(item)}
                    >
                      <div className="suggestion-main">
                        <span className="city-name">
                          {item.city?.name || 'Unknown City'}
                        </span>
                        <span className="country-name">
                          , {item.country?.name || 'Unknown Country'}
                        </span>
                      </div>
                      {item.state?.name && (
                        <div className="suggestion-sub">
                          {item.state.name}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="input-group date-group">
            <input
              type="date"
              name="checkIn"
              value={searchData.checkIn}
              onChange={handleInputChange}
              className="compact-input date-input"
              required
              disabled={isLoading}
            />
          </div>

          <div className="input-group date-group">
            <input
              type="date"
              name="checkOut"
              value={searchData.checkOut}
              onChange={handleInputChange}
              className="compact-input date-input"
              required
              disabled={isLoading}
            />
          </div>

          <div className="input-group guest-group">
            <select
              name="adults"
              value={searchData.adults}
              onChange={handleInputChange}
              className="compact-select"
              disabled={isLoading}
            >
              {[1,2,3,4,5,6].map(num => (
                <option key={num} value={num}>{num} Yetişkin</option>
              ))}
            </select>
          </div>

          <div className="input-group guest-group">
            <select
              value={searchData.children}
              onChange={(e) => handleChildrenChange(parseInt(e.target.value))}
              className="compact-select"
              disabled={isLoading}
            >
              {[0,1,2,3,4].map(num => (
                <option key={num} value={num}>
                  {num === 0 ? 'Çocuk Yok' : `${num} Çocuk`}
                </option>
              ))}
            </select>
          </div>

          <button 
            type="submit" 
            className="compact-search-btn"
            disabled={isLoading}
          >
            {isLoading ? 'Aranıyor...' : 'Ara'}
          </button>
        </div>

        {/* Child Ages - Ana formda */}
        {searchData.children > 0 && (
          <div className="child-ages-main">
            <label className="child-ages-label">👶 Çocuk Yaşları:</label>
            <div className="child-ages-row">
              {searchData.childAges.map((age, index) => (
                <select
                  key={index}
                  value={age}
                  onChange={(e) => handleChildAgeChange(index, e.target.value)}
                  className="age-select-main"
                  disabled={isLoading}
                >
                  <option value={0}>Yaş Seçin</option>
                  {Array.from({length: 17}, (_, i) => i + 1).map(childAge => (
                    <option key={childAge} value={childAge}>
                      {childAge} yaş
                    </option>
                  ))}
                </select>
              ))}
            </div>
          </div>
        )}

        {/* Advanced Options Toggle */}
        <div className="advanced-toggle">
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="toggle-btn"
            disabled={isLoading}
          >
            {showAdvanced ? '▲ Gelişmiş Seçenekleri Gizle' : '▼ Gelişmiş Seçenekler'}
          </button>
        </div>

        {/* Advanced Options */}
        {showAdvanced && (
          <div className="advanced-options">
            <div className="advanced-row">
              <div className="input-group-small">
                <label>Para Birimi</label>
                <select
                  name="currency"
                  value={searchData.currency}
                  onChange={handleInputChange}
                  className="compact-select-small"
                  disabled={isLoading}
                >
                  {currencies.map(currency => (
                    <option key={currency.code} value={currency.code}>
                      {currency.name} {currency.code}
                    </option>
                  ))}
                </select>
              </div>

              <div className="input-group-small">
                <label>Uyruk</label>
                <select
                  name="nationality"
                  value={searchData.nationality}
                  onChange={handleInputChange}
                  className="compact-select-small"
                  disabled={isLoading}
                >
                  {countries.map(country => (
                    <option key={country.code} value={country.code}>
                      {country.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}

      </form>
    </div>
  );
}

export default SearchForm;