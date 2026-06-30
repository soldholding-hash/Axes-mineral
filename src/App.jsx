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
  var history = [];
  var price = base;
  var now = Date.now();
  for (var i = days; i >= 0; i--) {
    price = price * (1 + (Math.random() - 0.48) * vol);
    history.push({ date: new Date(now - i * 86400000), price: Math.round(price) });
  }
  return history;
}

function MiniChart(props) {
  var data = props.data;
  var color = props.color;
  var width = props.width || 120;
  var height = props.height || 40;
  if (!data || data.length < 2) return null;
  var prices = data.map(function(d) { return d.price; });
  var min = Math.min.apply(null, prices);
  var max = Math.max.apply(null, prices);
  var range = max - min || 1;
  var pts = prices.map(function(p, i) { return (i / (prices.length - 1)) * width + "," + (height - ((p - min) / range) * height); }).join(" ");
  var trend = prices[prices.length - 1] >= prices[0];
  var lineColor = trend ? C.green : C.red;
  return (
    <svg width={width} height={height} style={{ overflow: "visible" }}>
      <polyline points={pts} fill="none" stroke={lineColor} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function TickerBar(props) {
  var prices = props.prices;
  var cryptoPrices = props.cryptoPrices;
  var text = [
    "Cu — $" + fmt(prices.copper) + "/t",
    "Zn — $" + fmt(prices.zinc) + "/t",
    "Pb — $" + fmt(prices.lead) + "/t",
    "BTC — $" + fmt(cryptoPrices.BTC),
    "ETH — $" + fmt(cryptoPrices.ETH),
    "USDT — $1.00",
  ].join("    ·    ");
  var full = text + "    ·    " + text;
  return (
    <div style={{ background: "#0D0D16", borderBottom: "1px solid " + C.border, overflow: "hidden", height: 32, display: "flex", alignItems: "center" }}>
      <div style={{ color: C.copper, fontSize: 11, fontWeight: 700, padding: "0 16px", whiteSpace: "nowrap", letterSpacing: 1 }}>MARCHES</div>
      <div style={{ flex: 1, overflow: "hidden" }}>
        <div style={{ display: "inline-block", whiteSpace: "nowrap", color: C.textMuted, fontSize: 11, fontFamily: "monospace", animation: "ticker 28s linear infinite" }}>{full}</div>
      </div>
      <style>{"@keyframes ticker{0%{transform:translateX(0)}100%{transform:translateX(-50%)}}"}</style>
    </div>
  );
}

function AuthPage(props) {
  var onLogin = props.onLogin;
  var [mode, setMode] = useState("login");
  var [form, setForm] = useState({ name: "", email: "", password: "", confirm: "" });
  var [error, setError] = useState("");
  var [loading, setLoading] = useState(false);
  var [registered, setRegistered] = useState(false);

  var handle = function(f) { setForm(function(p) { return Object.assign({}, p, f); }); };

  var submit = async function() {
    setError(""); setLoading(true);
    try {
      if (mode === "login") {
        var res = await supabase.auth.signInWithPassword({ email: form.email, password: form.password });
        if (res.error) return setError("Email ou mot de passe incorrect.");
        var profRes = await supabase.from("profiles").select("*").eq("id", res.data.user.id).single();
        var profile = profRes.data;
        if (!profile) return setError("Profil introuvable.");
        if (profile.status === "pending") return setError("Votre compte est en attente de validation par l'administrateur.");
        if (profile.status === "rejected") return setError("Votre demande a ete refusee. Contactez l'administrateur.");
        var walletRes = await supabase.from("wallets").select("*").eq("user_id", res.data.user.id).single();
        var invRes = await supabase.from("investments").select("*").eq("user_id", res.data.user.id);
        var txRes = await supabase.from("transactions").select("*").eq("user_id", res.data.user.id).order("created_at", { ascending: false });
        onLogin(Object.assign({}, profile, { authId: res.data.user.id, wallet: walletRes.data, investments: invRes.data || [], transactions: txRes.data || [] }));
      } else {
        if (!form.name.trim()) return setError("Nom requis.");
        if (!form.email.includes("@")) return setError("Email invalide.");
        if (form.password.length < 6) return setError("Mot de passe : 6 caracteres minimum.");
        if (form.password !== form.confirm) return setError("Les mots de passe ne correspondent pas.");
        var signRes = await supabase.auth.signUp({
          email: form.email, password: form.password,
          options: { data: { name: form.name, role: "user" } }
        });
        if (signRes.error) return setError(signRes.error.message);
        setRegistered(true);
      }
    } finally { setLoading(false); }
  };

  if (registered) return (
    <div style={{ minHeight: "100vh", background: C.bg, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
      <div style={{ textAlign: "center", maxWidth: 420, padding: "0 24px" }}>
        <div style={{ fontSize: 64, marginBottom: 20 }}>⏳</div>
        <div style={{ fontSize: 24, fontWeight: 900, color: C.copper, marginBottom: 12 }}>Demande envoyee !</div>
        <div style={{ color: C.textMuted, fontSize: 15, lineHeight: 1.7, marginBottom: 28 }}>
          Votre inscription est en attente de validation par l'administrateur.
        </div>
        <button onClick={function() { setRegistered(false); setMode("login"); setForm({ name: "", email: "", password: "", confirm: "" }); }}
          style={{ padding: "12px 32px", background: "linear-gradient(135deg," + C.copper + "," + C.copperLight + ")", border: "none", borderRadius: 10, color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
          Retour a la connexion
        </button>
      </div>
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
      <div style={{ background: C.bgCard, border: "1px solid " + C.border, borderRadius: 16, padding: "36px 40px", width: 400, maxWidth: "90vw" }}>
        <div style={{ display: "flex", background: C.bgPanel, borderRadius: 8, padding: 4, marginBottom: 28 }}>
          {["login","register"].map(function(m) {
            return (
              <button key={m} onClick={function() { setMode(m); setError(""); }} style={{ flex: 1, padding: "8px 0", border: "none", borderRadius: 6, cursor: "pointer", fontWeight: 700, fontSize: 13, background: mode === m ? C.copper : "transparent", color: mode === m ? "#fff" : C.textMuted }}>
                {m === "login" ? "Connexion" : "Inscription"}
              </button>
            );
          })}
        </div>
        {mode === "register" && <Field label="Nom complet" value={form.name} onChange={function(v) { handle({ name: v }); }} placeholder="Jean Mokolo" />}
        <Field label="Adresse email" value={form.email} onChange={function(v) { handle({ email: v }); }} type="email" placeholder="vous@email.com" />
        <Field label="Mot de passe" value={form.password} onChange={function(v) { handle({ password: v }); }} type="password" />
        {mode === "register" && <Field label="Confirmer le mot de passe" value={form.confirm} onChange={function(v) { handle({ confirm: v }); }} type="password" />}
        {error && <div style={{ background: "#2A1010", border: "1px solid #5A1A1A", borderRadius: 8, padding: "10px 14px", color: C.red, fontSize: 13, marginBottom: 16 }}>{error}</div>}
        <button onClick={submit} disabled={loading} style={{ width: "100%", padding: "13px 0", background: loading ? C.bgPanel : "linear-gradient(135deg," + C.copper + "," + C.copperLight + ")", border: "none", borderRadius: 10, color: "#fff", fontWeight: 800, fontSize: 15, cursor: loading ? "wait" : "pointer", marginTop: 4 }}>
          {loading ? "Chargement..." : mode === "login" ? "Se connecter" : "Creer mon compte"}
        </button>
      </div>
      <div style={{ marginTop: 20, color: C.textDim, fontSize: 12 }}>Cuivre - Zinc - Plomb - Boko Songho, Congo</div>
    </div>
  );
}

function Field(props) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: "block", color: C.textMuted, fontSize: 12, fontWeight: 600, marginBottom: 6 }}>{props.label}</label>
      <input type={props.type || "text"} value={props.value} placeholder={props.placeholder} onChange={function(e) { props.onChange(e.target.value); }}
        style={{ width: "100%", boxSizing: "border-box", padding: "11px 14px", background: C.bgPanel, border: "1px solid " + C.border, borderRadius: 8, color: C.text, fontSize: 14, outline: "none", fontFamily: "inherit" }} />
    </div>
  );
}

function Dashboard(props) {
  var user = props.user;
  var setUser = props.setUser;
  var prices = props.prices;
  var cryptoPrices = props.cryptoPrices;
  var histories = props.histories;
  var onLogout = props.onLogout;
  var [page, setPage] = useState("home");
  var [pendingCount, setPendingCount] = useState(0);
  var [allUsers, setAllUsers] = useState([]);

  useEffect(function() {
    if (user.role === "admin") {
      supabase.from("profiles").select("*").eq("status", "pending").then(function(r) { setPendingCount(r.data ? r.data.length : 0); });
      supabase.from("profiles").select("*, investments(*), wallets(*)").then(function(r) { setAllUsers(r.data || []); });
    }
  }, [user]);

  var totalInvested = (user.investments || []).reduce(function(s, inv) { return s + Number(inv.amount); }, 0);
  var totalValue = (user.investments || []).reduce(function(s, inv) {
    var m = METALS[inv.metal];
    var ageYears = (Date.now() - new Date(inv.invested_at)) / (365 * 86400000);
    return s + Number(inv.amount) * (1 + m.returnRate * ageYears);
  }, 0);
  var totalGain = totalValue - totalInvested;

  var nav = [
    { key: "home",      label: "Accueil",           icon: "⬡" },
    { key: "markets",   label: "Marches",            icon: "📈" },
    { key: "portfolio", label: "Portefeuille",       icon: "💼" },
    { key: "invest",    label: "Investir",           icon: "+" },
    { key: "wallet",    label: "Portefeuille Elec.", icon: "💳" },
  ];
  if (user.role === "admin") nav.push({ key: "admin", label: "Admin", icon: "⚙" });

  return (
    <div style={{ minHeight: "100vh", background: C.bg, fontFamily: "'Segoe UI', system-ui, sans-serif", color: C.text, display: "flex" }}>
      <div style={{ width: 220, background: C.bgCard, borderRight: "1px solid " + C.border, display: "flex", flexDirection: "column", position: "fixed", top: 0, bottom: 0 }}>
        <div style={{ padding: "24px 20px 20px", borderBottom: "1px solid " + C.border }}>
          <div style={{ fontSize: 18, fontWeight: 900 }}><span style={{ color: C.copper }}>AXES</span><span style={{ color: C.text }}> MINERALS</span></div>
          <div style={{ color: C.textDim, fontSize: 11, marginTop: 2, letterSpacing: 1 }}>INVEST PLATFORM</div>
        </div>
        <nav style={{ flex: 1, padding: "16px 12px" }}>
          {nav.map(function(n) {
            var badge = n.key === "admin" ? pendingCount : 0;
            return (
              <button key={n.key} onClick={function() { setPage(n.key); }} style={{
                display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "10px 12px",
                border: "none", borderRadius: 8, cursor: "pointer", textAlign: "left", fontSize: 14, fontWeight: 600, marginBottom: 4,
                background: page === n.key ? C.copper + "22" : "transparent",
                color: page === n.key ? C.copper : C.textMuted,
                borderLeft: page === n.key ? "3px solid " + C.copper : "3px solid transparent",
              }}>
                <span style={{ fontSize: 16 }}>{n.icon}</span>
                <span style={{ flex: 1 }}>{n.label}</span>
                {badge > 0 && <span style={{ background: C.red, color: "#fff", borderRadius: "50%", width: 18, height: 18, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 900 }}>{badge}</span>}
              </button>
            );
          })}
        </nav>
        <div style={{ padding: "16px 12px", borderTop: "1px solid " + C.border }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: "50%", background: "linear-gradient(135deg," + C.copper + "," + C.copperLight + ")", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: 14 }}>
              {user.name ? user.name.charAt(0) : "U"}
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700 }}>{user.name ? user.name.split(" ")[0] : ""}</div>
              <div style={{ fontSize: 11, color: user.role === "admin" ? C.gold : C.textDim }}>{user.role === "admin" ? "Administrateur" : "Investisseur"}</div>
            </div>
          </div>
          <button onClick={onLogout} style={{ width: "100%", padding: "8px 0", background: "#2A1515", border: "1px solid #5A2020", borderRadius: 6, color: C.red, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
            Deconnexion
          </button>
        </div>
      </div>

      <div style={{ marginLeft: 220, flex: 1, display: "flex", flexDirection: "column" }}>
        <TickerBar prices={prices} cryptoPrices={cryptoPrices} />
        <div style={{ flex: 1, padding: "28px 32px", maxWidth: 1100 }}>
          {page === "home"      && <HomePage user={user} prices={prices} cryptoPrices={cryptoPrices} histories={histories} totalInvested={totalInvested} totalValue={totalValue} totalGain={totalGain} onInvest={function() { setPage("invest"); }} />}
          {page === "markets"   && <MarketsPage prices={prices} histories={histories} />}
          {page === "portfolio" && <PortfolioPage user={user} />}
          {page === "invest"    && <InvestPage user={user} setUser={setUser} prices={prices} />}
          {page === "wallet"    && <WalletPage user={user} setUser={setUser} cryptoPrices={cryptoPrices} />}
          {page === "admin"     && user.role === "admin" && <AdminPage allUsers={allUsers} setAllUsers={setAllUsers} setPendingCount={setPendingCount} adminId={user.id} />}
        </div>
      </div>
    </div>
  );
}

function HomePage(props) {
  var user = props.user;
  var prices = props.prices;
  var histories = props.histories;
  var totalInvested = props.totalInvested;
  var totalValue = props.totalValue;
  var totalGain = props.totalGain;
  var onInvest = props.onInvest;
  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ margin: 0, fontSize: 26, fontWeight: 900 }}>Bonjour, <span style={{ color: C.copper }}>{user.name ? user.name.split(" ")[0] : ""}</span> 👋</h1>
        <p style={{ color: C.textMuted, marginTop: 4, fontSize: 14 }}>Bienvenue sur votre tableau de bord d'investissement minier</p>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16, marginBottom: 28 }}>
        {[
          { label: "Solde XAF", value: fmtXAF(user.wallet ? user.wallet.xaf || 0 : 0), icon: "💰", color: C.gold },
          { label: "Total investi", value: fmtXAF(totalInvested), icon: "📊", color: C.zinc },
          { label: "Valeur actuelle", value: fmtXAF(Math.round(totalValue)), icon: "📈", color: C.copper },
          { label: "Gain / Perte", value: (totalGain >= 0 ? "+" : "") + fmtXAF(Math.round(totalGain)), icon: totalGain >= 0 ? "🟢" : "🔴", color: totalGain >= 0 ? C.green : C.red },
        ].map(function(kpi) {
          return (
            <div key={kpi.label} style={{ background: C.bgCard, border: "1px solid " + C.border, borderRadius: 12, padding: "18px 20px" }}>
              <div style={{ fontSize: 22, marginBottom: 8 }}>{kpi.icon}</div>
              <div style={{ color: kpi.color, fontWeight: 900, fontSize: 20, marginBottom: 4 }}>{kpi.value}</div>
              <div style={{ color: C.textMuted, fontSize: 12 }}>{kpi.label}</div>
            </div>
          );
        })}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16, marginBottom: 24 }}>
        {Object.entries(METALS).map(function(entry) {
          var k = entry[0]; var m = entry[1];
          var hist = histories[k] || [];
          var curr = prices[k] || m.basePrice;
          var prev = hist.length > 1 ? hist[hist.length - 2].price : curr;
          var pct = ((curr - prev) / prev * 100).toFixed(2);
          var up = curr >= prev;
          return (
            <div key={k} style={{ background: C.bgCard, border: "1px solid " + C.border, borderRadius: 12, padding: "20px 20px 16px" }}>
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
              <div style={{ marginTop: 14, paddingTop: 12, borderTop: "1px solid " + C.border, display: "flex", justifyContent: "space-between", fontSize: 12, color: C.textMuted }}>
                <span>Rendement annuel</span>
                <span style={{ color: C.green, fontWeight: 700 }}>+{(m.returnRate * 100).toFixed(1)}%</span>
              </div>
            </div>
          );
        })}
      </div>
      <button onClick={onInvest} style={{ padding: "14px 32px", background: "linear-gradient(135deg," + C.copper + "," + C.copperLight + ")", border: "none", borderRadius: 10, color: "#fff", fontWeight: 800, fontSize: 15, cursor: "pointer" }}>
        + Nouvel investissement
      </button>
    </div>
  );
}

