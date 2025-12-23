import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { signInUser } from '../services/cognitoAuth';
import api from '../utils/api';
import './Login.css';

function Login() {
  const [formData, setFormData] = useState({
    userId: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // 1. Sign in with Cognito
      const result = await signInUser(formData.userId, formData.password);
      
      if (!result.success) {
        setError(result.error || 'Login failed. Please try again.');
        setLoading(false);
        return;
      }
      
      // Check if sign-in requires additional steps
      if (result.nextStep && result.nextStep.signInStep !== 'DONE') {
        setError('Please complete verification before signing in.');
        setLoading(false);
        return;
      }
      
      // If sign-in is complete, proceed normally
      if (!result.isSignedIn) {
        setError('Sign-in incomplete. Please try again.');
        setLoading(false);
        return;
      }
      
      // 2. Fetch user info from backend using Cognito token
      try {
        const userResponse = await api.get('/auth/me');
        const userData = userResponse.data;
        
        // 3. Store user info locally
        localStorage.setItem('user', JSON.stringify(userData));
        
        // 4. Navigate to home
        navigate('/home');
      } catch (apiError) {
        // If it's a 403 verification error, show message
        if (apiError.response?.status === 403) {
          setError(apiError.response?.data?.message || 'Please verify your contact information.');
        } else {
          throw apiError; // Re-throw to be caught by outer catch
        }
      }
      
    } catch (err) {
      console.error('Login error:', err);
      setError(err.response?.data?.message || err.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h1 className="login-title">Dental Clinic Management</h1>
        <h2 className="login-subtitle">Login</h2>
        
        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="userId">Email or Mobile Number</label>
            <input
              type="text"
              id="userId"
              name="userId"
              value={formData.userId}
              onChange={handleChange}
              required
              placeholder="Enter your email or mobile number"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              placeholder="Enter your password"
            />
          </div>

          <button type="submit" className="login-button" disabled={loading}>
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <div className="login-links">
          <Link to="/forgot-password" className="link">Forgot Password?</Link>
          <Link to="/register" className="link">New User Registration</Link>
        </div>
      </div>
    </div>
  );
}

export default Login;
