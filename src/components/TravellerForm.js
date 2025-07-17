import React, { useState, useEffect } from 'react';
import '../styles/TravellerForm.css';

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
        isLeader: index === 0, // İlk yolcu otomatik lider
        address: {
          email: traveller.address?.email || '',
          phone: traveller.address?.phone || '',
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
    
    // Geçersiz tarih formatları için kontrol
    if (dateString.includes('0000') || dateString.includes('1900')) {
      return ''; // Boş bırak
    }
    
    try {
      const date = new Date(dateString);
      // Geçerli tarih kontrolü
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
    
    if (field.includes('.')) {
      // Nested field (örn: address.email)
      const [parentField, childField] = field.split('.');
      newFormData[travellerIndex][parentField][childField] = value;
    } else {
      newFormData[travellerIndex][field] = value;
    }
    
    setFormData(newFormData);
    
    // Errors'u temizle
    const newErrors = { ...errors };
    delete newErrors[`${travellerIndex}.${field}`];
    setErrors(newErrors);
  };

  // Nested field için değer alma
  const getNestedValue = (obj, path) => {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  };

  // Form validasyonu
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
      }
      if (!traveller.identityNumber?.trim()) {
        newErrors[`${index}.identityNumber`] = 'Kimlik numarası zorunludur';
      }
      
      // Lider yolcu için iletişim bilgileri zorunlu
      if (traveller.isLeader) {
        if (!traveller.address?.email?.trim()) {
          newErrors[`${index}.address.email`] = 'Email zorunludur';
        }
        if (!traveller.address?.phone?.trim()) {
          newErrors[`${index}.address.phone`] = 'Telefon zorunludur';
        }
      }
      
      // Email format kontrolü
      if (traveller.address?.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(traveller.address.email)) {
        newErrors[`${index}.address.email`] = 'Geçerli bir email adresi girin';
      }
      
      // Kimlik numarası format kontrolü (11 haneli)
      if (traveller.identityNumber && !/^\d{11}$/.test(traveller.identityNumber)) {
        newErrors[`${index}.identityNumber`] = 'Kimlik numarası 11 haneli olmalıdır';
      }
    });
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Form submit
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
            <h4>
              {index + 1}. Yolcu
            </h4>
          </div>
          
          <div className="form-grid">
            {/* Kişisel Bilgiler */}
            <div className="form-group">
              <label>Ad *</label>
              <input
                type="text"
                value={traveller.name}
                onChange={(e) => handleFieldChange(index, 'name', e.target.value)}
                className={errors[`${index}.name`] ? 'error' : ''}
                placeholder="Adınızı girin"
              />
              {errors[`${index}.name`] && <span className="error-message">{errors[`${index}.name`]}</span>}
            </div>
            
            <div className="form-group">
              <label>Soyad *</label>
              <input
                type="text"
                value={traveller.surname}
                onChange={(e) => handleFieldChange(index, 'surname', e.target.value)}
                className={errors[`${index}.surname`] ? 'error' : ''}
                placeholder="Soyadınızı girin"
              />
              {errors[`${index}.surname`] && <span className="error-message">{errors[`${index}.surname`]}</span>}
            </div>
            
            <div className="form-group">
              <label>Doğum Tarihi *</label>
              <input
                type="date"
                value={traveller.birthDate}
                onChange={(e) => handleFieldChange(index, 'birthDate', e.target.value)}
                className={errors[`${index}.birthDate`] ? 'error' : ''}
              />
              {errors[`${index}.birthDate`] && <span className="error-message">{errors[`${index}.birthDate`]}</span>}
            </div>
            
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
            
            <div className="form-group">
              <label>Kimlik Numarası *</label>
              <input
                type="text"
                value={traveller.identityNumber}
                onChange={(e) => handleFieldChange(index, 'identityNumber', e.target.value)}
                className={errors[`${index}.identityNumber`] ? 'error' : ''}
                placeholder="11 haneli kimlik numarası"
                maxLength="11"
              />
              {errors[`${index}.identityNumber`] && <span className="error-message">{errors[`${index}.identityNumber`]}</span>}
            </div>
            
            <div className="form-group">
              <label>Uyruk</label>
              <select
                value={traveller.nationality.twoLetterCode}
                onChange={(e) => handleFieldChange(index, 'nationality.twoLetterCode', e.target.value)}
              >
                <option value="TR">Türkiye</option>
                <option value="US">Amerika</option>
                <option value="DE">Almanya</option>
                <option value="GB">İngiltere</option>
                <option value="FR">Fransa</option>
              </select>
            </div>
            
            {/* Lider yolcu için iletişim bilgileri */}
            {traveller.isLeader && (
              <>
                <div className="form-group">
                  <label>Email *</label>
                  <input
                    type="email"
                    value={traveller.address.email}
                    onChange={(e) => handleFieldChange(index, 'address.email', e.target.value)}
                    className={errors[`${index}.address.email`] ? 'error' : ''}
                    placeholder="ornek@email.com"
                  />
                  {errors[`${index}.address.email`] && <span className="error-message">{errors[`${index}.address.email`]}</span>}
                </div>
                
                <div className="form-group">
                  <label>Telefon *</label>
                  <input
                    type="tel"
                    value={traveller.address.phone}
                    onChange={(e) => handleFieldChange(index, 'address.phone', e.target.value)}
                    className={errors[`${index}.address.phone`] ? 'error' : ''}
                    placeholder="+90 555 123 4567"
                  />
                  {errors[`${index}.address.phone`] && <span className="error-message">{errors[`${index}.address.phone`]}</span>}
                </div>
                
                <div className="form-group full-width">
                  <label>Adres</label>
                  <input
                    type="text"
                    value={traveller.address.address}
                    onChange={(e) => handleFieldChange(index, 'address.address', e.target.value)}
                    placeholder="Açık adres"
                  />
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