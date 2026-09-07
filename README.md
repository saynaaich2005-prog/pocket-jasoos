# 🕵️‍♂️ Pocket Jasoos | Financial Investigator & Story Scroll

Pocket Jasoos is an interactive detective-themed personal finance and budget intelligence web application. Experience a cinematic 238-frame surveillance scroll story, decrypt evidence trails, track suspect expenses, and manage financial footprints with a sleek cyberpunk noir interface.

---

## ⚡ Quick Start

### Option 1: Double-Click on Windows
Double-click `start.bat` in the root folder. It will verify dependencies and launch the dev server automatically.

### Option 2: Command Line (Windows PowerShell / CMD / Terminal)

```bash
# 1. Install dependencies
npm install
# (Note for Windows PowerShell: if execution policy restricts npm, use npm.cmd install)

# 2. Run the development server
npm run dev

# 3. Open in your browser
http://localhost:3000
```

### Option 3: Production Build & Node Server

```bash
# Build the optimized multi-page production bundle
npm run build

# Start the Express server
npm start
```

---

## 🔑 Default Demo Agent Credentials

You can test authentication or jump straight in:

- **Email**: `agent@pocketjasoos.com`
- **Passcode**: `detective123`
- **Badge ID**: `PJ-7892`
- **Guest Mode**: Click **"Explore As Guest"** on the login page for instant access without entering credentials.

---

## 🚀 Key Features

1. **Cinematic 3D Scroll Canvas**:
   - 238 pre-rendered surveillance frames synchronized with GSAP ScrollTrigger.
   - Dynamic zoom, focal blur, and forensic HUD overlay.

2. **Unified Authentication & Field Agent Badges**:
   - Persistent client-side vault with in-memory fallback for private/sandboxed browsing.
   - Dynamic agent greeting, badge number generation, and secure session management.

3. **Financial Investigation Dashboard**:
   - **Mission Intro**: Forensic storyline and footprint decryption.
   - **Board (Dashboard)**: Real-time net balance, monthly burn rate, categorized suspects.
   - **Expenses**: Evidence log of transactions with crime scene suspect tagging.
   - **Intel (Analytics)**: Visual spend distribution charts with interactive tooltip inspection.
   - **Limits (Categories)**: Track budget envelopes and category suspect limits.

4. **Multi-Page Production Architecture**:
   - Bundles `index.html`, `login.html`, and `signup.html` via Vite Rollup multi-input.
   - Vercel ready with configured `vercel.json` rewrites.

---

## 🛠️ Tech Stack

- **Frontend**: HTML5, Vanilla JavaScript (ES Modules), Tailwind CSS v4
- **Animation**: GSAP 3.12, ScrollTrigger, HTML5 Canvas
- **Bundler & Server**: Vite 6, Node.js, Express
- **Deployment**: Vercel ready (`vercel.json`)