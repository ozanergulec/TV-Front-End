import React from 'react';

function Header() {
  return (
    <header className="header">
      <div className="header-container">
        {/* Logo */}
        <a href="/" className="logo">
          <span className="logo-icon">🏨</span>
          <span className="logo-text">Room for Sprint</span>
        </a>
      </div>
    </header>
  );
}

export default Header;