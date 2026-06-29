// ─── WALLET MODULE — Axes Minerals ──────────────────────────────────────────
// Portefeuille électronique : XAF, Crypto (BTC/USDT/ETH), Mobile Money
// Fonctions : Dépôt, Retrait, Transfert, Historique

const C = {
  bg: "#0A0A0F", bgCard: "#12121A", bgPanel: "#1A1A26", border: "#2A2A3E",
  copper: "#B87333", copperLight: "#D4956A", gold: "#D4A853",
  green: "#22C55E", red: "#EF4444", blue: "#3B82F6", purple: "#8B5CF6",
  orange: "#F97316", teal: "#14B8A6",
  text: "#F1F0EE", textMuted: "#8B8B9E", textDim: "#5A5A72",
};

// ─── Crypto prices (simulées) ─────────────────────────────────────────────
const CRYPTOS = {
  BTC:  { name: "Bitcoin",  symbol: "BTC", icon: "₿", color: "#F7931A", basePrice: 67500 },
  ETH:  { name: "Ethereum", symbol: "ETH", icon: "Ξ", color: "#627EEA", basePrice: 3420  },
  USDT: { name: "Tether",   symbol: "USDT",icon: "₮", color: "#26A17B", basePrice: 1     },
};

const MOBILE_MONEY = [
  { id: "mtn",    name: "MTN Mobile Money",   icon: "📱", color: "#FFCB00", prefix: "+242" },
  { id: "airtel", name: "Airtel Money",        icon: "📲", color: "#FF0000", prefix: "+242" },
  { id: "orange", name: "Orange Money",        icon: "🟠", color: "#FF6600", prefix: "+242" },
];

