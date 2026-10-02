import { useEffect, useRef, useState } from "react";
import { SECTIONS, SERVING, TOTAL_MAX, bandFor, emptySheet, totalOf } from "../data/scoresheet";
import { STYLES } from "../data/bjcpStyles";
import { compressImage } from "../lib/image";
import { getPosition, reverseGeocode, searchPlace } from "../lib/geo";
import StylePicker from "./StylePicker";
import ScaleRow from "./ScaleRow";
import FlawsDrawer from "./FlawsDrawer";
import Tip from "./Tip";

export function blankPour() {
  return {
    beer_name: "", brewery: "", style_number: null, style_variant: null, serving: null,
    place_name: "", lat: null, lng: null, photo: null,
    sections: emptySheet(), flaws: {}, comments: "",
  };
}

export default function ScoreForm({ initial, onSave, onCancel }) {
  const [p, setP] = useState(initial || blankPour());
  const [flawsOpen, setFlawsOpen] = useState(false);
  const [busy, setBusy] = useState("");
  const [msg, setMsg] = useState("");
  const [placeQ, setPlaceQ] = useState("");
  const [placeHits, setPlaceHits] = useState([]);
  const fileRef = useRef(null);
  const editing = !!initial?.id;

  useEffect(() => { setP(initial || blankPour()); }, [initial]);

  const set = (patch) => setP((cur) => ({ ...cur, ...patch }));
  const setSection = (key, patch) =>
    setP((cur) => ({ ...cur, sections: { ...cur.sections, [key]: { ...cur.sections[key], ...patch } } }));

  const total = totalOf(p.sections);
  const band = bandFor(total);
  const flawCount = Object.keys(p.flaws).length;
  const unscored = SECTIONS.filter((s) => p.sections[s.key].score == null);
  const st = STYLES.find((s) => s.n === p.style_number)?.st;
  const srmRange = st?.srmmin != null ? [st.srmmin, st.srmmax] : null;

  async function onPhoto(e) {
    const f = e.target.files?.[0];
    if (!f) return;
    setBusy("photo");
    try { set({ photo: await compressImage(f) }); setMsg(""); }
    catch (err) { setMsg(err.message); }
    finally { setBusy(""); e.target.value = ""; }
  }

  async function locate() {
    setBusy("gps"); setMsg("");
    try {
      const { lat, lng } = await getPosition();
      const { name, area } = await reverseGeocode(lat, lng);
      set({ lat, lng, place_name: p.place_name || [name, area].filter(Boolean).join(", ") });
    } catch (err) { setMsg(err.message); }
    finally { setBusy(""); }
  }

  async function findPlace(e) {
    e.preventDefault();
    if (!placeQ.trim()) return;
    setBusy("search"); setMsg("");
    try {
      const hits = await searchPlace(placeQ);
      setPlaceHits(hits);
      if (!hits.length) setMsg(`No places found for "${placeQ}". Try adding the city.`);
    } catch { setMsg("Place search isn't reachable right now. Type the name and save without a pin."); }
    finally { setBusy(""); }
  }

  async function save() {
    if (!p.beer_name.trim()) { setMsg("Add the beer's name before saving."); window.scrollTo({ top: 0, behavior: "smooth" }); return; }
    setBusy("save"); setMsg("");
    const style = STYLES.find((s) => s.n === p.style_number);
    try {
      await onSave({ ...p, style_name: style?.name || null, total });
      if (!editing) setP(blankPour());
    } catch (err) { setMsg(err.message || "Couldn't save. Check the connection and try again."); }
    finally { setBusy(""); }
  }

  return (
    <div className="form">
      <section className="block">
        <div className="photo-row">
          {/* A label wrapping the input is the most reliable tap target on iOS and Android.
              No "capture" attribute, so phones offer both the camera and the photo library. */}
          <label className={"photo" + (p.photo ? " has" : "")}>
            {p.photo ? <img src={p.photo} alt="Your photo of the beer" /> : <span>{busy === "photo" ? "Processing" : "Add photo"}</span>}
            <input ref={fileRef} className="file-input" type="file" accept="image/*,.heic,.heif" onChange={onPhoto} />
          </label>
          <div className="photo-fields">
            <label className="lbl">Beer<input className="field" value={p.beer_name} onChange={(e) => set({ beer_name: e.target.value })} placeholder="Name on the tap list" /></label>
            <label className="lbl">Brewery<input className="field" value={p.brewery} onChange={(e) => set({ brewery: e.target.value })} placeholder="Who brewed it" /></label>
          </div>
        </div>
        {p.photo && <p className="small photo-actions"><button type="button" className="link" onClick={() => fileRef.current?.click()}>Replace photo</button> <button type="button" className="link" onClick={() => set({ photo: null })}>Remove photo</button></p>}

        <div className="lbl">Style</div>
        <StylePicker value={p.style_number} variant={p.style_variant}
          onChange={(n, v) => set({ style_number: n, style_variant: v })} />

        <div className="lbl">Served</div>
        <div className="pills">
          {SERVING.map((s) => (
            <button key={s} type="button" aria-pressed={p.serving === s} className={"pill" + (p.serving === s ? " on" : "")}
              onClick={() => set({ serving: p.serving === s ? null : s })}>{s}</button>
          ))}
        </div>

        <div className="lbl">Where you drank it</div>
        <div className="where">
          <input className="field" value={p.place_name} onChange={(e) => set({ place_name: e.target.value })} placeholder="Bar, taproom, home" />
          <button type="button" className="btn-quiet" onClick={locate} disabled={busy === "gps"}>{busy === "gps" ? "Locating" : "Use my location"}</button>
        </div>
        <form className="where-search" onSubmit={findPlace}>
          <input className="field" value={placeQ} onChange={(e) => setPlaceQ(e.target.value)} placeholder="Or search for a place" />
          <button className="btn-quiet" disabled={busy === "search"}>{busy === "search" ? "Searching" : "Search"}</button>
        </form>
        {placeHits.length > 0 && (
          <ul className="hits">
            {placeHits.map((h, i) => (
              <li key={i}><button type="button" onClick={() => { set({ lat: h.lat, lng: h.lng, place_name: p.place_name || h.name }); setPlaceHits([]); setPlaceQ(""); }}>{h.label}</button></li>
            ))}
          </ul>
        )}
        <p className="small muted">{p.lat != null ? `Pinned at ${p.lat.toFixed(4)}, ${p.lng.toFixed(4)}` : "No map pin yet"}{p.lat != null && <> · <button type="button" className="link" onClick={() => set({ lat: null, lng: null })}>clear pin</button></>}</p>
      </section>

      {SECTIONS.map((s) => (
        <SheetSection key={s.key} s={s} sec={p.sections[s.key]} srmRange={srmRange} onChange={(patch) => setSection(s.key, patch)} />
      ))}

      <section className="block">
        <label className="lbl" htmlFor="comments">Comments</label>
        <textarea id="comments" className="field area" rows={5} value={p.comments}
          onChange={(e) => set({ comments: e.target.value })}
          placeholder="Style fit, what stood out, what you'd tell the brewer" />
      </section>

      {msg && <p className="msg" role="alert">{msg}</p>}
      {editing && <button type="button" className="link pad" onClick={onCancel}>Cancel editing</button>}

      <div className="scorebar">
        <button type="button" className={"flaw-btn" + (flawCount ? " has" : "")} onClick={() => setFlawsOpen(true)}>
          Flaws{flawCount ? ` · ${flawCount}` : ""}
        </button>
        <div className="tally" aria-live="polite">
          <span className="tally-num">{total}</span><span className="tally-max">/{TOTAL_MAX}</span>
          <span className="tally-band">{unscored.length === SECTIONS.length ? "Not scored" : band.label}</span>
        </div>
        <button type="button" className="btn" onClick={save} disabled={busy === "save"}>
          {busy === "save" ? "Saving" : editing ? "Save changes" : "Save"}
        </button>
      </div>

      <FlawsDrawer open={flawsOpen} flaws={p.flaws} onChange={(flaws) => set({ flaws })} onClose={() => setFlawsOpen(false)} />
    </div>
  );
}

