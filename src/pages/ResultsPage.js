import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
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
  
  // Filter states
  const [priceRange, setPriceRange] = useState({ min: 0, max: 10000 });
  const [selectedRating, setSelectedRating] = useState(0);
  const [showFilters, setShowFilters] = useState(false);

  // ✅ API'DEN GERÇEK OTEL FOTOĞRAFI ÇEK
  const extractHotelImage = (hotel, index) => {
    // 1. önce thumbnailFull (tam URL)
    if (hotel.thumbnailFull && typeof hotel.thumbnailFull === 'string') {
      console.log(`✅ Hotel ${index} using thumbnailFull:`, hotel.thumbnailFull);
      return hotel.thumbnailFull;
    }
    
    // 2. thumbnail (kısa path) varsa base URL ekle
    if (hotel.thumbnail && typeof hotel.thumbnail === 'string') {
      const baseUrl = 'https://prod-services.tourvisio.com/media';
      const imageUrl = hotel.thumbnail.startsWith('/') ? 
        baseUrl + hotel.thumbnail : 
        baseUrl + '/' + hotel.thumbnail;
      console.log(`✅ Hotel ${index} using thumbnail with base URL:`, imageUrl);
      return imageUrl;
    }

    // 3. Diğer muhtemel field'lar
    if (hotel.image && typeof hotel.image === 'string') {
      console.log(`✅ Hotel ${index} using image:`, hotel.image);
      return hotel.image;
    }

    // 4. Fallback - local image
    const fallbackImages = [
      '/images/destinations/istanbul.jpg',
      '/images/destinations/antalya.jpg',
      '/images/destinations/ankara.jpg',
      '/images/destinations/izmir.jpg',
      '/images/destinations/mugla.jpg',
      '/images/destinations/hatay.jpg',
      '/images/destinations/atina.jpg'
    ];
    const fallbackImage = fallbackImages[index % fallbackImages.length];
    console.log(`⚠️ Hotel ${index} using fallback:`, fallbackImage);
    return fallbackImage;
  };

  // ✅ FAĆİLİTİES'i AMENİTİES'e ÇEVİR
  const extractAmenities = (hotel) => {
    if (Array.isArray(hotel.facilities) && hotel.facilities.length > 0) {
      return hotel.facilities.map(facility => facility.name).filter(name => name);
    }
    return ['WiFi', 'Klima', 'Otopark']; // fallback
  };

  // ✅ RATING'i STARS'dan AL
  const extractRating = (hotel) => {
    // Önce rating varsa onu kullan
    if (hotel.rating && parseFloat(hotel.rating) > 0) {
      return parseFloat(hotel.rating);
    }
    
    // Rating yoksa stars'ı rating olarak kullan
    if (hotel.stars && parseFloat(hotel.stars) > 0) {
      return parseFloat(hotel.stars);
    }
    
    // Hiç bir şey yoksa random rating
    return 4.0 + Math.random() * 1; // 4.0-5.0 arası
  };

  // ✅ GÜVENLİ STRING DÖNÜŞTÜRMESİ
  const safeString = (value) => {
    if (!value) return '';
    if (typeof value === 'string') return value;
    if (typeof value === 'object' && value.text) return value.text;
    if (typeof value === 'object' && value.name) return value.name;
    if (typeof value === 'object' && value.value) return value.value;
    return String(value);
  };

  useEffect(() => {
    // Eğer search data yoksa ana sayfaya yönlendir
    if (!searchResults || !searchData) {
      console.log('❌ Search data bulunamadı, ana sayfaya yönlendiriliyor...');
      navigate('/');
      return;
    }

    console.log('📥 API Response Analysis:', searchResults);
    setLoading(true);
    
    try {
      // API response'undan otelleri çıkar
      if (searchResults.header?.success && searchResults.body?.hotels) {
        const hotelData = searchResults.body.hotels.map((hotel, index) => {
          console.log(`🏨 Hotel ${index + 1} - ${hotel.name}:`, hotel);
          
          return {
            id: hotel.id || `hotel-${index}`,
            name: safeString(hotel.name) || `Otel ${index + 1}`,
            location: safeString(hotel.location?.name || hotel.city?.name) || 'Şehir Merkezi',
            rating: extractRating(hotel), // ✅ Stars veya rating'den al
            stars: parseInt(hotel.stars) || 5, // ✅ Otel yıldızı
            image: extractHotelImage(hotel, index), // ✅ API'den gerçek fotoğraf
            price: parseFloat(hotel.offers?.[0]?.price?.amount) || 0,
            currency: safeString(hotel.offers?.[0]?.price?.currency) || safeString(searchData.currency) || 'EUR',
            originalPrice: parseFloat(hotel.offers?.[0]?.originalPrice?.amount) || null,
            description: safeString(hotel.description) || `${safeString(hotel.name)} size konforlu konaklama imkanı sunar. ${hotel.stars ? hotel.stars + ' yıldızlı' : 'Kaliteli'} otel deneyimi.`,
            amenities: extractAmenities(hotel), // ✅ Facilities'den amenities yap
            offers: Array.isArray(hotel.offers) ? hotel.offers : [],
            distance: parseFloat(hotel.distance) || (Math.random() * 5 + 0.5),
            
            // ✅ Ekstra bilgiler
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

  // Filtreleme ve sıralama
  useEffect(() => {
    let filtered = [...hotels];

    // Fiyat filtresi
    filtered = filtered.filter(hotel => 
      hotel.price >= priceRange.min && hotel.price <= priceRange.max
    );

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
      default: // recommended
        // Keep original order
        break;
    }

    setFilteredHotels(filtered);
  }, [hotels, priceRange, selectedRating, sortBy]);

  const formatDate = (dateString) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('tr-TR', { 
        day: 'numeric', 
        month: 'long' 
      });
    } catch (error) {
      return String(dateString);
    }
  };

  const calculateNights = () => {
    if (!searchData?.checkIn || !searchData?.checkOut) return 1;
    try {
      const start = new Date(searchData.checkIn);
      const end = new Date(searchData.checkOut);
      return Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60 * 24)));
    } catch (error) {
      return 1;
    }
  };

  const renderStars = (rating) => {
    const stars = [];
    const safeRating = parseFloat(rating) || 0;
    const fullStars = Math.floor(safeRating);
    const hasHalfStar = safeRating % 1 >= 0.5;

    for (let i = 0; i < fullStars; i++) {
      stars.push(<span key={i} className="star filled">★</span>);
    }

    if (hasHalfStar) {
      stars.push(<span key="half" className="star half">★</span>);
    }

    const emptyStars = 5 - Math.ceil(safeRating);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(<span key={`empty-${i}`} className="star empty">☆</span>);
    }

    return stars;
  };

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
                        {rating}+ {renderStars(rating)}
                      </>
                    )}
                  </span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="results-main">
          {/* Sort and Filter Bar */}
          <div className="sort-filter-bar">
            <div className="sort-options">
              <label>Sırala:</label>
              <select 
                value={sortBy} 
                onChange={(e) => setSortBy(e.target.value)}
                className="sort-select"
              >
                <option value="recommended">Önerilen</option>
                <option value="price_low">Fiyat (Düşük → Yüksek)</option>
                <option value="price_high">Fiyat (Yüksek → Düşük)</option>
                <option value="rating">Puan (Yüksek → Düşük)</option>
                <option value="distance">Mesafe</option>
              </select>
            </div>
            
            <button 
              className="mobile-filter-btn"
              onClick={() => setShowFilters(true)}
            >
              Filtreler ({(selectedRating > 0 ? 1 : 0)})
            </button>
          </div>

          {/* Hotels List */}
          <div className="hotels-list">
            {filteredHotels.length === 0 ? (
              <div className="no-results">
                <h3>Bu kriterlere uygun otel bulunamadı</h3>
                <p>Filtrelerinizi değiştirmeyi deneyin</p>
              </div>
            ) : (
              filteredHotels.map(hotel => (
                <div key={hotel.id} className="hotel-card">
                  <div className="hotel-image">
                    <img 
                      src={hotel.image} 
                      alt={hotel.name}
                      onError={(e) => {
                        console.log('❌ Image failed to load:', e.target.src);
                        e.target.src = '/images/destinations/istanbul.jpg';
                      }}
                      onLoad={() => {
                        console.log('✅ Image loaded successfully:', hotel.image);
                      }}
                    />
                    {hotel.originalPrice && hotel.originalPrice > hotel.price && (
                      <div className="discount-badge">
                        %{Math.round((1 - hotel.price / hotel.originalPrice) * 100)} İndirim
                      </div>
                    )}
                  </div>

                  <div className="hotel-info">
                    <div className="hotel-header">
                      <h3 className="hotel-name">{hotel.name}</h3>
                      <div className="hotel-rating">
                        <div className="stars">
                          {renderStars(hotel.rating)}
                        </div>
                        <span className="rating-number">({hotel.rating.toFixed(1)})</span>
                      </div>
                    </div>

                    <p className="hotel-location">📍 {hotel.location}</p>
                    
                    {hotel.distance > 0 && (
                      <p className="hotel-distance">🚗 Merkeze {hotel.distance.toFixed(1)} km</p>
                    )}

                    <p className="hotel-description">{hotel.description}</p>

                    <div className="hotel-amenities">
                      {hotel.amenities.slice(0, 4).map((amenity, index) => (
                        <span key={index} className="amenity-tag">
                          {amenity}
                        </span>
                      ))}
                      {hotel.amenities.length > 4 && (
                        <span className="amenity-more">
                          +{hotel.amenities.length - 4} daha
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="hotel-pricing">
                    <div className="price-info">
                      {hotel.originalPrice && hotel.originalPrice > hotel.price && (
                        <div className="original-price">
                          {hotel.originalPrice.toFixed(0)} {hotel.currency}
                        </div>
                      )}
                      <div className="current-price">
                        <span className="amount">{hotel.price.toFixed(0)}</span>
                        <span className="currency">{hotel.currency}</span>
                      </div>
                      <div className="price-detail">
                        Toplam {nights} gece için
                      </div>
                    </div>

                    <div className="booking-actions">
                      <button 
                        className="view-details-btn"
                        onClick={() => navigate(`/hotel/${hotel.id}`, { 
                          state: { hotel, searchData } 
                        })}
                      >
                        Detayları Gör
                      </button>
                      <button 
                        className="book-now-btn"
                        onClick={() => navigate('/booking', { 
                          state: { hotel, searchData } 
                        })}
                      >
                        Rezervasyon Yap
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ResultsPage;