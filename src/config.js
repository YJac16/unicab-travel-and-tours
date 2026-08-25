// Site Configuration
export const siteConfig = {
  brand: 'UNICAB Travel & Tours',
  website: 'https://www.unicabtraveltours.com/',
  email: 'info@unicabtravel.co.za',
  phone: {
    tel: '+27812818105',
    display: '+27 81 281 8105',
  },
  whatsapp: {
    number: '+27812818105',
    displayNumber: '+27 81 281 8105',
    link: 'https://wa.me/27812818105',
    linkWithMessage:
      "https://wa.me/27812818105?text=Hello%2C%20I%27d%20like%20to%20enquire%20about%20UNICAB%20transfers%20or%20tours",
    /** @deprecated Use link / linkWithMessage */
    directLink: 'https://wa.me/27812818105',
    directLinkWithMessage:
      "https://wa.me/27812818105?text=Hello%2C%20I%27d%20like%20to%20enquire%20about%20UNICAB%20transfers%20or%20tours",
  },
  analytics: {
    gaMeasurementId: import.meta.env.VITE_GA_MEASUREMENT_ID || '',
  },
  googleBusinessProfileUrl: '',
};

export function whatsappEnquiryUrl(message) {
  const base = siteConfig.whatsapp.link;
  if (!message) return base;
  return `${base}?text=${encodeURIComponent(message)}`;
}
