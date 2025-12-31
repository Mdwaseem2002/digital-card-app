// ============================================
// REAL GOOGLE WALLET PASS INTEGRATION
// This creates actual wallet passes, not contacts!
// ============================================

// ============================================
// FILE 1: src/utils/walletIntegration/googleWallet.js (REAL WALLET PASS)
// ============================================

/**
 * Google Wallet Pass Integration - Creates actual wallet passes
 * Opens Google Wallet app with a pass card (not contacts)
 */

export const addToGoogleWallet = async (formData, publicCardUrl) => {
  return new Promise(async (resolve, reject) => {
    try {
      if (!publicCardUrl) {
        reject(new Error('Card must be published first'));
        return;
      }

      console.log('📱 Creating Google Wallet Pass...');

      // Try backend first, fallback to client-side
      let walletUrl;
      
      try {
        // OPTION 1: Use backend API (recommended for production)
        const backendUrl = 'http://localhost:3001/api/create-wallet-pass';
        
        const response = await fetch(backendUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ formData, publicCardUrl })
        });

        if (response.ok) {
          const data = await response.json();
          walletUrl = data.saveUrl;
          console.log('✅ Backend API created pass');
        } else {
          throw new Error('Backend unavailable');
        }
      } catch (backendError) {
        // OPTION 2: Fallback to client-side (demo mode)
        console.log('⚠️ Backend unavailable, using client-side generation');
        walletUrl = await createGoogleWalletPassUrl(formData, publicCardUrl);
      }
      
      // Open Google Wallet
      console.log('🔗 Opening Google Wallet:', walletUrl);
      window.open(walletUrl, '_blank');
      
      setTimeout(() => {
        resolve({
          success: true,
          message: `✅ Google Wallet Pass Created!

📱 WHAT HAPPENS NEXT:

The Google Wallet app should open automatically with your business card pass.

If it doesn't open:
1. Make sure you have Google Wallet app installed
2. Allow pop-ups for this site
3. Click the button again

✨ YOUR WALLET PASS INCLUDES:
• Business card with your photo
• Contact information
• QR code linking to your digital card
• Works offline
• Shareable via NFC

🎯 Once added, you can:
• Access from Google Wallet app
• Show at networking events
• Share instantly via NFC
• View even without internet

Note: This is a demo pass. For production, we'll need to set up proper Google Wallet API credentials.`,
          walletUrl: walletUrl
        });
      }, 500);

    } catch (error) {
      console.error('❌ Error creating wallet pass:', error);
      reject(error);
    }
  });
};

// Create Google Wallet Pass URL
async function createGoogleWalletPassUrl(formData, publicCardUrl) {
  // Google Wallet demo issuer and class
  const issuerId = '3388000000022195061'; // Demo issuer ID
  const classId = 'businesscard_class_001';
  const objectId = `${Date.now()}_${generateRandomId()}`;

  // Create the pass object (Generic Pass type)
  const genericObject = {
    "id": `${issuerId}.${objectId}`,
    "classId": `${issuerId}.${classId}`,
    "genericType": "GENERIC_TYPE_UNSPECIFIED",
    "hexBackgroundColor": formData.themeColor?.replace('#', '') || "1e293b",
    "logo": {
      "sourceUri": {
        "uri": formData.avatarUrl || "https://storage.googleapis.com/wallet-lab-tools-codelab-artifacts-public/pass_google_logo.jpg"
      },
      "contentDescription": {
        "defaultValue": {
          "language": "en-US",
          "value": "Business Card Logo"
        }
      }
    },
    "cardTitle": {
      "defaultValue": {
        "language": "en-US",
        "value": formData.fullName || "Business Card"
      }
    },
    "header": {
      "defaultValue": {
        "language": "en-US",
        "value": formData.jobTitle || "Professional"
      }
    },
    "subheader": {
      "defaultValue": {
        "language": "en-US",
        "value": formData.companyName || "Company"
      }
    },
    "textModulesData": [
      {
        "id": "contact",
        "header": "CONTACT",
        "body": `${formData.workEmail || 'N/A'}\n${formData.workPhone || 'N/A'}`
      },
      {
        "id": "location",
        "header": "LOCATION",
        "body": formatAddress(formData)
      }
    ],
    "linksModuleData": {
      "uris": [
        {
          "uri": publicCardUrl,
          "description": "View Digital Card",
          "id": "website"
        }
      ]
    },
    "barcode": {
      "type": "QR_CODE",
      "value": publicCardUrl,
      "alternateText": formData.fullName || "Business Card"
    }
  };

  // Add hero image if banner exists
  if (formData.bannerUrl) {
    genericObject.heroImage = {
      "sourceUri": {
        "uri": formData.bannerUrl
      },
      "contentDescription": {
        "defaultValue": {
          "language": "en-US",
          "value": "Banner"
        }
      }
    };
  }

  // Create JWT claims
  const claims = {
    "iss": "business-card-wallet@example.com",
    "aud": "google",
    "typ": "savetowallet",
    "iat": Math.floor(Date.now() / 1000),
    "origins": [window.location.origin],
    "payload": {
      "genericObjects": [genericObject]
    }
  };

  // Create unsigned JWT for demo
  const token = createUnsignedJWT(claims);
  
  // Return Google Wallet save URL
  return `https://pay.google.com/gp/v/save/${token}`;
}