const XAF_TO_USD = 0.00163;
function xafToUsd(xaf) { return xaf * XAF_TO_USD; }
function usdToXaf(usd) { return usd / XAF_TO_USD; }
function fmt(n, dec = 0) { return Number(n).toLocaleString("fr-FR", { minimumFractionDigits: dec, maximumFractionDigits: dec }); }
function fmtXAF(n) { return fmt(Math.round(n)) + " XAF"; }
function fmtCrypto(n, sym) { return Number(n).toFixed(sym === "BTC" ? 6 : sym === "ETH" ? 4 : 2) + " " + sym; }
function now() { return new Date().toISOString(); }
function fmtDate(iso) { return new Date(iso).toLocaleString("fr-FR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }); }

// ─── Seed wallet data ─────────────────────────────────────────────────────
export function initWallet() {
  return {
    xaf: 0,
    crypto: { BTC: 0, ETH: 0, USDT: 0 },
    transactions: [],
    mobileMoney: [],
  };
}

export function seedWallet() {
  return {
    xaf: 250000,
    crypto: { BTC: 0.0035, ETH: 0.42, USDT: 120 },
    mobileMoney: [{ provider: "mtn", number: "+242 06 123 4567", verified: true }],
    transactions: [
      { id: 1, type: "depot", method: "mtn", amount: 150000, currency: "XAF", status: "success", date: "2024-03-01T10:00:00Z", note: "Dépôt MTN Mobile Money" },
      { id: 2, type: "invest", method: "wallet", amount: 50000, currency: "XAF", status: "success", date: "2024-03-05T14:30:00Z", note: "Investissement Cuivre" },
      { id: 3, type: "achat_crypto", method: "wallet", amount: 100000, currency: "XAF", crypto: "BTC", cryptoAmount: 0.0021, status: "success", date: "2024-04-10T09:15:00Z", note: "Achat Bitcoin" },
      { id: 4, type: "depot", method: "airtel", amount: 200000, currency: "XAF", status: "success", date: "2024-05-01T08:00:00Z", note: "Dépôt Airtel Money" },
      { id: 5, type: "transfert", method: "wallet", amount: 25000, currency: "XAF", status: "success", date: "2024-05-15T16:45:00Z", note: "Transfert vers Marie Nzamba" },
    ],
  };
}

// ─── WalletPage principale ────────────────────────────────────────────────
import { useState, useEffect } from "react";

export default function WalletPage({ user, users, setUsers, cryptoPrices }) {
  const currentUser = users.find(u => u.id === user.id) || user;
  const wallet = currentUser.wallet || initWallet();
  const [tab, setTab] = useState("overview");

  const updateWallet = (newWallet, newTx) => {
    const updatedWallet = {
      ...newWallet,
      transactions: newTx ? [newTx, ...(newWallet.transactions || [])] : newWallet.transactions,
    };
    setUsers(users.map(u => u.id === user.id ? { ...u, wallet: updatedWallet } : u));
  };

  const tabs = [
    { key: "overview",  label: "Vue d'ensemble", icon: "◉" },
    { key: "depot",     label: "Dépôt",           icon: "↓" },
    { key: "retrait",   label: "Retrait",          icon: "↑" },
    { key: "transfert", label: "Transfert",        icon: "⇄" },
    { key: "crypto",    label: "Crypto",           icon: "₿" },
    { key: "historique",label: "Historique",       icon: "☰" },
  ];

  // Valeur crypto totale en XAF
  const cryptoValueXAF = Object.entries(wallet.crypto || {}).reduce((s, [sym, amt]) => {
    return s + usdToXaf((cryptoPrices[sym] || CRYPTOS[sym]?.basePrice || 0) * amt);
  }, 0);

  return (
    <div>
      <h1 style={{ fontSize: 24, fontWeight: 900, marginBottom: 4 }}>Portefeuille</h1>
      <p style={{ color: C.textMuted, fontSize: 14, marginBottom: 24 }}>Gérez vos fonds XAF, Mobile Money et Crypto</p>

      {/* Solde total */}
      <div style={{ background: `linear-gradient(135deg, #1A1A2E, #16213E)`, border: `1px solid ${C.border}`, borderRadius: 16, padding: "28px 28px 24px", marginBottom: 24, position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: -20, right: -20, width: 120, height: 120, borderRadius: "50%", background: `${C.copper}15` }} />
        <div style={{ color: C.textMuted, fontSize: 12, letterSpacing: 1, marginBottom: 8 }}>SOLDE TOTAL ESTIMÉ</div>
        <div style={{ fontSize: 36, fontWeight: 900, color: C.copper, marginBottom: 4 }}>
          {fmtXAF(wallet.xaf + cryptoValueXAF)}
        </div>
        <div style={{ fontSize: 13, color: C.textMuted }}>
          dont <span style={{ color: C.green }}>{fmtXAF(wallet.xaf)}</span> XAF liquide
          · <span style={{ color: "#F7931A" }}>{fmtXAF(Math.round(cryptoValueXAF))}</span> en crypto
        </div>

        {/* Mini stats */}
        <div style={{ display: "flex", gap: 24, marginTop: 20, paddingTop: 16, borderTop: `1px solid ${C.border}` }}>
          {Object.entries(wallet.crypto || {}).map(([sym, amt]) => {
            const price = cryptoPrices[sym] || CRYPTOS[sym]?.basePrice || 0;
            const c = CRYPTOS[sym];
            if (!amt) return null;
            return (
              <div key={sym}>
                <div style={{ color: c.color, fontSize: 12, fontWeight: 700 }}>{c.icon} {sym}</div>
                <div style={{ fontWeight: 800, fontSize: 14 }}>{fmtCrypto(amt, sym)}</div>
                <div style={{ color: C.textDim, fontSize: 11 }}>${fmt(price * amt, 2)}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 6, marginBottom: 24, flexWrap: "wrap" }}>
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} style={{
            padding: "8px 14px", border: `1px solid ${tab === t.key ? C.copper : C.border}`, borderRadius: 8,
            background: tab === t.key ? `${C.copper}20` : C.bgCard, color: tab === t.key ? C.copper : C.textMuted,
            fontWeight: 700, fontSize: 13, cursor: "pointer",
          }}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {tab === "overview"   && <WalletOverview wallet={wallet} cryptoPrices={cryptoPrices} />}
      {tab === "depot"      && <DepotTab wallet={wallet} updateWallet={updateWallet} />}
      {tab === "retrait"    && <RetraitTab wallet={wallet} updateWallet={updateWallet} />}
      {tab === "transfert"  && <TransfertTab wallet={wallet} updateWallet={updateWallet} users={users} currentUser={currentUser} setUsers={setUsers} />}
      {tab === "crypto"     && <CryptoTab wallet={wallet} updateWallet={updateWallet} cryptoPrices={cryptoPrices} />}
      {tab === "historique" && <HistoriqueTab wallet={wallet} />}
    </div>
  );
}

// ─── Vue d'ensemble ───────────────────────────────────────────────────────
function WalletOverview({ wallet, cryptoPrices }) {
  const mm = wallet.mobileMoney || [];
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
      {/* Mobile Money liés */}
      <div style={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 12, padding: 20 }}>
        <div style={{ fontWeight: 800, marginBottom: 14, fontSize: 14 }}>📱 Mobile Money liés</div>
        {mm.length === 0 && <div style={{ color: C.textDim, fontSize: 13 }}>Aucun compte lié</div>}
        {mm.map((m, i) => {
          const prov = MOBILE_MONEY.find(p => p.id === m.provider);
          return (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 0", borderBottom: `1px solid ${C.border}` }}>
              <span style={{ fontSize: 22 }}>{prov?.icon}</span>
              <div>
                <div style={{ fontWeight: 700, fontSize: 13 }}>{prov?.name}</div>
                <div style={{ color: C.textMuted, fontSize: 12 }}>{m.number}</div>
              </div>
              {m.verified && <span style={{ marginLeft: "auto", fontSize: 11, color: C.green, fontWeight: 700 }}>✓ Vérifié</span>}
            </div>
          );
        })}
      </div>

      {/* Crypto holdings */}
      <div style={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 12, padding: 20 }}>
        <div style={{ fontWeight: 800, marginBottom: 14, fontSize: 14 }}>₿ Crypto Holdings</div>
        {Object.entries(CRYPTOS).map(([sym, c]) => {
          const amt = wallet.crypto?.[sym] || 0;
          const price = cryptoPrices[sym] || c.basePrice;
          const valUsd = amt * price;
          return (
            <div key={sym} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 0", borderBottom: `1px solid ${C.border}` }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ color: c.color, fontWeight: 900, fontSize: 16 }}>{c.icon}</span>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 13 }}>{c.name}</div>
                  <div style={{ color: C.textMuted, fontSize: 11 }}>${fmt(price, 2)}</div>
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontWeight: 800, color: c.color, fontSize: 13 }}>{fmtCrypto(amt, sym)}</div>
                <div style={{ color: C.textDim, fontSize: 11 }}>${fmt(valUsd, 2)}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Dernières transactions */}
      <div style={{ gridColumn: "1/-1", background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 12, padding: 20 }}>
        <div style={{ fontWeight: 800, marginBottom: 14, fontSize: 14 }}>🕐 Dernières transactions</div>
        {(wallet.transactions || []).slice(0, 5).map((tx, i) => (
          <TxRow key={i} tx={tx} />
        ))}
        {!(wallet.transactions?.length) && <div style={{ color: C.textDim, fontSize: 13 }}>Aucune transaction</div>}
      </div>
    </div>
  );
}

// ─── Dépôt ────────────────────────────────────────────────────────────────
function DepotTab({ wallet, updateWallet }) {
  const [method, setMethod] = useState("mtn");
  const [amount, setAmount] = useState("");
  const [phone, setPhone] = useState("");
  const [step, setStep] = useState("form"); // form | confirm | success
  const [otp, setOtp] = useState("");

  const prov = MOBILE_MONEY.find(p => p.id === method);
  const amt = parseFloat(amount) || 0;

  const confirm = () => {
    if (amt < 1000) return;
    setStep("confirm");
  };

  const validate = () => {
    if (otp !== "1234") return alert("Code OTP incorrect. (Démo : 1234)");
    const newWallet = { ...wallet, xaf: (wallet.xaf || 0) + amt };
    const tx = { id: Date.now(), type: "depot", method, amount: amt, currency: "XAF", status: "success", date: now(), note: `Dépôt ${prov.name} — ${phone}` };
    updateWallet(newWallet, tx);
    setStep("success");
  };

  if (step === "success") return (
    <SuccessCard
      icon="✅" title="Dépôt confirmé !"
      lines={[`+${fmtXAF(amt)} crédité sur votre portefeuille`, `Via ${prov.name}`]}
      onReset={() => { setStep("form"); setAmount(""); setOtp(""); setPhone(""); }}
      resetLabel="Nouveau dépôt"
    />
  );

  return (
    <div style={{ maxWidth: 480 }}>
      <SectionCard title="💳 Recharger via Mobile Money">
        {step === "form" && <>
          {/* Choix opérateur */}
          <div style={{ marginBottom: 18 }}>
            <Label>Opérateur</Label>
            <div style={{ display: "flex", gap: 10 }}>
              {MOBILE_MONEY.map(p => (
                <button key={p.id} onClick={() => setMethod(p.id)} style={{
                  flex: 1, padding: "12px 8px", border: `2px solid ${method === p.id ? p.color : C.border}`,
                  borderRadius: 10, background: method === p.id ? `${p.color}15` : C.bgPanel,
                  cursor: "pointer", fontWeight: 700, fontSize: 13, color: method === p.id ? p.color : C.textMuted,
                }}>
                  <div style={{ fontSize: 22 }}>{p.icon}</div>
                  <div style={{ fontSize: 11, marginTop: 4 }}>{p.id.toUpperCase()}</div>
                </button>
              ))}
            </div>
          </div>

          <WInput label="Numéro de téléphone" value={phone} onChange={setPhone} placeholder="+242 06 000 0000" />
          <WInput label="Montant (XAF)" value={amount} onChange={setAmount} type="number" placeholder="Min. 1 000 XAF" />
          <QuickAmounts onSelect={setAmount} values={[5000, 10000, 50000, 100000]} />

          <ActionBtn onClick={confirm} disabled={amt < 1000 || !phone} color={prov.color}>
            Déposer {amt > 0 ? fmtXAF(amt) : ""}
          </ActionBtn>
        </>}

        {step === "confirm" && <>
          <div style={{ background: C.bgPanel, borderRadius: 10, padding: 16, marginBottom: 16 }}>
            <Row label="Opérateur" value={prov.name} />
            <Row label="Numéro" value={phone} />
            <Row label="Montant" value={fmtXAF(amt)} color={C.green} />
          </div>
          <WInput label="Code OTP reçu par SMS (Démo : 1234)" value={otp} onChange={setOtp} placeholder="1234" />
          <ActionBtn onClick={validate} color={C.green}>Valider le dépôt</ActionBtn>
          <BackBtn onClick={() => setStep("form")} />
        </>}
      </SectionCard>
    </div>
  );
}

// ─── Retrait ──────────────────────────────────────────────────────────────
function RetraitTab({ wallet, updateWallet }) {
  const [method, setMethod] = useState("mtn");
  const [amount, setAmount] = useState("");
  const [phone, setPhone] = useState("");
  const [step, setStep] = useState("form");
  const [otp, setOtp] = useState("");

  const prov = MOBILE_MONEY.find(p => p.id === method);
  const amt = parseFloat(amount) || 0;

  const confirm = () => {
    if (amt < 1000 || amt > wallet.xaf) return;
    setStep("confirm");
  };

  const validate = () => {
    if (otp !== "1234") return alert("Code OTP incorrect. (Démo : 1234)");
    const newWallet = { ...wallet, xaf: wallet.xaf - amt };
    const tx = { id: Date.now(), type: "retrait", method, amount: amt, currency: "XAF", status: "success", date: now(), note: `Retrait ${prov.name} — ${phone}` };
    updateWallet(newWallet, tx);
    setStep("success");
  };

  if (step === "success") return (
    <SuccessCard icon="✅" title="Retrait effectué !"
      lines={[`-${fmtXAF(amt)} débité de votre portefeuille`, `Envoyé vers ${phone} via ${prov.name}`]}
      onReset={() => { setStep("form"); setAmount(""); setOtp(""); setPhone(""); }}
      resetLabel="Nouveau retrait"
    />
  );

  return (
    <div style={{ maxWidth: 480 }}>
      <SectionCard title="💸 Retirer vers Mobile Money">
        <div style={{ background: C.bgPanel, borderRadius: 8, padding: "10px 14px", marginBottom: 16, display: "flex", justifyContent: "space-between" }}>
          <span style={{ color: C.textMuted, fontSize: 13 }}>Solde disponible</span>
          <span style={{ fontWeight: 800, color: C.green }}>{fmtXAF(wallet.xaf)}</span>
        </div>

        {step === "form" && <>
          <div style={{ marginBottom: 18 }}>
            <Label>Opérateur</Label>
            <div style={{ display: "flex", gap: 10 }}>
              {MOBILE_MONEY.map(p => (
                <button key={p.id} onClick={() => setMethod(p.id)} style={{
                  flex: 1, padding: "12px 8px", border: `2px solid ${method === p.id ? p.color : C.border}`,
                  borderRadius: 10, background: method === p.id ? `${p.color}15` : C.bgPanel,
                  cursor: "pointer", fontWeight: 700, fontSize: 13, color: method === p.id ? p.color : C.textMuted,
                }}>
                  <div style={{ fontSize: 22 }}>{p.icon}</div>
                  <div style={{ fontSize: 11, marginTop: 4 }}>{p.id.toUpperCase()}</div>
                </button>
              ))}
            </div>
          </div>
          <WInput label="Numéro destinataire" value={phone} onChange={setPhone} placeholder="+242 06 000 0000" />
          <WInput label="Montant (XAF)" value={amount} onChange={setAmount} type="number" placeholder="Min. 1 000 XAF" />
          <QuickAmounts onSelect={setAmount} values={[5000, 10000, 25000, 50000]} />
          {amt > wallet.xaf && <ErrMsg>Solde insuffisant</ErrMsg>}
          <ActionBtn onClick={confirm} disabled={amt < 1000 || amt > wallet.xaf || !phone} color={C.red}>
            Retirer {amt > 0 ? fmtXAF(amt) : ""}
          </ActionBtn>
        </>}

        {step === "confirm" && <>
          <div style={{ background: C.bgPanel, borderRadius: 10, padding: 16, marginBottom: 16 }}>
            <Row label="Opérateur" value={prov.name} />
            <Row label="Numéro" value={phone} />
            <Row label="Montant" value={fmtXAF(amt)} color={C.red} />
            <Row label="Frais (1%)" value={fmtXAF(Math.round(amt * 0.01))} />
            <Row label="Vous recevrez" value={fmtXAF(Math.round(amt * 0.99))} color={C.green} />
          </div>
          <WInput label="Code OTP (Démo : 1234)" value={otp} onChange={setOtp} placeholder="1234" />
          <ActionBtn onClick={validate} color={C.red}>Confirmer le retrait</ActionBtn>
          <BackBtn onClick={() => setStep("form")} />
        </>}
      </SectionCard>
    </div>
  );
}

// ─── Transfert entre utilisateurs ────────────────────────────────────────
function TransfertTab({ wallet, updateWallet, users, currentUser, setUsers }) {
  const [email, setEmail] = useState("");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [step, setStep] = useState("form");
  const [target, setTarget] = useState(null);
  const [err, setErr] = useState("");

  const amt = parseFloat(amount) || 0;

  const search = () => {
    setErr("");
    const u = users.find(u => u.email === email && u.id !== currentUser.id);
    if (!u) return setErr("Utilisateur introuvable.");
    if (amt < 100) return setErr("Montant minimum : 100 XAF");
    if (amt > wallet.xaf) return setErr("Solde insuffisant");
    setTarget(u);
    setStep("confirm");
  };

  const confirm = () => {
    const senderWallet = { ...wallet, xaf: wallet.xaf - amt };
    const senderTx = { id: Date.now(), type: "transfert", method: "wallet", amount: amt, currency: "XAF", status: "success", date: now(), note: `Transfert vers ${target.name}${note ? " — " + note : ""}` };
    updateWallet(senderWallet, senderTx);

    // Créditer le destinataire
    const targetUser = users.find(u => u.id === target.id);
    const targetWallet = targetUser.wallet || initWallet();
    const updatedTarget = {
      ...targetUser,
      wallet: {
        ...targetWallet,
        xaf: (targetWallet.xaf || 0) + amt,
        transactions: [{ id: Date.now() + 1, type: "reception", method: "wallet", amount: amt, currency: "XAF", status: "success", date: now(), note: `Reçu de ${currentUser.name}${note ? " — " + note : ""}` }, ...(targetWallet.transactions || [])],
      },
    };
    setUsers(users.map(u => u.id === target.id ? updatedTarget : u));
    setStep("success");
  };

  if (step === "success") return (
    <SuccessCard icon="✅" title="Transfert effectué !"
      lines={[`${fmtXAF(amt)} envoyé à ${target.name}`, note || ""]}
      onReset={() => { setStep("form"); setAmount(""); setEmail(""); setNote(""); setTarget(null); }}
      resetLabel="Nouveau transfert"
    />
  );

  return (
    <div style={{ maxWidth: 480 }}>
      <SectionCard title="⇄ Transfert entre comptes">
        <div style={{ background: C.bgPanel, borderRadius: 8, padding: "10px 14px", marginBottom: 16, display: "flex", justifyContent: "space-between" }}>
          <span style={{ color: C.textMuted, fontSize: 13 }}>Solde disponible</span>
          <span style={{ fontWeight: 800, color: C.green }}>{fmtXAF(wallet.xaf)}</span>
        </div>

        {step === "form" && <>
          <WInput label="Email du destinataire" value={email} onChange={setEmail} placeholder="destinataire@email.com" type="email" />
          <WInput label="Montant (XAF)" value={amount} onChange={setAmount} type="number" placeholder="Min. 100 XAF" />
          <WInput label="Note (optionnel)" value={note} onChange={setNote} placeholder="Remboursement, cadeau..." />
          <QuickAmounts onSelect={setAmount} values={[1000, 5000, 10000, 25000]} />
          {err && <ErrMsg>{err}</ErrMsg>}
          <ActionBtn onClick={search} disabled={!email || amt < 100} color={C.blue}>Continuer</ActionBtn>
        </>}

        {step === "confirm" && target && <>
          <div style={{ background: C.bgPanel, borderRadius: 10, padding: 16, marginBottom: 16 }}>
            <Row label="Destinataire" value={target.name} />
            <Row label="Email" value={target.email} />
            <Row label="Montant" value={fmtXAF(amt)} color={C.blue} />
            {note && <Row label="Note" value={note} />}
          </div>
          <ActionBtn onClick={confirm} color={C.blue}>Confirmer le transfert</ActionBtn>
          <BackBtn onClick={() => setStep("form")} />
        </>}
      </SectionCard>
    </div>
  );
}

// ─── Crypto Tab ───────────────────────────────────────────────────────────
function CryptoTab({ wallet, updateWallet, cryptoPrices }) {
  const [action, setAction] = useState("buy"); // buy | sell
  const [symbol, setSymbol] = useState("BTC");
  const [amount, setAmount] = useState(""); // en XAF pour achat, en crypto pour vente
  const [step, setStep] = useState("form");

  const crypto = CRYPTOS[symbol];
  const price = cryptoPrices[symbol] || crypto.basePrice;
  const priceXAF = usdToXaf(price);
  const amt = parseFloat(amount) || 0;

  const cryptoAmount = action === "buy" ? amt / priceXAF : amt;
  const xafAmount = action === "buy" ? amt : amt * priceXAF;

  const canProceed = action === "buy"
    ? amt >= 1000 && amt <= wallet.xaf
    : amt > 0 && amt <= (wallet.crypto?.[symbol] || 0);

  const execute = () => {
    let newWallet = { ...wallet };
    if (action === "buy") {
      newWallet.xaf = (wallet.xaf || 0) - amt;
      newWallet.crypto = { ...wallet.crypto, [symbol]: (wallet.crypto?.[symbol] || 0) + cryptoAmount };
    } else {
      newWallet.xaf = (wallet.xaf || 0) + xafAmount;
      newWallet.crypto = { ...wallet.crypto, [symbol]: (wallet.crypto?.[symbol] || 0) - amt };
    }
    const tx = {
      id: Date.now(), type: action === "buy" ? "achat_crypto" : "vente_crypto",
      method: "wallet", amount: Math.round(xafAmount), currency: "XAF",
      crypto: symbol, cryptoAmount: cryptoAmount,
      status: "success", date: now(),
      note: `${action === "buy" ? "Achat" : "Vente"} ${fmtCrypto(cryptoAmount, symbol)} @ ${fmtXAF(Math.round(priceXAF))}`,
    };
    updateWallet(newWallet, tx);
    setStep("success");
  };

  if (step === "success") return (
    <SuccessCard icon="₿" title={`${action === "buy" ? "Achat" : "Vente"} confirmé !`}
      lines={[
        action === "buy" ? `+${fmtCrypto(cryptoAmount, symbol)} reçu` : `+${fmtXAF(Math.round(xafAmount))} crédité`,
        `Prix : ${fmtXAF(Math.round(priceXAF))} / ${symbol}`,
      ]}
      onReset={() => { setStep("form"); setAmount(""); }}
      resetLabel="Nouvelle opération"
    />
  );

  return (
    <div style={{ maxWidth: 520 }}>
      {/* Prix live */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, marginBottom: 20 }}>
        {Object.entries(CRYPTOS).map(([sym, c]) => {
          const p = cryptoPrices[sym] || c.basePrice;
          return (
            <button key={sym} onClick={() => setSymbol(sym)} style={{
              padding: "14px 10px", border: `2px solid ${symbol === sym ? c.color : C.border}`,
              borderRadius: 10, background: symbol === sym ? `${c.color}15` : C.bgCard,
              cursor: "pointer", textAlign: "left",
            }}>
              <div style={{ color: c.color, fontWeight: 900, fontSize: 18 }}>{c.icon} {sym}</div>
              <div style={{ color: C.text, fontWeight: 700, fontSize: 14, marginTop: 4 }}>${fmt(p, sym === "USDT" ? 2 : 0)}</div>
              <div style={{ color: C.textDim, fontSize: 11, marginTop: 2 }}>{fmtXAF(Math.round(usdToXaf(p)))}</div>
              <div style={{ color: C.textMuted, fontSize: 11, marginTop: 4 }}>
                Solde : {fmtCrypto(wallet.crypto?.[sym] || 0, sym)}
              </div>
            </button>
          );
        })}
      </div>

      <SectionCard title={`${action === "buy" ? "🛒 Acheter" : "💱 Vendre"} ${crypto.name}`}>
        {/* Buy/Sell toggle */}
        <div style={{ display: "flex", background: C.bgPanel, borderRadius: 8, padding: 4, marginBottom: 18 }}>
          {[["buy","Acheter"], ["sell","Vendre"]].map(([v, l]) => (
            <button key={v} onClick={() => { setAction(v); setAmount(""); }} style={{
              flex: 1, padding: "8px 0", border: "none", borderRadius: 6, cursor: "pointer",
              fontWeight: 700, fontSize: 13,
              background: action === v ? (v === "buy" ? C.green : C.red) : "transparent",
              color: action === v ? "#fff" : C.textMuted,
            }}>{l}</button>
          ))}
        </div>

        <div style={{ background: C.bgPanel, borderRadius: 8, padding: "10px 14px", marginBottom: 14, display: "flex", justifyContent: "space-between" }}>
          <span style={{ color: C.textMuted, fontSize: 13 }}>{action === "buy" ? "Solde XAF" : `Solde ${symbol}`}</span>
          <span style={{ fontWeight: 800, color: C.green }}>
            {action === "buy" ? fmtXAF(wallet.xaf) : fmtCrypto(wallet.crypto?.[symbol] || 0, symbol)}
          </span>
        </div>

        <WInput
          label={action === "buy" ? "Montant à dépenser (XAF)" : `Quantité à vendre (${symbol})`}
          value={amount} onChange={setAmount} type="number"
          placeholder={action === "buy" ? "Ex: 50000 XAF" : `Ex: 0.001 ${symbol}`}
        />

        {amt > 0 && (
          <div style={{ background: C.bgPanel, borderRadius: 8, padding: "12px 14px", marginBottom: 14 }}>
            <Row label="Prix unitaire" value={`${fmtXAF(Math.round(priceXAF))} / ${symbol}`} />
            <Row label={action === "buy" ? "Vous recevrez" : "Vous recevrez"} value={action === "buy" ? fmtCrypto(cryptoAmount, symbol) : fmtXAF(Math.round(xafAmount))} color={crypto.color} />
            <Row label="Frais (0.5%)" value={action === "buy" ? fmtXAF(Math.round(amt * 0.005)) : fmtXAF(Math.round(xafAmount * 0.005))} />
          </div>
        )}

        {action === "buy" && amt > wallet.xaf && <ErrMsg>Solde XAF insuffisant</ErrMsg>}
        {action === "sell" && amt > (wallet.crypto?.[symbol] || 0) && <ErrMsg>Solde {symbol} insuffisant</ErrMsg>}

        <ActionBtn onClick={execute} disabled={!canProceed} color={action === "buy" ? C.green : C.red}>
          {action === "buy" ? `Acheter ${amt > 0 ? fmtCrypto(cryptoAmount, symbol) : symbol}` : `Vendre ${amt > 0 ? fmtCrypto(amt, symbol) : symbol}`}
        </ActionBtn>
      </SectionCard>
    </div>
  );
}

