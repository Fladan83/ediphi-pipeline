import { useState, useRef, useEffect } from "react";
import * as XLSX from "xlsx";
import Papa from "papaparse";

// ══════════════════════════════════════════════════════════════════════════════
// ── SAMPLE TEST DATA ─────────────────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════════════════
const SAMPLE_UPC = `id,name,uom,item_code,category,pending,mf1_code,mf1_desc,mf2_code,mf2_desc,mf3_code,mf3_desc,uf1_code,uf1_desc,uf2_code,uf2_desc,uf3_code,uf3_desc,Bid Package_code,Bid Package_desc
upc-001,Concrete Wall - 8in Thick,CY,03310.001,Concrete,false,03 00 00,Concrete,03 31 00,Structural Concrete,03 31 13,Heavyweight Structural Concrete,B,Shell,B10,Superstructure,B1010,Floor Construction,330,Concrete
upc-002,Concrete Wall - 8in Thick,SF,03310.002,Concrete,false,03 00 00,Concrete,03 31 00,Structural Concrete,03 31 13,Heavyweight Structural Concrete,B,Shell,B10,Superstructure,B1010,Floor Construction,330,Concrete
upc-003,Concrete Slab on Grade,SF,03301.001,Concrete,false,03 00 00,Concrete,03 31 00,Structural Concrete,03 31 16,Normal-Weight Structural Concrete,A,Substructure,A10,Foundations,A1010,Standard Foundations,330,Concrete
upc-004,Shear Walls,CY,03310.003,Concrete,false,03 00 00,Concrete,03 31 00,Structural Concrete,03 31 13,Heavyweight Structural Concrete,B,Shell,B10,Superstructure,B1010,Floor Construction,330,Concrete
upc-005,Gypsum Board Assembly - 3 5/8in Stud,LF,09216.001,Drywall,false,09 00 00,Finishes,09 21 00,Plaster and Gypsum Board Assemblies,09 21 16,Gypsum Board Assemblies,C,Interiors,C10,Interior Construction,C1010,Interior Partitions,920,Drywall
upc-006,Gypsum Board Assembly - 6in Stud,LF,09216.002,Drywall,false,09 00 00,Finishes,09 21 00,Plaster and Gypsum Board Assemblies,09 21 16,Gypsum Board Assemblies,C,Interiors,C10,Interior Construction,C1010,Interior Partitions,920,Drywall
upc-007,Luxury Vinyl Tile - Commercial Grade,SF,09651.001,Flooring,false,09 00 00,Finishes,09 65 00,Resilient Flooring,09 65 43,Linoleum Flooring,C,Interiors,C20,Interior Finishes,C2030,Flooring,965,Resilient Flooring
upc-008,Carpet - Broadloom,SF,09681.001,Flooring,false,09 00 00,Finishes,09 68 00,Carpeting,09 68 16,Sheet Carpeting,C,Interiors,C20,Interior Finishes,C2030,Flooring,968,Carpet
upc-009,Acoustical Panel Ceiling,SF,09511.001,Ceiling,false,09 00 00,Finishes,09 51 00,Acoustical Ceilings,09 51 13,Acoustical Panel Ceilings,C,Interiors,C20,Interior Finishes,C2050,Ceiling Finishes,951,Acoustical Ceilings
upc-010,General Allowance,LS,01210.001,General Requirements,false,01 00 00,General Requirements,01 21 00,Allowances,01 21 13,Cash Allowances,Z,General,Z10,General Requirements,Z1020,Administrative Requirements,100,Temp Conditions
upc-011,General Allowance,EA,01210.002,General Requirements,false,01 00 00,General Requirements,01 21 00,Allowances,01 21 13,Cash Allowances,Z,General,Z10,General Requirements,Z1020,Administrative Requirements,100,Temp Conditions
upc-012,Miscellaneous Metal,LB,05500.001,Metals,false,05 00 00,Metals,05 50 00,Metal Fabrications,05 50 13,Metal Pan Stairs,B,Shell,B10,Superstructure,B1010,Floor Construction,510,Structural Steel
upc-013,Miscellaneous Metal,EA,05500.002,Metals,false,05 00 00,Metals,05 50 00,Metal Fabrications,05 50 13,Metal Pan Stairs,B,Shell,B10,Superstructure,B1010,Floor Construction,510,Structural Steel
upc-014,Fire Protection Mains - Wet Pipe,LF,21131.001,Fire Protection,false,21 00 00,Fire Suppression,21 13 00,Fire-Suppression Sprinkler Systems,21 13 13,Wet-Pipe Sprinkler Systems,D,Services,D40,Fire Protection,D4010,Fire Suppression,2110,Fire Protection
upc-015,Domestic Water Piping - Copper,LF,22111.001,Plumbing,false,22 00 00,Plumbing,22 11 00,Facility Water Distribution,22 11 16,Domestic Water Piping,D,Services,D20,Plumbing,D2010,Domestic Water Distribution,2210,Plumbing
upc-016,Sanitary Waste Piping - PVC,LF,22131.001,Plumbing,false,22 00 00,Plumbing,22 13 00,Facility Sanitary Sewerage,22 13 16,Sanitary Waste and Vent Piping,D,Services,D20,Plumbing,D2020,Sanitary Drainage,2210,Plumbing
upc-017,HVAC Ductwork - Rectangular,LB,23310.001,HVAC,false,23 00 00,HVAC,23 31 00,HVAC Ducts and Casings,23 31 13,Metal Ducts,D,Services,D30,HVAC,D3040,HVAC Distribution,2310,HVAC
upc-018,Electrical Conduit - EMT 3/4in,LF,26050.001,Electrical,false,26 00 00,Electrical,26 05 00,Common Work Results for Electrical,26 05 33,Raceways and Boxes,D,Services,D50,Electrical,D5020,Electrical Service And Distribution,2610,Electrical
upc-019,Temporary Protection - Pending Item,SF,01500.001,General Requirements,true,01 00 00,General Requirements,01 50 00,Temporary Facilities,01 56 00,Temporary Barriers and Enclosures,Z,General,Z10,General Requirements,Z1050,Temporary Facilities And Controls,100,Temp Conditions
upc-020,Selective Demolition,SF,02411.001,Demolition,false,02 00 00,Existing Conditions,02 41 00,Demolition,02 41 19,Selective Demolition,F,Special Construction,F30,Demolition,F3030,Selective Demolition,240,Demolition
upc-021,Structural Steel Framing,TON,05121.001,Structural Steel,false,05 00 00,Metals,05 12 00,Structural Steel Framing,05 12 23,Structural Steel for Buildings,B,Shell,B10,Superstructure,B1010,Floor Construction,510,Structural Steel
upc-022,Masonry - CMU 8in,SF,04220.001,Masonry,false,04 00 00,Masonry,04 22 00,Concrete Unit Masonry,04 22 13,Block Masonry,B,Shell,B20,Exterior Vertical Enclosures,B2010,Exterior Walls,410,Masonry
upc-023,Storefront Glazing System,SF,08410.001,Glazing,false,08 00 00,Openings,08 41 00,Entrances and Storefronts,08 41 13,Aluminum-Framed Storefronts,B,Shell,B20,Exterior Vertical Enclosures,B2020,Exterior Windows,844,Windows & Curtainwall
upc-024,No Sort Fields Item,,99999.001,Uncategorized,false,,,,,,,,,,,,,
upc-025,Progress Cleaning,SF,01741.001,General Requirements,false,01 00 00,General Requirements,01 74 00,Cleaning and Waste Management,01 74 13,Progress Cleaning,Z,General,Z10,General Requirements,Z1070,Execution And Closeout Requirements,101,Final Cleaning
upc-026,Painting - Interior Walls,SF,09910.001,Painting,false,09 00 00,Finishes,09 91 00,Painting,09 91 13,Exterior Painting,C,Interiors,C20,Interior Finishes,C2040,Wall Finishes,990,Painting & Wallcovering
upc-027,Painting - Interior Walls,SF,09910.002,General Requirements,false,09 00 00,Finishes,09 91 00,Painting,09 91 23,Interior Painting,Z,General,Z10,General Requirements,Z1020,Administrative Requirements,990,Painting & Wallcovering
upc-028,Precast Concrete Panels,SF,03410.001,Concrete,false,03 00 00,Concrete,03 41 00,Precast Structural Concrete,03 41 13,Precast Concrete Hollow Core Planks,B,Shell,B20,Exterior Vertical Enclosures,B2010,Exterior Walls,340,Precast Garage
upc-029,Elevator - Hydraulic,EA,14210.001,Equipment,false,14 00 00,Conveying Equipment,14 21 00,Electric Traction Elevators,14 21 13,Electric Traction Freight Elevators,D,Services,D10,Conveying,D1010,Elevators,1421,Elevators
upc-030,Final Cleaning,SF,01742.001,General Requirements,false,01 00 00,General Requirements,01 74 00,Cleaning and Waste Management,01 74 23,Final Cleaning,Z,General,Z10,General Requirements,Z1070,Execution And Closeout Requirements,101,Final Cleaning`;

const SAMPLE_TAKEOFF = `Condition Name,UoM,Quantity,Estimated Cost,MF3 Code,UF3 Code,Bid Package,Category
Concrete Wall - 8in Thick,CY,450,112500,03 31 13,B1010,330,Concrete
Concrete Wall - 8in Thick,SF,8200,41000,03 31 13,B1010,330,Concrete
Concrete Slab on Grade - 5in,SF,24000,96000,03 31 16,A1010,330,Concrete
General Allowance,LS,1,50000,,,100,General Requirements
General Allowance,EA,5,25000,,,100,General Requirements
Miscellaneous Metal,LB,3200,19200,,,510,Metals
Gypsum Board - 3 5/8" Stud 20ga,LF,8400,63000,09 21 16,C1010,920,Drywall
Luxury Vinyl Tile - 3mm Wear Layer,SF,18500,92500,09 65 43,C2030,965,Flooring
Carpet Broadloom 32oz,SF,6200,37200,09 68 16,C2030,968,Flooring
Acoustical Tile Ceiling - 2x4,SF,14000,56000,09 51 13,C2050,951,Ceiling
Temporary Protection,SF,32000,12800,,,100,General Requirements
Fire Sprinkler Mains and Branch Lines,LF,3800,45600,21 13 13,D4010,2110,Fire Protection
Domestic Water - Copper Piping,LF,2200,35200,22 11 16,D2010,2210,Plumbing
Sanitary Waste and Vent - PVC,LF,1800,27000,22 13 16,D2020,2210,Plumbing
Selective Demo - Existing Walls,SF,5500,16500,02 41 19,F3030,240,Demolition
Structural Steel - Wide Flange,TON,85,680000,05 12 23,B1010,510,Structural Steel
Storefront - Aluminum Framed,SF,3200,224000,08 41 13,B2020,844,Glazing
Interior Wall Paint - 2 Coats,SF,42000,63000,09 91 23,C2040,990,Painting
No Sort Fields Condition,EA,10,5000,,,
Elevator - Traction Hydraulic 3500lb,EA,2,420000,14 21 13,D1010,1421,Equipment`;

