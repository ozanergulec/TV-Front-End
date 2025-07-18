import React, { useState, useEffect, useRef } from 'react';

function HotelResultsFilters({
  showFilters,
  onClose,
  priceRange,
  onPriceRangeChange,
  selectedRating,
  onRatingChange
}) {
  const [isSticky, setIsSticky] = useState(false);
  const [stickyTop, setStickyTop] = useState(20);
  const sidebarRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => {
      if (!sidebarRef.current) return;

      const resultsContainer = document.querySelector('.results-container');
      if (!resultsContainer) return;

      const containerRect = resultsContainer.getBoundingClientRect();
      const shouldStick = containerRect.top <= 20;

      setIsSticky(shouldStick);
      
      if (shouldStick) {
        setStickyTop(Math.max(20, Math.min(20, containerRect.top + 20)));
      }
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const renderStars = (rating) => {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating - fullStars >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    
    return (
      <>
        {[...Array(fullStars)].map((_, i) => (
          <span key={`full-${i}`} className="star">★</span>
        ))}
        {hasHalfStar && <span className="star half">★</span>}
        {[...Array(emptyStars)].map((_, i) => (
          <span key={`empty-${i}`} className="star empty">★</span>
        ))}
      </>
    );
  };

  return (
    <>
      {/* Sticky olduğunda yer tutacak placeholder */}
      {isSticky && (
        <div 
          style={{
            width: '280px',
            flexShrink: 0
          }}
        />
      )}
      
      <div 
        ref={sidebarRef}
        className={`filters-sidebar ${showFilters ? 'show' : ''}`}
        style={isSticky ? {
          position: 'fixed',
          top: `${stickyTop}px`,
          width: '280px',
          zIndex: 999
        } : {}}
      >
        <div className="filters-header">
          <h3>Filtreler</h3>
          <button 
            className="close-filters"
            onClick={onClose}
          >
            ×
          </button>
        </div>

        {/* Price Filter */}
        <div className="filter-section">
          <h4>Fiyat Aralığı (Gecelik)</h4>
          <div className="price-inputs">
            <input
              type="number"
              value={priceRange.min}
              onChange={(e) => onPriceRangeChange(prev => ({...prev, min: e.target.value}))}
              placeholder="Min fiyat"
            />
            <span>-</span>
            <input
              type="number"
              value={priceRange.max}
              onChange={(e) => onPriceRangeChange(prev => ({...prev, max: e.target.value}))}
              placeholder="Max fiyat"
            />
          </div>
        </div>

        {/* Rating Filter */}
        <div className="filter-section">
          <h4>Minimum Puan</h4>
          <div className="rating-filters">
            {[0, 3, 3.5, 4, 4.5].map(rating => (
              <label key={rating} className="rating-option">
                <input
                  type="radio"
                  name="rating"
                  value={rating}
                  checked={selectedRating === rating}
                  onChange={(e) => onRatingChange(Number(e.target.value))}
                />
                <span>
                  {rating === 0 ? 'Tümü' : (
                    <>
                      {rating}+ <div className="stars">{renderStars(rating)}</div>
                    </>
                  )}
                </span>
              </label>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

export default HotelResultsFilters;