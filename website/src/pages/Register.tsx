import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';

export default function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    // Sign up the user
    const { data, error: registerError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (registerError) {
      setError(registerError.message);
      setLoading(false);
      return;
    }

    if (data?.user) {
      // Supabase trigger generally inserts profile automatically.
      // Let's perform an upsert just in case:
      await supabase.from('profiles').upsert({
        id: data.user.id,
        full_name: fullName,
        updated_at: new Date().toISOString(),
      });
      
      setSuccess(true);
      setLoading(false);
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    }
  };

  return (
    <div className="auth-box">
      <h2 className="auth-title">Create Account</h2>
      {error && <div style={{ color: 'var(--error)', fontSize: '13px', textAlign: 'center' }}>{error}</div>}
      {success && <div style={{ color: 'var(--accent)', fontSize: '13px', textAlign: 'center' }}>Account created! Redirecting...</div>}
      
      <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div className="form-group">
          <label>Full Name</label>
          <input 
            type="text" 
            className="form-input" 
            placeholder="Gracian Boaz"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label>Email Address</label>
          <input 
            type="email" 
            className="form-input" 
            placeholder="yourname@domain.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label>Password</label>
          <input 
            type="password" 
            className="form-input" 
            placeholder="Min. 6 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        <button type="submit" className="btn-submit" disabled={loading}>
          {loading ? 'Creating Account...' : 'Sign Up'}
        </button>
      </form>

      <div className="auth-toggle">
        Already have an account? <Link to="/login" className="auth-link">Log In</Link>
      </div>
    </div>
  );
}
