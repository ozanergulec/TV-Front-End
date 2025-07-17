import React from 'react';
import '../styles/BookingSteps.css';

function BookingSteps({ currentStep = 1 }) {
  const steps = [
    { id: 1, title: 'Yolcu Bilgileri', description: 'Yolcu detaylarını girin' },
    { id: 2, title: 'İletişim Bilgileri', description: 'İletişim bilgilerini girin' },
    { id: 3, title: 'Ödeme', description: 'Ödeme bilgilerini girin' },
    { id: 4, title: 'Onay', description: 'Rezervasyonu tamamlayın' }
  ];

  return (
    <div className="booking-steps">
      <div className="steps-container">
        {steps.map((step, index) => (
          <div key={step.id} className="step-item">
            <div className={`step-indicator ${currentStep >= step.id ? 'active' : ''} ${currentStep > step.id ? 'completed' : ''}`}>
              {currentStep > step.id ? (
                <svg className="step-check" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <span className="step-number">{step.id}</span>
              )}
            </div>
            <div className="step-content">
              <h3 className="step-title">{step.title}</h3>
              <p className="step-description">{step.description}</p>
            </div>
            {index < steps.length - 1 && (
              <div className={`step-connector ${currentStep > step.id ? 'completed' : ''}`}></div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default BookingSteps;