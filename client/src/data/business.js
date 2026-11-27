// Single source for name / address / phone (NAP) and contact links.
// Every value here was taken from the pre-redesign site (Contact, Footer, navbar, CTASection).
export const BUSINESS = {
  name: 'Taxi House Bengaluru',
  url: 'https://www.taxihousebengaluru.com',
  phone: '+917795965640',
  phoneDisplay: '+91 77959 65640',
  phoneAlt: '+918660484650',
  phoneAltDisplay: '+91 86604 84650',
  whatsapp: '917795965640',
  email: 'taxihousebengaluru@gmail.com',
  address: {
    street: 'Shop No. 1, 2nd Floor, Survey No. 2, Near VNR Fuelling Station',
    locality: 'Yadavanahalli',
    city: 'Bengaluru',
    region: 'Karnataka',
    postalCode: '562107',
    country: 'IN',
  },
  social: {
    facebook: 'https://www.facebook.com/profile.php?id=61586338866663',
    instagram: 'https://www.instagram.com/taxi_house_bengaluru?igsh=ODI1MHRleGZlNGk1',
  },
};

export const ADDRESS_ONE_LINE = `${BUSINESS.address.street}, ${BUSINESS.address.locality}, ${BUSINESS.address.city} ${BUSINESS.address.postalCode}`;
export const MAPS_URL = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${BUSINESS.address.street}, ${BUSINESS.address.locality}, ${BUSINESS.address.city} - ${BUSINESS.address.postalCode}`)}`;
export const TEL_URL = `tel:${BUSINESS.phone}`;
export const waUrl = (text) => `https://wa.me/${BUSINESS.whatsapp}${text ? `?text=${encodeURIComponent(text)}` : ''}`;
