// Primary navigation. Outstation / Local deep-link into the home booking card with the right tab.
export const NAV = [
  { label: 'Outstation', to: '/?trip=one-way#book', match: null },
  { label: 'Airport', to: '/airport', match: '/airport' },
  { label: 'Local hourly', to: '/?type=local#book', match: null },
  { label: 'Fleet & tariff', to: '/tariff', match: '/tariff' },
  { label: 'Contact', to: '/contact', match: '/contact' },
];
