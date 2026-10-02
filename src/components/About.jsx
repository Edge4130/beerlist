import { APP_NAME } from "../config";
import { GUIDELINES_VERSION } from "../data/bjcpStyles";
import { storageMode } from "../lib/store";

export default function About({ onClose }) {
  return (
    <div className="modal" role="dialog" aria-label={`About ${APP_NAME}`} onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <h2>About {APP_NAME}</h2>
        <p>A personal scoresheet for judging beer against style.</p>
        <h3>BJCP credit</h3>
        <p>
          Style names, numbering, parameters and overall impressions come from the {GUIDELINES_VERSION} BJCP Beer Style
          Guidelines, used with the permission of the BJCP. Copyright 2021, Beer Judge Certification Program, Inc.
        </p>
        <p>The scoresheet layout is adapted from the BJCP Beer Scoresheet, Copyright 2019, Beer Judge Certification Program, Inc.</p>
        <p>The most current guidelines are at <a href="https://www.bjcp.org" target="_blank" rel="noreferrer">www.bjcp.org</a>.</p>
        <p className="small muted">Maps use OpenStreetMap data. Entries are stored {storageMode === "cloud" ? "in your database" : "in this browser only"}.</p>
        <button type="button" className="btn" onClick={onClose}>Close</button>
      </div>
    </div>
  );
}
