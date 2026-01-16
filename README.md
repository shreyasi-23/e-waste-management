# E-Waste Valuation Platform

A web application that helps users discover economic opportunities in electronic waste through AI-powered analysis and connects them with nearby recycling centers.

## Features

- **AI-Powered E-Waste Analysis**: Upload images or enter details about your e-waste to receive valuation estimates, recycling recommendations, and environmental impact information powered by Google Gemini AI.

- **Find Nearby Recyclers**: Locate e-waste recycling centers near you using Google Maps integration, filter by e-waste type, and view details like accepted materials, ratings, and contact information.

## Tech Stack

### Frontend
- React 19 with TypeScript
- Vite for build tooling
- Google Maps API (`@react-google-maps/api`)

### Backend
- Node.js with Express
- TypeScript
- Google Gemini AI API for e-waste analysis
- Google Places API for recycler search

## Getting Started

### Prerequisites
- Node.js 18+
- Google Cloud API keys (Gemini AI and Maps/Places APIs)

### Environment Setup

**Backend** (`backend/.env`):
```env
GEMINI_API_KEY=your_gemini_api_key
GOOGLE_MAPS_API_KEY=your_google_maps_api_key
PORT=3001
```

**Frontend** (`frontend/.env`):
```env
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
```

### Installation

```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### Running the Application

```bash
# Start the backend (from backend directory)
npm run dev

# Start the frontend (from frontend directory)
npm run dev
```

The frontend runs at `http://localhost:5173` and the backend at `http://localhost:3001`.

## API Endpoints

### E-Waste Analysis
```
POST /api/analyze
```
Analyzes e-waste data and images, returns valuation and recycling recommendations.

### Recyclers
```
GET /api/recyclers/nearby?lat=<lat>&lng=<lng>&radius=<miles>&type=<ewaste_type>
```
Returns nearby e-waste recycling centers.

```
GET /api/recyclers/:id
```
Returns details for a specific recycler.

### Health Check
```
GET /health
```

## Project Structure

```
e-waste-management/
├── frontend/
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── services/        # API client
│   │   └── types/           # TypeScript types
│   └── package.json
├── backend/
│   ├── src/
│   │   ├── routes/          # Express routes
│   │   └── types/           # TypeScript types
│   └── package.json
└── README.md
```