const SAMPLE_SAGE = `Job Number,Phase Code,Cost Code,Cost Type,Description,Est Qty,Act Qty,Est Cost,Act Cost,Est Hours,Act Hours
J2024-001,03,03-310,L,Structural Concrete - Labor,450,423,45000,43800,1800,1712
J2024-001,03,03-310,M,Structural Concrete - Material,450,423,58500,61200,0,0
J2024-001,03,03-310,E,Structural Concrete - Equipment,450,423,9000,8900,0,0
J2024-001,09,09-216,L,Drywall Assembly - Labor,8400,9200,42000,47800,2100,2340
J2024-001,09,09-216,M,Drywall Assembly - Material,8400,9200,21000,23400,0,0
J2024-001,09,09-651,L,LVT Flooring - Labor,18500,18500,18500,18900,925,940
J2024-001,09,09-651,M,LVT Flooring - Material,18500,18500,74000,76200,0,0
J2024-001,05,05-121,L,Structural Steel - Labor,85,85,34000,36200,1360,1448
J2024-001,05,05-121,M,Structural Steel - Material,85,85,646000,658000,0,0
J2024-001,05,05-121,S,Structural Steel - Sub,85,85,0,12000,0,0
J2024-001,21,21-131,L,Fire Protection - Labor,3800,3650,18240,17800,912,893
J2024-001,21,21-131,M,Fire Protection - Material,3800,3650,27360,29100,0,0
J2024-001,22,22-111,L,Domestic Water Piping - Labor,2200,2400,17600,19800,880,984
J2024-001,22,22-111,M,Domestic Water Piping - Material,2200,2400,17600,19200,0,0
J2024-001,01,01-741,L,Final Cleaning - Labor,32000,28000,9600,8400,320,280
J2024-001,09,09-910,L,Interior Painting - Labor,42000,44000,21000,23100,1050,1120
J2024-001,09,09-910,M,Interior Painting - Material,42000,44000,42000,45200,0,0
J2024-001,14,14-210,S,Elevator - Subcontractor,2,2,0,410000,0,0
J2024-001,01,01-500,L,Temporary Protection - Labor,32000,32000,6400,6200,256,248
J2024-001,01,01-500,M,Temporary Protection - Material,32000,32000,6400,7100,0,0`;


// ══════════════════════════════════════════════════════════════════════════════
// ── MATCHING ENGINE ──────────────────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════════════════
const normStr = s => (s||"").toLowerCase().replace(/[^a-z0-9\s]/g,"").replace(/\s+/g," ").trim();
const tokenSim = (a, b) => {
  const ta = new Set(normStr(a).split(" ").filter(Boolean));
  const tb = new Set(normStr(b).split(" ").filter(Boolean));
  if (!ta.size || !tb.size) return 0;
  return [...ta].filter(t => tb.has(t)).length / Math.max(ta.size, tb.size);
};
const extractCode = s => { if (!s) return ""; const m = s.match(/^([\d\s]+)/); return m ? m[1].trim() : s.trim(); };
const sortFieldScore = (inp, code, desc) => {
  if (!inp) return null;
  const ni = normStr(inp), nc = normStr(extractCode(code)||""), nd = normStr(desc||"");
  const niCode = normStr(extractCode(inp));
  if (!nc && !nd) return 0.5;
  if (niCode === nc || ni === nd) return 1;
  if (nc && (nc.includes(niCode) || niCode.includes(nc))) return 0.7;
  return Math.max(tokenSim(inp, desc), 0);
};

function scoreUPC(takeoffRow, upc, fields) {
  const nameSim = tokenSim(takeoffRow[fields.name], upc.name);
  const uomSim  = normStr(takeoffRow[fields.uom]) === normStr(upc.uom) ? 1 : 0;
  const mf3Raw  = fields.mf3  ? sortFieldScore(takeoffRow[fields.mf3],  upc.mf3_code,  upc.mf3_desc)  : null;
  const mf2Raw  = fields.mf2  ? sortFieldScore(takeoffRow[fields.mf2],  upc.mf2_code,  upc.mf2_desc)  : null;
  const uf3Raw  = fields.uf3  ? sortFieldScore(takeoffRow[fields.uf3],  upc.uf3_code,  upc.uf3_desc)  : null;
  const uf2Raw  = fields.uf2  ? sortFieldScore(takeoffRow[fields.uf2],  upc.uf2_code,  upc.uf2_desc)  : null;
  const bpRaw   = fields.bidpkg ? sortFieldScore(takeoffRow[fields.bidpkg], upc["Bid Package_code"], upc["Bid Package_desc"]) : null;
  const catRaw  = fields.category ? tokenSim(takeoffRow[fields.category], upc.category) : null;

  const W = { name:0.35, uom:0.20, mf3:0.15, uf3:0.10, mf2:0.08, uf2:0.05, bp:0.04, cat:0.03 };
  let score = nameSim * W.name + uomSim * W.uom;
  let used  = W.name + W.uom;
  [[mf3Raw,W.mf3],[uf3Raw,W.uf3],[mf2Raw,W.mf2],[uf2Raw,W.uf2],[bpRaw,W.bp],[catRaw,W.cat]]
    .forEach(([val, w]) => { if (val !== null) { score += val * w; used += w; } });
  const normalized = used > 0 ? score / used : 0;
  return {
    score: Math.round(normalized * 100),
    breakdown: { nameSim, uomSim, mf3Sim:mf3Raw??0, mf2Sim:mf2Raw??0, uf3Sim:uf3Raw??0, uf2Sim:uf2Raw??0, bpSim:bpRaw??0, catSim:catRaw??0 }
  };
}

const MIN_SCORE = 25;
function getTopMatches(row, upcItems, fields, n=5) {
  return upcItems.map(u => ({ upc: u, ...scoreUPC(row, u, fields) })).sort((a, b) => b.score - a.score).slice(0, n);
}
const confLabel = s => s >= 75 ? {l:"High",c:"green"} : s >= 45 ? {l:"Medium",c:"yellow"} : {l:"Low",c:"red"};


// ══════════════════════════════════════════════════════════════════════════════
// ── ESTIMATE LINE ITEM MATCHING ENGINE ──────────────────────────────────────
// ══════════════════════════════════════════════════════════════════════════════
function scoreEstimateMatch(takeoffRow, estItem, fields) {
  const nameSim = tokenSim(takeoffRow[fields.name], estItem.name);
  const uomSim  = fields.uom && estItem.uom ? (normStr(takeoffRow[fields.uom]) === normStr(estItem.uom) ? 1 : 0) : null;
  const productSim = estItem.product && takeoffRow._matchedProductId
    ? (takeoffRow._matchedProductId === estItem.product ? 1 : 0) : null;

  const W = { name: 0.70, uom: 0.15, product: 0.15 };
  let score = nameSim * W.name;
  let used = W.name;
  if (uomSim !== null) { score += uomSim * W.uom; used += W.uom; }
  if (productSim !== null) { score += productSim * W.product; used += W.product; }
  const normalized = used > 0 ? score / used : 0;
  return { score: Math.round(normalized * 100), breakdown: { nameSim, uomSim: uomSim ?? 0 } };
}

function getTopEstimateMatches(row, estimateItems, fields, n = 5) {
  return estimateItems.map(e => ({ item: e, ...scoreEstimateMatch(row, e, fields) }))
    .sort((a, b) => b.score - a.score).slice(0, n);
}


// ══════════════════════════════════════════════════════════════════════════════
// ── EDIPHI API (proxied through /api/ediphi) ─────────────────────────────────
// ══════════════════════════════════════════════════════════════════════════════
const EdiphiAPI = {
  _call: async (endpoint, method = "GET", body = null) => {
    const res = await fetch("/api/ediphi", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ endpoint, method, body }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || `API error ${res.status}`);
    return data;
  },

  validateAuth: async () => {
    try { const r = await EdiphiAPI._call("/projects?limit=1"); return { ok: true, data: r }; }
    catch (e) { throw new Error("Invalid credentials: " + e.message); }
  },

  // GET /projects — returns { data: [{ project: {...}, estimates: [...] }] }
  listProjects: async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.name) params.set("name", filters.name);
    if (filters.from) params.set("from", filters.from);
    const qs = params.toString() ? `?${params}` : "";
    return EdiphiAPI._call(`/projects${qs}`);
  },

  getEstimate: async (estimateId) => {
    return EdiphiAPI._call(`/estimates/${estimateId}`);
  },

  createEstimate: async (name) => {
    return EdiphiAPI._call("/estimates", "POST", { name });
  },

  listVendors: async (page = 1, limit = 100) => {
    return EdiphiAPI._call(`/vendors?page=${page}&limit=${limit}`);
  },
};


// ══════════════════════════════════════════════════════════════════════════════
// ── METABASE API (proxied through /api/metabase) ─────────────────────────────
// ══════════════════════════════════════════════════════════════════════════════
const MetabaseAPI = {
  query: async (sql) => {
    const res = await fetch("/api/metabase", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sql }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || `Metabase error ${res.status}`);
    return data;
  },

  loadProducts: async () => {
    const sql = `with 
    bidpackage_sort_field as (select id from sort_fields sf where key = 'Bid Package' and project is null)
    ,mf_id as (select id from setup where key = 'sort_codes:mf')
    ,uf_id as (select id from setup where key = 'sort_codes:uf')
    ,mf1_codes as (select jsonb_array_elements(value) ->> 'code' as code, jsonb_array_elements(value) ->> 'description' as desc from setup where id = (select id from mf_id))
    ,mf2_codes as (select jsonb_array_elements(jsonb_array_elements(value)->'children') ->> 'code' as code, jsonb_array_elements(jsonb_array_elements(value)->'children') ->> 'description' as desc from setup where id = (select id from mf_id))
    ,mf3_codes as (select jsonb_array_elements(jsonb_array_elements(jsonb_array_elements(value)->'children')->'children') ->> 'code' as code, jsonb_array_elements(jsonb_array_elements(jsonb_array_elements(value)->'children')->'children') ->> 'description' as desc from setup where id = (select id from mf_id))
    ,uf1_codes as (select jsonb_array_elements(value) ->> 'code' as code, jsonb_array_elements(value) ->> 'description' as desc from setup where id = (select id from uf_id))
    ,uf2_codes as (select jsonb_array_elements(jsonb_array_elements(value)->'children') ->> 'code' as code, jsonb_array_elements(jsonb_array_elements(value)->'children') ->> 'description' as desc from setup where id = (select id from uf_id))
    ,uf3_codes as (select jsonb_array_elements(jsonb_array_elements(jsonb_array_elements(value)->'children')->'children') ->> 'code' as code, jsonb_array_elements(jsonb_array_elements(jsonb_array_elements(value)->'children')->'children') ->> 'description' as desc from setup where id = (select id from uf_id))
    ,bid_package_codes as (select id, code, description from sort_codes sc where sort_field = (select id from bidpackage_sort_field))
select 
    p.id, p.item_code, p.name, p.uom,
    p.mf ->> 'mf1' as mf1_code, elem_mf_1.desc as mf1_desc,
    p.mf ->> 'mf2' as mf2_code, elem_mf_2.desc as mf2_desc,
    p.mf ->> 'mf3' as mf3_code, elem_mf.desc as mf3_desc,
    p.uf ->> 'uf1' as uf1_code, elem_uf_1.desc as uf1_desc,
    p.uf ->> 'uf2' as uf2_code, elem_uf_2.desc as uf2_desc,
    p.uf ->> 'uf3' as uf3_code, elem_uf.desc as uf3_desc,
    bp.code as bp_code, bp.description as bp_desc,
    p.pending, p.category, p.classification
from products p
left join bid_package_codes bp on bp.id::text = p.extras ->> (select id from bidpackage_sort_field)::text
left join mf1_codes elem_mf_1 on elem_mf_1.code = p.mf ->> 'mf1'
left join mf2_codes elem_mf_2 on elem_mf_2.code = p.mf ->> 'mf2'
left join mf3_codes elem_mf on elem_mf.code = p.mf ->> 'mf3'
left join uf1_codes elem_uf_1 on elem_uf_1.code = p.uf ->> 'uf1'
left join uf2_codes elem_uf_2 on elem_uf_2.code = p.uf ->> 'uf2'
left join uf3_codes elem_uf on elem_uf.code = p.uf ->> 'uf3'
where p.deleted_at is null and owner is null
order by p.updated_at desc`;

    const rows = await MetabaseAPI.query(sql);
    return rows.map(r => ({
      id: r.id, name: r.name || "", uom: r.uom || "",
      item_code: r.item_code != null ? String(r.item_code) : "",
      category: r.category || "",
      pending: r.pending === true || r.pending === "true" ? "true" : "false",
      mf1_code: r.mf1_code||"", mf1_desc: r.mf1_desc||"",
      mf2_code: r.mf2_code||"", mf2_desc: r.mf2_desc||"",
      mf3_code: r.mf3_code||"", mf3_desc: r.mf3_desc||"",
      uf1_code: r.uf1_code||"", uf1_desc: r.uf1_desc||"",
      uf2_code: r.uf2_code||"", uf2_desc: r.uf2_desc||"",
      uf3_code: r.uf3_code||"", uf3_desc: r.uf3_desc||"",
      "Bid Package_code": r.bp_code||"", "Bid Package_desc": r.bp_desc||"",
    }));
  },

  loadUseGroups: async () => {
    return MetabaseAPI.query(`SELECT id, name, category, unit_cost_label FROM use_groups WHERE deleted_at IS NULL ORDER BY name`);
  },

  loadEstimateLineItems: async (estimateId) => {
    return MetabaseAPI.query(`SELECT li.id, li.name, li.uom, li.quantity, li.total_uc, li.product, li.category, li.import_batch FROM line_items li WHERE li.estimate = '${estimateId}' AND li.deleted_at IS NULL ORDER BY li.name`);
  },

  validateAuth: async () => {
    const r = await MetabaseAPI.query("SELECT 1 as test");
    return Array.isArray(r) && r.length > 0;
  },
};


