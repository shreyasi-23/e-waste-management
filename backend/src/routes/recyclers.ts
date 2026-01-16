import express, { Request, Response } from 'express';
import type {
  RecyclingCenter,
  NearbyRecyclersQuery,
  ErrorResponse,
  GooglePlaceResult
} from '../types/index.js';

const router = express.Router();

const GOOGLE_PLACES_API_URL = 'https://maps.googleapis.com/maps/api/place';

// E-waste related keywords for searching
const EWASTE_SEARCH_QUERIES = [
  'e-waste recycling',
  'electronics recycling',
  'computer recycling',
  'electronic waste disposal',
];

// Map place types to accepted e-waste types
function inferAcceptedTypes(placeName: string, _placeTypes: string[] = []): string[] {
  const name = placeName.toLowerCase();
  const acceptedTypes: string[] = [];

  // Infer based on business name
  if (name.includes('computer') || name.includes('pc')) {
    acceptedTypes.push('Computers & Laptops');
  }
  if (name.includes('phone') || name.includes('mobile') || name.includes('cell')) {
    acceptedTypes.push('Smartphones & Tablets');
  }
  if (name.includes('tv') || name.includes('television') || name.includes('monitor')) {
    acceptedTypes.push('Televisions & Monitors');
  }
  if (name.includes('battery') || name.includes('batteries')) {
    acceptedTypes.push('Batteries');
  }
  if (name.includes('printer')) {
    acceptedTypes.push('Printers & Scanners');
  }

  // If it's a general e-waste/electronics recycler, they likely accept most types
  if (name.includes('e-waste') || name.includes('ewaste') ||
      name.includes('electronic') || name.includes('recycl')) {
    if (acceptedTypes.length === 0) {
      acceptedTypes.push(
        'Computers & Laptops',
        'Smartphones & Tablets',
        'Televisions & Monitors',
        'Batteries',
        'Circuit Boards'
      );
    }
  }

  // Default if nothing matched
  if (acceptedTypes.length === 0) {
    acceptedTypes.push('Other Electronics');
  }

  return [...new Set(acceptedTypes)]; // Remove duplicates
}

// Calculate distance between two points using Haversine formula
function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 3959; // Earth's radius in miles
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10; // Round to 1 decimal
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}

// Convert Google Place to RecyclingCenter
function placeToRecyclingCenter(
  place: GooglePlaceResult,
  userLat: number,
  userLng: number
): RecyclingCenter {
  return {
    id: place.place_id,
    name: place.name,
    address: place.formatted_address || place.vicinity || 'Address not available',
    location: {
      lat: place.geometry.location.lat,
      lng: place.geometry.location.lng,
    },
    phone: place.formatted_phone_number,
    website: place.website,
    acceptedTypes: inferAcceptedTypes(place.name, place.types),
    hours: place.opening_hours?.weekday_text?.join(', '),
    distance: calculateDistance(
      userLat,
      userLng,
      place.geometry.location.lat,
      place.geometry.location.lng
    ),
    rating: place.rating,
    isOpen: place.opening_hours?.open_now,
  };
}

// GET /api/recyclers/nearby - Find nearby e-waste recyclers
router.get('/nearby', async (
  req: Request<object, RecyclingCenter[] | ErrorResponse, object, NearbyRecyclersQuery>,
  res: Response
) => {
  try {
    const { lat, lng, radius = '10', type } = req.query;

    if (!lat || !lng) {
      res.status(400).json({ error: 'lat and lng query parameters are required' });
      return;
    }

    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      res.status(500).json({ error: 'Google Maps API key not configured' });
      return;
    }

    const userLat = parseFloat(lat);
    const userLng = parseFloat(lng);
    const radiusMeters = parseFloat(radius) * 1609.34; // Convert miles to meters

    // Search for e-waste recyclers using multiple queries
    const allPlaces: GooglePlaceResult[] = [];
    const seenPlaceIds = new Set<string>();

    for (const query of EWASTE_SEARCH_QUERIES) {
      const searchUrl = new URL(`${GOOGLE_PLACES_API_URL}/textsearch/json`);
      searchUrl.searchParams.append('query', query);
      searchUrl.searchParams.append('location', `${userLat},${userLng}`);
      searchUrl.searchParams.append('radius', radiusMeters.toString());
      searchUrl.searchParams.append('key', apiKey);

      const response = await fetch(searchUrl.toString());
      const data = await response.json() as { results: GooglePlaceResult[]; status: string };

      if (data.status === 'OK' && data.results) {
        for (const place of data.results) {
          if (!seenPlaceIds.has(place.place_id)) {
            seenPlaceIds.add(place.place_id);
            allPlaces.push(place);
          }
        }
      }
    }

    // Convert to RecyclingCenter format
    let recyclers = allPlaces.map(place =>
      placeToRecyclingCenter(place, userLat, userLng)
    );

    // Filter by e-waste type if specified
    if (type) {
      recyclers = recyclers.filter(r => r.acceptedTypes.includes(type));
    }

    // Sort by distance
    recyclers.sort((a, b) => (a.distance || 0) - (b.distance || 0));

    // Limit results
    recyclers = recyclers.slice(0, 20);

    res.json(recyclers);
  } catch (error) {
    const err = error as Error;
    console.error('Error fetching recyclers:', err.message);
    res.status(500).json({ error: 'Failed to fetch recyclers', details: err.message });
  }
});

// GET /api/recyclers/:id - Get details for a specific recycler
router.get('/:id', async (
  req: Request<{ id: string }, RecyclingCenter | ErrorResponse>,
  res: Response
) => {
  try {
    const { id } = req.params;
    const { lat, lng } = req.query as { lat?: string; lng?: string };

    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      res.status(500).json({ error: 'Google Maps API key not configured' });
      return;
    }

    // Get place details
    const detailsUrl = new URL(`${GOOGLE_PLACES_API_URL}/details/json`);
    detailsUrl.searchParams.append('place_id', id);
    detailsUrl.searchParams.append('fields',
      'place_id,name,formatted_address,geometry,formatted_phone_number,website,opening_hours,rating,types'
    );
    detailsUrl.searchParams.append('key', apiKey);

    const response = await fetch(detailsUrl.toString());
    const data = await response.json() as { result: GooglePlaceResult; status: string };

    if (data.status !== 'OK' || !data.result) {
      res.status(404).json({ error: 'Recycler not found' });
      return;
    }

    const userLat = lat ? parseFloat(lat) : data.result.geometry.location.lat;
    const userLng = lng ? parseFloat(lng) : data.result.geometry.location.lng;

    const recycler = placeToRecyclingCenter(data.result, userLat, userLng);
    res.json(recycler);
  } catch (error) {
    const err = error as Error;
    console.error('Error fetching recycler details:', err.message);
    res.status(500).json({ error: 'Failed to fetch recycler details', details: err.message });
  }
});

export default router;