function MarketsPage(props) {
  var prices = props.prices;
  var histories = props.histories;
  return (
    <div>
      <h1 style={{ fontSize: 24, fontWeight: 900, marginBottom: 6 }}>Marches des Metaux</h1>
      <p style={{ color: C.textMuted, fontSize: 14, marginBottom: 28 }}>Prix en temps reel - LME</p>
      {Object.entries(METALS).map(function(entry) {
        var k = entry[0]; var m = entry[1];
        var hist = histories[k] || [];
        var curr = prices[k] || m.basePrice;
        var prev7 = hist.length > 7 ? hist[hist.length - 8].price : curr;
        var prev30 = hist.length > 0 ? hist[0].price : curr;
        return (
          <div key={k} style={{ background: C.bgCard, border: "1px solid " + C.border, borderRadius: 12, padding: 24, marginBottom: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 16 }}>
              <span style={{ fontSize: 32, color: m.color }}>{m.icon}</span>
              <div>
                <div style={{ fontSize: 20, fontWeight: 900 }}>{m.name} <span style={{ color: C.textDim, fontSize: 13 }}>/ {m.symbol}</span></div>
                <div style={{ color: C.textMuted, fontSize: 13 }}>USD / tonne metrique</div>
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
              ].map(function(s) {
                return (
                  <div key={s.label} style={{ background: C.bg, borderRadius: 8, padding: "12px 14px" }}>
                    <div style={{ color: C.textDim, fontSize: 11, marginBottom: 4 }}>{s.label}</div>
                    <div style={{ fontWeight: 800, fontSize: 15, color: s.label.includes("min") ? m.color : C.green }}>{s.value}</div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function PieChart(props) {
  var data = props.data;
  var size = props.size || 180;
  var cx = size / 2; var cy = size / 2; var r = size / 2 - 10;
  var total = data.reduce(function(s, d) { return s + d.value; }, 0);
  if (total === 0) return null;
  var slices = [];
  var angle = -Math.PI / 2;
  data.forEach(function(d, i) {
    var sweep = (d.value / total) * 2 * Math.PI;
    var x1 = cx + r * Math.cos(angle);
    var y1 = cy + r * Math.sin(angle);
    var x2 = cx + r * Math.cos(angle + sweep);
    var y2 = cy + r * Math.sin(angle + sweep);
    var large = sweep > Math.PI ? 1 : 0;
    var path = "M " + cx + " " + cy + " L " + x1 + " " + y1 + " A " + r + " " + r + " 0 " + large + " 1 " + x2 + " " + y2 + " Z";
    slices.push(<path key={i} d={path} fill={d.color} opacity={0.9} stroke={C.bg} strokeWidth={2} />);
    angle += sweep;
  });
  return (
    <svg width={size} height={size}>
      {slices}
      <circle cx={cx} cy={cy} r={r * 0.52} fill={C.bgCard} />
    </svg>
  );
}

function PortfolioPage(props) {
  var user = props.user;
  var investments = user.investments || [];

  if (!investments.length) return (
    <div style={{ textAlign: "center", padding: "80px 0", color: C.textMuted }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>📭</div>
      <div style={{ fontSize: 18, fontWeight: 700 }}>Portefeuille vide</div>
      <div style={{ fontSize: 14, marginTop: 8 }}>Faites votre premier investissement</div>
    </div>
  );

  // Calculer les données par métal
  var byMetal = {};
  investments.forEach(function(inv) {
    var m = METALS[inv.metal];
    if (!byMetal[inv.metal]) byMetal[inv.metal] = { amount: 0, gain: 0, value: 0, count: 0, metal: inv.metal };
    var ageYears = (Date.now() - new Date(inv.invested_at)) / (365 * 86400000);
    var gain = Number(inv.amount) * m.returnRate * ageYears;
    byMetal[inv.metal].amount += Number(inv.amount);
    byMetal[inv.metal].gain += gain;
    byMetal[inv.metal].value += Number(inv.amount) + gain;
    byMetal[inv.metal].count += 1;
  });

  var totalInvested = Object.values(byMetal).reduce(function(s, d) { return s + d.amount; }, 0);
  var totalValue = Object.values(byMetal).reduce(function(s, d) { return s + d.value; }, 0);
  var totalGain = totalValue - totalInvested;
  var totalPct = totalInvested > 0 ? (totalGain / totalInvested * 100).toFixed(2) : "0.00";

  var pieData = Object.values(byMetal).map(function(d) {
    return { value: d.value, color: METALS[d.metal].color, label: METALS[d.metal].name };
  });

  return (
    <div>
      <h1 style={{ fontSize: 24, fontWeight: 900, marginBottom: 6 }}>Mon Portefeuille</h1>
      <p style={{ color: C.textMuted, fontSize: 14, marginBottom: 24 }}>Vos positions actives et performances</p>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14, marginBottom: 24 }}>
        {[
          { label: "Capital investi", value: fmtXAF(totalInvested), icon: "💼", color: C.zinc },
          { label: "Valeur actuelle", value: fmtXAF(Math.round(totalValue)), icon: "📈", color: C.copper },
          { label: "Gains cumules", value: "+" + fmtXAF(Math.round(totalGain)) + " (+" + totalPct + "%)", icon: "🏆", color: C.green },
        ].map(function(kpi) {
          return (
            <div key={kpi.label} style={{ background: C.bgCard, border: "1px solid " + kpi.color + "44", borderRadius: 12, padding: "18px 20px" }}>
              <div style={{ fontSize: 22, marginBottom: 8 }}>{kpi.icon}</div>
              <div style={{ color: kpi.color, fontWeight: 900, fontSize: 17, marginBottom: 4 }}>{kpi.value}</div>
              <div style={{ color: C.textMuted, fontSize: 12 }}>{kpi.label}</div>
            </div>
          );
        })}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "240px 1fr", gap: 20, marginBottom: 24 }}>
        <div style={{ background: C.bgCard, border: "1px solid " + C.border, borderRadius: 12, padding: 24, display: "flex", flexDirection: "column", alignItems: "center" }}>
          <div style={{ fontWeight: 800, fontSize: 14, marginBottom: 16, color: C.textMuted, letterSpacing: 1 }}>REPARTITION</div>
          <PieChart data={pieData} size={160} />
          <div style={{ marginTop: 20, width: "100%" }}>
            {Object.values(byMetal).map(function(d) {
              var m = METALS[d.metal];
              var pct = totalValue > 0 ? (d.value / totalValue * 100).toFixed(1) : "0";
              return (
                <div key={d.metal} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                  <div style={{ width: 12, height: 12, borderRadius: "50%", background: m.color, flexShrink: 0 }} />
                  <span style={{ flex: 1, fontSize: 13, fontWeight: 600 }}>{m.name}</span>
                  <span style={{ fontSize: 13, fontWeight: 900, color: m.color }}>{pct}%</span>
                </div>
              );
            })}
          </div>
        </div>

        <div>
          {Object.values(byMetal).map(function(d) {
            var m = METALS[d.metal];
            var pct = d.amount > 0 ? (d.gain / d.amount * 100).toFixed(2) : "0.00";
            var share = totalValue > 0 ? (d.value / totalValue * 100).toFixed(1) : "0";
            return (
              <div key={d.metal} style={{ background: C.bgCard, border: "1px solid " + C.border, borderRadius: 12, padding: 20, marginBottom: 14 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
                  <span style={{ fontSize: 30, color: m.color }}>{m.icon}</span>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: 17 }}>{m.name}</div>
                    <div style={{ color: C.textMuted, fontSize: 12 }}>{d.count} position(s) - {share}% du portefeuille</div>
                  </div>
                  <div style={{ marginLeft: "auto", textAlign: "right" }}>
                    <div style={{ fontSize: 20, fontWeight: 900, color: m.color }}>{fmtXAF(Math.round(d.value))}</div>
                    <div style={{ fontSize: 12, color: C.green }}>+{fmtXAF(Math.round(d.gain))} (+{pct}%)</div>
                  </div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 12 }}>
                  {[
                    { label: "Investi", value: fmtXAF(d.amount) },
                    { label: "Gain", value: "+" + fmtXAF(Math.round(d.gain)), color: C.green },
                    { label: "Rendement", value: "+" + pct + "%", color: C.green },
                  ].map(function(s) {
                    return (
                      <div key={s.label} style={{ background: C.bgPanel, borderRadius: 8, padding: "10px 12px" }}>
                        <div style={{ color: C.textDim, fontSize: 11, marginBottom: 3 }}>{s.label}</div>
                        <div style={{ fontWeight: 800, fontSize: 13, color: s.color || C.text }}>{s.value}</div>
                      </div>
                    );
                  })}
                </div>
                <div style={{ background: C.bgPanel, borderRadius: 4, height: 6, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: Math.min(100, parseFloat(pct) * 3) + "%", background: "linear-gradient(90deg," + m.color + "," + m.colorLight + ")", borderRadius: 4 }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ background: C.bgCard, border: "1px solid " + C.border, borderRadius: 12, padding: 20 }}>
        <div style={{ fontWeight: 800, fontSize: 14, marginBottom: 16, color: C.textMuted }}>DETAIL DES POSITIONS</div>
        {investments.map(function(inv, i) {
          var m = METALS[inv.metal];
          var ageYears = (Date.now() - new Date(inv.invested_at)) / (365 * 86400000);
          var gain = Number(inv.amount) * m.returnRate * ageYears;
          var value = Number(inv.amount) + gain;
          var pct = (gain / Number(inv.amount) * 100).toFixed(2);
          var ageDays = Math.floor(ageYears * 365);
          return (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 0", borderBottom: i < investments.length - 1 ? "1px solid " + C.border : "none" }}>
              <span style={{ fontSize: 22, color: m.color }}>{m.icon}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 14 }}>{m.name}</div>
                <div style={{ color: C.textMuted, fontSize: 11 }}>Depuis le {inv.invested_at} ({ageDays} jours) - {Number(inv.shares).toFixed(4)} parts</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontWeight: 800, color: m.color }}>{fmtXAF(Math.round(value))}</div>
                <div style={{ fontSize: 11, color: C.green }}>+{fmtXAF(Math.round(gain))} (+{pct}%)</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function InvestPage(props) {
  var user = props.user;
  var setUser = props.setUser;
  var prices = props.prices;
  var [selected, setSelected] = useState("copper");
  var [amount, setAmount] = useState("");
  var [duration, setDuration] = useState(12);
  var [success, setSuccess] = useState(false);
  var [loading, setLoading] = useState(false);
  var [error, setError] = useState("");

  var m = METALS[selected];
  var amt = parseFloat(amount) || 0;
  var projectedReturn = amt * m.returnRate * (duration / 12);
  var totalProjected = amt + projectedReturn;
  var balance = user.wallet ? user.wallet.xaf || 0 : 0;

  var invest = async function() {
    if (!amt || amt < m.minInvest || amt > balance) return;
    setLoading(true); setError("");
    try {
      var shares = parseFloat((amt / (prices[selected] || m.basePrice)).toFixed(4));
      var invRes = await supabase.from("investments").insert({ user_id: user.id, metal: selected, amount: amt, shares: shares, invested_at: new Date().toISOString().split("T")[0] });
      if (invRes.error) return setError("Erreur lors de l'investissement.");
      var newXaf = balance - amt;
      await supabase.from("wallets").update({ xaf: newXaf }).eq("user_id", user.id);
      await supabase.from("transactions").insert({ user_id: user.id, type: "invest", method: "wallet", amount: amt, currency: "XAF", note: "Investissement " + m.name });
      setUser(function(prev) {
        return Object.assign({}, prev, {
          wallet: Object.assign({}, prev.wallet, { xaf: newXaf }),
          investments: (prev.investments || []).concat([{ metal: selected, amount: amt, shares: shares, invested_at: new Date().toISOString().split("T")[0] }]),
        });
      });
      setSuccess(true); setAmount("");
    } finally { setLoading(false); }
  };

  if (success) return (
    <div style={{ textAlign: "center", padding: "80px 0" }}>
      <div style={{ fontSize: 56, marginBottom: 20 }}>✅</div>
      <div style={{ fontSize: 24, fontWeight: 900, color: C.green, marginBottom: 8 }}>Investissement confirme !</div>
      <button onClick={function() { setSuccess(false); }} style={{ marginTop: 24, padding: "12px 28px", background: C.copper, border: "none", borderRadius: 8, color: "#fff", fontWeight: 700, cursor: "pointer" }}>
        Nouvel investissement
      </button>
    </div>
  );

  return (
    <div>
      <h1 style={{ fontSize: 24, fontWeight: 900, marginBottom: 6 }}>Investir</h1>
      <p style={{ color: C.textMuted, fontSize: 14, marginBottom: 24 }}>Choisissez un metal et definissez votre position</p>
      <div style={{ background: C.bgCard, border: "1px solid " + C.border, borderRadius: 12, padding: "14px 20px", marginBottom: 24, display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ fontSize: 20 }}>💰</span>
        <span style={{ color: C.textMuted, fontSize: 14 }}>Solde disponible :</span>
        <span style={{ fontWeight: 900, fontSize: 18, color: C.gold }}>{fmtXAF(balance)}</span>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 380px", gap: 24 }}>
        <div>
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: "block", color: C.textMuted, fontSize: 12, fontWeight: 700, letterSpacing: 1, marginBottom: 10 }}>CHOISIR UN METAL</label>
            <div style={{ display: "flex", gap: 12 }}>
              {Object.entries(METALS).map(function(entry) {
                var k = entry[0]; var met = entry[1];
                return (
                  <button key={k} onClick={function() { setSelected(k); }} style={{ flex: 1, padding: "16px 12px", border: "2px solid " + (selected === k ? met.color : C.border), borderRadius: 10, background: selected === k ? met.color + "15" : C.bgCard, color: selected === k ? met.color : C.textMuted, cursor: "pointer", fontWeight: 700, fontSize: 14 }}>
                    <div style={{ fontSize: 24, marginBottom: 4 }}>{met.icon}</div>
                    <div>{met.name}</div>
                    <div style={{ fontSize: 11, color: C.textDim, marginTop: 2 }}>{fmtUSD(prices[k] || met.basePrice)}</div>
                  </button>
                );
              })}
            </div>
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", color: C.textMuted, fontSize: 12, fontWeight: 700, marginBottom: 8 }}>MONTANT (XAF)</label>
            <input type="number" value={amount} onChange={function(e) { setAmount(e.target.value); }} placeholder={"Min. " + fmtXAF(m.minInvest)}
              style={{ width: "100%", boxSizing: "border-box", padding: "13px 16px", background: C.bgPanel, border: "1px solid " + C.border, borderRadius: 10, color: C.text, fontSize: 16, fontWeight: 700, outline: "none", fontFamily: "inherit" }} />
            <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
              {[10000, 50000, 100000, 250000].map(function(v) {
                return (
                  <button key={v} onClick={function() { setAmount(String(v)); }} style={{ padding: "6px 12px", background: C.bgPanel, border: "1px solid " + C.border, borderRadius: 6, color: C.textMuted, fontSize: 12, cursor: "pointer" }}>
                    {v / 1000}k
                  </button>
                );
              })}
            </div>
          </div>
          <div style={{ marginBottom: 24 }}>
            <label style={{ display: "block", color: C.textMuted, fontSize: 12, fontWeight: 700, marginBottom: 8 }}>
              DUREE : <span style={{ color: m.color }}>{duration} mois</span>
            </label>
            <input type="range" min="3" max="60" step="3" value={duration} onChange={function(e) { setDuration(Number(e.target.value)); }} style={{ width: "100%", accentColor: m.color }} />
          </div>
          {error && <div style={{ background: "#2A1010", border: "1px solid #5A1A1A", borderRadius: 8, padding: "10px 14px", color: C.red, fontSize: 13, marginBottom: 12 }}>{error}</div>}
          {amt > balance && <div style={{ color: C.red, fontSize: 12, marginBottom: 8 }}>Solde insuffisant</div>}
          <button onClick={invest} disabled={!amt || amt < m.minInvest || amt > balance || loading}
            style={{ width: "100%", padding: "15px 0", background: amt && amt >= m.minInvest && amt <= balance ? "linear-gradient(135deg," + m.color + "," + m.colorLight + ")" : C.bgPanel, border: "none", borderRadius: 10, color: "#fff", fontWeight: 800, fontSize: 16, cursor: loading ? "wait" : "pointer" }}>
            {loading ? "Traitement..." : "Confirmer l'investissement"}
          </button>
        </div>
        <div style={{ background: C.bgCard, border: "1px solid " + C.border, borderRadius: 12, padding: 24, height: "fit-content" }}>
          <div style={{ fontWeight: 800, fontSize: 16, marginBottom: 20 }}>Simulation de rendement</div>
          {[
            { label: "Metal choisi", value: m.icon + " " + m.name, color: m.color },
            { label: "Montant investi", value: fmtXAF(amt || 0) },
            { label: "Duree", value: duration + " mois" },
            { label: "Taux annuel", value: "+" + (m.returnRate * 100).toFixed(1) + "%", color: C.green },
            { label: "Gain projete", value: "+" + fmtXAF(Math.round(projectedReturn)), color: C.green },
            { label: "Valeur finale", value: fmtXAF(Math.round(totalProjected)), color: m.color },
          ].map(function(row) {
            return (
              <div key={row.label} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid " + C.border }}>
                <span style={{ color: C.textMuted, fontSize: 13 }}>{row.label}</span>
                <span style={{ fontWeight: 800, color: row.color || C.text, fontSize: 14 }}>{row.value}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── ADMIN PAGE ───────────────────────────────────────────────────────────────
function AdminPage(props) {
  var allUsers = props.allUsers;
  var setAllUsers = props.setAllUsers;
  var setPendingCount = props.setPendingCount;
  var adminId = props.adminId;
  var [tab, setTab] = useState("pending");
  var [rechargeUser, setRechargeUser] = useState(null);
  var [rechargeAmount, setRechargeAmount] = useState("");
  var [rechargeNote, setRechargeNote] = useState("");
  var [rechargeLoading, setRechargeLoading] = useState(false);
  var [rechargeSuccess, setRechargeSuccess] = useState("");
  var [rechargeError, setRechargeError] = useState("");
  var [search, setSearch] = useState("");
  var [rechargeHistory, setRechargeHistory] = useState([]);
  var [histLoading, setHistLoading] = useState(false);

  var pending  = allUsers.filter(function(u) { return u.status === "pending"; });
  var approved = allUsers.filter(function(u) { return u.status === "approved" && u.role !== "admin"; });
  var rejected = allUsers.filter(function(u) { return u.status === "rejected"; });

  var filtered = approved.filter(function(u) {
    var q = search.toLowerCase();
    return !q || (u.name && u.name.toLowerCase().includes(q)) || (u.email && u.email.toLowerCase().includes(q));
  });

  useEffect(function() {
    if (tab === "recharges") {
      setHistLoading(true);
      supabase.from("transactions").select("*, profiles(name, email)").eq("type", "recharge").order("created_at", { ascending: false }).limit(50)
        .then(function(r) { setRechargeHistory(r.data || []); setHistLoading(false); });
    }
  }, [tab]);

  var approve = async function(id) {
    await supabase.from("profiles").update({ status: "approved" }).eq("id", id);
    // Creer wallet si inexistant
    await supabase.from("wallets").upsert({ user_id: id, xaf: 0, usd: 0 }, { onConflict: "user_id", ignoreDuplicates: true });
    setAllUsers(function(prev) { return prev.map(function(u) { return u.id === id ? Object.assign({}, u, { status: "approved" }) : u; }); });
    setPendingCount(function(prev) { return Math.max(0, prev - 1); });
  };

  var reject = async function(id) {
    await supabase.from("profiles").update({ status: "rejected" }).eq("id", id);
    setAllUsers(function(prev) { return prev.map(function(u) { return u.id === id ? Object.assign({}, u, { status: "rejected" }) : u; }); });
    setPendingCount(function(prev) { return Math.max(0, prev - 1); });
  };

  var doRecharge = async function() {
    var amt = parseFloat(rechargeAmount);
    if (!rechargeUser || !amt || amt <= 0) return setRechargeError("Montant invalide.");
    setRechargeLoading(true); setRechargeError(""); setRechargeSuccess("");
    try {
      // Recuperer solde actuel
      var walRes = await supabase.from("wallets").select("xaf").eq("user_id", rechargeUser.id).single();
      var currentXaf = walRes.data ? walRes.data.xaf || 0 : 0;
      var newXaf = currentXaf + amt;
      // Mettre a jour wallet
      var upRes = await supabase.from("wallets").upsert({ user_id: rechargeUser.id, xaf: newXaf, usd: 0 }, { onConflict: "user_id" });
      if (upRes.error) return setRechargeError("Erreur mise a jour solde.");
      // Enregistrer transaction
      await supabase.from("transactions").insert({
        user_id: rechargeUser.id,
        type: "recharge",
        method: "admin",
        amount: amt,
        currency: "XAF",
        note: rechargeNote || "Recharge en bureau - Axes Minerals",
        admin_id: adminId,
      });
      setRechargeSuccess("Solde de " + rechargeUser.name + " recharg\u00e9 de " + fmtXAF(amt) + " avec succes !");
      setRechargeAmount(""); setRechargeNote("");
      // Recharger historique
      supabase.from("transactions").select("*, profiles(name, email)").eq("type", "recharge").order("created_at", { ascending: false }).limit(50)
        .then(function(r) { setRechargeHistory(r.data || []); });
    } finally { setRechargeLoading(false); }
  };

  var tabs = [
    ["pending", "⏳ En attente", pending.length],
    ["approved", "✅ Approuves", approved.length],
    ["recharges", "💰 Recharges", null],
    ["rejected", "❌ Refuses", rejected.length],
  ];

  return (
    <div>
      <h1 style={{ fontSize: 24, fontWeight: 900, marginBottom: 6 }}>Administration</h1>
      <p style={{ color: C.textMuted, fontSize: 14, marginBottom: 20 }}>Gestion des utilisateurs et recharges</p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14, marginBottom: 24 }}>
        {[
          { label: "En attente", value: pending.length, icon: "⏳", color: C.gold },
          { label: "Approuves", value: approved.length, icon: "✅", color: C.green },
          { label: "Refuses", value: rejected.length, icon: "❌", color: C.red },
        ].map(function(kpi) {
          return (
            <div key={kpi.label} style={{ background: C.bgCard, border: "1px solid " + kpi.color + "44", borderRadius: 12, padding: "16px 18px" }}>
              <div style={{ fontSize: 22, marginBottom: 6 }}>{kpi.icon}</div>
              <div style={{ fontSize: 24, fontWeight: 900, color: kpi.color }}>{kpi.value}</div>
              <div style={{ color: C.textMuted, fontSize: 12, marginTop: 3 }}>{kpi.label}</div>
            </div>
          );
        })}
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
        {tabs.map(function(t) {
          return (
            <button key={t[0]} onClick={function() { setTab(t[0]); }} style={{ padding: "8px 16px", border: "1px solid " + (tab === t[0] ? C.copper : C.border), borderRadius: 8, background: tab === t[0] ? C.copper + "20" : C.bgCard, color: tab === t[0] ? C.copper : C.textMuted, fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
              {t[1]}{t[2] !== null ? " " + t[2] : ""}
            </button>
          );
        })}
      </div>

      {tab === "pending" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {pending.length === 0 && <div style={{ textAlign: "center", padding: "48px 0", color: C.textDim }}>✅ Aucune demande en attente</div>}
          {pending.map(function(u) {
            return (
              <div key={u.id} style={{ background: C.bgCard, border: "1px solid " + C.gold + "44", borderRadius: 12, padding: 20, display: "flex", alignItems: "center", gap: 16 }}>
                <div style={{ width: 44, height: 44, borderRadius: "50%", background: C.gold + "22", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: 18, color: C.gold }}>{u.name ? u.name.charAt(0) : "?"}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 800, fontSize: 16 }}>{u.name}</div>
                  <div style={{ color: C.textMuted, fontSize: 13 }}>{u.email}</div>
                </div>
                <div style={{ display: "flex", gap: 10 }}>
                  <button onClick={function() { approve(u.id); }} style={{ padding: "10px 20px", background: "linear-gradient(135deg," + C.green + ",#16a34a)", border: "none", borderRadius: 8, color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>Approuver</button>
                  <button onClick={function() { reject(u.id); }} style={{ padding: "10px 16px", background: "#2A1010", border: "1px solid " + C.red, borderRadius: 8, color: C.red, fontWeight: 700, fontSize: 13, cursor: "pointer" }}>Refuser</button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {tab === "approved" && (
        <div>
          <div style={{ marginBottom: 16 }}>
            <input value={search} onChange={function(e) { setSearch(e.target.value); }} placeholder="Rechercher par nom ou email..."
              style={{ width: "100%", boxSizing: "border-box", padding: "10px 14px", background: C.bgPanel, border: "1px solid " + C.border, borderRadius: 8, color: C.text, fontSize: 14, outline: "none" }} />
          </div>
          <div style={{ background: C.bgCard, border: "1px solid " + C.border, borderRadius: 12, overflow: "hidden" }}>
            {filtered.length === 0 && <div style={{ textAlign: "center", padding: "40px 0", color: C.textDim }}>Aucun utilisateur</div>}
            {filtered.map(function(u) {
              var wallet = u.wallets && u.wallets[0] ? u.wallets[0] : null;
              return (
                <div key={u.id} style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 20px", borderBottom: "1px solid " + C.border }}>
                  <div style={{ width: 38, height: 38, borderRadius: "50%", background: C.copper + "22", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, color: C.copper }}>{u.name ? u.name.charAt(0) : "?"}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700 }}>{u.name}</div>
                    <div style={{ color: C.textMuted, fontSize: 12 }}>{u.email}</div>
                  </div>
                  <div style={{ textAlign: "right", marginRight: 16 }}>
                    <div style={{ fontWeight: 800, color: C.gold }}>{fmtXAF(wallet ? wallet.xaf || 0 : 0)}</div>
                    <div style={{ fontSize: 11, color: C.textDim }}>{u.investments ? u.investments.length : 0} position(s)</div>
                  </div>
                  <button onClick={function() { setRechargeUser(u); setTab("recharges"); setRechargeSuccess(""); setRechargeError(""); }} style={{ padding: "8px 16px", background: "linear-gradient(135deg," + C.copper + "," + C.copperLight + ")", border: "none", borderRadius: 8, color: "#fff", fontWeight: 700, fontSize: 12, cursor: "pointer" }}>
                    💰 Recharger
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {tab === "recharges" && (
        <div style={{ display: "grid", gridTemplateColumns: "400px 1fr", gap: 24 }}>
          <div style={{ background: C.bgCard, border: "1px solid " + C.border, borderRadius: 12, padding: 24 }}>
            <div style={{ fontWeight: 800, fontSize: 16, marginBottom: 20, color: C.copper }}>💰 Recharger un compte</div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", color: C.textMuted, fontSize: 12, fontWeight: 700, marginBottom: 8 }}>CLIENT</label>
              <select value={rechargeUser ? rechargeUser.id : ""} onChange={function(e) {
                var u = approved.find(function(x) { return x.id === e.target.value; });
                setRechargeUser(u || null); setRechargeSuccess(""); setRechargeError("");
              }} style={{ width: "100%", padding: "10px 14px", background: C.bgPanel, border: "1px solid " + C.border, borderRadius: 8, color: C.text, fontSize: 14, outline: "none" }}>
                <option value="">-- Selectionner un client --</option>
                {approved.map(function(u) { return <option key={u.id} value={u.id}>{u.name} ({u.email})</option>; })}
              </select>
            </div>

            {rechargeUser && (
              <div style={{ background: C.bgPanel, borderRadius: 8, padding: "12px 14px", marginBottom: 16, display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: "50%", background: C.copper + "22", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, color: C.copper }}>{rechargeUser.name ? rechargeUser.name.charAt(0) : "?"}</div>
                <div>
                  <div style={{ fontWeight: 700 }}>{rechargeUser.name}</div>
                  <div style={{ fontSize: 12, color: C.textMuted }}>Solde actuel : <span style={{ color: C.gold, fontWeight: 700 }}>{fmtXAF(rechargeUser.wallets && rechargeUser.wallets[0] ? rechargeUser.wallets[0].xaf || 0 : 0)}</span></div>
                </div>
              </div>
            )}

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", color: C.textMuted, fontSize: 12, fontWeight: 700, marginBottom: 8 }}>MONTANT A CREDITER (XAF)</label>
              <input type="number" value={rechargeAmount} onChange={function(e) { setRechargeAmount(e.target.value); }} placeholder="Ex: 100000"
                style={{ width: "100%", boxSizing: "border-box", padding: "12px 14px", background: C.bgPanel, border: "1px solid " + C.border, borderRadius: 8, color: C.text, fontSize: 16, fontWeight: 700, outline: "none" }} />
              <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                {[50000, 100000, 500000, 1000000].map(function(v) {
                  return (
                    <button key={v} onClick={function() { setRechargeAmount(String(v)); }} style={{ flex: 1, padding: "6px 0", background: C.bgPanel, border: "1px solid " + C.border, borderRadius: 6, color: C.textMuted, fontSize: 11, cursor: "pointer" }}>
                      {v >= 1000000 ? "1M" : (v / 1000) + "k"}
                    </button>
                  );
                })}
              </div>
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ display: "block", color: C.textMuted, fontSize: 12, fontWeight: 700, marginBottom: 8 }}>NOTE (optionnel)</label>
              <input type="text" value={rechargeNote} onChange={function(e) { setRechargeNote(e.target.value); }} placeholder="Ex: Paiement especes bureau Brazzaville"
                style={{ width: "100%", boxSizing: "border-box", padding: "10px 14px", background: C.bgPanel, border: "1px solid " + C.border, borderRadius: 8, color: C.text, fontSize: 13, outline: "none" }} />
            </div>

            {rechargeError && <div style={{ background: "#2A1010", border: "1px solid #5A1A1A", borderRadius: 8, padding: "10px 14px", color: C.red, fontSize: 13, marginBottom: 12 }}>{rechargeError}</div>}
            {rechargeSuccess && <div style={{ background: "#0A2A10", border: "1px solid " + C.green, borderRadius: 8, padding: "10px 14px", color: C.green, fontSize: 13, marginBottom: 12 }}>{rechargeSuccess}</div>}

            <button onClick={doRecharge} disabled={!rechargeUser || !rechargeAmount || rechargeLoading}
              style={{ width: "100%", padding: "14px 0", background: rechargeUser && rechargeAmount ? "linear-gradient(135deg," + C.copper + "," + C.copperLight + ")" : C.bgPanel, border: "none", borderRadius: 10, color: "#fff", fontWeight: 800, fontSize: 15, cursor: rechargeLoading ? "wait" : "pointer" }}>
              {rechargeLoading ? "Traitement..." : "✓ Crediter le compte"}
            </button>
          </div>

          <div>
            <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 16, color: C.textMuted }}>Historique des recharges</div>
            {histLoading && <div style={{ color: C.textDim, padding: 20 }}>Chargement...</div>}
            {!histLoading && rechargeHistory.length === 0 && <div style={{ textAlign: "center", padding: "48px 0", color: C.textDim }}>Aucune recharge effectuee</div>}
            {rechargeHistory.map(function(tx) {
              return (
                <div key={tx.id} style={{ background: C.bgCard, border: "1px solid " + C.border, borderRadius: 10, padding: "14px 18px", marginBottom: 10, display: "flex", alignItems: "center", gap: 14 }}>
                  <div style={{ width: 40, height: 40, borderRadius: "50%", background: C.green + "15", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>💰</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700 }}>{tx.profiles ? tx.profiles.name : "Client"}</div>
                    <div style={{ fontSize: 12, color: C.textMuted }}>{tx.note || "Recharge bureau"}</div>
                    <div style={{ fontSize: 11, color: C.textDim }}>{new Date(tx.created_at).toLocaleString("fr-FR")}</div>
                  </div>
                  <div style={{ fontWeight: 900, fontSize: 16, color: C.green }}>+{fmtXAF(tx.amount)}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {tab === "rejected" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {rejected.length === 0 && <div style={{ textAlign: "center", padding: "48px 0", color: C.textDim }}>Aucun compte refuse</div>}
          {rejected.map(function(u) {
            return (
              <div key={u.id} style={{ background: C.bgCard, border: "1px solid " + C.border, borderRadius: 10, padding: "14px 18px", display: "flex", alignItems: "center", gap: 14, opacity: 0.7 }}>
                <div style={{ width: 36, height: 36, borderRadius: "50%", background: C.red + "15", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, color: C.red }}>{u.name ? u.name.charAt(0) : "?"}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700 }}>{u.name}</div>
                  <div style={{ color: C.textMuted, fontSize: 12 }}>{u.email}</div>
                </div>
                <button onClick={function() { approve(u.id); }} style={{ padding: "7px 14px", background: C.green + "15", border: "1px solid " + C.green, borderRadius: 6, color: C.green, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>Reapprouver</button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function App() {
  var [user, setUser] = useState(null);
  var [loading, setLoading] = useState(true);
  var [prices, setPrices] = useState({ copper: 9420, zinc: 2680, lead: 2120 });
  var [cryptoPrices, setCryptoPrices] = useState(CRYPTO_BASE);
  var [histories] = useState(function() { return Object.fromEntries(Object.entries(METALS).map(function(entry) { return [entry[0], genPriceHistory(entry[1].basePrice, entry[1].volatility)]; })); });

  useEffect(function() {
    supabase.auth.getSession().then(async function(res) {
      var session = res.data.session;
      if (session) {
        var profRes = await supabase.from("profiles").select("*").eq("id", session.user.id).single();
        var profile = profRes.data;
        if (profile && profile.status === "approved") {
          var walRes = await supabase.from("wallets").select("*").eq("user_id", session.user.id).single();
          var invRes = await supabase.from("investments").select("*").eq("user_id", session.user.id);
          var txRes = await supabase.from("transactions").select("*").eq("user_id", session.user.id).order("created_at", { ascending: false });
          setUser(Object.assign({}, profile, { wallet: walRes.data, investments: invRes.data || [], transactions: txRes.data || [] }));
        }
      }
      setLoading(false);
    });

    var id1 = setInterval(function() { setPrices(function(p) { return { copper: Math.round(p.copper * (1 + (Math.random() - 0.49) * 0.004)), zinc: Math.round(p.zinc * (1 + (Math.random() - 0.49) * 0.005)), lead: Math.round(p.lead * (1 + (Math.random() - 0.49) * 0.004)) }; }); }, 3500);
    var id2 = setInterval(function() { setCryptoPrices(function(p) { return { BTC: Math.round(p.BTC * (1 + (Math.random() - 0.49) * 0.008)), ETH: Math.round(p.ETH * (1 + (Math.random() - 0.49) * 0.010)), USDT: 1 }; }); }, 4000);
    return function() { clearInterval(id1); clearInterval(id2); };
  }, []);

  var handleLogout = async function() { await supabase.auth.signOut(); setUser(null); };

  if (loading) return (
    <div style={{ minHeight: "100vh", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>⛏</div>
        <div style={{ color: C.copper, fontSize: 18, fontWeight: 700 }}>Chargement...</div>
      </div>
    </div>
  );

  if (!user) return <AuthPage onLogin={setUser} />;
  return (
    <div>
      <Dashboard user={user} setUser={setUser} prices={prices} cryptoPrices={cryptoPrices} histories={histories} onLogout={handleLogout} />
      <a href="https://wa.me/242067340901" target="_blank" rel="noreferrer"
        style={{ position: "fixed", bottom: 28, right: 28, width: 56, height: 56, borderRadius: "50%", background: "#25D366", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 20px #25D36666", zIndex: 9999, textDecoration: "none", fontSize: 28 }}
        title="Support WhatsApp">
        💬
      </a>
    </div>
  );
}
