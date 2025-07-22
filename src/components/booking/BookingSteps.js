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
        {steps.map((step, index) => (
          <React.Fragment key={step.id}>
            <div className="step-item">
              <div
                className={`step-indicator ${
                  currentStep === step.id
                    ? 'active'
                    : currentStep > step.id
                    ? 'completed'
                    : ''
                }`}
              >
                {currentStep > step.id ? (
                  <svg
                    className="step-check"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                ) : (
                  step.id
                )}
              </div>
              <div className="step-content">
                <div className="step-title">{step.title}</div>
                <div className="step-description">{step.description}</div>
              </div>
            </div>
            {index < steps.length - 1 && (
              <div
                className={`step-connector ${
                  currentStep > step.id ? 'completed' : ''
                }`}
              ></div>
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );  
}

export default BookingSteps;