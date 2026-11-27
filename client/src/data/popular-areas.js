/** Major areas linked site-wide (home + footer). Kept tiny so the full areas.json stays out of the main bundle. */
export const POPULAR_AREAS = [
  ['whitefield', 'Whitefield'], ['electronic-city', 'Electronic City'], ['hsr-layout', 'HSR Layout'],
  ['marathahalli', 'Marathahalli'], ['indiranagar', 'Indiranagar'], ['hebbal', 'Hebbal'], ['yelahanka', 'Yelahanka'],
  ['jp-nagar', 'JP Nagar'], ['jayanagar', 'Jayanagar'], ['btm-layout', 'BTM Layout'], ['bellandur', 'Bellandur'],
  ['sarjapur-road', 'Sarjapur Road'], ['banashankari', 'Banashankari'], ['rajajinagar', 'Rajajinagar'],
  ['malleswaram', 'Malleswaram'], ['kr-puram', 'KR Puram'], ['hennur', 'Hennur'], ['yeshwanthpur', 'Yeshwanthpur'],
].map(([slug, name]) => ({ slug, name, path: `/taxi-service-in-${slug}` }));
