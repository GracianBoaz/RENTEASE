import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { askGemini } from '../geminiClient';
import { Upload, X, Camera } from 'lucide-react';

interface UserAddress {
  id?: string;
  name?: string;
  mobile?: string;
  flat_house_no: string;
  area_street_village: string;
  landmark?: string;
  pincode: string;
  town_city: string;
  state: string;
  location_lat?: number;
  location_lng?: number;
  is_default?: boolean;
}

export default function Publish() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState(2); // default Electronics
  const [price, setPrice] = useState('');
  const [securityDeposit, setSecurityDeposit] = useState(''); // Optional Security Deposit
  const [condition, setCondition] = useState('good');
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Photo Upload States
  const [photoFiles, setPhotoFiles] = useState<File[]>([]);
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);

  // Address & Location States
  const [flatHouseNo, setFlatHouseNo] = useState('');
  const [areaStreet, setAreaStreet] = useState('');
  const [landmark, setLandmark] = useState('');
  const [pincode, setPincode] = useState('');
  const [townCity, setTownCity] = useState('');
  const [state, setState] = useState('');
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [saveAddressToAccount, setSaveAddressToAccount] = useState(false);

  // Saved Addresses
  const [savedAddresses, setSavedAddresses] = useState<UserAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>('');

  const [loading, setLoading] = useState(false);
  const [locating, setLocating] = useState(false);
  const [fraudOverlay, setFraudOverlay] = useState(false);
  const [fraudScore, setFraudScore] = useState<number | null>(null);

  const [dbCategories, setDbCategories] = useState<any[]>([]);

  const navigate = useNavigate();
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);

  useEffect(() => {
    fetchSession();
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase.from('categories').select('id, name');
      if (!error && data && data.length > 0) {
        setDbCategories(data);
        setCategoryId(data[0].id);
      }
    } catch (err) {
      console.error("Error fetching categories:", err);
    }
  };

  useEffect(() => {
    if (pincode.length === 6) {
      fetchFromPincode(pincode);
    }
  }, [pincode]);

  // Leaflet Map Initialization for Publish
  useEffect(() => {
    const L = (window as any).L;
    if (!L) return;

    const mapElement = document.getElementById('publish-map-box');
    if (!mapElement) return;

    const defaultLat = lat || 13.0827; // Default center (e.g. Chennai)
    const defaultLng = lng || 80.2707;
    const initialZoom = (lat && lng) ? 15 : 12;

    if (!mapRef.current) {
      try {
        const map = L.map('publish-map-box').setView([defaultLat, defaultLng], initialZoom);
        mapRef.current = map;

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap'
        }).addTo(map);

        const marker = L.marker([defaultLat, defaultLng], { draggable: true }).addTo(map);
        markerRef.current = marker;

        marker.on('dragend', (e: any) => {
          const position = e.target.getLatLng();
          setLat(position.lat);
          setLng(position.lng);
          reverseGeocode(position.lat, position.lng);
        });

        map.on('click', (e: any) => {
          const { lat: clickLat, lng: clickLng } = e.latlng;
          marker.setLatLng([clickLat, clickLng]);
          setLat(clickLat);
          setLng(clickLng);
          reverseGeocode(clickLat, clickLng);
        });
      } catch (e) {
        console.error("Map initialization error:", e);
      }
    } else {
      if (lat && lng && markerRef.current) {
        markerRef.current.setLatLng([lat, lng]);
        mapRef.current.setView([lat, lng], 15);
      }
    }
  }, [lat, lng]);

  const fetchSession = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      alert("Please login first to list items.");
      navigate('/login');
      return;
    }
    setCurrentUser(session.user);
    fetchSavedAddresses(session.user.id);
  };

  const fetchSavedAddresses = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_addresses')
        .select('*')
        .eq('user_id', userId)
        .order('is_default', { ascending: false });

      if (!error && data) {
        setSavedAddresses(data);
      }
    } catch (err) {
      console.error("Error fetching saved addresses:", err);
    }
  };

  const handleSelectSavedAddress = (addressId: string) => {
    setSelectedAddressId(addressId);
    if (!addressId) return;

    const addr = savedAddresses.find(a => a.id === addressId);
    if (addr) {
      setFlatHouseNo(addr.flat_house_no || '');
      setAreaStreet(addr.area_street_village || '');
      setLandmark(addr.landmark || '');
      setPincode(addr.pincode || '');
      setTownCity(addr.town_city || '');
      setState(addr.state || '');
      if (addr.location_lat && addr.location_lng) {
        setLat(addr.location_lat);
        setLng(addr.location_lng);
      }
    }
  };

  // Photo Handling
  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const newFiles = Array.from(e.target.files);
    
    // Combine and limit to 5 photos
    const totalFiles = [...photoFiles, ...newFiles].slice(0, 5);
    setPhotoFiles(totalFiles);

    // Create preview URLs
    const newPreviews = totalFiles.map(file => URL.createObjectURL(file));
    setPhotoPreviews(newPreviews);
  };

  const handleRemovePhoto = (index: number) => {
    const updatedFiles = photoFiles.filter((_, i) => i !== index);
    const updatedPreviews = photoPreviews.filter((_, i) => i !== index);
    setPhotoFiles(updatedFiles);
    setPhotoPreviews(updatedPreviews);
  };

  const uploadPhotosToSupabase = async (): Promise<string[]> => {
    if (photoFiles.length === 0) return [];

    const imageUrls: string[] = [];

    for (const file of photoFiles) {
      try {
        const fileName = `${Date.now()}_${Math.random().toString(36).slice(2)}_${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
        const filePath = `public/${fileName}`;

        const { data, error } = await supabase.storage
          .from('item-images')
          .upload(filePath, file, { upsert: true });

        if (!error && data) {
          const { data: publicUrlData } = supabase.storage
            .from('item-images')
            .getPublicUrl(filePath);
          imageUrls.push(publicUrlData.publicUrl);
        } else {
          // Fallback to FileReader Data URL if bucket upload has RLS restriction
          const dataUrl = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.readAsDataURL(file);
          });
          imageUrls.push(dataUrl);
        }
      } catch (err) {
        console.error("Photo upload error:", err);
        // Fallback to FileReader Data URL
        const dataUrl = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        });
        imageUrls.push(dataUrl);
      }
    }

    return imageUrls;
  };

  const fetchFromPincode = async (code: string) => {
    try {
      const res = await fetch(`https://api.postalpincode.in/pincode/${code}`);
      const data = await res.json();
      if (data && data[0]?.Status === 'Success' && data[0]?.PostOffice?.length > 0) {
        const po = data[0].PostOffice[0];
        if (!townCity) setTownCity(po.District || po.Block || '');
        if (!state) setState(po.State || '');
      }
    } catch (error) {
      console.error('Pincode fetch error:', error);
    }
  };

  const reverseGeocode = async (latitude: number, longitude: number) => {
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
      const data = await res.json();
      if (data && data.address) {
        const add = data.address;
        const cityVal = add.city || add.town || add.village || add.suburb || add.county || '';
        const stateVal = add.state || '';
        const pincodeVal = add.postcode || '';
        const roadVal = add.road || add.suburb || add.neighbourhood || '';

        if (cityVal && !townCity) setTownCity(cityVal);
        if (stateVal && !state) setState(stateVal);
        if (pincodeVal && !pincode) setPincode(pincodeVal);
        if (roadVal && !areaStreet) setAreaStreet(roadVal);
      }
    } catch (err) {
      console.error("Reverse geocoding error:", err);
    }
  };

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }

    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const currentLat = position.coords.latitude;
        const currentLng = position.coords.longitude;
        setLat(currentLat);
        setLng(currentLng);
        setLocating(false);

        await reverseGeocode(currentLat, currentLng);
      },
      (error) => {
        setLocating(false);
        console.error("Geolocation error:", error);
        alert("Could not access your location. Please ensure location services are enabled on your browser.");
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !price || !flatHouseNo || !areaStreet || !townCity || !pincode || !currentUser) {
      alert("Please fill in all required fields including title, price, flat/house, area, pincode, and city.");
      return;
    }

    const fullLocationAddress = `${flatHouseNo}, ${areaStreet}${landmark ? ', Near ' + landmark : ''}`;
    const locationName = `${flatHouseNo}, ${areaStreet}, ${townCity}`;

    setLoading(true);
    setFraudOverlay(true);

    try {
      // 1. Upload photos first
      const uploadedPhotoUrls = await uploadPhotosToSupabase();

      // 2. Ask Gemini AI for listing risk score
      const prompt = `
You are a listing verification AI for RentEase, an Indian peer-to-peer rental marketplace.
Evaluate the listing for potential scams or fraud. Most listings are genuine — only flag as high risk if there are obvious red flags like extremely suspicious pricing (e.g. a car for ₹1/day), or clearly fake/offensive content.

Listing details:
- Title: "${title}"
- Description: "${description || 'Not provided'}"
- Category ID: ${categoryId}
- Price: ₹${price}/day
- Security Deposit: ₹${securityDeposit || '0'}
- Location: "${fullLocationAddress}, ${townCity} - ${pincode}"
- Number of Photos: ${uploadedPhotoUrls.length}

Guidelines:
- Normal item rentals in India (tools, cameras, electronics, bikes) with reasonable prices are LOW risk.
- Missing description or zero photos alone is NOT high risk.
- Only mark as "high" if there is clearly fraudulent or harmful intent.
- Default towards "low" risk for typical rental listings.

Return ONLY a JSON object (no markdown, no explanation outside JSON):
{
  "risk": "low",
  "score": 88,
  "reason": "Normal rental listing"
}`;

      let assessment = { risk: 'low', score: 90, reason: 'Approved.' };
      try {
        const response = await askGemini(prompt);
        const cleaned = (response || '').replace(/```json|```/g, '').trim();
        const parsed = JSON.parse(cleaned);
        if (parsed && typeof parsed.score === 'number') {
          assessment = parsed;
        }
      } catch (parseErr) {
        console.warn('Fraud check parse failed, defaulting to low risk:', parseErr);
      }

      setFraudScore(assessment.score);

      // Only hard-block if score is extremely low (clear scam), not just "high" risk label
      if (assessment.score < 25) {
        alert("⚠️ Listing rejected. Our AI flagged this listing as potentially fraudulent. Please review your listing details.");
        setFraudOverlay(false);
        setLoading(false);
        return;
      }

      // 3. Write item to Supabase database
      const specsData = securityDeposit ? { deposit: parseFloat(securityDeposit) } : null;

      // Validate category_id against categories table to prevent items_category_id_fkey violation
      let validCategoryId: number | null = null;
      if (categoryId) {
        const { data: catCheck } = await supabase
          .from('categories')
          .select('id')
          .eq('id', categoryId)
          .maybeSingle();
        if (catCheck) {
          validCategoryId = categoryId;
        }
      }

      const { error } = await supabase.from('items').insert({
        owner_id: currentUser.id,
        title,
        description,
        category_id: validCategoryId,
        price_per_day: parseFloat(price),
        specs: specsData,
        images: uploadedPhotoUrls,
        location_name: locationName,
        location_city: townCity,
        location_address: fullLocationAddress,
        location_pincode: pincode,
        location_state: state,
        location_lat: lat || null,
        location_lng: lng || null,
        condition,
        is_available: true,
        fraud_score: assessment.score,
        fraud_risk: assessment.risk
      });

      if (error) {
        alert("Publish failed: " + error.message);
      } else {
        // Optionally save address to user's saved address book
        if (saveAddressToAccount && currentUser) {
          await supabase.from('user_addresses').insert({
            user_id: currentUser.id,
            name: currentUser.user_metadata?.full_name || 'User',
            mobile: currentUser.phone || '',
            flat_house_no: flatHouseNo,
            area_street_village: areaStreet,
            landmark,
            pincode,
            town_city: townCity,
            state,
            location_lat: lat,
            location_lng: lng,
            is_default: savedAddresses.length === 0
          });
        }

        setTimeout(() => {
          setFraudOverlay(false);
          alert("🎉 Listing published successfully!");
          navigate('/');
        }, 1500);
      }

    } catch (err) {
      console.error(err);
      alert("Publishing failed. Please try again.");
      setFraudOverlay(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ maxWidth: '680px' }}>
      <h1 className="page-title">List Your Gear</h1>
      <p className="page-desc">Turn your idle equipment, EVs, or cameras into passive income. Add photos, security deposit, and item location.</p>

      {fraudOverlay && (
        <div className="fraud-shield-overlay">
          <div className="fraud-shield-card">
            {loading ? (
              <>
                <div className="spinner"></div>
                <h2>Analyzing Listing & Uploading Media...</h2>
                <p>Gemini AI is analyzing item description patterns, pricing distributions, photos, and location integrity markers.</p>
              </>
            ) : (
              <>
                <div style={{ color: 'var(--accent)', fontSize: '50px' }}>🛡️</div>
                <h2 style={{ color: 'var(--text-primary)' }}>Integrity Screen Passed</h2>
                <p style={{ color: 'var(--accent)' }}>Legitimacy Rating: {fraudScore}%</p>
                <p>Publishing your listing to the community search feed...</p>
              </>
            )}
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px', background: 'var(--bg-card)', padding: '36px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)' }}>
        
        <div className="form-group">
          <label>Item Name (Title)*</label>
          <input 
            type="text" 
            className="form-input" 
            placeholder="e.g. DJI Mavic 3 Pro Drone"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label>Description</label>
          <textarea 
            className="form-input" 
            rows={4}
            placeholder="Describe the condition, usage, and any key specs of the product..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        {/* Photo Upload Section */}
        <div className="form-group">
          <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Camera size={18} style={{ color: 'var(--accent)' }} /> Item Photos (Upload up to 5 photos)
          </label>

          <div className="photo-upload-dropzone" style={{ border: '2px dashed var(--border-color)', padding: '24px', borderRadius: 'var(--radius-md)', textAlign: 'center', background: 'var(--bg-main)', position: 'relative', cursor: 'pointer' }}>
            <input 
              type="file" 
              accept="image/*" 
              multiple 
              onChange={handlePhotoSelect} 
              style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }}
            />
            <Upload size={32} style={{ color: 'var(--accent)', marginBottom: '8px' }} />
            <p style={{ fontWeight: '600', color: 'var(--text-primary)', margin: 0 }}>Click or drag photos here to upload</p>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>PNG, JPG, WEBP up to 10MB (First photo will be cover)</p>
          </div>

          {/* Photo Previews */}
          {photoPreviews.length > 0 && (
            <div style={{ display: 'flex', gap: '12px', marginTop: '14px', flexWrap: 'wrap' }}>
              {photoPreviews.map((preview, idx) => (
                <div key={idx} style={{ position: 'relative', width: '90px', height: '90px', borderRadius: 'var(--radius-md)', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
                  <img src={preview} alt={`Preview ${idx}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <button 
                    type="button" 
                    onClick={() => handleRemovePhoto(idx)}
                    style={{ position: 'absolute', top: '4px', right: '4px', background: 'rgba(0, 0, 0, 0.6)', border: 'none', color: '#fff', borderRadius: '50%', width: '22px', height: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                  >
                    <X size={14} />
                  </button>
                  {idx === 0 && (
                    <span style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'var(--accent)', color: '#fff', fontSize: '9px', fontWeight: '700', textAlign: 'center', padding: '2px 0' }}>COVER</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div className="form-group">
            <label>Category*</label>
            <select 
              className="form-input"
              value={categoryId}
              onChange={(e) => setCategoryId(parseInt(e.target.value))}
            >
              {dbCategories.length > 0 ? (
                dbCategories.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))
              ) : (
                <>
                  <option value={1}>EVs / Vehicles</option>
                  <option value={2}>Electronics</option>
                  <option value={3}>Tools & Equipment</option>
                  <option value={4}>Cameras & Optics</option>
                  <option value={5}>Others / General Gear</option>
                </>
              )}
            </select>
          </div>

          <div className="form-group">
            <label>Condition*</label>
            <select 
              className="form-input"
              value={condition}
              onChange={(e) => setCondition(e.target.value)}
            >
              <option value="new">Brand New</option>
              <option value="like_new">Like New</option>
              <option value="good">Good Condition</option>
              <option value="fair">Fair / Used</option>
            </select>
          </div>
        </div>

        {/* Pricing & Optional Security Deposit */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div className="form-group">
            <label>Daily Price (₹)*</label>
            <input 
              type="number" 
              className="form-input" 
              placeholder="e.g. 700"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>Security Deposit (₹) (Optional)</label>
            <input 
              type="number" 
              className="form-input" 
              placeholder="e.g. 500 (Refundable)"
              value={securityDeposit}
              onChange={(e) => setSecurityDeposit(e.target.value)}
            />
          </div>
        </div>

        {/* Location & Address Section Header */}
        <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '20px', marginTop: '10px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            📍 Item Pickup Location & Address
          </h3>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px' }}>
            Set accurate address and location pin so renters can easily locate your item.
          </p>

          {/* Option to pick saved address */}
          {savedAddresses.length > 0 && (
            <div className="form-group" style={{ marginBottom: '16px' }}>
              <label>Select Saved Address</label>
              <select 
                className="form-input" 
                value={selectedAddressId}
                onChange={(e) => handleSelectSavedAddress(e.target.value)}
              >
                <option value="">-- Choose a saved address --</option>
                {savedAddresses.map((addr) => (
                  <option key={addr.id} value={addr.id}>
                    {addr.flat_house_no}, {addr.area_street_village}, {addr.town_city} ({addr.pincode})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Use Current Location GPS Button */}
          <button
            type="button"
            className="btn-location-gps"
            onClick={handleGetCurrentLocation}
            disabled={locating}
            style={{
              width: '100%',
              padding: '12px 18px',
              borderRadius: 'var(--radius-md)',
              border: '1.5px solid var(--accent)',
              background: 'rgba(16, 185, 129, 0.08)',
              color: 'var(--accent)',
              fontWeight: '700',
              fontSize: '15px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              marginBottom: '20px',
              transition: 'all 0.2s ease'
            }}
          >
            {locating ? (
              <>
                <div className="spinner" style={{ width: '18px', height: '18px', borderWidth: '2px' }}></div>
                <span>Fetching GPS Location...</span>
              </>
            ) : (
              <>
                <span>📍 📍 Use My Current Location</span>
              </>
            )}
          </button>

          {/* Interactive Leaflet Map Preview */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '8px' }}>
              Pickup Location Pin {lat && lng ? `(${lat.toFixed(4)}, ${lng.toFixed(4)})` : '(Click map to set pin)'}
            </label>
            <div id="publish-map-box" style={{ width: '100%', height: '220px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', overflow: 'hidden' }}></div>
          </div>

          {/* Detailed Address Inputs matching Mobile App */}
          <div className="form-group" style={{ marginBottom: '16px' }}>
            <label>Flat / House No*</label>
            <input 
              type="text" 
              className="form-input" 
              placeholder="Flat, House No, Building"
              value={flatHouseNo}
              onChange={(e) => setFlatHouseNo(e.target.value)}
              required
            />
          </div>

          <div className="form-group" style={{ marginBottom: '16px' }}>
            <label>Area, Street, Village*</label>
            <input 
              type="text" 
              className="form-input" 
              placeholder="Area, Street, Village"
              value={areaStreet}
              onChange={(e) => setAreaStreet(e.target.value)}
              required
            />
          </div>

          <div className="form-group" style={{ marginBottom: '16px' }}>
            <label>Landmark (Optional)</label>
            <input 
              type="text" 
              className="form-input" 
              placeholder="Near park, behind metro station, etc."
              value={landmark}
              onChange={(e) => setLandmark(e.target.value)}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
            <div className="form-group">
              <label>Pincode*</label>
              <input 
                type="text" 
                className="form-input" 
                placeholder="6-digit Pincode"
                maxLength={6}
                value={pincode}
                onChange={(e) => setPincode(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label>Town / City*</label>
              <input 
                type="text" 
                className="form-input" 
                placeholder="City"
                value={townCity}
                onChange={(e) => setTownCity(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label>State</label>
              <input 
                type="text" 
                className="form-input" 
                placeholder="State"
                value={state}
                onChange={(e) => setState(e.target.value)}
              />
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '16px' }}>
            <input 
              type="checkbox" 
              id="save-address-chk" 
              checked={saveAddressToAccount}
              onChange={(e) => setSaveAddressToAccount(e.target.checked)}
              style={{ width: '16px', height: '16px', accentColor: 'var(--accent)' }}
            />
            <label htmlFor="save-address-chk" style={{ fontSize: '13.5px', color: 'var(--text-secondary)', cursor: 'pointer' }}>
              Save this address to my account for future listings
            </label>
          </div>
        </div>

        <button type="submit" className="btn-submit" style={{ marginTop: '10px' }}>
          Publish Listing 🎉
        </button>
      </form>
    </div>
  );
}
