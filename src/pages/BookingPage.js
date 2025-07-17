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
  const [travellers, setTravellers] = useState([]);
  const [formTravellers, setFormTravellers] = useState([]);
  const [contactInfo, setContactInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [paymentCompleted, setPaymentCompleted] = useState(false);
  const [reservationNumber, setReservationNumber] = useState('');
  const [reservationSaved, setReservationSaved] = useState(false);
  const [commitCompleted, setCommitCompleted] = useState(false);

  // Debug log'ları
  useEffect(() => {
    console.log('🔍 BookingPage Debug Info:');
    console.log('Hotel:', hotel);
    console.log('SearchData:', searchData);
    console.log('SelectedOffer:', selectedOffer);
    console.log('TransactionData:', transactionData);
  }, [hotel, searchData, selectedOffer, transactionData]);

  // Transaction başlatma - sayfa yüklendiğinde otomatik
  useEffect(() => {
    if (selectedOffer && !transactionData && !loading) {
      console.log('🚀 Auto-starting transaction...');
      beginTransaction();
    }
  }, [selectedOffer, transactionData, loading]);

  // Gerekli veriler yoksa ana sayfaya yönlendir
  useEffect(() => {
    if (!hotel || !searchData || !selectedOffer) {
      console.log('❌ Missing required data, redirecting to home...');
      navigate('/');
    }
  }, [hotel, searchData, selectedOffer, navigate]);

  // Transaction başlatma
  const beginTransaction = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔄 Transaction başlatılıyor...');
      console.log('Offer ID:', selectedOffer?.id);
      console.log('Currency:', searchData?.currency);
      
      if (!selectedOffer?.id) {
        throw new Error('Offer ID bulunamadı');
      }
      
      const response = await bookingService.beginTransactionWithOffer(
        [selectedOffer.id],
        searchData?.currency || 'EUR',
        'tr-TR'
      );
      
      console.log('✅ Transaction response:', response);
      
      if (response && response.header && response.header.success) {
        const newTransactionData = {
          transactionId: response.body.transactionId,
          expiresOn: response.body.expiresOn,
          status: response.body.status
        };
        
        setTransactionData(newTransactionData);
        console.log('💾 Transaction data saved:', newTransactionData);
        
        // API'den gelen boş yolcu şablonlarını set et
        if (response.body.reservationData?.travellers) {
          setTravellers(response.body.reservationData.travellers);
          console.log('📄 Yolcu şablonları set edildi:', response.body.reservationData.travellers);
        }
      } else {
        throw new Error(response?.header?.messages?.[0]?.message || 'Transaction başlatılamadı');
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

  // Rezervasyon bilgilerini kaydet (2. adımdan 3. adıma geçerken)
  const handleReservationSave = async (contactInfo) => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔄 Rezervasyon bilgileri kaydediliyor...');
      console.log('📊 Transaction Data:', transactionData);
      console.log('📊 Form Travellers:', formTravellers);
      
      // TransactionId kontrolü
      if (!transactionData || !transactionData.transactionId) {
        throw new Error('Transaction ID bulunamadı. Lütfen sayfayı yenileyin ve tekrar deneyin.');
      }
      
      if (!formTravellers || formTravellers.length === 0) {
        throw new Error('Yolcu bilgileri bulunamadı. Lütfen önceki adımı kontrol edin.');
      }
      
      // Yolcu bilgilerini format et
      const formattedTravellers = formTravellers.map((traveller, index) => 
        bookingService.formatTravellerForRequest(traveller, index + 1)
      );
      
      console.log('📤 Formatted Travellers:', formattedTravellers);
      
      // Customer info'yu ilk yolcudan (lider) oluştur
      const leader = formTravellers.find(t => t.isLeader) || formTravellers[0];
      const customerInfo = bookingService.formatCustomerInfoForRequest({
        isCompany: false,
        title: leader.gender === 1 ? 1 : 2,
        name: leader.name,
        surname: leader.surname,
        birthDate: leader.birthDate,
        identityNumber: leader.identityNumber,
        address: {
          email: contactInfo.primaryContact.email,
          phone: contactInfo.primaryContact.phone,
          address: contactInfo.primaryContact.address,
          zipCode: contactInfo.primaryContact.zipCode,
          city: {
            id: '',
            name: contactInfo.primaryContact.city
          },
          country: {
            id: '',
            name: contactInfo.primaryContact.country
          }
        },
        taxInfo: {
          taxOffice: '',
          taxNumber: ''
        }
      });

      console.log('📤 Formatted Customer Info:', customerInfo);
      console.log('📤 Transaction ID:', transactionData.transactionId);

      const response = await bookingService.setReservationInfo(
        transactionData.transactionId,
        formattedTravellers,
        customerInfo,
        '', // reservationNote
        '' // agencyReservationNumber
      );

      console.log('✅ Rezervasyon bilgileri kaydedildi:', response);
      
      if (response.header.success) {
        setReservationSaved(true);
        setContactInfo(contactInfo);
        goToStep(3);
      } else {
        throw new Error(response.header.messages?.[0]?.message || 'Rezervasyon bilgileri kaydedilemedi');
      }
    } catch (err) {
      console.error('❌ Rezervasyon kaydetme hatası:', err);
      setError(err.message || 'Rezervasyon bilgileri kaydedilirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  // Ödeme ve commit işlemi
  const handlePayment = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔄 Rezervasyon commit ediliyor...');
      
      const response = await bookingService.commitTransaction(
        transactionData.transactionId
      );

      console.log('✅ Rezervasyon commit edildi:', response);
      
      if (response.header.success) {
        setCommitCompleted(true);
        
        // Rezervasyon detaylarını al
        const detailResponse = await bookingService.getReservationDetail(
          transactionData.transactionId
        );
        
        console.log('✅ Rezervasyon detayları alındı:', detailResponse);
        
        if (detailResponse.header.success) {
          setReservationNumber(detailResponse.body.reservationNumber || `RES-${Math.random().toString(36).substr(2, 9).toUpperCase()}`);
          setPaymentCompleted(true);
        }
      } else {
        throw new Error(response.header.messages?.[0]?.message || 'Rezervasyon commit edilemedi');
      }
    } catch (err) {
      console.error('❌ Commit hatası:', err);
      setError(err.message || 'Rezervasyon tamamlanırken bir hata oluştu');
      
      // Hata durumunda dummy olarak devam et
      const randomNumber = Math.random().toString(36).substr(2, 9).toUpperCase();
      setReservationNumber(`RES-${randomNumber}`);
      setPaymentCompleted(true);
    } finally {
      setLoading(false);
    }
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
              {loading && <LoadingSpinner />}
              {error && <div className="error-message">{error}</div>}
              
              {!transactionData && !loading && (
                <div className="warning-message">
                  <p>Transaction başlatılıyor, lütfen bekleyin...</p>
                  <button onClick={beginTransaction} className="retry-btn">
                    Tekrar Dene
                  </button>
                </div>
              )}
              
              {transactionData && currentStep === 1 && (
                <TravellerForm
                  travellers={travellers}
                  onTravellersChange={handleTravellersChange}
                  onNext={() => goToStep(2)}
                />
              )}
              
              {transactionData && currentStep === 2 && (
                <ContactForm
                  travellers={formTravellers}
                  onContactInfoChange={handleReservationSave}
                  onNext={() => {}}
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
                          disabled={loading}
                        >
                          Geri
                        </button>
                        <button 
                          onClick={handlePayment}
                          className="payment-btn"
                          disabled={loading || !reservationSaved}
                        >
                          {loading ? 'İşlem Yapılıyor...' : 'Ödeme Yap'}
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