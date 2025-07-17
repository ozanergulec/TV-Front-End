import React, { useState, useEffect } from 'react';
import '../styles/ContactForm.css';

function ContactForm({ travellers, onContactInfoChange, onNext, onBack }) {
  const [contactInfo, setContactInfo] = useState({
    primaryContact: {
      email: '',
      phone: '',
      address: '',
      city: '',
      zipCode: '',
      country: 'Türkiye',
      emergencyContact: {
        name: '',
        phone: '',
        relation: ''
      }
    }
  });

  const [errors, setErrors] = useState({});

  // Lider yolcudan iletişim bilgilerini al
  useEffect(() => {
    if (travellers && travellers.length > 0) {
      const leader = travellers.find(t => t.isLeader) || travellers[0];
      if (leader && leader.address) {
        setContactInfo(prev => ({
          ...prev,
          primaryContact: {
            ...prev.primaryContact,
            email: leader.address.email || '',
            phone: leader.address.phone || '',
            address: leader.address.address || '',
            city: leader.address.city?.name || '',
            zipCode: leader.address.zipCode || ''
          }
        }));
      }
    }
  }, [travellers]);

  const handleInputChange = (section, field, value) => {
    setContactInfo(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));

    // Hata varsa temizle
    if (errors[`${section}.${field}`]) {
      setErrors(prev => ({
        ...prev,
        [`${section}.${field}`]: undefined
      }));
    }
  };

  const handleNestedInputChange = (section, nested, field, value) => {
    setContactInfo(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [nested]: {
          ...prev[section][nested],
          [field]: value
        }
      }
    }));
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

    if (!contactInfo.primaryContact.city?.trim()) {
      newErrors['primaryContact.city'] = 'Şehir zorunludur';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      onContactInfoChange(contactInfo);
      onNext();
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
        <h4>Ana İletişim Bilgileri</h4>
        <div className="form-grid">
          <div className="form-group">
            <label>Email Adresi *</label>
            <input
              type="email"
              value={contactInfo.primaryContact.email}
              onChange={(e) => handleInputChange('primaryContact', 'email', e.target.value)}
              className={errors['primaryContact.email'] ? 'error' : ''}
              placeholder="ornek@email.com"
            />
            {errors['primaryContact.email'] && (
              <span className="error-message">{errors['primaryContact.email']}</span>
            )}
          </div>

          <div className="form-group">
            <label>Telefon Numarası *</label>
            <input
              type="tel"
              value={contactInfo.primaryContact.phone}
              onChange={(e) => handleInputChange('primaryContact', 'phone', e.target.value)}
              className={errors['primaryContact.phone'] ? 'error' : ''}
              placeholder="+90 555 123 4567"
            />
            {errors['primaryContact.phone'] && (
              <span className="error-message">{errors['primaryContact.phone']}</span>
            )}
          </div>

          <div className="form-group full-width">
            <label>Adres *</label>
            <input
              type="text"
              value={contactInfo.primaryContact.address}
              onChange={(e) => handleInputChange('primaryContact', 'address', e.target.value)}
              className={errors['primaryContact.address'] ? 'error' : ''}
              placeholder="Tam adres bilgisi"
            />
            {errors['primaryContact.address'] && (
              <span className="error-message">{errors['primaryContact.address']}</span>
            )}
          </div>

          <div className="form-group">
            <label>Şehir *</label>
            <input
              type="text"
              value={contactInfo.primaryContact.city}
              onChange={(e) => handleInputChange('primaryContact', 'city', e.target.value)}
              className={errors['primaryContact.city'] ? 'error' : ''}
              placeholder="Şehir"
            />
            {errors['primaryContact.city'] && (
              <span className="error-message">{errors['primaryContact.city']}</span>
            )}
          </div>

          <div className="form-group">
            <label>Posta Kodu</label>
            <input
              type="text"
              value={contactInfo.primaryContact.zipCode}
              onChange={(e) => handleInputChange('primaryContact', 'zipCode', e.target.value)}
              placeholder="Posta kodu"
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
            </select>
          </div>
        </div>
      </div>

      {/* Acil Durum İletişim */}
      <div className="form-section">
        <h4>Acil Durum İletişim</h4>
        <div className="form-grid">
          <div className="form-group">
            <label>İsim Soyisim</label>
            <input
              type="text"
              value={contactInfo.primaryContact.emergencyContact.name}
              onChange={(e) => handleNestedInputChange('primaryContact', 'emergencyContact', 'name', e.target.value)}
              placeholder="Acil durumda aranacak kişi"
            />
          </div>

          <div className="form-group">
            <label>Telefon</label>
            <input
              type="tel"
              value={contactInfo.primaryContact.emergencyContact.phone}
              onChange={(e) => handleNestedInputChange('primaryContact', 'emergencyContact', 'phone', e.target.value)}
              placeholder="+90 555 123 4567"
            />
          </div>

          <div className="form-group">
            <label>Yakınlık Derecesi</label>
            <select
              value={contactInfo.primaryContact.emergencyContact.relation}
              onChange={(e) => handleNestedInputChange('primaryContact', 'emergencyContact', 'relation', e.target.value)}
            >
              <option value="">Seçiniz</option>
              <option value="anne">Anne</option>
              <option value="baba">Baba</option>
              <option value="eş">Eş</option>
              <option value="kardeş">Kardeş</option>
              <option value="çocuk">Çocuk</option>
              <option value="arkadaş">Arkadaş</option>
              <option value="diğer">Diğer</option>
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