// ─── Historique ───────────────────────────────────────────────────────────
function HistoriqueTab({ wallet }) {
  const txs = wallet.transactions || [];
  const [filter, setFilter] = useState("all");

  const types = [
    { key: "all", label: "Tout" },
    { key: "depot", label: "Dépôts" },
    { key: "retrait", label: "Retraits" },
    { key: "transfert", label: "Transferts" },
    { key: "achat_crypto", label: "Crypto" },
    { key: "invest", label: "Investissements" },
  ];

  const filtered = filter === "all" ? txs : txs.filter(tx =>
    filter === "achat_crypto" ? ["achat_crypto","vente_crypto"].includes(tx.type) : tx.type === filter
  );

  return (
    <div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 20 }}>
        {types.map(t => (
          <button key={t.key} onClick={() => setFilter(t.key)} style={{
            padding: "6px 14px", border: `1px solid ${filter === t.key ? C.copper : C.border}`,
            borderRadius: 20, background: filter === t.key ? `${C.copper}20` : C.bgCard,
            color: filter === t.key ? C.copper : C.textMuted, fontWeight: 600, fontSize: 12, cursor: "pointer",
          }}>{t.label}</button>
        ))}
      </div>

      {filtered.length === 0 && <div style={{ textAlign: "center", padding: "40px 0", color: C.textDim }}>Aucune transaction</div>}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {filtered.map((tx, i) => <TxRow key={i} tx={tx} full />)}
      </div>
    </div>
  );
}

