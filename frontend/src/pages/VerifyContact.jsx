import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { confirmVerification, resendVerificationCode } from '../services/cognitoAuth';
import api from '../utils/api';
import './VerifyContact.css';

function VerifyContact() {
  const location = useLocation();
  const navigate = useNavigate();
  
  const {
    email,
    phoneNumber,
    username,
    cognitoUserId,
    nextStep,
  } = location.state || {};
  
  // Log verification details on mount
  useEffect(() => {
    if (nextStep) {
      console.log('Verification Details:', {
        signUpStep: nextStep.signUpStep,
        codeDeliveryDetails: nextStep.codeDeliveryDetails,
        attributeName: nextStep.codeDeliveryDetails?.attributeName,
        deliveryMedium: nextStep.codeDeliveryDetails?.deliveryMedium,
        destination: nextStep.codeDeliveryDetails?.destination
      });
    }
  }, [nextStep]);
  
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resending, setResending] = useState(false);
  const [verified, setVerified] = useState(false);

  const handleVerify = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await confirmVerification(username, code);
      
      if (!result.success) {
        setError(result.error || 'Verification failed');
        setLoading(false);
        return;
      }
      
      // Update backend verification status
      // Determine which was verified based on what was provided
      const emailVerified = email ? true : false;
      const phoneVerified = phoneNumber && !email ? true : false;
      
      await api.post('/auth/update-verification-status', {
        cognitoUserId,
        emailVerified,
        phoneVerified,
      });
      
      setVerified(true);
      
      // Redirect to login after 2 seconds
      setTimeout(() => {
        navigate('/login');
      }, 2000);
      
    } catch (err) {
      setError(err.response?.data?.message || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    setResending(true);
    setError('');
    try {
      const result = await resendVerificationCode(username);
      if (result.success) {
        alert(`Verification code sent to your ${email ? 'email' : 'phone'}!`);
      } else {
        setError(result.error || 'Failed to resend code');
      }
    } catch (err) {
      setError('Failed to resend code');
    } finally {
      setResending(false);
    }
  };

  if (verified) {
    return (
      <div className="verify-contact-container">
        <div className="verify-contact-card">
          <div className="success-message">
            <h2>✓ Verified Successfully!</h2>
            <p>Your {email ? 'email' : 'phone number'} has been verified.</p>
            <p>Redirecting to login...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="verify-contact-container">
      <div className="verify-contact-card">
        <h1>Verify Your {email ? 'Email' : 'Phone Number'}</h1>
        <p className="instruction">
          We've sent a verification code to <strong>{email || phoneNumber}</strong>
        </p>
        {nextStep?.codeDeliveryDetails && (
          <p style={{ fontSize: '12px', color: '#666', marginTop: '10px' }}>
            Code sent via: {nextStep.codeDeliveryDetails.deliveryMedium} 
            to: {nextStep.codeDeliveryDetails.destination}
          </p>
        )}
        <p style={{ fontSize: '12px', color: '#999', marginTop: '5px' }}>
          Check your spam folder if you don't see the email. 
          For testing, you can also verify manually in AWS Cognito Console.
        </p>
        
        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleVerify} className="verification-form">
          <div className="form-group">
            <label htmlFor="code">Verification Code</label>
            <input
              type="text"
              id="code"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              placeholder="Enter 6-digit code"
              maxLength="6"
              required
              autoFocus
            />
          </div>

          <button 
            type="submit" 
            className="verify-button"
            disabled={loading || code.length !== 6}
          >
            {loading ? 'Verifying...' : 'Verify'}
          </button>
        </form>

        <div className="resend-section">
          <p>Didn't receive the code?</p>
          <button
            type="button"
            onClick={handleResendCode}
            disabled={resending}
            className="resend-button"
          >
            {resending ? 'Sending...' : 'Resend Code'}
          </button>
        </div>

        <div className="back-to-login">
          <button onClick={() => navigate('/login')} className="link-button">
            Back to Login
          </button>
        </div>
      </div>
    </div>
  );
}

export default VerifyContact;

