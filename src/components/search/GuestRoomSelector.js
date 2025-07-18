import React, { useState, useRef, useEffect } from 'react';

const GuestRoomSelector = ({ rooms, onChange, disabled }) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  const getGuestSummary = () => {
    const totalAdults = rooms.reduce((sum, room) => sum + room.adults, 0);
    const totalChildren = rooms.reduce((sum, room) => sum + room.children, 0);
    const totalGuests = totalAdults + totalChildren;
    return `${totalGuests} Misafir, ${rooms.length} Oda`;
  };

  const addRoom = () => {
    const newRooms = [...rooms, { adults: 2, children: 0, childAges: [] }];
    onChange(newRooms);
  };

  const removeRoom = (roomIndex) => {
    if (rooms.length > 1) {
      const newRooms = rooms.filter((_, index) => index !== roomIndex);
      onChange(newRooms);
    }
  };

  const updateAdults = (roomIndex, increment) => {
    const newRooms = rooms.map((room, index) => {
      if (index === roomIndex) {
        const newAdults = room.adults + increment;
        return {
          ...room,
          adults: Math.max(1, Math.min(6, newAdults))
        };
      }
      return room;
    });
    onChange(newRooms);
  };

  const updateChildren = (roomIndex, increment) => {
    const newRooms = rooms.map((room, index) => {
      if (index === roomIndex) {
        const newChildren = room.children + increment;
        const finalChildren = Math.max(0, Math.min(4, newChildren));
        return {
          ...room,
          children: finalChildren,
          childAges: finalChildren > 0 ? Array(finalChildren).fill(0) : []
        };
      }
      return room;
    });
    onChange(newRooms);
  };

  const updateChildAge = (roomIndex, childIndex, age) => {
    const newRooms = rooms.map((room, index) => {
      if (index === roomIndex) {
        return {
          ...room,
          childAges: room.childAges.map((currentAge, i) => 
            i === childIndex ? parseInt(age) : currentAge
          )
        };
      }
      return room;
    });
    onChange(newRooms);
  };

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const renderChildAges = (room, roomIndex) => {
    if (room.children === 0) return null;
    
    return (
      <div className="child-ages-row">
        <span className="child-ages-label">Çocuk Yaşları:</span>
        <div className="child-ages-selects">
          {room.childAges.map((age, childIndex) => (
            <select
              key={childIndex}
              className="age-select-small"
              value={age}
              onChange={(e) => updateChildAge(roomIndex, childIndex, e.target.value)}
              style={{
                padding: '8px 10px',
                fontSize: '13px',
                fontWeight: '500',
                color: '#333',
                backgroundColor: 'white',
                border: '2px solid #0a825a',
                borderRadius: '6px',
                minWidth: '80px',
                appearance: 'none',
                backgroundImage: "url(\"data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%23374151' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e\")",
                backgroundPosition: 'right 8px center',
                backgroundRepeat: 'no-repeat',
                backgroundSize: '12px',
                paddingRight: '30px'
              }}
            >
              <option value={0}>Yaş Seçin</option>
              {[...Array(18)].map((_, i) => (
                <option key={i + 1} value={i + 1}>
                  {i + 1} yaş
                </option>
              ))}
            </select>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="search-field guest-field" ref={dropdownRef}>
      <label>Misafirler</label>
      <div 
        className="guest-selector"
        onClick={() => !disabled && setShowDropdown(!showDropdown)}
      >
        <span>{getGuestSummary()}</span>
        <span className="dropdown-arrow">▼</span>
      </div>

      {showDropdown && (
        <div className="guest-dropdown">
          <div className="guest-dropdown-header">
            <h3>Misafirler</h3>
          </div>

          <div className="rooms-list">
            {rooms.map((room, roomIndex) => (
              <div key={roomIndex} className="room-item">
                {rooms.length > 1 && (
                  <div className="room-header">
                    <div className="room-title">{roomIndex + 1}. Oda</div>
                    <button
                      type="button"
                      className="remove-room-link"
                      onClick={() => removeRoom(roomIndex)}
                    >
                      Odayı Kaldır
                    </button>
                  </div>
                )}

                <div className="guest-row">
                  <div className="guest-label">
                    <strong>Yetişkin</strong>
                    <small>18 yaş ve üzeri</small>
                  </div>
                  <div className="guest-counter">
                    <button
                      type="button"
                      className="counter-btn"
                      onClick={() => updateAdults(roomIndex, -1)}
                      disabled={room.adults <= 1}
                    >
                      -
                    </button>
                    <span className="counter-num">{room.adults}</span>
                    <button
                      type="button"
                      className="counter-btn"
                      onClick={() => updateAdults(roomIndex, 1)}
                      disabled={room.adults >= 6}
                    >
                      +
                    </button>
                  </div>
                </div>

                <div className="guest-row">
                  <div className="guest-label">
                    <strong>Çocuk</strong>
                    <small>0-17 yaş</small>
                  </div>
                  <div className="guest-counter">
                    <button
                      type="button"
                      className="counter-btn"
                      onClick={() => updateChildren(roomIndex, -1)}
                      disabled={room.children <= 0}
                    >
                      -
                    </button>
                    <span className="counter-num">{room.children}</span>
                    <button
                      type="button"
                      className="counter-btn"
                      onClick={() => updateChildren(roomIndex, 1)}
                      disabled={room.children >= 4}
                    >
                      +
                    </button>
                  </div>
                </div>

                {renderChildAges(room, roomIndex)}
              </div>
            ))}
          </div>

          <div className="add-room-section">
            <button
              type="button"
              className="add-room-link"
              onClick={addRoom}
              disabled={rooms.length >= 4}
            >
              Yeni Oda Ekle
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default GuestRoomSelector;