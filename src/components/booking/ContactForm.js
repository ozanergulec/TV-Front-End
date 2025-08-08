import React, { useState, useEffect } from 'react';
import '../../styles/ContactForm.css';

function ContactForm({ travellers, initialContactInfo, onContactInfoChange, onNext, onBack }) {
  const [contactInfo, setContactInfo] = useState({
    primaryContact: {
      email: '',
      phone: '',
      address: '',
      city: '',
      country: 'Türkiye'
    }
  });

  const [errors, setErrors] = useState({});

  // İlk yüklemede kayıtlı bilgileri al
  useEffect(() => {
    if (initialContactInfo) {
      console.log('📋 Kayıtlı iletişim bilgileri yükleniyor:', initialContactInfo);
      setContactInfo(initialContactInfo);
    } else if (travellers && travellers.length > 0) {
      // Eğer kayıtlı bilgi yoksa lider yolcudan al
      const leader = travellers.find(t => t.isLeader) || travellers[0];
      if (leader && leader.address) {
        setContactInfo(prev => ({
          ...prev,
          primaryContact: {
            ...prev.primaryContact,
            email: leader.address.email || '',
            phone: leader.address.phone || '',
            address: leader.address.address || '',
            city: leader.address.city?.name || ''
          }
        }));
      }
    }
  }, [initialContactInfo, travellers]);

  const handleInputChange = (section, field, value) => {
    setContactInfo(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));

    if (errors[`${section}.${field}`]) {
      setErrors(prev => ({
        ...prev,
        [`${section}.${field}`]: undefined
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Zorunlu alanlar
    if (!contactInfo.primaryContact.email?.trim()) {
      newErrors['primaryContact.email'] = 'Email adresi zorunludur';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactInfo.primaryContact.email)) {
      newErrors['primaryContact.email'] = 'Geçerli bir email adresi girin';
    }

    if (!contactInfo.primaryContact.phone?.trim()) {
      newErrors['primaryContact.phone'] = 'Telefon numarası zorunludur';
    }

    if (!contactInfo.primaryContact.address?.trim()) {
      newErrors['primaryContact.address'] = 'Adres zorunludur';
    }

    console.log('🔍 Validation sonucu:', newErrors);
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('📝 ContactForm submit edildi');
    console.log('📊 Contact Info:', contactInfo);
    
    if (validateForm()) {
      onContactInfoChange(contactInfo);
      onNext();
    } else {
      console.log('❌ Validation başarısız');
      console.log('❌ Hatalar:', errors);
    }
  };

  return (
    <form className="contact-form" onSubmit={handleSubmit}>
      <div className="form-header">
        <h3>İletişim Bilgileri</h3>
        <p>Rezervasyon sürecinde sizinle iletişim kurmak için gerekli bilgileri doldurun.</p>
      </div>

      {/* Ana İletişim Bilgileri */}
      <div className="form-section">
        <h4>İletişim Bilgileri</h4>
        <div className="form-grid">
          <div className="form-group">
            <label>Email Adresi *</label>
            <input
              type="email"
              value={contactInfo.primaryContact.email}
              onChange={(e) => handleInputChange('primaryContact', 'email', e.target.value)}
              className={errors['primaryContact.email'] ? 'error' : ''}
              placeholder={errors['primaryContact.email'] || "ornek@email.com"}
            />
          </div>

          <div className="form-group">
            <label>Telefon Numarası *</label>
            <input
              type="tel"
              value={contactInfo.primaryContact.phone}
              onChange={(e) => handleInputChange('primaryContact', 'phone', e.target.value)}
              className={errors['primaryContact.phone'] ? 'error' : ''}
              placeholder={errors['primaryContact.phone'] || "555 123 4567"}
            />
          </div>

          <div className="form-group full-width">
            <label>Adres *</label>
            <input
              type="text"
              value={contactInfo.primaryContact.address}
              onChange={(e) => handleInputChange('primaryContact', 'address', e.target.value)}
              className={errors['primaryContact.address'] ? 'error' : ''}
              placeholder={errors['primaryContact.address'] || "Tam adres bilgisi"}
            />
          </div>

          <div className="form-group">
            <label>Şehir</label>
            <input
              type="text"
              value={contactInfo.primaryContact.city}
              onChange={(e) => handleInputChange('primaryContact', 'city', e.target.value)}
              placeholder="Şehir"
            />
          </div>

          <div className="form-group">
            <label>Ülke</label>
            <select
              value={contactInfo.primaryContact.country}
              onChange={(e) => handleInputChange('primaryContact', 'country', e.target.value)}
            >
              <option value="Türkiye">Türkiye</option>
              <option value="Almanya">Almanya</option>
              <option value="İngiltere">İngiltere</option>
              <option value="Fransa">Fransa</option>
              <option value="Amerika">Amerika</option>
              <option value="İtalya">İtalya</option>
              <option value="İspanya">İspanya</option>
            </select>
          </div>
        </div>
      </div>

      <div className="form-actions">
        <button type="button" onClick={onBack} className="back-btn">
          Geri
        </button>
        <button type="submit" className="submit-btn">
          Devam Et
        </button>
      </div>
    </form>
  );
}

export default ContactForm;