import { useState, useEffect } from 'react';
import { browsePois, getCategoryStats, getCountries } from '../utils/api';
import Pagination from '../components/Pagination';
import { LoadingSpinner, EmptyState } from '../components/Loading';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const LIMIT = 20;
const COLORS = ['#722F37', '#C9A84C', '#4A7C59', '#4A6FA5', '#B8972F', '#8B5E3C', '#6B4C7A', '#C0392B', '#2C8C99', '#9B4D54',
  '#D4A76A', '#5B8C5A', '#7B68AE', '#E07B39', '#3D9970', '#B5651D', '#6C5B7B', '#C06C84', '#355C7D', '#F67280'];

export default function Attractions() {
  const [pois, setPois] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([]);
  const [countries, setCountries] = useState([]);
  // selectedCategory is exact category name from tag click
  const [selectedCategory, setSelectedCategory] = useState('');
  const [searchText, setSearchText] = useState('');
  const [country, setCountry] = useState('');

  useEffect(() => {
    getCategoryStats(20).then(d => setCategories(d.categories || [])).catch(console.error);
    getCountries().then(d => setCountries(d.countries || [])).catch(console.error);
  }, []);

  useEffect(() => {
    fetchPois();
  }, [page, selectedCategory, searchText, country]);

  const fetchPois = async () => {
    setLoading(true);
    try {
      const data = await browsePois({
        category: selectedCategory || undefined,
        country: country || undefined,
        search: searchText || undefined,
        limit: LIMIT,
        offset: (page - 1) * LIMIT,
      });
      setPois(data.pois || []);
      setTotal(data.total || 0);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryClick = (catName) => {
    if (selectedCategory === catName) {
      setSelectedCategory('');
    } else {
      setSelectedCategory(catName);
    }
    setSearchText('');
    setPage(1);
  };

  const handleSearchChange = (e) => {
    setSearchText(e.target.value);
    setSelectedCategory('');
    setPage(1);
  };

  const handleCountryChange = (e) => {
    setCountry(e.target.value);
    setPage(1);
  };

  const chartData = categories.slice(0, 12).map(c => ({
    name: c.category_name,
    value: parseInt(c.count, 10),
  }));

  return (
    <div className="page-wrapper">
      <div className="container" style={{ paddingTop: 32 }}>
        <div className="section-header">
          <h2>Attractions Explorer</h2>
          <p>Discover museums, parks, historical sites, and more across the globe</p>
        </div>

        {/* Category Distribution Chart */}
        {chartData.length > 0 && (
          <div className="card" style={{ padding: '24px', marginBottom: 24 }}>
            <h3 style={{ marginBottom: 16, fontSize: '1.1rem' }}>Category Distribution</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  dataKey="value"
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  labelLine={true}
                >
                  {chartData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => [v.toLocaleString(), 'POIs']} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Filters */}
        <div className="filters-bar">
          <div className="input-group" style={{ flex: 1, minWidth: 200 }}>
            <label>SEARCH</label>
            <input
              className="input-field"
              type="text"
              placeholder="Search attractions by name..."
              value={searchText}
              onChange={handleSearchChange}
            />
          </div>
          <div className="input-group" style={{ minWidth: 200 }}>
            <label>COUNTRY</label>
            <select
              className="input-field"
              value={country}
              onChange={handleCountryChange}
            >
              <option value="">All Countries</option>
              {countries.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>

        {/* Category Chips */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
          {categories.slice(0, 12).map(c => (
            <button
              key={c.category_name}
              className={`chip ${selectedCategory === c.category_name ? 'active' : ''}`}
              onClick={() => handleCategoryClick(c.category_name)}
            >
              {c.category_name} ({Number(c.count).toLocaleString()})
            </button>
          ))}
        </div>

        {/* Results */}
        <div style={{ marginBottom: 8, color: 'var(--text-light)', fontSize: '0.9rem' }}>
          {total.toLocaleString()} attractions found
        </div>

        {loading ? <LoadingSpinner /> : pois.length === 0 ? (
          <EmptyState icon="📍" title="No attractions found" message="Try adjusting your filters." />
        ) : (
          <div className="grid-3">
            {pois.map((p, i) => (
              <div key={i} className="card">
                <h4 style={{ color: 'var(--wine)', marginBottom: 6, fontSize: '0.95rem' }}>{p.name}</h4>
                <span className="badge badge-green" style={{ marginBottom: 8 }}>{p.category_name}</span>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-light)', marginTop: 6 }}>
                  {p.city_name}, {p.country_name}
                </p>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: 4 }}>
                  Popularity: {Number(p.num_links).toLocaleString()} links
                </p>
              </div>
            ))}
          </div>
        )}

        <Pagination page={page} total={total} limit={LIMIT} onPageChange={setPage} />
      </div>
    </div>
  );
}
