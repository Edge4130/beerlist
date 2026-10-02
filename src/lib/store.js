import { supabase } from "./supabaseClient";

const TABLE = "beer_pours"; // lives beside WingList's "ratings" table in the same Supabase project
const LOCAL_KEY = "beerlist:pours";

export const storageMode = supabase ? "cloud" : "local";

function readLocal() {
  try { return JSON.parse(localStorage.getItem(LOCAL_KEY) || "[]"); } catch { return []; }
}
function writeLocal(rows) {
  try { localStorage.setItem(LOCAL_KEY, JSON.stringify(rows)); return true; } catch { return false; }
}

export async function listPours() {
  if (!supabase) return readLocal().sort((a, b) => b.created_at.localeCompare(a.created_at));
  const { data, error } = await supabase.from(TABLE).select("*").order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function savePour(pour) {
  const row = { ...pour, updated_at: new Date().toISOString() };
  if (!row.id) row.id = crypto.randomUUID();
  if (!row.created_at) row.created_at = row.updated_at;
  if (!supabase) {
    const rows = readLocal().filter((r) => r.id !== row.id);
    rows.push(row);
    if (!writeLocal(rows)) throw new Error("This browser is out of storage space. Remove a few photos or connect Supabase.");
    return row;
  }
  const { data, error } = await supabase.from(TABLE).upsert(row).select().single();
  if (error) throw error;
  return data;
}

export async function deletePour(id) {
  if (!supabase) { writeLocal(readLocal().filter((r) => r.id !== id)); return; }
  const { error } = await supabase.from(TABLE).delete().eq("id", id);
  if (error) throw error;
}