// ─── Composants partagés ──────────────────────────────────────────────────
function TxRow({ tx, full }) {
  const icons = { depot: "↓", retrait: "↑", transfert: "→", reception: "←", achat_crypto: "₿", vente_crypto: "💱", invest: "📊" };
  const colors = { depot: C.green, retrait: C.red, transfert: C.blue, reception: C.green, achat_crypto: "#F7931A", vente_crypto: C.purple, invest: C.copper };
  const icon = icons[tx.type] || "•";
  const color = colors[tx.type] || C.textMuted;
  const positive = ["depot", "reception", "vente_crypto"].includes(tx.type);

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 10 }}>
      <div style={{ width: 36, height: 36, borderRadius: "50%", background: `${color}20`, display: "flex", alignItems: "center", justifyContent: "center", color, fontWeight: 900, fontSize: 16, flexShrink: 0 }}>
        {icon}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 700, fontSize: 13, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{tx.note}</div>
        {full && <div style={{ color: C.textDim, fontSize: 11, marginTop: 2 }}>{fmtDate(tx.date)}</div>}
      </div>
      <div style={{ textAlign: "right", flexShrink: 0 }}>
        <div style={{ fontWeight: 800, color, fontSize: 14 }}>{positive ? "+" : "-"}{fmtXAF(tx.amount)}</div>
        {tx.crypto && <div style={{ color: C.textDim, fontSize: 11 }}>{fmtCrypto(tx.cryptoAmount, tx.crypto)}</div>}
      </div>
    </div>
  );
}

