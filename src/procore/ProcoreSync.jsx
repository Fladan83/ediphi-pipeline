// ══════════════════════════════════════════════════════════════════════════════
// ProcoreSync — Push/Pull integration between Ediphi and Procore
// Standalone component for easy extraction into Ediphi core later.
// ══════════════════════════════════════════════════════════════════════════════
import { useState, useEffect } from "react";
import ProcoreAPI from "./procoreApi.js";
import { normalizeProcoreLine, ediphiToProcore, matchWbsCode, buildWbsLookup, syncSummary } from "./fieldMapper.js";

// ── Shared UI helpers ──────────────────────────────────────────────────────
const Badge = ({ color, children }) => {
  const colors = {
    green:"bg-green-100 text-green-700", red:"bg-red-100 text-red-700",
    blue:"bg-blue-100 text-blue-700", yellow:"bg-yellow-100 text-yellow-700",
    gray:"bg-gray-100 text-gray-600", purple:"bg-purple-100 text-purple-700",
    teal:"bg-teal-100 text-teal-700", orange:"bg-orange-100 text-orange-700",
  };
  return <span className={`px-2 py-0.5 rounded text-xs font-semibold ${colors[color]||colors.gray}`}>{children}</span>;
};

const StepBar = ({ steps, step }) => (
  <div className="flex items-center gap-1 mb-5">
    {steps.map((s, i) => (
      <div key={i} className="flex items-center gap-1 flex-1">
        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all
          ${i < step ? "bg-teal-600 border-teal-600 text-white" : i === step ? "border-teal-500 text-teal-600 bg-teal-50" : "border-gray-200 text-gray-400"}`}>
          {i < step ? "✓" : i + 1}
        </div>
        <span className={`text-xs font-medium hidden sm:inline ${i <= step ? "text-teal-700" : "text-gray-400"}`}>{s}</span>
        {i < steps.length - 1 && <div className={`flex-1 h-0.5 mx-1 ${i < step ? "bg-teal-400" : "bg-gray-200"}`} />}
      </div>
    ))}
  </div>
);

// ══════════════════════════════════════════════════════════════════════════════
// ── MAIN COMPONENT ──────────────────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════════════════
const STEPS = ["Connect", "Select Project", "Review Data", "Sync"];

export default function ProcoreSync({ session, upcItems, estimateItems, target }) {
  const [step, setStep] = useState(0);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  // Connection state
  const [connected, setConnected] = useState(false);
  const [companies, setCompanies] = useState([]);
  const [selectedCompany, setSelectedCompany] = useState(null);

  // Project state
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);

  // Data state
  const [direction, setDirection] = useState("pull"); // "pull" or "push"
  const [budgetLines, setBudgetLines] = useState([]);
  const [normalizedLines, setNormalizedLines] = useState([]);
  const [syncResults, setSyncResults] = useState([]);

  // ── Step 0: Connect ────────────────────────────────────────────────────
  const testConnection = async () => {
    setLoading(true); setErr("");
    try {
      await ProcoreAPI.validateAuth();
      const comps = await ProcoreAPI.listCompanies();
      setCompanies(comps || []);
      setConnected(true);
      if (comps && comps.length === 1) {
        setSelectedCompany(comps[0]);
      }
    } catch (e) {
      setErr(`Connection failed: ${e.message}`);
    }
    setLoading(false);
  };

  const proceedFromConnect = async () => {
    if (!selectedCompany) return;
    setLoading(true); setErr("");
    try {
      const projs = await ProcoreAPI.listProjects(selectedCompany.id);
      setProjects(projs || []);
      setStep(1);
    } catch (e) {
      setErr(`Failed to load projects: ${e.message}`);
    }
    setLoading(false);
  };

  // ── Step 1: Select Project ─────────────────────────────────────────────
  const selectProject = async (proj) => {
    setSelectedProject(proj);
    setLoading(true); setErr("");
    try {
      const lines = await ProcoreAPI.listBudgetLineItems(proj.id, selectedCompany.id);
      setBudgetLines(lines || []);
      setNormalizedLines((lines || []).map(normalizeProcoreLine));
      setStep(2);
    } catch (e) {
      setErr(`Failed to load budget: ${e.message}`);
    }
    setLoading(false);
  };

  // ── Step 3: Sync ──────────────────────────────────────────────────────
  const runPullSync = () => {
    // Pull: transform Procore budget lines into Ediphi-compatible data
    // For now, generate a CSV download (same format as takeoff export)
    const cols = ["id", "name", "product", "quantity"];
    const esc = v => { const s = String(v ?? ""); return s.includes(",") ? `"${s.replace(/"/g, '""')}"` : s; };
    const lines = normalizedLines.map(l => ["", l.name, "", l.quantity].map(esc).join(","));
    const csv = [cols.join(","), ...lines].join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = `procore_pull_${selectedProject.name.replace(/\s+/g, "_")}_${Date.now()}.csv`;
    a.click();
    setSyncResults(normalizedLines.map(l => ({ name: l.name, action: "exported" })));
    setStep(3);
  };

  const runPushSync = async () => {
    if (!estimateItems || !estimateItems.length) {
      setErr("No Ediphi estimate items to push. Load an estimate first.");
      return;
    }
    setLoading(true); setErr("");
    try {
      // Load WBS codes for mapping
      const wbsCodes = await ProcoreAPI.listWbsCodes(selectedProject.id, selectedCompany.id);
      const wbsLookup = buildWbsLookup(wbsCodes);

      const results = [];
      for (const item of estimateItems) {
        try {
          const wbs = matchWbsCode(item, wbsLookup);
          const payload = ediphiToProcore(item, wbs ? wbs.id : null);
          await ProcoreAPI.createBudgetLineItem(selectedProject.id, selectedCompany.id, payload);
          results.push({ name: item.name, action: "created" });
        } catch (e) {
          results.push({ name: item.name, action: "error", error: e.message });
        }
      }
      setSyncResults(results);
      setStep(3);
    } catch (e) {
      setErr(`Push failed: ${e.message}`);
    }
    setLoading(false);
  };

  // ── Render ─────────────────────────────────────────────────────────────
  return (
    <div className="max-w-5xl mx-auto p-5">
      <StepBar steps={STEPS} step={step} />

      {/* ── Step 0: Connect ── */}
      {step === 0 && (
        <div className="bg-white rounded-2xl shadow-sm border p-6">
          <h2 className="font-semibold text-lg mb-1">Connect to Procore</h2>
          <p className="text-sm text-gray-500 mb-4">Authenticate with Procore using server-side credentials.</p>

          {!connected ? (
            <div className="space-y-3">
              <button onClick={testConnection} disabled={loading}
                className="w-full py-2.5 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white rounded-xl text-sm font-semibold">
                {loading ? "Connecting…" : "Test Connection"}
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm font-medium">
                ✓ Connected to Procore
              </div>

              {companies.length > 1 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Select Company</label>
                  <select value={selectedCompany?.id || ""} onChange={e => setSelectedCompany(companies.find(c => c.id === parseInt(e.target.value)))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500">
                    <option value="">— Choose company —</option>
                    {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              )}

              {selectedCompany && (
                <div className="flex items-center gap-2">
                  <Badge color="teal">{selectedCompany.name}</Badge>
                  <span className="text-xs text-gray-400">Company ID: {selectedCompany.id}</span>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Sync Direction</label>
                <div className="grid grid-cols-2 gap-3">
                  <button onClick={() => setDirection("pull")}
                    className={`p-3 border-2 rounded-xl text-left transition-all ${direction === "pull" ? "border-teal-500 bg-teal-50" : "border-gray-200 hover:border-gray-300"}`}>
                    <p className="font-semibold text-sm">Pull from Procore</p>
                    <p className="text-xs text-gray-500 mt-1">Import budget line items into Ediphi</p>
                  </button>
                  <button onClick={() => setDirection("push")}
                    className={`p-3 border-2 rounded-xl text-left transition-all ${direction === "push" ? "border-teal-500 bg-teal-50" : "border-gray-200 hover:border-gray-300"}`}>
                    <p className="font-semibold text-sm">Push to Procore</p>
                    <p className="text-xs text-gray-500 mt-1">Export Ediphi estimate to Procore budget</p>
                  </button>
                </div>
              </div>

              <div className="flex justify-end">
                <button onClick={proceedFromConnect} disabled={!selectedCompany || loading}
                  className="px-5 py-2 bg-teal-600 text-white rounded-lg text-sm font-medium disabled:opacity-40 hover:bg-teal-700">
                  {loading ? "Loading projects…" : "Next →"}
                </button>
              </div>
            </div>
          )}

          {err && <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{err}</div>}
        </div>
      )}

      {/* ── Step 1: Select Project ── */}
      {step === 1 && (
        <div className="bg-white rounded-2xl shadow-sm border p-6">
          <h2 className="font-semibold text-lg mb-1">Select Procore Project</h2>
          <p className="text-sm text-gray-500 mb-4">{projects.length} projects found in {selectedCompany?.name}</p>

          <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
            {projects.map(p => (
              <button key={p.id} onClick={() => selectProject(p)}
                className="w-full text-left p-3 border rounded-xl hover:bg-teal-50 hover:border-teal-300 transition-all">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm text-gray-800">{p.name}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {p.project_number && <span>#{p.project_number} · </span>}
                      {p.stage || "Active"}
                    </p>
                  </div>
                  <Badge color="gray">ID: {p.id}</Badge>
                </div>
              </button>
            ))}
            {projects.length === 0 && !loading && (
              <p className="text-sm text-gray-400 italic text-center py-4">No projects found.</p>
            )}
          </div>

          {loading && <div className="text-center py-4 text-teal-600 text-sm">Loading budget data…</div>}
          {err && <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{err}</div>}

          <div className="mt-4">
            <button onClick={() => setStep(0)} className="px-4 py-2 border rounded-lg text-sm text-gray-600 hover:bg-gray-50">← Back</button>
          </div>
        </div>
      )}

      {/* ── Step 2: Review Data ── */}
      {step === 2 && (
        <div className="bg-white rounded-2xl shadow-sm border p-6">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="font-semibold text-lg">{direction === "pull" ? "Procore Budget Data" : "Ediphi → Procore Preview"}</h2>
              <p className="text-xs text-gray-500 mt-0.5">{selectedProject?.name}</p>
            </div>
            <div className="flex gap-2">
              <Badge color="teal">{direction === "pull" ? normalizedLines.length : (estimateItems?.length || 0)} items</Badge>
              <Badge color={direction === "pull" ? "blue" : "orange"}>{direction === "pull" ? "Pull" : "Push"}</Badge>
            </div>
          </div>

          {direction === "pull" && (
            <div className="overflow-auto max-h-[400px] border rounded-lg mb-4">
              <table className="text-xs w-full">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    {["#", "Name", "UoM", "Qty", "Unit Cost", "Amount", "Cost Code"].map(h => (
                      <th key={h} className="px-3 py-2 text-left font-medium text-gray-600 border-b whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {normalizedLines.map((l, i) => (
                    <tr key={i} className="border-b hover:bg-gray-50">
                      <td className="px-3 py-1.5 text-gray-400">{i + 1}</td>
                      <td className="px-3 py-1.5 max-w-48 truncate font-medium">{l.name}</td>
                      <td className="px-3 py-1.5">{l.uom || "—"}</td>
                      <td className="px-3 py-1.5">{l.quantity}</td>
                      <td className="px-3 py-1.5">{l.unit_cost ? `$${l.unit_cost.toFixed(2)}` : "—"}</td>
                      <td className="px-3 py-1.5">{l.amount ? `$${l.amount.toFixed(2)}` : "—"}</td>
                      <td className="px-3 py-1.5 font-mono">{l.cost_code || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {direction === "push" && estimateItems && (
            <div className="overflow-auto max-h-[400px] border rounded-lg mb-4">
              <table className="text-xs w-full">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    {["#", "Name", "UoM", "Qty", "Unit Cost"].map(h => (
                      <th key={h} className="px-3 py-2 text-left font-medium text-gray-600 border-b whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {estimateItems.map((l, i) => (
                    <tr key={i} className="border-b hover:bg-gray-50">
                      <td className="px-3 py-1.5 text-gray-400">{i + 1}</td>
                      <td className="px-3 py-1.5 max-w-48 truncate font-medium">{l.name}</td>
                      <td className="px-3 py-1.5">{l.uom || "—"}</td>
                      <td className="px-3 py-1.5">{l.quantity ?? "—"}</td>
                      <td className="px-3 py-1.5">{l.total_uc ? `$${parseFloat(l.total_uc).toFixed(2)}` : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {direction === "push" && (!estimateItems || !estimateItems.length) && (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-700 text-sm mb-4">
              No Ediphi estimate items loaded. Go back and select a project with an estimate first.
            </div>
          )}

          {err && <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{err}</div>}

          <div className="flex justify-between">
            <button onClick={() => setStep(1)} className="px-4 py-2 border rounded-lg text-sm text-gray-600 hover:bg-gray-50">← Back</button>
            <button
              onClick={direction === "pull" ? runPullSync : runPushSync}
              disabled={loading || (direction === "pull" && normalizedLines.length === 0) || (direction === "push" && (!estimateItems || !estimateItems.length))}
              className="px-5 py-2 bg-teal-600 text-white rounded-lg text-sm font-medium disabled:opacity-40 hover:bg-teal-700">
              {loading ? "Syncing…" : direction === "pull" ? `Export ${normalizedLines.length} Items →` : `Push ${estimateItems?.length || 0} Items to Procore →`}
            </button>
          </div>
        </div>
      )}

      {/* ── Step 3: Results ── */}
      {step === 3 && (
        <div className="bg-white rounded-2xl shadow-sm border p-6">
          <h2 className="font-semibold text-lg mb-3">Sync Complete</h2>
          <div className="flex gap-2 mb-4">
            {(() => {
              const s = syncSummary(syncResults);
              return (
                <>
                  <Badge color="green">{s.created || s.total} {direction === "pull" ? "exported" : "created"}</Badge>
                  {s.updated > 0 && <Badge color="blue">{s.updated} updated</Badge>}
                  {s.skipped > 0 && <Badge color="yellow">{s.skipped} skipped</Badge>}
                  {s.errors > 0 && <Badge color="red">{s.errors} errors</Badge>}
                </>
              );
            })()}
          </div>

          <div className="overflow-auto max-h-[300px] border rounded-lg mb-4">
            <table className="text-xs w-full">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="px-3 py-2 text-left font-medium text-gray-600 border-b">#</th>
                  <th className="px-3 py-2 text-left font-medium text-gray-600 border-b">Name</th>
                  <th className="px-3 py-2 text-left font-medium text-gray-600 border-b">Status</th>
                </tr>
              </thead>
              <tbody>
                {syncResults.map((r, i) => (
                  <tr key={i} className="border-b">
                    <td className="px-3 py-1.5 text-gray-400">{i + 1}</td>
                    <td className="px-3 py-1.5 max-w-48 truncate">{r.name}</td>
                    <td className="px-3 py-1.5">
                      <Badge color={r.action === "error" ? "red" : r.action === "skipped" ? "yellow" : "green"}>
                        {r.action}{r.error ? `: ${r.error}` : ""}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex justify-between">
            <button onClick={() => { setStep(0); setSyncResults([]); setBudgetLines([]); setNormalizedLines([]); setSelectedProject(null); }}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm">↺ Start Over</button>
          </div>
        </div>
      )}
    </div>
  );
}
