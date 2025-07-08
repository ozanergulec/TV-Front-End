import React, { useRef } from 'react';
import SearchForm from '../components/SearchForm';
import PopularDestinations from '../components/PopularDestinations';

function SearchPage() {
  const searchFormRef = useRef(null);

  const handleDestinationSelect = (destination) => {
    // İlerde SearchForm'daki input'u otomatik dolduracak
    console.log('Seçilen destinasyon:', destination);
    
    // Sayfayı SearchForm'a scroll et
    if (searchFormRef.current) {
      searchFormRef.current.scrollIntoView({ 
        behavior: 'smooth',
        block: 'center'
      });
    }
    
    // TODO: SearchForm'daki destination input'una değeri set et
    // Bu kısmı backend hazır olunca geliştireceğiz
  };

  return (
    <div className="search-page">
      <div className="search-hero">
        <h1 className="search-title">Hayalinizdeki Oteli Bulun</h1>
        <p className="search-subtitle">Binlerce otel arasından size en uygun olanı seçin</p>
      </div>
      
      <div className="search-container" ref={searchFormRef}>
        <SearchForm />
      </div>

      <PopularDestinations onDestinationSelect={handleDestinationSelect} />
    </div>
  );
}

export default SearchPage;