import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getFirestore,
  collection,
  getDocs,
  query,
  orderBy
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// ✅ PASTE YOUR firebaseConfig HERE (from Firebase console)
const firebaseConfig = {
  apiKey: "AIzaSyDm3s8rrISreQcf4GJrHgSiiQi_aTnAZIY",
  authDomain: "database-28865.firebaseapp.com",
  projectId: "database-28865",
  storageBucket: "database-28865.firebasestorage.app",
  messagingSenderId: "755443492467",
  appId: "1:755443492467:web:9482709a391b8de334ac06"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Utility: safely get element
function el(id) {
  return document.getElementById(id);
}

// Load Archive posts (read-only)
async function loadArchive() {
  const postsDiv = el("posts");
  if (!postsDiv) return;

  postsDiv.innerHTML = `<div class="card">Loading archive…</div>`;

  const q = query(collection(db, "posts"), orderBy("createdAt", "desc"));
  const snapshot = await getDocs(q);

  if (snapshot.empty) {
    postsDiv.innerHTML = `<div class="card">No files found.</div>`;
    return;
  }

  postsDiv.innerHTML = "";
  snapshot.forEach((doc) => {
    const d = doc.data();

    const title = d.title ?? "Untitled";
    const content = d.content ?? "";
    const status = (d.status ?? "active").toLowerCase();

    const card = document.createElement("div");
    card.className = "card";
    card.style.marginBottom = "14px";

    card.innerHTML = `
      <div style="display:flex;justify-content:space-between;gap:12px;align-items:flex-start;">
        <div style="font-size:18px;font-weight:600;">${escapeHtml(title)}</div>
        <div style="font-size:12px;color:var(--muted);border:1px solid var(--border);padding:6px 10px;border-radius:999px;">
          ${escapeHtml(status.toUpperCase())}
        </div>
      </div>
      <div style="margin-top:10px;color:var(--muted);white-space:pre-wrap;line-height:1.45;">
        ${escapeHtml(content)}
      </div>
    `;

    postsDiv.appendChild(card);
  });
}

// Load Dashboard stats
async function loadDashboardStats() {
  const totalEl = el("totalFiles");
  const activeEl = el("activeFiles");
  const redactedEl = el("redactedFiles");
  if (!totalEl || !activeEl || !redactedEl) return;

  const snapshot = await getDocs(collection(db, "posts"));

  let total = 0;
  let active = 0;
  let redacted = 0;

  snapshot.forEach((doc) => {
    total++;
    const s = (doc.data().status ?? "active").toLowerCase();
    if (s === "redacted") redacted++;
    else active++;
  });

  totalEl.textContent = String(total);
  activeEl.textContent = String(active);
  redactedEl.textContent = String(redacted);
}

// Disable submit button for now (because rules block writes)
function lockNewFile() {
  const btn = el("submitBtn");
  if (!btn) return;

  btn.disabled = true;
  btn.textContent = "Submit (login required)";
  btn.style.opacity = "0.6";
  btn.style.cursor = "not-allowed";
}

// Basic HTML escaping (prevents weird injection issues)
function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

// Run page-specific loaders
loadArchive();
loadDashboardStats();
lockNewFile();
