import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { signInUser } from '../services/cognitoAuth';
import api from '../utils/api';

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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#667eea] to-[#764ba2] p-5">
      <div className="bg-white rounded-xl shadow-2xl p-10 w-full max-w-[450px]">
        <h1 className="text-center text-gray-800 mb-2.5 text-3xl font-bold">Dental Clinic Management</h1>
        <h2 className="text-center text-gray-500 mb-8 text-xl font-medium">Login</h2>

        {error && <div className="bg-red-100 text-red-700 p-3 rounded-lg mb-5 text-sm border border-red-200">{error}</div>}

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <label htmlFor="userId" className="font-medium text-gray-800 text-sm">Email or Mobile Number</label>
            <input
              type="text"
              id="userId"
              name="userId"
              value={formData.userId}
              onChange={handleChange}
              required
              placeholder="Enter your email or mobile number"
              className="p-3 border-2 border-gray-200 rounded-lg text-base transition-colors focus:outline-none focus:border-[#667eea]"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="password" className="font-medium text-gray-800 text-sm">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              placeholder="Enter your password"
              className="p-3 border-2 border-gray-200 rounded-lg text-base transition-colors focus:outline-none focus:border-[#667eea]"
            />
          </div>

          <button
            type="submit"
            className="p-3.5 bg-gradient-to-br from-[#667eea] to-[#764ba2] text-white border-0 rounded-lg text-base font-semibold cursor-pointer transition-all mt-2.5 hover:-translate-y-0.5 hover:shadow-lg disabled:opacity-60 disabled:cursor-not-allowed"
            disabled={loading}
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <div className="flex justify-between mt-5 pt-5 border-t border-gray-200">
          <Link to="/forgot-password" className="text-[#667eea] no-underline text-sm font-medium transition-colors hover:text-[#764ba2] hover:underline">Forgot Password?</Link>
          <Link to="/register" className="text-[#667eea] no-underline text-sm font-medium transition-colors hover:text-[#764ba2] hover:underline">New User Registration</Link>
        </div>
      </div>
    </div>
  );
}

export default Login;