function SectionCard({ title, children }) {
  return (
    <div style={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 12, padding: 24 }}>
      <div style={{ fontWeight: 800, fontSize: 16, marginBottom: 20 }}>{title}</div>
      {children}
    </div>
  );
}

function Label({ children }) {
  return <label style={{ display: "block", color: C.textMuted, fontSize: 12, fontWeight: 700, letterSpacing: 0.5, marginBottom: 8 }}>{children}</label>;
}

function WInput({ label, value, onChange, type = "text", placeholder }) {
  return (
    <div style={{ marginBottom: 14 }}>
      {label && <Label>{label}</Label>}
      <input type={type} value={value} placeholder={placeholder} onChange={e => onChange(e.target.value)}
        style={{ width: "100%", boxSizing: "border-box", padding: "11px 14px", background: C.bgPanel, border: `1px solid ${C.border}`, borderRadius: 8, color: C.text, fontSize: 14, outline: "none", fontFamily: "inherit" }} />
    </div>
  );
}

function QuickAmounts({ onSelect, values }) {
  return (
    <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
      {values.map(v => (
        <button key={v} onClick={() => onSelect(String(v))} style={{ padding: "6px 12px", background: C.bgPanel, border: `1px solid ${C.border}`, borderRadius: 6, color: C.textMuted, fontSize: 12, cursor: "pointer" }}>
          {v >= 1000 ? (v / 1000) + "k" : v}
        </button>
      ))}
    </div>
  );
}

