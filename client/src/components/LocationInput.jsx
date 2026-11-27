import { lazy, Suspense, useCallback, useEffect, useId, useRef, useState } from 'react';

// Google Maps / Places code is split out and only fetched once the field is engaged.
const PlacesEngine = lazy(() => import('./PlacesEngine'));
const MapModal = lazy(() => import('./MapModal'));

/**
 * Google Places address field (accessible combobox).
 * Contract unchanged from the old component: onChange({ target: { name, value, coords } }).
 * The Maps script only loads after the user hovers/focuses the field, keeping it off the critical path.
 */
export default function LocationInput({
  id, name, value, onChange, placeholder, required = true, disabled = false,
  showCurrentLocation = true, describedBy, autoLocate = false,
}) {
  const autoId = useId();
  const inputId = id || `loc-${autoId}`;
  const listId = `${inputId}-list`;
  const [active, setActive] = useState(false);
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(-1);
  const [options, setOptions] = useState([]);
  const [mapOpen, setMapOpen] = useState(false);
  const engine = useRef(null);
  const wrapper = useRef(null);
  // Auto-detect current location (pickup): silently if permission is already granted,
  // otherwise on first focus of the empty field — never on page load with a prompt.
  const [autoReq, setAutoReq] = useState(false);
  const askedRef = useRef(false);
  const valueRef = useRef(value);
  useEffect(() => { valueRef.current = value; }, [value]);
  const canAutoFill = useCallback(() => !valueRef.current, []);

  useEffect(() => {
    if (!autoLocate || !navigator.permissions?.query) return;
    let alive = true;
    navigator.permissions.query({ name: 'geolocation' })
      .then((st) => {
        if (alive && st.state === 'granted' && !valueRef.current) { askedRef.current = true; setActive(true); setAutoReq(true); }
      })
      .catch(() => {});
    return () => { alive = false; };
  }, [autoLocate]);

  const emit = useCallback((val, coords = null) => onChange({ target: { name, value: val, coords } }), [name, onChange]);

  useEffect(() => {
    const onDown = (e) => { if (wrapper.current && !wrapper.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, []);

  const choose = (opt) => {
    setOpen(false);
    setHighlight(-1);
    if (!opt) return;
    if (opt.kind === 'map') { setMapOpen(true); return; }
    engine.current?.select(opt);
  };

  const onKeyDown = (e) => {
    if (!open && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) { setOpen(true); return; }
    if (!open) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); setHighlight((h) => Math.min(options.length - 1, h + 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setHighlight((h) => Math.max(-1, h - 1)); }
    else if (e.key === 'Enter' && highlight >= 0) { e.preventDefault(); choose(options[highlight]); }
    else if (e.key === 'Escape') { setOpen(false); setHighlight(-1); }
  };

  const activeOpt = open && highlight >= 0 ? `${listId}-${highlight}` : undefined;

  return (
    <div ref={wrapper} style={{ position: 'relative' }} onPointerEnter={() => setActive(true)}>
      <input
        id={inputId}
        className="fld__input"
        type="text"
        name={name}
        value={value}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        autoComplete="off"
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={open && options.length > 0}
        aria-controls={listId}
        aria-activedescendant={activeOpt}
        aria-describedby={describedBy}
        onFocus={() => {
          setActive(true); setOpen(true);
          if (autoLocate && !value && !askedRef.current) { askedRef.current = true; setAutoReq(true); }
        }}
        onBlur={() => setTimeout(() => { if (!value) emit('', null); }, 200)}
        onKeyDown={onKeyDown}
        onChange={(e) => {
          const val = e.target.value;
          emit(val, null);
          setOpen(true);
          setHighlight(-1);
          engine.current?.query(val);
        }}
      />

      {active && (
        <Suspense fallback={null}>
        <PlacesEngine
          ref={engine}
          showCurrentLocation={showCurrentLocation}
          onOptions={setOptions}
          onPick={emit}
          autoLocate={autoReq}
          canAutoFill={canAutoFill}
        />
        </Suspense>
      )}

      {open && options.length > 0 && (
        <ul id={listId} role="listbox" className="ac-list" aria-label="Address suggestions">
          {options.map((opt, i) => (
            <li
              key={opt.key}
              id={`${listId}-${i}`}
              role="option"
              aria-selected={i === highlight}
              className={`ac-opt ${opt.kind !== 'place' ? 'ac-opt--action' : ''}`}
              onMouseDown={(e) => { e.preventDefault(); choose(opt); }}
              onMouseEnter={() => setHighlight(i)}
            >
              <span className="ac-opt__main">{opt.main}</span>
              {opt.sub && <span className="ac-opt__sub">{opt.sub}</span>}
            </li>
          ))}
        </ul>
      )}

      {mapOpen && (
        <Suspense fallback={null}>
        <MapModal
          isOpen={mapOpen}
          onClose={() => setMapOpen(false)}
          onConfirm={(loc) => engine.current?.select({ kind: 'coords', address: loc.address, coords: { lat: loc.lat, lng: loc.lng } })}
        />
        </Suspense>
      )}
    </div>
  );
}
