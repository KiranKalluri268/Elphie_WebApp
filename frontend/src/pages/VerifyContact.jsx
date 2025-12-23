import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { confirmVerification, resendVerificationCode } from '../services/cognitoAuth';
import api from '../utils/api';

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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#667eea] to-[#764ba2] p-5">
        <div className="bg-white p-10 rounded-xl shadow-2xl max-w-[500px] w-full">
          <div className="text-center py-10 px-5">
            <h2 className="text-green-500 text-[32px] mb-4 font-bold">✓ Verified Successfully!</h2>
            <p className="text-[#666] text-base my-2">Your {email ? 'email' : 'phone number'} has been verified.</p>
            <p className="text-[#666] text-base my-2">Redirecting to login...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#667eea] to-[#764ba2] p-5">
      <div className="bg-white p-10 rounded-xl shadow-2xl max-w-[500px] w-full">
        <h1 className="text-[#333] mb-2.5 text-[28px] text-center font-bold">Verify Your {email ? 'Email' : 'Phone Number'}</h1>
        <p className="text-[#666] mb-8 text-center text-base">
          We've sent a verification code to <strong className="text-[#667eea] font-bold">{email || phoneNumber}</strong>
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

        {error && <div className="bg-red-100 text-red-700 p-3 rounded-lg mb-5 border border-red-200 text-center">{error}</div>}

        <form onSubmit={handleVerify} className="mb-8">
          <div className="mb-5">
            <label htmlFor="code" className="block mb-2 text-[#333] font-semibold text-sm">Verification Code</label>
            <input
              type="text"
              id="code"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              placeholder="Enter 6-digit code"
              maxLength="6"
              required
              autoFocus
              className="w-full p-3 border-2 border-[#ddd] rounded-lg text-lg text-center tracking-[4px] transition-colors focus:outline-none focus:border-[#667eea]"
            />
          </div>

          <button
            type="submit"
            className="w-full p-3.5 bg-gradient-to-br from-[#667eea] to-[#764ba2] text-white border-0 rounded-lg text-base font-semibold cursor-pointer transition-all hover:-translate-y-0.5 hover:shadow-lg disabled:opacity-60 disabled:cursor-not-allowed"
            disabled={loading || code.length !== 6}
          >
            {loading ? 'Verifying...' : 'Verify'}
          </button>
        </form>

        <div className="text-center py-5 border-t border-b border-[#eee] mb-5">
          <p className="text-[#666] mb-2.5 text-sm">Didn't receive the code?</p>
          <button
            type="button"
            onClick={handleResendCode}
            disabled={resending}
            className="bg-transparent text-[#667eea] border-2 border-[#667eea] py-2.5 px-6 rounded-lg text-sm font-semibold cursor-pointer transition-all hover:bg-[#667eea] hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {resending ? 'Sending...' : 'Resend Code'}
          </button>
        </div>

        <div className="text-center">
          <button onClick={() => navigate('/login')} className="bg-transparent text-[#666] border-0 p-2.5 text-sm cursor-pointer underline transition-colors hover:text-[#667eea]">
            Back to Login
          </button>
        </div>
      </div>
    </div>
  );
}

export default VerifyContact;

