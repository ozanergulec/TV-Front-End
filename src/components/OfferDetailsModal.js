import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import hotelDetailsService from '../services/hotelDetailsService';
import LoadingSpinner from './LoadingSpinner';
import '../styles/OfferDetailsModal.css';

function OfferDetailsModal({ isOpen, onClose, offerId, currency = "EUR", hotel, searchData }) {
  const navigate = useNavigate();
  const [offerDetails, setOfferDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Teklif detaylarını fetch et
  const fetchOfferDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔍 Fetching offer details for ID:', offerId);
      
      const response = await hotelDetailsService.getOfferDetails(offerId, currency);
      
      if (response?.header?.success && response?.body?.offerDetails) {
        const formatted = hotelDetailsService.formatOfferDetails(response);
        console.log('✅ Formatted offer details:', formatted);
        setOfferDetails(formatted);
      } else {
        console.error('❌ Offer details alınamadı:', response);
        setError('Teklif detayları bulunamadı');
      }
    } catch (err) {
      console.error('❌ Offer details fetch error:', err);
      setError('Teklif detayları yüklenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  // Modal açıldığında detayları fetch et
  useEffect(() => {
    if (isOpen && offerId) {
      fetchOfferDetails();
    }
  }, [isOpen, offerId]);

  // Modal kapatıldığında state'i temizle
  useEffect(() => {
    if (!isOpen) {
      setOfferDetails(null);
      setError(null);
    }
  }, [isOpen]);

  // Body scroll'unu control et
  useEffect(() => {
    if (isOpen) {
      // Modal açıldığında body scroll'unu disable et
      document.body.style.overflow = 'hidden';
      document.body.style.paddingRight = '0px'; // Scrollbar padding'i kaldır
      
      // Bir de html element'ini de disable et (bazı browser'lar için)
      document.documentElement.style.overflow = 'hidden';
    } else {
      // Modal kapandığında body scroll'unu enable et
      document.body.style.overflow = 'auto';
      document.body.style.paddingRight = '';
      document.documentElement.style.overflow = 'auto';
    }

    // Cleanup function - component unmount olduğunda scroll'u restore et
    return () => {
      document.body.style.overflow = 'auto';
      document.body.style.paddingRight = '';
      document.documentElement.style.overflow = 'auto';
    };
  }, [isOpen]);

  // ESC tuşu ile modal'ı kapat
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, onClose]);

  // Booking page'e yönlendirme fonksiyonu
  const handleSelectOffer = () => {
    if (offerDetails && hotel && searchData) {
      navigate('/booking', { 
        state: { 
          hotel, 
          searchData, 
          selectedOffer: {
            id: offerId,
            ...offerDetails
          }
        } 
      });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="offer-details-modal-overlay" onClick={onClose}>
      <div className="offer-details-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Teklif Detayları</h2>
          <button className="modal-close-btn" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="modal-content">
          {loading && (
            <div className="modal-loading">
              <LoadingSpinner message="Detaylar yükleniyor..." />
            </div>
          )}

          {error && (
            <div className="modal-error">
              <p>{error}</p>
              <button onClick={fetchOfferDetails} className="retry-btn">
                Tekrar Dene
              </button>
            </div>
          )}

          {offerDetails && (
            <div className="offer-details-content">
              {/* Üst Bilgi Bölümü */}
              <div className="offer-header">
                <div className="offer-dates">
                  <div className="date-range">
                    <span className="date-item">
                      <strong>{new Date(offerDetails.checkIn).toLocaleDateString('tr-TR', {
                        day: '2-digit',
                        month: 'long',
                        year: 'numeric'
                      })}</strong>
                    </span>
                    <span className="date-separator">→</span>
                    <span className="date-item">
                      <strong>{new Date(offerDetails.checkOut).toLocaleDateString('tr-TR', {
                        day: '2-digit',
                        month: 'long',
                        year: 'numeric'
                      })}</strong>
                    </span>
                  </div>
                  <div className="status-badges">
                    <span className={`badge ${offerDetails.isAvailable ? 'available' : 'unavailable'}`}>
                      {offerDetails.isAvailable ? 'Müsait' : 'Müsait Değil'}
                    </span>
                    {offerDetails.reservableInfo?.reservable && (
                      <span className="badge reservable">
                        Rezerve Edilebilir
                      </span>
                    )}
                    {offerDetails.isRefundable && (
                      <span className="badge refundable">İade Edilebilir</span>
                    )}
                    {offerDetails.isSpecial && (
                      <span className="badge special">Özel Teklif</span>
                    )}
                  </div>
                </div>

                <div className="offer-price">
                  <div className="price-main">
                    <span className="amount">{offerDetails.price.amount.toFixed(0)}</span>
                    <span className="currency">{offerDetails.price.currency}</span>
                  </div>
                  {offerDetails.price.oldAmount && offerDetails.price.oldAmount > offerDetails.price.amount && (
                    <div className="price-old">
                      <span className="old-amount">{offerDetails.price.oldAmount.toFixed(0)} {offerDetails.price.currency}</span>
                      {offerDetails.price.percent > 0 && (
                        <span className="discount">%{offerDetails.price.percent.toFixed(0)} İndirim</span>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* İki Sütunlu Detay Bilgileri */}
              <div className="details-container">
                <div className="details-column">
                  <h4>Rezervasyon Bilgileri</h4>
                  <div className="info-table">
                    <div className="info-row">
                      <span className="label">Geçerlilik Tarihi</span>
                      <span className="value">
                        {new Date(offerDetails.expiresOn).toLocaleDateString('tr-TR', {
                          day: '2-digit',
                          month: 'long',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                    
                    {offerDetails.availability > 0 && (
                      <div className="info-row">
                        <span className="label">Kalan Oda</span>
                        <span className="value highlight">{offerDetails.availability} oda</span>
                      </div>
                    )}
                    
                    <div className="info-row">
                      <span className="label">Rezervasyon Durumu</span>
                      <span className={`value ${offerDetails.reservableInfo?.reservable ? 'positive' : 'negative'}`}>
                        {offerDetails.reservableInfo?.reservable ? 'Aktif' : 'Pasif'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="details-column">
                  <h4>Fiyat Bilgileri</h4>
                  <div className="info-table">
                    <div className="info-row">
                      <span className="label">Temel Fiyat</span>
                      <span className="value">{offerDetails.price.amount.toFixed(0)} {offerDetails.price.currency}</span>
                    </div>
                    
                    {offerDetails.price.oldAmount && offerDetails.price.oldAmount > offerDetails.price.amount && (
                      <>
                        <div className="info-row">
                          <span className="label">Liste Fiyatı</span>
                          <span className="value old">{offerDetails.price.oldAmount.toFixed(0)} {offerDetails.price.currency}</span>
                        </div>
                        <div className="info-row">
                          <span className="label">Tasarruf</span>
                          <span className="value saving">
                            {(offerDetails.price.oldAmount - offerDetails.price.amount).toFixed(0)} {offerDetails.price.currency}
                          </span>
                        </div>
                      </>
                    )}
                    
                    <div className="info-row total">
                      <span className="label">Toplam Ödeme</span>
                      <span className="value">{offerDetails.price.amount.toFixed(0)} {offerDetails.price.currency}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* İptal Politikaları */}
              {offerDetails.cancellationPolicies && offerDetails.cancellationPolicies.length > 0 && (
                <div className="cancellation-section">
                  <h4>İptal Politikaları</h4>
                  <div className="cancellation-list">
                    {offerDetails.cancellationPolicies.map((policy, index) => (
                      <div key={index} className="cancellation-item">
                        <div className="cancellation-info">
                          <span className="period">
                            {new Date(policy.beginDate).toLocaleDateString('tr-TR', {
                              day: '2-digit',
                              month: 'short'
                            })} - {new Date(policy.dueDate).toLocaleDateString('tr-TR', {
                              day: '2-digit',
                              month: 'short'
                            })}
                          </span>
                          <span className="fee">
                            {policy.price.amount.toFixed(0)} {policy.price.currency} iptal bedeli
                          </span>
                        </div>
                        {policy.roomNumber && (
                          <div className="room-note">Oda {policy.roomNumber}</div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="modal-close-footer-btn" onClick={onClose}>
            Kapat
          </button>
          {offerDetails && offerDetails.isAvailable && (
            <button 
              className="select-offer-modal-btn" 
              onClick={handleSelectOffer}
            >
              Bu Teklifi Seç
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default OfferDetailsModal;