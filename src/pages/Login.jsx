import React, { useState, useRef } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './Login.css';

// Google SVG icon
const GoogleIcon = () => (
  <svg viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
  </svg>
);

function Login() {
  const { user, signInWithGoogle, signInWithEmail, signUpWithEmail, sendPhoneOtp, verifyPhoneOtp, error, clearError } = useAuth();
  const [activeTab, setActiveTab] = useState('google');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Email form state
  const [emailForm, setEmailForm] = useState({ email: '', password: '', displayName: '' });

  // Phone form state
  const [phoneForm, setPhoneForm] = useState({ countryCode: '+91', phoneNumber: '' });
  const [otpStep, setOtpStep] = useState(false);
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [phoneSuccess, setPhoneSuccess] = useState('');
  const otpRefs = useRef([]);

  // Redirect if already logged in
  if (user) {
    return <Navigate to="/" replace />;
  }

  const handleGoogleSignIn = async () => {
    setLoading(true);
    clearError();
    try {
      await signInWithGoogle(rememberMe);
    } catch (err) {
      // error is set by AuthContext
    } finally {
      setLoading(false);
    }
  };

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    clearError();
    try {
      if (isSignUp) {
        await signUpWithEmail(emailForm.email, emailForm.password, emailForm.displayName, rememberMe);
      } else {
        await signInWithEmail(emailForm.email, emailForm.password, rememberMe);
      }
    } catch (err) {
      // error is set by AuthContext
    } finally {
      setLoading(false);
    }
  };

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    clearError();
    setPhoneSuccess('');
    try {
      const fullNumber = phoneForm.countryCode + phoneForm.phoneNumber;
      await sendPhoneOtp(fullNumber, 'recaptcha-container', rememberMe);
      setOtpStep(true);
      setPhoneSuccess('OTP sent successfully!');
    } catch (err) {
      // error is set by AuthContext
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    clearError();
    try {
      const otpString = otp.join('');
      await verifyPhoneOtp(otpString);
    } catch (err) {
      // error is set by AuthContext
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (index, value) => {
    if (value.length > 1) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    // Auto-focus next input
    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    clearError();
    setPhoneSuccess('');
  };

  const formatError = (msg) => {
    if (!msg) return '';
    return msg.replace('Firebase: ', '').replace(/\(auth\/.*\)/, '').trim();
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-logo">
          <div className="login-logo-icon">
            <i className="fas fa-columns"></i>
          </div>
          <h1>KanDoo</h1>
          <p>Organize your workflow beautifully</p>
        </div>

        {/* Auth Method Tabs */}
        <div className="auth-tabs">
          <button className={`auth-tab ${activeTab === 'google' ? 'active' : ''}`} onClick={() => handleTabChange('google')}>
            Google
          </button>
          <button className={`auth-tab ${activeTab === 'email' ? 'active' : ''}`} onClick={() => handleTabChange('email')}>
            Email
          </button>
          <button className={`auth-tab ${activeTab === 'phone' ? 'active' : ''}`} onClick={() => handleTabChange('phone')}>
            Phone
          </button>
        </div>

        {/* Error Display */}
        {error && (
          <div className="auth-error">
            <svg viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/></svg>
            <span>{formatError(error)}</span>
          </div>
        )}

        {/* Remember Me */}
        <label className="remember-me" id="remember-me-toggle">
          <input
            type="checkbox"
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
          />
          <span className="remember-me-checkmark"></span>
          <span className="remember-me-text">Remember me</span>
        </label>

        {/* Google Panel */}
        {activeTab === 'google' && (
          <div className="auth-panel" key="google">
            <button className="google-btn" onClick={handleGoogleSignIn} disabled={loading}>
              {loading ? <span className="btn-spinner"></span> : <><GoogleIcon /> Continue with Google</>}
            </button>
          </div>
        )}

        {/* Email Panel */}
        {activeTab === 'email' && (
          <div className="auth-panel" key="email">
            <form className="login-form" onSubmit={handleEmailSubmit}>
              {isSignUp && (
                <div className="input-group">
                  <label>Display Name</label>
                  <input type="text" className="login-input" placeholder="John Doe" value={emailForm.displayName} onChange={(e) => setEmailForm({ ...emailForm, displayName: e.target.value })} />
                </div>
              )}
              <div className="input-group">
                <label>Email Address</label>
                <input type="email" className="login-input" placeholder="you@example.com" value={emailForm.email} onChange={(e) => setEmailForm({ ...emailForm, email: e.target.value })} required />
              </div>
              <div className="input-group">
                <label>Password</label>
                <input type="password" className="login-input" placeholder="••••••••" value={emailForm.password} onChange={(e) => setEmailForm({ ...emailForm, password: e.target.value })} required minLength={6} />
              </div>
              <button type="submit" className="submit-btn" disabled={loading}>
                {loading ? <span className="btn-spinner"></span> : (isSignUp ? 'Create Account' : 'Sign In')}
              </button>
            </form>
            <div className="auth-toggle">
              {isSignUp ? "Already have an account?" : "Don't have an account?"}
              <button onClick={() => { setIsSignUp(!isSignUp); clearError(); }}>
                {isSignUp ? 'Sign In' : 'Sign Up'}
              </button>
            </div>
          </div>
        )}

        {/* Phone Panel */}
        {activeTab === 'phone' && (
          <div className="auth-panel" key="phone">
            {!otpStep ? (
              <>
                <div className="phone-step">
                  <span className="phone-step-text"><span className="step-num">1</span> Enter your phone number</span>
                </div>
                <form className="login-form" onSubmit={handleSendOtp}>
                  <div className="input-group">
                    <label>Phone Number</label>
                    <div className="phone-input-group">
                      <select className="country-code-select" value={phoneForm.countryCode} onChange={(e) => setPhoneForm({ ...phoneForm, countryCode: e.target.value })}>
                        <option value="+1">+1</option>
                        <option value="+44">+44</option>
                        <option value="+91">+91</option>
                        <option value="+61">+61</option>
                        <option value="+81">+81</option>
                        <option value="+86">+86</option>
                        <option value="+49">+49</option>
                        <option value="+33">+33</option>
                      </select>
                      <input type="tel" className="login-input phone-number-input" placeholder="9876543210" value={phoneForm.phoneNumber} onChange={(e) => setPhoneForm({ ...phoneForm, phoneNumber: e.target.value.replace(/\D/g, '') })} required />
                    </div>
                  </div>
                  <button type="submit" className="submit-btn" disabled={loading}>
                    {loading ? <span className="btn-spinner"></span> : 'Send OTP'}
                  </button>
                </form>
              </>
            ) : (
              <>
                <button className="back-btn" onClick={() => { setOtpStep(false); setOtp(['', '', '', '', '', '']); clearError(); setPhoneSuccess(''); }}>
                  ← Back
                </button>
                <div className="phone-step">
                  <span className="phone-step-text"><span className="step-num">2</span> Enter verification code</span>
                </div>
                {phoneSuccess && <div className="auth-success">{phoneSuccess}</div>}
                <form className="login-form" onSubmit={handleVerifyOtp}>
                  <div className="otp-inputs">
                    {otp.map((digit, i) => (
                      <input key={i} type="text" maxLength={1} className="otp-input" value={digit} onChange={(e) => handleOtpChange(i, e.target.value)} onKeyDown={(e) => handleOtpKeyDown(i, e)} ref={(el) => (otpRefs.current[i] = el)} inputMode="numeric" />
                    ))}
                  </div>
                  <button type="submit" className="submit-btn" disabled={loading || otp.some((d) => !d)}>
                    {loading ? <span className="btn-spinner"></span> : 'Verify & Sign In'}
                  </button>
                </form>
              </>
            )}
          </div>
        )}

        {/* reCAPTCHA container (invisible) */}
        <div id="recaptcha-container"></div>
      </div>
    </div>
  );
}

export default Login;
