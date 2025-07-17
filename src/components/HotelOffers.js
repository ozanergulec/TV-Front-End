import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import hotelDetailsService from '../services/hotelDetailsService';
import LoadingSpinner from './LoadingSpinner';
import OfferDetailsModal from './OfferDetailsModal';
import '../styles/HotelOffers.css';

function HotelOffers({ hotelId, searchData, hotel }) {
  const navigate = useNavigate();
  
  const [offers, setOffers] = useState([]);
  const [offersLoading, setOffersLoading] = useState(false);
  const [offersError, setOffersError] = useState(null);
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedOfferId, setSelectedOfferId] = useState(null);

  // Offers fetch function
  const fetchOffers = async () => {
    try {
      setOffersLoading(true);
      setOffersError(null);
      
      console.log('🔍 Fetching offers...');
      console.log('Hotel ID:', hotelId);
      console.log('Search Data:', searchData);
      
      // Gerekli bilgileri kontrol et
      if (!searchData?.searchId) {
        throw new Error('searchId bulunamadı. Lütfen arama sayfasından tekrar deneyin.');
      }
      
      if (!hotelId) {
        throw new Error('Hotel ID bulunamadı.');
      }
      
      const response = await hotelDetailsService.getOffers(hotelId, searchData);
      
      if (response?.header?.success && response?.body?.offers) {
        console.log('🔍 Raw API Response:', response);
        console.log('🔍 Raw Offers:', response.body.offers);
        
        const formattedOffers = hotelDetailsService.formatOffers(response);
        console.log('✅ Formatlanmış teklifler:', formattedOffers);
        setOffers(formattedOffers);
      } else {
        console.error('❌ Teklifler alınamadı:', response);
        const errorMessage = response?.header?.messages?.[0]?.message || 'Bu otel için teklifler bulunamadı';
        setOffersError(errorMessage);
      }
    } catch (err) {
      console.error('❌ Teklifleri alırken hata:', err);
      setOffersError(err.message || 'Teklifler yüklenirken bir hata oluştu');
    } finally {
      setOffersLoading(false);
    }
  };

  // Offers'ı fetch et (component mount olduğunda)
  useEffect(() => {
    if (hotelId && searchData) {
      fetchOffers();
    }
  }, [hotelId, searchData]);

  // Offers render function
  const renderOffers = () => {
    if (offersLoading) {
      return (
        <div className="offers-loading">
          <LoadingSpinner message="Teklifler yükleniyor..." />
        </div>
      );
    }

    if (offersError) {
      return (
        <div className="offers-error">
          <h3>Teklifler Yüklenemedi</h3>
          <p>{offersError}</p>
          <button onClick={fetchOffers} className="retry-btn">
            Tekrar Dene
          </button>
        </div>
      );
    }

    if (offers.length === 0) {
      return (
        <div className="no-offers">
          <h3>Teklif Bulunamadı</h3>
          <p>Bu otel için şu anda uygun teklif bulunmamaktadır.</p>
        </div>
      );
    }

    return (
      <div className="offers-container">
        {offers.map((offer) => (
          <div key={offer.id} className="offer-card">
            <div className="offer-header">
              <div className="offer-dates">
                <span className="date-label">Giriş Tarihi</span>
                <span className="date-value">
                  {new Date(offer.checkIn).toLocaleDateString('tr-TR', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric'
                  })}
                </span>
              </div>
              
              <div className="offer-dates">
                <span className="date-label">Çıkış Tarihi</span>
                <span className="date-value">
                  {new Date(offer.checkOut).toLocaleDateString('tr-TR', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric'
                  })}
                </span>
                <span className="nights">{offer.nights} Gece</span>
              </div>
              
              <div className="offer-status">
                <span className={`availability-badge ${offer.isAvailable ? 'available' : 'unavailable'}`}>
                  {offer.isAvailable ? 'Müsait' : 'Dolu'}
                </span>
                {offer.isRefundable && (
                  <span className="refundable-badge">İade Edilebilir</span>
                )}
              </div>
              
              <div className="offer-price">
                <span className="price-amount">
                  {offer.price.amount.toFixed(0)} {offer.price.currency}
                </span>
                <span className="price-total">Toplam Fiyat</span>
                <span className="price-per-night">
                  ({(offer.price.amount / offer.nights).toFixed(0)} {offer.price.currency} / gece)
                </span>
              </div>
            </div>
            
            <div className="offer-details">
              <div className="offer-rooms">
                <h4>Oda Seçenekleri</h4>
                <table className="room-options-table">
                  <thead>
                    <tr>
                      <th>Oda Tipi</th>
                      <th>Pansiyon</th>
                    </tr>
                  </thead>
                  <tbody>
                    {offer.rooms.map((room, index) => (
                      <tr key={index}>
                        <td>
                          <div className="room-name">{room.name}</div>
                          <div className="room-board">{room.accommodation}</div>
                        </td>
                        <td>
                          <span className="room-board">{room.boardType}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            
            <div className="offer-actions">
              <div className="offer-info">
                {offer.availability > 0 && (
                  <span>Son {offer.availability} oda • </span>
                )}
                <span>
                  Geçerlilik: {new Date(offer.expiresOn).toLocaleDateString('tr-TR')}
                </span>
              </div>
              <div className="offer-buttons">
                <button 
                  className="details-btn"
                  onClick={() => openDetailsModal(offer.id)}
                >
                  Detayları Gör
                </button>
                <button 
                  className="select-offer-btn"
                  onClick={() => navigate('/booking', { 
                    state: { hotel, searchData, selectedOffer: offer } 
                  })}
                  disabled={!offer.isAvailable}
                >
                  Bu Teklifi Seç
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  // Modal açma fonksiyonu
  const openDetailsModal = (offerId) => {
    setSelectedOfferId(offerId);
    setIsModalOpen(true);
  };

  // Modal kapatma fonksiyonu
  const closeDetailsModal = () => {
    setIsModalOpen(false);
    setSelectedOfferId(null);
  };

  return (
    <div className="hotel-offers-section">
      <h2>Mevcut Teklifler</h2>
      {renderOffers()}
      
      {/* Offer Details Modal */}
      <OfferDetailsModal 
        isOpen={isModalOpen}
        onClose={closeDetailsModal}
        offerId={selectedOfferId}
        currency={searchData?.currency || 'EUR'}
        hotel={hotel}
        searchData={searchData}
      />
    </div>
  );
}

export default HotelOffers;