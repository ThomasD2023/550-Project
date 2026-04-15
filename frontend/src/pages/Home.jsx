import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getGlobalStats, getTopRegions } from '../utils/api';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import './Home.css';

const COLORS = ['#722F37', '#9B4D54', '#C9A84C', '#4A7C59', '#4A6FA5', '#B8972F', '#8B5E3C', '#6B4C7A', '#C0392B', '#2C8C99'];

export default function Home() {
  const [stats, setStats] = useState(null);
  const [regions, setRegions] = useState([]);

  useEffect(() => {
    getGlobalStats().then(setStats).catch(console.error);
    getTopRegions(8).then(d => setRegions(d.regions || [])).catch(console.error);
  }, []);

  return (
    <div className="home-page">
      {/* Hero Section */}
      <section className="hero">
        <div className="hero-overlay" />
        <div className="hero-content">
          <h1 className="hero-title">Discover the World's Finest Wine Regions</h1>
          <p className="hero-subtitle">
            Explore vineyards, Michelin restaurants, luxury hotels, and hidden attractions
            across {stats?.country_count || '80+'} countries
          </p>
          <div className="hero-actions">
            <Link to="/vineyards" className="btn btn-gold">Explore Vineyards</Link>
            <Link to="/planner" className="btn hero-btn-outline">Plan a Trip</Link>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="stats-bar">
        <div className="container">
          <div className="stats-grid">
            <div className="stat-item">
              <span className="stat-number">{stats ? Number(stats.vineyard_count).toLocaleString() : '...'}</span>
              <span className="stat-label">Vineyards</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">{stats ? Number(stats.hotel_count).toLocaleString() : '...'}</span>
              <span className="stat-label">Hotels</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">{stats ? Number(stats.restaurant_count).toLocaleString() : '...'}</span>
              <span className="stat-label">Michelin Restaurants</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">{stats ? Number(stats.poi_count).toLocaleString() : '...'}</span>
              <span className="stat-label">Attractions</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">{stats?.country_count || '...'}</span>
              <span className="stat-label">Countries</span>
            </div>
          </div>
        </div>
      </section>

      {/* Top Regions Chart */}
      <section className="container" style={{ marginTop: 48, marginBottom: 48 }}>
        <div className="section-header">
          <h2>Top Wine Regions by Ecosystem Score</h2>
          <p>Composite ranking based on vineyard density, hotel quality, Michelin dining, and attractions</p>
        </div>
        {regions.length > 0 && (
          <div className="card" style={{ padding: '24px 16px' }}>
            <ResponsiveContainer width="100%" height={360}>
              <BarChart data={regions} margin={{ top: 10, right: 30, left: 0, bottom: 20 }}>
                <XAxis dataKey="country_name" tick={{ fontSize: 12 }} angle={-25} textAnchor="end" height={60} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip
                  formatter={(v) => [Number(v).toFixed(1), 'Score']}
                  contentStyle={{ borderRadius: 8, border: '1px solid #E8E0D6' }}
                />
                <Bar dataKey="ecosystem_score" radius={[6, 6, 0, 0]}>
                  {regions.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </section>

      {/* Quick Links */}
      <section className="container" style={{ marginBottom: 60 }}>
        <div className="grid-3">
          <Link to="/vineyards" className="quick-card">
            <div className="quick-icon">&#127815;</div>
            <h3>Vineyard Explorer</h3>
            <p>Search and filter vineyards across the globe with detailed profiles</p>
          </Link>
          <Link to="/planner" className="quick-card">
            <div className="quick-icon">&#128506;</div>
            <h3>Trip Planner</h3>
            <p>Build curated itineraries combining vineyards, hotels, dining, and attractions</p>
          </Link>
          <Link to="/insights" className="quick-card">
            <div className="quick-icon">&#128200;</div>
            <h3>Regional Insights</h3>
            <p>Discover dining scores, outdoor activities, and tourism analytics</p>
          </Link>
        </div>
      </section>
    </div>
  );
}
