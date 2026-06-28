# ⛏ Axes Minerals — Plateforme d'Investissement Minier

Application React (Vite) d'investissement sur les matières premières minières :  
**Cuivre · Zinc · Plomb** — Boko Songho, République du Congo.

---

## 🚀 Déploiement rapide (GitHub + Render)

### 1. Pousser sur GitHub

```bash
# Dans le dossier du projet
git init
git add .
git commit -m "Initial commit — Axes Minerals v1.0"

# Créer un repo sur github.com (ex: axes-minerals), puis :
git remote add origin https://github.com/VOTRE_USERNAME/axes-minerals.git
git branch -M main
git push -u origin main
```

### 2. Déployer sur Render.com

1. Aller sur [render.com](https://render.com) → **New → Static Site**
2. Connecter votre repo GitHub `axes-minerals`
3. Remplir les champs :

| Champ | Valeur |
|-------|--------|
| **Name** | axes-minerals |
| **Root Directory** | *(laisser vide)* |
| **Build Command** | `npm install && npm run build` |
| **Publish Directory** | `dist` |

4. Cliquer **Create Static Site** → Render build et déploie automatiquement.

> ✅ Chaque `git push` redéploie automatiquement.

---

## 💻 Développement local

```bash
npm install
npm run dev
# → http://localhost:5173
```

---

## 🔑 Comptes de démonstration

| Email | Mot de passe | Rôle |
|-------|-------------|------|
| `yann@axes-productivite.cg` | `demo123` | Administrateur |
| `marie@gmail.com` | `demo123` | Investisseur |

---

## 📁 Structure du projet

```
axes-minerals/
├── public/
│   └── favicon.svg
├── src/
│   ├── main.jsx       # Point d'entrée React
│   └── App.jsx        # Application complète
├── index.html
├── vite.config.js
├── package.json
└── .gitignore
```

---

## 🏗 Stack technique

- **React 18** + **Vite 5**
- Zéro dépendance UI externe (CSS-in-JS pur)
- Prix simulés avec volatilité réaliste par métal
- Auth locale (state React) — prêt pour intégration backend

---

## 🔧 Personnalisation

- **Taux de rendement** : modifier `returnRate` dans `METALS` (App.jsx ligne ~15)
- **Prix de base LME** : modifier `basePrice` par métal
- **Montant minimum** : modifier `minInvest` par métal
- **Devise** : remplacer `XAF` par `FCFA` ou autre dans `fmtXAF()`

---

*Axes Productivité · Brazzaville, République du Congo*
