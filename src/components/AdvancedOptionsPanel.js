import React, { useState, useEffect, useRef } from 'react';
import hotelService from '../services/hotelService';

const AdvancedOptionsPanel = ({ currency, nationality, onChange, disabled }) => {
  const [currencies, setCurrencies] = useState([]);
  const [nationalities, setNationalities] = useState([]);
  const [loadingLookups, setLoadingLookups] = useState(true);
  
  const [currencySearch, setCurrencySearch] = useState('');
  const [nationalitySearch, setNationalitySearch] = useState('');
  const [showCurrencyDropdown, setShowCurrencyDropdown] = useState(false);
  const [showNationalityDropdown, setShowNationalityDropdown] = useState(false);
  const [filteredCurrencies, setFilteredCurrencies] = useState([]);
  const [filteredNationalities, setFilteredNationalities] = useState([]);
  
  const currencyDropdownRef = useRef(null);
  const nationalityDropdownRef = useRef(null);

  // Lookup data çekme
  useEffect(() => {
    const loadLookupData = async () => {
      setLoadingLookups(true);
      try {
        console.log('🔄 Lookup verileri yükleniyor...');
        
        const [currenciesData, nationalitiesData] = await Promise.all([
          hotelService.getCurrencies(),
          hotelService.getNationalities()
        ]);
        
        const mappedCurrencies = currenciesData.map(curr => ({
          code: curr.code || curr.internationalCode,
          name: curr.name || curr.code || curr.internationalCode,
          fullName: curr.name
        }));
        
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
        
        const defaultCurrency = mappedCurrencies.find(c => c.code === 'EUR');
        const defaultNationality = mappedNationalities.find(n => n.code === 'TR');
        
        setCurrencySearch(defaultCurrency?.name || 'Euro');
        setNationalitySearch(defaultNationality?.name || 'Türkiye (TR)');
        
        console.log('✅ Lookup verileri yüklendi');
        
      } catch (error) {
        console.error('❌ Lookup verileri yüklenemedi:', error);
        
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

  const handleCurrencySearch = (e) => {
    const value = e.target.value;
    setCurrencySearch(value);
    
    const filtered = currencies.filter(currency =>
      currency.name.toLowerCase().includes(value.toLowerCase()) ||
      currency.code.toLowerCase().includes(value.toLowerCase())
    );
    setFilteredCurrencies(filtered);
  };

  const handleNationalitySearch = (e) => {
    const value = e.target.value;
    setNationalitySearch(value);
    
    const filtered = nationalities.filter(nationality =>
      nationality.name.toLowerCase().includes(value.toLowerCase()) ||
      nationality.code.toLowerCase().includes(value.toLowerCase())
    );
    setFilteredNationalities(filtered);
  };

  const selectCurrency = (currency) => {
    onChange({ currency: currency.code });
    setCurrencySearch(currency.name);
    setShowCurrencyDropdown(false);
  };

  const selectNationality = (nationality) => {
    onChange({ nationality: nationality.code });
    setNationalitySearch(nationality.name);
    setShowNationalityDropdown(false);
  };

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (event) => {
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

  return (
    <div className="advanced-options">
      <div className="advanced-grid">
        {/* Currency Dropdown */}
        <div>
          <label>Para Birimi</label>
          <div className="searchable-dropdown" ref={currencyDropdownRef}>
            <input
              type="text"
              value={currencySearch}
              onChange={handleCurrencySearch}
              onFocus={() => setShowCurrencyDropdown(true)}
              placeholder={loadingLookups ? "Yükleniyor..." : "Para birimi ara..."}
              disabled={loadingLookups || disabled}
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

        {/* Nationality Dropdown */}
        <div>
          <label>Uyruk</label>
          <div className="searchable-dropdown" ref={nationalityDropdownRef}>
            <input
              type="text"
              value={nationalitySearch}
              onChange={handleNationalitySearch}
              onFocus={() => setShowNationalityDropdown(true)}
              placeholder={loadingLookups ? "Yükleniyor..." : "Ülke ara..."}
              disabled={loadingLookups || disabled}
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
  );
};

export default AdvancedOptionsPanel;