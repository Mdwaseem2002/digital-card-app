// ============================================
// FILE: src/App.jsx
// ============================================
import React, { useState, useEffect } from "react";
import "./index.css";
import { initialFormData } from "./data";
import { auth } from "./firebaseConfig";
import { onAuthStateChanged, signOut } from "firebase/auth";

// Import Components
import LandingPage from "./components/LandingPage";
import SignUpView from "./components/SignUpView";
import LoginView from "./components/LoginView";
import OnboardingView from "./components/OnboardingView";
import ProfileView from "./components/ProfileView";
import PrivacyNoticeView from "./components/PrivacyNoticeView";
import ThemeToggle from "./components/ThemeToggle";

const App = () => {
  const [currentView, setCurrentView] = useState('landing');
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Theme Logic
  const [theme, setTheme] = useState(localStorage.getItem('app-theme') || 'dark');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('app-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prevTheme) => (prevTheme === 'light' ? 'dark' : 'light'));
  };

  // Auth State Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoading(false);
      
      if (user) {
        // User is signed in, check if they have completed onboarding
        const hasCompletedOnboarding = localStorage.getItem(`onboarding_${user.uid}`);
        if (hasCompletedOnboarding) {
          setCurrentView('profile');
        } else {
          setCurrentView('onboarding');
        }
      } else {
        // User is signed out
        setCurrentView('landing');
      }
    });

    return () => unsubscribe();
  }, []);

  const [formData, setFormData] = useState({
    ...initialFormData,
    themeColor: '' 
  });
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [bannerPreview, setBannerPreview] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAvatarPreview(URL.createObjectURL(file));
      setFormData(prev => ({ ...prev, avatar: file }));
    }
  };

  const handleBannerUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setBannerPreview(URL.createObjectURL(file));
      setFormData(prev => ({ ...prev, themeColor: '' }));
    }
  };

  const handleThemeColorSelect = (color) => {
    setFormData(prev => ({ ...prev, themeColor: color }));
    setBannerPreview(null);
  };

  const handleProfileSubmit = (e) => {
    e.preventDefault();
    if (currentUser) {
      localStorage.setItem(`onboarding_${currentUser.uid}`, 'completed');
    }
    setCurrentView('profile');
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setFormData({ ...initialFormData, themeColor: '' });
      setAvatarPreview(null);
      setBannerPreview(null);
      setCurrentView('landing');
    } catch (error) {
      console.error("Error signing out:", error);
      alert("Failed to log out. Please try again.");
    }
  };

  if (loading) {
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center p-3 p-md-5 position-relative overflow-hidden">
      
      <ThemeToggle theme={theme} toggleTheme={toggleTheme} />

      <div className="noise-overlay"></div>
      
      {currentView === 'landing' && (
        <LandingPage 
          onGetStarted={() => setCurrentView('signup')} 
          onLogin={() => setCurrentView('login')} 
        />
      )}

      {currentView === 'signup' && (
        <SignUpView 
          formData={formData} 
          handleChange={handleChange} 
          onNext={() => setCurrentView('onboarding')} 
          onSwitchToLogin={() => setCurrentView('login')}
        />
      )}

      {currentView === 'login' && (
        <LoginView 
          formData={formData} 
          handleChange={handleChange} 
          onLogin={() => setCurrentView('profile')} 
          onSwitchToSignUp={() => setCurrentView('signup')}
        />
      )}

      {currentView === 'onboarding' && (
        <OnboardingView 
          formData={formData} 
          handleChange={handleChange}
          handleImageChange={handleImageChange}
          avatarPreview={avatarPreview}
          handleBannerUpload={handleBannerUpload}
          handleThemeColorSelect={handleThemeColorSelect}
          bannerPreview={bannerPreview}
          onSubmit={handleProfileSubmit}
        />
      )}

      {currentView === 'profile' && (
        <ProfileView 
          formData={formData}
          avatarPreview={avatarPreview}
          bannerPreview={bannerPreview}
          onEdit={() => setCurrentView('onboarding')}
          onLogout={handleLogout}
          onPrivacyClick={() => setCurrentView('privacy')}
          currentUser={currentUser}
        />
      )}

      {currentView === 'privacy' && (
        <PrivacyNoticeView 
          onBack={() => setCurrentView('profile')} 
        />
      )}
    </div>
  );
};

export default App;
