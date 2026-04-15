import { useState, useEffect, useRef } from 'react';
import { searchCities, getCityBundle } from '../utils/api';
import { LoadingSpinner, EmptyState } from '../components/Loading';

const typeConfig = {
  vineyard: { icon: '🍇', color: '#722F37', label: 'Vineyards' },
  hotel: { icon: '🏨', color: '#4A6FA5', label: 'Hotels' },
  restaurant: { icon: '🍽️', color: '#C9A84C', label: 'Restaurants' },
  attraction: { icon: '📍', color: '#4A7C59', label: 'Attractions' },
};

export default function TripPlanner() {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [selectedCity, setSelectedCity] = useState(null);
  const [bundle, setBundle] = useState(null);
  const [loading, setLoading] = useState(false);
  const [minRating, setMinRating] = useState(3);
  const debounceRef = useRef(null);

  // Debounced city search
  useEffect(() => {
    if (query.length < 2) {
      setSuggestions([]);
      return;
    }
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      searchCities(query).then(d => setSuggestions(d.cities || [])).catch(console.error);
    }, 300);
    return () => clearTimeout(debounceRef.current);
  }, [query]);

  const selectCity = (city) => {
    setSelectedCity(city);
    setQuery(`${city.city_name}, ${city.state_name}, ${city.country_name}`);
    setSuggestions([]);
    fetchBundle(city.city_id, minRating);
  };

  const fetchBundle = async (cityId, rating) => {
    setLoading(true);
    try {
      const data = await getCityBundle(cityId, rating);
      setBundle(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRatingChange = (val) => {
    setMinRating(val);
    if (selectedCity) {
      fetchBundle(selectedCity.city_id, val);
    }
  };

  const grouped = {};
  if (bundle?.bundle) {
    bundle.bundle.forEach(item => {
      if (!grouped[item.type]) grouped[item.type] = [];
      grouped[item.type].push(item);
    });
  }

  return (
    <div className="page-wrapper">
      <div className="container" style={{ paddingTop: 32 }}>
        <div className="section-header">
          <h2>Trip Planner</h2>
          <p>Select a city to build a curated itinerary with vineyards, hotels, dining, and attractions</p>
        </div>

        {/* City Search */}
        <div className="card" style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <div className="input-group" style={{ flex: 2, minWidth: 250, position: 'relative' }}>
              <label>Search City</label>
              <input
                className="input-field"
                type="text"
                placeholder="Type a city name (e.g., Paris, Napa, Florence...)"
                value={query}
                onChange={e => { setQuery(e.target.value); setSelectedCity(null); }}
              />
              {suggestions.length > 0 && (
                <div style={{
                  position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 100,
                  background: 'white', border: '1px solid var(--border)', borderRadius: 8,
                  maxHeight: 240, overflowY: 'auto', boxShadow: 'var(--shadow-md)',
                }}>
                  {suggestions.map(c => (
                    <div
                      key={c.city_id}
                      style={{ padding: '10px 14px', cursor: 'pointer', fontSize: '0.9rem', borderBottom: '1px solid var(--cream-dark)' }}
                      onMouseDown={() => selectCity(c)}
                    >
                      <strong>{c.city_name}</strong>, {c.state_name}, {c.country_name}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="input-group" style={{ minWidth: 200 }}>
              <label>Min Hotel Rating: {minRating}★</label>
              <input
                type="range"
                min={1}
                max={5}
                step={1}
                value={minRating}
                onChange={e => handleRatingChange(Number(e.target.value))}
              />
            </div>
          </div>
        </div>

        {/* Results */}
        {loading ? (
          <LoadingSpinner />
        ) : !bundle ? (
          <EmptyState icon="🗺️" title="Select a city to start planning" message="Search for a city above to see curated recommendations." />
        ) : (
          <div>
            <h3 style={{ marginBottom: 20, fontSize: '1.3rem' }}>
              Trip Plan for <span style={{ color: 'var(--wine)' }}>{bundle.city_name}</span>
              {bundle.state_name && <span style={{ color: 'var(--text-light)', fontWeight: 400 }}>, {bundle.state_name}, {bundle.country_name}</span>}
            </h3>

            {Object.keys(grouped).length === 0 ? (
              <EmptyState icon="📭" title="No results for this city" message="This city may not have enough data in our database." />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                {Object.entries(typeConfig).map(([type, config]) => {
                  const items = grouped[type] || [];
                  if (items.length === 0) return null;
                  return (
                    <div key={type} className="card">
                      <h4 style={{ color: config.color, marginBottom: 16, fontSize: '1.1rem' }}>
                        {config.icon} {config.label}
                      </h4>
                      <div style={{ display: 'grid', gap: 12 }}>
                        {items.map((item, i) => (
                          <div key={i} style={{
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                            padding: '12px 16px', background: 'var(--cream)', borderRadius: 8,
                          }}>
                            <div>
                              <strong style={{ fontSize: '0.95rem' }}>{item.name}</strong>
                              <span className="badge badge-wine" style={{ marginLeft: 8 }}>#{item.rank}</span>
                            </div>
                            {item.website && (
                              <a href={item.website} target="_blank" rel="noopener noreferrer"
                                style={{ fontSize: '0.85rem', color: 'var(--wine)' }}>
                                Visit &#8599;
                              </a>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
