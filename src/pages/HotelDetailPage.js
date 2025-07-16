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
  
  // Fotoğraf galerisi için state'ler
  const [selectedImage, setSelectedImage] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [allImages, setAllImages] = useState([]);
  
  // HotelCard'dan gelen state verileri
  const { hotel, searchData } = location.state || {};

  const [showAllFacilities, setShowAllFacilities] = useState(false);
  
  useEffect(() => {
    const fetchHotelDetails = async () => {
      try {
        setLoading(true);
        setError(null);
        
        console.log('🔍 Fetching hotel details for ID:', id);
        
        const response = await hotelDetailsService.getProductInfo(id);
        
        if (response?.header?.success && response?.body?.hotel) {
          const rawHotel = response.body.hotel;
          const formatted = hotelDetailsService.formatHotelInfo(rawHotel);
          
          console.log('✅ Raw hotel data:', rawHotel);
          console.log('✅ Formatted hotel data:', formatted);
          console.log('🏨 Facilities count:', formatted.facilities.length);
          console.log('🔧 Facilities data:', formatted.facilities);
          
          const images = [
            { url: formatted.media.mainImage, alt: `${formatted.name} - Ana Fotoğraf` },
            ...formatted.media.galleryImages.map((img, index) => ({
              url: img.urlFull,
              alt: `${formatted.name} - Galeri ${index + 1}`
            }))
          ];
          
          setAllImages(images);
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

  const openLightbox = (index) => {
    setSelectedImage(index);
    setLightboxOpen(true);
  };

  const closeLightbox = () => {
    setLightboxOpen(false);
  };

  const nextImage = () => {
    setSelectedImage((prev) => (prev + 1) % allImages.length);
  };

  const prevImage = () => {
    setSelectedImage((prev) => (prev - 1 + allImages.length) % allImages.length);
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (lightboxOpen) {
        if (e.key === 'Escape') closeLightbox();
        if (e.key === 'ArrowLeft') prevImage();
        if (e.key === 'ArrowRight') nextImage();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxOpen]);

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
          <div className="hotel-title-section">
            <h1>{formattedHotel.name}</h1>
            <div className="hotel-rating-location">
              <div className="rating-stars">
                {hotelDetailsService.getCategoryStars(formattedHotel.categoryCode)}
              </div>
              <div className="location-info">
                <span className="location-text">
                  📍 {formattedHotel.location.name}, {formattedHotel.location.city}
                </span>
              </div>
            </div>
          </div>
          <div className="hotel-actions">
            <button 
              className="book-now-btn"
              onClick={handleBooking}
              disabled={!hotel && !searchData}
            >
              Rezervasyon Yap
            </button>
          </div>
        </div>

        {/* Modern Photo Gallery */}
        <div className="modern-photo-gallery">
          <div className="main-photo" onClick={() => openLightbox(0)}>
            <img 
              src={allImages[0]?.url || '/images/destinations/istanbul.jpg'} 
              alt={allImages[0]?.alt || formattedHotel.name}
              onError={(e) => {
                e.target.src = '/images/destinations/istanbul.jpg';
              }}
            />
            <div className="photo-overlay">
              <button className="view-all-photos">
                📷 Tüm Fotoğrafları Gör ({allImages.length})
              </button>
            </div>
          </div>
          
          <div className="photo-grid">
            {allImages.slice(1, 5).map((image, index) => (
              <div 
                key={index + 1} 
                className="grid-photo"
                onClick={() => openLightbox(index + 1)}
              >
                <img 
                  src={image.url} 
                  alt={image.alt}
                  onError={(e) => {
                    e.target.src = '/images/destinations/istanbul.jpg';
                  }}
                />
                {index === 3 && allImages.length > 5 && (
                  <div className="more-photos-overlay">
                    <span>+{allImages.length - 5} Fotoğraf</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Hotel Information Layout */}
        <div className="hotel-content">
          <div className="main-content">
            {/* Hotel Description */}
            <div className="content-section">
              <h2>Açıklama</h2>
              <p className="description-text">{formattedHotel.description}</p>
            </div>

            {/* Facilities */}
            {formattedHotel.facilities.length > 0 && (
              <div className="content-section">
                <h2>Otel Olanakları</h2>
                <div className="facilities-container">
                  {(showAllFacilities 
                    ? formattedHotel.facilities 
                    : formattedHotel.facilities.slice(0, 3)
                  ).map((category, index) => (
                    <div key={index} className="facility-group">
                      <h3>{category.name}</h3>
                      <div className="facility-items">
                        {category.facilities.map((facility, facilityIndex) => (
                          <div key={facilityIndex} className="facility-item">
                            <span className="facility-icon">✓</span>
                            <span className="facility-name">{facility.name}</span>
                            {facility.isPriced && (
                              <span className="facility-price">Ücretli</span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Show More/Less Button */}
                {formattedHotel.facilities.length > 3 && (
                  <div className="show-more-facilities">
                    <button 
                      className="show-more-btn"
                      onClick={() => setShowAllFacilities(!showAllFacilities)}
                    >
                      {showAllFacilities 
                        ? "Daha Az Göster" 
                        : `Daha Fazla Göster (${formattedHotel.facilities.length - 3} kategori daha)`
                      }
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* No Facilities Message */}
            {formattedHotel.facilities.length === 0 && (
              <div className="content-section">
                <h2>Otel Olanakları</h2>
                <div className="no-facilities-card">
                  <div className="no-facilities-icon">🏨</div>
                  <h3>Olanak Bilgisi Mevcut Değil</h3>
                  <p>Bu otel için detaylı olanak bilgisi henüz eklenmemiş. Daha fazla bilgi için otel ile iletişime geçebilirsiniz.</p>
                </div>
              </div>
            )}
          </div>

          <div className="sidebar-content">
            {/* Location Card */}
            <div className="info-card">
              <h3>📍 Konum</h3>
              <div className="location-details">
                <p className="main-location">{formattedHotel.location.name}</p>
                <p className="city-country">{formattedHotel.location.city}, {formattedHotel.location.country}</p>
                
                {formattedHotel.address.fullAddress !== 'Adres bilgisi mevcut değil' && (
                  <div className="address-info">
                    <p><strong>Adres:</strong></p>
                    <p>{formattedHotel.address.fullAddress}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Contact Card */}
            <div className="info-card">
              <h3>📞 İletişim</h3>
              <div className="contact-details">
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

            {/* Themes */}
            {formattedHotel.themes.length > 0 && (
              <div className="info-card">
                <h3>🎨 Otel Temaları</h3>
                <div className="themes-container">
                  {formattedHotel.themes.map((theme, index) => (
                    <span key={index} className="theme-badge">
                      {theme.name}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Lightbox */}
        {lightboxOpen && (
          <div className="lightbox-overlay" onClick={closeLightbox}>
            <div className="lightbox-content" onClick={(e) => e.stopPropagation()}>
              <button className="lightbox-close" onClick={closeLightbox}>×</button>
              
              <div className="lightbox-image">
                <img 
                  src={allImages[selectedImage]?.url} 
                  alt={allImages[selectedImage]?.alt}
                  onError={(e) => {
                    e.target.src = '/images/destinations/istanbul.jpg';
                  }}
                />
              </div>
              
              {allImages.length > 1 && (
                <>
                  <button className="lightbox-prev" onClick={prevImage}>‹</button>
                  <button className="lightbox-next" onClick={nextImage}>›</button>
                  
                  <div className="lightbox-info">
                    <h3>{formattedHotel.name}</h3>
                    <p>{selectedImage + 1} / {allImages.length}</p>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default HotelDetailPage;