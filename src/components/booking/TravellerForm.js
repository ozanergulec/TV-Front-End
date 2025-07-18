import React, { useState, useEffect } from 'react';
import '../../styles/TravellerForm.css';

const COUNTRIES = [
  { code: 'TR', name: 'Türkiye' },
  { code: 'US', name: 'Amerika Birleşik Devletleri' },
  { code: 'DE', name: 'Almanya' },
  { code: 'GB', name: 'İngiltere' },
  { code: 'FR', name: 'Fransa' },
  { code: 'IT', name: 'İtalya' },
  { code: 'ES', name: 'İspanya' },
  { code: 'NL', name: 'Hollanda' },
  { code: 'BE', name: 'Belçika' },
  { code: 'AT', name: 'Avusturya' }
];

const COUNTRY_CODES = [
  { code: '+90', country: 'TR', name: 'Türkiye' },
  { code: '+1', country: 'US', name: 'Amerika' },
  { code: '+49', country: 'DE', name: 'Almanya' },
  { code: '+44', country: 'GB', name: 'İngiltere' },
  { code: '+33', country: 'FR', name: 'Fransa' },
  { code: '+39', country: 'IT', name: 'İtalya' },
  { code: '+34', country: 'ES', name: 'İspanya' },
  { code: '+31', country: 'NL', name: 'Hollanda' },
  { code: '+32', country: 'BE', name: 'Belçika' },
  { code: '+43', country: 'AT', name: 'Avusturya' }
];

// TC Kimlik doğrulama algoritması
const validateTCKimlik = (kimlik) => {
  if (!/^\d{11}$/.test(kimlik)) return false;
  
  const digits = kimlik.split('').map(Number);
  if (digits[0] === 0) return false;
  
  const sum1 = digits[0] + digits[2] + digits[4] + digits[6] + digits[8];
  const sum2 = digits[1] + digits[3] + digits[5] + digits[7];
  
  if (((sum1 * 7) - sum2) % 10 !== digits[9]) return false;
  if ((sum1 + sum2 + digits[9]) % 10 !== digits[10]) return false;
  
  return true;
};

