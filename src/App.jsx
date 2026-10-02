import { useCallback, useEffect, useState } from "react";
import { APP_NAME } from "./config";
import { listPours, savePour, deletePour, storageMode } from "./lib/store";
import ScoreForm from "./components/ScoreForm";
import LogView from "./components/LogView";
import MapView from "./components/MapView";
import About from "./components/About";

const TABS = [
  { key: "score", label: "Score" },
  { key: "log", label: "Log" },
  { key: "map", label: "Map" },
];

// Edit and delete sit behind a passcode, like WingList. Set VITE_ADMIN_CODE in Vercel.
// This keeps casual visitors out of edit/delete; it is not real security.
const ADMIN_CODE = import.meta.env.VITE_ADMIN_CODE;
function unlock() {
  if (!ADMIN_CODE) return true;
  try { if (sessionStorage.getItem("beerlist:admin") === "1") return true; } catch { /* ignore */ }
  const entered = window.prompt("Enter the admin passcode to edit or delete.");
  if (entered === null) return false;
  if (entered.trim() !== ADMIN_CODE) { window.alert("That passcode didn't match."); return false; }
  try { sessionStorage.setItem("beerlist:admin", "1"); } catch { /* ignore */ }
  return true;
}

export default function App() {
  const [tab, setTab] = useState("score");
  const [pours, setPours] = useState([]);
  const [loadErr, setLoadErr] = useState("");
  const [editing, setEditing] = useState(null);
  const [about, setAbout] = useState(false);
  const [toast, setToast] = useState("");

  const refresh = useCallback(async () => {
    try { setPours(await listPours()); setLoadErr(""); }
    catch { setLoadErr("Couldn't load your log. Check the connection, then reload."); }
  }, []);
  useEffect(() => { refresh(); }, [refresh]);
  useEffect(() => { if (!toast) return; const t = setTimeout(() => setToast(""), 2400); return () => clearTimeout(t); }, [toast]);

  async function handleSave(p) {
    await savePour(p);
    await refresh();
    setToast(editing ? "Changes saved" : "Saved to your log");
    setEditing(null);
    setTab("log");
    window.scrollTo({ top: 0 });
  }

  async function handleDelete(p) {
    if (!unlock()) return;
    if (!window.confirm(`Delete ${p.beer_name}? This can't be undone.`)) return;
    try { await deletePour(p.id); await refresh(); setToast("Deleted"); }
    catch { setToast("Couldn't delete. Try again."); }
  }

  return (
    <div className="app">
      <header className="top">
        <div className="brand">
          <Mark />
          <span className="brand-name">{APP_NAME}</span>
        </div>
        <button type="button" className="btn-quiet on-dark" onClick={() => setAbout(true)}>About</button>
      </header>
      <nav className="tabs" aria-label="Views">
        {TABS.map((t) => (
          <button key={t.key} type="button" className={"tab" + (tab === t.key ? " on" : "")} aria-current={tab === t.key ? "page" : undefined}
            onClick={() => { setTab(t.key); if (t.key !== "score") setEditing(null); }}>
            {t.key === "score" && editing ? "Editing" : t.label}
          </button>
        ))}
      </nav>
      {storageMode === "local" && <p className="banner">Preview mode: entries are saved in this browser only.</p>}
      {loadErr && <p className="msg pad">{loadErr}</p>}

      <main className="main">
        {tab === "score" && <ScoreForm initial={editing} onSave={handleSave} onCancel={() => { setEditing(null); setTab("log"); }} />}
        {tab === "log" && <LogView pours={pours} onScore={() => setTab("score")} onEdit={(p) => { if (!unlock()) return; setEditing(p); setTab("score"); window.scrollTo({ top: 0 }); }} onDelete={handleDelete} />}
        {tab === "map" && <MapView pours={pours} />}
      </main>

      {about && <About onClose={() => setAbout(false)} />}
      {toast && <div className="toast" role="status">{toast}</div>}
    </div>
  );
}

function Mark() {
  // A tulip glass with a filled line, the sheet's score box idea.
  return (
    <svg className="mark" viewBox="0 0 32 32" aria-hidden="true">
      <path d="M9 4h14c0 7-1.6 11-4.5 13.2V24h3.5v3H10v-3h3.5v-6.8C10.6 15 9 11 9 4z" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="M10.2 9h11.6c-.4 3.6-1.6 6-3.6 7.2h-4.4c-2-1.2-3.2-3.6-3.6-7.2z" fill="var(--amber)" />
    </svg>
  );
}
