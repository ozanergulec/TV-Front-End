import React from 'react';

function Header() {
  return (
    <header className="header">
      <div className="header-container">
        {/* Logo */}
        <a href="/" className="logo">
          <img 
            src="/logo.png" 
            alt="Room for Sprint Logo" 
            className="logo-icon"
          />
          <span className="logo-text">Room for Sprint</span>
        </a>
      </div>
    </header>
  );
}

export default Header;