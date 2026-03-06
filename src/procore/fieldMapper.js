// ══════════════════════════════════════════════════════════════════════════════
// Field Mapper — Procore ↔ Ediphi data transformations
// Keeps all mapping logic in one place for easy maintenance and eventual
// migration into the Ediphi core product.
// ══════════════════════════════════════════════════════════════════════════════

/**
 * Transform a Procore budget line item → Ediphi import row
 * Procore fields: { id, wbs_code: { flat_code, description }, description, uom, quantity, unit_cost, amount }
 * Ediphi import: { id, name, product, quantity }
 */
export function procoreToEdiphi(procoreLine, matchedUpcId = null, ediphiLineItemId = null) {
  return {
    id: ediphiLineItemId || "",                         // Ediphi line item ID (overwrite) or empty (new)
    name: procoreLine.description || "",                // Condition name
    product: matchedUpcId || "",                        // Matched UPC product ID
    quantity: procoreLine.quantity ?? "",                // Quantity
  };
}

/**
 * Transform an Ediphi line item → Procore budget line item create payload
 * Ediphi fields: { id, name, uom, quantity, total_uc, product, category }
 * Procore create: { wbs_code_id, description, uom, quantity, unit_cost }
 */
export function ediphiToProcore(ediphiLine, wbsCodeId = null) {
  const payload = {
    description: ediphiLine.name || "",
    uom: ediphiLine.uom || "",
    quantity: parseFloat(ediphiLine.quantity) || 0,
    unit_cost: parseFloat(ediphiLine.total_uc) || 0,
  };
  if (wbsCodeId) payload.wbs_code_id = wbsCodeId;
  return payload;
}

/**
 * Normalize a Procore budget line item into a flat object for the matching engine.
 * The matching engine expects: { name, uom, category, mf3_code, ... }
 */
export function normalizeProcoreLine(line) {
  const wbs = line.wbs_code || {};
  const costCode = wbs.flat_code || "";
  // Extract MasterFormat-style code from WBS flat_code if present
  // Procore WBS codes often follow patterns like "03-310" or "03 31 00"
  const mf3Code = costCode.replace(/-/g, " ").replace(/\s+/g, " ").trim();

  return {
    id: line.id,
    name: line.description || "",
    uom: line.uom || "",
    quantity: line.quantity ?? 0,
    unit_cost: line.unit_cost ?? 0,
    amount: line.amount ?? 0,
    category: wbs.description || "",
    cost_code: costCode,
    mf3_code: mf3Code,
    _raw: line, // keep original for reference
  };
}

/**
 * Normalize an Ediphi line item for push to Procore
 */
export function normalizeEdiphiLine(line) {
  return {
    id: line.id,
    name: line.name || "",
    uom: line.uom || "",
    quantity: parseFloat(line.quantity) || 0,
    unit_cost: parseFloat(line.total_uc) || 0,
    product_id: line.product || "",
    category: line.category || "",
  };
}

/**
 * Build a WBS code lookup map from Procore cost codes
 * Returns: Map<flatCode, { id, flat_code, description }>
 */
export function buildWbsLookup(wbsCodes) {
  const map = new Map();
  (wbsCodes || []).forEach(wbs => {
    if (wbs.flat_code) map.set(wbs.flat_code.toLowerCase().trim(), wbs);
  });
  return map;
}

/**
 * Attempt to find the best WBS code match for an Ediphi line item
 * Uses cost code / MF code matching
 */
export function matchWbsCode(ediphiLine, wbsLookup) {
  // Direct match on sort field codes
  const candidates = [
    ediphiLine.mf3_code,
    ediphiLine.mf2_code,
    ediphiLine.cost_code,
    ediphiLine.category,
  ].filter(Boolean);

  for (const code of candidates) {
    const normalized = code.toLowerCase().replace(/-/g, " ").replace(/\s+/g, " ").trim();
    // Try exact match
    if (wbsLookup.has(normalized)) return wbsLookup.get(normalized);
    // Try with dashes
    const dashed = normalized.replace(/\s/g, "-");
    if (wbsLookup.has(dashed)) return wbsLookup.get(dashed);
    // Try prefix match (e.g., "03 31" matches "03 31 00")
    for (const [key, val] of wbsLookup) {
      if (key.startsWith(normalized) || normalized.startsWith(key)) return val;
    }
  }
  return null;
}

/**
 * Summary stats for a sync operation
 */
export function syncSummary(results) {
  return {
    total: results.length,
    created: results.filter(r => r.action === "created").length,
    updated: results.filter(r => r.action === "updated").length,
    skipped: results.filter(r => r.action === "skipped").length,
    errors: results.filter(r => r.action === "error").length,
  };
}
