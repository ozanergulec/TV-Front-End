import React, { useRef } from 'react';
import SearchForm from '../components/search/SearchForm';
import PopularDestinations from '../components/search/PopularDestinations';

function SearchPage() {
  const searchFormRef = useRef(null);

  const handleDestinationSelect = async (destination) => {
    console.log(' Popüler destinasyon seçildi:', destination);
    
    // SearchForm'daki method'u çağır - shouldNavigate = true (varsayılan)
    if (searchFormRef.current && searchFormRef.current.setDestinationFromCity) {
      await searchFormRef.current.setDestinationFromCity(destination, true);
    }
  };

  return (
    <div className="search-page">
      <div className="search-hero">
        <h1 className="search-title">Hayalinizdeki Oteli Bulun</h1>
        <p className="search-subtitle">Binlerce otel arasından size en uygun olanı seçin</p>
      </div>
      
      <div className="search-container">
        <SearchForm ref={searchFormRef} />
      </div>

      <PopularDestinations onDestinationSelect={handleDestinationSelect} />
    </div>
  );
}

export default SearchPage;