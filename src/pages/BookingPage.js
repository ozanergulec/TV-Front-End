import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import bookingService from '../services/bookingService';
import BookingSteps from '../components/BookingSteps';
import BookingSummary from '../components/BookingSummary';
import TravellerForm from '../components/TravellerForm';
import LoadingSpinner from '../components/LoadingSpinner';
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
                <div className="step-panel">
                  <h3>İletişim Bilgileri</h3>
                  <p>Bu aşamada iletişim bilgileri formu gelecek.</p>
                  <p>Toplam Yolcu: {formTravellers.length}</p>
                  
                  <div className="step-actions">
                    <button 
                      onClick={() => goToStep(1)}
                      className="prev-btn"
                    >
                      Geri
                    </button>
                    <button 
                      onClick={() => goToStep(3)}
                      className="next-btn"
                    >
                      Devam Et
                    </button>
                  </div>
                </div>
              )}
              
              {currentStep === 3 && (
                <div className="step-panel">
                  <h3>Ödeme Bilgileri</h3>
                  <p>Bu aşamada ödeme formu gelecek.</p>
                  
                  <div className="step-actions">
                    <button 
                      onClick={() => goToStep(2)}
                      className="prev-btn"
                    >
                      Geri
                    </button>
                    <button 
                      onClick={() => goToStep(4)}
                      className="next-btn"
                    >
                      Devam Et
                    </button>
                  </div>
                </div>
              )}
              
              {currentStep === 4 && (
                <div className="step-panel">
                  <h3>Rezervasyon Onayı</h3>
                  <p>Bu aşamada rezervasyon onayı gelecek.</p>
                  
                  <div className="step-actions">
                    <button 
                      onClick={() => goToStep(3)}
                      className="prev-btn"
                    >
                      Geri
                    </button>
                    <button 
                      className="complete-btn"
                      onClick={() => alert('Rezervasyon tamamlandı!')}
                    >
                      Rezervasyonu Tamamla
                    </button>
                  </div>
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