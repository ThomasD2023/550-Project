import { useState, useEffect } from 'react';
import { filterHotels, filterRestaurants, getCountries } from '../utils/api';
import Pagination from '../components/Pagination';
import { LoadingSpinner, EmptyState } from '../components/Loading';

const LIMIT = 20;
const AWARDS = ['', '3 Stars', '2 Stars', '1 Star', 'Bib Gourmand', 'Selected Restaurants'];

export default function HotelsDining() {
  const [activeTab, setActiveTab] = useState('hotels');
  const [countries, setCountries] = useState([]);

  // Hotel state
  const [hotels, setHotels] = useState([]);
  const [hotelTotal, setHotelTotal] = useState(0);
  const [hotelPage, setHotelPage] = useState(1);
  const [hotelFilters, setHotelFilters] = useState({ minRating: 3, country: '' });
  const [hotelLoading, setHotelLoading] = useState(false);

  // Restaurant state
  const [restaurants, setRestaurants] = useState([]);
  const [restTotal, setRestTotal] = useState(0);
  const [restPage, setRestPage] = useState(1);
  const [restFilters, setRestFilters] = useState({ cuisine: '', award: '', country: '' });
  const [restLoading, setRestLoading] = useState(false);

  useEffect(() => {
    getCountries().then(d => setCountries(d.countries || [])).catch(console.error);
  }, []);

  // Fetch hotels
  useEffect(() => {
    setHotelLoading(true);
    filterHotels({
      minRating: hotelFilters.minRating,
      country: hotelFilters.country || undefined,
      limit: LIMIT,
      offset: (hotelPage - 1) * LIMIT,
    }).then(d => {
      setHotels(d.hotels || []);
      setHotelTotal(d.total || 0);
    }).catch(console.error).finally(() => setHotelLoading(false));
  }, [hotelPage, hotelFilters]);

  // Fetch restaurants
  useEffect(() => {
    setRestLoading(true);
    filterRestaurants({
      cuisine: restFilters.cuisine || undefined,
      award: restFilters.award || undefined,
      country: restFilters.country || undefined,
      limit: LIMIT,
      offset: (restPage - 1) * LIMIT,
    }).then(d => {
      setRestaurants(d.restaurants || []);
      setRestTotal(d.total || 0);
    }).catch(console.error).finally(() => setRestLoading(false));
  }, [restPage, restFilters]);

  const renderStars = (rating) => '★'.repeat(Math.round(rating)) + '☆'.repeat(5 - Math.round(rating));

  return (
    <div className="page-wrapper">
      <div className="container" style={{ paddingTop: 32 }}>
        <div className="section-header">
          <h2>Hotels & Dining</h2>
          <p>Browse luxury hotels and Michelin-starred restaurants worldwide</p>
        </div>

        <div className="tabs">
          <button className={`tab ${activeTab === 'hotels' ? 'active' : ''}`} onClick={() => setActiveTab('hotels')}>
            Hotels
          </button>
          <button className={`tab ${activeTab === 'restaurants' ? 'active' : ''}`} onClick={() => setActiveTab('restaurants')}>
            Michelin Restaurants
          </button>
        </div>

        {/* Hotels Tab */}
        {activeTab === 'hotels' && (
          <div>
            <div className="filters-bar">
              <div className="input-group" style={{ minWidth: 180 }}>
                <label>Min Rating: {hotelFilters.minRating}★</label>
                <input
                  type="range" min={1} max={5} step={0.5}
                  value={hotelFilters.minRating}
                  onChange={e => { setHotelFilters({ ...hotelFilters, minRating: Number(e.target.value) }); setHotelPage(1); }}
                />
              </div>
              <div className="input-group" style={{ minWidth: 180 }}>
                <label>Country</label>
                <select
                  className="input-field"
                  value={hotelFilters.country}
                  onChange={e => { setHotelFilters({ ...hotelFilters, country: e.target.value }); setHotelPage(1); }}
                >
                  <option value="">All Countries</option>
                  {countries.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>

            {hotelLoading ? <LoadingSpinner /> : hotels.length === 0 ? (
              <EmptyState icon="🏨" title="No hotels found" message="Try adjusting your filters." />
            ) : (
              <div className="grid-2">
                {hotels.map((h, i) => (
                  <div key={i} className="card">
                    <h4 style={{ color: 'var(--wine)', marginBottom: 4 }}>{h.hotel_name}</h4>
                    <div className="stars" style={{ marginBottom: 6 }}>{renderStars(h.rating)}</div>
                    <p style={{ fontSize: '0.88rem', color: 'var(--text-light)', marginBottom: 4 }}>
                      {h.city_name}, {h.state_name}, {h.country_name}
                    </p>
                    {h.address && <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{h.address}</p>}
                  </div>
                ))}
              </div>
            )}
            <Pagination page={hotelPage} total={hotelTotal} limit={LIMIT} onPageChange={setHotelPage} />
          </div>
        )}

        {/* Restaurants Tab */}
        {activeTab === 'restaurants' && (
          <div>
            <div className="filters-bar">
              <div className="input-group" style={{ flex: 1, minWidth: 180 }}>
                <label>Cuisine</label>
                <input
                  className="input-field"
                  type="text"
                  placeholder="e.g. French, Italian..."
                  value={restFilters.cuisine}
                  onChange={e => { setRestFilters({ ...restFilters, cuisine: e.target.value }); setRestPage(1); }}
                />
              </div>
              <div className="input-group" style={{ minWidth: 180 }}>
                <label>Award Level</label>
                <select
                  className="input-field"
                  value={restFilters.award}
                  onChange={e => { setRestFilters({ ...restFilters, award: e.target.value }); setRestPage(1); }}
                >
                  <option value="">All Awards</option>
                  {AWARDS.filter(Boolean).map(a => <option key={a} value={a}>{a}</option>)}
                </select>
              </div>
              <div className="input-group" style={{ minWidth: 180 }}>
                <label>Country</label>
                <select
                  className="input-field"
                  value={restFilters.country}
                  onChange={e => { setRestFilters({ ...restFilters, country: e.target.value }); setRestPage(1); }}
                >
                  <option value="">All Countries</option>
                  {countries.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>

            {restLoading ? <LoadingSpinner /> : restaurants.length === 0 ? (
              <EmptyState icon="🍽️" title="No restaurants found" message="Try adjusting your filters." />
            ) : (
              <div className="grid-2">
                {restaurants.map((r, i) => (
                  <div key={i} className="card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                      <h4 style={{ color: 'var(--wine)' }}>{r.name}</h4>
                      <span className="badge badge-gold">{r.award}</span>
                    </div>
                    <p style={{ fontSize: '0.88rem', color: 'var(--text-light)', marginBottom: 4 }}>{r.cuisine}</p>
                    <p style={{ fontSize: '0.88rem', color: 'var(--text-light)' }}>
                      {r.city_name}, {r.country_name}
                    </p>
                    {r.price && <span className="badge badge-wine" style={{ marginTop: 8 }}>{r.price}</span>}
                    {r.green_star && <span className="badge badge-green" style={{ marginTop: 8, marginLeft: 6 }}>Green Star</span>}
                  </div>
                ))}
              </div>
            )}
            <Pagination page={restPage} total={restTotal} limit={LIMIT} onPageChange={setRestPage} />
          </div>
        )}
      </div>
    </div>
  );
}
