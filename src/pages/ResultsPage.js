import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import HotelCard from '../components/HotelCard';
import '../pages.css';

function ResultsPage() {
  const location = useLocation();
  const navigate = useNavigate();
  
  // URL state'inden data al
  const searchResults = location.state?.searchResults;
  const searchData = location.state?.searchData;
  
  // Component states
  const [hotels, setHotels] = useState([]);
  const [filteredHotels, setFilteredHotels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('recommended');
  const [priceRange, setPriceRange] = useState({ min: 0, max: 2000 });
  const [selectedRating, setSelectedRating] = useState(0);
  const [showFilters, setShowFilters] = useState(false);

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
            currency: safeString(hotel.offers?.[0]?.price?.currency) || safeString(searchData.currency) || 'EUR',
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
  }, [searchResults, searchData, navigate]);

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

  const renderStars = (rating) => {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating - fullStars >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    
    return (
      <>
        {[...Array(fullStars)].map((_, i) => (
          <span key={`full-${i}`} className="star">★</span>
        ))}
        {hasHalfStar && <span className="star half">★</span>}
        {[...Array(emptyStars)].map((_, i) => (
          <span key={`empty-${i}`} className="star empty">★</span>
        ))}
      </>
    );
  };

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
      {/* Search Summary */}
      <div className="search-summary">
        <div className="summary-content">
          <div className="summary-main">
            <h1>{safeString(searchData.destinationName) || 'Destinasyon'}</h1>
            <p className="search-details">
              <span className="dates">
                {formatDate(searchData.checkIn)} - {formatDate(searchData.checkOut)}
              </span>
              <span className="nights">{nights} gece</span>
              <span className="guests">{totalGuests} misafir</span>
              <span className="rooms">{searchData.rooms?.length || 1} oda</span>
            </p>
          </div>
          <div className="summary-results">
            <p className="results-count">
              <strong>{filteredHotels.length}</strong> otel bulundu
            </p>
            <button 
              className="modify-search-btn"
              onClick={() => navigate('/', { state: searchData })}
            >
              Aramayı Değiştir
            </button>
          </div>
        </div>
      </div>

      <div className="results-container">
        {/* Filters Sidebar */}
        <div className={`filters-sidebar ${showFilters ? 'show' : ''}`}>
          <div className="filters-header">
            <h3>Filtreler</h3>
            <button 
              className="close-filters"
              onClick={() => setShowFilters(false)}
            >
              ×
            </button>
          </div>

          {/* Price Filter */}
          <div className="filter-section">
            <h4>Fiyat Aralığı (Gecelik)</h4>
            <div className="price-inputs">
              <input
                type="number"
                value={priceRange.min}
                onChange={(e) => setPriceRange(prev => ({...prev, min: Number(e.target.value)}))}
                placeholder="Min"
              />
              <span>-</span>
              <input
                type="number"
                value={priceRange.max}
                onChange={(e) => setPriceRange(prev => ({...prev, max: Number(e.target.value)}))}
                placeholder="Max"
              />
            </div>
          </div>

          {/* Rating Filter */}
          <div className="filter-section">
            <h4>Minimum Puan</h4>
            <div className="rating-filters">
              {[0, 3, 3.5, 4, 4.5].map(rating => (
                <label key={rating} className="rating-option">
                  <input
                    type="radio"
                    name="rating"
                    value={rating}
                    checked={selectedRating === rating}
                    onChange={(e) => setSelectedRating(Number(e.target.value))}
                  />
                  <span>
                    {rating === 0 ? 'Tümü' : (
                      <>
                        {rating}+ <div className="stars">{renderStars(rating)}</div>
                      </>
                    )}
                  </span>
                </label>
              ))}
            </div>
          </div>
        </div>

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