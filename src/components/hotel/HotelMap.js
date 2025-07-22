import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import '../../styles/HotelMap.css';

function HotelMap({ hotels, selectedHotel, onHotelSelect, searchData }) {
  const mapRef = useRef(null);
  const [map, setMap] = useState(null);
  const [markers, setMarkers] = useState([]);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [showMapToggle, setShowMapToggle] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const navigate = useNavigate();
  
  // ✅ Global InfoWindow referansı - sadece bir tane olacak
  const infoWindowRef = useRef(null);

  const API_KEY = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;
  const MIN_ZOOM_FOR_SELECTION = 14;
  const MAX_ZOOM_FOR_SELECTION = 16;

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
    // Eğer otellerin gerçek koordinatları varsa, onların ortalamasını al
    const validHotelCoords = hotels
      .map(hotel => hotel.coordinates)
      .filter(coord => coord && coord.lat && coord.lng);

    if (validHotelCoords.length > 0) {
      // Ortalama merkezi bul
      const avgLat = validHotelCoords.reduce((sum, c) => sum + c.lat, 0) / validHotelCoords.length;
      const avgLng = validHotelCoords.reduce((sum, c) => sum + c.lng, 0) / validHotelCoords.length;
      return { lat: avgLat, lng: avgLng, zoom: 10 }; // Zoom'u isteğe göre ayarlayabilirsin
    }

    // Aksi halde eski davranış
    if (searchData?.destinationName) {
      const destination = searchData.destinationName.toLowerCase();
      if (destinationCoordinates[destination]) {
        return destinationCoordinates[destination];
      }
      for (const [key, coords] of Object.entries(destinationCoordinates)) {
        if (destination.includes(key) || key.includes(destination)) {
          return coords;
        }
      }
    }
    return { lat: 41.0082, lng: 28.9784, zoom: 11 };
  };

  // Script yükleme
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

    // ✅ Global InfoWindow oluştur
    infoWindowRef.current = new window.google.maps.InfoWindow();
    
    setMap(mapInstance);
  }, [isMapLoaded, searchData]);

  // ✅ InfoWindow içeriğini oluştur
  const createInfoWindowContent = (hotel) => {
    const uniqueId = generateUniqueId();
    const imageId = `${uniqueId}-image`; // Resim için ayrı ID
    return `
      <div class="hotel-map-info">
        <img 
          id="${imageId}"
          src="${hotel.image || hotel.photoUrl || 'https://via.placeholder.com/120x80?text=No+Image'}" 
          alt="${hotel.name}" 
          style="width: 120px; height: 80px; object-fit: cover; border-radius: 6px; margin-bottom: 8px; cursor: pointer; transition: opacity 0.2s;"
          onmouseover="this.style.opacity=0.8"
          onmouseout="this.style.opacity=1"
        />
        <h4 id="${uniqueId}" style="cursor: pointer; color: #2c5aa0; text-decoration: underline;">
          ${hotel.name}
        </h4>
        <p>${hotel.location}</p>
        <p><strong>${hotel.price} ${hotel.currency}</strong></p>
        <div class="hotel-rating">
          ${'★'.repeat(Math.floor(hotel.rating))} (${hotel.rating.toFixed(1)})
        </div>
        <p style="font-size: 10px; color: #666;">
          ${hotel.coordinates ? 'Gerçek konum' : 'Tahmini konum'}
        </p>
        <div style="margin-top: 8px; font-size: 10px; color: #888; font-style: italic;">
          💡 Detaylar için otel adına veya resme tıklayın
        </div>
      </div>
    `;
  };

  // ✅ InfoWindow açma fonksiyonu
  const openInfoWindow = (hotel, marker) => {
    if (!infoWindowRef.current) return;
    
    const content = createInfoWindowContent(hotel);
    infoWindowRef.current.setContent(content);
    infoWindowRef.current.open(map, marker);
    
    // Click listener'ları ekle (hem otel adı hem resim için)
    setTimeout(() => {
      const hotelNameElements = document.querySelectorAll('[id^="hotel-"]');
      hotelNameElements.forEach(element => {
        // Otel adı için click listener
        if (element.textContent.trim() === hotel.name && !element.id.includes('-image')) {
          element.onclick = (e) => {
            e.stopPropagation();
            navigateToHotelDetail(hotel);
          };
        }
        // Otel resmi için click listener
        if (element.id.includes('-image')) {
          element.onclick = (e) => {
            e.stopPropagation();
            navigateToHotelDetail(hotel);
          };
        }
      });
    }, 100);
  };

  // Otellerin marker'larını haritaya ekle
  useEffect(() => {
    if (!map || !hotels.length || !infoWindowRef.current) return;

    // ✅ Eski marker'ları tamamen temizle
    markers.forEach(marker => {
      // Event listener'ları temizle
      window.google.maps.event.clearInstanceListeners(marker);
      marker.setMap(null);
    });

    // ✅ InfoWindow'u kapat
    infoWindowRef.current.close();

    const newMarkers = [];
    const bounds = new window.google.maps.LatLngBounds();

    hotels.forEach((hotel, index) => {
      const position = hotel.coordinates && hotel.coordinates.lat && hotel.coordinates.lng
        ? hotel.coordinates
        : generateHotelPosition(hotel, index, getMapCenter());
      
      const isSelected = selectedHotel?.id === hotel.id;
      const markerIcon = {
        path: 'M12,2C8.13,2 5,5.13 5,9c0,5.25 7,13 7,13s7,-7.75 7,-13C19,5.13 15.87,2 12,2z',
        fillColor: isSelected ? '#ff6b6b' : '#4285f4',
        fillOpacity: 1,
        strokeColor: '#ffffff',
        strokeWeight: 2,
        scale: isSelected ? 2 : 1.5,
        anchor: new window.google.maps.Point(12, 22)
      };

      const marker = new window.google.maps.Marker({
        position: position,
        map: map,
        title: hotel.name,
        icon: markerIcon,
        zIndex: isSelected ? 1000 : 100
      });

      // ✅ Sadece tek bir click listener ekle
      marker.addListener('click', () => {
        openInfoWindow(hotel, marker);
        if (onHotelSelect) {
          onHotelSelect(hotel);
        }
      });

      // Hotel ID'sini marker'a ekle
      marker.hotelId = hotel.id;
      newMarkers.push(marker);
      bounds.extend(position);
    });

    // ✅ InfoWindow kapatıldığında seçimi kaldır
    infoWindowRef.current.addListener('closeclick', () => {
      if (onHotelSelect) {
        onHotelSelect(null);
      }
    });

    // Haritayı tüm marker'ları içerecek şekilde ayarla - sadece ilk yüklemede
    if (hotels.length > 0 && isInitialLoad) {
      map.fitBounds(bounds);
      const listener = window.google.maps.event.addListener(map, 'idle', () => {
        const zoom = map.getZoom();
        if (zoom > MAX_ZOOM_FOR_SELECTION) {
          map.setZoom(MAX_ZOOM_FOR_SELECTION);
        }
        if (zoom < MIN_ZOOM_FOR_SELECTION) {
          map.setZoom(MIN_ZOOM_FOR_SELECTION);
        }
        window.google.maps.event.removeListener(listener);
        setIsInitialLoad(false);
      });
    } else if (!isInitialLoad) {
      setIsInitialLoad(false);
    }

    setMarkers(newMarkers);
  }, [map, hotels, selectedHotel, navigate, searchData, isInitialLoad]);

  // ✅ Seçilen otele geçiş
  useEffect(() => {
    if (!map || !selectedHotel || !markers.length || isInitialLoad || !infoWindowRef.current) return;

    const selectedMarker = markers.find(marker => marker.hotelId === selectedHotel.id);
    
    if (selectedMarker) {
      setShowMapToggle(true);
      const position = selectedMarker.getPosition();
      const currentZoom = map.getZoom();
      
      map.panTo(position);
      
      const panListener = map.addListener('idle', () => {
        window.google.maps.event.removeListener(panListener);
        
        if (currentZoom < MIN_ZOOM_FOR_SELECTION) {
          map.setZoom(MIN_ZOOM_FOR_SELECTION);
        } else if (currentZoom > MAX_ZOOM_FOR_SELECTION) {
          map.setZoom(MAX_ZOOM_FOR_SELECTION);
        }
        
        // ✅ InfoWindow'u aç
        setTimeout(() => {
          openInfoWindow(selectedHotel, selectedMarker);
        }, 150);
      });
    }
  }, [selectedHotel, map, markers, navigate, isInitialLoad]);

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

  // Otel detay sayfasına yönlendirme fonksiyonu
  const navigateToHotelDetail = (hotel) => {
    navigate(`/hotel/${hotel.id}`, {
      state: {
        hotel: hotel,
        searchData: searchData
      }
    });
  };

  // Global click listener için unique ID oluşturma
  const generateUniqueId = () => {
    return 'hotel-' + Math.random().toString(36).substr(2, 9);
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
          <div>
            <p>🗺️ {hotels.length} otel gösteriliyor</p>
            {searchData?.destinationName && (
              <p>📍 {searchData.destinationName}</p>
            )}
            {selectedHotel && (
              <p>🔍 Seçilen: {selectedHotel.name}</p>
            )}
          </div>
          <div style={{ fontSize: '12px', color: '#888', fontStyle: 'italic' }}>
            💡 Otel detayları için popup'taki otel adına tıklayın
          </div>
        </div>
      </div>
    </div>
  );
}

export default HotelMap;