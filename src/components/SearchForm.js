import React, { useState } from 'react';

function SearchForm() {
  const [searchData, setSearchData] = useState({
    destination: '',
    checkIn: '',
    checkOut: '',
    currency: 'EUR',
    nationality: 'TR',
    adults: 2,
    children: 0,
    childAges: []
  });

  const [showAdvanced, setShowAdvanced] = useState(false);

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

  const handleSearch = (e) => {
    e.preventDefault();
    console.log('Arama Verileri:', searchData);
  };

  return (
    <div className="compact-search-container">
      <form className="compact-search-form" onSubmit={handleSearch}>
        
        {/* Main Search Row */}
        <div className="search-main-row">
          <div className="input-group destination-group">
            <input
              type="text"
              name="destination"
              value={searchData.destination}
              onChange={handleInputChange}
              placeholder="Destinasyon ara..."
              className="compact-input"
            />
          </div>

          <div className="input-group date-group">
            <input
              type="date"
              name="checkIn"
              value={searchData.checkIn}
              onChange={handleInputChange}
              className="compact-input date-input"
              required
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
            />
          </div>

          <div className="input-group guest-group">
            <select
              name="adults"
              value={searchData.adults}
              onChange={handleInputChange}
              className="compact-select"
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
            >
              {[0,1,2,3,4].map(num => (
                <option key={num} value={num}>
                  {num === 0 ? 'Çocuk Yok' : `${num} Çocuk`}
                </option>
              ))}
            </select>
          </div>

          <button type="submit" className="compact-search-btn">
            Ara
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