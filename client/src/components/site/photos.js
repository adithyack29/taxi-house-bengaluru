/** Photo per vehicle class; `credit` marks third-party images that need attribution (see SiteFooter). */
export const CLASS_PHOTO = {
  sedan: { name: 'car-sedan', alt: 'White Toyota Etios taxi with its chauffeur outside Vidhana Soudha' },
  // Stock photo, public domain: "2022 Maruti Suzuki Ertiga LXi.jpg", Wikimedia Commons (Ramakrishna Mission Vidyapith).
  suv: { name: 'car-suv', alt: 'White Maruti Suzuki Ertiga, front three-quarter view' },
  // Stock photo, CC BY-SA 4.0: "Toyota Innova Crysta 2.4 Z front right.jpg", Wikimedia Commons (Premnath Kudva). Credit required.
  crysta: { name: 'car-innova-crysta', alt: 'White Toyota Innova Crysta, front three-quarter view' },
  tempo: { name: 'car-tempo-traveller', alt: 'White 12-seater Tempo Traveller, side view' },
};

/** Attribution required by CC BY-SA 4.0 for the Innova Crysta photo. */
export const PHOTO_CREDITS = [
  {
    label: 'Innova Crysta photo',
    author: 'Premnath Kudva',
    source: 'https://commons.wikimedia.org/wiki/File:Toyota_Innova_Crysta_2.4_Z_front_right.jpg',
    license: 'CC BY-SA 4.0',
    licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0/',
  },
];
