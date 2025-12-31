// ============================================
// FILE: src/Components/PublicCardView.jsx (FIXED - DATA LOADING)
// ============================================
import React, { useState, useEffect, useRef } from 'react';
import { Icons } from './Icons';
import { db } from '../firebaseConfig';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';

const PublicCardView = ({ cardSlug }) => {
  const [cardData, setCardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showSticky, setShowSticky] = useState(true);
  const buttonsSectionRef = useRef(null);

  useEffect(() => {
    const currentRef = buttonsSectionRef.current;
    
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShowSticky(false);
        } else {
          if (entry.boundingClientRect.top > 0) {
            setShowSticky(true);
          } else {
            setShowSticky(false);
          }
        }
      },
      { root: null, threshold: 0.1, rootMargin: "0px" }
    );

    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, []);

  useEffect(() => {
    const loadPublicCard = async () => {
      setLoading(true);
      setError(null);
      
      try {
        console.log('🔍 Loading card for slug:', cardSlug);
        
        // Extract userId from slug
        // The slug format is: "anything-anything-USERID" where USERID is the last 6 chars of Firebase UID
        const slugParts = cardSlug.split('-');
        const possibleUserId = slugParts[slugParts.length - 1];
        
        console.log('📝 Slug parts:', slugParts);
        console.log('📝 Possible userId (last segment):', possibleUserId);
        
        // Check all localStorage keys to find matching userId
        let userId = null;
        const allStorageKeys = Object.keys(localStorage);
        console.log('🔍 All localStorage keys:', allStorageKeys);
        
        // Look for profile_ keys
        const profileKeys = allStorageKeys.filter(key => key.startsWith('profile_'));
        console.log('📦 Found profile keys:', profileKeys);
        
        // Try to find the userId by checking which profile has this slug
        for (const profileKey of profileKeys) {
          const extractedUserId = profileKey.replace('profile_', '');
          const cardDataKey = `card_data_${extractedUserId}`;
          
          const cardDataStr = localStorage.getItem(cardDataKey);
          if (cardDataStr) {
            try {
              const cardData = JSON.parse(cardDataStr);
              console.log(`🔍 Checking ${extractedUserId}: slug=${cardData.cardSlug}`);
              
              if (cardData.cardSlug === cardSlug) {
                userId = extractedUserId;
                console.log('✅ Found matching userId:', userId);
                break;
              }
            } catch (e) {
              console.log('❌ Error parsing card data for', extractedUserId);
            }
          }
        }
        
        // If not found by slug match, try the last segment method
        if (!userId && possibleUserId && possibleUserId.length >= 6) {
          // Try to find a userId that ends with this segment
          for (const profileKey of profileKeys) {
            const extractedUserId = profileKey.replace('profile_', '');
            if (extractedUserId.endsWith(possibleUserId) || extractedUserId === possibleUserId) {
              userId = extractedUserId;
              console.log('✅ Found userId by segment match:', userId);
              break;
            }
          }
        }
        
        if (!userId) {
          console.log('❌ Could not extract userId from slug or localStorage');
          setError('Invalid card URL format');
          setLoading(false);
          return;
        }
        
        console.log('✅ Final userId to use:', userId);

        // PRIORITY 1: Try localStorage first (fastest & most reliable for same browser)
        console.log('🔍 Checking localStorage for userId:', userId);
        const localProfileKey = `profile_${userId}`;
        const localCardKey = `card_data_${userId}`;
        
        const localProfileData = localStorage.getItem(localProfileKey);
        const localCardData = localStorage.getItem(localCardKey);
        
        console.log('📦 localStorage profile data:', localProfileData ? 'FOUND' : 'NOT FOUND');
        console.log('📦 localStorage card data:', localCardData ? 'FOUND' : 'NOT FOUND');
        
        if (localProfileData && localCardData) {
          try {
            const profileData = JSON.parse(localProfileData);
            const cardInfo = JSON.parse(localCardData);
            
            console.log('✅ Parsed profile data:', profileData);
            console.log('✅ Parsed card info:', cardInfo);
            
            // Check if card is published and slug matches
            if (cardInfo.cardStatus === 'Published' && cardInfo.cardSlug === cardSlug) {
              console.log('✅ Card is published and slug matches! Loading from localStorage...');
              setCardData(profileData);
              setLoading(false);
              return;
            } else {
              console.log('❌ Card status or slug mismatch:', {
                status: cardInfo.cardStatus,
                savedSlug: cardInfo.cardSlug,
                requestedSlug: cardSlug
              });
            }
          } catch (parseError) {
            console.error('❌ Error parsing localStorage data:', parseError);
          }
        }

        // PRIORITY 2: Try Firestore direct lookup
        try {
          console.log('🔍 Trying Firestore direct lookup...');
          const userDocRef = doc(db, 'users', userId);
          const userDoc = await getDoc(userDocRef);
          
          if (userDoc.exists()) {
            const data = userDoc.data();
            console.log('✅ Found in Firestore:', data);
            
            // Check if card is published and slug matches
            if (data.cardStatus === 'Published' && data.cardSlug === cardSlug) {
              console.log('✅ Firestore data valid! Loading...');
              setCardData(data);
              
              // Also save to localStorage for future visits
              localStorage.setItem(localProfileKey, JSON.stringify(data));
              localStorage.setItem(localCardKey, JSON.stringify({
                cardStatus: data.cardStatus,
                cardSlug: data.cardSlug
              }));
              
              setLoading(false);
              return;
            } else {
              console.log('❌ Firestore card not published or slug mismatch');
            }
          } else {
            console.log('❌ No Firestore document found for userId:', userId);
          }
        } catch (firestoreError) {
          console.log('❌ Firestore direct lookup failed:', firestoreError.message);
        }

        // PRIORITY 3: Try Firestore query by slug
        try {
          console.log('🔍 Trying Firestore query by slug...');
          const usersRef = collection(db, 'users');
          const q = query(
            usersRef, 
            where('cardSlug', '==', cardSlug), 
            where('cardStatus', '==', 'Published')
          );
          const querySnapshot = await getDocs(q);
          
          if (!querySnapshot.empty) {
            const data = querySnapshot.docs[0].data();
            console.log('✅ Found via Firestore query:', data);
            setCardData(data);
            
            // Save to localStorage
            localStorage.setItem(localProfileKey, JSON.stringify(data));
            localStorage.setItem(localCardKey, JSON.stringify({
              cardStatus: data.cardStatus,
              cardSlug: data.cardSlug
            }));
            
            setLoading(false);
            return;
          }
        } catch (queryError) {
          console.log('❌ Firestore query failed:', queryError.message);
        }

        // If we get here, card not found anywhere
        console.log('❌ Card not found in localStorage or Firestore');
        setError('Card not found or not published');
        
      } catch (err) {
        console.error('❌ Unexpected error loading card:', err);
        setError('Failed to load card. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    if (cardSlug) {
      loadPublicCard();
    }
  }, [cardSlug]);

  const getBannerStyle = () => {
    if (cardData?.bannerUrl) {
      return {
        backgroundImage: `linear-gradient(to bottom, rgba(0,0,0,0.3), rgba(0,0,0,0.9)), url(${cardData.bannerUrl})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      };
    }
    if (cardData?.themeColor) {
      return {
        background: `linear-gradient(to bottom, ${cardData.themeColor}dd, ${cardData.themeColor}), #000`
      };
    }
    return {
      background: 'linear-gradient(to bottom, #1e293bdd, #0f172a), #000'
    };
  };

  const downloadVCard = () => {
    if (!cardData) return;

    const vcard = `BEGIN:VCARD
VERSION:3.0
FN:${cardData.fullName || 'Name'}
ORG:${cardData.companyName || ''}
TITLE:${cardData.jobTitle || ''}
TEL;TYPE=WORK:${cardData.workPhone || ''}
EMAIL;TYPE=WORK:${cardData.workEmail || ''}
URL:${cardData.website || ''}
ADR;TYPE=WORK:;;${cardData.address || ''};${cardData.city || ''};${cardData.country || ''}
NOTE:${cardData.aboutMe || ''}
END:VCARD`;

    const blob = new Blob([vcard], { type: 'text/vcard' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${cardData.fullName || 'contact'}.vcf`;
    link.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center">
        <div className="text-center">
          <div className="spinner-border text-primary mb-3" role="status" style={{width: '3rem', height: '3rem'}}>
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="text-muted">Loading business card...</p>
        </div>
      </div>
    );
  }

  if (error || !cardData) {
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center p-4">
        <div className="glass-card p-5 text-center" style={{ maxWidth: "500px" }}>
          <div className="mb-4" style={{ fontSize: '4rem' }}>🔍</div>
          <h2 className="fw-bold mb-3">Card Not Found</h2>
          <p className="text-muted mb-4">
            {error || 'This card may not be published or the link is incorrect.'}
          </p>
          <a href="/" className="btn btn-primary px-4 py-2">
            Go to Home
          </a>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="glass-card rounded-4 w-100 overflow-hidden position-relative z-1 fade-up" style={{ maxWidth: "900px" }}>
        
        {/* Banner Area */}
        <div className="profile-banner" style={getBannerStyle()}>
          <div className="d-flex justify-content-end align-items-center p-4">
            <a href="/" className="profile-header-btn">
              ← Home
            </a>
          </div>

          <div className="p-5 text-center">
            <div className="mx-auto mb-4 p-1 rounded-circle border border-2 border-light border-opacity-25" style={{width: '130px', height: '130px'}}>
              {cardData.avatarUrl ? 
                <img src={cardData.avatarUrl} alt="Avatar" className="rounded-circle w-100 h-100 object-fit-cover" /> : 
                <div className="w-100 h-100 bg-secondary bg-opacity-25 rounded-circle d-flex align-items-center justify-content-center">
                  <Icons.User />
                </div>
              }
            </div>
            <h1 className="fw-bold text-white mb-1">{cardData.fullName || "Your Name"}</h1>
            <p className="text-info mb-3" style={{color: '#64ffda'}}>
              {cardData.jobTitle || "Job Title"} {cardData.companyName && `@ ${cardData.companyName}`}
            </p>
            <p className="bio-text small max-w-md mx-auto mt-3" style={{maxWidth: '600px'}}>
              {cardData.aboutMe || "No bio provided."}
            </p>
          </div>
        </div>

        <div className="row g-0">
          {/* Left Box - Contact Info */}
          <div className="col-md-7 p-5 border-end border-secondary border-opacity-10">
            <h6 className="section-title mb-4">Contact Information</h6>
            
            <div className="info-row d-flex align-items-center gap-3 mb-3">
              <div className="info-icon"><Icons.Phone /></div>
              <div><span className="value-text">{cardData.workPhone || 'N/A'}</span></div>
            </div>

            <div className="info-row d-flex align-items-center gap-3 mb-3">
              <div className="info-icon"><Icons.Mail /></div>
              <div><span className="value-text">{cardData.workEmail || 'N/A'}</span></div>
            </div>

            {cardData.website && (
              <div className="info-row d-flex align-items-center gap-3 mb-3">
                <div className="info-icon"><Icons.Globe /></div>
                <div>
                  <a href={cardData.website} target="_blank" rel="noopener noreferrer" className="value-text text-decoration-none">
                    {cardData.website}
                  </a>
                </div>
              </div>
            )}
            
            <h6 className="section-title mb-4 mt-5">Address</h6>
            <div className="info-row border-0 d-flex gap-3">
              <div className="info-icon"><Icons.MapPin /></div>
              <div>
                <span className="value-text d-block">{cardData.address || 'Street Address'}</span>
                <span className="label-text">
                  {cardData.city || 'City'}, {cardData.country || 'Country'}
                </span>
              </div>
            </div>
          </div>

          {/* Right Box - Socials & Actions */}
          <div className="col-md-5 p-5" style={{background: '#0d1117'}}>
            <h6 className="section-title mb-4">Social Networks</h6>
            <div className="social-grid">
              <a href={cardData.linkedin || '#'} target="_blank" rel="noopener noreferrer" className="social-btn linkedin">
                LinkedIn <Icons.ArrowRight />
              </a>
              <a href={cardData.twitter || '#'} target="_blank" rel="noopener noreferrer" className="social-btn twitter">
                X / Twitter <Icons.ArrowRight />
              </a>
              <a href={cardData.whatsapp || '#'} target="_blank" rel="noopener noreferrer" className="social-btn whatsapp">
                WhatsApp <Icons.ArrowRight />
              </a>
              <a href={cardData.facebook || '#'} target="_blank" rel="noopener noreferrer" className="social-btn facebook">
                Facebook <Icons.ArrowRight />
              </a>
            </div>

            <div ref={buttonsSectionRef} className="mt-5 pt-4 border-top border-secondary border-opacity-10">
              <button 
                onClick={downloadVCard}
                className="btn w-100 py-3 fw-bold text-dark d-flex align-items-center justify-content-center gap-2 mb-3"
                style={{ background: '#2563eb', color: '#ffffff', border: 'none', borderRadius: '6px' }}
              >
                <Icons.Check /> ADD TO CONTACTS
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Mobile Sticky Button */}
      <div className={`mobile-sticky-bar ${showSticky ? 'visible' : ''}`}>
        <button 
          onClick={downloadVCard}
          className="btn w-100 py-3 fw-bold text-dark d-flex align-items-center justify-content-center gap-2"
          style={{ background: '#2563eb', color: '#ffffff', border: 'none', borderRadius: '6px' }}
        >
          <Icons.Check /> ADD TO CONTACTS
        </button>
      </div>
    </>
  );
};

export default PublicCardView;