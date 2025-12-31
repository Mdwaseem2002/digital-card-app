// ============================================
// FILE 3: src/utils/walletIntegration/appleWallet.js (UPDATED)
// ============================================

export const addToAppleWallet = async (formData, publicCardUrl) => {
  return new Promise((resolve, reject) => {
    try {
      if (!publicCardUrl) {
        reject(new Error('Card must be published first'));
        return;
      }

      // For Apple Wallet, we need a backend to sign the .pkpass file
      // For now, create a contact card that works on iOS
      
      // Alternative: Generate a web-based pass preview
      const passPreviewUrl = createAppleWalletPreview(formData, publicCardUrl);
      
      // Download vCard for iOS compatibility
      const vCardData = generateVCard(formData, publicCardUrl);
      downloadFile(vCardData, `${formData.fullName || 'contact'}.vcf`, 'text/vcard');
      
      resolve({
        success: true,
        message: `✅ Contact Card Downloaded!

🍎 TO ADD TO APPLE WALLET:

iOS Users:
1. Open the downloaded .vcf file
2. Tap "Add to Contacts"
3. Contact saved to iPhone

💡 For native Apple Wallet Pass:
We're working on .pkpass integration which will provide:
• Wallet pass card
• Lock screen notifications
• Offline access
• NFC sharing

This requires Apple Developer Program membership ($99/year) and backend infrastructure.

Current solution works on all iOS devices immediately!`,
        preview: passPreviewUrl
      });

    } catch (error) {
      reject(error);
    }
  });
};

function createAppleWalletPreview(formData, publicCardUrl) {
  // Create a web-based preview that looks like Apple Wallet
  const previewData = {
    organizationName: formData.companyName || 'Business Card',
    description: `${formData.fullName}'s Business Card`,
    logoText: formData.fullName,
    foregroundColor: 'rgb(255, 255, 255)',
    backgroundColor: formData.themeColor || 'rgb(30, 41, 59)',
    primaryFields: [
      { label: 'NAME', value: formData.fullName }
    ],
    secondaryFields: [
      { label: 'TITLE', value: formData.jobTitle },
      { label: 'COMPANY', value: formData.companyName }
    ],
    auxiliaryFields: [
      { label: 'EMAIL', value: formData.workEmail },
      { label: 'PHONE', value: formData.workPhone }
    ],
    backFields: [
      { label: 'Website', value: publicCardUrl },
      { label: 'Address', value: formatAddress(formData) }
    ]
  };
  
  return previewData;
}

function generateVCard(formData, publicCardUrl) {
  const escape = (str) => str ? str.replace(/[,;\\]/g, '\\$&') : '';
  
  return `BEGIN:VCARD
VERSION:3.0
FN:${escape(formData.fullName || 'Contact')}
ORG:${escape(formData.companyName || '')}
TITLE:${escape(formData.jobTitle || '')}
TEL;TYPE=WORK:${formData.workPhone || ''}
EMAIL;TYPE=WORK:${formData.workEmail || ''}
URL:${publicCardUrl}
ADR;TYPE=WORK:;;${escape(formData.address || '')};${escape(formData.city || '')};;${escape(formData.country || '')}
NOTE:${escape(formData.aboutMe || '')}
PHOTO;VALUE=URI:${formData.avatarUrl || ''}
END:VCARD`;
}

function formatAddress(formData) {
  const parts = [formData.address, formData.city, formData.country].filter(Boolean);
  return parts.join(', ') || 'Not provided';
}

function downloadFile(data, filename, mimeType) {
  const blob = new Blob([data], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
