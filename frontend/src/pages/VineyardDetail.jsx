import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getVineyardById, getNearbyHotels, getNearbyPois, getNearbyRestaurants } from '../utils/api';
import MapView from '../components/MapView';
import { LoadingSpinner, EmptyState } from '../components/Loading';

export default function VineyardDetail() {
  const { vineyard_id } = useParams();
  const [vineyard, setVineyard] = useState(null);
  const [hotels, setHotels] = useState([]);
  const [pois, setPois] = useState([]);
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('hotels');
  const [radius, setRadius] = useState(50);

  useEffect(() => {
    setLoading(true);
    getVineyardById(vineyard_id)
      .then(data => {
        setVineyard(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [vineyard_id]);

  useEffect(() => {
    if (!vineyard_id) return;
    getNearbyHotels(vineyard_id, radius).then(d => setHotels(d.hotels || [])).catch(console.error);
    getNearbyPois(vineyard_id, radius).then(d => setPois(d.pois || [])).catch(console.error);
    getNearbyRestaurants(vineyard_id, radius).then(d => setRestaurants(d.restaurants || [])).catch(console.error);
  }, [vineyard_id, radius]);

  if (loading) return <div className="page-wrapper container" style={{ paddingTop: 40 }}><LoadingSpinner /></div>;
  if (!vineyard) return <div className="page-wrapper container" style={{ paddingTop: 40 }}><EmptyState icon="&#127815;" title="Vineyard not found" /></div>;

  const renderStars = (rating) => {
    const full = Math.floor(rating);
    return '★'.repeat(full) + (rating % 1 >= 0.5 ? '½' : '') + '☆'.repeat(5 - Math.ceil(rating));
  };

  const allMarkers = [
    { lat: vineyard.latitude, lng: vineyard.longitude, color: 'wine', popup: <strong>{vineyard.name}</strong> },
    ...hotels.map(h => ({ lat: h.latitude, lng: h.longitude, color: 'blue', popup: <span>{h.hotel_name} ({h.rating}★)</span> })),
    ...restaurants.map(r => ({ lat: r.latitude, lng: r.longitude, color: 'gold', popup: <span>{r.name} — {r.award}</span> })),
    ...pois.map(p => ({ lat: p.latitude, lng: p.longitude, color: 'green', popup: <span>{p.name}</span> })),
  ];

  return (
    <div className="page-wrapper">
      <div className="container" style={{ paddingTop: 32 }}>
        <Link to="/vineyards" style={{ fontSize: '0.9rem', color: 'var(--text-light)' }}>&larr; Back to Explorer</Link>

        <div style={{ marginTop: 16, marginBottom: 24 }}>
          <h1 style={{ fontSize: '2rem', marginBottom: 8 }}>{vineyard.name}</h1>
          <p style={{ color: 'var(--text-light)', fontSize: '1rem' }}>
            {vineyard.city_name}, {vineyard.state_name}, {vineyard.country_name}
          </p>
          {vineyard.website && (
            <a href={vineyard.website} target="_blank" rel="noopener noreferrer" className="btn btn-secondary" style={{ marginTop: 12 }}>
              Visit Website &#8599;
            </a>
          )}
        </div>

        {/* Map */}
        <div style={{ marginBottom: 32 }}>
          <MapView
            center={[parseFloat(vineyard.latitude), parseFloat(vineyard.longitude)]}
            zoom={10}
            markers={allMarkers}
            height="400px"
          />
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 8 }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-light)' }}>
              &#9679; <span style={{ color: '#C0392B' }}>Vineyard</span>&ensp;
              &#9679; <span style={{ color: '#2A81CB' }}>Hotels</span>&ensp;
              &#9679; <span style={{ color: '#C9A84C' }}>Restaurants</span>&ensp;
              &#9679; <span style={{ color: '#2AAD27' }}>Attractions</span>
            </span>
          </div>
        </div>

        {/* Radius Slider */}
        <div className="card" style={{ marginBottom: 24, display: 'flex', alignItems: 'center', gap: 16 }}>
          <label style={{ fontWeight: 600, whiteSpace: 'nowrap' }}>Search Radius:</label>
          <input
            type="range"
            min={5}
            max={200}
            value={radius}
            onChange={e => setRadius(Number(e.target.value))}
            style={{ flex: 1 }}
          />
          <span style={{ fontWeight: 600, color: 'var(--wine)', minWidth: 60 }}>{radius} km</span>
        </div>

        {/* Tabs */}
        <div className="tabs">
          <button className={`tab ${activeTab === 'hotels' ? 'active' : ''}`} onClick={() => setActiveTab('hotels')}>
            Hotels ({hotels.length})
          </button>
          <button className={`tab ${activeTab === 'restaurants' ? 'active' : ''}`} onClick={() => setActiveTab('restaurants')}>
            Restaurants ({restaurants.length})
          </button>
          <button className={`tab ${activeTab === 'pois' ? 'active' : ''}`} onClick={() => setActiveTab('pois')}>
            Attractions ({pois.length})
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'hotels' && (
          hotels.length === 0 ? <EmptyState icon="&#127976;" title="No hotels nearby" message={`No hotels found within ${radius}km.`} /> : (
            <div className="grid-2">
              {hotels.map((h, i) => (
                <div key={i} className="card">
                  <h4 style={{ color: 'var(--wine)', marginBottom: 4 }}>{h.hotel_name}</h4>
                  <div className="stars" style={{ marginBottom: 6 }}>{renderStars(h.rating)}</div>
                  <p style={{ fontSize: '0.88rem', color: 'var(--text-light)', marginBottom: 4 }}>{h.address}</p>
                  <p style={{ fontSize: '0.88rem', color: 'var(--text-light)' }}>{h.city_name}</p>
                  <span className="badge badge-wine" style={{ marginTop: 8 }}>{h.distance_km} km away</span>
                </div>
              ))}
            </div>
          )
        )}

        {activeTab === 'restaurants' && (
          restaurants.length === 0 ? <EmptyState icon="&#127860;" title="No restaurants nearby" message={`No Michelin restaurants found within ${radius}km.`} /> : (
            <div className="grid-2">
              {restaurants.map((r, i) => (
                <div key={i} className="card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <h4 style={{ color: 'var(--wine)', marginBottom: 4 }}>{r.name}</h4>
                    <span className="badge badge-gold">{r.award}</span>
                  </div>
                  <p style={{ fontSize: '0.88rem', color: 'var(--text-light)', marginBottom: 4 }}>{r.cuisine}</p>
                  {r.price && <p style={{ fontSize: '0.88rem', color: 'var(--gold)' }}>{r.price}</p>}
                  <span className="badge badge-wine" style={{ marginTop: 8 }}>{r.distance_km} km away</span>
                </div>
              ))}
            </div>
          )
        )}

        {activeTab === 'pois' && (
          pois.length === 0 ? <EmptyState icon="&#128205;" title="No attractions nearby" message={`No attractions found within ${radius}km.`} /> : (
            <div className="grid-2">
              {pois.map((p, i) => (
                <div key={i} className="card">
                  <h4 style={{ color: 'var(--wine)', marginBottom: 4 }}>{p.name}</h4>
                  <span className="badge badge-green" style={{ marginBottom: 6 }}>{p.category_name}</span>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-light)', marginTop: 6 }}>
                    Popularity: {p.num_links} links &middot; {p.distance_km} km away
                  </p>
                </div>
              ))}
            </div>
          )
        )}
      </div>
    </div>
  );
}