function ActionBtn({ onClick, disabled, color, children }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{
      width: "100%", padding: "13px 0", border: "none", borderRadius: 10,
      background: disabled ? C.bgPanel : `linear-gradient(135deg, ${color}, ${color}CC)`,
      color: disabled ? C.textDim : "#fff", fontWeight: 800, fontSize: 15, cursor: disabled ? "not-allowed" : "pointer", marginTop: 4,
    }}>{children}</button>
  );
}

function BackBtn({ onClick }) {
  return (
    <button onClick={onClick} style={{ width: "100%", padding: "10px 0", border: `1px solid ${C.border}`, borderRadius: 8, background: "transparent", color: C.textMuted, fontWeight: 600, fontSize: 13, cursor: "pointer", marginTop: 8 }}>
      ← Retour
    </button>
  );
}

function Row({ label, value, color }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: `1px solid ${C.border}` }}>
      <span style={{ color: C.textMuted, fontSize: 13 }}>{label}</span>
      <span style={{ fontWeight: 700, color: color || C.text, fontSize: 13 }}>{value}</span>
    </div>
  );
}

function ErrMsg({ children }) {
  return <div style={{ background: "#2A1010", border: "1px solid #5A1A1A", borderRadius: 8, padding: "8px 12px", color: C.red, fontSize: 13, marginBottom: 12 }}>{children}</div>;
}

function SuccessCard({ icon, title, lines, onReset, resetLabel }) {
  return (
    <div style={{ textAlign: "center", padding: "60px 0" }}>
      <div style={{ fontSize: 52, marginBottom: 16 }}>{icon}</div>
      <div style={{ fontSize: 22, fontWeight: 900, color: C.green, marginBottom: 12 }}>{title}</div>
      {lines.filter(Boolean).map((l, i) => <div key={i} style={{ color: C.textMuted, fontSize: 14, marginBottom: 4 }}>{l}</div>)}
      <button onClick={onReset} style={{ marginTop: 28, padding: "12px 28px", background: C.copper, border: "none", borderRadius: 8, color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
        {resetLabel}
      </button>
    </div>
  );
}
