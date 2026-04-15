import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { searchVineyards, getCountries, getStates, getCities } from '../utils/api';
import Pagination from '../components/Pagination';
import MapView from '../components/MapView';
import { LoadingSpinner, EmptyState } from '../components/Loading';

const LIMIT = 20;

export default function VineyardExplorer() {
  const [vineyards, setVineyards] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState('list');

  // Filters
  const [countries, setCountries] = useState([]);
  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);
  const [filters, setFilters] = useState({ country: '', state: '', city: '', name: '' });

  useEffect(() => {
    getCountries().then(d => setCountries(d.countries || [])).catch(console.error);
  }, []);

  useEffect(() => {
    if (filters.country) {
      getStates(filters.country).then(d => setStates(d.states || [])).catch(console.error);
    } else {
      setStates([]);
    }
    setFilters(f => ({ ...f, state: '', city: '' }));
    setCities([]);
  }, [filters.country]);

  useEffect(() => {
    if (filters.state) {
      getCities(filters.state).then(d => setCities(d.cities || [])).catch(console.error);
    } else {
      setCities([]);
    }
    setFilters(f => ({ ...f, city: '' }));
  }, [filters.state]);

  useEffect(() => {
    fetchData();
  }, [page]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await searchVineyards({
        ...filters,
        country: filters.country || undefined,
        state: filters.state || undefined,
        city: filters.city || undefined,
        name: filters.name || undefined,
        limit: LIMIT,
        offset: (page - 1) * LIMIT,
      });
      setVineyards(data.vineyards || []);
      setTotal(data.total || 0);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchData();
  };

  const markers = vineyards
    .filter(v => v.latitude && v.longitude)
    .map(v => ({
      lat: v.latitude,
      lng: v.longitude,
      color: 'wine',
      popup: (
        <div>
          <strong>{v.name}</strong><br />
          {v.city_name}, {v.country_name}
        </div>
      ),
    }));

  return (
    <div className="page-wrapper">
      <div className="container" style={{ paddingTop: 32 }}>
        <div className="section-header">
          <h2>Vineyard Explorer</h2>
          <p>Search and discover vineyards across the globe</p>
        </div>

        {/* Filters */}
        <form onSubmit={handleSearch} className="filters-bar">
          <div className="input-group" style={{ flex: 1, minWidth: 150 }}>
            <label>Country</label>
            <select
              className="input-field"
              value={filters.country}
              onChange={e => setFilters({ ...filters, country: e.target.value })}
            >
              <option value="">All Countries</option>
              {countries.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div className="input-group" style={{ flex: 1, minWidth: 150 }}>
            <label>State / Region</label>
            <select
              className="input-field"
              value={filters.state}
              onChange={e => setFilters({ ...filters, state: e.target.value })}
              disabled={!filters.country}
            >
              <option value="">All States</option>
              {states.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          <div className="input-group" style={{ flex: 1, minWidth: 150 }}>
            <label>City</label>
            <select
              className="input-field"
              value={filters.city}
              onChange={e => setFilters({ ...filters, city: e.target.value })}
              disabled={!filters.state}
            >
              <option value="">All Cities</option>
              {cities.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div className="input-group" style={{ flex: 1, minWidth: 180 }}>
            <label>Search by Name</label>
            <input
              className="input-field"
              type="text"
              placeholder="e.g. Chateau..."
              value={filters.name}
              onChange={e => setFilters({ ...filters, name: e.target.value })}
            />
          </div>

          <button type="submit" className="btn btn-primary" style={{ alignSelf: 'flex-end' }}>
            Search
          </button>
        </form>

        {/* View Toggle */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <span style={{ color: 'var(--text-light)', fontSize: '0.9rem' }}>
            {total.toLocaleString()} vineyards found
          </span>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              className={`chip ${viewMode === 'list' ? 'active' : ''}`}
              onClick={() => setViewMode('list')}
            >List</button>
            <button
              className={`chip ${viewMode === 'map' ? 'active' : ''}`}
              onClick={() => setViewMode('map')}
            >Map</button>
          </div>
        </div>

        {error && <div className="error-alert">{error}</div>}

        {loading ? (
          <LoadingSpinner />
        ) : vineyards.length === 0 ? (
          <EmptyState icon="&#127815;" title="No vineyards found" message="Try adjusting your filters or search term." />
        ) : viewMode === 'map' ? (
          <MapView
            center={markers[0] ? [markers[0].lat, markers[0].lng] : [45, 2]}
            zoom={5}
            markers={markers}
            height="500px"
          />
        ) : (
          <div className="grid-2">
            {vineyards.map(v => (
              <Link to={`/vineyards/${v.vineyard_id}`} key={v.vineyard_id} className="card" style={{ textDecoration: 'none' }}>
                <h4 style={{ marginBottom: 6, color: 'var(--wine)' }}>{v.name}</h4>
                <p style={{ color: 'var(--text-light)', fontSize: '0.9rem', marginBottom: 8 }}>
                  {v.city_name}, {v.state_name}, {v.country_name}
                </p>
                {v.website && (
                  <span className="badge badge-wine">Visit Website</span>
                )}
              </Link>
            ))}
          </div>
        )}

        <Pagination page={page} total={total} limit={LIMIT} onPageChange={setPage} />
      </div>
    </div>
  );
}
