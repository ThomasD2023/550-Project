import { useState, useEffect } from 'react';
import { getTopRegions, getDiningScores, getOutdoorRegions } from '../utils/api';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend } from 'recharts';
import { LoadingSpinner } from '../components/Loading';

const COLORS = ['#722F37', '#9B4D54', '#C9A84C', '#4A7C59', '#4A6FA5', '#B8972F', '#8B5E3C', '#6B4C7A', '#C0392B', '#2C8C99'];

export default function Insights() {
  const [activeTab, setActiveTab] = useState('ecosystem');
  const [topRegions, setTopRegions] = useState([]);
  const [diningScores, setDiningScores] = useState([]);
  const [outdoorRegions, setOutdoorRegions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      getTopRegions(12),
      getDiningScores(3),
      getOutdoorRegions(15),
    ]).then(([top, dining, outdoor]) => {
      setTopRegions(top.regions || []);
      setDiningScores(dining.regions || []);
      setOutdoorRegions(outdoor.regions || []);
      setLoading(false);
    }).catch(err => {
      console.error(err);
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="page-wrapper container" style={{ paddingTop: 40 }}><LoadingSpinner /></div>;

  return (
    <div className="page-wrapper">
      <div className="container" style={{ paddingTop: 32 }}>
        <div className="section-header">
          <h2>Regional Insights</h2>
          <p>Data-driven analytics on wine regions, dining, and outdoor activities</p>
        </div>

        <div className="tabs">
          <button className={`tab ${activeTab === 'ecosystem' ? 'active' : ''}`} onClick={() => setActiveTab('ecosystem')}>
            Ecosystem Rankings
          </button>
          <button className={`tab ${activeTab === 'dining' ? 'active' : ''}`} onClick={() => setActiveTab('dining')}>
            Dining Pairing Scores
          </button>
          <button className={`tab ${activeTab === 'outdoor' ? 'active' : ''}`} onClick={() => setActiveTab('outdoor')}>
            Outdoor Activities
          </button>
        </div>

        {/* Ecosystem Tab */}
        {activeTab === 'ecosystem' && (
          <div>
            <div className="card" style={{ padding: '24px 16px', marginBottom: 24 }}>
              <h3 style={{ marginBottom: 16, fontSize: '1.1rem' }}>Tourism Ecosystem Score by Country</h3>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={topRegions} margin={{ top: 10, right: 30, left: 0, bottom: 60 }}>
                  <XAxis dataKey="country_name" tick={{ fontSize: 11 }} angle={-35} textAnchor="end" height={80} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip
                    formatter={(v, name) => [Number(v).toFixed(1), name === 'ecosystem_score' ? 'Score' : name]}
                    contentStyle={{ borderRadius: 8, border: '1px solid #E8E0D6' }}
                  />
                  <Bar dataKey="ecosystem_score" radius={[6, 6, 0, 0]}>
                    {topRegions.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="grid-3">
              {topRegions.slice(0, 6).map((r, i) => (
                <div key={i} className="card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <h4 style={{ color: 'var(--wine)' }}>{r.country_name}</h4>
                    <span className="badge badge-gold">#{i + 1}</span>
                  </div>
                  <div style={{ marginTop: 12, fontSize: '0.88rem', color: 'var(--text-light)' }}>
                    <p>Vineyards: <strong>{Number(r.vineyard_cnt).toLocaleString()}</strong></p>
                    <p>Avg Hotel Rating: <strong>{r.avg_rating}</strong></p>
                    <p>Michelin Restaurants: <strong>{Number(r.michelin_cnt).toLocaleString()}</strong></p>
                    <p>Attractions: <strong>{Number(r.poi_cnt).toLocaleString()}</strong></p>
                  </div>
                  <div style={{ marginTop: 12, fontWeight: 700, color: 'var(--wine)', fontSize: '1.1rem' }}>
                    Score: {Number(r.ecosystem_score).toFixed(1)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Dining Tab */}
        {activeTab === 'dining' && (
          <div>
            <div className="card" style={{ padding: '24px 16px', marginBottom: 24 }}>
              <h3 style={{ marginBottom: 16, fontSize: '1.1rem' }}>Vineyard-Dining Pairing Score by Region</h3>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={diningScores.slice(0, 15)} margin={{ top: 10, right: 30, left: 0, bottom: 80 }}>
                  <XAxis
                    dataKey="state_name"
                    tick={{ fontSize: 10 }}
                    angle={-45}
                    textAnchor="end"
                    height={100}
                  />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip
                    formatter={(v) => [Number(v).toFixed(1), 'Dining Score']}
                    labelFormatter={(label) => {
                      const item = diningScores.find(d => d.state_name === label);
                      return `${label}, ${item?.country_name || ''}`;
                    }}
                    contentStyle={{ borderRadius: 8, border: '1px solid #E8E0D6' }}
                  />
                  <Bar dataKey="dining_score" fill="#C9A84C" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', background: 'var(--white)', borderRadius: 10, overflow: 'hidden' }}>
                <thead>
                  <tr style={{ background: 'var(--cream-dark)' }}>
                    <th style={thStyle}>Rank</th>
                    <th style={thStyle}>Region</th>
                    <th style={thStyle}>Country</th>
                    <th style={thStyle}>Vineyards</th>
                    <th style={thStyle}>Restaurants</th>
                    <th style={thStyle}>Dining Score</th>
                  </tr>
                </thead>
                <tbody>
                  {diningScores.map((r, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={tdStyle}>{i + 1}</td>
                      <td style={tdStyle}><strong>{r.state_name}</strong></td>
                      <td style={tdStyle}>{r.country_name}</td>
                      <td style={tdStyle}>{r.vineyard_count}</td>
                      <td style={tdStyle}>{r.restaurant_count}</td>
                      <td style={{ ...tdStyle, color: 'var(--wine)', fontWeight: 700 }}>{Number(r.dining_score).toFixed(1)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Outdoor Tab */}
        {activeTab === 'outdoor' && (
          <div>
            <div className="card" style={{ padding: '24px 16px', marginBottom: 24 }}>
              <h3 style={{ marginBottom: 16, fontSize: '1.1rem' }}>Top Regions for Outdoor Activities</h3>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={outdoorRegions.slice(0, 12)} margin={{ top: 10, right: 30, left: 0, bottom: 80 }}>
                  <XAxis
                    dataKey="state_name"
                    tick={{ fontSize: 10 }}
                    angle={-45}
                    textAnchor="end"
                    height={100}
                  />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip
                    formatter={(v) => [v, 'Outdoor POIs']}
                    labelFormatter={(label) => {
                      const item = outdoorRegions.find(d => d.state_name === label);
                      return `${label}, ${item?.country_name || ''}`;
                    }}
                    contentStyle={{ borderRadius: 8, border: '1px solid #E8E0D6' }}
                  />
                  <Bar dataKey="outdoor_poi_count" fill="#4A7C59" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="grid-3">
              {outdoorRegions.slice(0, 9).map((r, i) => (
                <div key={i} className="card">
                  <h4 style={{ color: 'var(--green)' }}>{r.state_name}</h4>
                  <p style={{ color: 'var(--text-light)', fontSize: '0.88rem' }}>{r.country_name}</p>
                  <div style={{ marginTop: 12, fontSize: '1.3rem', fontWeight: 700, color: 'var(--green)' }}>
                    {Number(r.outdoor_poi_count).toLocaleString()} <span style={{ fontSize: '0.85rem', fontWeight: 400 }}>outdoor POIs</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const thStyle = { textAlign: 'left', padding: '12px 16px', fontSize: '0.82rem', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-light)', fontWeight: 600 };
const tdStyle = { padding: '12px 16px', fontSize: '0.9rem' };
