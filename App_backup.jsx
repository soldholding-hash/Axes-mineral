import { useState, useEffect } from "react";
import { supabase } from "./supabase.js";
import WalletPage from "./Wallet.jsx";

const C = {
  bg: "#0A0A0F", bgCard: "#12121A", bgPanel: "#1A1A26", border: "#2A2A3E",
  copper: "#B87333", copperLight: "#D4956A", gold: "#D4A853",
  green: "#22C55E", red: "#EF4444", blue: "#3B82F6",
  zinc: "#8FA3B1", lead: "#6B7280",
  text: "#F1F0EE", textMuted: "#8B8B9E", textDim: "#5A5A72",
};

const METALS = {
  copper: { name: "Cuivre", symbol: "Cu", color: C.copper, colorLight: C.copperLight, icon: "⬡", basePrice: 9420, volatility: 0.012, minInvest: 500, returnRate: 0.148 },
  zinc:   { name: "Zinc",   symbol: "Zn", color: C.zinc,   colorLight: "#B8CCDA",      icon: "◈", basePrice: 2680, volatility: 0.018, minInvest: 300, returnRate: 0.112 },
  lead:   { name: "Plomb",  symbol: "Pb", color: C.lead,   colorLight: "#9CA3AF",      icon: "◆", basePrice: 2120, volatility: 0.015, minInvest: 200, returnRate: 0.095 },
};

const CRYPTO_BASE = { BTC: 67500, ETH: 3420, USDT: 1 };

function fmt(n, dec = 0) { return Number(n).toLocaleString("fr-FR", { minimumFractionDigits: dec, maximumFractionDigits: dec }); }
function fmtXAF(n) { return fmt(Math.round(n)) + " XAF"; }
function fmtUSD(n) { return "$" + fmt(n, 2); }

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

