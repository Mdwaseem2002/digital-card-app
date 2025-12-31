//src\data.js
export const initialFormData = {
  avatar: null, // Will store URL object
  fullName: "",
  companyName: "",
  jobTitle: "",
  aboutMe: "",
  
  // Contact
  workPhone: "",
  personalEmail: "",
  workEmail: "",
  website: "",
  
  // Socials (URLs)
  linkedin: "",
  whatsapp: "",
  facebook: "",
  twitter: "",
  
  // Address
  address: "",
  city: "",
  country: ""
};

// Mock data to pre-fill (optional, for testing)
export const mockData = {
  fullName: "Sarah Connor",
  companyName: "Cyberdyne Systems",
  jobTitle: "Senior Systems Engineer",
  aboutMe: "Passionate about preventing Skynet from taking over. Expert in legacy systems and future-proofing AI interfaces.",
  workPhone: "+1 (555) 0199-283",
  workEmail: "sarah@cyberdyne.net",
  personalEmail: "s.connor@gmail.com",
  website: "https://resistance.org",
  city: "Los Angeles",
  country: "USA"
};