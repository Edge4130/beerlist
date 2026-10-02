import { useMemo, useState } from "react";
import { SECTIONS, FLAWS, TOTAL_MAX, bandFor } from "../data/scoresheet";

const colorRow = SECTIONS.find((s) => s.key === "appearance").rows.find((r) => r.key === "color");

export default function LogView({ pours, onEdit, onDelete, onScore }) {
  const [sort, setSort] = useState("new");
  const [openId, setOpenId] = useState(null);
  const [photo, setPhoto] = useState(null);
  const list = useMemo(() => {
    const l = [...pours];
    if (sort === "top") l.sort((a, b) => (b.total ?? 0) - (a.total ?? 0));
    return l;
  }, [pours, sort]);

  if (!pours.length) {
    return (
      <div className="empty">
        <p>No beers scored yet.</p>
        <button type="button" className="btn" onClick={onScore}>Score your first beer</button>
      </div>
    );
  }

  return (
    <div className="log">
      <div className="log-tools">
        <span className="muted small">{pours.length} {pours.length === 1 ? "beer" : "beers"}</span>
        <div className="pills">
          <button type="button" className={"pill" + (sort === "new" ? " on" : "")} aria-pressed={sort === "new"} onClick={() => setSort("new")}>Newest</button>
          <button type="button" className={"pill" + (sort === "top" ? " on" : "")} aria-pressed={sort === "top"} onClick={() => setSort("top")}>Highest</button>
        </div>
      </div>
      {list.map((p) => {
        const color = p.sections?.appearance?.rows?.color;
        const band = bandFor(p.total ?? 0);
        const open = openId === p.id;
        return (
          <article key={p.id} className={"entry" + (open ? " open" : "")}>
            <button type="button" className="entry-head" aria-expanded={open} onClick={() => setOpenId(open ? null : p.id)}>
              <span className="entry-glass" style={{ background: color != null ? colorRow.swatch[color] : "var(--line)" }} aria-hidden="true" />
              {p.photo && <img className="entry-thumb" src={p.photo} alt="" />}
              <span className="entry-text">
                <span className="entry-name">{p.beer_name}</span>
                <span className="entry-meta">{[p.brewery, p.style_number && `${p.style_number} ${p.style_name || ""}${p.style_variant ? `, ${p.style_variant}` : ""}`].filter(Boolean).join(" / ")}</span>
                <span className="entry-meta">{[p.place_name, new Date(p.created_at).toLocaleDateString()].filter(Boolean).join(", ")}</span>
              </span>
              <span className="entry-score"><b>{p.total ?? 0}</b><small>{band.label}</small></span>
            </button>
            {open && <Detail p={p} onEdit={() => onEdit(p)} onDelete={() => onDelete(p)} onPhoto={() => setPhoto(p.photo)} />}
          </article>
        );
      })}
      {photo && (
        <div className="lightbox" role="dialog" aria-label="Photo" onClick={() => setPhoto(null)}>
          <img src={photo} alt="Beer photo, full size" />
          <button type="button" className="btn-quiet" onClick={() => setPhoto(null)}>Close</button>
        </div>
      )}
    </div>
  );
}

function Detail({ p, onEdit, onDelete, onPhoto }) {
  const flaws = Object.entries(p.flaws || {});
  return (
    <div className="detail">
      {p.photo && <button type="button" className="detail-photo" onClick={onPhoto}><img src={p.photo} alt="Beer photo" /></button>}
      {p.serving && <p className="small muted">Served: {p.serving}</p>}
      <table className="detail-table">
        <tbody>
          {SECTIONS.map((s) => {
            const sec = p.sections?.[s.key] || {};
            const notes = s.rows
              .filter((r) => sec.rows?.[r.key] != null || sec.off?.[r.key] || sec.tags?.[r.key]?.length)
              .map((r) => {
                const v = sec.rows?.[r.key];
                const txt = v == null ? "" : r.ends ? `${v + 1}/${r.scale.length}` : r.scale[v];
                const tags = sec.tags?.[r.key];
                return `${r.label} ${txt}${tags?.length ? ` (${tags.join(", ").toLowerCase()})` : ""}${sec.off?.[r.key] ? ", off-style" : ""}`.trim();
              });
            return (
              <tr key={s.key}>
                <th>{s.label}</th>
                <td className="detail-notes">{notes.join(", ") || <span className="muted">No marks</span>}</td>
                <td className="num">{sec.score ?? "–"}/{s.max}</td>
              </tr>
            );
          })}
          <tr className="detail-total"><th>Total</th><td>{bandFor(p.total ?? 0).label}</td><td className="num">{p.total ?? 0}/{TOTAL_MAX}</td></tr>
        </tbody>
      </table>
      {flaws.length > 0 && (
        <p className="small"><b>Flaws:</b> {flaws.map(([k, l]) => `${FLAWS.find((f) => f.key === k)?.label || k} (${l})`).join(", ")}</p>
      )}
      {p.comments && <p className="detail-comments">{p.comments}</p>}
      <div className="detail-actions">
        <button type="button" className="btn-quiet" onClick={onEdit}>Edit</button>
        <button type="button" className="btn-quiet danger" onClick={onDelete}>Delete</button>
      </div>
    </div>
  );
}
