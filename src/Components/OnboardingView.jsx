//src\Components\OnboardingView.jsx
import React, { useState } from 'react';
import GlassInput from './GlassInput';
import AvatarUpload from './AvatarUpload';
import { Icons } from './Icons';

// 10 Professional Color Themes
const THEME_COLORS = [
  '#000000', // Default Black
  '#1e293b', // Slate Blue
  '#0f172a', // Midnight
  '#312e81', // Indigo
  '#4c0519', // Dark Rose
  '#064e3b', // Dark Emerald
  '#4a044e', // Dark Fuchsia
  '#7c2d12', // Dark Orange
  '#14532d', // Dark Green
  '#172554', // Dark Blue
];

const OnboardingView = ({ 
  formData, 
  handleChange, 
  handleImageChange, 
  avatarPreview, 
  handleBannerUpload, 
  handleThemeColorSelect,
  bannerPreview,
  onSubmit 
}) => {
  
  // State to manage Color Picker expansion
  const [isColorPickerOpen, setIsColorPickerOpen] = useState(false);

  return (
    <div className="glass-card rounded-4 w-100 overflow-hidden position-relative z-1 fade-up" style={{ maxWidth: "1000px" }}>
      <div className="row g-0">
        {/* Left Panel */}
        <div className="col-lg-4 p-5 d-none d-lg-flex flex-column justify-content-between position-relative"
             style={{ background: "#06080d", borderRight: "1px solid rgba(255,255,255,0.05)" }}>
          <div>
            <span className="badge mb-4">/// SETUP PROFILE</span>
            <h2 className="display-6 fw-bold text-white mb-4">Complete your<br/>Profile.</h2>
            <p className="text-muted lh-lg small">Welcome, {formData.fullName.split(' ')[0] || "User"}. Let's finish setting up your professional card details.</p>
          </div>
        </div>

        {/* Right Panel */}
        <div className="col-lg-8 p-4 p-md-5" style={{background: '#11151e'}}>
          <form onSubmit={onSubmit}>
            
            {/* --- 1. BANNER & AVATAR CUSTOMIZATION --- */}
            <h6 className="text-white border-bottom border-secondary border-opacity-25 pb-2 mb-4">Customize Profile Header</h6>
            
            <div className="mb-4">
               <AvatarUpload preview={avatarPreview} onImageChange={handleImageChange} />
            </div>

            <div className="mb-5">
              <label className="d-block mb-3 small fw-bold text-uppercase" style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.65rem" }}>
                Background Image or Theme Color
              </label>
              
              <div className="d-flex align-items-center gap-4 flex-wrap" style={{minHeight: '50px'}}>
                {/* Upload Button */}
                <div className="position-relative">
                  <input type="file" id="banner-upload" accept="image/*" onChange={handleBannerUpload} hidden />
                  <label htmlFor="banner-upload" className="btn btn-outline text-white d-flex align-items-center gap-2" style={{borderStyle:'dashed', opacity: 0.8, cursor:'pointer'}}>
                    <Icons.Camera /> Upload Banner
                  </label>
                </div>

                {/* --- ANIMATED COLOR PICKER --- */}
                <div className="d-flex align-items-center">
                  
                  {/* State 1: The Rainbow Wheel (Closed) */}
                  {!isColorPickerOpen && (
                    <div className="color-wheel-wrapper" onClick={() => setIsColorPickerOpen(true)}>
                      <div className="color-wheel-btn"></div>
                      <div className="color-tooltip">Select Color Banner</div>
                    </div>
                  )}

                  {/* State 2: The Expanded Colors (Open) */}
                  {isColorPickerOpen && (
                    <div className="d-flex gap-2 flex-wrap color-row-animation">
                      {THEME_COLORS.map((color, index) => (
                        <div 
                          key={color}
                          /* --- UPDATE HERE: Select Color AND Close Picker --- */
                          onClick={() => {
                            handleThemeColorSelect(color);
                            setIsColorPickerOpen(false); // This closes it back to the rainbow circle
                          }}
                          className="color-dot"
                          style={{
                            backgroundColor: color,
                            border: formData.themeColor === color ? '2px solid #2dd4bf' : '2px solid rgba(255,255,255,0.1)',
                            transform: formData.themeColor === color ? 'scale(1.2)' : 'scale(1)',
                            animationDelay: `${index * 0.05}s`
                          }}
                          title={color}
                        />
                      ))}
                      {/* Close button (X) */}
                      <div 
                        onClick={(e) => { e.stopPropagation(); setIsColorPickerOpen(false); }}
                        className="color-close-btn"
                        title="Close Colors"
                      >
                        ✕
                      </div>
                    </div>
                  )}
                </div>

              </div>
              
              {/* Feedback Text */}
              {bannerPreview && <p className="text-muted small mt-2"><span style={{color:'#2dd4bf'}}>✓</span> Custom banner image selected</p>}
              {!bannerPreview && formData.themeColor && <p className="text-muted small mt-2"><span style={{color:'#2dd4bf'}}>✓</span> Color theme selected</p>}
            
            </div>

            {/* --- 2. IDENTITY --- */}
            <h6 className="text-white border-bottom border-secondary border-opacity-25 pb-2 mb-4">Identity</h6>
            <div className="row">
              <div className="col-md-6"><GlassInput id="fullName" label="Full Name" value={formData.fullName} onChange={handleChange} placeholder="" /></div>
              <div className="col-md-6"><GlassInput id="companyName" label="Company Name" value={formData.companyName} onChange={handleChange} placeholder="" /></div>
              <div className="col-md-6"><GlassInput id="jobTitle" label="Job Title" value={formData.jobTitle} onChange={handleChange} placeholder="" /></div>
              <div className="col-12">
                 <label className="d-block mb-2 small fw-bold text-uppercase" style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.65rem" }}>About Me / Bio</label>
                 <textarea name="aboutMe" value={formData.aboutMe} onChange={handleChange} className="form-control glass-input py-3 px-3 text-white mb-4" rows="3" placeholder="Briefly describe your role..." style={{resize:'none'}}></textarea>
              </div>
            </div>

            {/* --- 3. CONTACT DETAILS --- */}
            <h6 className="text-white border-bottom border-secondary border-opacity-25 pb-2 mb-4 mt-2">Contact Details</h6>
            <div className="row">
              <div className="col-md-6"><GlassInput id="workPhone" label="Work Phone" value={formData.workPhone} onChange={handleChange} placeholder="+1 (555) 000-0000" /></div>
              <div className="col-md-6"><GlassInput id="website" label="Website URL" value={formData.website} onChange={handleChange} placeholder="https://" required={false} /></div>
              <div className="col-md-6"><GlassInput id="workEmail" label="Work Email" value={formData.workEmail} onChange={handleChange} type="email" placeholder="" /></div>
              <div className="col-md-6"><GlassInput id="personalEmail" label="Personal Email" value={formData.personalEmail} onChange={handleChange} type="email" placeholder="" required={false} /></div>
            </div>

            {/* --- 4. ADDRESS --- */}
            <h6 className="text-white border-bottom border-secondary border-opacity-25 pb-2 mb-4 mt-2">Address</h6>
            <div className="row">
              <div className="col-12"><GlassInput id="address" label="Street Address" value={formData.address} onChange={handleChange} placeholder="123 Tech Blvd" /></div>
              <div className="col-md-6"><GlassInput id="city" label="City" value={formData.city} onChange={handleChange} placeholder="Los Angeles" /></div>
              <div className="col-md-6"><GlassInput id="country" label="Country" value={formData.country} onChange={handleChange} placeholder="USA" /></div>
            </div>

            {/* --- 5. SOCIAL NETWORKS --- */}
            <h6 className="text-white border-bottom border-secondary border-opacity-25 pb-2 mb-4 mt-2">Social Networks</h6>
            <div className="row">
              <div className="col-md-6"><GlassInput id="linkedin" label="LinkedIn URL" value={formData.linkedin} onChange={handleChange} placeholder="linkedin.com/in/..." required={false} /></div>
              <div className="col-md-6"><GlassInput id="twitter" label="X / Twitter URL" value={formData.twitter} onChange={handleChange} placeholder="x.com/..." required={false} /></div>
              <div className="col-md-6"><GlassInput id="whatsapp" label="WhatsApp URL" value={formData.whatsapp} onChange={handleChange} placeholder="wa.me/..." required={false} /></div>
              <div className="col-md-6"><GlassInput id="facebook" label="Facebook URL" value={formData.facebook} onChange={handleChange} placeholder="facebook.com/..." required={false} /></div>
            </div>

            <div className="mt-5">
              <button type="submit" className="btn w-100 py-3 fw-bold text-dark text-uppercase"
                style={{ background: '#2dd4bf', border: 'none', letterSpacing: '1px' }}>
                Complete Profile
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default OnboardingView;