import React from 'react';
import '../../styles/BookingSteps.css';

function BookingSteps({ currentStep = 1 }) {
  const steps = [
    { id: 1, title: 'Yolcu Bilgileri', description: 'Yolcu detaylarını girin' },
    { id: 2, title: 'İletişim Bilgileri', description: 'İletişim bilgilerini girin' },
    { id: 3, title: 'Ödeme', description: 'Ödeme ve onay işlemi' }
  ];

  return (
    <div className="booking-steps">
      <div className="steps-container">
        {steps.map((step) => (
          <div 
            key={step.id} 
            className={`step ${currentStep === step.id ? 'active' : ''} ${currentStep > step.id ? 'completed' : ''}`}
          >
            <div className="step-number">{step.id}</div>
            <div className="step-content">
              <div className="step-title">{step.title}</div>
              <div className="step-description">{step.description}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default BookingSteps;