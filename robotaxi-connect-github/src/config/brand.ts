export const brand = {
  name: process.env.ROBOTAXI_BRAND_NAME || 'Robotaxi Connect',
  legalName: process.env.ROBOTAXI_LEGAL_NAME || '',
  domain: process.env.ROBOTAXI_BRAND_DOMAIN || '',
  supportEmail: process.env.ROBOTAXI_SUPPORT_EMAIL || '',
  logo: process.env.ROBOTAXI_LOGO || '/robotaxi-logo.png',
  emailFrom: process.env.ROBOTAXI_EMAIL_FROM || '',
  claim: {
    de: 'Die Verbindung zwischen Taxiunternehmen und autonomer Mobilität.',
    en: 'Connecting taxi operators with autonomous mobility.',
  },
  defaultLocale: 'de' as const,
};
