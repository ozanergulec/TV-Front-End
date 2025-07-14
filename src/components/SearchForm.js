import React, { useState, useEffect, useImperativeHandle, forwardRef } from 'react';
import { useNavigate } from 'react-router-dom';
import DestinationInput from './DestinationInput';
import DateRangeSelector from './DateRangeSelector';
import GuestRoomSelector from './GuestRoomSelector';
import AdvancedOptionsPanel from './AdvancedOptionsPanel';
import hotelService from '../services/hotelService';
import '../components.css';

const SearchForm = forwardRef((props, ref) => {
  const { onSearchComplete, initialData, externalLoading = false } = props;
  const navigate = useNavigate();
  
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
      // Implementation...
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
    
    if (externalLoading || isLoading) return;
    
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
    
    console.log('🔍 Arama başlatılıyor...', searchData);
    
    if (onSearchComplete) {
      onSearchComplete(searchData);
    } else {
      navigate('/results', { 
        state: { 
          searchData: searchData,
          isLoading: true 
        } 
      });
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