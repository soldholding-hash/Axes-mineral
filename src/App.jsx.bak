import { useState, useEffect, useRef } from "react";

// ─── Palette & Tokens ───────────────────────────────────────────────────────
const C = {
  bg: "#0A0A0F",
  bgCard: "#12121A",
  bgPanel: "#1A1A26",
  border: "#2A2A3E",
  copper: "#B87333",
  copperLight: "#D4956A",
  zinc: "#8FA3B1",
  zincLight: "#B8CCDA",
  lead: "#6B7280",
  leadLight: "#9CA3AF",
  gold: "#D4A853",
  goldLight: "#E8C87A",
  green: "#22C55E",
  red: "#EF4444",
  text: "#F1F0EE",
  textMuted: "#8B8B9E",
  textDim: "#5A5A72",
};

const METALS = {
  copper: { name: "Cuivre", symbol: "Cu", unit: "tonne", color: C.copper, colorLight: C.copperLight, icon: "⬡", basePrice: 9420, volatility: 0.012, minInvest: 500, returnRate: 0.148 },
  zinc:   { name: "Zinc",   symbol: "Zn", unit: "tonne", color: C.zinc,   colorLight: C.zincLight,   icon: "◈", basePrice: 2680, volatility: 0.018, minInvest: 300, returnRate: 0.112 },
  lead:   { name: "Plomb",  symbol: "Pb", unit: "tonne", color: C.lead,   colorLight: C.leadLight,   icon: "◆", basePrice: 2120, volatility: 0.015, minInvest: 200, returnRate: 0.095 },
};

// ─── Seed Data ───────────────────────────────────────────────────────────────
const seedUsers = [
  { id: 1, name: "Yann Chambard", email: "yann@axes-productivite.cg", password: "demo123", role: "admin", joined: "2024-01-15", balance: 250000, investments: [{ metal: "copper", amount: 50000, shares: 5.3, date: "2024-02-01" }, { metal: "zinc", amount: 30000, shares: 11.2, date: "2024-03-15" }] },
  { id: 2, name: "Marie Nzamba", email: "marie@gmail.com", password: "demo123", role: "user", joined: "2024-03-10", balance: 45000, investments: [{ metal: "copper", amount: 15000, shares: 1.59, date: "2024-04-01" }] },
];

