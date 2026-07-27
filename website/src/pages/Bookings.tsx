import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';

interface Booking {
  id: string;
  start_date: string;
  end_date: string;
  total_price: number;
  status: string;
  renter_id: string;
  fraud_score: number;
  items: {
    title: string;
    category_id: number;
    owner_id: string;
  };
}

export default function Bookings() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [activeTab, setActiveTab] = useState<'rentals' | 'incoming'>('rentals');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchSessionAndBookings();
  }, [activeTab]);

  const fetchSessionAndBookings = async () => {
    setLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate('/login');
      return;
    }

    let query = supabase.from('bookings').select(`
      id,
      start_date,
      end_date,
      total_price,
      status,
      renter_id,
      fraud_score,
      items!inner (
        title,
        category_id,
        owner_id
      )
    `);

    if (activeTab === 'rentals') {
      // Bookings made by me
      query = query.eq('renter_id', session.user.id);
    } else {
      // Bookings of my listed items
      query = query.eq('items.owner_id', session.user.id);
    }

    const { data, error } = await query;
    if (error) {
      console.error("Error fetching bookings:", error);
    } else {
      setBookings((data as any) || []);
    }
    setLoading(false);
  };

  const handleUpdateStatus = async (bookingId: string, newStatus: string) => {
    const { error } = await supabase
      .from('bookings')
      .update({ status: newStatus })
      .eq('id', bookingId);

    if (error) {
      alert("Failed to update status: " + error.message);
    } else {
      alert(`Booking ${newStatus} successfully!`);
      fetchSessionAndBookings();
    }
  };

  return (
    <div className="container">
      <h1 className="page-title">Manage Rentals</h1>
      <p className="page-desc">Review your pending agreements, active borrow transactions, and incoming earnings requests.</p>

      <div className="booking-tabs">
        <button 
          className={`booking-tab ${activeTab === 'rentals' ? 'active' : ''}`}
          onClick={() => setActiveTab('rentals')}
        >
          My Borrowed Items
        </button>
        <button 
          className={`booking-tab ${activeTab === 'incoming' ? 'active' : ''}`}
          onClick={() => setActiveTab('incoming')}
        >
          Incoming Renter Requests
        </button>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', margin: '60px 0' }}>
          <div className="spinner"></div>
        </div>
      ) : bookings.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
          No bookings found in this category.
        </div>
      ) : (
        <div>
          {bookings.map(booking => (
            <div key={booking.id} className="booking-row-card">
              <div>
                <h3 style={{ color: 'var(--text-primary)', fontSize: '18px', fontWeight: '700' }}>
                  {booking.items?.title}
                </h3>
                <p style={{ fontSize: '13px', marginTop: '4px' }}>
                  📅 {new Date(booking.start_date).toLocaleDateString()} to {new Date(booking.end_date).toLocaleDateString()}
                </p>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                  AI Verification Score: <span style={{ color: booking.fraud_score > 90 ? 'var(--accent)' : 'var(--error)', fontWeight: '700' }}>{booking.fraud_score}%</span>
                </p>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '18px', fontWeight: '800', color: 'var(--text-primary)' }}>
                    ₹{booking.total_price}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Total Amount</div>
                </div>

                <span className={`status-badge status-${booking.status}`}>
                  {booking.status}
                </span>

                {activeTab === 'incoming' && booking.status === 'pending' && (
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button 
                      onClick={() => handleUpdateStatus(booking.id, 'confirmed')}
                      style={{
                        background: 'var(--accent)',
                        color: '#FFF',
                        border: 'none',
                        padding: '6px 12px',
                        borderRadius: 'var(--radius-sm)',
                        cursor: 'pointer',
                        fontSize: '12px',
                        fontWeight: '700'
                      }}
                    >
                      Accept
                    </button>
                    <button 
                      onClick={() => handleUpdateStatus(booking.id, 'cancelled')}
                      style={{
                        background: 'var(--error)',
                        color: '#FFF',
                        border: 'none',
                        padding: '6px 12px',
                        borderRadius: 'var(--radius-sm)',
                        cursor: 'pointer',
                        fontSize: '12px',
                        fontWeight: '700'
                      }}
                    >
                      Reject
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
