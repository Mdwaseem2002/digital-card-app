import React, { useState } from 'react';
import { Icons } from './Icons'; 

const LandingPage = ({ onGetStarted, onLogin }) => {
  const [email, setEmail] = useState('');

  return (
    <div className="landing-container fade-up position-relative">
      
      {/* --- 1. DESKTOP LOGIN BUTTON (Top Right) --- */}
      {/* Visible only on screens larger than 992px (d-lg-block) */}
      <div className="position-absolute top-0 end-0 mt-4 me-4 d-none d-lg-block" style={{ zIndex: 10 }}>
        <button onClick={onLogin} className="btn-login-ghost">
          LOGIN
        </button>
      </div>
      
      {/* --- 2. MOBILE LOGIN BUTTON (Top Left) --- */}
      {/* Visible only on mobile screens (d-lg-none) */}
      {/* UPDATED: text-start moves it to the LEFT side */}
      <div className="d-lg-none text-start p-3">
         <button onClick={onLogin} className="btn-login-ghost">LOGIN</button>
      </div>

      <div className="row align-items-center" style={{minHeight: '85vh'}}>
        
        {/* --- Left Column: Content --- */}
        <div className="col-lg-6 py-4 pe-lg-5 text-center text-lg-start">
          
          <h1 className="landing-title mb-3">
            Your Business Card,<br/>
            <span className="position-relative d-inline-block text-nowrap">
              Reimagined
              {/* Orange Brush Stroke SVG */}
              <svg className="brush-stroke" viewBox="0 0 200 9" preserveAspectRatio="none">
                <path d="M2.00025 7.00001C35.9189 4.38722 136.632 -1.45829 198.001 2.00001" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
              </svg>
            </span>
          </h1>
          
          {/* Mobile Image (Visible < 992px) */}
          <div className="d-block d-lg-none my-4">
            <img 
              src="/assets/landing-image.png" 
              alt="Digital Networking Hero" 
              className="img-fluid rounded-4 shadow-lg"
              style={{ maxHeight: '300px' }}
            />
          </div>
          
          <p className="landing-description lead mt-3 mb-4">
            Never run out of business cards again. Share your professional details instantly with a tap or scan—no printing, no waste, always up-to-date.
          </p>

          <div className="features-list mb-5">
            <span>Instant Sharing</span> • <span>Always Updated</span> • <span>Eco-Friendly</span> • <span>Mobile-Ready</span>
          </div>
          
          <p className="small text-muted mb-3">
            Create your digital business card in minutes. Modern networking starts here.
          </p>

          {/* Email Input Pill Wrapper */}
          <div className="email-pill-wrapper mx-auto mx-lg-0">
            <div className="icon-box">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
            </div>
            <input 
              type="email" 
              className="email-input-field"
              placeholder="Your email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <button onClick={() => onGetStarted(email)} className="btn-pill-action">
              Get Started
            </button>
          </div>

        </div>

        {/* --- Right Column: Image (Desktop Only) --- */}
        <div className="col-lg-6 d-none d-lg-block text-end position-relative">
          {/* Glow effect behind image */}
          <div className="image-glow"></div> 
          <img 
            src="/assets/landing-image.png" 
            alt="Digital Networking Hero" 
            className="img-fluid rounded-5 shadow-lg position-relative"
            style={{ maxHeight: '500px', width: 'auto', maxWidth: '100%', zIndex: 2 }}
          />
        </div>

      </div>
    </div>
  );
};

export default LandingPage;