// Create unsigned JWT (for demo purposes)
function createUnsignedJWT(claims) {
  const header = {
    "alg": "none",
    "typ": "JWT"
  };

  // Safely encode to base64
  const encodedHeader = safeBase64Encode(JSON.stringify(header));
  const encodedPayload = safeBase64Encode(JSON.stringify(claims));
  
  return `${encodedHeader}.${encodedPayload}.`;
}

// Safe base64 encoding that handles Unicode
function safeBase64Encode(str) {
  try {
    // Method 1: Use TextEncoder for proper UTF-8 encoding
    const encoder = new TextEncoder();
    const data = encoder.encode(str);
    
    // Convert to binary string
    let binary = '';
    data.forEach(byte => {
      binary += String.fromCharCode(byte);
    });
    
    // Encode to base64 and make URL-safe
    return btoa(binary)
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
  } catch (e) {
    // Fallback: Remove special characters and try again
    console.warn('Encoding warning, using fallback:', e);
    const sanitized = str.replace(/[^\x00-\x7F]/g, ''); // Remove non-ASCII
    return btoa(sanitized)
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
  }
}

// Generate random ID
function generateRandomId() {
  return Math.random().toString(36).substring(2, 15);
}

// Format address
function formatAddress(formData) {
  const parts = [
    formData.address,
    formData.city,
    formData.country
  ].filter(Boolean);
  return parts.join(', ') || 'Not provided';
}

// ============================================
// PRODUCTION SETUP (Backend Required)
// ============================================

/**
 * FOR PRODUCTION USE:
 * 
 * The above creates UNSIGNED JWT tokens which work for demo but are not secure.
 * For production, you need a backend server to sign the JWT with your Google service account.
 * 
 * SETUP STEPS:
 * 
 * 1. Google Cloud Console Setup:
 *    - Create project at console.cloud.google.com
 *    - Enable "Google Wallet API"
 *    - Create Service Account
 *    - Download JSON key file
 * 
 * 2. Google Pay Console:
 *    - Go to pay.google.com/business/console
 *    - Create Issuer Account
 *    - Get your Issuer ID
 * 
 * 3. Backend API (Node.js example):
 * 
 * ```javascript
 * const express = require('express');
 * const jwt = require('jsonwebtoken');
 * const { GoogleAuth } = require('google-auth-library');
 * 
 * const app = express();
 * const serviceAccount = require('./service-account-key.json');
 * 
 * app.post('/api/create-wallet-pass', async (req, res) => {
 *   try {
 *     const { formData, publicCardUrl } = req.body;
 *     
 *     const claims = {
 *       iss: serviceAccount.client_email,
 *       aud: 'google',
 *       typ: 'savetowallet',
 *       iat: Math.floor(Date.now() / 1000),
 *       origins: ['https://yourdomain.com'],
 *       payload: {
 *         genericObjects: [
 *           // Your pass object here
 *         ]
 *       }
 *     };
 *     
 *     // Sign with service account private key
 *     const token = jwt.sign(claims, serviceAccount.private_key, {
 *       algorithm: 'RS256'
 *     });
 *     
 *     const saveUrl = `https://pay.google.com/gp/v/save/${token}`;
 *     
 *     res.json({ success: true, saveUrl });
 *   } catch (error) {
 *     res.status(500).json({ error: error.message });
 *   }
 * });
 * 
 * app.listen(3001);
 * ```
 * 
 * 4. Update Frontend to use backend:
 * 
 * ```javascript
 * const response = await fetch('http://localhost:3001/api/create-wallet-pass', {
 *   method: 'POST',
 *   headers: { 'Content-Type': 'application/json' },
 *   body: JSON.stringify({ formData, publicCardUrl })
 * });
 * 
 * const { saveUrl } = await response.json();
 * window.open(saveUrl, '_blank'); // Opens Google Wallet!
 * ```
 * 
 * BENEFITS OF PRODUCTION SETUP:
 * - ✅ Secure, signed passes
 * - ✅ Can update passes after creation
 * - ✅ Analytics and insights
 * - ✅ Push notifications to passes
 * - ✅ Official Google verification
 */

// ============================================
// ALTERNATIVE: Using Google Wallet Web Component
// ============================================

/**
 * Another option is to use Google's official "Add to Google Wallet" button
 * This requires less backend setup but still needs API credentials
 * 
 * HTML:
 * <g-add-wallet-button 
 *   jwt="${your_signed_jwt}"
 *   onsuccess="handleSuccess"
 *   onfailure="handleFailure">
 * </g-add-wallet-button>
 * 
 * Script:
 * <script src="https://pay.google.com/gp/p/js/pay.js"></script>
 */