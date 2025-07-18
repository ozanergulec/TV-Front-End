import React from 'react';

const DateRangeSelector = ({ checkIn, checkOut, onChange, disabled }) => {
  const getTodayDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  const getMinCheckOutDate = () => {
    if (!checkIn) return getTodayDate();
    
    const checkInDate = new Date(checkIn);
    checkInDate.setDate(checkInDate.getDate() + 1);
    return checkInDate.toISOString().split('T')[0];
  };

  const handleDateChange = (field, value) => {
    if (field === 'checkIn') {
      const today = getTodayDate();
      if (value < today) {
        alert('Giriş tarihi bugünden önceki bir tarih olamaz');
        return;
      }
      
      if (checkOut && value >= checkOut) {
        onChange({ checkIn: value, checkOut: '' });
        return;
      }
    }
    
    if (field === 'checkOut') {
      if (!checkIn) {
        alert('Önce giriş tarihini seçin');
        return;
      }
      
      if (value <= checkIn) {
        alert('Çıkış tarihi giriş tarihinden sonra olmalıdır');
        return;
      }
    }
    
    onChange({ [field]: value });
  };

  return (
    <>
      <div className="search-field date-field">
        <label>Giriş</label>
        <input
          type="date"
          value={checkIn}
          onChange={(e) => handleDateChange('checkIn', e.target.value)}
          min={getTodayDate()}
          disabled={disabled}
        />
      </div>

      <div className="search-field date-field">
        <label>Çıkış</label>
        <input
          type="date"
          value={checkOut}
          onChange={(e) => handleDateChange('checkOut', e.target.value)}
          min={getMinCheckOutDate()}
          disabled={disabled}
        />
      </div>
    </>
  );
};

export default DateRangeSelector;