function genPriceHistory(base, vol, days = 30) {
  const history = [];
  let price = base;
  const now = Date.now();
  for (let i = days; i >= 0; i--) {
    price = price * (1 + (Math.random() - 0.48) * vol);
    history.push({ date: new Date(now - i * 86400000), price: Math.round(price) });
  }
  return history;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function fmt(n, dec = 0) { return Number(n).toLocaleString("fr-FR", { minimumFractionDigits: dec, maximumFractionDigits: dec }); }
function fmtXAF(n) { return fmt(n) + " XAF"; }
function fmtUSD(n) { return "$" + fmt(n, 2); }

// ─── MiniChart ────────────────────────────────────────────────────────────────
function MiniChart({ data, color, width = 120, height = 40 }) {
  if (!data || data.length < 2) return null;
  const prices = data.map(d => d.price);
  const min = Math.min(...prices), max = Math.max(...prices);
  const range = max - min || 1;
  const pts = prices.map((p, i) => {
    const x = (i / (prices.length - 1)) * width;
    const y = height - ((p - min) / range) * height;
    return `${x},${y}`;
  }).join(" ");
  const trend = prices[prices.length - 1] >= prices[0];
  const lineColor = trend ? C.green : C.red;
  return (
    <svg width={width} height={height} style={{ overflow: "visible" }}>
      <defs>
        <linearGradient id={`grad-${color.replace("#","")}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={lineColor} stopOpacity="0.3" />
          <stop offset="100%" stopColor={lineColor} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polyline points={pts} fill="none" stroke={lineColor} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ─── Ticker Bar ───────────────────────────────────────────────────────────────
function TickerBar({ prices }) {
  const items = Object.entries(METALS).map(([k, m]) => {
    const p = prices[k] || m.basePrice;
    return `${m.symbol} (${m.name}) — ${fmtUSD(p)} / ${m.unit}`;
  });
  const text = [...items, ...items].join("    ·    ");
  return (
    <div style={{ background: "#0D0D16", borderBottom: `1px solid ${C.border}`, overflow: "hidden", height: 32, display: "flex", alignItems: "center" }}>
      <div style={{ color: C.copper, fontSize: 11, fontWeight: 700, padding: "0 16px", whiteSpace: "nowrap", letterSpacing: 1 }}>MARCHÉS</div>
      <div style={{ flex: 1, overflow: "hidden" }}>
        <div style={{
          display: "inline-block",
          whiteSpace: "nowrap",
          color: C.textMuted,
          fontSize: 11,
          fontFamily: "monospace",
          letterSpacing: 0.5,
          animation: "ticker 28s linear infinite",
        }}>{text}</div>
      </div>
      <style>{`@keyframes ticker { 0%{transform:translateX(0)} 100%{transform:translateX(-50%)} }`}</style>
    </div>
  );
}

// ─── Auth Page ────────────────────────────────────────────────────────────────
function AuthPage({ onLogin }) {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ name: "", email: "", password: "", confirm: "" });
  const [error, setError] = useState("");
  const [users, setUsers] = useState(seedUsers);

  const handle = (f) => setForm(p => ({ ...p, ...f }));

  const submit = () => {
    setError("");
    if (mode === "login") {
      const u = users.find(u => u.email === form.email && u.password === form.password);
      if (!u) return setError("Email ou mot de passe incorrect.");
      onLogin(u, users, setUsers);
    } else {
      if (!form.name.trim()) return setError("Nom requis.");
      if (!form.email.includes("@")) return setError("Email invalide.");
      if (form.password.length < 6) return setError("Mot de passe : 6 caractères minimum.");
      if (form.password !== form.confirm) return setError("Les mots de passe ne correspondent pas.");
      if (users.find(u => u.email === form.email)) return setError("Email déjà utilisé.");
      const newUser = { id: Date.now(), name: form.name, email: form.email, password: form.password, role: "user", joined: new Date().toISOString().split("T")[0], balance: 0, investments: [] };
      const updated = [...users, newUser];
      setUsers(updated);
      onLogin(newUser, updated, setUsers);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: C.bg, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
      {/* Logo */}
      <div style={{ textAlign: "center", marginBottom: 40 }}>
        <div style={{ fontSize: 48, marginBottom: 8 }}>⛏</div>
        <div style={{ fontSize: 28, fontWeight: 900, letterSpacing: -1 }}>
          <span style={{ color: C.copper }}>AXES</span>
          <span style={{ color: C.text }}> MINERALS</span>
        </div>
        <div style={{ color: C.textMuted, fontSize: 13, marginTop: 4, letterSpacing: 2 }}>PLATEFORME D'INVESTISSEMENT MINIER</div>
      </div>

      {/* Card */}
      <div style={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 16, padding: "36px 40px", width: 400, maxWidth: "90vw" }}>
        {/* Tabs */}
        <div style={{ display: "flex", background: C.bgPanel, borderRadius: 8, padding: 4, marginBottom: 28 }}>
          {["login", "register"].map(m => (
            <button key={m} onClick={() => { setMode(m); setError(""); }} style={{ flex: 1, padding: "8px 0", border: "none", borderRadius: 6, cursor: "pointer", fontWeight: 700, fontSize: 13, transition: "all .2s", background: mode === m ? C.copper : "transparent", color: mode === m ? "#fff" : C.textMuted }}>
              {m === "login" ? "Connexion" : "Inscription"}
            </button>
          ))}
        </div>

        {mode === "register" && (
          <Field label="Nom complet" value={form.name} onChange={v => handle({ name: v })} placeholder="Jean Mokolo" />
        )}
        <Field label="Adresse email" value={form.email} onChange={v => handle({ email: v })} placeholder="vous@email.com" type="email" />
        <Field label="Mot de passe" value={form.password} onChange={v => handle({ password: v })} type="password" />
        {mode === "register" && (
          <Field label="Confirmer le mot de passe" value={form.confirm} onChange={v => handle({ confirm: v })} type="password" />
        )}

        {error && <div style={{ background: "#2A1010", border: "1px solid #5A1A1A", borderRadius: 8, padding: "10px 14px", color: C.red, fontSize: 13, marginBottom: 16 }}>{error}</div>}

        <button onClick={submit} style={{ width: "100%", padding: "13px 0", background: `linear-gradient(135deg, ${C.copper}, ${C.copperLight})`, border: "none", borderRadius: 10, color: "#fff", fontWeight: 800, fontSize: 15, cursor: "pointer", letterSpacing: 0.5, marginTop: 4 }}>
          {mode === "login" ? "Se connecter →" : "Créer mon compte →"}
        </button>

        {mode === "login" && (
          <div style={{ marginTop: 16, padding: "12px 14px", background: C.bgPanel, borderRadius: 8, fontSize: 12, color: C.textMuted }}>
            <b style={{ color: C.textDim }}>Démo :</b> yann@axes-productivite.cg / demo123
          </div>
        )}
      </div>

      <div style={{ marginTop: 24, color: C.textDim, fontSize: 12, textAlign: "center" }}>
        Cuivre · Zinc · Plomb · Boko Songho, Congo
      </div>
    </div>
  );
}

function Field({ label, value, onChange, type = "text", placeholder }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: "block", color: C.textMuted, fontSize: 12, fontWeight: 600, marginBottom: 6, letterSpacing: 0.5 }}>{label}</label>
      <input type={type} value={value} placeholder={placeholder} onChange={e => onChange(e.target.value)}
        style={{ width: "100%", boxSizing: "border-box", padding: "11px 14px", background: C.bgPanel, border: `1px solid ${C.border}`, borderRadius: 8, color: C.text, fontSize: 14, outline: "none", fontFamily: "inherit" }} />
    </div>
  );
}

// ─── Dashboard ────────────────────────────────────────────────────────────────
function Dashboard({ user, users, setUsers, prices, histories, onLogout }) {
  const [page, setPage] = useState("home");
  const [investMetal, setInvestMetal] = useState(null);

  const currentUser = users.find(u => u.id === user.id) || user;

  const totalInvested = currentUser.investments.reduce((s, inv) => s + inv.amount, 0);
  const totalValue = currentUser.investments.reduce((s, inv) => {
    const m = METALS[inv.metal];
    const gain = m.returnRate * ((Date.now() - new Date(inv.date)) / (365 * 86400000));
    return s + inv.amount * (1 + gain);
  }, 0);
  const totalGain = totalValue - totalInvested;

  const nav = [
    { key: "home", label: "Accueil", icon: "⬡" },
    { key: "markets", label: "Marchés", icon: "📈" },
    { key: "portfolio", label: "Portefeuille", icon: "💼" },
    { key: "invest", label: "Investir", icon: "+" },
    ...(currentUser.role === "admin" ? [{ key: "admin", label: "Admin", icon: "⚙" }] : []),
  ];

  return (
    <div style={{ minHeight: "100vh", background: C.bg, fontFamily: "'Segoe UI', system-ui, sans-serif", color: C.text, display: "flex" }}>
      {/* Sidebar */}
      <div style={{ width: 220, background: C.bgCard, borderRight: `1px solid ${C.border}`, display: "flex", flexDirection: "column", position: "fixed", top: 0, bottom: 0 }}>
        <div style={{ padding: "24px 20px 20px", borderBottom: `1px solid ${C.border}` }}>
          <div style={{ fontSize: 18, fontWeight: 900, letterSpacing: -0.5 }}>
            <span style={{ color: C.copper }}>AXES</span>
            <span style={{ color: C.text }}> MINERALS</span>
          </div>
          <div style={{ color: C.textDim, fontSize: 11, marginTop: 2, letterSpacing: 1 }}>INVEST PLATFORM</div>
        </div>
        <nav style={{ flex: 1, padding: "16px 12px" }}>
          {nav.map(n => (
            <button key={n.key} onClick={() => setPage(n.key)} style={{
              display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "10px 12px", border: "none", borderRadius: 8, cursor: "pointer", textAlign: "left", fontSize: 14, fontWeight: 600, marginBottom: 4, transition: "all .15s",
              background: page === n.key ? `${C.copper}22` : "transparent",
              color: page === n.key ? C.copper : C.textMuted,
              borderLeft: page === n.key ? `3px solid ${C.copper}` : "3px solid transparent",
            }}>
              <span style={{ fontSize: 16 }}>{n.icon}</span> {n.label}
            </button>
          ))}
        </nav>
        <div style={{ padding: "16px 12px", borderTop: `1px solid ${C.border}` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: "50%", background: `linear-gradient(135deg, ${C.copper}, ${C.copperLight})`, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: 14 }}>
              {currentUser.name.charAt(0)}
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{currentUser.name.split(" ")[0]}</div>
              <div style={{ fontSize: 11, color: currentUser.role === "admin" ? C.gold : C.textDim }}>{currentUser.role === "admin" ? "Administrateur" : "Investisseur"}</div>
            </div>
          </div>
          <button onClick={onLogout} style={{ width: "100%", padding: "8px 0", background: "#2A1515", border: "1px solid #5A2020", borderRadius: 6, color: C.red, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
            Déconnexion
          </button>
        </div>
      </div>

      {/* Main */}
      <div style={{ marginLeft: 220, flex: 1, display: "flex", flexDirection: "column" }}>
        <TickerBar prices={prices} />
        <div style={{ flex: 1, padding: "28px 32px", maxWidth: 1100 }}>
          {page === "home" && <HomePage user={currentUser} prices={prices} histories={histories} totalInvested={totalInvested} totalValue={totalValue} totalGain={totalGain} onInvest={() => setPage("invest")} />}
          {page === "markets" && <MarketsPage prices={prices} histories={histories} />}
          {page === "portfolio" && <PortfolioPage user={currentUser} prices={prices} histories={histories} />}
          {page === "invest" && <InvestPage user={currentUser} users={users} setUsers={setUsers} prices={prices} histories={histories} />}
          {page === "admin" && currentUser.role === "admin" && <AdminPage users={users} prices={prices} />}
        </div>
      </div>
    </div>
  );
}

// ─── Home Page ────────────────────────────────────────────────────────────────
function HomePage({ user, prices, histories, totalInvested, totalValue, totalGain, onInvest }) {
  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ margin: 0, fontSize: 26, fontWeight: 900 }}>Bonjour, <span style={{ color: C.copper }}>{user.name.split(" ")[0]}</span> 👋</h1>
        <p style={{ color: C.textMuted, marginTop: 4, fontSize: 14 }}>Bienvenue sur votre tableau de bord d'investissement minier</p>
      </div>

      {/* KPI row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 28 }}>
        {[
          { label: "Solde disponible", value: fmtXAF(user.balance), icon: "💰", color: C.gold },
          { label: "Total investi", value: fmtXAF(totalInvested), icon: "📊", color: C.zinc },
          { label: "Valeur actuelle", value: fmtXAF(Math.round(totalValue)), icon: "📈", color: C.copper },
          { label: "Gain / Perte", value: (totalGain >= 0 ? "+" : "") + fmtXAF(Math.round(totalGain)), icon: totalGain >= 0 ? "🟢" : "🔴", color: totalGain >= 0 ? C.green : C.red },
        ].map(kpi => (
          <div key={kpi.label} style={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 12, padding: "18px 20px" }}>
            <div style={{ fontSize: 22, marginBottom: 8 }}>{kpi.icon}</div>
            <div style={{ color: kpi.color, fontWeight: 900, fontSize: 20, marginBottom: 4 }}>{kpi.value}</div>
            <div style={{ color: C.textMuted, fontSize: 12 }}>{kpi.label}</div>
          </div>
        ))}
      </div>

      {/* Metals quick view */}
      <div style={{ marginBottom: 28 }}>
        <h2 style={{ fontSize: 16, fontWeight: 800, marginBottom: 14, color: C.textMuted, letterSpacing: 1 }}>MÉTAUX DU MARCHÉ</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
          {Object.entries(METALS).map(([k, m]) => {
            const hist = histories[k] || [];
            const prev = hist.length > 1 ? hist[hist.length - 2].price : m.basePrice;
            const curr = prices[k] || m.basePrice;
            const pct = ((curr - prev) / prev * 100).toFixed(2);
            const up = curr >= prev;
            return (
              <div key={k} style={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 12, padding: "20px 20px 16px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                      <span style={{ color: m.color, fontSize: 20 }}>{m.icon}</span>
                      <span style={{ fontWeight: 800, fontSize: 16 }}>{m.name}</span>
                      <span style={{ color: C.textDim, fontSize: 12 }}>({m.symbol})</span>
                    </div>
                    <div style={{ fontSize: 22, fontWeight: 900, color: m.color }}>{fmtUSD(curr)}</div>
                    <div style={{ fontSize: 12, color: up ? C.green : C.red, marginTop: 2 }}>{up ? "▲" : "▼"} {Math.abs(pct)}% aujourd'hui</div>
                  </div>
                  <MiniChart data={hist.slice(-14)} color={m.color} width={80} height={36} />
                </div>
                <div style={{ marginTop: 14, paddingTop: 12, borderTop: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between", fontSize: 12, color: C.textMuted }}>
                  <span>Rendement annuel</span>
                  <span style={{ color: C.green, fontWeight: 700 }}>+{(m.returnRate * 100).toFixed(1)}%</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <button onClick={onInvest} style={{ padding: "14px 32px", background: `linear-gradient(135deg, ${C.copper}, ${C.copperLight})`, border: "none", borderRadius: 10, color: "#fff", fontWeight: 800, fontSize: 15, cursor: "pointer", letterSpacing: 0.5 }}>
        + Nouvel investissement
      </button>
    </div>
  );
}

// ─── Markets Page ─────────────────────────────────────────────────────────────
function MarketsPage({ prices, histories }) {
  return (
    <div>
      <h1 style={{ fontSize: 24, fontWeight: 900, marginBottom: 6 }}>Marchés des Métaux</h1>
      <p style={{ color: C.textMuted, fontSize: 14, marginBottom: 28 }}>Prix en temps réel · Bourse des métaux de Londres (LME)</p>
      {Object.entries(METALS).map(([k, m]) => {
        const hist = histories[k] || [];
        const curr = prices[k] || m.basePrice;
        const prev7 = hist.length > 7 ? hist[hist.length - 8].price : curr;
        const prev30 = hist.length > 0 ? hist[0].price : curr;
        const pct7 = ((curr - prev7) / prev7 * 100).toFixed(2);
        const pct30 = ((curr - prev30) / prev30 * 100).toFixed(2);
        return (
          <div key={k} style={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 12, padding: 24, marginBottom: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 20 }}>
              <span style={{ fontSize: 32, color: m.color }}>{m.icon}</span>
              <div>
                <div style={{ fontSize: 22, fontWeight: 900 }}>{m.name} <span style={{ color: C.textDim, fontSize: 14, fontWeight: 500 }}>/ {m.symbol}</span></div>
                <div style={{ color: C.textMuted, fontSize: 13 }}>USD / tonne métrique</div>
              </div>
              <div style={{ marginLeft: "auto", textAlign: "right" }}>
                <div style={{ fontSize: 28, fontWeight: 900, color: m.color }}>{fmtUSD(curr)}</div>
              </div>
            </div>
            {/* Sparkline */}
            <div style={{ background: C.bgPanel, borderRadius: 8, padding: "12px 16px", marginBottom: 16, overflow: "hidden" }}>
              <MiniChart data={hist} color={m.color} width={700} height={60} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
              {[
                { label: "7 jours", value: pct7, suffix: "%" },
                { label: "30 jours", value: pct30, suffix: "%" },
                { label: "Rendement annuel", value: (m.returnRate * 100).toFixed(1), suffix: "%" },
                { label: "Investissement min.", value: fmtXAF(m.minInvest), suffix: "" },
              ].map(s => (
                <div key={s.label} style={{ background: C.bg, borderRadius: 8, padding: "12px 14px" }}>
                  <div style={{ color: C.textDim, fontSize: 11, marginBottom: 4 }}>{s.label}</div>
                  <div style={{ fontWeight: 800, fontSize: 16, color: s.suffix === "%" ? (parseFloat(s.value) >= 0 ? C.green : C.red) : m.color }}>
                    {s.suffix === "%" && parseFloat(s.value) >= 0 ? "+" : ""}{s.value}{s.suffix}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Portfolio Page ───────────────────────────────────────────────────────────
function PortfolioPage({ user, prices }) {
  if (!user.investments.length) return (
    <div style={{ textAlign: "center", padding: "80px 0", color: C.textMuted }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>📭</div>
      <div style={{ fontSize: 18, fontWeight: 700 }}>Portefeuille vide</div>
      <div style={{ fontSize: 14, marginTop: 8 }}>Faites votre premier investissement pour commencer</div>
    </div>
  );
  return (
    <div>
      <h1 style={{ fontSize: 24, fontWeight: 900, marginBottom: 6 }}>Mon Portefeuille</h1>
      <p style={{ color: C.textMuted, fontSize: 14, marginBottom: 28 }}>Vos positions actives sur les matières premières</p>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {user.investments.map((inv, i) => {
          const m = METALS[inv.metal];
          const ageYears = (Date.now() - new Date(inv.date)) / (365 * 86400000);
          const gain = inv.amount * m.returnRate * ageYears;
          const value = inv.amount + gain;
          const pct = (gain / inv.amount * 100).toFixed(2);
          return (
            <div key={i} style={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 12, padding: 22 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                <span style={{ fontSize: 28, color: m.color }}>{m.icon}</span>
                <div>
                  <div style={{ fontWeight: 800, fontSize: 17 }}>{m.name}</div>
                  <div style={{ color: C.textMuted, fontSize: 12 }}>Depuis le {inv.date} · {inv.shares} parts</div>
                </div>
                <div style={{ marginLeft: "auto", textAlign: "right" }}>
                  <div style={{ fontSize: 20, fontWeight: 900, color: m.color }}>{fmtXAF(Math.round(value))}</div>
                  <div style={{ fontSize: 12, color: C.green }}>+{fmtXAF(Math.round(gain))} (+{pct}%)</div>
                </div>
              </div>
              {/* Progress bar */}
              <div style={{ background: C.bgPanel, borderRadius: 4, height: 6, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${Math.min(100, parseFloat(pct) * 3)}%`, background: `linear-gradient(90deg, ${m.color}, ${m.colorLight})`, borderRadius: 4 }} />
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, fontSize: 12, color: C.textDim }}>
                <span>Investi : {fmtXAF(inv.amount)}</span>
                <span>Rendement : +{(m.returnRate * 100).toFixed(1)}% / an</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Invest Page ──────────────────────────────────────────────────────────────
