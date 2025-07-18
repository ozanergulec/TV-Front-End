import React, { useState, useEffect, useRef } from 'react';
import '../../styles/HotelMap.css';

function HotelMap({ hotels, selectedHotel, onHotelSelect, searchData }) {
  const mapRef = useRef(null);
  const [map, setMap] = useState(null);
  const [markers, setMarkers] = useState([]);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [showMapToggle, setShowMapToggle] = useState(false);

  // En üstte API key'i tanımlayın
  const API_KEY = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;

  // Popüler destinasyonların koordinatları
  const destinationCoordinates = {
    'istanbul': { lat: 41.0082, lng: 28.9784, zoom: 11 },
    'ankara': { lat: 39.9334, lng: 32.8597, zoom: 11 },
    'izmir': { lat: 38.4192, lng: 27.1287, zoom: 11 },
    'antalya': { lat: 36.8969, lng: 30.7133, zoom: 11 },
    'mugla': { lat: 37.2153, lng: 28.3636, zoom: 11 },
    'bodrum': { lat: 37.0344, lng: 27.4305, zoom: 12 },
    'marmaris': { lat: 36.8556, lng: 28.2697, zoom: 12 },
    'kusadasi': { lat: 37.8582, lng: 27.2593, zoom: 12 },
    'cesme': { lat: 38.3230, lng: 26.3062, zoom: 12 },
    'alanya': { lat: 36.5446, lng: 32.0048, zoom: 12 },
    'side': { lat: 36.7672, lng: 31.3889, zoom: 12 },
    'belek': { lat: 36.8625, lng: 31.0561, zoom: 12 },
    'kemer': { lat: 36.6023, lng: 30.5591, zoom: 12 },
    'kas': { lat: 36.2016, lng: 29.6411, zoom: 12 },
    'fethiye': { lat: 36.6566, lng: 29.1161, zoom: 12 },
    'atina': { lat: 37.9838, lng: 23.7275, zoom: 11 },
    'athens': { lat: 37.9838, lng: 23.7275, zoom: 11 },
    'yunanistan': { lat: 37.9838, lng: 23.7275, zoom: 8 },
    'greece': { lat: 37.9838, lng: 23.7275, zoom: 8 }
  };

  // Arama destinasyonuna göre merkez koordinatı belirle
  const getMapCenter = () => {
    if (searchData?.destinationName) {
      const destination = searchData.destinationName.toLowerCase();
      
      // Exact match
      if (destinationCoordinates[destination]) {
        return destinationCoordinates[destination];
      }
      
      // Partial match
      for (const [key, coords] of Object.entries(destinationCoordinates)) {
        if (destination.includes(key) || key.includes(destination)) {
          return coords;
        }
      }
    }
    
    // Varsayılan: İstanbul
    return { lat: 41.0082, lng: 28.9784, zoom: 11 };
  };

  // Script yükleme kısmını güncelleyin
  useEffect(() => {
    if (!window.google && API_KEY) {
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${API_KEY}&libraries=places`;
      script.onload = () => setIsMapLoaded(true);
      document.head.appendChild(script);
    } else if (window.google) {
      setIsMapLoaded(true);
    }
  }, []);

  // Haritayı başlat
  useEffect(() => {
    if (!isMapLoaded || !mapRef.current || !window.google) return;

    const mapCenter = getMapCenter();
    
    const mapInstance = new window.google.maps.Map(mapRef.current, {
      zoom: mapCenter.zoom,
      center: { lat: mapCenter.lat, lng: mapCenter.lng },
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
      styles: [
        {
          featureType: 'poi',
          elementType: 'labels',
          stylers: [{ visibility: 'off' }]
        }
      ]
    });

    setMap(mapInstance);
  }, [isMapLoaded, searchData]);

  // Otellerin marker'larını haritaya ekle
  useEffect(() => {
    if (!map || !hotels.length) return;

    // Eski marker'ları temizle
    markers.forEach(marker => marker.setMap(null));

    const newMarkers = [];
    const bounds = new window.google.maps.LatLngBounds();

    hotels.forEach((hotel, index) => {
      // ✅ Gerçek koordinatları kullan, yoksa fallback
      const position = hotel.coordinates && hotel.coordinates.lat && hotel.coordinates.lng
        ? hotel.coordinates
        : generateHotelPosition(hotel, index, getMapCenter());
      
      // Özel marker icon'u oluştur
      const isSelected = selectedHotel?.id === hotel.id;
      const markerIcon = {
        path: 'M12,2C8.13,2 5,5.13 5,9c0,5.25 7,13 7,13s7,-7.75 7,-13C19,5.13 15.87,2 12,2z',
        fillColor: isSelected ? '#ff6b6b' : '#4285f4',
        fillOpacity: 1,
        strokeColor: '#ffffff',
        strokeWeight: 2,
        scale: 1.5,
        anchor: new window.google.maps.Point(12, 22)
      };

      const marker = new window.google.maps.Marker({
        position: position,
        map: map,
        title: hotel.name,
        icon: markerIcon,
        zIndex: isSelected ? 1000 : 100
      });

      // Marker'a tıklandığında otel bilgilerini göster
      const infoWindow = new window.google.maps.InfoWindow({
        content: `
          <div class="hotel-map-info">
            <h4>${hotel.name}</h4>
            <p>${hotel.location}</p>
            <p><strong>${hotel.price} ${hotel.currency}</strong></p>
            <div class="hotel-rating">
              ${'★'.repeat(Math.floor(hotel.rating))} (${hotel.rating.toFixed(1)})
            </div>
            <p style="font-size: 10px; color: #666;">
              ${hotel.coordinates ? 'Gerçek konum' : 'Tahmini konum'}
            </p>
          </div>
        `
      });

      marker.addListener('click', () => {
        // Önceki açık infoWindow'ları kapat
        markers.forEach(m => {
          if (m.infoWindow) {
            m.infoWindow.close();
          }
        });
        
        infoWindow.open(map, marker);
        if (onHotelSelect) {
          onHotelSelect(hotel);
        }
      });

      // InfoWindow'u marker'a bağla
      marker.infoWindow = infoWindow;
      newMarkers.push(marker);
      bounds.extend(position);
    });

    // Haritayı tüm marker'ları içerecek şekilde ayarla
    if (hotels.length > 0) {
      map.fitBounds(bounds);
      // Zoom seviyesini kontrol et
      const listener = window.google.maps.event.addListener(map, 'idle', () => {
        const zoom = map.getZoom();
        if (zoom > 15) {
          map.setZoom(15);
        }
        if (zoom < 10) {
          map.setZoom(10);
        }
        window.google.maps.event.removeListener(listener);
      });
    }

    setMarkers(newMarkers);
  }, [map, hotels, selectedHotel]);

  // Daha gerçekçi konum oluşturma fonksiyonu
  const generateHotelPosition = (hotel, index, mapCenter) => {
    const baseLat = mapCenter.lat;
    const baseLng = mapCenter.lng;
    
    // Hotel ID'sine göre deterministic konum oluştur
    const hash = hotel.id ? hashCode(hotel.id.toString()) : index;
    
    // Daha geniş alan için offset'i artır
    const maxOffset = 0.01; // ~1.1 km
    const latOffset = ((hash % 200) - 100) * maxOffset / 100;
    const lngOffset = ((Math.floor(hash / 200) % 200) - 100) * maxOffset / 100;
    
    // Mesafe bilgisini de kullan
    const distanceMultiplier = Math.min(hotel.distance / 10, 1); // 0-1 arasında
    const adjustedLatOffset = latOffset * (0.5 + distanceMultiplier);
    const adjustedLngOffset = lngOffset * (0.5 + distanceMultiplier);
    
    return {
      lat: baseLat + adjustedLatOffset,
      lng: baseLng + adjustedLngOffset
    };
  };

  // String hash fonksiyonu
  const hashCode = (str) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // 32bit integer'a dönüştür
    }
    return hash;
  };

  if (!isMapLoaded) {
    return (
      <div className="hotel-map-container">
        <div className="map-loading">
          <div className="map-loading-spinner"></div>
          <p>Harita yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="hotel-map-container">
      <div className="map-header">
        <h3>Otellerin Konumu</h3>
        <button 
          className="map-toggle-btn"
          onClick={() => setShowMapToggle(!showMapToggle)}
        >
          {showMapToggle ? 'Haritayı Gizle' : 'Haritayı Göster'}
        </button>
      </div>
      
      <div className={`map-content ${showMapToggle ? 'show' : 'hide'}`}>
        <div 
          ref={mapRef} 
          className="google-map"
          style={{ width: '100%', height: '400px' }}
        />
        
        <div className="map-info">
          <p>📍 {hotels.length} otel gösteriliyor</p>
          {searchData?.destinationName && (
            <p>🎯 {searchData.destinationName}</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default HotelMap;