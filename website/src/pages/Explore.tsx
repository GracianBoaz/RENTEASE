import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { Search } from 'lucide-react';

interface Item {
  id: string;
  title: string;
  category_id: number;
  price_per_day: number;
  location_name: string;
  location_city: string;
  images: string[];
  condition: string;
  rating: number;
  description?: string;
}

const CATEGORIES = [
  { id: 0, name: 'All Categories' },
  { id: 1, name: 'EVs' },
  { id: 2, name: 'Electronics' },
  { id: 3, name: 'Tools' },
  { id: 4, name: 'Cameras' },
  { id: 5, name: 'Others' }
];

export default function Explore() {
  const [items, setItems] = useState<Item[]>([]);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState(0);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchItems();
  }, [activeCategory]);

  const fetchItems = async () => {
    setLoading(true);
    let query = supabase
      .from('items')
      .select('*')
      .eq('is_available', true);

    if (activeCategory !== 0) {
      query = query.eq('category_id', activeCategory);
    }

    const { data, error } = await query;
    if (error) {
      console.error("Error fetching items:", error);
    } else {
      setItems(data || []);
    }
    setLoading(false);
  };

  const filteredItems = items.filter(item => 
    item.title?.toLowerCase().includes(search.toLowerCase()) ||
    item.description?.toLowerCase().includes(search.toLowerCase())
  );

  const getEmoji = (catId: number) => {
    switch (catId) {
      case 1: return '🛵';
      case 2: return '💻';
      case 3: return '⚙️';
      case 4: return '📸';
      default: return '📦';
    }
  };

  return (
    <div className="container">
      <h1 className="page-title">Find Rental Gear</h1>
      <p className="page-desc">Borrow high-quality tools, EVs, and electronics in your neighborhood at fraction of retail prices.</p>

      <div className="explore-controls">
        <div style={{ position: 'relative', flex: 1, minWidth: '280px' }}>
          <input 
            type="text" 
            className="form-input" 
            placeholder="Search for items, brands, or descriptions..." 
            style={{ width: '100%', paddingLeft: '44px' }}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Search size={18} style={{ position: 'absolute', left: '16px', top: '14px', color: 'var(--text-muted)' }} />
        </div>
      </div>

      <div className="categories-row">
        {CATEGORIES.map(cat => (
          <button 
            key={cat.id} 
            className={`category-pill ${activeCategory === cat.id ? 'active' : ''}`}
            onClick={() => setActiveCategory(cat.id)}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', margin: '80px 0' }}>
          <div className="spinner"></div>
        </div>
      ) : filteredItems.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--text-muted)' }}>
          No available listings found matching your search.
        </div>
      ) : (
        <div className="listings-grid">
          {filteredItems.map(item => (
            <div key={item.id} className="listing-card" onClick={() => navigate(`/item/${item.id}`)}>
              {item.images && item.images[0] ? (
                <img 
                  src={item.images[0]} 
                  alt={item.title} 
                  style={{ width: '100%', height: '180px', objectFit: 'cover' }}
                />
              ) : (
                <div className="listing-image-placeholder">
                  {getEmoji(item.category_id)}
                </div>
              )}
              <div className="listing-card-body">
                <div className="listing-meta-row">
                  <span className="category-badge">
                    {CATEGORIES.find(c => c.id === item.category_id)?.name || 'Gear'}
                  </span>
                  <span className="distance-badge">
                    {item.location_city || 'Nearby'}
                  </span>
                </div>
                <h3 className="listing-card-title">{item.title}</h3>
                <div className="listing-card-bottom">
                  <div className="listing-card-price">
                    ₹{item.price_per_day}<span>/day</span>
                  </div>
                  <div className="rating-badge">
                    ⭐ {item.rating > 0 ? item.rating.toFixed(1) : 'New'}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
