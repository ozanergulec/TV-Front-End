import React, { useState, useEffect, useRef } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import hotelDetailsService from '../services/hotelDetailsService';
import LoadingSpinner from '../components/LoadingSpinner';
import HotelOffers from '../components/HotelOffers';
import '../styles/HotelDetailPage.css';

function HotelDetailPage() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  
  // Teklifler kısmına scroll için ref
  const offersRef = useRef(null);
  
  const [hotelDetails, setHotelDetails] = useState(null);
  const [formattedHotel, setFormattedHotel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Fotoğraf galerisi için state'ler
  const [selectedImage, setSelectedImage] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [allImages, setAllImages] = useState([]);
  
  // Content states
  const [showAllFacilities, setShowAllFacilities] = useState(false);
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [showFacilitiesModal, setShowFacilitiesModal] = useState(false);
  
  // HotelCard'dan gelen state verileri
  const { hotel, searchData } = location.state || {};

  useEffect(() => {
    const fetchHotelDetails = async () => {
      try {
        setLoading(true);
        setError(null);
        
        console.log('Otel detayları alınıyor, ID:', id);
        
        const response = await hotelDetailsService.getProductInfo(id);
        
        if (response?.header?.success && response?.body?.hotel) {
          const rawHotel = response.body.hotel;
          const formatted = hotelDetailsService.formatHotelInfo(rawHotel);
          
          console.log('Ham otel verisi:', rawHotel);
          console.log('Formatlanmış otel verisi:', formatted);
          
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
          console.error('Geçersiz yanıt yapısı:', response);
          setError('Otel detayları bulunamadı');
        }
      } catch (err) {
        console.error('Otel detaylarını alırken hata:', err);
        setError('Otel detayları yüklenirken bir hata oluştu: ' + err.message);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchHotelDetails();
    }
  }, [id]);

  // Sayfa mount olduğunda en yukarıya git
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Teklifleri gör fonksiyonu - sayfayı teklifler kısmına kaydırır
  const scrollToOffers = () => {
    if (offersRef.current) {
      offersRef.current.scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
      });
    }
  };

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

  // Açıklamayı kırpma fonksiyonu
  const getTruncatedDescription = (text, maxLength = 300) => {
    if (!text || text.length <= maxLength) return text;
    
    const truncated = text.substr(0, maxLength);
    const lastSpace = truncated.lastIndexOf(' ');
    return truncated.substr(0, lastSpace) + '...';
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

  const openFacilitiesModal = () => {
    setShowFacilitiesModal(true);
  };

  const closeFacilitiesModal = () => {
    setShowFacilitiesModal(false);
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
          <h2>Otel Bulunamadı</h2>
          <p>Aradığınız otel bulunamadı.</p>
          <button onClick={() => navigate(-1)}>Geri Dön</button>
        </div>
      </div>
    );
  }

  return (
    <div className="hotel-detail-page">
      <div className="hotel-detail-container">
        {/* Profesyonel Başlık */}
        <div className="hotel-header">
          <div className="hotel-title-section">
            <h1>{formattedHotel.name}</h1>
            <div className="hotel-rating-location">
              <div className="rating-stars">
                {hotelDetailsService.getCategoryStars(formattedHotel.categoryCode)}
              </div>
              <div className="location-info">
                <span className="location-icon">•</span>
                <span className="location-text">
                  {formattedHotel.location.name}, {formattedHotel.location.city}
                </span>
              </div>
            </div>
          </div>
          <div className="hotel-actions">
            <button 
              className="view-offers-btn"
              onClick={scrollToOffers}
            >
              Teklifleri Gör
            </button>
          </div>
        </div>

        {/* Profesyonel Fotoğraf Galerisi */}
        <div className="photo-gallery">
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
                Tüm Fotoğrafları Gör ({allImages.length})
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
                    <span>+{allImages.length - 5} fotoğraf daha</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Profesyonel İçerik Düzeni */}
        <div className="hotel-content">
          <div className="main-content">
            {/* Açıklama Bölümü */}
            <div className="content-section">
              <h2>Bu Otel Hakkında</h2>
              <div className="description-container">
                <div className={`description-wrapper ${!showFullDescription ? 'collapsed' : ''}`}>
                  <p className="description-text">
                    {showFullDescription 
                      ? formattedHotel.description 
                      : getTruncatedDescription(formattedHotel.description, 280)
                    }
                  </p>
                </div>
                
                {formattedHotel.description && formattedHotel.description.length > 280 && (
                  <button 
                    className="show-more-btn"
                    onClick={() => setShowFullDescription(!showFullDescription)}
                  >
                    {showFullDescription ? 'Daha Az Göster' : 'Devamını Oku'}
                  </button>
                )}
              </div>
            </div>

            {/* Olanaklar Bölümü - Kompakt Versiyon */}
            {formattedHotel.facilities.length > 0 && (
              <div className="content-section">
                <h2>Otel Olanakları</h2>
                <div className="facilities-grid">
                  {formattedHotel.facilities.slice(0, 2).map((category, index) => (
                    <div key={index} className="facility-category">
                      <h3>{category.name}</h3>
                      <ul className="facility-list">
                        {category.facilities.slice(0, 6).map((facility, facilityIndex) => (
                          <li key={facilityIndex} className="facility-item">
                            <span className="facility-check">✓</span>
                            <span className="facility-name">{facility.name}</span>
                            {facility.isPriced && (
                              <span className="facility-price">Ücretli</span>
                            )}
                          </li>
                        ))}
                        {category.facilities.length > 6 && (
                          <li className="more-facilities-item">
                            <span className="more-facilities-text">
                              +{category.facilities.length - 6} olanak daha
                            </span>
                          </li>
                        )}
                      </ul>
                    </div>
                  ))}
                </div>
                
                {(formattedHotel.facilities.length > 2 || 
                  formattedHotel.facilities.some(cat => cat.facilities.length > 6)) && (
                  <div className="show-more-facilities">
                    <button 
                      className="show-more-btn"
                      onClick={openFacilitiesModal}
                    >
                      Tüm Olanakları Göster
                    </button>
                  </div>
                )}
              </div>
            )}

            {formattedHotel.facilities.length === 0 && (
              <div className="content-section">
                <h2>Otel Olanakları</h2>
                <div className="no-facilities-message">
                  <p>Bu otel için olanak bilgisi mevcut değil. Daha fazla bilgi için lütfen otel ile direkt iletişime geçin.</p>
                </div>
              </div>
            )}
          </div>

          <div className="sidebar-content">
            {/* Konum Kartı */}
            <div className="info-card">
              <h3>Konum</h3>
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

            {/* İletişim Kartı */}
            <div className="info-card">
              <h3>İletişim Bilgileri</h3>
              <div className="contact-details">
                <p><strong>Telefon:</strong> {formattedHotel.contact.phone}</p>
                <p><strong>Faks:</strong> {formattedHotel.contact.fax}</p>
                {formattedHotel.contact.website && (
                  <p><strong>Website:</strong> 
                    <a href={formattedHotel.contact.website} target="_blank" rel="noopener noreferrer">
                      Web Sitesini Ziyaret Et
                    </a>
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Offers Component - Ref ekledik */}
        <div ref={offersRef}>
          <HotelOffers 
            hotelId={id}
            searchData={searchData}
            hotel={hotel}
          />
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

        {/* Facilities Modal */}
        {showFacilitiesModal && (
          <div className="facilities-modal-overlay" onClick={closeFacilitiesModal}>
            <div className="facilities-modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="facilities-modal-header">
                <h2>Tüm Otel Olanakları</h2>
                <button className="facilities-modal-close" onClick={closeFacilitiesModal}>×</button>
              </div>
              
              <div className="facilities-modal-body">
                <div className="facilities-modal-grid">
                  {formattedHotel.facilities.map((category, index) => (
                    <div key={index} className="facilities-modal-category">
                      <h3>{category.name}</h3>
                      <ul className="facilities-modal-list">
                        {category.facilities.map((facility, facilityIndex) => (
                          <li key={facilityIndex} className="facilities-modal-item">
                            <span className="facilities-modal-check">✓</span>
                            <span className="facilities-modal-name">{facility.name}</span>
                            {facility.isPriced && (
                              <span className="facilities-modal-price">Ücretli</span>
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="facilities-modal-footer">
                <button className="facilities-modal-close-btn" onClick={closeFacilitiesModal}>
                  Kapat
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default HotelDetailPage;