// ══════════════════════════════════════════════════════════════════════════════
// ── OST FILE PARSER ──────────────────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════════════════
const OST_UOM_MAP = { "0":"EA", "2":"LF", "5":"SF", "6":"SY", "9":"CY", "1":"LF", "3":"CF", "4":"SF", "7":"SY", "8":"CF" };

function parseOSTFile(file, cb) {
  const rd = new FileReader();
  rd.onload = e => {
    try {
      const doc = new DOMParser().parseFromString(e.target.result, "text/xml");
      const folders = {};
      doc.querySelectorAll("BidConditionFolder").forEach(f => {
        const name = f.getAttribute("Name") || "";
        const uid = f.getAttribute("UID") || "";
        const uf3Match = name.match(/^([A-Z]\d{4})\s*-?\s*(.*)/);
        folders[uid] = { name, uf3Code: uf3Match ? uf3Match[1] : "", uf3Desc: uf3Match ? uf3Match[2].trim() : name };
      });

      const rows = [];
      doc.querySelectorAll("BidCondition").forEach(c => {
        const name = c.getAttribute("Name") || "";
        const uomCode = c.getAttribute("UOM1") || "0";
        const uom = OST_UOM_MAP[uomCode] || "EA";
        const folderUID = c.getAttribute("BidConditionFolderUID") || "";
        const folder = folders[folderUID] || { name: "", uf3Code: "", uf3Desc: "" };

        // Sum quantities from BidAreaCondition children (actual measured takeoff)
        let qty = 0;
        c.querySelectorAll("BidAreaCondition").forEach(bac => {
          qty += parseFloat(bac.getAttribute("Result1")) || 0;
        });

        // Extract Ediphi product ID from Notes JSON
        let ediphiProductId = "";
        const notes = c.getAttribute("Notes") || "";
        if (notes) {
          try {
            const jdata = JSON.parse(notes);
            if (jdata?.ediphi_products?.[0]?.qt1) ediphiProductId = jdata.ediphi_products[0].qt1;
          } catch {}
        }

        rows.push({
          "Condition Name": name, "UoM": uom, "Quantity": qty || "",
          "UF3 Code": folder.uf3Code, "UF3 Desc": folder.uf3Desc, "Folder": folder.name,
          "Ediphi Product ID": ediphiProductId, "RefNo": c.getAttribute("RefNo") || "",
        });
      });

      if (!rows.length) { cb(null, null, "No conditions found in OST file."); return; }
      cb(rows, Object.keys(rows[0]));
    } catch (err) { cb(null, null, `OST parse error: ${err.message}`); }
  };
  rd.readAsText(file);
}


// ══════════════════════════════════════════════════════════════════════════════
// ── FILE PARSING ─────────────────────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════════════════
function parseFile(file, cb) {
  const ext = file.name.split(".").pop().toLowerCase();
  if (ext === "ost") { parseOSTFile(file, cb); }
  else if (ext === "csv") {
    Papa.parse(file, { header:true, skipEmptyLines:true, dynamicTyping:false,
      complete: r => cb(r.data, r.meta.fields), error: e => cb(null,null,e.message) });
  } else if (["xlsx","xls"].includes(ext)) {
    const rd = new FileReader(); rd.onload = e => {
      try { const wb=XLSX.read(e.target.result,{type:"array"}), ws=wb.Sheets[wb.SheetNames[0]],
                rows=XLSX.utils.sheet_to_json(ws,{defval:""});
            cb(rows, rows.length ? Object.keys(rows[0]) : []);
      } catch(err) { cb(null,null,err.message); }
    }; rd.readAsArrayBuffer(file);
  } else if (ext === "xml") {
    const rd = new FileReader(); rd.onload = e => {
      try { const doc=new DOMParser().parseFromString(e.target.result,"text/xml"),
                items=doc.querySelectorAll("item,row,lineitem,LineItem,Item,Row,record,Record");
            if (!items.length) { cb(null,null,"No rows found in XML."); return; }
            const rows=[],hdrs=new Set();
            items.forEach(el=>{const row={};el.childNodes.forEach(n=>{if(n.nodeType===1){row[n.nodeName]=n.textContent;hdrs.add(n.nodeName);}});if(Object.keys(row).length)rows.push(row);});
            cb(rows,[...hdrs]);
      } catch(err) { cb(null,null,err.message); }
    }; rd.readAsText(file);
  } else cb(null,null,`Unsupported: .${ext}`);
}


// ══════════════════════════════════════════════════════════════════════════════
// ── SAGE HELPERS ─────────────────────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════════════════
const SAGE_ALIASES = {
  cost_code:["costcode","cost_code","phasecode","phase_code","phase","code","acctcode"],
  description:["description","desc","costdescription","phasedesc","name"],
  act_cost:["actualcost","act_cost","actualamount","actcost","totalactualcost","actualtotal","actamt"],
  est_cost:["estimatedcost","est_cost","budgetcost","originalbudget","estcost","budgetamt"],
  act_qty:["actualquantity","act_qty","actqty","actualunits","actquantity","completedqty"],
  est_qty:["estimatedquantity","est_qty","estqty","budgetquantity"],
  act_hours:["actualhours","act_hours","acthours","laborhours","completehours"],
  est_hours:["estimatedhours","est_hours","esthours","budgethours"],
  cost_type:["costtype","cost_type","type","labortype"],
  committed:["committedcost","committed_cost","committedamt","approvedcommitments"],
};
const autoMapSage = hdrs => {
  const n = h => h.toLowerCase().replace(/[^a-z0-9]/g,"");
  return Object.fromEntries(Object.entries(SAGE_ALIASES).map(([f,alts]) => [f, hdrs.find(h => alts.includes(n(h))) || ""]));
};
const autoDetectTakeoff = hdrs => {
  const n = h => h.toLowerCase().replace(/[^a-z0-9]/g,"");
  const find = keys => hdrs.find(h => keys.includes(n(h))) || "";
  return {
    name: find(["name","description","desc","item","condition","conditionname","linename"]),
    uom: find(["uom","unit","unitofmeasure","measure"]),
    mf3: find(["mf3","mf3code","masterformat3","mf3desc","mf3_code","mf3_desc"]),
    mf2: find(["mf2","mf2code","mf2_code","mf2_desc"]),
    uf3: find(["uf3","uf3code","uf3_code","uf3_desc"]),
    uf2: find(["uf2","uf2code","uf2_code","uf2_desc"]),
    bidpkg: find(["bidpackage","bidpkg","bid_package","bidpackagecode"]),
    category: find(["category","type","costtype","trade","group"]),
    qty: find(["quantity","qty","amount","totalqty"]),
    est_cost: find(["estimatedcost","estcost","budgetcost","cost","price","totalcost"]),
  };
};

function buildCodeGroups(rows, mapping, upcItems) {
  const groups = {};
  rows.forEach(row => {
    const rawCode = (row[mapping.cost_code] || "").trim();
    if (!rawCode) return;
    const phaseMatch = rawCode.match(/^(\d+)-(\d+)/);
    const code = phaseMatch ? `${phaseMatch[1]}-${phaseMatch[2]}` : rawCode.replace(/[^a-z0-9]/gi,"-").toUpperCase();
    if (!groups[code]) groups[code] = {
      code, description: row[mapping.description] || "",
      act_cost:0, est_cost:0, act_qty:0, act_hours:0,
      labor:{act_cost:0,est_cost:0,act_qty:0,act_hours:0,est_hours:0},
      material:{act_cost:0,est_cost:0}, equipment:{act_cost:0,est_cost:0}, sub:{act_cost:0,est_cost:0},
      cost_type:"", has_committed:false, lineItems:[], distribution:[]
    };
    const g = groups[code];
    const actC = parseFloat(row[mapping.act_cost])||0, estC = parseFloat(row[mapping.est_cost])||0;
    const actQ = parseFloat(row[mapping.act_qty])||0, actH = parseFloat(row[mapping.act_hours])||0;
    const estH = parseFloat(row[mapping.est_hours])||0;
    g.act_cost += actC; g.est_cost += estC; g.act_qty += actQ;
    if (mapping.committed && row[mapping.committed]) g.has_committed = true;
    const ctype = (row[mapping.cost_type]||"").toUpperCase().trim();
    if (ctype==="L"||ctype==="LABOR") { g.labor.act_cost+=actC; g.labor.est_cost+=estC; g.labor.act_qty+=actQ; g.labor.act_hours+=actH; g.labor.est_hours+=estH; g.act_hours+=actH; }
    else if (ctype==="M"||ctype==="MATERIAL") { g.material.act_cost+=actC; g.material.est_cost+=estC; }
    else if (ctype==="E"||ctype==="EQUIPMENT") { g.equipment.act_cost+=actC; g.equipment.est_cost+=estC; }
    else if (ctype==="S"||ctype==="SUB"||ctype==="SUBCONTRACTOR") { g.sub.act_cost+=actC; g.sub.est_cost+=estC; }
  });
  Object.values(groups).forEach(g => {
    const matches = upcItems.map(u => ({ upc:u, score: Math.round(tokenSim(g.description, u.name)*100) }))
      .filter(m => m.score >= 20).sort((a,b) => b.score-a.score).slice(0,3);
    g.lineItems = matches.map((m,i) => ({
      id:`${g.code}-${i}`, name:m.upc.name, uom:m.upc.uom, upc_id:m.upc.id, item_code:m.upc.item_code,
      mf3_code:m.upc.mf3_code, mf3_desc:m.upc.mf3_desc, category:m.upc.category||"",
      est_cost: g.est_cost/(matches.length||1), quantity:0
    }));
    g.distribution = distributeActuals(g);
  });
  return groups;
}

function distributeActuals(g) {
  const {act_cost, act_qty, labor, lineItems} = g;
  const totalEst = lineItems.reduce((s,li)=>s+(parseFloat(li.est_cost)||0),0);
  return lineItems.map(li => {
    const est = parseFloat(li.est_cost)||0;
    const share = totalEst > 0 ? est/totalEst : 1/lineItems.length;
    const new_total = act_cost * share;
    const qty = parseFloat(li.quantity) || act_qty*share || 1;
    const new_unit = qty > 0 ? new_total/qty : 0;
    const hrs = labor.act_hours * share;
    const laborQty = labor.act_qty * share || qty;
    const new_productivity = laborQty > 0 && labor.act_hours > 0 ? labor.act_hours*share/laborQty : 0;
    return { ...li, new_total, new_unit, new_productivity, share:Math.round(share*100), zero_est_warning: est === 0 };
  });
}


// ══════════════════════════════════════════════════════════════════════════════
// ── FORMATTING ───────────────────────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════════════════
const fmt$ = n => isNaN(n)||n===""?"—":"$"+Number(n).toLocaleString("en-US",{minimumFractionDigits:2,maximumFractionDigits:2});
const fmtN = n => isNaN(n)||n===0?"—":Number(n).toLocaleString("en-US",{minimumFractionDigits:3,maximumFractionDigits:3});


