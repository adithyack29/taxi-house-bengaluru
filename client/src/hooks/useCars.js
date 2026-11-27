import { useEffect, useState } from 'react';
import FARES from '../data/fares.json';

// Live fleet + rates from Supabase `cars` (managed in /admin). Fetched once per session and shared.
let cache = null;
let inflight = null;

async function loadCars() {
  if (cache) return cache;
  if (!inflight) {
    inflight = (async () => {
      try {
        const { supabase } = await import('../lib/supabase');
        const { data, error } = await supabase.from('cars').select('*').eq('is_available', true);
        if (error) throw error;
        if (Array.isArray(data) && data.length) return { cars: data, live: true };
      } catch (err) {
        console.warn('[cars] live fares unavailable, using bundled fares:', err?.message || err);
      }
      return { cars: FARES.fallbackCars, live: false };
    })().then((r) => (cache = r));
  }
  return inflight;
}

/**
 * @param category optional 'outstation' | 'local' | 'airport' — filters on available_categories
 * @param opts.fallbackFirst start from the bundled fares instead of an empty list (used by prerendered
 *   pages so the static HTML carries real numbers; live rates replace them once loaded).
 */
export function useCars(category, { fallbackFirst = false } = {}) {
  const [state, setState] = useState(() => ({
    loading: !cache,
    ...(cache || { cars: fallbackFirst ? FARES.fallbackCars : [], live: false }),
  }));
  useEffect(() => {
    let alive = true;
    loadCars().then((r) => alive && setState({ loading: false, ...r }));
    return () => { alive = false; };
  }, []);
  const cars = category ? state.cars.filter((c) => c.available_categories?.includes(category)) : state.cars;
  return { ...state, cars };
}
