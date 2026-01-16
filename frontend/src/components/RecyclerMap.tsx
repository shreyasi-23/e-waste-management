import { useState, useCallback } from 'react';
import { GoogleMap, useJsApiLoader, Marker, InfoWindow } from '@react-google-maps/api';
import type { RecyclingCenter } from '../types';
import './RecyclerMap.css';

interface RecyclerMapProps {
  recyclers: RecyclingCenter[];
  userLocation: { lat: number; lng: number } | null;
  selectedType?: string;
  onMarkerClick?: (recycler: RecyclingCenter) => void;
}

const mapContainerStyle = {
  width: '100%',
  height: '400px',
};

const defaultCenter = {
  lat: 39.2904, // Baltimore
  lng: -76.6122,
};

function RecyclerMap({ recyclers, userLocation, selectedType, onMarkerClick }: RecyclerMapProps) {
  const [selectedRecycler, setSelectedRecycler] = useState<RecyclingCenter | null>(null);

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
  });

  const handleMarkerClick = useCallback((recycler: RecyclingCenter) => {
    setSelectedRecycler(recycler);
    onMarkerClick?.(recycler);
  }, [onMarkerClick]);

  const center = userLocation || defaultCenter;

  if (loadError) {
    return <div className="map-loading">Error loading maps</div>;
  }

  if (!isLoaded) {
    return <div className="map-loading">Loading map...</div>;
  }

  return (
    <GoogleMap
      mapContainerStyle={mapContainerStyle}
      center={center}
      zoom={12}
    >
      {/* User location marker */}
      {userLocation && (
        <Marker
          position={userLocation}
          icon={{
            url: 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png',
          }}
          title="Your Location"
        />
      )}

      {/* Recycler markers */}
      {recyclers.map(recycler => (
        <Marker
          key={recycler.id}
          position={recycler.location}
          onClick={() => handleMarkerClick(recycler)}
          icon={{
            url: recycler.acceptedTypes.includes(selectedType || '')
              ? 'http://maps.google.com/mapfiles/ms/icons/green-dot.png'
              : 'http://maps.google.com/mapfiles/ms/icons/red-dot.png',
          }}
        />
      ))}

      {/* InfoWindow for selected recycler */}
      {selectedRecycler && (
        <InfoWindow
          position={selectedRecycler.location}
          onCloseClick={() => setSelectedRecycler(null)}
        >
          <div className="info-window">
            <h3>{selectedRecycler.name}</h3>
            <p>{selectedRecycler.address}</p>
            {selectedRecycler.phone && <p>Phone: {selectedRecycler.phone}</p>}
            {selectedRecycler.hours && <p>Hours: {selectedRecycler.hours}</p>}
            {selectedRecycler.distance && (
              <p><strong>{selectedRecycler.distance} miles away</strong></p>
            )}
            <div className="accepted-types">
              <p><strong>Accepts:</strong></p>
              <ul>
                {selectedRecycler.acceptedTypes.map(type => (
                  <li key={type}>{type}</li>
                ))}
              </ul>
            </div>
          </div>
        </InfoWindow>
      )}
    </GoogleMap>
  );
}

export default RecyclerMap;