function ScoreBox({ max, value, label, onChange }) {
  const v = value ?? null;
  const bump = (d) => onChange(Math.max(0, Math.min(max, (v ?? Math.round(max * 0.6)) + (v == null ? 0 : d))));
  return (
    <div className="scorebox">
      <button type="button" aria-label={`Lower ${label} score`} onClick={() => bump(-1)}>−</button>
      <input
        inputMode="numeric"
        aria-label={`${label} score out of ${max}`}
        value={v ?? ""}
        placeholder="–"
        onChange={(e) => {
          const t = e.target.value.replace(/\D/g, "");
          onChange(t === "" ? null : Math.min(max, Number(t)));
        }}
      />
      <span className="scorebox-max">/{max}</span>
      <button type="button" aria-label={`Raise ${label} score`} onClick={() => bump(1)}>+</button>
    </div>
  );
}

function SheetSection({ s, sec, srmRange, onChange }) {
  const [open, setOpen] = useState(false);
  return (
    <section className="block sheet">
      <header className="sheet-head">
        <h2><button type="button" className="sheet-title" aria-expanded={open} onClick={() => setOpen(!open)}>{s.label}</button></h2>
        <ScoreBox max={s.max} value={sec.score} label={s.label} onChange={(score) => onChange({ score })} />
      </header>
      {open && <Tip tip={s.tip} />}
      {s.rows.map((r) => (
        <ScaleRow key={r.key} row={r} value={sec.rows[r.key] ?? null} off={sec.off?.[r.key]} tags={sec.tags?.[r.key]}
          srmRange={r.key === "color" ? srmRange : null}
          onChange={(v) => { const rows = { ...sec.rows }; if (v == null) delete rows[r.key]; else rows[r.key] = v; onChange({ rows }); }}
          onToggleOff={() => { const off = { ...(sec.off || {}) }; if (off[r.key]) delete off[r.key]; else off[r.key] = true; onChange({ off }); }}
          onTags={(list) => { const tags = { ...(sec.tags || {}) }; if (list.length) tags[r.key] = list; else delete tags[r.key]; onChange({ tags }); }} />
      ))}
    </section>
  );
}
