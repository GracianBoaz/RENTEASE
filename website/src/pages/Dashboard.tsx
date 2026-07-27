import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { Trash2 } from 'lucide-react';

interface Listing {
  id: string;
  title: string;
  price_per_day: number;
  location_city: string;
  is_available: boolean;
}

export default function Dashboard() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [earnings, setEarnings] = useState(0);
  const [activeBookingsCount, setActiveBookingsCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchSessionAndStats();
  }, []);

  const fetchSessionAndStats = async () => {
    setLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate('/login');
      return;
    }

    // Fetch listings
    const { data: listData } = await supabase
      .from('items')
      .select('*')
      .eq('owner_id', session.user.id);
    
    setListings(listData || []);

    // Fetch incoming bookings for earnings calculation
    const { data: bookData } = await supabase
      .from('bookings')
      .select(`
        total_price,
        status,
        items!inner (
          owner_id
        )
      `)
      .eq('items.owner_id', session.user.id);

    if (bookData) {
      const activeOrConfirmed = bookData.filter((b: any) => ['confirmed', 'completed'].includes(b.status));
      const totalEarned = activeOrConfirmed.reduce((sum: number, b: any) => sum + (b.total_price || 0), 0);
      setEarnings(totalEarned);

      const pending = bookData.filter((b: any) => b.status === 'pending');
      setActiveBookingsCount(pending.length);
    }

    setLoading(false);
  };

  const handleDeleteListing = async (itemId: string) => {
    const confirm = window.confirm("Are you sure you want to delete this listing?");
    if (!confirm) return;

    // Check for active bookings
    const { data: bookings } = await supabase
      .from('bookings')
      .select('id')
      .eq('item_id', itemId)
      .in('status', ['pending', 'confirmed']);

    if (bookings && bookings.length > 0) {
      alert("❌ Cannot delete item. There are active bookings for this listing.");
      return;
    }

    const { error } = await supabase.from('items').delete().eq('id', itemId);
    if (error) {
      alert("Delete failed: " + error.message);
    } else {
      alert("Listing deleted successfully!");
      fetchSessionAndStats();
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', margin: '120px 0' }}>
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="container">
      <h1 className="page-title">Owner Dashboard</h1>
      <p className="page-desc">Track performance, manage listings, and audit earnings generated on RentEase.</p>

      <div className="stats-grid">
        <div className="stat-card">
          <div style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: '700' }}>TOTAL REVENUE</div>
          <div className="stat-value">₹{earnings}</div>
        </div>
        <div className="stat-card">
          <div style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: '700' }}>ACTIVE LISTINGS</div>
          <div className="stat-value">{listings.length}</div>
        </div>
        <div className="stat-card">
          <div style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: '700' }}>PENDING REQUESTS</div>
          <div className="stat-value">{activeBookingsCount}</div>
        </div>
      </div>

      <h2 style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)', marginBottom: '20px' }}>
        Your Gear Listings
      </h2>

      {listings.length === 0 ? (
        <div style={{ background: 'var(--bg-card)', padding: '40px', borderRadius: 'var(--radius-md)', textAlign: 'center', color: 'var(--text-muted)' }}>
          You haven't listed any gear items yet. Click "List Item" in the navigation bar to start!
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {listings.map(item => (
            <div key={item.id} className="booking-row-card">
              <div>
                <h3 style={{ color: 'var(--text-primary)', fontSize: '16px', fontWeight: '700' }}>
                  {item.title}
                </h3>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                  {item.location_city || 'India'} • Rate: ₹{item.price_per_day}/day
                </p>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                <span className={`status-badge ${item.is_available ? 'status-confirmed' : 'status-cancelled'}`}>
                  {item.is_available ? 'Active' : 'Unavailable'}
                </span>
                
                <button 
                  onClick={() => handleDeleteListing(item.id)}
                  style={{
                    background: 'transparent',
                    border: '1px solid var(--error)',
                    color: 'var(--error)',
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-sm)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '12px',
                    fontWeight: '700'
                  }}
                >
                  <Trash2 size={14} /> Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
