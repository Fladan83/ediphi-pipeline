// ══════════════════════════════════════════════════════════════════════════════
// Procore API Client — talks to /api/procore serverless proxy
// All Procore credentials are server-side; this file only sends requests.
// ══════════════════════════════════════════════════════════════════════════════

const proxy = async (endpoint, method = "GET", body = null, companyId = null) => {
  const payload = { action: "proxy", endpoint, method };
  if (body) payload.body = body;
  if (companyId) payload.companyId = companyId;

  const res = await fetch("/api/procore", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const json = await res.json();
  if (!res.ok || json.error) throw new Error(json.error || `Procore error ${res.status}`);
  return json;
};

/** Paginate through all pages of a GET endpoint */
const paginateAll = async (endpoint, companyId = null, perPage = 100) => {
  let page = 1;
  let all = [];
  while (true) {
    const sep = endpoint.includes("?") ? "&" : "?";
    const json = await proxy(`${endpoint}${sep}page=${page}&per_page=${perPage}`, "GET", null, companyId);
    const data = json.data;
    if (!data || !Array.isArray(data) || data.length === 0) break;
    all = all.concat(data);
    if (data.length < perPage) break;
    page++;
  }
  return all;
};

const ProcoreAPI = {
  // ── Connection test ──────────────────────────────────────────────────────
  validateAuth: async () => {
    const res = await fetch("/api/procore", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "token" }),
    });
    const json = await res.json();
    if (!res.ok || !json.ok) throw new Error(json.error || "Procore auth failed");
    return true;
  },

  // ── Companies ────────────────────────────────────────────────────────────
  listCompanies: async () => {
    const json = await proxy("/rest/v1.1/companies");
    return json.data;
  },

  // ── Projects ─────────────────────────────────────────────────────────────
  listProjects: async (companyId) => {
    return paginateAll(`/rest/v1.1/projects?company_id=${companyId}`, companyId);
  },

  getProject: async (projectId, companyId) => {
    const json = await proxy(`/rest/v1.1/projects/${projectId}`, "GET", null, companyId);
    return json.data;
  },

  // ── Cost Codes ───────────────────────────────────────────────────────────
  listCostCodes: async (projectId, companyId) => {
    return paginateAll(`/rest/v1.1/projects/${projectId}/cost_codes`, companyId);
  },

  // ── WBS Codes ────────────────────────────────────────────────────────────
  listWbsCodes: async (projectId, companyId) => {
    return paginateAll(`/rest/v1.1/projects/${projectId}/wbs_codes`, companyId);
  },

  // ── Budget Line Items (READ) ─────────────────────────────────────────────
  listBudgetLineItems: async (projectId, companyId) => {
    return paginateAll(`/rest/v1.1/projects/${projectId}/budget_line_items`, companyId);
  },

  // ── Budget Line Items (WRITE) ────────────────────────────────────────────
  createBudgetLineItem: async (projectId, companyId, lineItem) => {
    const json = await proxy(
      `/rest/v1.1/projects/${projectId}/budget_line_items`,
      "POST",
      { budget_line_item: lineItem },
      companyId
    );
    return json.data;
  },

  updateBudgetLineItem: async (projectId, companyId, lineItemId, updates) => {
    const json = await proxy(
      `/rest/v1.1/projects/${projectId}/budget_line_items/${lineItemId}`,
      "PATCH",
      { budget_line_item: updates },
      companyId
    );
    return json.data;
  },

  // ── Budget Views ─────────────────────────────────────────────────────────
  listBudgetViews: async (projectId, companyId) => {
    const json = await proxy(`/rest/v1.1/projects/${projectId}/budget_views`, "GET", null, companyId);
    return json.data;
  },

  getBudgetViewDetail: async (projectId, companyId, budgetViewId) => {
    return paginateAll(
      `/rest/v1.1/projects/${projectId}/budget_views/${budgetViewId}/detail_rows`,
      companyId
    );
  },

  // ── Direct Costs ─────────────────────────────────────────────────────────
  listDirectCosts: async (projectId, companyId) => {
    return paginateAll(`/rest/v1.1/projects/${projectId}/direct_costs`, companyId);
  },

  createDirectCost: async (projectId, companyId, directCost) => {
    const json = await proxy(
      `/rest/v1.1/projects/${projectId}/direct_costs`,
      "POST",
      { direct_cost: directCost },
      companyId
    );
    return json.data;
  },

  // ── Line Item Types ──────────────────────────────────────────────────────
  listLineItemTypes: async (companyId) => {
    const json = await proxy(`/rest/v1.1/line_item_types?company_id=${companyId}`, "GET", null, companyId);
    return json.data;
  },
};

export default ProcoreAPI;
