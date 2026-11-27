import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef } from 'react';
import { useJsApiLoader } from '@react-google-maps/api';
import usePlacesAutocomplete, { getGeocode, getLatLng } from 'use-places-autocomplete';

const libraries = ['places'];

/** Holds the Google hooks; only mounted once the field is engaged. */
const PlacesEngine = forwardRef(function PlacesEngine({ showCurrentLocation, onOptions, onPick, autoLocate = false, canAutoFill = () => true }, ref) {
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

  /**
   * Current location → address. `silent` is the automatic fill: no "Locating…" text,
   * no clearing on failure, and it never overwrites something the user has typed meanwhile.
   */
  const here = useCallback((silent = false) => {
    if (!navigator.geolocation) { if (!silent) onPick('', null); return; }
    if (!silent) onPick('Locating…', null);
    navigator.geolocation.getCurrentPosition(
      async ({ coords: { latitude, longitude } }) => {
        try {
          const geocoder = new window.google.maps.Geocoder();
          const res = await geocoder.geocode({ location: { lat: latitude, lng: longitude } });
          if (silent && !canAutoFill()) return;
          onPick(res.results?.[0]?.formatted_address || `${latitude}, ${longitude}`, { lat: latitude, lng: longitude });
        } catch (err) {
          console.error('Reverse Geocode Error:', err);
          if (!silent) onPick('', null);
        }
      },
      (err) => { if (!silent) { console.error('Geolocation Error:', err); onPick('', null); } },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: silent ? 300000 : 0 },
    );
  }, [onPick, canAutoFill]);

  // Automatic detection, requested by the field (see LocationInput autoLocate). Runs once per mount.
  const autoDone = useRef(false);
  useEffect(() => {
    if (!isLoaded || !autoLocate || autoDone.current) return;
    autoDone.current = true;
    here(true);
  }, [isLoaded, autoLocate, here]);

  useImperativeHandle(ref, () => ({
    query(val) { if (ready) setValue(val); else pending.current = val; },
    select(opt) {
      clearSuggestions();
      if (opt.kind === 'here') here(false);
      else if (opt.kind === 'coords') { setValue(opt.address, false); onPick(opt.address, opt.coords); }
      else if (opt.kind === 'place') { setValue(opt.address, false); geocode(opt.address); }
    },
  }));

  return null;
});

export default PlacesEngine;