function TravellerForm({ travellers, onTravellersChange, onNext }) {
  const [formData, setFormData] = useState([]);
  const [errors, setErrors] = useState({});

  // Travellers değiştiğinde form data'sını güncelle
  useEffect(() => {
    if (travellers && travellers.length > 0) {
      const initialData = travellers.map((traveller, index) => ({
        ...traveller,
        name: traveller.name || '',
        surname: traveller.surname || '',
        birthDate: formatDateForInput(traveller.birthDate),
        identityNumber: traveller.identityNumber || '',
        gender: traveller.gender || 1,
        passengerType: traveller.passengerType || 1, // Default yetişkin
        isLeader: index === 0, // İlk yolcu otomatik lider
        address: {
          email: traveller.address?.email || '',
          phone: traveller.address?.phone || '',
          countryCode: traveller.address?.countryCode || '+90',
          address: traveller.address?.address || '',
          zipCode: traveller.address?.zipCode || '',
          city: {
            id: traveller.address?.city?.id || '',
            name: traveller.address?.city?.name || ''
          },
          country: {
            id: traveller.address?.country?.id || '',
            name: traveller.address?.country?.name || ''
          }
        },
        nationality: {
          twoLetterCode: traveller.nationality?.twoLetterCode || 'TR'
        },
        passportInfo: {
          serial: traveller.passportInfo?.serial || '',
          number: traveller.passportInfo?.number || '',
          expireDate: formatDateForInput(traveller.passportInfo?.expireDate),
          issueDate: formatDateForInput(traveller.passportInfo?.issueDate),
          citizenshipCountryCode: traveller.passportInfo?.citizenshipCountryCode || 'TR'
        }
      }));
      setFormData(initialData);
    }
  }, [travellers]);

  // Tarih formatı güvenli dönüşüm
  const formatDateForInput = (dateString) => {
    if (!dateString) return '';
    
    if (dateString.includes('0000') || dateString.includes('1900')) {
      return '';
    }
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime()) || date.getFullYear() < 1900 || date.getFullYear() > 2100) {
        return '';
      }
      return date.toISOString().split('T')[0];
    } catch (error) {
      console.warn('Tarih formatı hatası:', dateString, error);
      return '';
    }
  };

  // Form alanı değişikliği
  const handleFieldChange = (travellerIndex, field, value) => {
    const newFormData = [...formData];
    
    // Özel işlemler
    if (field === 'address.phone') {
      // Telefon numarasını temizle (sadece rakam, boşluk, - ve () karakterleri)
      newFormData[travellerIndex].address.phone = value.replace(/[^\d\s\-\(\)]/g, '');
    } else if (field.includes('.')) {
      const [parentField, childField] = field.split('.');
      newFormData[travellerIndex][parentField][childField] = value;
    } else {
      newFormData[travellerIndex][field] = value;
    }
    
    setFormData(newFormData);
    
    // Real-time validation
    const newErrors = { ...errors };
    delete newErrors[`${travellerIndex}.${field}`];
    
    // Kimlik numarası validation
    if (field === 'identityNumber' && value && !validateTCKimlik(value)) {
      newErrors[`${travellerIndex}.${field}`] = 'Geçerli bir TC kimlik numarası girin';
    }
    
    setErrors(newErrors);
  };

  // Validation fonksiyonunu da güncelle
  const validateForm = () => {
    const newErrors = {};
    
    formData.forEach((traveller, index) => {
      // Zorunlu alanlar
      if (!traveller.name?.trim()) {
        newErrors[`${index}.name`] = 'Ad zorunludur';
      }
      if (!traveller.surname?.trim()) {
        newErrors[`${index}.surname`] = 'Soyad zorunludur';
      }
      if (!traveller.birthDate) {
        newErrors[`${index}.birthDate`] = 'Doğum tarihi zorunludur';
      } else {
        const birthDate = new Date(traveller.birthDate);
        const today = new Date();
        if (birthDate > today) {
          newErrors[`${index}.birthDate`] = 'Doğum tarihi gelecek tarih olamaz';
        }
        if (birthDate < new Date('1900-01-01')) {
          newErrors[`${index}.birthDate`] = 'Geçerli bir doğum tarihi girin';
        }
      }
      
      // Kimlik/Pasaport kontrolü
      if (traveller.nationality.twoLetterCode === 'TR') {
        if (!traveller.identityNumber?.trim()) {
          newErrors[`${index}.identityNumber`] = 'TC kimlik numarası zorunludur';
        } else if (!validateTCKimlik(traveller.identityNumber)) {
          newErrors[`${index}.identityNumber`] = 'Geçerli bir TC kimlik numarası girin';
        }
      } else {
        // Yabancı uyruklu için pasaport bilgileri
        if (!traveller.passportInfo.number?.trim()) {
          newErrors[`${index}.passportInfo.number`] = 'Pasaport numarası zorunludur';
        }
        if (!traveller.passportInfo.expireDate) {
          newErrors[`${index}.passportInfo.expireDate`] = 'Pasaport bitiş tarihi zorunludur';
        } else {
          const expireDate = new Date(traveller.passportInfo.expireDate);
          const today = new Date();
          if (expireDate <= today) {
            newErrors[`${index}.passportInfo.expireDate`] = 'Pasaport tarihi geçmiş olamaz';
          }
        }
      }
      
      // İlk yolcu (lider) için iletişim bilgileri
      if (index === 0) {
        if (!traveller.address?.email?.trim()) {
          newErrors[`${index}.address.email`] = 'Email zorunludur';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(traveller.address.email)) {
          newErrors[`${index}.address.email`] = 'Geçerli bir email adresi girin';
        }
        
        if (!traveller.address?.phone?.trim()) {
          newErrors[`${index}.address.phone`] = 'Telefon zorunludur';
        } else if (!/^[\d\s\-\(\)]{7,}$/.test(traveller.address.phone)) {
          newErrors[`${index}.address.phone`] = 'Geçerli bir telefon numarası girin (en az 7 rakam)';
        }
      }
    });
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      onTravellersChange(formData);
      onNext();
    }
  };

  if (!formData.length) {
    return <div className="loading">Yolcu bilgileri yükleniyor...</div>;
  }

  return (
    <form className="traveller-form" onSubmit={handleSubmit}>
      <div className="form-info">
        <h3>Yolcu Bilgileri</h3>
        <p>Lütfen tüm yolcuların bilgilerini eksiksiz doldurun.</p>
      </div>
      
      {formData.map((traveller, index) => (
        <div key={index} className="traveller-section">
          <div className="traveller-header">
            <h4>{index + 1}. Yolcu</h4>
          </div>
          
          <div className="form-grid">
            {/* Ad */}
            <div className="form-group">
              <label>Ad *</label>
              <input
                type="text"
                value={traveller.name}
                onChange={(e) => handleFieldChange(index, 'name', e.target.value.toUpperCase())}
                className={errors[`${index}.name`] ? 'error' : ''}
                placeholder={errors[`${index}.name`] || "ADI"}
                style={{ textTransform: 'uppercase' }}
              />
            </div>
            
            {/* Soyad */}
            <div className="form-group">
              <label>Soyad *</label>
              <input
                type="text"
                value={traveller.surname}
                onChange={(e) => handleFieldChange(index, 'surname', e.target.value.toUpperCase())}
                className={errors[`${index}.surname`] ? 'error' : ''}
                placeholder={errors[`${index}.surname`] || "SOYADI"}
                style={{ textTransform: 'uppercase' }}
              />
            </div>
            
            {/* Doğum Tarihi */}
            <div className="form-group">
              <label>Doğum Tarihi *</label>
              <input
                type="date"
                value={traveller.birthDate}
                onChange={(e) => handleFieldChange(index, 'birthDate', e.target.value)}
                className={errors[`${index}.birthDate`] ? 'error' : ''}
                max={new Date().toISOString().split('T')[0]}
                min={new Date('1900-01-01').toISOString().split('T')[0]}
              />
              {errors[`${index}.birthDate`] && (
                <small style={{ color: '#e74c3c', fontSize: '12px' }}>
                  {errors[`${index}.birthDate`]}
                </small>
              )}
            </div>
            
            {/* Cinsiyet */}
            <div className="form-group">
              <label>Cinsiyet *</label>
              <select
                value={traveller.gender}
                onChange={(e) => handleFieldChange(index, 'gender', parseInt(e.target.value))}
              >
                <option value={1}>Erkek</option>
                <option value={2}>Kadın</option>
              </select>
            </div>
            
            {/* Uyruk */}
            <div className="form-group">
              <label>Uyruk *</label>
              <select
                value={traveller.nationality.twoLetterCode}
                onChange={(e) => handleFieldChange(index, 'nationality.twoLetterCode', e.target.value)}
              >
                {COUNTRIES.map(country => (
                  <option key={country.code} value={country.code}>
                    {country.name}
                  </option>
                ))}
              </select>
            </div>
            
            {/* TC Kimlik / Pasaport */}
            {traveller.nationality.twoLetterCode === 'TR' ? (
              <div className="form-group">
                <label>TC Kimlik Numarası *</label>
                <input
                  type="text"
                  value={traveller.identityNumber}
                  onChange={(e) => handleFieldChange(index, 'identityNumber', e.target.value.replace(/\D/g, ''))}
                  className={errors[`${index}.identityNumber`] ? 'error' : ''}
                  placeholder={errors[`${index}.identityNumber`] || "12345678901"}
                  maxLength="11"
                />
              </div>
            ) : (
              <>
                <div className="form-group">
                  <label>Pasaport Numarası *</label>
                  <input
                    type="text"
                    value={traveller.passportInfo.number}
                    onChange={(e) => handleFieldChange(index, 'passportInfo.number', e.target.value.toUpperCase())}
                    className={errors[`${index}.passportInfo.number`] ? 'error' : ''}
                    placeholder={errors[`${index}.passportInfo.number`] || "A1234567"}
                    style={{ textTransform: 'uppercase' }}
                  />
                </div>
                
                <div className="form-group">
                  <label>Pasaport Bitiş Tarihi *</label>
                  <input
                    type="date"
                    value={traveller.passportInfo.expireDate}
                    onChange={(e) => handleFieldChange(index, 'passportInfo.expireDate', e.target.value)}
                    className={errors[`${index}.passportInfo.expireDate`] ? 'error' : ''}
                    min={new Date().toISOString().split('T')[0]}
                  />
                  {errors[`${index}.passportInfo.expireDate`] && (
                    <small style={{ color: '#e74c3c', fontSize: '12px' }}>
                      {errors[`${index}.passportInfo.expireDate`]}
                    </small>
                  )}
                </div>
              </>
            )}
            
            {/* İlk yolcu için iletişim bilgileri */}
            {index === 0 && (
              <>
                <div className="form-group">
                  <label>Email *</label>
                  <input
                    type="email"
                    value={traveller.address.email}
                    onChange={(e) => handleFieldChange(index, 'address.email', e.target.value.toLowerCase())}
                    className={errors[`${index}.address.email`] ? 'error' : ''}
                    placeholder={errors[`${index}.address.email`] || "ornek@email.com"}
                  />
                </div>
                
                {/* Telefon - Ülke Kodu ve Numara Ayrı */}
                <div className="form-group phone-group">
                  <label>Telefon *</label>
                  <div className="phone-input-container">
                    <select
                      value={traveller.address.countryCode}
                      onChange={(e) => handleFieldChange(index, 'address.countryCode', e.target.value)}
                      className="country-code-select"
                    >
                      {COUNTRY_CODES.map(country => (
                        <option key={country.code} value={country.code}>
                          {country.code} {country.name}
                        </option>
                      ))}
                    </select>
                    <input
                      type="tel"
                      value={traveller.address.phone}
                      onChange={(e) => handleFieldChange(index, 'address.phone', e.target.value)}
                      className={errors[`${index}.address.phone`] ? 'error phone-number' : 'phone-number'}
                      placeholder={errors[`${index}.address.phone`] || "555 123 4567"}
                    />
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      ))}
      
      <div className="form-actions">
        <button type="submit" className="submit-btn">
          Devam Et
        </button>
      </div>
    </form>
  );
}

export default TravellerForm;