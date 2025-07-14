import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import HotelCard from '../components/HotelCard';
import SearchForm from '../components/SearchForm';
import HotelResultsFilters from '../components/HotelResultsFilters';
import hotelService from '../services/hotelService';
import '../pages.css';

function ResultsPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const searchFormRef = useRef(null);
  
  // URL state'inden data al
  const [searchResults, setSearchResults] = useState(location.state?.searchResults);
  const [searchData, setSearchData] = useState(location.state?.searchData);
  
  // Component states
  const [hotels, setHotels] = useState([]);
  const [filteredHotels, setFilteredHotels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('recommended');
  const [priceRange, setPriceRange] = useState({ min: 0, max: 2000 });
  const [selectedRating, setSelectedRating] = useState(0);
  const [showFilters, setShowFilters] = useState(false);

  // Yeni arama yapıldığında çağrılacak fonksiyon
  const handleNewSearch = async (newSearchData) => {
    setLoading(true);
    try {
      console.log('🔄 Yeni arama yapılıyor...', newSearchData);
      
      const result = await hotelService.priceSearch(newSearchData);
      
      if (result.header?.success) {
        setSearchResults(result);
        setSearchData(newSearchData);
        
        // URL state'ini güncelle (browser history için)
        window.history.replaceState({
          searchResults: result,
          searchData: newSearchData
        }, '', window.location.pathname);
        
        console.log('✅ Yeni arama tamamlandı');
      } else {
        console.log('❌ Arama başarısız:', result);
        alert('Bu bölgede otel bulunamadı');
      }
    } catch (error) {
      console.error('❌ Arama hatası:', error);
      alert('Arama sırasında hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  // ✅ EXTRACT FUNCTIONS - DAHA TEMIZ
  const extractHotelImage = (hotel, index) => {
    if (hotel.thumbnailFull) {
      console.log(`✅ Using thumbnailFull for hotel ${index}:`, hotel.thumbnailFull);
      return hotel.thumbnailFull;
    }
    
    if (hotel.thumbnail) {
      console.log(`✅ Using thumbnail for hotel ${index}:`, hotel.thumbnail);
      return hotel.thumbnail;
    }
    
    if (hotel.image) {
      console.log(`✅ Using image for hotel ${index}:`, hotel.image);
      return hotel.image;
    }
    
    console.log(`❌ No image found for hotel ${index}, using fallback`);
    return '/images/destinations/istanbul.jpg';
  };

  const extractAmenities = (hotel) => {
    if (hotel.facilities && Array.isArray(hotel.facilities)) {
      return hotel.facilities.slice(0, 8).map(f => f.name || f).filter(Boolean);
    }
    return ['WiFi', 'Klima', 'Kahvaltı', 'Havuz'];
  };

  const extractRating = (hotel) => {
    if (hotel.rating && typeof hotel.rating === 'number') {
      return Math.max(3.0, Math.min(5.0, hotel.rating));
    }
    if (hotel.stars && typeof hotel.stars === 'number') {
      return Math.max(3.0, Math.min(5.0, hotel.stars));
    }
    return 3.5 + Math.random() * 1.5;
  };

  const safeString = (value) => {
    if (value && typeof value === 'object' && value.text) {
      return String(value.text);
    }
    return value ? String(value) : '';
  };

  // ✅ PARSE HOTEL DATA - DAHA DÜZENLI
  useEffect(() => {
    if (!searchResults) {
      setLoading(false);
      return;
    }

    try {
      console.log('🏨 Full API Response:', searchResults);
      
      const hotelsData = searchResults?.body?.hotels || searchResults?.hotels || [];
      console.log('🏨 Hotels array:', hotelsData);
      
      if (Array.isArray(hotelsData) && hotelsData.length > 0) {
        const hotelData = hotelsData.map((hotel, index) => {
          console.log(`🏨 Processing hotel ${index}:`, hotel);
          
          return {
            id: hotel.id || `hotel-${index}`,
            name: safeString(hotel.name) || `Otel ${index + 1}`,
            location: safeString(hotel.location?.name) || safeString(hotel.city?.name) || 'Konum Bilgisi Yok',
            rating: extractRating(hotel),
            stars: hotel.stars || Math.floor(extractRating(hotel)),
            image: extractHotelImage(hotel, index),
            price: parseFloat(hotel.offers?.[0]?.price?.amount) || 0,
            currency: safeString(hotel.offers?.[0]?.price?.currency) || safeString(searchData?.currency) || 'EUR',
            originalPrice: parseFloat(hotel.offers?.[0]?.originalPrice?.amount) || null,
            description: safeString(hotel.description) || `${safeString(hotel.name)} size konforlu konaklama imkanı sunar. ${hotel.stars ? hotel.stars + ' yıldızlı' : 'Kaliteli'} otel deneyimi.`,
            amenities: extractAmenities(hotel),
            offers: Array.isArray(hotel.offers) ? hotel.offers : [],
            distance: parseFloat(hotel.distance) || (Math.random() * 5 + 0.5),
            address: safeString(hotel.address) || '',
            facilities: hotel.facilities || [],
            hotelCategory: hotel.hotelCategory || null
          };
        });
        
        console.log('🏨 Final parsed hotels:', hotelData);
        setHotels(hotelData);
        setFilteredHotels(hotelData);
        
        // Fiyat aralığını ayarla
        if (hotelData.length > 0) {
          const prices = hotelData.map(h => h.price).filter(p => p > 0);
          if (prices.length > 0) {
            setPriceRange({
              min: Math.floor(Math.min(...prices) * 0.8),
              max: Math.ceil(Math.max(...prices) * 1.2)
            });
          }
        }
      } else {
        console.log('❌ No hotels found in response');
        setHotels([]);
        setFilteredHotels([]);
      }
    } catch (error) {
      console.error('❌ Error parsing hotel data:', error);
      setHotels([]);
      setFilteredHotels([]);
    }
    
    setLoading(false);
  }, [searchResults, searchData]);

  // ✅ FILTERING & SORTING
  useEffect(() => {
    let filtered = [...hotels];

    filtered = filtered.filter(hotel => 
      hotel.price >= priceRange.min && hotel.price <= priceRange.max
    );

    if (selectedRating > 0) {
      filtered = filtered.filter(hotel => hotel.rating >= selectedRating);
    }

    switch (sortBy) {
      case 'price_low':
        filtered.sort((a, b) => a.price - b.price);
        break;
      case 'price_high':
        filtered.sort((a, b) => b.price - a.price);
        break;
      case 'rating':
        filtered.sort((a, b) => b.rating - a.rating);
        break;
      case 'distance':
        filtered.sort((a, b) => a.distance - b.distance);
        break;
      default:
        break;
    }

    setFilteredHotels(filtered);
  }, [hotels, priceRange, selectedRating, sortBy]);

  // SearchForm'a mevcut arama verilerini ayarla
  useEffect(() => {
    if (searchData && searchFormRef.current) {
      // SearchForm'u mevcut arama verileri ile güncelle
      // Bu, SearchForm'un internal state'ini set etmek için gerekli olabilir
    }
  }, [searchData]);

  // ✅ HELPER FUNCTIONS
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const calculateNights = () => {
    if (!searchData?.checkIn || !searchData?.checkOut) return 1;
    const checkIn = new Date(searchData.checkIn);
    const checkOut = new Date(searchData.checkOut);
    const diffTime = Math.abs(checkOut - checkIn);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1;
  };

  // renderStars fonksiyonunu kaldır (artık HotelResultsFilters içinde)

  // ✅ LOADING STATE
  if (loading) {
    return (
      <div className="results-page">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Oteller yükleniyor...</p>
        </div>
      </div>
    );
  }

  // ✅ ERROR STATE
  if (!searchResults || !searchData) {
    return (
      <div className="results-page">
        <div className="error-container">
          <h2>Arama verisi bulunamadı</h2>
          <button onClick={() => navigate('/')} className="back-button">
            Ana Sayfaya Dön
          </button>
        </div>
      </div>
    );
  }

  const nights = calculateNights();
  const totalGuests = searchData.rooms?.reduce((sum, room) => sum + (room.adults || 0) + (room.children || 0), 0) || 2;

  return (
    <div className="results-page">
      {/* Search Form Section */}
      <div className="search-form-section" style={{ 
        background: 'white', 
        padding: '20px 0', 
        borderBottom: '1px solid #e5e7eb',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px' }}>
          <SearchForm 
            ref={searchFormRef}
            onSearchComplete={handleNewSearch}
            initialData={searchData}
          />
        </div>
      </div>

      <div className="results-container">
        {/* Filters Sidebar */}
        <HotelResultsFilters
          showFilters={showFilters}
          onClose={() => setShowFilters(false)}
          priceRange={priceRange}
          onPriceRangeChange={setPriceRange}
          selectedRating={selectedRating}
          onRatingChange={setSelectedRating}
        />

        {/* Main Results */}
        <div className="results-main">
          {/* Sort & Filter Bar */}
          <div className="sort-filter-bar">
            <div className="sort-options">
              <label>Sırala:</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="sort-select"
              >
                <option value="recommended">Önerilen</option>
                <option value="price_low">Fiyat (Düşük-Yüksek)</option>
                <option value="price_high">Fiyat (Yüksek-Düşük)</option>
                <option value="rating">Puan</option>
                <option value="distance">Mesafe</option>
              </select>
            </div>
            <button 
              className="mobile-filter-btn"
              onClick={() => setShowFilters(true)}
            >
              Filtreler
            </button>
          </div>

          {/* Results Count */}
          <div style={{ 
            padding: '20px 0 10px 0', 
            fontSize: '16px', 
            color: '#666',
            borderBottom: '1px solid #e5e7eb',
            marginBottom: '20px'
          }}>
            <strong>{filteredHotels.length}</strong> otel bulundu
          </div>

          {/* ✅ TEMIZLENMIŞ HOTELS LIST */}
          <div className="hotels-list">
            {filteredHotels.length === 0 ? (
              <div className="no-results">
                <h3>Arama kriterlerinize uygun otel bulunamadı</h3>
                <p>Filtreleri değiştirerek tekrar deneyin</p>
              </div>
            ) : (
              filteredHotels.map((hotel, index) => (
                <HotelCard 
                  key={hotel.id}
                  hotel={hotel}
                  nights={nights}
                  searchData={searchData}
                />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ResultsPage;