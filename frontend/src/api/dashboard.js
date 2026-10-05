export async function loadDashboardStats() {
    const r = await fetch('/api/dashboard/stats/');
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return r.json();
}