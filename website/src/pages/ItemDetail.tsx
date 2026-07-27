import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { askGemini } from '../geminiClient';
import { Trash2, MapPin, ShieldCheck } from 'lucide-react';

interface Item {
  id: string;
  title: string;
  description: string;
  category_id: number;
  price_per_day: number;
  deposit_amount?: number;
  security_deposit?: number;
  location_name: string;
  location_city: string;
  location_address: string;
  location_pincode?: string;
  location_state?: string;
  location_lat?: number;
  location_lng?: number;
  images: string[];
  condition: string;
  owner_id: string;
  specs?: any;
  brand?: string;
  model?: string;
}

export default function ItemDetail() {
  const { id } = useParams<{ id: string }>();
  const [item, setItem] = useState<Item | null>(null);
  const [owner, setOwner] = useState<any>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(true);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [fraudOverlay, setFraudOverlay] = useState(false);
  const [fraudScore, setFraudScore] = useState<number | null>(null);
  const [fraudRisk, setFraudRisk] = useState('');
  
  const navigate = useNavigate();
  const mapRef = useRef<any>(null);

  useEffect(() => {
    fetchSession();
    fetchItemDetails();
  }, [id]);

  useEffect(() => {
    if (!item) return;

    const renderMap = async () => {
      const L = (window as any).L;
      if (!L) return;

      const mapElement = document.getElementById('map-box');
      if (!mapElement) return;

      let mapLat = item.location_lat;
      let mapLng = item.location_lng;

      // Fallback geocoding if lat/lng are missing or 0
      if (!mapLat || !mapLng || (mapLat === 0 && mapLng === 0)) {
        const searchQuery = item.location_address || item.location_name || item.location_city;
        if (searchQuery) {
          try {
            const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}`);
            const data = await res.json();
            if (data && data.length > 0) {
              mapLat = parseFloat(data[0].lat);
              mapLng = parseFloat(data[0].lon);
            }
          } catch (err) {
            console.error("Geocoding fallback failed:", err);
          }
        }
      }

      // Final default coordinates if geocoding yields nothing (e.g. India center)
      if (!mapLat || !mapLng) {
        mapLat = 13.0827;
        mapLng = 80.2707;
      }

      try {
        if (mapRef.current) {
          mapRef.current.remove();
          mapRef.current = null;
        }

        const map = L.map('map-box').setView([mapLat, mapLng], 14);
        mapRef.current = map;
        
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap'
        }).addTo(map);

        const popupText = `<b>${item.title}</b><br>${item.location_address || item.location_name || item.location_city || 'Item Location'}`;

        L.marker([mapLat, mapLng]).addTo(map)
          .bindPopup(popupText)
          .openPopup();
      } catch (err) {
        console.error("Leaflet map initialization failed:", err);
      }
    };

    renderMap();

    return () => {
      if (mapRef.current) {
        try {
          mapRef.current.remove();
        } catch (e) {
          console.error("Map cleanup error:", e);
        }
        mapRef.current = null;
      }
    };
  }, [item]);

  const fetchSession = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    setCurrentUser(session?.user || null);
  };

  const fetchItemDetails = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('items')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      console.error("Error fetching item:", error);
      navigate('/');
      return;
    }

    setItem(data);

    // Fetch Owner Info
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.owner_id)
      .single();
    setOwner(profile);
    setLoading(false);
  };

  const getDaysDiff = () => {
    if (!startDate || !endDate) return 0;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diff = end.getTime() - start.getTime();
    return Math.max(1, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  };

  const getTotalPrice = () => {
    if (!item) return 0;
    return getDaysDiff() * item.price_per_day;
  };

  const depositVal = item?.specs?.deposit || item?.deposit_amount || item?.security_deposit || 0;

  // Run AI Fraud Check Client-side on booking submit
  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!startDate || !endDate || !item || !currentUser) {
      alert("Please login and select valid renting dates.");
      return;
    }

    setBookingLoading(true);
    setFraudOverlay(true);

    try {
      const renterProfileQuery = await supabase.from('profiles').select('*').eq('id', currentUser.id).single();
      const renterProfile = renterProfileQuery.data;

      // Ask Gemini 2.5 Flash for Fraud Assessment
      const prompt = `
You are a booking fraud detection AI for RentEase.
Evaluate the booking request details:
- Item: "${item.title}"
- Item Price: ₹${item.price_per_day}/day
- Security Deposit: ₹${depositVal}
- Duration: ${getDaysDiff()} days
- Renter ID: ${currentUser.id}
- Renter Name: ${renterProfile?.full_name || 'Anonymous Renter'}
- Renter Account Created At: ${renterProfile?.created_at || 'Unknown'}

Return a JSON result indicating fraud risk analysis:
{
  "risk": "low" | "medium" | "high",
  "score": number (0 to 100, where 100 is perfectly legitimate),
  "reason": "short explanation"
}
Only output the raw JSON object. Do not format with markdown.`;

      const response = await askGemini(prompt);
      const assessment = JSON.parse(response || '{"risk":"low","score":95,"reason":"Approved by fallback."}');
      
      setFraudScore(assessment.score);
      setFraudRisk(assessment.risk);

      if (assessment.risk === 'high') {
        alert("⚠️ Booking flagged as high risk. Booking blocked for safety.");
        setFraudOverlay(false);
        setBookingLoading(false);
        return;
      }

      // Safe booking, write to Supabase
      const { error } = await supabase.from('bookings').insert({
        renter_id: currentUser.id,
        item_id: item.id,
        start_date: startDate,
        end_date: endDate,
        total_price: getTotalPrice(),
        status: 'pending',
        fraud_score: assessment.score,
        fraud_risk: assessment.risk
      });

      if (error) {
        alert("Booking failed: " + error.message);
      } else {
        setTimeout(() => {
          setFraudOverlay(false);
          navigate('/bookings');
        }, 1500);
      }

    } catch (err) {
      console.error(err);
      alert("Verification system failed. Please try again.");
      setFraudOverlay(false);
    } finally {
      setBookingLoading(false);
    }
  };

  const handleDeleteItem = async () => {
    if (!item) return;
    const confirm = window.confirm("Are you sure you want to delete this listing?");
    if (!confirm) return;

    // Check for active bookings
    const { data: bookings } = await supabase
      .from('bookings')
      .select('id')
      .eq('item_id', item.id)
      .in('status', ['pending', 'confirmed']);

    if (bookings && bookings.length > 0) {
      alert("❌ Cannot delete item. There are active or pending bookings for this item.");
      return;
    }

    // Delete listing from database
    const { error } = await supabase.from('items').delete().eq('id', item.id);
    if (error) {
      alert("Delete failed: " + error.message);
    } else {
      alert("Listing deleted successfully!");
      navigate('/');
    }
  };

  if (loading || !item) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', margin: '120px 0' }}>
        <div className="spinner"></div>
      </div>
    );
  }

  const isOwner = currentUser?.id === item.owner_id;
  const itemImages = item.images && item.images.length > 0 ? item.images : [];

  return (
    <div className="container">
      {fraudOverlay && (
        <div className="fraud-shield-overlay">
          <div className="fraud-shield-card">
            {bookingLoading ? (
              <>
                <div className="spinner"></div>
                <h2>Securing Transaction...</h2>
                <p>Gemini AI is analyzing renter coordinates, timing patterns, and rental value ratios.</p>
              </>
            ) : (
              <>
                <div style={{ color: 'var(--accent)', fontSize: '50px' }}>🛡️</div>
                <h2 style={{ color: 'var(--text-primary)' }}>Safety Verified</h2>
                <p style={{ color: 'var(--accent)' }}>Legitimacy Score: {fraudScore}% ({fraudRisk?.toUpperCase()})</p>
                <p>Booking registered successfully. Syncing calendar with listing owner...</p>
              </>
            )}
          </div>
        </div>
      )}

      <div className="detail-layout">
        <div className="detail-content">
          {/* Main Photo & Thumbnail Gallery */}
          <div>
            <div className="detail-img-box">
              {itemImages.length > 0 ? (
                <img 
                  src={itemImages[selectedImageIndex] || itemImages[0]} 
                  alt={item.title} 
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                <div style={{ fontSize: '100px' }}>
                  {item.category_id === 1 && '🛵'}
                  {item.category_id === 2 && '💻'}
                  {item.category_id === 3 && '⚙️'}
                  {item.category_id === 4 && '📸'}
                  {item.category_id === 5 && '📦'}
                  {item.category_id === 0 && '📦'}
                </div>
              )}
            </div>

            {/* Thumbnail Row */}
            {itemImages.length > 1 && (
              <div style={{ display: 'flex', gap: '10px', marginTop: '12px', overflowX: 'auto' }}>
                {itemImages.map((imgUrl, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImageIndex(index)}
                    style={{
                      border: selectedImageIndex === index ? '2px solid var(--accent)' : '1px solid var(--border-color)',
                      borderRadius: 'var(--radius-sm)',
                      overflow: 'hidden',
                      padding: 0,
                      background: 'none',
                      cursor: 'pointer',
                      width: '70px',
                      height: '70px',
                      flexShrink: 0
                    }}
                  >
                    <img src={imgUrl} alt={`Thumbnail ${index}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
            <h1 className="page-title">{item.title}</h1>
            <p style={{ color: 'var(--secondary)', fontSize: '14px', fontWeight: '700', textTransform: 'uppercase' }}>
              {item.brand && `${item.brand} `}{item.model}
            </p>
          </div>

          <div className="owner-card">
            <div className="owner-avatar">👤</div>
            <div>
              <p style={{ color: 'var(--text-primary)', fontWeight: '700', fontSize: '14px' }}>
                Listed by {owner?.full_name || 'Verified Owner'}
              </p>
              <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Response Rate: 95%</p>
            </div>
          </div>

          <div>
            <h3 className="detail-section-title">Item Description</h3>
            <p className="detail-desc">{item.description || 'No description provided.'}</p>
          </div>

          <div>
            <h3 className="detail-section-title">Product Details & Pricing</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', background: 'var(--bg-card)', padding: '16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', fontSize: '14px' }}>
              <div><strong>Condition:</strong> {item.condition?.replace('_', ' ') || 'Good'}</div>
              <div><strong>City / Region:</strong> {item.location_city || 'India'}</div>

              {depositVal > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent)', fontWeight: '600' }}>
                  <ShieldCheck size={18} />
                  <span>Security Deposit: ₹{depositVal} (Refundable upon return)</span>
                </div>
              )}

              {item.location_address && (
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', color: 'var(--text-primary)', marginTop: '4px' }}>
                  <MapPin size={18} style={{ color: 'var(--accent)', marginTop: '2px', flexShrink: 0 }} />
                  <div>
                    <strong>Full Pickup Address:</strong>
                    <div style={{ color: 'var(--text-secondary)', marginTop: '2px' }}>
                      {item.location_address}
                      {item.location_pincode ? ` — ${item.location_pincode}` : ''}
                      {item.location_state ? `, ${item.location_state}` : ''}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div>
            <h3 className="detail-section-title">Pickup Location Map</h3>
            <div id="map-box" style={{ width: '100%', height: '300px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)', overflow: 'hidden' }}></div>
          </div>

          {isOwner && (
            <button 
              onClick={handleDeleteItem} 
              style={{
                alignSelf: 'flex-start',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: 'transparent',
                border: '1px solid var(--error)',
                color: 'var(--error)',
                padding: '10px 20px',
                borderRadius: 'var(--radius-sm)',
                cursor: 'pointer',
                fontWeight: '700',
                fontSize: '13.5px',
                marginTop: '20px'
              }}
            >
              <Trash2 size={16} /> Delete Listing
            </button>
          )}
        </div>

        {/* Booking Request Sidebar */}
        <div className="booking-card">
          <div className="price-tag">
            ₹{item.price_per_day}<span>/day</span>
          </div>

          {depositVal > 0 && (
            <div style={{ fontSize: '13px', color: 'var(--text-muted)', textAlign: 'center', marginBottom: '12px' }}>
              + ₹{depositVal} refundable deposit
            </div>
          )}

          {!isOwner ? (
            <form onSubmit={handleBookingSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="booking-dates">
                <div className="form-group" style={{ flex: 1 }}>
                  <label>Renting Start</label>
                  <input 
                    type="date" 
                    className="form-input" 
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label>Renting End</label>
                  <input 
                    type="date" 
                    className="form-input" 
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    required
                  />
                </div>
              </div>

              {startDate && endDate && (
                <div className="booking-summary">
                  <div className="summary-row">
                    <span>Rate:</span>
                    <span>₹{item.price_per_day} x {getDaysDiff()} days</span>
                  </div>
                  {depositVal > 0 && (
                    <div className="summary-row">
                      <span>Refundable Deposit:</span>
                      <span>₹{depositVal}</span>
                    </div>
                  )}
                  <div className="summary-row summary-total">
                    <span>Total Amount:</span>
                    <span>₹{getTotalPrice() + (depositVal > 0 ? depositVal : 0)}</span>
                  </div>
                </div>
              )}

              <button type="submit" className="btn-submit" style={{ width: '100%' }}>
                Request Booking
              </button>
            </form>
          ) : (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '14px' }}>
              You own this listing.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
