import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import bookingService from '../services/bookingService';
import BookingSteps from '../components/BookingSteps';
import BookingSummary from '../components/BookingSummary';
import TravellerForm from '../components/TravellerForm';
import LoadingSpinner from '../components/LoadingSpinner';
import ContactForm from '../components/ContactForm';
import '../styles/BookingPage.css';

function BookingPage() {
  const location = useLocation();
  const navigate = useNavigate();
  
  // State'den gelen veriler
  const { hotel, searchData, selectedOffer } = location.state || {};
  
  // Component state'leri
  const [currentStep, setCurrentStep] = useState(1);
  const [transactionData, setTransactionData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [travellers, setTravellers] = useState([]);
  const [formTravellers, setFormTravellers] = useState([]);
  const [contactInfo, setContactInfo] = useState(null);
  const [paymentCompleted, setPaymentCompleted] = useState(false);
  const [reservationNumber, setReservationNumber] = useState('');

  // Sayfa yüklendiğinde transaction başlat
  useEffect(() => {
    if (selectedOffer && !transactionData) {
      beginTransaction();
    }
  }, [selectedOffer, transactionData]);

  // Gerekli veriler yoksa ana sayfaya yönlendir
  useEffect(() => {
    if (!hotel || !searchData || !selectedOffer) {
      navigate('/');
    }
  }, [hotel, searchData, selectedOffer, navigate]);

  // Transaction başlatma
  const beginTransaction = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔄 Transaction başlatılıyor...');
      console.log('Offer ID:', selectedOffer.id);
      console.log('Currency:', searchData.currency);
      
      const response = await bookingService.beginTransactionWithOffer(
        [selectedOffer.id],
        searchData.currency || 'EUR',
        'tr-TR'
      );
      
      console.log('✅ Transaction başlatıldı:', response);
      
      if (response.header.success) {
        setTransactionData({
          transactionId: response.body.transactionId,
          expiresOn: response.body.expiresOn,
          status: response.body.status
        });
        
        // API'den gelen boş yolcu şablonlarını set et
        if (response.body.reservationData?.travellers) {
          setTravellers(response.body.reservationData.travellers);
        }
        
        console.log('📄 Yolcu şablonları:', response.body.reservationData?.travellers);
      } else {
        throw new Error(response.header.messages?.[0]?.message || 'Transaction başlatılamadı');
      }
    } catch (err) {
      console.error('❌ Transaction başlatma hatası:', err);
      setError(err.message || 'Transaction başlatılırken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  // Yolcu bilgilerini güncelle
  const handleTravellersChange = (updatedTravellers) => {
    setFormTravellers(updatedTravellers);
    console.log('✅ Yolcu bilgileri güncellendi:', updatedTravellers);
  };

  // İletişim bilgilerini güncelle
  const handleContactInfoChange = (updatedContactInfo) => {
    setContactInfo(updatedContactInfo);
    console.log('✅ İletişim bilgileri güncellendi:', updatedContactInfo);
  };

  // Dummy ödeme işlemi
  const handlePayment = () => {
    setPaymentCompleted(true);
    // Dummy rezervasyon numarası oluştur
    const randomNumber = Math.random().toString(36).substr(2, 9).toUpperCase();
    setReservationNumber(`RES-${randomNumber}`);
  };

  // Adım değiştirme
  const goToStep = (step) => {
    setCurrentStep(step);
  };

  // Ana sayfa yönlendirme
  const handleBackToHome = () => {
    navigate('/');
  };

  if (loading) {
    return (
      <div className="booking-page">
        <div className="booking-container">
          <div className="booking-loading">
            <LoadingSpinner message="Rezervasyon hazırlanıyor..." />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="booking-page">
        <div className="booking-container">
          <div className="booking-error">
            <h2>Hata</h2>
            <p>{error}</p>
            <div className="error-actions">
              <button onClick={beginTransaction} className="retry-btn">
                Tekrar Dene
              </button>
              <button onClick={handleBackToHome} className="back-btn">
                Ana Sayfaya Dön
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!hotel || !searchData || !selectedOffer) {
    return (
      <div className="booking-page">
        <div className="booking-container">
          <div className="booking-error">
            <h2>Eksik Bilgi</h2>
            <p>Rezervasyon yapmak için gerekli bilgiler eksik.</p>
            <button onClick={handleBackToHome} className="back-btn">
              Ana Sayfaya Dön
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="booking-page">
      <div className="booking-container">
        <div className="booking-header">
          <h1>Rezervasyon</h1>
          <button onClick={handleBackToHome} className="back-to-home">
            ← Ana Sayfa
          </button>
        </div>
        
        <BookingSteps currentStep={currentStep} />
        
        <div className="booking-content">
          <div className="booking-main">
            <div className="booking-step-content">
              {currentStep === 1 && (
                <TravellerForm
                  travellers={travellers}
                  onTravellersChange={handleTravellersChange}
                  onNext={() => goToStep(2)}
                />
              )}
              
              {currentStep === 2 && (
                <ContactForm
                  travellers={formTravellers}
                  onContactInfoChange={handleContactInfoChange}
                  onNext={() => goToStep(3)}
                  onBack={() => goToStep(1)}
                />
              )}
              
              {currentStep === 3 && (
                <div className="payment-completion">
                  {!paymentCompleted ? (
                    <div className="payment-section">
                      <h3>Ödeme Bilgileri</h3>
                      
                      <div className="payment-summary">
                        <h4>Rezervasyon Özeti:</h4>
                        <div className="summary-grid">
                          <div className="summary-item">
                            <strong>Otel:</strong> {hotel?.name}
                          </div>
                          <div className="summary-item">
                            <strong>Toplam Yolcu:</strong> {formTravellers.length}
                          </div>
                          {contactInfo && (
                            <>
                              <div className="summary-item">
                                <strong>İletişim Email:</strong> {contactInfo.primaryContact.email}
                              </div>
                              <div className="summary-item">
                                <strong>İletişim Telefon:</strong> {contactInfo.primaryContact.phone}
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                      
                      <div className="step-actions">
                        <button 
                          onClick={() => goToStep(2)}
                          className="prev-btn"
                        >
                          Geri
                        </button>
                        <button 
                          onClick={handlePayment}
                          className="payment-btn"
                        >
                          Ödeme Yap
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="payment-success">
                      <div className="success-icon">
                        <div className="checkmark">✓</div>
                      </div>
                      
                      <h3>Rezervasyon Başarıyla Tamamlandı!</h3>
                      <p>Rezervasyonunuz başarıyla oluşturuldu. Rezervasyon detaylarınız aşağıda yer almaktadır.</p>
                      
                      <div className="reservation-details">
                        <div className="detail-card">
                          <h4>Rezervasyon Bilgileri</h4>
                          <div className="detail-grid">
                            <div className="detail-item">
                              <strong>Rezervasyon Numarası:</strong>
                              <span className="reservation-number">{reservationNumber}</span>
                            </div>
                            <div className="detail-item">
                              <strong>Otel:</strong>
                              <span>{hotel?.name}</span>
                            </div>
                            <div className="detail-item">
                              <strong>Toplam Yolcu:</strong>
                              <span>{formTravellers.length} kişi</span>
                            </div>
                            <div className="detail-item">
                              <strong>Rezervasyon Tarihi:</strong>
                              <span>{new Date().toLocaleDateString('tr-TR')}</span>
                            </div>
                          </div>
                        </div>
                        
                        {contactInfo && (
                          <div className="detail-card">
                            <h4>İletişim Bilgileri</h4>
                            <div className="detail-grid">
                              <div className="detail-item">
                                <strong>Email:</strong>
                                <span>{contactInfo.primaryContact.email}</span>
                              </div>
                              <div className="detail-item">
                                <strong>Telefon:</strong>
                                <span>{contactInfo.primaryContact.phone}</span>
                              </div>
                              <div className="detail-item">
                                <strong>Adres:</strong>
                                <span>{contactInfo.primaryContact.address}</span>
                              </div>
                              <div className="detail-item">
                                <strong>Şehir:</strong>
                                <span>{contactInfo.primaryContact.city}</span>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                      
                      <div className="success-actions">
                        <button 
                          onClick={handleBackToHome}
                          className="home-btn"
                        >
                          Ana Sayfa
                        </button>
                        <button 
                          onClick={() => window.print()}
                          className="print-btn"
                        >
                          Yazdır
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
          
          <div className="booking-sidebar">
            <BookingSummary 
              offer={selectedOffer}
              hotel={hotel}
              searchData={searchData}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default BookingPage;