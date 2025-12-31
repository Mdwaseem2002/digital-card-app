// ============================================
// FILE 4: src/utils/walletIntegration/samsungWallet.js (UPDATED)
// ============================================

export const addToSamsungWallet = async (formData, publicCardUrl) => {
  return new Promise((resolve, reject) => {
    try {
      if (!publicCardUrl) {
        reject(new Error('Card must be published first'));
        return;
      }

      // Samsung Wallet uses similar approach to Google Wallet
      // Create a pass that works with Samsung devices
      
      const passData = createSamsungWalletPass(formData, publicCardUrl);
      
      // For Samsung, we can use the Samsung Wallet Add API
      const samsungWalletUrl = createSamsungWalletLink(passData);
      
      // Open Samsung Wallet
      window.open(samsungWalletUrl, '_blank');
      
      resolve({
        success: true,
        message: `✅ Opening Samsung Wallet...

📲 Samsung Wallet is launching!

What happens next:
1. Samsung Wallet app opens
2. Review your business card
3. Tap "Add to Wallet"
4. Card saved!

✨ Features:
• Quick access from Samsung Wallet
• Works offline
• NFC sharing enabled
• Auto-updates when you change details

Note: Samsung Wallet must be installed on your device.`,
        passData: passData
      });

    } catch (error) {
      reject(error);
    }
  });
};

function createSamsungWalletPass(formData, publicCardUrl) {
  return {
    partnerId: 'demo_partner', // Replace with your Samsung partner ID
    partnerServiceId: 'business_card',
    cardId: `card_${Date.now()}`,
    cardDesign: {
      backgroundColor: formData.themeColor || '#1e293b',
      title: formData.fullName || 'Business Card',
      subtitle: formData.jobTitle || '',
      description: formData.companyName || '',
      logoImage: formData.avatarUrl || ''
    },
    cardContent: {
      primaryInfo: [
        { label: 'Email', value: formData.workEmail },
        { label: 'Phone', value: formData.workPhone }
      ],
      secondaryInfo: [
        { label: 'Website', value: publicCardUrl },
        { label: 'Address', value: formatAddress(formData) }
      ]
    },
    barcode: {
      type: 'QR_CODE',
      value: publicCardUrl
    }
  };
}

function createSamsungWalletLink(passData) {
  // Samsung Wallet deep link format
  const baseUrl = 'samsungwallet://addCard';
  const params = new URLSearchParams({
    type: 'generic',
    data: JSON.stringify(passData)
  });
  
  // Fallback to web URL if app not installed
  const webFallback = `https://wallet.samsung.com/addcard?${params.toString()}`;
  
  return webFallback;
}

function formatAddress(formData) {
  const parts = [formData.address, formData.city, formData.country].filter(Boolean);
  return parts.join(', ') || 'Not provided';
}

// ============================================
// BACKEND SETUP GUIDE (For Production)
// ============================================

/**
 * TO ENABLE FULL GOOGLE WALLET INTEGRATION:
 * 
 * 1. Set up Google Cloud Project:
 *    - Go to console.cloud.google.com
 *    - Create new project
 *    - Enable "Google Wallet API"
 * 
 * 2. Create Service Account:
 *    - IAM & Admin > Service Accounts
 *    - Create Service Account
 *    - Add role: "Wallet Object Admin"
 *    - Create JSON key, download it
 * 
 * 3. Create Issuer Account:
 *    - Go to pay.google.com/business/console
 *    - Create Issuer Account
 *    - Get your Issuer ID (format: 3388000000022...)
 * 
 * 4. Backend API (Node.js):
 * 
 * ```javascript
 * const express = require('express');
 * const { GoogleAuth } = require('google-auth-library');
 * const jwt = require('jsonwebtoken');
 * 
 * const app = express();
 * const serviceAccount = require('./service-account-key.json');
 * 
 * app.post('/api/create-wallet-pass', async (req, res) => {
 *   const { formData, publicCardUrl } = req.body;
 *   
 *   // Create pass object
 *   const passObject = {
 *     // ... your pass structure
 *   };
 *   
 *   // Sign JWT
 *   const claims = {
 *     iss: serviceAccount.client_email,
 *     aud: 'google',
 *     typ: 'savetowallet',
 *     payload: { genericObjects: [passObject] }
 *   };
 *   
 *   const token = jwt.sign(claims, serviceAccount.private_key, {
 *     algorithm: 'RS256'
 *   });
 *   
 *   const saveUrl = `https://pay.google.com/gp/v/save/${token}`;
 *   
 *   res.json({ saveUrl });
 * });
 * ```
 * 
 * 5. Update frontend to call your backend:
 * 
 * ```javascript
 * const response = await fetch('/api/create-wallet-pass', {
 *   method: 'POST',
 *   body: JSON.stringify({ formData, publicCardUrl })
 * });
 * const { saveUrl } = await response.json();
 * window.open(saveUrl, '_blank');
 * ```
 */