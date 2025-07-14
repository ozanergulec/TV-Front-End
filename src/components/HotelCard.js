import React from 'react';
import { useNavigate } from 'react-router-dom';

const HotelCard = ({ hotel, nights, searchData }) => {
  const navigate = useNavigate();

  // Güvenli string render fonksiyonu
  const safeRender = (value, fallback = '') => {
    if (!value || typeof value === 'object') return fallback;
    return String(value);
  };

  // Her kelimenin ilk harfini büyük yapan fonksiyon
  const capitalizeWords = (str) => {
    if (!str) return '';
    return str
      .toLowerCase()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
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

  return (
    <div className="hotel-card">
      <div className="hotel-image">
        <img 
          src={hotel.image} 
          alt={safeRender(hotel.name, 'Hotel')}
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
          <h3 className="hotel-name">{capitalizeWords(safeRender(hotel.name, 'Hotel Adı'))}</h3>
          <div className="hotel-rating">
            <div className="stars">
              {renderStars(hotel.rating)}
            </div>
            <span className="rating-number">({hotel.rating.toFixed(1)})</span>
          </div>
        </div>

        {safeRender(hotel.location) && (
          <p className="hotel-location">📍 {safeRender(hotel.location)}</p>
        )}
        
        {hotel.distance > 0 && (
          <p className="hotel-distance">🚗 Merkeze {hotel.distance.toFixed(1)} km</p>
        )}

        {safeRender(hotel.description) && (
          <p className="hotel-description">{safeRender(hotel.description)}</p>
        )}

        <div className="hotel-amenities">
          {hotel.amenities && hotel.amenities.slice(0, 4).map((amenity, index) => (
            <span key={index} className="amenity-tag">
              {safeRender(amenity)}
            </span>
          ))}
          {hotel.amenities && hotel.amenities.length > 4 && (
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
              {hotel.originalPrice.toFixed(0)} {safeRender(hotel.currency, 'EUR')}
            </div>
          )}
          <div className="current-price">
            <span className="amount">{hotel.price.toFixed(0)}</span>
            <span className="currency">{safeRender(hotel.currency, 'EUR')}</span>
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
  );
};

export default HotelCard;