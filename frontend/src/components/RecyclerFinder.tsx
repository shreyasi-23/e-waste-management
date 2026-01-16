import { useState, useEffect } from 'react';
import RecyclerMap from './RecyclerMap';
import { getNearbyRecyclers } from '../services/api';
import type { RecyclingCenter } from '../types';
import './RecyclerFinder.css';

const eWasteTypes = [
  'All Types',
  'Computers & Laptops',
  'Smartphones & Tablets',
  'Televisions & Monitors',
  'Printers & Scanners',
  'Batteries',
  'Circuit Boards',
];

function RecyclerFinder() {
  const [recyclers, setRecyclers] = useState<RecyclingCenter[]>([]);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [selectedType, setSelectedType] = useState<string>('All Types');
  const [radius, setRadius] = useState(10);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get user's location on mount
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (err) => {
          console.error('Geolocation error:', err);
          // Default to Baltimore if geolocation fails
          setUserLocation({ lat: 39.2904, lng: -76.6122 });
        }
      );
    }
  }, []);

  // Fetch recyclers when location or filters change
  useEffect(() => {
    if (!userLocation) return;

    const fetchRecyclers = async () => {
      setLoading(true);
      setError(null);
      try {
        const type = selectedType === 'All Types' ? undefined : selectedType;
        const data = await getNearbyRecyclers(
          userLocation.lat,
          userLocation.lng,
          radius,
          type
        );
        setRecyclers(data);
      } catch (err) {
        setError('Failed to load recycling centers');
      } finally {
        setLoading(false);
      }
    };

    fetchRecyclers();
  }, [userLocation, selectedType, radius]);

  return (
    <div className="recycler-finder">
      <h2>Find E-Waste Recyclers Near You</h2>

      <div className="filters">
        <div className="filter-group">
          <label htmlFor="type-select">E-Waste Type:</label>
          <select
            id="type-filter"
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
          >
            {eWasteTypes.map((type) => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label htmlFor="radius-filter">Search Radius:</label>
          <select
            id="radius-filter"
            value={radius}
            onChange={(e) => setRadius(Number(e.target.value))}
          >
            <option value={5}>5 miles</option>
            <option value={10}>10 miles</option>
            <option value={25}>25 miles</option>
            <option value={50}>50 miles</option>
          </select>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      <RecyclerMap
        recyclers={recyclers}
        userLocation={userLocation}
        selectedType={selectedType !== 'All Types' ? selectedType : undefined}
      />

      <div className="recycler-list">
        <h3>
          {loading ? 'Loading...' : `${recyclers.length} Recyclers Found`}
        </h3>
        {recyclers.map(recycler => (
          <div key={recycler.id} className="recycler-card">
            <div className="recycler-header">
              <h4>{recycler.name}</h4>
              {recycler.rating && (
                <span className="rating">★ {recycler.rating}</span>
              )}
            </div>
            <p className="address">{recycler.address}</p>
            {recycler.distance && (
              <p className="distance">{recycler.distance} miles away</p>
            )}
            <div className="accepted-types">
              {recycler.acceptedTypes.map(type => (
                <span
                  key={type}
                  className={`type-badge ${type === selectedType ? 'highlighted' : ''}`}
                >
                  {type}
                </span>
              ))}
            </div>
            {recycler.phone && (
              <a href={`tel:${recycler.phone}`} className="phone-link">
                {recycler.phone}
              </a>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default RecyclerFinder;