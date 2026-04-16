# VinoVoyage — Wine Region Travel Companion

A full-stack web application for exploring vineyards, Michelin restaurants, luxury hotels, and attractions across 83 countries. Built for the CIS 5500 (Database and Information Systems) final project at the University of Pennsylvania.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19 + Vite 8, React Router, Recharts, Leaflet |
| Backend | Node.js + Express 4, PostgreSQL (pg driver) |
| Database | PostgreSQL on AWS RDS (8 tables, 1.66M+ records) |
| Caching | node-cache (server-side, TTL-based) |
| Auth | JWT httpOnly cookies (for Google OAuth) |
| Deployment | Vercel (frontend) + Render (backend) |

## Project Structure

```
vinovoyage/
├── backend/
│   ├── config/          # Database connection, cache setup
│   ├── controllers/     # Query logic for all 13 API routes
│   ├── middleware/       # Auth, validation, timing, error handling
│   ├── routes/          # Express route definitions
│   ├── server.js        # Main entry point
│   └── .env             # Environment variables
├── frontend/
│   ├── src/
│   │   ├── components/  # Navbar, MapView, Pagination, Loading, ErrorBoundary
│   │   ├── hooks/       # useFetch custom hook
│   │   ├── pages/       # 7 page components
│   │   ├── styles/      # Global CSS with wine theme
│   │   └── utils/       # API utility module
│   └── .env             # Frontend environment variables
└── README.md
```

## Pages (7 Total)

1. **Home** — Hero section, animated stats bar, ecosystem score chart, feature cards
2. **Vineyard Explorer** — Cascading country/state/city filters, name search, list/map toggle, pagination
3. **Vineyard Detail** — Interactive Leaflet map with nearby hotels/restaurants/attractions, radius slider, tabbed content
4. **Regional Insights** — Three analytics tabs: Ecosystem Rankings, Dining Pairing Scores, Outdoor Activities (with Recharts)
5. **Trip Planner** — City autocomplete search, curated itinerary bundle with vineyards, hotels, restaurants, and attractions
6. **Hotels & Dining** — Dual-tab browser for hotels (rating filter) and Michelin restaurants (cuisine, award, country filters)
7. **Attractions Explorer** — Category pie chart, category chips, text/country filters, 421K+ POIs with pagination

## API Routes (13 Total)

| Route | Method | Description | Query |
|-------|--------|-------------|-------|
| `/api/regions/top` | GET | Tourism ecosystem score rankings | Q1 (Complex) |
| `/api/vineyards` | GET | Search/filter vineyards | Q2 |
| `/api/locations/states` | GET | Get states by country | Q3 |
| `/api/locations/cities` | GET | Get cities by state | Q3 |
| `/api/vineyards/:id/hotels` | GET | Nearby hotels (Haversine) | Q4 (Complex) |
| `/api/vineyards/:id/pois` | GET | Nearby attractions (Haversine) | Q5 |
| `/api/vineyards/:id/restaurants` | GET | Nearby Michelin restaurants | Q6 |
| `/api/regions/dining-scores` | GET | Vineyard-dining pairing scores | Q7 (Complex) |
| `/api/regions/outdoor` | GET | Outdoor activity regions | Q8 |
| `/api/cities/:id/bundle` | GET | City trip bundle (4 CTEs) | Q9 (Complex) |
| `/api/hotels` | GET | Browse/filter hotels | Q10 |
| `/api/restaurants` | GET | Browse/filter restaurants | Q11 |
| `/api/pois` | GET | Browse/filter attractions | Q12 |
| `/api/categories/stats` | GET | Category distribution stats | Q13 |

## Extra Credit Features

- **Server-side caching** with node-cache (TTL-based, cache-clear endpoint)
- **Query timing instrumentation** via middleware (logs execution time)
- **Input validation and sanitization** middleware
- **Error boundary** component for graceful frontend error handling
- **Bounding-box pre-filter** optimization for geospatial queries (Q4, Q5, Q6)
- **JWT authentication** middleware (prepared for Google OAuth integration)
- **Responsive design** with mobile-friendly layout

## Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL database (connection details in `.env`)

### Backend Setup
```bash
cd backend
npm install
# Configure .env with your database credentials
node server.js
# Server starts on http://localhost:3001
```

### Frontend Setup
```bash
cd frontend
npm install
# Configure .env with VITE_API_URL
npx vite --port 5173
# App starts on http://localhost:5173
```

### Environment Variables

**Backend `.env`:**
```
DB_HOST=vinovoyage-db.c924km0k6zyy.us-east-1.rds.amazonaws.com
DB_PORT=5432
DB_NAME=vinovoyage
DB_USER=postgres
DB_PASSWORD=<your_password>
DB_SSL=true
JWT_SECRET=<your_jwt_secret>
FRONTEND_URL=http://localhost:5173
```

**Frontend `.env`:**
```
VITE_API_URL=http://localhost:3001
```

## Deployment

### Frontend (Vercel)
1. Push the `frontend/` directory to a GitHub repo
2. Connect to Vercel, set `VITE_API_URL` to your Render backend URL
3. Deploy

### Backend (Render)
1. Push the `backend/` directory to a GitHub repo
2. Create a new Web Service on Render
3. Set environment variables from `.env`
4. Deploy with `node server.js` as start command

## Design Theme

The application uses a wine-inspired color palette:
- **Deep Wine Red** (#722F37) — Primary brand color
- **Warm Cream** (#FAF6F0) — Background
- **Gold Accent** (#C9A84C) — Highlights and badges
- **Forest Green** (#4A7C59) — Outdoor/nature elements
- **Slate Blue** (#4A6FA5) — Hotels and secondary actions

Typography combines **Playfair Display** (serif, headings) with **Inter** (sans-serif, body text) for an elegant yet readable experience.
