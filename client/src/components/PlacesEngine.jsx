import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import { useJsApiLoader } from '@react-google-maps/api';
import usePlacesAutocomplete, { getGeocode, getLatLng } from 'use-places-autocomplete';

const libraries = ['places'];

/** Holds the Google hooks; only mounted once the field is engaged. */
const PlacesEngine = forwardRef(function PlacesEngine({ showCurrentLocation, onOptions, onPick }, ref) {
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    libraries,
  });
  const pending = useRef(null);
  const {
    ready, suggestions: { status, data }, setValue, clearSuggestions, init,
  } = usePlacesAutocomplete({
    requestOptions: {
      componentRestrictions: { country: 'in' },
      // Bias to Bengaluru so typos resolve locally.
      locationBias: { center: { lat: 12.9716, lng: 77.5946 }, radius: 100000 },
    },
    debounce: 400,
    initOnMount: false,
  });

  useEffect(() => { if (isLoaded) init(); }, [isLoaded, init]);
  useEffect(() => {
    if (ready && pending.current) { setValue(pending.current); pending.current = null; }
  }, [ready, setValue]);

  useEffect(() => {
    const opts = [];
    if (isLoaded && showCurrentLocation) opts.push({ key: '__here', kind: 'here', main: 'Use my current location' });
    if (isLoaded) opts.push({ key: '__map', kind: 'map', main: 'Choose on map' });
    if (loadError) opts.push({ key: '__err', kind: 'error', main: 'Address search is unavailable — type the address in full' });
    if (status === 'OK') {
      for (const s of data) {
        opts.push({ key: s.place_id, kind: 'place', main: s.structured_formatting?.main_text, sub: s.structured_formatting?.secondary_text, address: s.description });
      }
    }
    onOptions(opts);
  }, [isLoaded, loadError, status, data, showCurrentLocation, onOptions]);

  const geocode = async (address) => {
    onPick(address, null);
    try {
      const results = await getGeocode({ address });
      const { lat, lng } = await getLatLng(results[0]);
      onPick(address, { lat, lng });
    } catch (err) {
      console.error('Geocoding Error: ', err);
    }
  };

  const here = () => {
    onPick('Locating…', null);
    if (!navigator.geolocation) { onPick('', null); return; }
    navigator.geolocation.getCurrentPosition(
      async ({ coords: { latitude, longitude } }) => {
        try {
          const geocoder = new window.google.maps.Geocoder();
          const res = await geocoder.geocode({ location: { lat: latitude, lng: longitude } });
          onPick(res.results?.[0]?.formatted_address || `${latitude}, ${longitude}`, { lat: latitude, lng: longitude });
        } catch (err) {
          console.error('Reverse Geocode Error:', err);
          onPick('', null);
        }
      },
      (err) => { console.error('Geolocation Error:', err); onPick('', null); },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
    );
  };

  useImperativeHandle(ref, () => ({
    query(val) { if (ready) setValue(val); else pending.current = val; },
    select(opt) {
      clearSuggestions();
      if (opt.kind === 'here') here();
      else if (opt.kind === 'coords') { setValue(opt.address, false); onPick(opt.address, opt.coords); }
      else if (opt.kind === 'place') { setValue(opt.address, false); geocode(opt.address); }
    },
  }));

  return null;
});

export default PlacesEngine;
