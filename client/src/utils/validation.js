/** Indian mobile: 10 digits starting 6–9, optional +91 / 91 prefix. Returns the 10-digit number or null. */
export function normalizeIndianMobile(raw = '') {
  const v = String(raw).replace(/[\s\-()]/g, '');
  const m = v.match(/^(?:\+?91)?([6-9]\d{9})$/);
  return m ? m[1] : null;
}

export const MOBILE_ERROR = 'Enter a 10-digit Indian mobile number starting with 6, 7, 8 or 9 (+91 optional).';
