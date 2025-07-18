import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import HotelCard from '../components/hotel/HotelCard';
import SearchForm from '../components/search/SearchForm';
import HotelResultsFilters from '../components/hotel/HotelResultsFilters';
import HotelMap from '../components/hotel/HotelMap';
import LoadingSpinner from '../components/LoadingSpinner';
import hotelService from '../services/hotelService';
import '../pages.css';

function ResultsPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const searchFormRef = useRef(null);
  
  // URL state'inden data al
  const [searchResults, setSearchResults] = useState(location.state?.searchResults);
  const [searchData, setSearchData] = useState(location.state?.searchData);
  const [isInitialLoading, setIsInitialLoading] = useState(location.state?.isLoading || false);
  
  // Component states
  const [hotels, setHotels] = useState([]);
  const [filteredHotels, setFilteredHotels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('recommended');
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });
  const [selectedRating, setSelectedRating] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedHotel, setSelectedHotel] = useState(null);

  // ✅ İlk yüklenme - sadece bir kez çalışsın
  useEffect(() => {
    const performInitialSearch = async () => {
      if (searchData && !searchResults && isInitialLoading) {
        try {
          const result = await hotelService.priceSearch(searchData);
          
          if (result.header?.success) {
            setSearchResults(result);
          } else {
            alert('Bu bölgede otel bulunamadı');
          }
        } catch (error) {
          console.error('❌ Arama hatası:', error);
          alert('Arama sırasında hata oluştu');
        } finally {
          setIsInitialLoading(false);
        }
      }
    };

    performInitialSearch();
  }, []); // ✅ Boş dependency - sadece mount'ta çalışsın

  // ✅ Yeni arama yapıldığında çağrılacak fonksiyon
  const handleNewSearch = useCallback(async (newSearchData) => {
    setLoading(true);
    setHotels([]);
    setFilteredHotels([]);
    
    try {
      const result = await hotelService.priceSearch(newSearchData);
      
      if (result.header?.success) {
        setSearchResults(result);
        setSearchData(newSearchData);
        
        // URL state'ini güncelle
        window.history.replaceState({
          searchResults: result,
          searchData: newSearchData
        }, '', window.location.pathname);
        
      } else {
        alert('Bu bölgede otel bulunamadı');
      }
    } catch (error) {
      console.error('❌ Arama hatası:', error);
      alert('Arama sırasında hata oluştu');
    } finally {
      setLoading(false);
    }
  }, []);

  // ✅ Helper functions - memoize edilmiş
  const extractHotelImage = useCallback((hotel, index) => {
    if (hotel.thumbnailFull) return hotel.thumbnailFull;
    if (hotel.thumbnail) return hotel.thumbnail;
    if (hotel.image) return hotel.image;
    return '/images/destinations/istanbul.jpg';
  }, []);

  const extractAmenities = useCallback((hotel) => {
    if (hotel.facilities && Array.isArray(hotel.facilities)) {
      return hotel.facilities.slice(0, 8).map(f => f.name || f).filter(Boolean);
    }
    return ['WiFi', 'Klima', 'Kahvaltı', 'Havuz'];
  }, []);

  const extractRating = useCallback((hotel) => {
    if (hotel.rating && typeof hotel.rating === 'number') {
      return Math.max(3.0, Math.min(5.0, hotel.rating));
    }
    if (hotel.stars && typeof hotel.stars === 'number') {
      return Math.max(3.0, Math.min(5.0, hotel.stars));
    }
    return 3.5 + Math.random() * 1.5;
  }, []);

  const safeString = useCallback((value) => {
    if (!value) return '';
    if (typeof value === 'string') return value;
    if (typeof value === 'number') return String(value);
    if (typeof value === 'object') {
      if (value.text && typeof value.text === 'string') return value.text;
      if (value.name && typeof value.name === 'string') return value.name;
      if (value.value && typeof value.value === 'string') return value.value;
      if (value.displayName && typeof value.displayName === 'string') return value.displayName;
      if (value.title && typeof value.title === 'string') return value.title;
      return '';
    }
    return '';
  }, []);

  // ✅ Hotel parsing - sadece searchResults değiştiğinde çalışsın
  useEffect(() => {
    if (!searchResults) {
      setLoading(false);
      return;
    }

    const hotelsData = searchResults?.body?.hotels || searchResults?.hotels || [];
    const searchId = searchResults?.body?.searchId || null;
    
    if (Array.isArray(hotelsData) && hotelsData.length > 0) {
      const hotelData = hotelsData.map((hotel, index) => {
        const getDeterministicDistance = (hotelId, index) => {
          if (!hotelId) return 2.5;
          let hash = 0;
          const idStr = String(hotelId);
          for (let i = 0; i < idStr.length; i++) {
            hash = ((hash << 5) - hash + idStr.charCodeAt(i)) & 0xffffffff;
          }
          return Math.abs(hash % 45) / 10 + 0.5;
        };
        
        // Koordinatları parse et
        const parseCoordinates = (hotel) => {
          const lat = hotel.geolocation?.latitude || hotel.location?.latitude || null;
          const lng = hotel.geolocation?.longitude || hotel.location?.longitude || null;
          
          // Koordinatlar varsa bunları kullan
          if (lat && lng) {
            return {
              lat: parseFloat(lat),
              lng: parseFloat(lng)
            };
          }
          
          return null;
        };
        
        return {
          id: hotel.id || `hotel-${index}`,
          name: safeString(hotel.name) || `Otel ${index + 1}`,
          location: safeString(hotel.location?.name) || safeString(hotel.location) || safeString(hotel.city?.name) || safeString(hotel.city) || '',
          rating: extractRating(hotel),
          stars: hotel.stars || Math.floor(extractRating(hotel)),
          image: extractHotelImage(hotel, index),
          price: parseFloat(hotel.offers?.[0]?.price?.amount) || 0,
          currency: safeString(hotel.offers?.[0]?.price?.currency) || safeString(searchData?.currency) || 'EUR',
          originalPrice: parseFloat(hotel.offers?.[0]?.originalPrice?.amount) || null,
          description: safeString(hotel.description) || (safeString(hotel.name) ? `${safeString(hotel.name)} size konforlu konaklama imkanı sunar.` : 'Konforlu konaklama imkanı'),
          amenities: extractAmenities(hotel),
          offers: Array.isArray(hotel.offers) ? hotel.offers : [],
          distance: parseFloat(hotel.distance) || getDeterministicDistance(hotel.id, index),
          address: safeString(hotel.address) || '',
          facilities: hotel.facilities || [],
          hotelCategory: hotel.hotelCategory || null,
          searchId: searchId,
          offerId: hotel.offers?.[0]?.offerId || null,
          checkIn: hotel.offers?.[0]?.checkIn || null,
          nights: hotel.offers?.[0]?.night || 1,
          // ✅ Gerçek koordinatları ekle
          coordinates: parseCoordinates(hotel)
        };
      });
      
      setHotels(hotelData);
      setFilteredHotels(hotelData);
      
      // ✅ SearchData güncelleme - sadece searchId yoksa ekle
      if (searchId && searchData && !searchData.searchId) {
        setSearchData(prev => ({
          ...prev,
          searchId: searchId
        }));
      }
    } else {
      setHotels([]);
      setFilteredHotels([]);
    }
    
    setLoading(false);
  }, [searchResults]); // ✅ Sadece searchResults dependency'si

  // ✅ Filtering & Sorting - memoize edilmiş
  const filteredAndSortedHotels = useMemo(() => {
    let filtered = [...hotels];

    // Fiyat filtresi
    if (priceRange.min !== '' || priceRange.max !== '') {
      const minPrice = priceRange.min === '' ? 0 : Number(priceRange.min);
      const maxPrice = priceRange.max === '' ? Infinity : Number(priceRange.max);
      
      filtered = filtered.filter(hotel => 
        hotel.price >= minPrice && hotel.price <= maxPrice
      );
    }

    // Rating filtresi
    if (selectedRating > 0) {
      filtered = filtered.filter(hotel => hotel.rating >= selectedRating);
    }

    // Sıralama
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

    return filtered;
  }, [hotels, priceRange, selectedRating, sortBy]);

  // ✅ Filtered hotels'i güncelle
  useEffect(() => {
    setFilteredHotels(filteredAndSortedHotels);
  }, [filteredAndSortedHotels]);

  // ✅ Helper functions
  const formatDate = useCallback((dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }, []);

  const calculateNights = useCallback(() => {
    if (!searchData?.checkIn || !searchData?.checkOut) return 1;
    const checkIn = new Date(searchData.checkIn);
    const checkOut = new Date(searchData.checkOut);
    const diffTime = Math.abs(checkOut - checkIn);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1;
  }, [searchData?.checkIn, searchData?.checkOut]);

  // ✅ Memoize edilmiş değerler
  const nights = useMemo(() => calculateNights(), [calculateNights]);
  const totalGuests = useMemo(() => {
    return searchData?.rooms?.reduce((sum, room) => sum + (room.adults || 0) + (room.children || 0), 0) || 2;
  }, [searchData?.rooms]);

  // ✅ LOADING STATE
  if (isInitialLoading || (loading && !searchResults)) {
    return (
      <div className="results-page">
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
              externalLoading={true}
            />
          </div>
        </div>
        <LoadingSpinner 
          message="Oteller aranıyor..."
          submessage={searchData?.destinationName ? `${searchData.destinationName} için en iyi fiyatları buluyoruz` : "En uygun otelleri buluyoruz"}
          variant="search"
        />
      </div>
    );
  }

  // ✅ ERROR STATE
  if (!searchData) {
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
            externalLoading={loading}
          />
        </div>
      </div>

      {/* Hotel Map - Filtrelerin üzerinde */}
      <div className="map-section-top">
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px' }}>
          <HotelMap 
            hotels={filteredHotels}
            selectedHotel={selectedHotel}
            onHotelSelect={setSelectedHotel}
            searchData={searchData}
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
          {!loading && (
            <div style={{ 
              padding: '20px 0 10px 0', 
              fontSize: '16px', 
              color: '#666',
              borderBottom: '1px solid #e5e7eb',
              marginBottom: '20px'
            }}>
              <strong>{filteredHotels.length}</strong> otel bulundu
            </div>
          )}

          {/* Loading or Results */}
          {loading ? (
            <div style={{ padding: '40px 0' }}>
              <LoadingSpinner 
                message="Oteller aranıyor..."
                submessage={searchData?.destinationName ? `${searchData.destinationName} için en iyi fiyatları buluyoruz` : "En uygun otelleri buluyoruz"}
                variant="search"
              />
            </div>
          ) : (
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
                    isSelected={selectedHotel?.id === hotel.id}
                    onClick={() => setSelectedHotel(hotel)}
                  />
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ResultsPage;