// ============================================
// FILE: src/components/SignUpView.jsx
// ============================================
import React, { useState } from 'react';
import GlassInput from './GlassInput';
import { Icons } from './Icons';
import { auth, googleProvider } from '../firebaseConfig';
import { createUserWithEmailAndPassword, signInWithPopup, updateProfile } from 'firebase/auth';

const SignUpView = ({ onNext, onSwitchToLogin, formData, handleChange }) => {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleEmailSignUp = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long.');
      setLoading(false);
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth, 
        formData.workEmail, 
        formData.password
      );
      
      await updateProfile(userCredential.user, {
        displayName: formData.fullName
      });

      onNext();
    } catch (err) {
      setError(getErrorMessage(err.code));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    setError('');
    setLoading(true);

    try {
      await signInWithPopup(auth, googleProvider);
      onNext();
    } catch (err) {
      setError(getErrorMessage(err.code));
    } finally {
      setLoading(false);
    }
  };

  const getErrorMessage = (code) => {
    switch (code) {
      case 'auth/email-already-in-use':
        return 'This email is already registered. Please log in.';
      case 'auth/invalid-email':
        return 'Invalid email address.';
      case 'auth/weak-password':
        return 'Password should be at least 6 characters.';
      case 'auth/popup-closed-by-user':
        return 'Sign-up popup was closed.';
      default:
        return 'Sign up failed. Please try again.';
    }
  };

  return (
    <div className="glass-card p-5 mx-auto fade-up" style={{ maxWidth: "500px", width: "100%" }}>
      <div className="text-center mb-5">
        <h2 className="display-6 fw-bold mb-2">Create Account</h2>
        <p className="text-muted small">Start building your professional profile.</p>
      </div>
      
      {error && (
        <div className="alert alert-danger py-2 mb-3" role="alert">
          {error}
        </div>
      )}

      <form onSubmit={handleEmailSignUp}>
        <GlassInput 
          id="fullName" 
          label="Full Name" 
          value={formData.fullName} 
          onChange={handleChange} 
          placeholder="Enter your name"
          required 
        />
        <GlassInput 
          id="workEmail" 
          label="Email Address" 
          value={formData.workEmail} 
          onChange={handleChange} 
          type="email" 
          placeholder="arshad@example.com"
          required 
        />
        <GlassInput 
          id="password" 
          label="Password" 
          type="password" 
          placeholder="••••••••" 
          required 
          onChange={handleChange} 
          value={formData.password || ""} 
        />
        <p className="text-muted small mt-1">Password must be at least 6 characters.</p>
        
        <button 
          type="submit" 
          className="btn w-100 py-3 mt-4 fw-bold text-uppercase"
          style={{ letterSpacing: '1px' }}
          disabled={loading}
        >
          {loading ? 'Creating Account...' : 'Create Account'} <Icons.ArrowRight />
        </button>
      </form>

      <div className="position-relative my-4">
        <hr className="my-4" />
        <span 
          className="position-absolute top-50 start-50 translate-middle px-3 text-muted small"
          style={{ background: 'var(--glass-bg)' }}
        >
          OR
        </span>
      </div>

      <button 
        onClick={handleGoogleSignUp}
        className="btn btn-outline-light w-100 py-3 fw-bold d-flex align-items-center justify-content-center gap-2"
        disabled={loading}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
        </svg>
        Continue with Google
      </button>
      
      <p className="text-center mt-4 text-muted small">
        Already have an account? 
        <span 
          onClick={onSwitchToLogin} 
          style={{ cursor: 'pointer', color: 'var(--accent)' }} 
          className="text-decoration-none fw-bold ms-1"
        >
          Log in
        </span>
      </p>
    </div>
  );
};

export default SignUpView;