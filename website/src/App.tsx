import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import { supabase } from './supabaseClient';
import Explore from './pages/Explore';
import ItemDetail from './pages/ItemDetail';
import Publish from './pages/Publish';
import Bookings from './pages/Bookings';
import AIChat from './pages/AIChat';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Register from './pages/Register';

function Navigation() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user || null);
      if (data.session?.user) {
        fetchProfile(data.session.user.id);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (uid: string) => {
    const { data } = await supabase.from('profiles').select('*').eq('id', uid).single();
    setProfile(data);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  return (
    <header className="app-header">
      <Link to="/" className="logo">
        <span className="logo-icon">🤖</span>
        <span className="logo-text">Rent<span className="logo-tag">Ease</span></span>
      </Link>
      
      <nav className="nav-links">
        <Link to="/" className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}>Explore</Link>
        {user && (
          <>
            <Link to="/publish" className={`nav-link ${location.pathname === '/publish' ? 'active' : ''}`}>List Item</Link>
            <Link to="/bookings" className={`nav-link ${location.pathname === '/bookings' ? 'active' : ''}`}>Bookings</Link>
            <Link to="/chat" className={`nav-link ${location.pathname === '/chat' ? 'active' : ''}`}>AI Assistant</Link>
            <Link to="/dashboard" className={`nav-link ${location.pathname === '/dashboard' ? 'active' : ''}`}>Dashboard</Link>
          </>
        )}
      </nav>

      <div className="user-panel">
        {user ? (
          <>
            <span className="user-name">👋 {profile?.full_name || user.email?.split('@')[0]}</span>
            <button onClick={handleLogout} className="logout-btn">Log Out</button>
          </>
        ) : (
          <>
            <Link to="/login" className="nav-link" style={{ fontSize: '13.5px' }}>Log In</Link>
            <Link to="/register" className="nav-btn" style={{ textDecoration: 'none', padding: '8px 18px' }}>Sign Up</Link>
          </>
        )}
      </div>
    </header>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <div className="background-glows">
        <div className="glow-spot spot-1"></div>
        <div className="glow-spot spot-2"></div>
      </div>
      <Navigation />
      <Routes>
        <Route path="/" element={<Explore />} />
        <Route path="/item/:id" element={<ItemDetail />} />
        <Route path="/publish" element={<Publish />} />
        <Route path="/bookings" element={<Bookings />} />
        <Route path="/chat" element={<AIChat />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Routes>
    </BrowserRouter>
  );
}