// ─── MiniChart ────────────────────────────────────────────────────────────────
function MiniChart({ data, color, width = 120, height = 40 }) {
  if (!data || data.length < 2) return null;
  const prices = data.map(d => d.price);
  const min = Math.min(...prices), max = Math.max(...prices);
  const range = max - min || 1;
  const pts = prices.map((p, i) => `${(i / (prices.length - 1)) * width},${height - ((p - min) / range) * height}`).join(" ");
  const trend = prices[prices.length - 1] >= prices[0];
  const lineColor = trend ? C.green : C.red;
  return (
    <svg width={width} height={height} style={{ overflow: "visible" }}>
      <polyline points={pts} fill="none" stroke={lineColor} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ─── TickerBar ────────────────────────────────────────────────────────────────
function TickerBar({ prices, cryptoPrices }) {
  const text = [
    `Cu — $${fmt(prices.copper)}/t`,
    `Zn — $${fmt(prices.zinc)}/t`,
    `Pb — $${fmt(prices.lead)}/t`,
    `BTC — $${fmt(cryptoPrices.BTC)}`,
    `ETH — $${fmt(cryptoPrices.ETH)}`,
    `USDT — $1.00`,
  ].join("    ·    ");
  const full = text + "    ·    " + text;
  return (
    <div style={{ background: "#0D0D16", borderBottom: `1px solid ${C.border}`, overflow: "hidden", height: 32, display: "flex", alignItems: "center" }}>
      <div style={{ color: C.copper, fontSize: 11, fontWeight: 700, padding: "0 16px", whiteSpace: "nowrap", letterSpacing: 1 }}>MARCHÉS</div>
      <div style={{ flex: 1, overflow: "hidden" }}>
        <div style={{ display: "inline-block", whiteSpace: "nowrap", color: C.textMuted, fontSize: 11, fontFamily: "monospace", animation: "ticker 28s linear infinite" }}>{full}</div>
      </div>
      <style>{`@keyframes ticker{0%{transform:translateX(0)}100%{transform:translateX(-50%)}}`}</style>
    </div>
  );
}

// ─── AUTH PAGE ────────────────────────────────────────────────────────────────
function AuthPage({ onLogin }) {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ name: "", email: "", password: "", confirm: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [registered, setRegistered] = useState(false);

  const handle = (f) => setForm(p => ({ ...p, ...f }));

  const submit = async () => {
    setError(""); setLoading(true);
    try {
      if (mode === "login") {
        const { data, error } = await supabase.auth.signInWithPassword({ email: form.email, password: form.password });
        if (error) return setError("Email ou mot de passe incorrect.");
        const { data: profile } = await supabase.from("profiles").select("*").eq("id", data.user.id).single();
        if (!profile) return setError("Profil introuvable.");
        if (profile.status === "pending") return setError("Votre compte est en attente de validation par l'administrateur.");
        if (profile.status === "rejected") return setError("Votre demande a été refusée. Contactez l'administrateur.");
        const { data: wallet } = await supabase.from("wallets").select("*").eq("user_id", data.user.id).single();
        const { data: investments } = await supabase.from("investments").select("*").eq("user_id", data.user.id);
        const { data: transactions } = await supabase.from("transactions").select("*").eq("user_id", data.user.id).order("created_at", { ascending: false });
        onLogin({ ...profile, authId: data.user.id, wallet, investments: investments || [], transactions: transactions || [] });
      } else {
        if (!form.name.trim()) return setError("Nom requis.");
        if (!form.email.includes("@")) return setError("Email invalide.");
        if (form.password.length < 6) return setError("Mot de passe : 6 caractères minimum.");
        if (form.password !== form.confirm) return setError("Les mots de passe ne correspondent pas.");
        const { error } = await supabase.auth.signUp({
          email: form.email, password: form.password,
          options: { data: { name: form.name, role: "user" } }
        });
        if (error) return setError(error.message);
        setRegistered(true);
      }
    } finally { setLoading(false); }
  };

  if (registered) return (
    <div style={{ minHeight: "100vh", background: C.bg, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
      <div style={{ textAlign: "center", maxWidth: 420, padding: "0 24px" }}>
        <div style={{ fontSize: 64, marginBottom: 20 }}>⏳</div>
        <div style={{ fontSize: 24, fontWeight: 900, color: C.copper, marginBottom: 12 }}>Demande envoyée !</div>
        <div style={{ color: C.textMuted, fontSize: 15, lineHeight: 1.7, marginBottom: 28 }}>
          Votre inscription est en attente de validation par l'administrateur.<br />
          Vous recevrez une confirmation dès l'approbation de votre compte.
        </div>
        <div style={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 12, padding: "16px 20px", marginBottom: 24, textAlign: "left" }}>
          <div style={{ color: C.textMuted, fontSize: 12, marginBottom: 8, fontWeight: 700 }}>VOTRE DEMANDE</div>
          <div style={{ fontWeight: 700 }}>{form.name}</div>
          <div style={{ color: C.textMuted, fontSize: 13 }}>{form.email}</div>
          <div style={{ marginTop: 10, display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: C.gold, animation: "pulse 1.5s infinite" }} />
            <span style={{ fontSize: 12, color: C.gold, fontWeight: 600 }}>En attente de validation</span>
          </div>
        </div>
        <button onClick={() => { setRegistered(false); setMode("login"); setForm({ name: "", email: "", password: "", confirm: "" }); }}
          style={{ padding: "12px 32px", background: `linear-gradient(135deg,${C.copper},${C.copperLight})`, border: "none", borderRadius: 10, color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
          Retour à la connexion
        </button>
      </div>
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}`}</style>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: C.bg, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
      <div style={{ textAlign: "center", marginBottom: 40 }}>
        <div style={{ fontSize: 48, marginBottom: 8 }}>⛏</div>
        <div style={{ fontSize: 28, fontWeight: 900, letterSpacing: -1 }}>
          <span style={{ color: C.copper }}>AXES</span><span style={{ color: C.text }}> MINERALS</span>
        </div>
        <div style={{ color: C.textMuted, fontSize: 13, marginTop: 4, letterSpacing: 2 }}>PLATEFORME D'INVESTISSEMENT MINIER</div>
      </div>
      <div style={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 16, padding: "36px 40px", width: 400, maxWidth: "90vw" }}>
        <div style={{ display: "flex", background: C.bgPanel, borderRadius: 8, padding: 4, marginBottom: 28 }}>
          {["login","register"].map(m => (
            <button key={m} onClick={() => { setMode(m); setError(""); }} style={{ flex: 1, padding: "8px 0", border: "none", borderRadius: 6, cursor: "pointer", fontWeight: 700, fontSize: 13, background: mode === m ? C.copper : "transparent", color: mode === m ? "#fff" : C.textMuted }}>
              {m === "login" ? "Connexion" : "Inscription"}
            </button>
          ))}
        </div>
        {mode === "register" && <Field label="Nom complet" value={form.name} onChange={v => handle({ name: v })} placeholder="Jean Mokolo" />}
        <Field label="Adresse email" value={form.email} onChange={v => handle({ email: v })} type="email" placeholder="vous@email.com" />
        <Field label="Mot de passe" value={form.password} onChange={v => handle({ password: v })} type="password" />
        {mode === "register" && <Field label="Confirmer le mot de passe" value={form.confirm} onChange={v => handle({ confirm: v })} type="password" />}
        {error && <div style={{ background: "#2A1010", border: "1px solid #5A1A1A", borderRadius: 8, padding: "10px 14px", color: C.red, fontSize: 13, marginBottom: 16 }}>{error}</div>}
        <button onClick={submit} disabled={loading} style={{ width: "100%", padding: "13px 0", background: loading ? C.bgPanel : `linear-gradient(135deg,${C.copper},${C.copperLight})`, border: "none", borderRadius: 10, color: "#fff", fontWeight: 800, fontSize: 15, cursor: loading ? "wait" : "pointer", marginTop: 4 }}>
          {loading ? "Chargement..." : mode === "login" ? "Se connecter →" : "Créer mon compte →"}
        </button>
      </div>
      <div style={{ marginTop: 20, color: C.textDim, fontSize: 12 }}>Cuivre · Zinc · Plomb · Boko Songho, Congo</div>
    </div>
  );
}

function Field({ label, value, onChange, type = "text", placeholder }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: "block", color: C.textMuted, fontSize: 12, fontWeight: 600, marginBottom: 6 }}>{label}</label>
      <input type={type} value={value} placeholder={placeholder} onChange={e => onChange(e.target.value)}
        style={{ width: "100%", boxSizing: "border-box", padding: "11px 14px", background: C.bgPanel, border: `1px solid ${C.border}`, borderRadius: 8, color: C.text, fontSize: 14, outline: "none", fontFamily: "inherit" }} />
    </div>
  );
}

// ─── DASHBOARD ────────────────────────────────────────────────────────────────
function Dashboard({ user, setUser, prices, cryptoPrices, histories, onLogout }) {
  const [page, setPage] = useState("home");
  const [pendingCount, setPendingCount] = useState(0);
  const [allUsers, setAllUsers] = useState([]);

  useEffect(() => {
    if (user.role === "admin") {
      supabase.from("profiles").select("*").eq("status", "pending").then(({ data }) => setPendingCount(data?.length || 0));
      supabase.from("profiles").select("*, investments(*), wallets(*)").then(({ data }) => setAllUsers(data || []));
    }
  }, [user]);

  const totalInvested = (user.investments || []).reduce((s, inv) => s + Number(inv.amount), 0);
  const totalValue = (user.investments || []).reduce((s, inv) => {
    const m = METALS[inv.metal];
    const ageYears = (Date.now() - new Date(inv.invested_at)) / (365 * 86400000);
    return s + Number(inv.amount) * (1 + m.returnRate * ageYears);
  }, 0);
  const totalGain = totalValue - totalInvested;

  const nav = [
    { key: "home",      label: "Accueil",           icon: "⬡" },
    { key: "markets",   label: "Marchés",           icon: "📈" },
    { key: "portfolio", label: "Portefeuille",      icon: "💼" },
    { key: "invest",    label: "Investir",          icon: "+" },
    { key: "wallet",    label: "Portefeuille Élec.", icon: "💳" },
    ...(user.role === "admin" ? [{ key: "admin", label: "Admin", icon: "⚙" }] : []),
  ];

  return (
    <div style={{ minHeight: "100vh", background: C.bg, fontFamily: "'Segoe UI', system-ui, sans-serif", color: C.text, display: "flex" }}>
      {/* Sidebar */}
      <div style={{ width: 220, background: C.bgCard, borderRight: `1px solid ${C.border}`, display: "flex", flexDirection: "column", position: "fixed", top: 0, bottom: 0 }}>
        <div style={{ padding: "24px 20px 20px", borderBottom: `1px solid ${C.border}` }}>
          <div style={{ fontSize: 18, fontWeight: 900 }}><span style={{ color: C.copper }}>AXES</span><span style={{ color: C.text }}> MINERALS</span></div>
          <div style={{ color: C.textDim, fontSize: 11, marginTop: 2, letterSpacing: 1 }}>INVEST PLATFORM</div>
        </div>
        <nav style={{ flex: 1, padding: "16px 12px" }}>
          {nav.map(n => {
            const badge = n.key === "admin" ? pendingCount : 0;
            return (
              <button key={n.key} onClick={() => setPage(n.key)} style={{
                display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "10px 12px",
                border: "none", borderRadius: 8, cursor: "pointer", textAlign: "left", fontSize: 14, fontWeight: 600, marginBottom: 4,
                background: page === n.key ? `${C.copper}22` : "transparent",
                color: page === n.key ? C.copper : C.textMuted,
                borderLeft: page === n.key ? `3px solid ${C.copper}` : "3px solid transparent",
              }}>
                <span style={{ fontSize: 16 }}>{n.icon}</span>
                <span style={{ flex: 1 }}>{n.label}</span>
                {badge > 0 && <span style={{ background: C.red, color: "#fff", borderRadius: "50%", width: 18, height: 18, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 900 }}>{badge}</span>}
              </button>
            );
          })}
        </nav>
        <div style={{ padding: "16px 12px", borderTop: `1px solid ${C.border}` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: "50%", background: `linear-gradient(135deg,${C.copper},${C.copperLight})`, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: 14 }}>
              {user.name?.charAt(0)}
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700 }}>{user.name?.split(" ")[0]}</div>
              <div style={{ fontSize: 11, color: user.role === "admin" ? C.gold : C.textDim }}>{user.role === "admin" ? "Administrateur" : "Investisseur"}</div>
            </div>
          </div>
          <button onClick={onLogout} style={{ width: "100%", padding: "8px 0", background: "#2A1515", border: "1px solid #5A2020", borderRadius: 6, color: C.red, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
            Déconnexion
          </button>
        </div>
      </div>

      {/* Main */}
      <div style={{ marginLeft: 220, flex: 1, display: "flex", flexDirection: "column" }}>
        <TickerBar prices={prices} cryptoPrices={cryptoPrices} />
        <div style={{ flex: 1, padding: "28px 32px", maxWidth: 1100 }}>
          {page === "home"      && <HomePage user={user} prices={prices} cryptoPrices={cryptoPrices} histories={histories} totalInvested={totalInvested} totalValue={totalValue} totalGain={totalGain} onInvest={() => setPage("invest")} />}
          {page === "markets"   && <MarketsPage prices={prices} histories={histories} />}
          {page === "portfolio" && <PortfolioPage user={user} />}
          {page === "invest"    && <InvestPage user={user} setUser={setUser} prices={prices} />}
          {page === "wallet"    && <WalletPage user={user} setUser={setUser} cryptoPrices={cryptoPrices} />}
          {page === "admin"     && user.role === "admin" && <AdminPage allUsers={allUsers} setAllUsers={setAllUsers} setPendingCount={setPendingCount} />}
        </div>
      </div>
    </div>
  );
}

// ─── HOME PAGE ────────────────────────────────────────────────────────────────
function HomePage({ user, prices, cryptoPrices, histories, totalInvested, totalValue, totalGain, onInvest }) {
  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ margin: 0, fontSize: 26, fontWeight: 900 }}>Bonjour, <span style={{ color: C.copper }}>{user.name?.split(" ")[0]}</span> 👋</h1>
        <p style={{ color: C.textMuted, marginTop: 4, fontSize: 14 }}>Bienvenue sur votre tableau de bord d'investissement minier</p>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16, marginBottom: 28 }}>
        {[
          { label: "Solde XAF", value: fmtXAF(user.wallet?.xaf || 0), icon: "💰", color: C.gold },
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
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16, marginBottom: 24 }}>
        {Object.entries(METALS).map(([k, m]) => {
          const hist = histories[k] || [];
          const curr = prices[k] || m.basePrice;
          const prev = hist.length > 1 ? hist[hist.length - 2].price : curr;
          const pct = ((curr - prev) / prev * 100).toFixed(2);
          const up = curr >= prev;
          return (
            <div key={k} style={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 12, padding: "20px 20px 16px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                    <span style={{ color: m.color, fontSize: 20 }}>{m.icon}</span>
                    <span style={{ fontWeight: 800, fontSize: 16 }}>{m.name}</span>
                  </div>
                  <div style={{ fontSize: 22, fontWeight: 900, color: m.color }}>{fmtUSD(curr)}</div>
                  <div style={{ fontSize: 12, color: up ? C.green : C.red, marginTop: 2 }}>{up ? "▲" : "▼"} {Math.abs(pct)}%</div>
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
      <button onClick={onInvest} style={{ padding: "14px 32px", background: `linear-gradient(135deg,${C.copper},${C.copperLight})`, border: "none", borderRadius: 10, color: "#fff", fontWeight: 800, fontSize: 15, cursor: "pointer" }}>
        + Nouvel investissement
      </button>
    </div>
  );
}

// ─── MARKETS PAGE ─────────────────────────────────────────────────────────────
function MarketsPage({ prices, histories }) {
  return (
    <div>
      <h1 style={{ fontSize: 24, fontWeight: 900, marginBottom: 6 }}>Marchés des Métaux</h1>
      <p style={{ color: C.textMuted, fontSize: 14, marginBottom: 28 }}>Prix en temps réel · LME</p>
      {Object.entries(METALS).map(([k, m]) => {
        const hist = histories[k] || [];
        const curr = prices[k] || m.basePrice;
        const prev7 = hist.length > 7 ? hist[hist.length - 8].price : curr;
        const prev30 = hist.length > 0 ? hist[0].price : curr;
        return (
          <div key={k} style={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 12, padding: 24, marginBottom: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 16 }}>
              <span style={{ fontSize: 32, color: m.color }}>{m.icon}</span>
              <div>
                <div style={{ fontSize: 20, fontWeight: 900 }}>{m.name} <span style={{ color: C.textDim, fontSize: 13 }}>/ {m.symbol}</span></div>
                <div style={{ color: C.textMuted, fontSize: 13 }}>USD / tonne métrique</div>
              </div>
              <div style={{ marginLeft: "auto" }}>
                <div style={{ fontSize: 28, fontWeight: 900, color: m.color }}>{fmtUSD(curr)}</div>
              </div>
            </div>
            <div style={{ background: C.bgPanel, borderRadius: 8, padding: "12px 16px", marginBottom: 16 }}>
              <MiniChart data={hist} color={m.color} width={700} height={60} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12 }}>
              {[
                { label: "7 jours", value: ((curr - prev7) / prev7 * 100).toFixed(2) + "%" },
                { label: "30 jours", value: ((curr - prev30) / prev30 * 100).toFixed(2) + "%" },
                { label: "Rendement annuel", value: "+" + (m.returnRate * 100).toFixed(1) + "%" },
                { label: "Investissement min.", value: fmtXAF(m.minInvest) },
              ].map(s => (
                <div key={s.label} style={{ background: C.bg, borderRadius: 8, padding: "12px 14px" }}>
                  <div style={{ color: C.textDim, fontSize: 11, marginBottom: 4 }}>{s.label}</div>
                  <div style={{ fontWeight: 800, fontSize: 15, color: s.label.includes("min") ? m.color : C.green }}>{s.value}</div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── PORTFOLIO PAGE ───────────────────────────────────────────────────────────
function PortfolioPage({ user }) {
  const investments = user.investments || [];
  if (!investments.length) return (
    <div style={{ textAlign: "center", padding: "80px 0", color: C.textMuted }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>📭</div>
      <div style={{ fontSize: 18, fontWeight: 700 }}>Portefeuille vide</div>
      <div style={{ fontSize: 14, marginTop: 8 }}>Faites votre premier investissement</div>
    </div>
  );
  return (
    <div>
      <h1 style={{ fontSize: 24, fontWeight: 900, marginBottom: 6 }}>Mon Portefeuille</h1>
      <p style={{ color: C.textMuted, fontSize: 14, marginBottom: 28 }}>Vos positions actives</p>
      {investments.map((inv, i) => {
        const m = METALS[inv.metal];
        const ageYears = (Date.now() - new Date(inv.invested_at)) / (365 * 86400000);
        const gain = Number(inv.amount) * m.returnRate * ageYears;
        const value = Number(inv.amount) + gain;
        const pct = (gain / Number(inv.amount) * 100).toFixed(2);
        return (
          <div key={i} style={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 12, padding: 22, marginBottom: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
              <span style={{ fontSize: 28, color: m.color }}>{m.icon}</span>
              <div>
                <div style={{ fontWeight: 800, fontSize: 17 }}>{m.name}</div>
                <div style={{ color: C.textMuted, fontSize: 12 }}>Depuis le {inv.invested_at} · {Number(inv.shares).toFixed(4)} parts</div>
              </div>
              <div style={{ marginLeft: "auto", textAlign: "right" }}>
                <div style={{ fontSize: 20, fontWeight: 900, color: m.color }}>{fmtXAF(Math.round(value))}</div>
                <div style={{ fontSize: 12, color: C.green }}>+{fmtXAF(Math.round(gain))} (+{pct}%)</div>
              </div>
            </div>
            <div style={{ background: C.bgPanel, borderRadius: 4, height: 6, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${Math.min(100, parseFloat(pct) * 3)}%`, background: `linear-gradient(90deg,${m.color},${m.colorLight})`, borderRadius: 4 }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── INVEST PAGE ──────────────────────────────────────────────────────────────
function InvestPage({ user, setUser, prices }) {
  const [selected, setSelected] = useState("copper");
  const [amount, setAmount] = useState("");
  const [duration, setDuration] = useState(12);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const m = METALS[selected];
  const amt = parseFloat(amount) || 0;
  const projectedReturn = amt * m.returnRate * (duration / 12);
  const totalProjected = amt + projectedReturn;
  const balance = user.wallet?.xaf || 0;

  const invest = async () => {
    if (!amt || amt < m.minInvest || amt > balance) return;
    setLoading(true); setError("");
    try {
      const shares = parseFloat((amt / (prices[selected] || m.basePrice)).toFixed(4));
      const { error: invErr } = await supabase.from("investments").insert({ user_id: user.id, metal: selected, amount: amt, shares, invested_at: new Date().toISOString().split("T")[0] });
      if (invErr) return setError("Erreur lors de l'investissement.");
      const newXaf = balance - amt;
      await supabase.from("wallets").update({ xaf: newXaf }).eq("user_id", user.id);
      await supabase.from("transactions").insert({ user_id: user.id, type: "invest", method: "wallet", amount: amt, currency: "XAF", note: `Investissement ${m.name}` });
      setUser(prev => ({
        ...prev,
        wallet: { ...prev.wallet, xaf: newXaf },
        investments: [...(prev.investments || []), { metal: selected, amount: amt, shares, invested_at: new Date().toISOString().split("T")[0] }],
      }));
      setSuccess(true); setAmount("");
    } finally { setLoading(false); }
  };

  if (success) return (
    <div style={{ textAlign: "center", padding: "80px 0" }}>
      <div style={{ fontSize: 56, marginBottom: 20 }}>✅</div>
      <div style={{ fontSize: 24, fontWeight: 900, color: C.green, marginBottom: 8 }}>Investissement confirmé !</div>
      <button onClick={() => setSuccess(false)} style={{ marginTop: 24, padding: "12px 28px", background: C.copper, border: "none", borderRadius: 8, color: "#fff", fontWeight: 700, cursor: "pointer" }}>
        Nouvel investissement
      </button>
    </div>
  );

  return (
    <div>
      <h1 style={{ fontSize: 24, fontWeight: 900, marginBottom: 6 }}>Investir</h1>
      <p style={{ color: C.textMuted, fontSize: 14, marginBottom: 24 }}>Choisissez un métal et définissez votre position</p>
      <div style={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 12, padding: "14px 20px", marginBottom: 24, display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ fontSize: 20 }}>💰</span>
        <span style={{ color: C.textMuted, fontSize: 14 }}>Solde disponible :</span>
        <span style={{ fontWeight: 900, fontSize: 18, color: C.gold }}>{fmtXAF(balance)}</span>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 380px", gap: 24 }}>
        <div>
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: "block", color: C.textMuted, fontSize: 12, fontWeight: 700, letterSpacing: 1, marginBottom: 10 }}>CHOISIR UN MÉTAL</label>
            <div style={{ display: "flex", gap: 12 }}>
              {Object.entries(METALS).map(([k, met]) => (
                <button key={k} onClick={() => setSelected(k)} style={{ flex: 1, padding: "16px 12px", border: `2px solid ${selected === k ? met.color : C.border}`, borderRadius: 10, background: selected === k ? `${met.color}15` : C.bgCard, color: selected === k ? met.color : C.textMuted, cursor: "pointer", fontWeight: 700, fontSize: 14 }}>
                  <div style={{ fontSize: 24, marginBottom: 4 }}>{met.icon}</div>
                  <div>{met.name}</div>
                  <div style={{ fontSize: 11, color: C.textDim, marginTop: 2 }}>{fmtUSD(prices[k] || met.basePrice)}</div>
                </button>
              ))}
            </div>
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", color: C.textMuted, fontSize: 12, fontWeight: 700, marginBottom: 8 }}>MONTANT (XAF)</label>
            <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder={`Min. ${fmtXAF(m.minInvest)}`}
              style={{ width: "100%", boxSizing: "border-box", padding: "13px 16px", background: C.bgPanel, border: `1px solid ${C.border}`, borderRadius: 10, color: C.text, fontSize: 16, fontWeight: 700, outline: "none", fontFamily: "inherit" }} />
            <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
              {[10000, 50000, 100000, 250000].map(v => (
                <button key={v} onClick={() => setAmount(String(v))} style={{ padding: "6px 12px", background: C.bgPanel, border: `1px solid ${C.border}`, borderRadius: 6, color: C.textMuted, fontSize: 12, cursor: "pointer" }}>
                  {v / 1000}k
                </button>
              ))}
            </div>
          </div>
          <div style={{ marginBottom: 24 }}>
            <label style={{ display: "block", color: C.textMuted, fontSize: 12, fontWeight: 700, marginBottom: 8 }}>
              DURÉE : <span style={{ color: m.color }}>{duration} mois</span>
            </label>
            <input type="range" min="3" max="60" step="3" value={duration} onChange={e => setDuration(Number(e.target.value))} style={{ width: "100%", accentColor: m.color }} />
          </div>
          {error && <div style={{ background: "#2A1010", border: "1px solid #5A1A1A", borderRadius: 8, padding: "10px 14px", color: C.red, fontSize: 13, marginBottom: 12 }}>{error}</div>}
          {amt > balance && <div style={{ color: C.red, fontSize: 12, marginBottom: 8 }}>Solde insuffisant</div>}
          <button onClick={invest} disabled={!amt || amt < m.minInvest || amt > balance || loading}
            style={{ width: "100%", padding: "15px 0", background: amt && amt >= m.minInvest && amt <= balance ? `linear-gradient(135deg,${m.color},${m.colorLight})` : C.bgPanel, border: "none", borderRadius: 10, color: "#fff", fontWeight: 800, fontSize: 16, cursor: loading ? "wait" : "pointer" }}>
            {loading ? "Traitement..." : "Confirmer l'investissement"}
          </button>
        </div>
        <div style={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 12, padding: 24, height: "fit-content" }}>
          <div style={{ fontWeight: 800, fontSize: 16, marginBottom: 20 }}>Simulation de rendement</div>
          {[
            { label: "Métal choisi", value: `${m.icon} ${m.name}`, color: m.color },
            { label: "Montant investi", value: fmtXAF(amt || 0) },
            { label: "Durée", value: `${duration} mois` },
            { label: "Taux annuel", value: `+${(m.returnRate * 100).toFixed(1)}%`, color: C.green },
            { label: "Gain projeté", value: `+${fmtXAF(Math.round(projectedReturn))}`, color: C.green },
            { label: "Valeur finale", value: fmtXAF(Math.round(totalProjected)), color: m.color },
          ].map(row => (
            <div key={row.label} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: `1px solid ${C.border}` }}>
              <span style={{ color: C.textMuted, fontSize: 13 }}>{row.label}</span>
              <span style={{ fontWeight: 800, color: row.color || C.text, fontSize: 14 }}>{row.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── ADMIN PAGE ───────────────────────────────────────────────────────────────
function AdminPage({ allUsers, setAllUsers, setPendingCount }) {
  const [tab, setTab] = useState("pending");
  const pending  = allUsers.filter(u => u.status === "pending");
  const approved = allUsers.filter(u => u.status === "approved" && u.role !== "admin");
  const rejected = allUsers.filter(u => u.status === "rejected");

  const approve = async (id) => {
    await supabase.from("profiles").update({ status: "approved" }).eq("id", id);
    setAllUsers(prev => prev.map(u => u.id === id ? { ...u, status: "approved" } : u));
    setPendingCount(prev => Math.max(0, prev - 1));
  };

  const reject = async (id) => {
    await supabase.from("profiles").update({ status: "rejected" }).eq("id", id);
    setAllUsers(prev => prev.map(u => u.id === id ? { ...u, status: "rejected" } : u));
    setPendingCount(prev => Math.max(0, prev - 1));
  };

  return (
    <div>
      <h1 style={{ fontSize: 24, fontWeight: 900, marginBottom: 6 }}>Administration</h1>
      <p style={{ color: C.textMuted, fontSize: 14, marginBottom: 20 }}>Gestion des utilisateurs et validations</p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14, marginBottom: 24 }}>
        {[
          { label: "En attente", value: pending.length, icon: "⏳", color: C.gold },
          { label: "Approuvés", value: approved.length, icon: "✅", color: C.green },
          { label: "Refusés", value: rejected.length, icon: "❌", color: C.red },
        ].map(kpi => (
          <div key={kpi.label} style={{ background: C.bgCard, border: `1px solid ${kpi.color}44`, borderRadius: 12, padding: "16px 18px" }}>
            <div style={{ fontSize: 22, marginBottom: 6 }}>{kpi.icon}</div>
            <div style={{ fontSize: 24, fontWeight: 900, color: kpi.color }}>{kpi.value}</div>
            <div style={{ color: C.textMuted, fontSize: 12, marginTop: 3 }}>{kpi.label}</div>
          </div>
        ))}
      </div>

      {pending.length > 0 && (
        <div style={{ background: "#1A1500", border: `1px solid ${C.gold}`, borderRadius: 10, padding: "12px 16px", marginBottom: 20, display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 20 }}>🔔</span>
          <div>
            <div style={{ fontWeight: 800, color: C.gold }}>{pending.length} demande{pending.length > 1 ? "s" : ""} en attente de validation</div>
            <div style={{ color: C.textMuted, fontSize: 12 }}>Approuvez ou refusez les comptes ci-dessous</div>
          </div>
        </div>
      )}

      <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        {[["pending","⏳ En attente",pending.length],["approved","✅ Approuvés",approved.length],["rejected","❌ Refusés",rejected.length]].map(([k,l,c]) => (
          <button key={k} onClick={() => setTab(k)} style={{ padding: "8px 16px", border: `1px solid ${tab === k ? C.copper : C.border}`, borderRadius: 8, background: tab === k ? `${C.copper}20` : C.bgCard, color: tab === k ? C.copper : C.textMuted, fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
            {l} <span style={{ background: tab === k ? C.copper : C.bgPanel, color: tab === k ? "#fff" : C.textDim, borderRadius: 10, padding: "1px 7px", fontSize: 11 }}>{c}</span>
          </button>
        ))}
      </div>

      {tab === "pending" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {pending.length === 0 && <div style={{ textAlign: "center", padding: "48px 0", color: C.textDim }}>✅ Aucune demande en attente</div>}
          {pending.map(u => (
            <div key={u.id} style={{ background: C.bgCard, border: `1px solid ${C.gold}44`, borderRadius: 12, padding: 20, display: "flex", alignItems: "center", gap: 16 }}>
              <div style={{ width: 44, height: 44, borderRadius: "50%", background: `${C.gold}22`, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: 18, color: C.gold }}>{u.name?.charAt(0)}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 800, fontSize: 16 }}>{u.name}</div>
                <div style={{ color: C.textMuted, fontSize: 13 }}>{u.email}</div>
                <div style={{ fontSize: 11, color: C.gold, marginTop: 4 }}>⏳ Inscrit le {u.joined_at}</div>
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                <button onClick={() => approve(u.id)} style={{ padding: "10px 20px", background: `linear-gradient(135deg,${C.green},#16a34a)`, border: "none", borderRadius: 8, color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>✓ Approuver</button>
                <button onClick={() => reject(u.id)} style={{ padding: "10px 16px", background: "#2A1010", border: `1px solid ${C.red}`, borderRadius: 8, color: C.red, fontWeight: 700, fontSize: 13, cursor: "pointer" }}>✕ Refuser</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === "approved" && (
        <div style={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 12, overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead><tr style={{ background: C.bgPanel }}>
              {["Nom","Email","Inscrit le","Investissements"].map(h => <th key={h} style={{ padding: "10px 16px", textAlign: "left", color: C.textMuted, fontWeight: 600, fontSize: 12 }}>{h}</th>)}
            </tr></thead>
            <tbody>
              {approved.map(u => (
                <tr key={u.id} style={{ borderTop: `1px solid ${C.border}` }}>
                  <td style={{ padding: "12px 16px", fontWeight: 700 }}>{u.name}</td>
                  <td style={{ padding: "12px 16px", color: C.textMuted }}>{u.email}</td>
                  <td style={{ padding: "12px 16px", color: C.textMuted }}>{u.joined_at}</td>
                  <td style={{ padding: "12px 16px", color: C.textMuted }}>{u.investments?.length || 0} position(s)</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === "rejected" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {rejected.length === 0 && <div style={{ textAlign: "center", padding: "48px 0", color: C.textDim }}>Aucun compte refusé</div>}
          {rejected.map(u => (
            <div key={u.id} style={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 10, padding: "14px 18px", display: "flex", alignItems: "center", gap: 14, opacity: 0.7 }}>
              <div style={{ width: 36, height: 36, borderRadius: "50%", background: `${C.red}15`, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, color: C.red }}>{u.name?.charAt(0)}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700 }}>{u.name}</div>
                <div style={{ color: C.textMuted, fontSize: 12 }}>{u.email}</div>
              </div>
              <button onClick={() => approve(u.id)} style={{ padding: "7px 14px", background: `${C.green}15`, border: `1px solid ${C.green}`, borderRadius: 6, color: C.green, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>Réapprouver</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── APP ROOT ─────────────────────────────────────────────────────────────────
export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [prices, setPrices] = useState({ copper: 9420, zinc: 2680, lead: 2120 });
  const [cryptoPrices, setCryptoPrices] = useState(CRYPTO_BASE);
  const [histories] = useState(() => Object.fromEntries(Object.entries(METALS).map(([k, m]) => [k, genPriceHistory(m.basePrice, m.volatility)])));

  // Check session existante
  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session) {
        const { data: profile } = await supabase.from("profiles").select("*").eq("id", session.user.id).single();
        if (profile && profile.status === "approved") {
          const { data: wallet } = await supabase.from("wallets").select("*").eq("user_id", session.user.id).single();
          const { data: investments } = await supabase.from("investments").select("*").eq("user_id", session.user.id);
          const { data: transactions } = await supabase.from("transactions").select("*").eq("user_id", session.user.id).order("created_at", { ascending: false });
          setUser({ ...profile, wallet, investments: investments || [], transactions: transactions || [] });
        }
      }
      setLoading(false);
    });

    // Prix live métaux
    const id1 = setInterval(() => setPrices(p => ({ copper: Math.round(p.copper * (1 + (Math.random() - 0.49) * 0.004)), zinc: Math.round(p.zinc * (1 + (Math.random() - 0.49) * 0.005)), lead: Math.round(p.lead * (1 + (Math.random() - 0.49) * 0.004)) })), 3500);
    // Prix live crypto
    const id2 = setInterval(() => setCryptoPrices(p => ({ BTC: Math.round(p.BTC * (1 + (Math.random() - 0.49) * 0.008)), ETH: Math.round(p.ETH * (1 + (Math.random() - 0.49) * 0.010)), USDT: 1 })), 4000);
    return () => { clearInterval(id1); clearInterval(id2); };
  }, []);

  const handleLogout = async () => { await supabase.auth.signOut(); setUser(null); };

  if (loading) return (
    <div style={{ minHeight: "100vh", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>⛏</div>
        <div style={{ color: C.copper, fontSize: 18, fontWeight: 700 }}>Chargement...</div>
      </div>
    </div>
  );

  if (!user) return <AuthPage onLogin={setUser} />;
  return <Dashboard user={user} setUser={setUser} prices={prices} cryptoPrices={cryptoPrices} histories={histories} onLogout={handleLogout} />;
}
