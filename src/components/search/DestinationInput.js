import React, { useState, useRef, useEffect } from 'react';
import hotelService from '../../services/hotelService';

const DestinationInput = ({ value, displayValue, onChange, disabled }) => {
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const suggestionTimeoutRef = useRef(null);
  const dropdownRef = useRef(null);

  const handleInputChange = async (e) => {
    const inputValue = e.target.value;
    
    onChange({
      destination: '',
      destinationName: inputValue
    });
    
    // Debounce - 300ms sonra API çağır
    if (suggestionTimeoutRef.current) {
      clearTimeout(suggestionTimeoutRef.current);
    }
    
    if (inputValue.length >= 2) {
      setLoadingSuggestions(true);
      
      suggestionTimeoutRef.current = setTimeout(async () => {
        try {
          const result = await hotelService.getArrivalAutocomplete(inputValue);
          
          if (result.header?.success && result.body?.items) {
            setSuggestions(result.body.items.slice(0, 5));
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

  const selectDestination = (item) => {
    let destinationId, displayName;
    
    if (item.type === 1) {
      destinationId = item.city?.id || item.giataInfo?.destinationId;
      const cityName = item.city?.name || 'Unknown';
      const countryName = item.country?.name || '';
      displayName = countryName ? `${cityName}, ${countryName}` : cityName;
    } else {
      destinationId = item.hotel?.id || item.giataInfo?.hotelId;
      const hotelName = item.hotel?.name || 'Unknown';
      const cityName = item.city?.name || '';
      displayName = `${hotelName} (${cityName})`;
    }
    
    onChange({
      destination: destinationId,
      destinationName: displayName
    });
    
    setShowSuggestions(false);
    setSuggestions([]);
  };

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="search-field destination-field" ref={dropdownRef}>
      <label>Nereye</label>
      <input
        type="text"
        value={displayValue}
        onChange={handleInputChange}
        placeholder="Şehir ara... (Antalya, İstanbul, Ankara)"
        disabled={disabled}
      />
      
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
                <span>
                  📍 {item.city?.name || item.giataInfo?.destinationId}, {item.country?.name}
                </span>
              ) : (
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
  );
};

export default DestinationInput;