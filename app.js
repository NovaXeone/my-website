import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  query,
  where,
  updateDoc,
  doc
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

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
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

let currentUser = null;

const authBtn = document.getElementById("authBtn");

authBtn?.addEventListener("click", async () => {
  if (!currentUser) {
    await signInWithPopup(auth, provider);
  } else {
    await signOut(auth);
  }
});

onAuthStateChanged(auth, (user) => {
  currentUser = user;
  if (authBtn) authBtn.textContent = user ? "Sign out" : "Sign in";
  loadApprovedPosts();
  loadPendingPosts();
  loadDashboard();
});

async function submitPost() {
  if (!currentUser) return alert("Login required.");

  const title = document.getElementById("titleInput").value;
  const content = document.getElementById("contentInput").value;

  await addDoc(collection(db, "posts"), {
    title,
    content,
    authorId: currentUser.uid,
    authorName: currentUser.displayName,
    approvalState: "pending",
    createdAt: Date.now()
  });

  document.getElementById("submitStatus").innerText =
    "Submitted for approval.";
}

document.getElementById("submitBtn")?.addEventListener("click", submitPost);

async function loadApprovedPosts() {
  const postsDiv = document.getElementById("posts");
  const recentDiv = document.getElementById("recentPosts");
  if (!postsDiv && !recentDiv) return;

  const q = query(collection(db, "posts"), where("approvalState", "==", "approved"));
  const snap = await getDocs(q);

  if (postsDiv) postsDiv.innerHTML = "";
  if (recentDiv) recentDiv.innerHTML = "";

  snap.forEach((docSnap) => {
    const d = docSnap.data();
    const html = `<div class="card"><h3>${d.title}</h3><p>${d.content}</p></div>`;
    postsDiv && (postsDiv.innerHTML += html);
    recentDiv && (recentDiv.innerHTML += html);
  });
}

async function loadPendingPosts() {
  const div = document.getElementById("pendingPosts");
  if (!div || !currentUser) return;

  div.innerHTML = "";
  const q = query(collection(db, "posts"), where("approvalState", "==", "pending"));
  const snap = await getDocs(q);

  snap.forEach((docSnap) => {
    const d = docSnap.data();
    const html = `
      <div class="card">
        <h3>${d.title}</h3>
        <p>${d.content}</p>
        <button onclick="approvePost('${docSnap.id}')">Approve</button>
      </div>
    `;
    div.innerHTML += html;
  });
}

window.approvePost = async function(id) {
  await updateDoc(doc(db, "posts", id), {
    approvalState: "approved"
  });
  loadPendingPosts();
};

async function loadDashboard() {
  const totalEl = document.getElementById("totalFiles");
  const pendingEl = document.getElementById("pendingFiles");
  if (!totalEl) return;

  const snap = await getDocs(collection(db, "posts"));
  totalEl.textContent = snap.size;

  const pendingSnap = await getDocs(
    query(collection(db, "posts"), where("approvalState", "==", "pending"))
  );
  pendingEl.textContent = pendingSnap.size;
}
