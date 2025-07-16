import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import hotelDetailsService from '../services/hotelDetailsService';
import LoadingSpinner from '../components/LoadingSpinner';
import '../styles/HotelDetailPage.css';

function HotelDetailPage() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  
  const [hotelDetails, setHotelDetails] = useState(null);
  const [formattedHotel, setFormattedHotel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // HotelCard'dan gelen state verileri
  const { hotel, searchData } = location.state || {};

  useEffect(() => {
    const fetchHotelDetails = async () => {
      try {
        setLoading(true);
        setError(null);
        
        console.log('🔍 Fetching hotel details for ID:', id);
        
        // Backend API'den hotel detaylarını al
        const response = await hotelDetailsService.getProductInfo(id);
        
        if (response?.header?.success && response?.body?.hotel) {
          const rawHotel = response.body.hotel;
          const formatted = hotelDetailsService.formatHotelInfo(rawHotel);
          
          console.log('✅ Raw hotel data:', rawHotel);
          console.log('✅ Formatted hotel data:', formatted);
          
          setHotelDetails(rawHotel);
          setFormattedHotel(formatted);
        } else {
          console.error('❌ Invalid response structure:', response);
          setError('Hotel detayları bulunamadı');
        }
      } catch (err) {
        console.error('❌ Hotel detayları alınırken hata:', err);
        setError('Hotel detayları yüklenirken bir hata oluştu: ' + err.message);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchHotelDetails();
    }
  }, [id]);

  const handleBooking = () => {
    navigate('/booking', { 
      state: { hotel: hotel || hotelDetails, searchData } 
    });
  };

  if (loading) {
    return (
      <div className="hotel-detail-page">
        <div className="loading-container">
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="hotel-detail-page">
        <div className="error-message">
          <h2>Hata</h2>
          <p>{error}</p>
          <button onClick={() => navigate(-1)}>Geri Dön</button>
        </div>
      </div>
    );
  }

  if (!formattedHotel) {
    return (
      <div className="hotel-detail-page">
        <div className="error-message">
          <h2>Hotel Bulunamadı</h2>
          <p>Aradığınız hotel bulunamadı.</p>
          <button onClick={() => navigate(-1)}>Geri Dön</button>
        </div>
      </div>
    );
  }

  return (
    <div className="hotel-detail-page">
      <div className="hotel-detail-container">
        {/* Hotel Header */}
        <div className="hotel-header">
          <h1>{formattedHotel.name}</h1>
          <div className="hotel-meta">
            <span className="category-badge">
              {hotelDetailsService.getCategoryStars(formattedHotel.categoryCode)} 
              {formattedHotel.category !== 'Kategori Belirtilmemiş' && 
                ` (${formattedHotel.category})`
              }
            </span>
            <span className="provider-badge">
              Provider: {formattedHotel.provider}
            </span>
          </div>
        </div>

        {/* Hotel Images */}
        <div className="hotel-images">
          <div className="main-image">
            <img 
              src={formattedHotel.media.mainImage} 
              alt={formattedHotel.name}
              onError={(e) => {
                e.target.src = '/images/destinations/istanbul.jpg';
              }}
            />
          </div>
          
          {formattedHotel.media.galleryImages.length > 0 && (
            <div className="image-gallery">
              {formattedHotel.media.galleryImages.map((image, index) => (
                <div key={index} className="gallery-image">
                  <img 
                    src={image.urlFull} 
                    alt={`${formattedHotel.name} - ${index + 2}`}
                    onError={(e) => {
                      e.target.src = '/images/destinations/istanbul.jpg';
                    }}
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Hotel Info */}
        <div className="hotel-info-section">
          {/* Location Info */}
          <div className="info-card">
            <h3>
              <span className="icon">📍</span>
              Konum
            </h3>
            <div className="location-info">
              <p className="main-location">{formattedHotel.location.name}</p>
              <p>{formattedHotel.location.city}, {formattedHotel.location.country}</p>
              
              {formattedHotel.address.fullAddress !== 'Adres bilgisi mevcut değil' && (
                <div className="address-section">
                  <p><strong>Adres:</strong></p>
                  <p>{formattedHotel.address.fullAddress}</p>
                </div>
              )}
              
              {/* Koordinatlar varsa göster */}
              {formattedHotel.coordinates.lat && formattedHotel.coordinates.lng && (
                <div className="coordinates-section">
                  <p><strong>Koordinatlar:</strong></p>
                  <p>Enlem: {formattedHotel.coordinates.lat}</p>
                  <p>Boylam: {formattedHotel.coordinates.lng}</p>
                </div>
              )}
            </div>
          </div>

          {/* Contact Info */}
          <div className="info-card">
            <h3>
              <span className="icon">📞</span>
              İletişim
            </h3>
            <div className="contact-info">
              <p><strong>Telefon:</strong> {formattedHotel.contact.phone}</p>
              <p><strong>Faks:</strong> {formattedHotel.contact.fax}</p>
              {formattedHotel.contact.website && (
                <p><strong>Web:</strong> 
                  <a href={formattedHotel.contact.website} target="_blank" rel="noopener noreferrer">
                    {formattedHotel.contact.website}
                  </a>
                </p>
              )}
            </div>
          </div>

          {/* Hotel Description */}
          <div className="info-card">
            <h3>
              <span className="icon">📝</span>
              Açıklama
            </h3>
            <p className="description-text">{formattedHotel.description}</p>
          </div>

          {/* Hotel ID Info */}
          <div className="info-card">
            <h3>
              <span className="icon">🔍</span>
              Otel Bilgileri
            </h3>
            <div className="hotel-info">
              <p><strong>Otel ID:</strong> {formattedHotel.id}</p>
              <p><strong>Kategori Kodu:</strong> {formattedHotel.categoryCode}</p>
              <p><strong>Provider:</strong> {formattedHotel.provider}</p>
            </div>
          </div>

          {/* Themes - Sadece varsa göster */}
          {formattedHotel.themes.length > 0 && (
            <div className="info-card themes-section">
              <h3>
                <span className="icon">🎨</span>
                Otel Temaları
              </h3>
              <div className="themes-list">
                {formattedHotel.themes.map((theme, index) => (
                  <span key={index} className="theme-tag">
                    {theme.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Facilities - Sadece varsa göster */}
          {formattedHotel.facilities.length > 0 && (
            <div className="info-card facilities-section">
              <h3>
                <span className="icon">🏨</span>
                Otel Olanakları
              </h3>
              {formattedHotel.facilities.map((category, index) => (
                <div key={index} className="facility-category">
                  <h4>{category.name}</h4>
                  <div className="facilities-grid">
                    {category.facilities.map((facility, facilityIndex) => (
                      <div key={facilityIndex} className="facility-item">
                        <span className="facility-name">{facility.name}</span>
                        {facility.isPriced && (
                          <span className="priced-badge">Ücretli</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Eğer hiç facilities yoksa bilgi ver */}
          {formattedHotel.facilities.length === 0 && (
            <div className="info-card">
              <h3>
                <span className="icon">🏨</span>
                Otel Olanakları
              </h3>
              <p className="no-facilities">Bu otel için olanak bilgisi mevcut değil</p>
            </div>
          )}
        </div>

        {/* Booking Section */}
        <div className="booking-section">
          <div className="booking-actions">
            <button 
              className="book-now-btn"
              onClick={handleBooking}
              disabled={!hotel && !searchData}
            >
              Rezervasyon Yap
            </button>
            <button 
              className="back-btn"
              onClick={() => navigate(-1)}
            >
              Geri Dön
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default HotelDetailPage;