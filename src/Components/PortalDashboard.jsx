// ============================================
// FILE: src/Components/PortalDashboard.jsx (FULLY INTEGRATED)
// ============================================
import React, { useState, useEffect, useCallback } from 'react';
import { Icons } from './Icons';
import { db } from '../firebaseConfig';
import { doc, getDoc, updateDoc, setDoc } from 'firebase/firestore';

// Import wallet integrations
import { 
  addToGoogleWallet, 
  addToAppleWallet, 
  addToSamsungWallet 
} from '../utils/walletIntegration';

const PortalDashboard = ({ currentUser, onEditProfile, onLogout, formData }) => {
  const [cardStatus, setCardStatus] = useState('Draft');
  const [isLoading, setIsLoading] = useState(true);
  const [cardSlug, setCardSlug] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const [showCopyFeedback, setShowCopyFeedback] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [isGeneratingWallet, setIsGeneratingWallet] = useState(false);
  const [walletMessage, setWalletMessage] = useState('');
  const [showWalletModal, setShowWalletModal] = useState(false);

  const portalUrl = `${window.location.origin}/portal/${currentUser?.uid || ''}`;
  const publicCardUrl = cardSlug ? `${window.location.origin}/card/${cardSlug}` : null;

  const generateSlug = useCallback((name) => {
    if (!currentUser) return '';
    const cleanName = name || 'user';
    return cleanName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '') + '-' + currentUser.uid.slice(0, 6);
  }, [currentUser]);

  const loadUserCardData = useCallback(async () => {
    if (!currentUser) return;
    
    setIsLoading(true);
    try {
      const userDocRef = doc(db, 'users', currentUser.uid);
      const userDoc = await getDoc(userDocRef);
      
      if (userDoc.exists()) {
        const data = userDoc.data();
        setCardStatus(data.cardStatus || 'Draft');
        setCardSlug(data.cardSlug || generateSlug(data.fullName || currentUser.email));
        
        localStorage.setItem(`card_data_${currentUser.uid}`, JSON.stringify({
          cardStatus: data.cardStatus || 'Draft',
          cardSlug: data.cardSlug || generateSlug(data.fullName || currentUser.email)
        }));
        
        localStorage.setItem(`profile_${currentUser.uid}`, JSON.stringify(data));
        setIsOffline(false);
      } else {
        const newSlug = generateSlug(formData.fullName || currentUser.email);
        setCardSlug(newSlug);
        
        try {
          await setDoc(userDocRef, {
            ...formData,
            cardStatus: 'Draft',
            cardSlug: newSlug,
            userId: currentUser.uid,
            email: currentUser.email,
            createdAt: new Date().toISOString()
          });
          
          localStorage.setItem(`profile_${currentUser.uid}`, JSON.stringify(formData));
        } catch {
          setIsOffline(true);
        }
      }
    } catch {
      setIsOffline(true);
      
      const localData = localStorage.getItem(`card_data_${currentUser.uid}`);
      if (localData) {
        const parsed = JSON.parse(localData);
        setCardStatus(parsed.cardStatus || 'Draft');
        setCardSlug(parsed.cardSlug || generateSlug(formData.fullName || currentUser.email));
      } else {
        const newSlug = generateSlug(formData.fullName || currentUser.email);
        setCardSlug(newSlug);
        localStorage.setItem(`card_data_${currentUser.uid}`, JSON.stringify({
          cardStatus: 'Draft',
          cardSlug: newSlug
        }));
      }
      
      localStorage.setItem(`profile_${currentUser.uid}`, JSON.stringify(formData));
    } finally {
      setIsLoading(false);
    }
  }, [currentUser, formData, generateSlug]);

  useEffect(() => {
    loadUserCardData();
  }, [loadUserCardData]);

  const handlePublishToggle = () => {
    if (!currentUser) return;
    
    const newStatus = cardStatus === 'Published' ? 'Draft' : 'Published';
    
    setCardStatus(newStatus);
    setIsSaving(true);
    
    localStorage.setItem(`card_data_${currentUser.uid}`, JSON.stringify({
      cardStatus: newStatus,
      cardSlug: cardSlug
    }));
    
    if (newStatus === 'Published') {
      localStorage.setItem(`profile_${currentUser.uid}`, JSON.stringify(formData));
    }
    
    setTimeout(async () => {
      try {
        const userDocRef = doc(db, 'users', currentUser.uid);
        const dataToSave = {
          ...formData,
          cardStatus: newStatus,
          cardSlug: cardSlug,
          userId: currentUser.uid,
          email: currentUser.email,
          lastUpdated: new Date().toISOString()
        };
        
        await updateDoc(userDocRef, dataToSave);
        setIsOffline(false);
      } catch (error) {
        setIsOffline(true);
      } finally {
        setIsSaving(false);
      }
    }, 100);
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setShowCopyFeedback(true);
    setTimeout(() => setShowCopyFeedback(false), 2000);
  };

  const generateQRCode = () => {
    if (!publicCardUrl) {
      alert('Please publish your card first to generate QR code');
      return;
    }
    
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(publicCardUrl)}`;
    setQrCodeUrl(qrUrl);
    setShowQRModal(true);
  };

  const downloadQRCode = () => {
    const link = document.createElement('a');
    link.href = qrCodeUrl;
    link.download = `${formData.fullName || 'business-card'}-qr.png`;
    link.click();
  };

  // Wallet integration handlers
  const handleGoogleWallet = async () => {
    if (!publicCardUrl) {
      alert('Please publish your card first');
      return;
    }
    
    setIsGeneratingWallet(true);
    
    try {
      const result = await addToGoogleWallet(formData, publicCardUrl);
      // Google Wallet opens automatically, show confirmation
      setTimeout(() => {
        setWalletMessage(result.message);
        setShowWalletModal(true);
      }, 500);
    } catch (error) {
      alert('Error: ' + error.message);
    } finally {
      setIsGeneratingWallet(false);
    }
  };

  const handleAppleWallet = async () => {
    if (!publicCardUrl) {
      alert('Please publish your card first');
      return;
    }
    
    setIsGeneratingWallet(true);
    
    try {
      const result = await addToAppleWallet(formData, publicCardUrl);
      setWalletMessage(result.message);
      setShowWalletModal(true);
    } catch (error) {
      alert('Error: ' + error.message);
    } finally {
      setIsGeneratingWallet(false);
    }
  };

  const handleSamsungWallet = async () => {
    if (!publicCardUrl) {
      alert('Please publish your card first');
      return;
    }
    
    setIsGeneratingWallet(true);
    
    try {
      const result = await addToSamsungWallet(formData, publicCardUrl);
      setWalletMessage(result.message);
      setShowWalletModal(true);
    } catch (error) {
      alert('Error: ' + error.message);
    } finally {
      setIsGeneratingWallet(false);
    }
  };

  if (isLoading) {
    return (
      <div className="glass-card p-5 text-center" style={{ maxWidth: "1100px", width: "100%" }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="glass-card rounded-4 w-100 overflow-hidden position-relative z-1 fade-up" style={{ maxWidth: "1100px" }}>
        
        {/* Header */}
        <div className="p-4 border-bottom border-secondary border-opacity-10" 
             style={{
               background: 'linear-gradient(135deg, #0d1117 0%, #1a1f2e 100%)',
               borderBottom: '1px solid rgba(45, 212, 191, 0.2)'
             }}>
          <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
            <div>
              <h2 className="fw-bold mb-1" style={{color: '#2dd4bf'}}>
                <span style={{fontSize: '1.5rem'}}>🎛️</span> Card Management Portal
              </h2>
              <p className="text-muted small mb-0">Manage your digital business card</p>
            </div>
            <button 
              onClick={onLogout} 
              className="btn btn-outline-danger d-flex align-items-center gap-2 px-4"
              style={{
                borderRadius: '8px',
                fontWeight: '600',
                transition: 'all 0.3s ease'
              }}
            >
              <Icons.Login /> Logout
            </button>
          </div>
        </div>

        <div className="row g-0">
          {/* Left Column */}
          <div className="col-lg-7 p-4 p-lg-5 border-end border-secondary border-opacity-10">
            
            {/* Card Status Section */}
            <div className="mb-5">
              <div className="d-flex align-items-center justify-content-between mb-3">
                <h5 className="section-title mb-0">CARD STATUS</h5>
                {isSaving && (
                  <span className="badge bg-warning text-dark px-3 py-2" style={{fontSize: '0.75rem'}}>
                    ⏳ Syncing...
                  </span>
                )}
              </div>
              
              <div className={`status-badge-modern ${cardStatus.toLowerCase()}`}>
                <div className="status-dot"></div>
                <span className="status-text">{cardStatus}</span>
                <span className="status-icon">{cardStatus === 'Published' ? '🌐' : '📝'}</span>
              </div>
              
              <div className="mt-3 p-3 rounded-3" 
                   style={{
                     background: cardStatus === 'Published' 
                       ? 'rgba(34, 197, 94, 0.1)' 
                       : 'rgba(156, 163, 175, 0.1)',
                     border: `1px solid ${cardStatus === 'Published' ? 'rgba(34, 197, 94, 0.3)' : 'rgba(156, 163, 175, 0.3)'}`
                   }}>
                {cardStatus === 'Draft' ? (
                  <p className="text-muted small mb-0">
                    <strong>🔒 Draft Mode:</strong> Your card is private. Click "Publish" to make it accessible via public link.
                  </p>
                ) : (
                  <p className="text-success small mb-0">
                    <strong>✓ Live:</strong> Your card is published and accessible to anyone with the link.
                  </p>
                )}
              </div>
            </div>

            {/* User Information */}
            <div className="mb-5">
              <h5 className="section-title mb-3">CARD OWNER</h5>
              <div className="modern-info-card p-4 rounded-3 mb-3">
                <div className="d-flex align-items-center gap-3 mb-3">
                  <div className="info-icon-modern"><Icons.User /></div>
                  <div className="flex-grow-1">
                    <div className="value-text-modern">{formData.fullName || 'Not set'}</div>
                    <div className="label-text-modern">
                      {formData.jobTitle || 'No title'} {formData.companyName && `@ ${formData.companyName}`}
                    </div>
                  </div>
                </div>
                <div className="d-flex align-items-center gap-3">
                  <div className="info-icon-modern"><Icons.Mail /></div>
                  <div className="flex-grow-1">
                    <div className="value-text-modern">{currentUser?.email}</div>
                    <div className="label-text-modern">Account Email</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div>
              <h5 className="section-title mb-3">ACTIONS</h5>
              <button 
                onClick={onEditProfile}
                className="btn-modern btn-edit w-100 mb-3"
              >
                <Icons.User /> Edit Profile Details
              </button>
              
              <button 
                onClick={handlePublishToggle}
                className={`btn-modern ${cardStatus === 'Published' ? 'btn-unpublish' : 'btn-publish'} w-100`}
              >
                {cardStatus === 'Published' ? (
                  <>📋 Unpublish Card</>
                ) : (
                  <>🚀 Publish Card</>
                )}
              </button>
            </div>
          </div>

          {/* Right Column */}
          <div className="col-lg-5 p-4 p-lg-5" style={{background: 'rgba(13, 17, 23, 0.5)'}}>
            
            <h5 className="section-title mb-4">⚡ QUICK SHORTCUTS</h5>
            
            {/* Wallet Actions */}
            <div className="mb-4">
              <h6 className="text-muted small mb-3 text-uppercase" style={{fontSize: '0.7rem', letterSpacing: '1px'}}>
                💳 Wallet Actions
              </h6>
              <div className="d-grid gap-2">
                <button 
                  onClick={handleAppleWallet}
                  className="wallet-btn apple-wallet"
                  disabled={cardStatus !== 'Published' || isGeneratingWallet}
                >
                  <span className="wallet-icon">🍎</span>
                  <span className="wallet-text">
                    {isGeneratingWallet ? 'Generating...' : 'Add to Apple Wallet'}
                  </span>
                  <span className="wallet-arrow">→</span>
                </button>
                
                <button 
                  onClick={handleGoogleWallet}
                  className="wallet-btn google-wallet"
                  disabled={cardStatus !== 'Published' || isGeneratingWallet}
                >
                  <span className="wallet-icon">📱</span>
                  <span className="wallet-text">
                    {isGeneratingWallet ? 'Generating...' : 'Add to Google Wallet'}
                  </span>
                  <span className="wallet-arrow">→</span>
                </button>
                
                <button 
                  onClick={handleSamsungWallet}
                  className="wallet-btn samsung-wallet"
                  disabled={cardStatus !== 'Published' || isGeneratingWallet}
                >
                  <span className="wallet-icon">📲</span>
                  <span className="wallet-text">
                    {isGeneratingWallet ? 'Generating...' : 'Add to Samsung Wallet'}
                  </span>
                  <span className="wallet-arrow">→</span>
                </button>
              </div>
            </div>

            {/* QR Code */}
            <div className="mb-4">
              <h6 className="text-muted small mb-3 text-uppercase" style={{fontSize: '0.7rem', letterSpacing: '1px'}}>
                📸 Quick Share
              </h6>
              <button 
                onClick={generateQRCode}
                className="wallet-btn qr-btn"
                disabled={cardStatus !== 'Published'}
              >
                <span className="wallet-icon">📱</span>
                <span className="wallet-text">Generate QR Code</span>
                <span className="wallet-arrow">→</span>
              </button>
            </div>

            {/* Portal URL */}
            <div className="mb-4">
              <h6 className="text-muted small mb-3 text-uppercase" style={{fontSize: '0.7rem', letterSpacing: '1px'}}>
                🔐 Private Access
              </h6>
              <div className="url-card">
                <div className="url-card-header">
                  <span className="url-label">Portal Dashboard</span>
                </div>
                <div className="url-input-group">
                  <input 
                    type="text" 
                    value={portalUrl} 
                    readOnly 
                    className="url-input"
                  />
                  <button 
                    onClick={() => copyToClipboard(portalUrl)}
                    className="url-copy-btn"
                    title="Copy portal link"
                  >
                    {showCopyFeedback ? '✓' : '📋'}
                  </button>
                </div>
              </div>
            </div>

            {/* Public Card URL */}
            {cardStatus === 'Published' && publicCardUrl ? (
              <div className="mb-4">
                <h6 className="text-muted small mb-3 text-uppercase" style={{fontSize: '0.7rem', letterSpacing: '1px'}}>
                  🌐 Public Access
                </h6>
                <div className="url-card url-card-published">
                  <div className="url-card-header">
                    <span className="url-label">Public Card URL (Live)</span>
                  </div>
                  <div className="url-input-group">
                    <input 
                      type="text" 
                      value={publicCardUrl} 
                      readOnly 
                      className="url-input"
                    />
                    <button 
                      onClick={() => copyToClipboard(publicCardUrl)}
                      className="url-copy-btn url-copy-btn-success"
                      title="Copy public link"
                    >
                      {showCopyFeedback ? '✓' : '📋'}
                    </button>
                  </div>
                  <a 
                    href={publicCardUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="btn-view-card"
                  >
                    🔗 View Public Card →
                  </a>
                </div>
              </div>
            ) : (
              <div className="alert-card">
                <span className="alert-icon">📌</span>
                <div>
                  <strong>Need a public link?</strong>
                  <p className="mb-0 small">Publish your card to unlock wallet actions and public URL</p>
                </div>
              </div>
            )}

            {showCopyFeedback && (
              <div className="copy-feedback">
                ✓ Link copied to clipboard!
              </div>
            )}

            {/* Quick Stats */}
            <div className="stats-card mt-4">
              <h6 className="section-title mb-3">QUICK STATS</h6>
              <div className="stat-row">
                <span className="stat-label">Card ID</span>
                <span className="stat-value">{currentUser?.uid.slice(0, 8)}...</span>
              </div>
              <div className="stat-row">
                <span className="stat-label">Created</span>
                <span className="stat-value">{new Date(currentUser?.metadata.creationTime).toLocaleDateString()}</span>
              </div>
              <div className="stat-row">
                <span className="stat-label">Status</span>
                <span className={`stat-badge ${cardStatus === 'Published' ? 'stat-badge-success' : 'stat-badge-secondary'}`}>
                  {cardStatus}
                </span>
              </div>
              <div className="stat-row">
                <span className="stat-label">Connection</span>
                <span className={`stat-badge ${isOffline ? 'stat-badge-warning' : 'stat-badge-success'}`}>
                  {isOffline ? '📴 Offline' : '✓ Online'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* QR Code Modal */}
      {showQRModal && (
        <div 
          className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center" 
          style={{ 
            background: 'rgba(0,0,0,0.8)', 
            zIndex: 9999,
            backdropFilter: 'blur(5px)'
          }}
          onClick={() => setShowQRModal(false)}
        >
          <div 
            className="glass-card p-5 text-center" 
            style={{ maxWidth: '400px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <h4 className="mb-4">📱 Your QR Code</h4>
            <div className="mb-4 p-3 bg-white rounded-3">
              <img src={qrCodeUrl} alt="QR Code" className="w-100" />
            </div>
            <p className="text-muted small mb-4">Scan this code to visit your public card</p>
            <div className="d-flex gap-2">
              <button 
                onClick={downloadQRCode}
                className="btn btn-primary flex-grow-1"
              >
                💾 Download
              </button>
              <button 
                onClick={() => setShowQRModal(false)}
                className="btn btn-secondary flex-grow-1"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Wallet Instructions Modal */}
      {showWalletModal && (
        <div 
          className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center p-3" 
          style={{ 
            background: 'rgba(0,0,0,0.85)', 
            zIndex: 9999,
            backdropFilter: 'blur(8px)'
          }}
          onClick={() => setShowWalletModal(false)}
        >
          <div 
            className="glass-card p-4 p-md-5" 
            style={{ maxWidth: '600px', maxHeight: '80vh', overflowY: 'auto' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="d-flex justify-content-between align-items-start mb-4">
              <h4 className="mb-0">📱 Wallet Integration</h4>
              <button 
                onClick={() => setShowWalletModal(false)}
                className="btn-close btn-close-white"
                aria-label="Close"
              ></button>
            </div>
            <pre style={{
              whiteSpace: 'pre-wrap',
              wordWrap: 'break-word',
              background: 'rgba(0,0,0,0.3)',
              padding: '1rem',
              borderRadius: '8px',
              fontSize: '0.9rem',
              lineHeight: '1.6'
            }}>
              {walletMessage}
            </pre>
            <button 
              onClick={() => setShowWalletModal(false)}
              className="btn btn-primary w-100 mt-3"
            >
              Got it!
            </button>
          </div>
        </div>
      )}

      <style>{`
        .wallet-btn {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 14px 18px;
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 8px;
          background: rgba(255,255,255,0.05);
          color: #fff;
          font-weight: 500;
          transition: all 0.3s ease;
          cursor: pointer;
        }

        .wallet-btn:not(:disabled):hover {
          background: rgba(255,255,255,0.1);
          transform: translateY(-2px);
          border-color: rgba(255,255,255,0.2);
        }

        .wallet-btn:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }

        .wallet-icon {
          font-size: 1.3rem;
        }

        .wallet-text {
          flex-grow: 1;
          text-align: left;
        }

        .wallet-arrow {
          opacity: 0.5;
          transition: all 0.3s ease;
        }

        .wallet-btn:not(:disabled):hover .wallet-arrow {
          opacity: 1;
          transform: translateX(4px);
        }

        .apple-wallet:not(:disabled) {
          border-color: rgba(0, 122, 255, 0.3);
        }

        .apple-wallet:not(:disabled):hover {
          background: rgba(0, 122, 255, 0.1);
          border-color: rgba(0, 122, 255, 0.5);
        }

        .google-wallet:not(:disabled) {
          border-color: rgba(66, 133, 244, 0.3);
        }

        .google-wallet:not(:disabled):hover {
          background: rgba(66, 133, 244, 0.1);
          border-color: rgba(66, 133, 244, 0.5);
        }

        .samsung-wallet:not(:disabled) {
          border-color: rgba(20, 122, 255, 0.3);
        }

        .samsung-wallet:not(:disabled):hover {
          background: rgba(20, 122, 255, 0.1);
          border-color: rgba(20, 122, 255, 0.5);
        }

        .qr-btn:not(:disabled) {
          border-color: rgba(45, 212, 191, 0.3);
        }

        .qr-btn:not(:disabled):hover {
          background: rgba(45, 212, 191, 0.1);
          border-color: rgba(45, 212, 191, 0.5);
        }
      `}</style>
    </>
  );
};

export default PortalDashboard;