// ══════════════════════════════════════════════════════════════════════════════
// ── UI COMPONENTS ────────────────────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════════════════
function Badge({children,color="gray"}){
  const c={gray:"bg-gray-100 text-gray-600",green:"bg-green-100 text-green-700",red:"bg-red-100 text-red-700",
    yellow:"bg-yellow-100 text-yellow-800",blue:"bg-blue-100 text-blue-700",purple:"bg-purple-100 text-purple-700",
    teal:"bg-teal-100 text-teal-700",orange:"bg-orange-100 text-orange-700"};
  return <span className={`px-2 py-0.5 rounded text-xs font-semibold ${c[color]||c.gray}`}>{children}</span>;
}
function ScoreBar({score}){
  const c=score>=75?"bg-green-500":score>=45?"bg-yellow-400":"bg-red-400";
  return(<div className="flex items-center gap-2"><div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
    <div className={`h-full rounded-full ${c}`} style={{width:`${score}%`}}/></div>
    <span className="text-xs font-bold text-gray-600 w-8">{score}%</span></div>);
}
function DropZone({onFile,label,accept=".csv,.xlsx,.xls",icon="📂"}){
  const [drag,setDrag]=useState(false); const ref=useRef();
  return(<div className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all
    ${drag?"border-blue-500 bg-blue-50":"border-gray-300 hover:border-blue-400 hover:bg-gray-50"}`}
    onDragOver={e=>{e.preventDefault();setDrag(true);}} onDragLeave={()=>setDrag(false)}
    onDrop={e=>{e.preventDefault();setDrag(false);e.dataTransfer.files[0]&&onFile(e.dataTransfer.files[0]);}}
    onClick={()=>ref.current.click()}>
    <input ref={ref} type="file" accept={accept} className="hidden" onChange={e=>e.target.files[0]&&onFile(e.target.files[0])}/>
    <div className="text-3xl mb-1">{icon}</div>
    <p className="font-semibold text-gray-700 text-sm">{label}</p>
    <p className="text-xs text-gray-400 mt-0.5">Click or drag & drop</p></div>);
}
function StepBar({steps,step,color="blue"}){
  const ac=color==="purple"?"border-purple-600 text-purple-600":"border-blue-600 text-blue-600";
  const dn=color==="purple"?"bg-purple-600 border-purple-600":"bg-blue-600 border-blue-600";
  const ln=color==="purple"?"bg-purple-600":"bg-blue-600";
  return(<div className="flex items-center mb-6">{steps.map((s,i)=>(
    <div key={s} className="flex items-center">
      <div className="flex flex-col items-center">
        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2
          ${i<step?`${dn} text-white`:i===step?`bg-white ${ac}`:"bg-white border-gray-300 text-gray-400"}`}>{i<step?"✓":i+1}</div>
        <span className={`text-xs mt-1 font-medium whitespace-nowrap
          ${i===step?(color==="purple"?"text-purple-600":"text-blue-600"):"text-gray-400"}`}>{s}</span>
      </div>
      {i<steps.length-1&&<div className={`h-0.5 w-8 mb-4 mx-1 ${i<step?ln:"bg-gray-200"}`}/>}
    </div>))}</div>);
}
function Alert({type="warning",title,children}){
  const styles={warning:"bg-amber-50 border-amber-300 text-amber-800",error:"bg-red-50 border-red-300 text-red-800",
    info:"bg-blue-50 border-blue-300 text-blue-800"};
  const icons={warning:"⚠",error:"🚫",info:"ℹ"};
  return(<div className={`border rounded-lg p-3 mb-3 ${styles[type]}`}>
    <p className="font-semibold text-sm mb-0.5">{icons[type]} {title}</p><p className="text-xs">{children}</p></div>);
}


// ══════════════════════════════════════════════════════════════════════════════
// ── AUTO-CONNECT SPLASH ──────────────────────────────────────────────────────
// Credentials live server-side as Vercel env vars — no user input needed.
// On mount we probe the proxy endpoints and auto-connect.
// ══════════════════════════════════════════════════════════════════════════════
function AutoConnectSplash({onReady}){
  const [status,setStatus]=useState("connecting"); // connecting | connected | error
  const [err,setErr]=useState("");
  const ran=useRef(false);

  useEffect(()=>{
    if(ran.current) return; ran.current=true;
    (async()=>{
      let ediphiOk=false, metabaseOk=false, tenantName="Ediphi";
      try {
        await EdiphiAPI.validateAuth();
        ediphiOk=true;
        tenantName="Ediphi"; // proxy handles tenant
      } catch{ /* server creds may not be set yet */ }
      try { await MetabaseAPI.validateAuth(); metabaseOk=true; } catch{}

      if(!ediphiOk && !metabaseOk){
        // Neither service reachable — fall back to file-upload mode silently
        setStatus("connected");
        setTimeout(()=>onReady({
          tenant:"", apiToken:"", metabaseKey:"", metabaseCookie:"",
          ediphiConnected:false, metabaseConnected:false, user:{name:"Local User"}
        }),600);
        return;
      }
      setStatus("connected");
      setTimeout(()=>onReady({
        tenant:tenantName, apiToken:"server", metabaseKey:"server", metabaseCookie:"server",
        ediphiConnected:ediphiOk, metabaseConnected:metabaseOk,
        user:{name:tenantName},
      }),600);
    })();
  },[onReady]);

  return(
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-blue-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 bg-blue-600 rounded-2xl mb-4 shadow-lg">
          <span className="text-white text-2xl font-black">E</span></div>
        <h1 className="text-2xl font-bold text-white mb-2">Ediphi Pipeline</h1>
        {status==="connecting"&&(
          <div className="flex items-center justify-center gap-2 text-blue-300 text-sm">
            <span className="animate-spin inline-block">⟳</span> Connecting…
          </div>
        )}
        {status==="connected"&&(
          <p className="text-green-400 text-sm font-semibold">✓ Connected</p>
        )}
        {status==="error"&&(
          <div className="mt-4 p-3 bg-red-900/30 border border-red-500/40 rounded-lg text-red-300 text-sm">
            {err}
          </div>
        )}
      </div>
    </div>
  );
}


