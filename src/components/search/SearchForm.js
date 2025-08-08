import React, { useState, useEffect, useImperativeHandle, forwardRef, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import DestinationInput from './DestinationInput';
import DateRangeSelector from './DateRangeSelector';
import GuestRoomSelector from './GuestRoomSelector';
import AdvancedOptionsPanel from './AdvancedOptionsPanel';
import hotelService from '../../services/hotelService';
import '../../components.css';

const SearchForm = forwardRef((props, ref) => {
  const { onSearchComplete, initialData, externalLoading = false } = props;
  const navigate = useNavigate();
  const searchInProgressRef = useRef(false); // Duplicate search kontrolü
  
  const [searchData, setSearchData] = useState(initialData || {
    destination: '',
    destinationName: '',
    checkIn: '',
    checkOut: '',
    currency: 'EUR',
    nationality: 'TR',
    rooms: [{ adults: 2, children: 0, childAges: [] }]
  });

  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Parent component'a expose edilecek methodlar
  useImperativeHandle(ref, () => ({
    setDestinationFromCity: async (cityName, shouldNavigate = true) => {
      try {
        setIsLoading(true);
        console.log(' Şehir adından destination bulunuyor:', cityName);
        
        const result = await hotelService.getArrivalAutocomplete(cityName);
        
        if (result.header?.success && result.body?.items && result.body.items.length > 0) {
          const cityItem = result.body.items.find(item => item.type === 1);
          
          if (cityItem) {
            const destinationId = cityItem.city?.id || cityItem.giataInfo?.destinationId;
            const cityDisplayName = cityItem.city?.name || cityName;
            const countryName = cityItem.country?.name || '';
            const displayName = countryName ? `${cityDisplayName}, ${countryName}` : cityDisplayName;
            
            setSearchData(prev => ({
              ...prev,
              destination: destinationId,
              destinationName: displayName
            }));
            
            console.log(' Destination bulundu:', { destinationId, displayName });
            
            if (shouldNavigate) {
              const today = new Date();
              const tomorrow = new Date(today);
              tomorrow.setDate(tomorrow.getDate() + 1);
              const dayAfterTomorrow = new Date(today);
              dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);
              
              const updatedSearchData = {
                ...searchData,
                destination: destinationId,
                destinationName: displayName,
                checkIn: tomorrow.toISOString().split('T')[0],
                checkOut: dayAfterTomorrow.toISOString().split('T')[0]
              };
              
              console.log(' Otomatik arama başlatılıyor...', updatedSearchData);
              
              navigate('/results', { 
                state: { 
                  searchData: updatedSearchData,
                  isLoading: true 
                } 
              });
            }
          } else {
            console.error(' Şehir bulunamadı:', cityName);
            alert('Seçilen şehir bulunamadı');
          }
        } else {
          console.error(' Şehir arama sonucu bulunamadı:', cityName);
          alert('Seçilen şehir bulunamadı');
        }
      } catch (error) {
        console.error(' Şehir arama hatası:', error);
        alert('Şehir arama sırasında bir hata oluştu');
      } finally {
        setIsLoading(false);
      }
    }
  }));

  const handleDestinationChange = (destinationData) => {
    setSearchData(prev => ({
      ...prev,
      ...destinationData
    }));
  };

  const handleDateChange = (dateData) => {
    setSearchData(prev => ({
      ...prev,
      ...dateData
    }));
  };

  const handleRoomsChange = (rooms) => {
    setSearchData(prev => ({
      ...prev,
      rooms
    }));
  };

  const handleAdvancedChange = (advancedData) => {
    setSearchData(prev => ({
      ...prev,
      ...advancedData
    }));
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    
    if (externalLoading || isLoading || searchInProgressRef.current) {
      console.log('🚫 Arama zaten devam ediyor, duplicate request engellendi');
      return;
    }
    
    // Validation
    if (!searchData.destination) {
      alert('Lütfen bir destinasyon seçin');
      return;
    }
    
    if (!searchData.checkIn || !searchData.checkOut) {
      alert('Lütfen giriş ve çıkış tarihlerini seçin');
      return;
    }

    // Child age validation
    for (let room of searchData.rooms) {
      if (room.children > 0) {
        const invalidAges = room.childAges.filter(age => age === 0 || age === '');
        if (invalidAges.length > 0) {
          alert('Lütfen tüm çocukların yaşlarını seçin');
          return;
        }
      }
    }
    
    searchInProgressRef.current = true;
    console.log('🔍 Arama başlatılıyor...', searchData);
    
    try {
      if (onSearchComplete) {
        await onSearchComplete(searchData);
      } else {
        navigate('/results', { 
          state: { 
            searchData: searchData,
            isLoading: true 
          } 
        });
      }
    } finally {
      searchInProgressRef.current = false;
    }
  };

  const isFormLoading = isLoading || externalLoading;

  return (
    <div className="booking-search">
      <form onSubmit={handleSearch}>
        <div className="search-bar">
          <DestinationInput
            value={searchData.destination}
            displayValue={searchData.destinationName}
            onChange={handleDestinationChange}
            disabled={isFormLoading}
          />
          
          <DateRangeSelector
            checkIn={searchData.checkIn}
            checkOut={searchData.checkOut}
            onChange={handleDateChange}
            disabled={isFormLoading}
          />
          
          <GuestRoomSelector
            rooms={searchData.rooms}
            onChange={handleRoomsChange}
            disabled={isFormLoading}
          />

          <button 
            type="submit" 
            className="search-button"
            disabled={isFormLoading || !searchData.destination || !searchData.checkIn || !searchData.checkOut}
          >
            {isFormLoading ? 'Aranıyor...' : 'Ara'}
          </button>
        </div>

        <button
          type="button"
          className="advanced-toggle"
          onClick={() => setShowAdvanced(!showAdvanced)}
        >
          Gelişmiş Seçenekler {showAdvanced ? '▲' : '▼'}
        </button>

        {showAdvanced && (
          <AdvancedOptionsPanel
            currency={searchData.currency}
            nationality={searchData.nationality}
            onChange={handleAdvancedChange}
            disabled={isFormLoading}
          />
        )}
      </form>
    </div>
  );
});

export default SearchForm;