function InvestPage({ user, users, setUsers, prices, histories }) {
  const [selected, setSelected] = useState("copper");
  const [amount, setAmount] = useState("");
  const [duration, setDuration] = useState(12);
  const [success, setSuccess] = useState(false);

  const m = METALS[selected];
  const amt = parseFloat(amount) || 0;
  const annualReturn = m.returnRate;
  const projectedReturn = amt * annualReturn * (duration / 12);
  const totalProjected = amt + projectedReturn;
  const currentUser = users.find(u => u.id === user.id);

  const invest = () => {
    if (!amt || amt < m.minInvest) return;
    if (amt > currentUser.balance) return;
    const updatedUser = {
      ...currentUser,
      balance: currentUser.balance - amt,
      investments: [...currentUser.investments, { metal: selected, amount: amt, shares: parseFloat((amt / (prices[selected] || m.basePrice)).toFixed(4)), date: new Date().toISOString().split("T")[0] }],
    };
    setUsers(users.map(u => u.id === user.id ? updatedUser : u));
    setSuccess(true);
    setAmount("");
  };

  if (success) return (
    <div style={{ textAlign: "center", padding: "80px 0" }}>
      <div style={{ fontSize: 56, marginBottom: 20 }}>✅</div>
      <div style={{ fontSize: 24, fontWeight: 900, color: C.green, marginBottom: 8 }}>Investissement confirmé !</div>
      <div style={{ color: C.textMuted, fontSize: 15, marginBottom: 32 }}>Votre position a été ouverte avec succès.</div>
      <button onClick={() => setSuccess(false)} style={{ padding: "12px 28px", background: C.copper, border: "none", borderRadius: 8, color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
        Nouvel investissement
      </button>
    </div>
  );

  return (
    <div>
      <h1 style={{ fontSize: 24, fontWeight: 900, marginBottom: 6 }}>Investir</h1>
      <p style={{ color: C.textMuted, fontSize: 14, marginBottom: 28 }}>Choisissez un métal et définissez votre position</p>

      {/* Solde */}
      <div style={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 12, padding: "14px 20px", marginBottom: 24, display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ fontSize: 20 }}>💰</span>
        <span style={{ color: C.textMuted, fontSize: 14 }}>Solde disponible :</span>
        <span style={{ fontWeight: 900, fontSize: 18, color: C.gold, marginLeft: 4 }}>{fmtXAF(currentUser.balance)}</span>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 380px", gap: 24 }}>
        {/* Left: selector + form */}
        <div>
          {/* Metal selector */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: "block", color: C.textMuted, fontSize: 12, fontWeight: 700, letterSpacing: 1, marginBottom: 10 }}>CHOISIR UN MÉTAL</label>
            <div style={{ display: "flex", gap: 12 }}>
              {Object.entries(METALS).map(([k, met]) => (
                <button key={k} onClick={() => setSelected(k)} style={{
                  flex: 1, padding: "16px 12px", border: `2px solid ${selected === k ? met.color : C.border}`, borderRadius: 10, background: selected === k ? `${met.color}15` : C.bgCard, color: selected === k ? met.color : C.textMuted, cursor: "pointer", fontWeight: 700, fontSize: 14, transition: "all .2s"
                }}>
                  <div style={{ fontSize: 24, marginBottom: 4 }}>{met.icon}</div>
                  <div>{met.name}</div>
                  <div style={{ fontSize: 11, color: C.textDim, fontWeight: 400, marginTop: 2 }}>{fmtUSD(prices[k] || met.basePrice)}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Amount */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", color: C.textMuted, fontSize: 12, fontWeight: 700, letterSpacing: 1, marginBottom: 8 }}>MONTANT (XAF)</label>
            <div style={{ position: "relative" }}>
              <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder={`Min. ${fmtXAF(m.minInvest)}`}
                style={{ width: "100%", boxSizing: "border-box", padding: "13px 16px", background: C.bgPanel, border: `1px solid ${C.border}`, borderRadius: 10, color: C.text, fontSize: 16, fontWeight: 700, outline: "none", fontFamily: "inherit" }} />
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
              {[10000, 50000, 100000, 250000].map(v => (
                <button key={v} onClick={() => setAmount(String(v))} style={{ padding: "6px 12px", background: C.bgPanel, border: `1px solid ${C.border}`, borderRadius: 6, color: C.textMuted, fontSize: 12, cursor: "pointer" }}>
                  {v >= 1000 ? (v / 1000) + "k" : v}
                </button>
              ))}
            </div>
          </div>

          {/* Duration */}
          <div style={{ marginBottom: 24 }}>
            <label style={{ display: "block", color: C.textMuted, fontSize: 12, fontWeight: 700, letterSpacing: 1, marginBottom: 8 }}>
              DURÉE : <span style={{ color: m.color }}>{duration} mois</span>
            </label>
            <input type="range" min="3" max="60" step="3" value={duration} onChange={e => setDuration(Number(e.target.value))}
              style={{ width: "100%", accentColor: m.color }} />
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: C.textDim, marginTop: 4 }}>
              <span>3 mois</span><span>5 ans</span>
            </div>
          </div>

          <button onClick={invest} disabled={!amt || amt < m.minInvest || amt > currentUser.balance}
            style={{ width: "100%", padding: "15px 0", background: amt && amt >= m.minInvest && amt <= currentUser.balance ? `linear-gradient(135deg, ${m.color}, ${m.colorLight})` : C.bgPanel, border: "none", borderRadius: 10, color: "#fff", fontWeight: 800, fontSize: 16, cursor: amt ? "pointer" : "not-allowed", transition: "all .2s" }}>
            Confirmer l'investissement
          </button>
          {amt > 0 && amt < m.minInvest && <div style={{ marginTop: 8, color: C.red, fontSize: 12 }}>Minimum : {fmtXAF(m.minInvest)}</div>}
          {amt > currentUser.balance && <div style={{ marginTop: 8, color: C.red, fontSize: 12 }}>Solde insuffisant</div>}
        </div>

        {/* Right: Simulation */}
        <div style={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 12, padding: 24, height: "fit-content" }}>
          <div style={{ fontWeight: 800, fontSize: 16, marginBottom: 20, color: C.text }}>Simulation de rendement</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {[
              { label: "Métal choisi", value: `${m.icon} ${m.name}`, color: m.color },
              { label: "Montant investi", value: fmtXAF(amt || 0), color: C.text },
              { label: "Durée", value: `${duration} mois`, color: C.text },
              { label: "Taux annuel estimé", value: `+${(m.returnRate * 100).toFixed(1)}%`, color: C.green },
              { label: "Gain projeté", value: `+${fmtXAF(Math.round(projectedReturn))}`, color: C.green },
              { label: "Valeur finale estimée", value: fmtXAF(Math.round(totalProjected)), color: m.color },
            ].map(row => (
              <div key={row.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: 14, borderBottom: `1px solid ${C.border}` }}>
                <span style={{ color: C.textMuted, fontSize: 13 }}>{row.label}</span>
                <span style={{ fontWeight: 800, color: row.color, fontSize: 14 }}>{row.value}</span>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 16, padding: "12px 14px", background: "#0A1A0A", border: "1px solid #1A3A1A", borderRadius: 8, fontSize: 11, color: "#5A8A5A", lineHeight: 1.6 }}>
            ⚠ Les rendements présentés sont estimatifs et basés sur les performances historiques. Les investissements en matières premières comportent des risques de perte en capital.
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Admin Page ───────────────────────────────────────────────────────────────
function AdminPage({ users, prices }) {
  const totalAssets = users.reduce((s, u) => s + u.investments.reduce((si, inv) => si + inv.amount, 0), 0);
  const totalUsers = users.length;
  const totalInvestors = users.filter(u => u.investments.length > 0).length;
  return (
    <div>
      <h1 style={{ fontSize: 24, fontWeight: 900, marginBottom: 6 }}>Administration</h1>
      <p style={{ color: C.textMuted, fontSize: 14, marginBottom: 28 }}>Vue globale de la plateforme</p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 28 }}>
        {[
          { label: "Utilisateurs", value: totalUsers, icon: "👥", color: C.zinc },
          { label: "Investisseurs actifs", value: totalInvestors, icon: "💼", color: C.copper },
          { label: "Actifs sous gestion", value: fmtXAF(totalAssets), icon: "🏦", color: C.gold },
        ].map(kpi => (
          <div key={kpi.label} style={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 12, padding: "20px 22px" }}>
            <div style={{ fontSize: 24, marginBottom: 8 }}>{kpi.icon}</div>
            <div style={{ fontSize: 22, fontWeight: 900, color: kpi.color }}>{kpi.value}</div>
            <div style={{ color: C.textMuted, fontSize: 13, marginTop: 4 }}>{kpi.label}</div>
          </div>
        ))}
      </div>
      <div style={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 12, overflow: "hidden" }}>
        <div style={{ padding: "16px 20px", borderBottom: `1px solid ${C.border}`, fontWeight: 700, fontSize: 14 }}>Liste des utilisateurs</div>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ background: C.bgPanel }}>
              {["Nom", "Email", "Rôle", "Inscrit le", "Solde", "Investissements"].map(h => (
                <th key={h} style={{ padding: "10px 16px", textAlign: "left", color: C.textMuted, fontWeight: 600, fontSize: 12 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id} style={{ borderTop: `1px solid ${C.border}` }}>
                <td style={{ padding: "12px 16px", fontWeight: 700 }}>{u.name}</td>
                <td style={{ padding: "12px 16px", color: C.textMuted }}>{u.email}</td>
                <td style={{ padding: "12px 16px" }}>
                  <span style={{ padding: "3px 8px", borderRadius: 4, fontSize: 11, fontWeight: 700, background: u.role === "admin" ? `${C.gold}22` : `${C.zinc}22`, color: u.role === "admin" ? C.gold : C.zinc }}>
                    {u.role === "admin" ? "Admin" : "Investisseur"}
                  </span>
                </td>
                <td style={{ padding: "12px 16px", color: C.textMuted }}>{u.joined}</td>
                <td style={{ padding: "12px 16px", color: C.gold, fontWeight: 700 }}>{fmtXAF(u.balance)}</td>
                <td style={{ padding: "12px 16px" }}>
                  <div style={{ display: "flex", gap: 6 }}>
                    {u.investments.map((inv, i) => (
                      <span key={i} style={{ padding: "2px 8px", borderRadius: 4, fontSize: 11, background: `${METALS[inv.metal]?.color}22`, color: METALS[inv.metal]?.color }}>
                        {METALS[inv.metal]?.symbol} {fmtXAF(inv.amount)}
                      </span>
                    ))}
                    {!u.investments.length && <span style={{ color: C.textDim }}>—</span>}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── App Root ─────────────────────────────────────────────────────────────────
export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [users, setUsers] = useState(seedUsers);
  const [prices, setPrices] = useState(() => Object.fromEntries(Object.entries(METALS).map(([k, m]) => [k, m.basePrice])));
  const [histories] = useState(() => Object.fromEntries(Object.entries(METALS).map(([k, m]) => [k, genPriceHistory(m.basePrice, m.volatility)])));

  // Simulate live prices
  useEffect(() => {
    const id = setInterval(() => {
      setPrices(p => Object.fromEntries(Object.entries(METALS).map(([k, m]) => [k, Math.round(p[k] * (1 + (Math.random() - 0.49) * m.volatility * 0.3))])));
    }, 3500);
    return () => clearInterval(id);
  }, []);

  const handleLogin = (user, updatedUsers, setU) => {
    setCurrentUser(user);
    setUsers(updatedUsers);
    if (setU) setUsers(updatedUsers);
  };

  if (!currentUser) return <AuthPage onLogin={handleLogin} />;

  return (
    <Dashboard
      user={currentUser}
      users={users}
      setUsers={setUsers}
      prices={prices}
      histories={histories}
      onLogout={() => setCurrentUser(null)}
    />
  );
}
