import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import ErrorBoundary from './components/ErrorBoundary';
import Home from './pages/Home';
import VineyardExplorer from './pages/VineyardExplorer';
import VineyardDetail from './pages/VineyardDetail';
import Insights from './pages/Insights';
import TripPlanner from './pages/TripPlanner';
import HotelsDining from './pages/HotelsDining';
import Attractions from './pages/Attractions';
import './styles/global.css';

export default function App() {
  return (
    <Router>
      <Navbar />
      <ErrorBoundary>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/vineyards" element={<VineyardExplorer />} />
          <Route path="/vineyards/:vineyard_id" element={<VineyardDetail />} />
          <Route path="/insights" element={<Insights />} />
          <Route path="/planner" element={<TripPlanner />} />
          <Route path="/hotels-dining" element={<HotelsDining />} />
          <Route path="/attractions" element={<Attractions />} />
        </Routes>
      </ErrorBoundary>
    </Router>
  );
}
