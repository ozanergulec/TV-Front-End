import React from 'react';
import '../components.css';

const LoadingSpinner = ({ 
  message = "Yükleniyor...", 
  submessage = "", 
  size = "large",
  variant = "search" 
}) => {
  const spinnerClass = `loading-spinner ${size} ${variant}`;
  
  return (
    <div className="loading-container">
      <div className={spinnerClass}>
        <div className="spinner-ring"></div>
        <div className="spinner-inner"></div>
      </div>
      <div className="loading-text">
        <h3>{message}</h3>
        {submessage && <p>{submessage}</p>}
      </div>
    </div>
  );
};

export default LoadingSpinner;