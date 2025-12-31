// ============================================
// FILE: src/App.jsx (FIXED - NO AUTH LOOP)
// ============================================
import React, { useState, useEffect, useCallback, useRef } from "react";
import "./index.css";
import { initialFormData } from "./data";
import { auth, db } from "./firebaseConfig";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";

import LandingPage from "./Components/LandingPage";
import SignUpView from "./Components/SignUpView";
import LoginView from "./Components/LoginView";
import OnboardingView from "./Components/OnboardingView";
import ProfileView from "./Components/ProfileView";
import PrivacyNoticeView from "./Components/PrivacyNoticeView";
import ThemeToggle from "./Components/ThemeToggle";
import PortalDashboard from "./Components/PortalDashboard";
import PublicCardView from "./Components/PublicCardView";

const App = () => {
  const [currentView, setCurrentView] = useState('landing');
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState(localStorage.getItem('app-theme') || 'dark');
  const [formData, setFormData] = useState({ ...initialFormData, themeColor: '' });
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [bannerPreview, setBannerPreview] = useState(null);
  const [currentCardSlug, setCurrentCardSlug] = useState(null);
  
  // Use ref to prevent multiple auth state changes
  const authInitialized = useRef(false);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('app-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prevTheme) => (prevTheme === 'light' ? 'dark' : 'light'));
  };

  const updateURL = useCallback((path) => {
    window.history.pushState({}, '', path);
  }, []);

  const loadUserDataInstantly = useCallback((user) => {
    if (!user) return;
    
    console.time('⚡ loadUserData');
    
    // INSTANT: Load from localStorage
    const localProfile = localStorage.getItem(`profile_${user.uid}`);
    if (localProfile) {
      try {
        const userData = JSON.parse(localProfile);
        setFormData(prev => ({ ...prev, ...userData }));
        if (userData.avatarUrl) setAvatarPreview(userData.avatarUrl);
        if (userData.bannerUrl) setBannerPreview(userData.bannerUrl);
        if (userData.cardSlug) setCurrentCardSlug(userData.cardSlug);
        console.log('✅ Loaded from localStorage');
        console.timeEnd('⚡ loadUserData');
      } catch (e) {
        console.log('❌ Error parsing localStorage');
      }
    }
    
    // Background sync (non-blocking)
    setTimeout(() => {
      syncWithFirestore(user);
    }, 500);
  }, []);

  const syncWithFirestore = async (user) => {
    if (!user) return;
    
    try {
      console.log('🔄 Background Firestore sync...');
      const userDocRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userDocRef);
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        setFormData(prev => ({ ...prev, ...userData }));
        if (userData.avatarUrl) setAvatarPreview(userData.avatarUrl);
        if (userData.bannerUrl) setBannerPreview(userData.bannerUrl);
        if (userData.cardSlug) setCurrentCardSlug(userData.cardSlug);
        
        localStorage.setItem(`profile_${user.uid}`, JSON.stringify(userData));
        console.log('✅ Firestore sync complete');
      }
    } catch (error) {
      console.log('❌ Firestore sync failed (using local data)');
    }
  };

  // Check URL on initial load (BEFORE auth check)
  useEffect(() => {
    const path = window.location.pathname;
    
    if (path.startsWith('/card/')) {
      const slug = path.replace('/card/', '');
      console.log('🔗 Public card detected:', slug);
      setCurrentCardSlug(slug);
      setCurrentView('public-card');
      setLoading(false); // No need to wait for auth
    }
  }, []);

  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname;
      
      if (path.startsWith('/card/')) {
        const slug = path.replace('/card/', '');
        setCurrentCardSlug(slug);
        setCurrentView('public-card');
      } else if (path === '/portal' || path === '/dashboard') {
        if (currentUser) {
          setCurrentView('portal');
        } else {
          setCurrentView('login');
        }
      } else if (path === '/login') {
        setCurrentView('login');
      } else if (path === '/signup') {
        setCurrentView('signup');
      } else if (path === '/') {
        setCurrentView(currentUser ? 'profile' : 'landing');
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [currentUser]);

  // ✅ FIX: Auth state listener with proper cleanup
  useEffect(() => {
    // Skip if already initialized or viewing public card
    if (authInitialized.current || currentView === 'public-card') {
      return;
    }

    console.time('🔐 Auth check');
    
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      console.timeEnd('🔐 Auth check');
      console.log('👤 User:', user ? user.uid : 'none');
      
      // Mark as initialized
      authInitialized.current = true;
      
      setCurrentUser(user);
      setLoading(false); // ✅ IMMEDIATE - Don't wait for anything
      
      if (user) {
        // Load data without blocking
        loadUserDataInstantly(user);
        
        const hasCompletedOnboarding = localStorage.getItem(`onboarding_${user.uid}`);
        const path = window.location.pathname;
        
        console.log('📍 Path:', path);
        console.log('✅ Onboarding:', hasCompletedOnboarding ? 'Complete' : 'Pending');
        
        // ✅ Don't override if viewing public card
        if (path.startsWith('/card/')) {
          console.log('🔗 Staying on public card view');
          return;
        }
        
        if (path === '/portal' || path === '/dashboard') {
          console.log('→ Showing portal');
          setCurrentView('portal');
        } else if (hasCompletedOnboarding) {
          console.log('→ Showing profile');
          setCurrentView('profile');
        } else {
          console.log('→ Showing onboarding');
          setCurrentView('onboarding');
        }
      } else {
        // User not logged in
        const path = window.location.pathname;
        
        // ✅ Allow public card view without login
        if (path.startsWith('/card/')) {
          console.log('🔗 Public card - no login required');
          return;
        }
        
        console.log('→ Showing landing');
        setCurrentView('landing');
        updateURL('/');
      }
    });

    return () => {
      unsubscribe();
    };
  }, []); // ✅ Empty dependency array - run once only

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

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    
    if (currentUser) {
      console.log('💾 Saving profile...');
      
      // Save locally first
      localStorage.setItem(`onboarding_${currentUser.uid}`, 'completed');
      localStorage.setItem(`profile_${currentUser.uid}`, JSON.stringify(formData));
      
      // Navigate immediately
      setCurrentView('profile');
      updateURL('/profile');
      
      console.log('✅ Profile saved locally, navigating...');
      
      // Save to Firestore in background
      setTimeout(async () => {
        try {
          const userDocRef = doc(db, 'users', currentUser.uid);
          await setDoc(userDocRef, {
            ...formData,
            userId: currentUser.uid,
            email: currentUser.email,
            cardStatus: 'Draft',
            createdAt: new Date().toISOString(),
            lastUpdated: new Date().toISOString()
          }, { merge: true });
          console.log('✅ Synced to Firestore');
        } catch (error) {
          console.log('❌ Firestore save failed (data stored locally)');
        }
      }, 100);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setFormData({ ...initialFormData, themeColor: '' });
      setAvatarPreview(null);
      setBannerPreview(null);
      setCurrentView('landing');
      updateURL('/');
      // Reset auth initialized flag
      authInitialized.current = false;
    } catch (error) {
      console.error("Error signing out:", error);
      alert("Failed to log out. Please try again.");
    }
  };

  const navigateToPortal = () => {
    console.log('📍 Navigating to portal...');
    setCurrentView('portal');
    updateURL('/portal');
  };

  // Minimal loading - only show on initial page load
  if (loading && currentView === 'landing') {
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
          onGetStarted={() => {
            setCurrentView('signup');
            updateURL('/signup');
          }} 
          onLogin={() => {
            setCurrentView('login');
            updateURL('/login');
          }} 
        />
      )}

      {currentView === 'signup' && (
        <SignUpView 
          formData={formData} 
          handleChange={handleChange} 
          onNext={() => setCurrentView('onboarding')} 
          onSwitchToLogin={() => {
            setCurrentView('login');
            updateURL('/login');
          }}
        />
      )}

      {currentView === 'login' && (
        <LoginView 
          formData={formData} 
          handleChange={handleChange} 
          onLogin={() => {
            const hasOnboarding = localStorage.getItem(`onboarding_${currentUser?.uid}`);
            if (hasOnboarding) {
              navigateToPortal();
            } else {
              setCurrentView('onboarding');
            }
          }} 
          onSwitchToSignUp={() => {
            setCurrentView('signup');
            updateURL('/signup');
          }}
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
          onPortalClick={navigateToPortal}
          currentUser={currentUser}
        />
      )}

      {currentView === 'portal' && (
        <PortalDashboard 
          currentUser={currentUser}
          formData={formData}
          onEditProfile={() => setCurrentView('onboarding')}
          onLogout={handleLogout}
        />
      )}

      {currentView === 'privacy' && (
        <PrivacyNoticeView 
          onBack={() => setCurrentView('profile')} 
        />
      )}

      {currentView === 'public-card' && currentCardSlug && (
        <PublicCardView cardSlug={currentCardSlug} />
      )}
    </div>
  );
};

export default App;