// ══════════════════════════════════════════════════════════════════════════════
// ── PROJECT / ESTIMATE BROWSER ───────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════════════════
function ProjectBrowser({session, onSelect, onSkip}){
  const [projects,setProjects]=useState(null);
  const [selectedProject,setSelectedProject]=useState(null);
  const [selectedEstimate,setSelectedEstimate]=useState(null);
  const [loading,setLoading]=useState(true);
  const [err,setErr]=useState("");

  useEffect(()=>{
    (async()=>{
      try {
        const result = await EdiphiAPI.listProjects();
        // API returns { data: [{ project: {...}, estimates: [...] }] }
        setProjects(result.data || []);
      } catch(e) { setErr(e.message); }
      setLoading(false);
    })();
  },[]);

  const selectProject = (proj) => {
    setSelectedProject(proj);
    setSelectedEstimate(null);
  };

  return(
    <div className="max-w-3xl mx-auto p-8">
      <div className="bg-white rounded-2xl shadow-sm border p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-blue-100 rounded-xl flex items-center justify-center text-lg">🏗️</div>
            <div>
              <h2 className="font-bold text-gray-900">Select Project & Estimate</h2>
              <p className="text-xs text-gray-500">Connected to <span className="font-mono text-blue-600">{session.tenant}</span></p>
            </div>
          </div>
          <button onClick={onSkip} className="text-xs text-gray-400 hover:text-blue-600">Skip →</button>
        </div>

        {loading&&<div className="text-center py-8 text-gray-500">⟳ Loading projects…</div>}
        {err&&<Alert type="error" title="API Error">{err}</Alert>}

        {projects&&!selectedProject&&(
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {projects.map((item,i) => (
              <button key={i} onClick={()=>selectProject(item)}
                className="w-full text-left p-3 border rounded-xl hover:border-blue-300 hover:bg-blue-50 transition-all">
                <p className="font-semibold text-sm">{item.project?.name || "Unnamed Project"}</p>
                <p className="text-xs text-gray-500">{(item.estimates||[]).length} estimate{(item.estimates||[]).length!==1?"s":""}</p>
              </button>
            ))}
            {projects.length===0&&<p className="text-center text-gray-400 text-sm py-4">No projects found.</p>}
          </div>
        )}

        {selectedProject&&!selectedEstimate&&(
          <div>
            <button onClick={()=>setSelectedProject(null)} className="text-xs text-blue-600 hover:underline mb-3 block">← Back to projects</button>
            <h3 className="font-semibold text-gray-800 mb-2">{selectedProject.project?.name} — Estimates</h3>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {(selectedProject.estimates||[]).map((est,i) => (
                <button key={i} onClick={()=>setSelectedEstimate(est)}
                  className="w-full text-left p-3 border rounded-xl hover:border-blue-300 hover:bg-blue-50 transition-all">
                  <p className="font-semibold text-sm">{est.name || "Unnamed Estimate"}</p>
                  <p className="text-xs text-gray-400">{est.created_at ? new Date(est.created_at).toLocaleDateString() : ""}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {selectedEstimate&&(
          <div className="p-4 bg-green-50 border border-green-200 rounded-xl">
            <p className="text-green-600 text-xs uppercase font-bold tracking-wide mb-1">Target Selected</p>
            <p className="font-bold text-green-800">{selectedProject.project?.name}</p>
            <p className="text-green-700 text-sm">{selectedEstimate.name}</p>
            <div className="flex gap-2 mt-3">
              <button onClick={()=>setSelectedEstimate(null)} className="px-3 py-1.5 border rounded-lg text-xs text-gray-600 hover:bg-gray-50">Change</button>
              <button onClick={()=>onSelect({ project:selectedProject.project, estimate:selectedEstimate })}
                className="flex-1 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs font-semibold">
                Continue with this Estimate →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


// ══════════════════════════════════════════════════════════════════════════════
// ── UPC LOADER ───────────────────────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════════════════
function UPCLoader({onLoaded, session}){
  const [state,setState]=useState("idle");
  const [err,setErr]=useState("");
  const [preview,setPreview]=useState(null);
  const [metabaseLoading,setMetabaseLoading]=useState(false);

  const processData=(data,hdrs,fname)=>{
    const required=["id","name","uom"];
    const missing=required.filter(r=>!hdrs.includes(r));
    if(missing.length){setState("error");setErr(`Missing required columns: ${missing.join(", ")}`);return;}
    const all=data.length;
    const filtered=data.filter(r=>String(r.pending||"").toLowerCase()!=="true");
    setState("preview");
    setPreview({data:filtered,hdrs,count:filtered.length,pendingCount:all-filtered.length,file:{name:fname}});
  };

  const handleFile=f=>{
    setState("loading"); setErr("");
    parseFile(f,(data,hdrs,err)=>{
      if(err||!data){setState("error");setErr(err||"Parse failed");return;}
      processData(data,hdrs,f.name);
    });
  };

  const loadSample=()=>{
    setState("loading");
    Papa.parse(SAMPLE_UPC,{header:true,skipEmptyLines:true,
      complete:r=>processData(r.data,r.meta.fields,"sample_upc_catalog.csv")});
  };

  const loadFromMetabase = async () => {
    setMetabaseLoading(true); setErr(""); setState("loading");
    try {
      const products = await MetabaseAPI.loadProducts();
      if (!products || !products.length) throw new Error("No products returned from Metabase.");
      const hdrs = Object.keys(products[0]);
      processData(products, hdrs, `Live UPC (${products.length} items from Metabase)`);
    } catch(e) { setState("error"); setErr(`Metabase load failed: ${e.message}`); }
    setMetabaseLoading(false);
  };

  return(
    <div className="max-w-2xl mx-auto p-8">
      <div className="bg-white rounded-2xl shadow-sm border p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 bg-teal-100 rounded-xl flex items-center justify-center text-lg">📋</div>
          <div>
            <h2 className="font-bold text-gray-900">Load UPC Catalog</h2>
            <p className="text-xs text-gray-500">Upload your Ediphi UPC export, load from Metabase, or use sample data</p>
          </div>
        </div>

        {state==="idle"&&(
          <>
            {/* Metabase live load */}
            {session?.metabaseConnected&&(
              <button onClick={loadFromMetabase} disabled={metabaseLoading}
                className="w-full py-3 mb-3 bg-green-600 hover:bg-green-700 text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-60">
                {metabaseLoading?<><span className="animate-spin">⟳</span> Loading…</>:"📊 Load Live UPC from Ediphi Database"}
              </button>
            )}
            <DropZone onFile={handleFile} label="UPC Catalog CSV or XLSX" accept=".csv,.xlsx,.xls" icon="📋"/>
            <div className="mt-4 border-t pt-4">
              <p className="text-xs text-gray-500 mb-2 text-center">— or use sample data for testing —</p>
              <button onClick={loadSample}
                className="w-full py-2.5 border-2 border-dashed border-teal-300 text-teal-700 rounded-xl text-sm font-semibold hover:bg-teal-50">
                🧪 Load Sample UPC Catalog (30 items)
              </button>
            </div>
          </>
        )}

        {state==="loading"&&<div className="text-center py-8 text-gray-500">⟳ Loading UPC catalog…</div>}
        {state==="error"&&(
          <><Alert type="error" title="Error">{err}</Alert>
          <button onClick={()=>setState("idle")} className="mt-2 text-sm text-blue-600 hover:underline">← Try again</button></>
        )}

        {state==="preview"&&preview&&(
          <>
            {preview.pendingCount>0&&(
              <Alert type="warning" title={`${preview.pendingCount} pending items excluded`}>
                Items with pending=true removed. ({preview.count} items remaining)
              </Alert>
            )}
            <div className="p-4 bg-green-50 border border-green-200 rounded-xl mb-4">
              <div className="flex items-center gap-3">
                <span className="text-green-600 text-xl">✓</span>
                <div>
                  <p className="font-semibold text-green-800">{preview.file.name}</p>
                  <p className="text-green-600 text-sm">{preview.count.toLocaleString()} UPC items ready</p>
                </div>
              </div>
            </div>
            <div className="overflow-auto max-h-36 border rounded-lg mb-4">
              <table className="text-xs w-full">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>{["name","uom","mf3_code","uf3_code","category"].map(h=>(
                    <th key={h} className="px-3 py-2 text-left font-medium text-gray-600 border-b">{h}</th>))}</tr>
                </thead>
                <tbody>{preview.data.slice(0,5).map((r,i)=>(
                  <tr key={i} className="border-b">{["name","uom","mf3_code","uf3_code","category"].map(h=>(
                    <td key={h} className="px-3 py-1.5 text-gray-700 max-w-28 truncate">{String(r[h]||"")}</td>))}</tr>
                ))}</tbody>
              </table>
            </div>
            <div className="flex gap-3">
              <button onClick={()=>{setState("idle");setPreview(null);}} className="px-4 py-2 border rounded-lg text-sm text-gray-600 hover:bg-gray-50">← Re-upload</button>
              <button onClick={()=>onLoaded(preview.data,preview.hdrs)}
                className="flex-1 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-sm font-semibold">
                Use This Catalog ({preview.count.toLocaleString()} items) →
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}


// ══════════════════════════════════════════════════════════════════════════════
// ── ROOT APP ─────────────────────────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════════════════
export default function App(){
  const [session,setSession]=useState(null);
  const [target,setTarget]=useState(null); // { project, estimate }
  const [upcItems,setUpcItems]=useState(null);
  const [upcHdrs,setUpcHdrs]=useState([]);
  const [mode,setMode]=useState(null);

  if(!session) return <AutoConnectSplash onReady={s=>setSession(s)}/>;

  // Show project browser if connected to Ediphi API and no target yet
  if(session.ediphiConnected && !target && !upcItems) {
    return(
      <div className="min-h-screen bg-gray-50">
        <HeaderBar session={session} setSession={setSession} upcItems={upcItems} setUpcItems={setUpcItems}
          setMode={setMode} setTarget={setTarget} mode={mode}/>
        <ProjectBrowser session={session}
          onSelect={t=>{setTarget(t);}}
          onSkip={()=>setTarget({project:null,estimate:null})}/>
      </div>
    );
  }

  return(
    <div className="min-h-screen bg-gray-50">
      <HeaderBar session={session} setSession={setSession} upcItems={upcItems} setUpcItems={setUpcItems}
        setMode={setMode} setTarget={setTarget} mode={mode} target={target}/>

      {!upcItems&&<UPCLoader onLoaded={(items,hdrs)=>{setUpcItems(items);setUpcHdrs(hdrs);}} session={session}/>}

      {upcItems&&!mode&&(
        <div className="max-w-3xl mx-auto p-8">
          <h2 className="text-xl font-bold text-gray-900 mb-1">What would you like to do?</h2>
          <p className="text-gray-500 text-sm mb-6">
            UPC catalog loaded — {upcItems.length.toLocaleString()} items.
            {target?.project&&<span className="text-blue-600 ml-1">Target: {target.project.name} → {target.estimate?.name}</span>}
          </p>
          <div className="grid grid-cols-2 gap-4">
            <button onClick={()=>setMode("takeoff")}
              className="p-6 bg-white border-2 border-gray-200 hover:border-blue-500 rounded-2xl text-left group transition-all shadow-sm hover:shadow-md">
              <div className="text-3xl mb-3">📐</div>
              <h3 className="font-bold text-gray-900 group-hover:text-blue-600">Takeoff → UPC Match</h3>
              <p className="text-sm text-gray-500 mt-1">Match conditions against UPC catalog using all sort fields.</p>
              <div className="mt-3 flex gap-2 flex-wrap">
                <Badge color="blue">XLSX</Badge><Badge color="blue">CSV</Badge><Badge color="blue">OST</Badge><Badge color="teal">Sample</Badge>
              </div>
            </button>
            <button onClick={()=>setMode("accounting")}
              className="p-6 bg-white border-2 border-gray-200 hover:border-purple-500 rounded-2xl text-left group transition-all shadow-sm hover:shadow-md">
              <div className="text-3xl mb-3">📊</div>
              <h3 className="font-bold text-gray-900 group-hover:text-purple-600">Accounting → Write-Back</h3>
              <p className="text-sm text-gray-500 mt-1">Sage actuals with cost-type splitting and proportional distribution.</p>
              <div className="mt-3 flex gap-2 flex-wrap">
                <Badge color="purple">Sage 100/300</Badge><Badge color="teal">Sample</Badge>
              </div>
            </button>
          </div>
        </div>
      )}

      {upcItems&&mode==="takeoff"&&<TakeoffPipeline upcItems={upcItems} target={target} session={session}/>}
      {upcItems&&mode==="accounting"&&<AccountingPipeline upcItems={upcItems} target={target}/>}
    </div>
  );
}


// ══════════════════════════════════════════════════════════════════════════════
// ── HEADER BAR ───────────────────────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════════════════
function HeaderBar({session,setSession,upcItems,setUpcItems,setMode,setTarget,mode,target}){
  return(
    <div className="bg-white border-b border-gray-200 px-5 py-3 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
          <span className="text-white text-sm font-black">E</span></div>
        <span className="font-bold text-gray-900 text-sm">Ediphi Pipeline</span>
        {session.tenant&&<span className="text-xs text-gray-400 font-mono hidden sm:inline">{session.tenant}</span>}
        {session.ediphiConnected&&<span className="text-xs bg-green-100 text-green-700 font-semibold px-2 py-0.5 rounded-full hidden sm:inline">✓ API</span>}
        {session.metabaseConnected&&<span className="text-xs bg-green-100 text-green-700 font-semibold px-2 py-0.5 rounded-full hidden sm:inline">📊 Data</span>}
        {upcItems&&<span className="text-xs bg-teal-100 text-teal-700 font-semibold px-2 py-0.5 rounded-full">UPC: {upcItems.length.toLocaleString()}</span>}
        {target?.project&&<span className="text-xs bg-blue-100 text-blue-700 font-semibold px-2 py-0.5 rounded-full hidden sm:inline">{target.project.name}</span>}
        {mode&&<button onClick={()=>setMode(null)} className="ml-2 text-xs text-gray-400 hover:text-blue-600">← Menu</button>}
      </div>
      <div className="flex items-center gap-3">
        {upcItems&&<button onClick={()=>{setUpcItems(null);setMode(null);}} className="text-xs text-teal-600 border border-teal-200 px-2 py-1 rounded-lg hover:bg-teal-50">↺ UPC</button>}
        {target?.project&&<button onClick={()=>{setTarget(null);setUpcItems(null);setMode(null);}} className="text-xs text-blue-600 border border-blue-200 px-2 py-1 rounded-lg hover:bg-blue-50">↺ Project</button>}
        <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center">
          <span className="text-blue-700 text-xs font-bold">{(session.user.name||"U")[0].toUpperCase()}</span></div>
        <span className="text-xs font-semibold text-gray-700 hidden sm:inline">{session.user.name}</span>
        <button onClick={()=>{setSession(null);setUpcItems(null);setMode(null);setTarget(null);}} className="text-xs text-gray-500 hover:text-red-600 font-medium">Reconnect</button>
      </div>
    </div>
  );
}


// ══════════════════════════════════════════════════════════════════════════════
// ── TAKEOFF PIPELINE ─────────────────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════════════════
const T_STEPS=["Upload","Column Setup","Match Review","Export"];
function TakeoffPipeline({upcItems, target, session}){
  const [step,setStep]=useState(0);
  const [file,setFile]=useState(null); const [rows,setRows]=useState([]); const [headers,setHeaders]=useState([]);
  const [parseErr,setParseErr]=useState(""); const [fields,setFields]=useState({});
  const [matchState,setMatchState]=useState([]); const [activePick,setActivePick]=useState(null);
  const [exported,setExported]=useState(false); const [matching,setMatching]=useState(false);
  // Estimate match state
  const [estimateItems,setEstimateItems]=useState(null);
  const [estMatchState,setEstMatchState]=useState([]);
  const [estActivePick,setEstActivePick]=useState(null);
  const [estErr,setEstErr]=useState("");
  const hasEstimate = !!(target?.estimate?.id && session?.metabaseConnected);
  // Expand state: per-row panel toggle ("est" | "upc" | null)
  const [expandPanel,setExpandPanel]=useState({});
  // Search state
  const [upcSearch,setUpcSearch]=useState(""); const [upcSearchIdx,setUpcSearchIdx]=useState(null);
  const [estSearch,setEstSearch]=useState(""); const [estSearchIdx,setEstSearchIdx]=useState(null);

  const togglePanel=(idx,panel)=>setExpandPanel(prev=>({...prev,[idx]:prev[idx]===panel?null:panel}));

  const loadSample=()=>{
    Papa.parse(SAMPLE_TAKEOFF,{header:true,skipEmptyLines:true,
      complete:r=>{setRows(r.data);setHeaders(r.meta.fields);setFields(autoDetectTakeoff(r.meta.fields));
        setFile({name:"sample_takeoff.csv"});setParseErr("");}});
  };
  const handleFile=f=>{setFile(f);setParseErr("");setRows([]);setHeaders([]);
    parseFile(f,(data,hdrs,err)=>{if(err||!data){setParseErr(err||"Parse failed");return;}
      setRows(data);setHeaders(hdrs);setFields(autoDetectTakeoff(hdrs));});};

  // ── Run BOTH matches in parallel ──
  const runAllMatches = async () => {
    setMatching(true); setEstErr("");

    // Build UPC matches
    const buildUPC = async () => {
      const ms = [];
      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const top = getTopMatches(row, upcItems, fields);
        const best = top[0];
        const chosen = best.score >= MIN_SCORE ? best.upc : null;
        ms.push({ row, topMatches: top, chosen, score: best.score, confirmed: best.score >= 75, breakdown: best.breakdown });
        if (i % 50 === 0) await new Promise(r => setTimeout(r, 0));
      }
      return ms;
    };

    // Build Estimate matches (if applicable)
    const buildEstimate = async () => {
      if (!hasEstimate) return rows.map(row => ({ row, topMatches: [], chosen: null, score: 0, confirmed: true, action: "new", breakdown: null }));
      let items = [];
      try {
        items = await MetabaseAPI.loadEstimateLineItems(target.estimate.id);
        if (!items || !items.length) { setEstErr("No line items in estimate — all rows will be added as new."); items = []; }
        setEstimateItems(items);
      } catch (e) { setEstErr(`Estimate load failed: ${e.message}`); setEstimateItems([]); }
      if (!items.length) return rows.map(row => ({ row, topMatches: [], chosen: null, score: 0, confirmed: true, action: "new", breakdown: null }));

      const ms = [];
      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const top = getTopEstimateMatches(row, items, fields);
        const best = top[0];
        const chosen = best.score >= MIN_SCORE ? best.item : null;
        const action = best.score >= 45 ? "overwrite" : "new";
        ms.push({ row, topMatches: top, chosen, score: best.score, confirmed: best.score >= 75, action, breakdown: best.breakdown });
        if (i % 50 === 0) await new Promise(r => setTimeout(r, 0));
      }
      return ms;
    };

    const [upcResults, estResults] = await Promise.all([buildUPC(), buildEstimate()]);
    setMatchState(upcResults);
    setEstMatchState(estResults);
    setMatching(false);
    setStep(2);
  };

  // ── UPC match actions ──
  const confirm=i=>setMatchState(ms=>ms.map((m,j)=>j===i?{...m,confirmed:true}:m));
  const reject=i=>setMatchState(ms=>ms.map((m,j)=>j===i?{...m,chosen:null,confirmed:false}:m));
  const pickUpc=(i,upc)=>{setMatchState(ms=>ms.map((m,j)=>j===i?{...m,chosen:upc,score:100,confirmed:true,breakdown:null}:m));setActivePick(null);setUpcSearchIdx(null);setUpcSearch("");};

  // ── Estimate match actions ──
  const estConfirm = i => setEstMatchState(ms => ms.map((m, j) => j === i ? { ...m, confirmed: true, action: "overwrite" } : m));
  const estSetNew = i => setEstMatchState(ms => ms.map((m, j) => j === i ? { ...m, chosen: null, confirmed: true, action: "new" } : m));
  const estPickItem = (i, item) => { setEstMatchState(ms => ms.map((m, j) => j === i ? { ...m, chosen: item, score: 100, confirmed: true, action: "overwrite", breakdown: null } : m)); setEstActivePick(null); setEstSearchIdx(null); setEstSearch(""); };

  // ── Counters ──
  const confirmed_=matchState.filter(m=>m.confirmed).length;
  const unmatched_=matchState.filter(m=>!m.chosen).length;
  const needsReview=matchState.filter(m=>m.chosen&&!m.confirmed).length;
  const estOverwrite_ = estMatchState.filter(m => m.action === "overwrite" && m.chosen).length;
  const estNew_ = estMatchState.filter(m => m.action === "new" || !m.chosen).length;

  // ── Search helpers ──
  const filterUpc = (query) => {
    if (!query.trim()) return [];
    const q = normStr(query);
    return upcItems.filter(u => normStr(u.name).includes(q) || normStr(u.item_code||"").includes(q) || normStr(u.category||"").includes(q)).slice(0, 15);
  };
  const filterEstItems = (query) => {
    if (!query.trim() || !estimateItems) return [];
    const q = normStr(query);
    return estimateItems.filter(e => normStr(e.name).includes(q) || normStr(e.uom||"").includes(q)).slice(0, 15);
  };

  // ── Export: Ediphi import CSV (id, name, product, quantity) ──
  const exportCsv=()=>{
    const cols=["id","name","product","quantity"];
    const esc=v=>{const s=String(v??"");return s.includes(",")?`"${s.replace(/"/g,'""')}"`:s;};
    const lines=matchState.filter(m=>m.chosen).map((m,i)=>{
      const u=m.chosen;
      const estMatch = estMatchState[i];
      const lineItemId = (estMatch && estMatch.action === "overwrite" && estMatch.chosen) ? estMatch.chosen.id : "";
      const name = m.row[fields.name] ?? "";
      const productId = u.id || "";
      const qty = fields.qty ? (m.row[fields.qty] ?? "") : "";
      return [lineItemId, name, productId, qty].map(esc).join(",");
    });
    const a=document.createElement("a");
    a.href=URL.createObjectURL(new Blob([[cols.join(","),...lines].join("\n")],{type:"text/csv"}));
    a.download=`ediphi_import_${Date.now()}.csv`;a.click();setExported(true);
  };

  const FIELD_DEFS=[
    {key:"name",label:"Condition / Item Name",req:true,hint:"Name match (35%)"},
    {key:"uom",label:"Unit of Measure",req:true,hint:"UoM match (20%)"},
    {key:"mf3",label:"MF3 / Masterformat Level 3",req:false,hint:"MF3 match (15%)"},
    {key:"mf2",label:"MF2 / Masterformat Level 2",req:false,hint:"MF2 match (8%)"},
    {key:"uf3",label:"UF3 / Uniformat Level 3",req:false,hint:"UF3 match (10%)"},
    {key:"uf2",label:"UF2 / Uniformat Level 2",req:false,hint:"UF2 match (5%)"},
    {key:"bidpkg",label:"Bid Package",req:false,hint:"Bid Package match (4%)"},
    {key:"category",label:"Category / Type",req:false,hint:"Category match (3%)"},
    {key:"qty",label:"Quantity",req:false,hint:"Carries to export"},
    {key:"est_cost",label:"Estimated Cost",req:false,hint:"For accounting write-back"},
  ];

  return(
    <div className="max-w-5xl mx-auto p-5">
      <StepBar steps={T_STEPS} step={step}/>

      {step===0&&(
        <div className="bg-white rounded-2xl shadow-sm border p-6">
          <h2 className="font-semibold text-lg mb-1">Upload Takeoff File</h2>
          <p className="text-sm text-gray-500 mb-4">Supports XLSX, CSV, XML, OST — or use sample data.</p>
          <DropZone onFile={handleFile} label="Takeoff File — XLSX, CSV, XML, or OST" accept=".csv,.xlsx,.xls,.xml,.ost"/>
          <div className="mt-3 border-t pt-3">
            <button onClick={loadSample}
              className="w-full py-2.5 border-2 border-dashed border-blue-300 text-blue-700 rounded-xl text-sm font-semibold hover:bg-blue-50">
              🧪 Load Sample Takeoff (20 conditions)
            </button>
          </div>
          {parseErr&&<p className="mt-3 text-red-600 text-sm">{parseErr}</p>}
          {rows.length>0&&(
            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
              <span className="text-green-600">✓</span>
              <div><p className="font-medium text-green-800 text-sm">{file?.name}</p>
              <p className="text-green-600 text-xs">{rows.length} rows · {headers.length} columns</p></div>
            </div>
          )}
          <div className="mt-4 flex justify-end">
            <button disabled={!rows.length} onClick={()=>setStep(1)}
              className="px-5 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium disabled:opacity-40 hover:bg-blue-700">Next →</button>
          </div>
        </div>
      )}

      {step===1&&(
        <div className="bg-white rounded-2xl shadow-sm border p-6">
          <h2 className="font-semibold text-lg mb-1">Column Setup</h2>
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-700">
            💡 <strong>Scoring:</strong> Name 35% · UoM 20% · MF3 15% · UF3 10% · MF2 8% · UF2 5% · BP 4% · Cat 3% · Min: {MIN_SCORE}%
          </div>
          <div className="grid grid-cols-2 gap-3">
            {FIELD_DEFS.map(f=>(
              <div key={f.key} className="p-3 border rounded-xl">
                <label className="block text-sm font-semibold text-gray-700 mb-0.5">{f.label}{f.req&&<span className="text-red-500 ml-1">*</span>}</label>
                <p className="text-xs text-gray-400 mb-1.5">{f.hint}</p>
                <select value={fields[f.key]||""} onChange={e=>setFields(v=>({...v,[f.key]:e.target.value}))}
                  className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">— not mapped —</option>
                  {headers.map(h=><option key={h} value={h}>{h}</option>)}
                </select>
              </div>
            ))}
          </div>
          <div className="mt-4 flex justify-between">
            <button onClick={()=>setStep(0)} className="px-4 py-2 border rounded-lg text-sm text-gray-600 hover:bg-gray-50">← Back</button>
            <button disabled={!fields.name||!fields.uom||matching}
              onClick={runAllMatches}
              className="px-5 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium disabled:opacity-40 hover:bg-blue-700 flex items-center gap-2">
              {matching?<><span className="animate-spin">⟳</span> Running matches…</>:"Run All Matching →"}
            </button>
          </div>
        </div>
      )}

      {/* ── Step 2: Match Review ── */}
      {step===2&&(
        <div className="bg-white rounded-2xl shadow-sm border p-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-lg">Match Review</h2>
            <div className="flex gap-2 flex-wrap justify-end">
              <Badge color="green">{confirmed_} matched</Badge>
              <Badge color="red">{unmatched_} unmatched</Badge>
              {hasEstimate&&<Badge color="blue">{estOverwrite_} overwrite</Badge>}
              {hasEstimate&&<Badge color="yellow">{estNew_} new</Badge>}
            </div>
          </div>
          {estErr&&<div className="mb-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-700 text-sm">{estErr}</div>}

          <div className="space-y-3 max-h-[560px] overflow-y-auto pr-1">
            {matchState.map((m,idx)=>{
              const cf=m.chosen?confLabel(m.score):null;
              const em=estMatchState[idx];
              const isOverwrite=em&&em.action==="overwrite"&&em.chosen;
              const panel=expandPanel[idx]||null;
              return(
                <div key={idx} className={`border rounded-xl p-3 transition-all ${m.confirmed&&(!hasEstimate||em?.confirmed)?"bg-gray-50 border-gray-200":"bg-white"}`}>
                  {/* ── Row header ── */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-gray-800 truncate">#{idx+1} — {m.row[fields.name]||"(no name)"}</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {fields.qty&&<>Qty: <strong>{m.row[fields.qty]||"—"}</strong> · </>}
                        UoM: <strong>{m.row[fields.uom]||"—"}</strong>
                        {fields.mf3&&m.row[fields.mf3]&&<> · MF3: <strong>{m.row[fields.mf3]}</strong></>}
                      </p>
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      {m.confirmed&&<span className="px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs font-medium">UPC ✓</span>}
                      {hasEstimate&&isOverwrite&&em.confirmed&&<span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-medium">Est ✓</span>}
                      {hasEstimate&&(!isOverwrite)&&<span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded text-xs font-medium">New</span>}
                    </div>
                  </div>

                  {/* ── Compact match summary ── */}
                  <div className="mt-2 flex flex-col gap-1.5">
                    {/* UPC line */}
                    <div className="flex items-center gap-2 text-xs">
                      <span className="font-bold text-gray-400 w-8 flex-shrink-0 uppercase">UPC</span>
                      {m.chosen?(
                        <div className="flex items-center gap-1.5 flex-1 min-w-0">
                          <span className="text-gray-800 truncate font-medium">{m.chosen.name}</span>
                          {m.chosen.uom&&<Badge color="gray">{m.chosen.uom}</Badge>}
                          {cf&&<Badge color={cf.c}>{m.score}%</Badge>}
                        </div>
                      ):(
                        <span className="text-red-500 italic">No match</span>
                      )}
                    </div>
                    {/* Estimate line */}
                    {hasEstimate&&em&&(
                      <div className="flex items-center gap-2 text-xs">
                        <span className="font-bold text-gray-400 w-8 flex-shrink-0 uppercase">Est</span>
                        {em.chosen?(
                          <div className="flex items-center gap-1.5 flex-1 min-w-0">
                            <span className="text-gray-800 truncate font-medium">{em.chosen.name}</span>
                            {em.chosen.uom&&<Badge color="gray">{em.chosen.uom}</Badge>}
                            <Badge color="blue">{em.score}%</Badge>
                          </div>
                        ):(
                          <span className="text-yellow-600 italic">Add as new</span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* ── Action buttons ── */}
                  <div className="mt-2 flex gap-1.5 flex-wrap">
                    {!m.confirmed&&m.chosen&&(
                      <button onClick={()=>{confirm(idx);if(hasEstimate&&em&&!em.confirmed&&em.chosen)estConfirm(idx);}}
                        className="px-2.5 py-1 bg-green-600 text-white rounded text-xs font-medium hover:bg-green-700">Accept</button>
                    )}
                    {m.confirmed&&(!hasEstimate||!em||em.confirmed)&&(
                      <span className="px-2.5 py-1 bg-green-100 text-green-700 rounded text-xs font-medium">✓ Accepted</span>
                    )}
                    <button onClick={()=>togglePanel(idx,"est")}
                      className={`px-2.5 py-1 border rounded text-xs font-medium ${panel==="est"?"bg-blue-100 border-blue-300 text-blue-700":"text-gray-500 hover:bg-gray-50"}`}>
                      {hasEstimate?"Estimate Matches":"Ranked Matches"} {panel==="est"?"▴":"▾"}
                    </button>
                    <button onClick={()=>togglePanel(idx,"upc")}
                      className={`px-2.5 py-1 border rounded text-xs font-medium ${panel==="upc"?"bg-purple-100 border-purple-300 text-purple-700":"text-gray-500 hover:bg-gray-50"}`}>
                      Search UPC {panel==="upc"?"▴":"▾"}
                    </button>
                    {m.chosen&&!m.confirmed&&(
                      <button onClick={()=>reject(idx)} className="px-2.5 py-1 border rounded text-xs text-red-500 hover:bg-red-50">Reject</button>
                    )}
                    {hasEstimate&&em&&isOverwrite&&(
                      <button onClick={()=>estSetNew(idx)} className="px-2.5 py-1 border rounded text-xs text-yellow-700 hover:bg-yellow-50">Add New Instead</button>
                    )}
                  </div>

                  {/* ── Expandable: Estimate Matches (ranked) ── */}
                  {panel==="est"&&(
                    <div className="mt-2 border-t pt-2 space-y-1">
                      <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">{hasEstimate?"Estimate Line Items by Rank":"UPC Matches by Rank"}</p>
                      {hasEstimate&&em?(
                        <>
                          <input type="text" placeholder="Search estimate items…"
                            value={estSearchIdx===idx?estSearch:""}
                            onFocus={()=>{setEstSearchIdx(idx);setEstSearch("");}}
                            onChange={e=>{setEstSearchIdx(idx);setEstSearch(e.target.value);}}
                            className="w-full border border-gray-200 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-400 mb-1"/>
                          {estSearchIdx===idx&&estSearch.trim()?(
                            filterEstItems(estSearch).map((item,ei)=>(
                              <button key={ei} onClick={()=>{estPickItem(idx,item);togglePanel(idx,"est");}}
                                className="w-full text-left p-1.5 border rounded bg-white hover:bg-blue-50 hover:border-blue-300">
                                <div className="flex items-center justify-between gap-1">
                                  <p className="font-medium text-xs truncate flex-1">{item.name}</p>
                                  <div className="flex gap-1">{item.uom&&<Badge color="gray">{item.uom}</Badge>}{item.quantity!=null&&<Badge color="teal">Qty: {item.quantity}</Badge>}</div>
                                </div>
                              </button>
                            ))
                          ):(
                            em.topMatches&&em.topMatches.filter(t=>t.score>0).map((t,ti)=>(
                              <button key={ti} onClick={()=>{estPickItem(idx,t.item);togglePanel(idx,"est");}}
                                className={`w-full text-left p-1.5 border rounded hover:bg-blue-50 hover:border-blue-300 ${em.chosen&&em.chosen.id===t.item.id?"bg-blue-50 border-blue-300":"bg-white"}`}>
                                <div className="flex items-center justify-between gap-1">
                                  <p className="font-medium text-xs truncate flex-1">{t.item.name}</p>
                                  <div className="flex gap-1">
                                    {t.item.uom&&<Badge color="gray">{t.item.uom}</Badge>}
                                    <span className="text-xs text-gray-400 flex-shrink-0">{t.score}%</span>
                                  </div>
                                </div>
                              </button>
                            ))
                          )}
                          {(!em.topMatches||em.topMatches.filter(t=>t.score>0).length===0)&&!(estSearchIdx===idx&&estSearch.trim())&&(
                            <p className="text-xs text-gray-400 italic">No ranked matches. Use search above to find a specific item.</p>
                          )}
                        </>
                      ):(
                        /* No estimate — show ranked UPC matches instead */
                        m.topMatches.filter(t=>t.score>0).map((t,ti)=>(
                          <button key={ti} onClick={()=>{pickUpc(idx,t.upc);togglePanel(idx,"est");}}
                            className={`w-full text-left p-1.5 border rounded hover:bg-blue-50 hover:border-blue-300 ${m.chosen&&m.chosen.id===t.upc.id?"bg-blue-50 border-blue-300":"bg-white"}`}>
                            <div className="flex items-center justify-between gap-1">
                              <p className="font-medium text-xs truncate flex-1">{t.upc.name}</p>
                              <div className="flex gap-1">
                                {t.upc.uom&&<Badge color="gray">{t.upc.uom}</Badge>}
                                <span className="text-xs text-gray-400 flex-shrink-0">{t.score}%</span>
                              </div>
                            </div>
                          </button>
                        ))
                      )}
                    </div>
                  )}

                  {/* ── Expandable: UPC Search ── */}
                  {panel==="upc"&&(
                    <div className="mt-2 border-t pt-2 space-y-1">
                      <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Search UPC Catalog</p>
                      <input type="text" placeholder="Type to search by name, code, or category…"
                        value={upcSearchIdx===idx?upcSearch:""}
                        onFocus={()=>{setUpcSearchIdx(idx);setUpcSearch("");}}
                        onChange={e=>{setUpcSearchIdx(idx);setUpcSearch(e.target.value);}}
                        className="w-full border border-gray-200 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-purple-400 mb-1"/>
                      {upcSearchIdx===idx&&upcSearch.trim()?(
                        filterUpc(upcSearch).map((u,ui)=>(
                          <button key={ui} onClick={()=>{pickUpc(idx,u);togglePanel(idx,"upc");}}
                            className="w-full text-left p-1.5 border rounded bg-white hover:bg-purple-50 hover:border-purple-300">
                            <div className="flex items-center justify-between gap-1">
                              <p className="font-medium text-xs truncate flex-1">{u.name}</p>
                              <div className="flex gap-1">
                                {u.uom&&<Badge color="gray">{u.uom}</Badge>}
                                {u.item_code&&<Badge color="purple">{u.item_code}</Badge>}
                              </div>
                            </div>
                          </button>
                        ))
                      ):(
                        <p className="text-xs text-gray-400 italic">Start typing to search the UPC catalog.</p>
                      )}
                      {upcSearchIdx===idx&&upcSearch.trim()&&filterUpc(upcSearch).length===0&&(
                        <p className="text-xs text-gray-400 italic">No results found.</p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="mt-4 flex justify-between">
            <button onClick={()=>setStep(1)} className="px-4 py-2 border rounded-lg text-sm text-gray-600 hover:bg-gray-50">&larr; Back</button>
            <button onClick={()=>setStep(3)} disabled={confirmed_===0}
              className="px-5 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium disabled:opacity-40 hover:bg-blue-700">
              Export ({confirmed_}) &rarr;
            </button>
          </div>
        </div>
      )}

      {/* ── Step 3: Export ── */}
      {step===3&&(
        <div className="bg-white rounded-2xl shadow-sm border p-6">
          <h2 className="font-semibold text-lg mb-3">Export — Ediphi Import CSV</h2>
          <div className="flex gap-2 mb-4">
            <Badge color="green">{confirmed_} matched</Badge>
            <Badge color="red">{unmatched_} excluded</Badge>
            {estMatchState.length>0&&<Badge color="blue">{estOverwrite_} overwrite</Badge>}
            {estMatchState.length>0&&<Badge color="yellow">{estNew_} add new</Badge>}
          </div>
          <div className="overflow-auto max-h-56 border rounded-lg mb-4">
            <table className="text-xs w-full">
              <thead className="bg-gray-50 sticky top-0">
                <tr>{["#","id","name","product","quantity","Action"].map(h=>(
                  <th key={h} className="px-3 py-2 text-left font-medium text-gray-600 border-b whitespace-nowrap">{h}</th>))}</tr>
              </thead>
              <tbody>{matchState.map((m,i)=>{
                const estMatch=estMatchState[i];
                const isOverwrite=estMatch&&estMatch.action==="overwrite"&&estMatch.chosen;
                return(
                <tr key={i} className={`border-b ${!m.chosen?"bg-red-50":"hover:bg-gray-50"}`}>
                  <td className="px-3 py-1.5 text-gray-400">{i+1}</td>
                  <td className="px-3 py-1.5 font-mono text-xs max-w-24 truncate">{isOverwrite?estMatch.chosen.id.substring(0,8)+"…":"—"}</td>
                  <td className="px-3 py-1.5 max-w-36 truncate">{m.row[fields.name]||"—"}</td>
                  <td className="px-3 py-1.5 font-mono text-xs max-w-24 truncate">{m.chosen?m.chosen.id.substring(0,8)+"…":"—"}</td>
                  <td className="px-3 py-1.5">{fields.qty?m.row[fields.qty]||"—":"—"}</td>
                  <td className="px-3 py-1.5">{isOverwrite?<Badge color="blue">Overwrite</Badge>:<Badge color="yellow">New</Badge>}</td>
                </tr>);})}</tbody>
            </table>
          </div>
          <div className="flex justify-center gap-3 mb-3">
            <button onClick={exportCsv} className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold shadow-md">
              ⬇ Download Ediphi Import CSV ({confirmed_} items)
            </button>
          </div>
          {exported&&<p className="text-center text-green-600 text-sm mb-3">✓ Downloaded!</p>}
          <div className="flex justify-between mt-4">
            <button onClick={()=>setStep(2)} className="px-4 py-2 border rounded-lg text-sm text-gray-600 hover:bg-gray-50">← Back</button>
            <button onClick={()=>{setStep(0);setFile(null);setRows([]);setHeaders([]);setMatchState([]);setEstMatchState([]);setEstimateItems(null);setExported(false);}}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm">↺ Start Over</button>
          </div>
        </div>
      )}
    </div>
  );
}


// ══════════════════════════════════════════════════════════════════════════════
// ── ACCOUNTING PIPELINE ──────────────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════════════════
const A_STEPS=["Upload","Map Columns","Code Matching","Distribution Preview"];
function AccountingPipeline({upcItems, target}){
  const [step,setStep]=useState(0);
  const [file,setFile]=useState(null); const [rows,setRows]=useState([]); const [headers,setHeaders]=useState([]);
  const [parseErr,setParseErr]=useState(""); const [mapping,setMapping]=useState({});
  const [codeGroups,setCodeGroups]=useState({}); const [exported,setExported]=useState(false);

  const loadSample=()=>{
    Papa.parse(SAMPLE_SAGE,{header:true,skipEmptyLines:true,
      complete:r=>{setRows(r.data);setHeaders(r.meta.fields);setMapping(autoMapSage(r.meta.fields));
        setFile({name:"sample_sage_jobcost.csv"});setParseErr("");}});
  };
  const handleFile=f=>{setFile(f);setParseErr("");setRows([]);setHeaders([]);
    parseFile(f,(data,hdrs,err)=>{if(err||!data){setParseErr(err||"Parse failed");return;}
      setRows(data);setHeaders(hdrs);setMapping(autoMapSage(hdrs));});};
  const runBuild=()=>{setCodeGroups(buildCodeGroups(rows,mapping,upcItems));setStep(2);};

  const updateEstCost=(code,idx,val)=>{
    setCodeGroups(prev=>{const g={...prev[code]};
      g.lineItems=g.lineItems.map((li,i)=>i===idx?{...li,est_cost:parseFloat(val)||0}:li);
      g.distribution=distributeActuals(g); return{...prev,[code]:g};});
  };
  const removeItem=(code,idx)=>{
    setCodeGroups(prev=>{const g={...prev[code]};
      g.lineItems=g.lineItems.filter((_,i)=>i!==idx);
      g.distribution=g.lineItems.length>0?distributeActuals(g):[]; return{...prev,[code]:g};});
  };

  const codeList=Object.values(codeGroups);
  const mappedCodes=codeList.filter(g=>g.lineItems.length>0).length;

  const exportWriteback=()=>{
    const cols=["Cost Code","Description","Line Item","UOM","UPC ID","MF3","Share %",
      "New Total Cost","New Unit Cost","Productivity (hrs/unit)","Labor Actual","Material Actual","Equipment Actual","Sub Actual"];
    const esc=v=>{const s=String(v??"");return s.includes(",")?`"${s}"`:s;};
    const lines=[];
    codeList.filter(g=>g.distribution.length>0).forEach(g=>{
      g.distribution.forEach(li=>{
        lines.push([g.code,g.description,li.name,li.uom,li.upc_id||"",li.mf3_code||"",
          li.share+"%",li.new_total.toFixed(2),li.new_unit.toFixed(4),li.new_productivity.toFixed(4),
          g.labor.act_cost.toFixed(2),g.material.act_cost.toFixed(2),
          g.equipment.act_cost.toFixed(2),g.sub.act_cost.toFixed(2)].map(esc).join(","));
      });
    });
    const a=document.createElement("a");
    a.href=URL.createObjectURL(new Blob([[cols.join(","),...lines].join("\n")],{type:"text/csv"}));
    a.download=`ediphi_writeback_${Date.now()}.csv`;a.click();setExported(true);
  };

  return(
    <div className="max-w-5xl mx-auto p-5">
      <StepBar steps={A_STEPS} step={step} color="purple"/>

      {step===0&&(
        <div className="bg-white rounded-2xl shadow-sm border p-6">
          <h2 className="font-semibold text-lg mb-1">Upload Sage 100/300 Export</h2>
          <p className="text-sm text-gray-500 mb-4">Job Cost Detail — CSV or Excel.</p>
          <DropZone onFile={handleFile} label="Sage Job Cost Export" icon="📊"/>
          <div className="mt-3 border-t pt-3">
            <button onClick={loadSample}
              className="w-full py-2.5 border-2 border-dashed border-purple-300 text-purple-700 rounded-xl text-sm font-semibold hover:bg-purple-50">
              🧪 Load Sample Sage Data (20 rows)
            </button>
          </div>
          {parseErr&&<p className="mt-3 text-red-600 text-sm">{parseErr}</p>}
          {rows.length>0&&(
            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
              <span className="text-green-600">✓</span>
              <div><p className="font-medium text-green-800 text-sm">{file?.name}</p>
              <p className="text-green-600 text-xs">{rows.length} rows · {headers.length} columns</p></div>
            </div>
          )}
          <div className="mt-4 flex justify-end">
            <button disabled={!rows.length} onClick={()=>setStep(1)}
              className="px-5 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium disabled:opacity-40 hover:bg-purple-700">Next →</button>
          </div>
        </div>
      )}

      {step===1&&(
        <div className="bg-white rounded-2xl shadow-sm border p-6">
          <h2 className="font-semibold text-lg mb-1">Map Sage Columns</h2>
          <div className="grid grid-cols-2 gap-3">
            {[
              {key:"cost_code",label:"Cost Code",req:true,hint:"Phase-Cost format"},
              {key:"description",label:"Description",req:true,hint:"For UPC matching"},
              {key:"act_cost",label:"Actual Cost",req:true,hint:"Invoiced/paid"},
              {key:"est_cost",label:"Estimated Cost",req:true,hint:"Budget — drives split"},
              {key:"cost_type",label:"Cost Type",req:false,hint:"L/M/E/S — critical for productivity"},
              {key:"act_qty",label:"Actual Quantity",req:false,hint:"Completed units"},
              {key:"act_hours",label:"Actual Hours",req:false,hint:"Labor hours"},
              {key:"est_hours",label:"Estimated Hours",req:false,hint:"Budgeted hours"},
            ].map(f=>(
              <div key={f.key} className="p-3 border rounded-xl">
                <label className="block text-sm font-semibold text-gray-700 mb-0.5">{f.label}{f.req&&<span className="text-red-500 ml-1">*</span>}</label>
                <p className="text-xs text-gray-400 mb-1.5">{f.hint}</p>
                <select value={mapping[f.key]||""} onChange={e=>setMapping(m=>({...m,[f.key]:e.target.value}))}
                  className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500">
                  <option value="">— not mapped —</option>
                  {headers.map(h=><option key={h} value={h}>{h}</option>)}
                </select>
              </div>
            ))}
          </div>
          <div className="mt-4 flex justify-between">
            <button onClick={()=>setStep(0)} className="px-4 py-2 border rounded-lg text-sm text-gray-600 hover:bg-gray-50">← Back</button>
            <button disabled={!mapping.cost_code||!mapping.act_cost||!mapping.est_cost} onClick={runBuild}
              className="px-5 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium disabled:opacity-40 hover:bg-purple-700">Match Cost Codes →</button>
          </div>
        </div>
      )}

      {step===2&&(
        <div className="bg-white rounded-2xl shadow-sm border p-6">
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-semibold text-lg">Cost Code Mapping</h2>
            <div className="flex gap-2"><Badge color="purple">{codeList.length} codes</Badge><Badge color="green">{mappedCodes} matched</Badge></div>
          </div>
          <div className="space-y-3 max-h-[480px] overflow-y-auto pr-1">
            {codeList.map(g=>(
              <div key={g.code} className={`border rounded-xl p-4 ${g.lineItems.length>0?"border-purple-200 bg-purple-50":"border-red-200 bg-red-50"}`}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="font-mono font-bold text-sm bg-white border px-2 py-0.5 rounded">{g.code}</span>
                    <p className="text-sm text-gray-700 mt-0.5">{g.description}</p>
                    <div className="flex gap-2 mt-1 flex-wrap">
                      {g.labor.act_cost>0&&<span className="text-xs text-blue-600 font-semibold">L: {fmt$(g.labor.act_cost)} ({g.labor.act_hours}hrs)</span>}
                      {g.material.act_cost>0&&<span className="text-xs text-green-600 font-semibold">M: {fmt$(g.material.act_cost)}</span>}
                      {g.equipment.act_cost>0&&<span className="text-xs text-orange-600 font-semibold">E: {fmt$(g.equipment.act_cost)}</span>}
                      {g.sub.act_cost>0&&<span className="text-xs text-purple-600 font-semibold">S: {fmt$(g.sub.act_cost)}</span>}
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs text-gray-500">Total Actual</p>
                    <p className="font-bold text-sm">{fmt$(g.act_cost)}</p>
                  </div>
                </div>
                {g.lineItems.length>0&&(
                  <div className="mt-3 space-y-2">
                    {g.lineItems.map((li,i)=>{
                      const dist=g.distribution[i];
                      return(
                        <div key={li.id} className={`bg-white border rounded-lg p-3 ${dist?.zero_est_warning?"border-orange-300":""}`}>
                          {dist?.zero_est_warning&&<p className="text-xs text-orange-600 font-semibold mb-1">⚠ $0 est cost — equal split</p>}
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm truncate">{li.name}</p>
                              <div className="flex gap-1 mt-0.5">
                                <Badge color="gray">{li.uom}</Badge>
                                {li.mf3_code&&<Badge color="blue">{li.mf3_code}</Badge>}
                              </div>
                            </div>
                            <button onClick={()=>removeItem(g.code,i)} className="text-xs text-red-400 hover:text-red-600">✕</button>
                          </div>
                          <div className="mt-2 grid grid-cols-3 gap-2">
                            <div>
                              <label className="text-xs text-gray-400 block mb-0.5">Est. Cost</label>
                              <input type="number" value={li.est_cost||""} onChange={e=>updateEstCost(g.code,i,e.target.value)}
                                className="w-full border border-gray-200 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-purple-400"/>
                            </div>
                            {dist&&<>
                              <div><p className="text-xs text-gray-400 mb-0.5">New Total ({dist.share}%)</p><p className="font-semibold text-sm">{fmt$(dist.new_total)}</p></div>
                              <div><p className="text-xs text-gray-400 mb-0.5">Unit Cost</p><p className="font-semibold text-sm">{fmt$(dist.new_unit)}</p></div>
                              {g.labor.act_hours>0&&<div className="col-span-3"><p className="text-xs text-gray-400 mb-0.5">Productivity (hrs/unit)</p>
                                <p className="font-semibold text-sm text-blue-700">{fmtN(dist.new_productivity)}</p></div>}
                            </>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
          <div className="mt-4 flex justify-between">
            <button onClick={()=>setStep(1)} className="px-4 py-2 border rounded-lg text-sm text-gray-600 hover:bg-gray-50">← Back</button>
            <button onClick={()=>setStep(3)} disabled={mappedCodes===0}
              className="px-5 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium disabled:opacity-40 hover:bg-purple-700">Preview →</button>
          </div>
        </div>
      )}

      {step===3&&(
        <div className="bg-white rounded-2xl shadow-sm border p-6">
          <h2 className="font-semibold text-lg mb-3">Distribution Preview</h2>
          <div className="overflow-auto max-h-[400px] border rounded-lg mb-5">
            <table className="text-xs w-full">
              <thead className="bg-gray-50 sticky top-0">
                <tr>{["Cost Code","Line Item","UoM","Share","New Total","Unit Cost","Prod"].map(h=>(
                  <th key={h} className="px-3 py-2 text-left font-medium text-gray-600 border-b whitespace-nowrap">{h}</th>))}</tr>
              </thead>
              <tbody>{codeList.filter(g=>g.distribution.length>0).flatMap(g=>
                g.distribution.map((li,i)=>(
                  <tr key={`${g.code}-${i}`} className="border-b hover:bg-gray-50">
                    <td className="px-3 py-1.5 font-mono text-gray-600">{g.code}</td>
                    <td className="px-3 py-1.5 max-w-36 truncate">{li.name}</td>
                    <td className="px-3 py-1.5">{li.uom}</td>
                    <td className="px-3 py-1.5"><Badge color="purple">{li.share}%</Badge></td>
                    <td className="px-3 py-1.5 font-semibold">{fmt$(li.new_total)}</td>
                    <td className="px-3 py-1.5">{fmt$(li.new_unit)}</td>
                    <td className="px-3 py-1.5 text-blue-600 font-semibold">{g.labor.act_hours>0?fmtN(li.new_productivity):"—"}</td>
                  </tr>)))}</tbody>
            </table>
          </div>
          <div className="flex justify-center mb-3">
            <button onClick={exportWriteback}
              className="px-8 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-semibold shadow-md">
              ⬇ Download Write-Back CSV
            </button>
          </div>
          {exported&&<p className="text-center text-green-600 text-sm mb-3">✓ Downloaded!</p>}
          <div className="flex justify-between mt-4">
            <button onClick={()=>setStep(2)} className="px-4 py-2 border rounded-lg text-sm text-gray-600 hover:bg-gray-50">← Back</button>
            <button onClick={()=>{setStep(0);setFile(null);setRows([]);setHeaders([]);setCodeGroups({});setExported(false);}}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm">↺ Start Over</button>
          </div>
        </div>
      )}
    </div>
  );
}
