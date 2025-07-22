import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import '../../styles/HotelMap.css';

function HotelMap({ hotels, selectedHotel, onHotelSelect, searchData }) {
  const mapRef = useRef(null);
  const [map, setMap] = useState(null);
  const [markers, setMarkers] = useState([]);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [showMapToggle, setShowMapToggle] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true); // İlk yüklenme kontrolü
  const navigate = useNavigate();

  // En üstte API key'i tanımlayın
  const API_KEY = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;

  // Minimum zoom seviyesi - bu seviyeden sonra zoom değişmeyecek
  const MIN_ZOOM_FOR_SELECTION = 14;
  const MAX_ZOOM_FOR_SELECTION = 16; // Maksimum zoom seviyesi

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
        scale: isSelected ? 2 : 1.5, // Seçili otel daha büyük
        anchor: new window.google.maps.Point(12, 22)
      };

      const marker = new window.google.maps.Marker({
        position: position,
        map: map,
        title: hotel.name,
        icon: markerIcon,
        zIndex: isSelected ? 1000 : 100
      });

      // Unique ID oluştur
      const uniqueId = generateUniqueId();

      // Marker'a tıklandığında otel bilgilerini göster
      const infoWindow = new window.google.maps.InfoWindow({
        content: `
          <div class="hotel-map-info">
           <img 
              src="${hotel.image || hotel.photoUrl || 'https://via.placeholder.com/120x80?text=No+Image'}" 
              alt="${hotel.name}" 
              style="width: 120px; height: 80px; object-fit: cover; border-radius: 6px; margin-bottom: 8px;"
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
              💡 Detaylar için otel adına tıklayın
            </div>
          </div>
        `
      });

      // Click event listener
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

        // InfoWindow açıldıktan sonra click listener'ı ekle
        setTimeout(() => {
          const hotelNameElement = document.getElementById(uniqueId);
          if (hotelNameElement) {
            hotelNameElement.onclick = (e) => {
              e.stopPropagation();
              navigateToHotelDetail(hotel);
            };
          }
        }, 100);
      });

      // InfoWindow kapatıldığında seçimi kaldır
      window.google.maps.event.addListener(infoWindow, 'closeclick', () => {
        if (onHotelSelect) {
          onHotelSelect(null);
        }
      });

      // InfoWindow'u marker'a bağla ve hotel id'sini ekle
      marker.infoWindow = infoWindow;
      marker.hotelId = hotel.id;
      newMarkers.push(marker);
      bounds.extend(position);
    });

    // Haritayı tüm marker'ları içerecek şekilde ayarla - sadece ilk yüklemede
    if (hotels.length > 0 && isInitialLoad) {
      map.fitBounds(bounds);
      // Zoom seviyesini kontrol et
      const listener = window.google.maps.event.addListener(map, 'idle', () => {
        const zoom = map.getZoom();
        if (zoom > MAX_ZOOM_FOR_SELECTION) {
          map.setZoom(MAX_ZOOM_FOR_SELECTION);
        }
        if (zoom < MIN_ZOOM_FOR_SELECTION) {
          map.setZoom(MIN_ZOOM_FOR_SELECTION);
        }
        window.google.maps.event.removeListener(listener);
        setIsInitialLoad(false); // İlk yükleme tamamlandı
      });
    } else if (!isInitialLoad) {
      // İlk yüklemeden sonraki marker güncellemelerinde zoom'u değiştirme
      setIsInitialLoad(false);
    }

    setMarkers(newMarkers);
  }, [map, hotels, selectedHotel, navigate, searchData, isInitialLoad]);

  // ✅ Seçilen otele geçiş - SMOOTH PAN (yumuşak kaydırma)
  useEffect(() => {
    if (!map || !selectedHotel || !markers.length || isInitialLoad) return;

    // Seçilen otelin marker'ını bul
    const selectedMarker = markers.find(marker => marker.hotelId === selectedHotel.id);
    
    if (selectedMarker) {
      // Önce haritayı otomatik olarak açık hale getir
      setShowMapToggle(true);
      
      // Seçilen otelin konumuna git
      const position = selectedMarker.getPosition();
      
      // Diğer InfoWindow'ları kapat
      markers.forEach(m => {
        if (m.infoWindow) {
          m.infoWindow.close();
        }
      });
      
      // Mevcut zoom seviyesini al ve sabit tut
      const currentZoom = map.getZoom();
      
      // SMOOTH PAN - Yumuşak geçiş animasyonu
      map.panTo(position);
      
      // Alternatif olarak daha kontrole edilebilir smooth pan:
      // const currentCenter = map.getCenter();
      // const lat1 = currentCenter.lat();
      // const lng1 = currentCenter.lng();
      // const lat2 = position.lat;
      // const lng2 = position.lng;
      // 
      // // Animasyon adımları
      // let step = 0;
      // const steps = 30; // 30 adımda geçiş yap
      // 
      // const smoothPan = () => {
      //   step++;
      //   const progress = step / steps;
      //   const easeProgress = 1 - Math.pow(1 - progress, 3); // Ease-out cubic
      //   
      //   const currentLat = lat1 + (lat2 - lat1) * easeProgress;
      //   const currentLng = lng1 + (lng2 - lng1) * easeProgress;
      //   
      //   map.setCenter({ lat: currentLat, lng: currentLng });
      //   
      //   if (step < steps) {
      //     requestAnimationFrame(smoothPan);
      //   }
      // };
      // smoothPan();
      
      // Pan tamamlandığında zoom kontrolü ve InfoWindow açma
      const panListener = map.addListener('idle', () => {
        // Listener'ı temizle
        window.google.maps.event.removeListener(panListener);
        
        // Sadece zoom çok düşük/yüksekse ayarla
        if (currentZoom < MIN_ZOOM_FOR_SELECTION) {
          map.setZoom(MIN_ZOOM_FOR_SELECTION);
        } else if (currentZoom > MAX_ZOOM_FOR_SELECTION) {
          map.setZoom(MAX_ZOOM_FOR_SELECTION);
        }
        
        // InfoWindow'u aç (pan animasyonu bittikten sonra)
        setTimeout(() => {
          selectedMarker.infoWindow.open(map, selectedMarker);
          
          // Click listener'ı ekle
          setTimeout(() => {
            const hotelNameElements = document.querySelectorAll('[id^="hotel-"]');
            hotelNameElements.forEach(element => {
              if (element.textContent.trim() === selectedHotel.name) {
                element.addEventListener('click', (e) => {
                  e.stopPropagation();
                  navigateToHotelDetail(selectedHotel);
                });
              }
            });
          }, 100);
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
            <p> {hotels.length} otel gösteriliyor</p>
            {searchData?.destinationName && (
              <p> {searchData.destinationName}</p>
            )}
            {selectedHotel && (
              <p>🔍 Seçilen: {selectedHotel.name}</p>
            )}
          </div>
          <div style={{ fontSize: '12px', color: '#888', fontStyle: 'italic' }}>
             Otel detayları için popup'taki otel adına tıklayın
          </div>
        </div>
      </div>
    </div>
  );
}

export default HotelMap;