import React from 'react';

function PopularDestinations({ onDestinationSelect }) {
    const destinations = [
        {
          id: 1,
          name: 'İstanbul',
          image: '/images/destinations/istanbul.jpg',
          description: 'Tarihi güzellikleri ve modern yaşamı'
        },
        {
          id: 2,
          name: 'Ankara',
          image: '/images/destinations/ankara.jpg',
          description: 'Başkentin kültürel zenginlikleri'
        },
        {
          id: 3,
          name: 'İzmir',
          image: '/images/destinations/izmir.jpg',
          description: 'Ege\'nin incisi ve tarihi'
        },
        {
          id: 4,
          name: 'Antalya',
          image: '/images/destinations/antalya.jpg',
          description: 'Akdeniz\'in turkuaz suları'
        },
        {
          id: 5,
          name: 'Muğla',
          image: '/images/destinations/mugla.jpg',
          description: 'Bodrum ve Marmaris\'in güzellikleri'
        },
        {
          id: 6,
          name: 'Hatay',
          image: '/images/destinations/hatay.jpg',
          description: 'Hatay\'ın doğal güzellikleri'
        },
        {
          id: 7,
          name: 'Athens',
          image: '/images/destinations/atina.jpg',
          description: 'Yunanistan\'ın antik şehirleri ve doğa harikası'
        }
      ];

  const handleDestinationClick = (destination) => {
    if (onDestinationSelect) {
      onDestinationSelect(destination.name);
    }
  };

  return (
    <section className="popular-destinations">
      <div className="destinations-container">
        <h2 className="destinations-title">Popüler Otel Bölgeleri</h2>
        <p className="destinations-subtitle">
          En çok tercih edilen destinasyonları keşfedin
        </p>
        
        <div className="destinations-grid">
          {destinations.map(destination => (
            <div 
              key={destination.id}
              className="destination-card"
              onClick={() => handleDestinationClick(destination)}
            >
              <div className="card-image">
                <img 
                  src={destination.image} 
                  alt={destination.name}
                  loading="lazy"
                />
                <div className="card-overlay">
                  <h3 className="card-title">{destination.name}</h3>
                  <p className="card-description">{destination.description}</p>
                  <button className="card-button">
                    Otelleri İncele →
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default PopularDestinations;