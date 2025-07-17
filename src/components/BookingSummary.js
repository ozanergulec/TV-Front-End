import React from 'react';
import '../styles/BookingSummary.css';

function BookingSummary({ offer, hotel, searchData, transactionData }) {
  if (!offer || !hotel) return null;

  return (
    <div className="booking-summary">
      <h3 className="summary-title">Rezervasyon Özeti</h3>
      
      <div className="summary-section">
        <h4>Otel Bilgileri</h4>
        <div className="hotel-info">
          <h5>{hotel.name}</h5>
          <p className="hotel-location">{hotel.location}</p>
          <div className="hotel-rating">
            {hotel.rating && (
              <span className="rating">⭐ {hotel.rating}</span>
            )}
          </div>
        </div>
      </div>
      
      <div className="summary-section">
        <h4>Tarih Bilgileri</h4>
        <div className="date-info">
          <div className="date-item">
            <span className="date-label">Giriş:</span>
            <span className="date-value">
              {new Date(offer.checkIn).toLocaleDateString('tr-TR', {
                day: '2-digit',
                month: 'long',
                year: 'numeric'
              })}
            </span>
          </div>
          <div className="date-item">
            <span className="date-label">Çıkış:</span>
            <span className="date-value">
              {new Date(offer.checkOut).toLocaleDateString('tr-TR', {
                day: '2-digit',
                month: 'long',
                year: 'numeric'
              })}
            </span>
          </div>
          <div className="date-item">
            <span className="date-label">Gece:</span>
            <span className="date-value">{offer.nights} gece</span>
          </div>
        </div>
      </div>
      
      <div className="summary-section">
        <h4>Oda Bilgileri</h4>
        <div className="room-info">
          {offer.rooms && offer.rooms.map((room, index) => (
            <div key={index} className="room-item">
              <div className="room-name">{room.name}</div>
              <div className="room-details">
                <span className="room-accommodation">{room.accommodation}</span>
                <span className="room-board">{room.boardType}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      <div className="summary-section">
        <h4>Misafir Bilgileri</h4>
        <div className="guest-info">
          <div className="guest-item">
            <span className="guest-label">Yetişkin:</span>
            <span className="guest-value">{searchData?.adult || 1}</span>
          </div>
          {searchData?.child > 0 && (
            <div className="guest-item">
              <span className="guest-label">Çocuk:</span>
              <span className="guest-value">{searchData.child}</span>
            </div>
          )}
          {searchData?.room > 1 && (
            <div className="guest-item">
              <span className="guest-label">Oda:</span>
              <span className="guest-value">{searchData.room}</span>
            </div>
          )}
        </div>
      </div>
      
      <div className="summary-section price-section">
        <h4>Fiyat Bilgileri</h4>
        <div className="price-breakdown">
          <div className="price-item">
            <span className="price-label">Temel Fiyat:</span>
            <span className="price-value">
              {offer.price.amount.toFixed(0)} {offer.price.currency}
            </span>
          </div>
          
          {offer.price.oldAmount && offer.price.oldAmount > offer.price.amount && (
            <>
              <div className="price-item discount">
                <span className="price-label">İndirim:</span>
                <span className="price-value saving">
                  -{(offer.price.oldAmount - offer.price.amount).toFixed(0)} {offer.price.currency}
                </span>
              </div>
            </>
          )}
          
          <div className="price-item total">
            <span className="price-label">Toplam Ödeme:</span>
            <span className="price-value">
              {offer.price.amount.toFixed(0)} {offer.price.currency}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default BookingSummary;