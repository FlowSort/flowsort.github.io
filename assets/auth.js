import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  signOut,
  setPersistence,
  browserLocalPersistence,
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyBeH4fm9pEHszy61udCItivYuztILMooKo",
  authDomain: "flowsort-3b6f7.firebaseapp.com",
  projectId: "flowsort-3b6f7",
  storageBucket: "flowsort-3b6f7.firebasestorage.app",
  messagingSenderId: "168059141026",
  appId: "1:168059141026:web:321443846637f586da90fb",
};

const COOKIE_NAME = "flowsort_session";
const COOKIE_MAX_AGE = 30 * 24 * 60 * 60;

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

setPersistence(auth, browserLocalPersistence).catch(console.error);

function escapeHtml(str) {
  return String(str ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function setSessionCookie(user) {
  const data = {
    displayName: user.displayName,
    photoURL: user.photoURL,
    email: user.email,
    uid: user.uid,
  };
  document.cookie = `${COOKIE_NAME}=${encodeURIComponent(JSON.stringify(data))}; path=/; max-age=${COOKIE_MAX_AGE}; SameSite=Lax`;
}

export function getSessionCookie() {
  const match = document.cookie.match(
    new RegExp(`(?:^|; )${COOKIE_NAME.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}=([^;]*)`),
  );
  if (!match) return null;
  try {
    return JSON.parse(decodeURIComponent(match[1]));
  } catch {
    return null;
  }
}

export function clearSessionCookie() {
  document.cookie = `${COOKIE_NAME}=; path=/; max-age=0`;
}

function labels(i18n) {
  const lang = document.documentElement.lang || "en";
  const t = i18n?.[lang] || i18n?.en || {};
  return {
    login: t["nav.login"] || "Log in",
    panel: t["nav.panel"] || "Panel",
    logout: t["nav.logout"] || "Log out",
  };
}

function bindUserMenu(container, opts) {
  const btn = container.querySelector("#user-menu-btn");
  const dropdown = container.querySelector("#user-dropdown");
  const logoutBtn = container.querySelector("#logout-btn");
  if (!btn || !dropdown) return;

  btn.onclick = (e) => {
    e.stopPropagation();
    dropdown.classList.toggle("show");
  };

  if (!bindUserMenu.docBound) {
    bindUserMenu.docBound = true;
    document.addEventListener("click", () => {
      document.querySelectorAll(".user-dropdown.show").forEach((el) => {
        el.classList.remove("show");
      });
    });
  }

  logoutBtn.onclick = async (e) => {
    e.preventDefault();
    dropdown.classList.remove("show");
    try {
      await signOut(auth);
    } catch (err) {
      console.error("Error al cerrar sesión:", err);
    }
    clearSessionCookie();
    window.location.href = opts.homeHref || "../";
  };
}

function renderUserMenu(container, user, opts) {
  const { panel, logout } = labels(opts.i18n);
  const name =
    user.displayName || user.email?.split("@")[0] || "User";
  const photo =
    user.photoURL ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=2a2d32&color=f1efe9&size=64`;

  container.innerHTML = `
    <div class="user-menu">
      <button class="user-menu-btn" id="user-menu-btn" type="button" aria-haspopup="true">
        <img class="user-avatar" src="${escapeHtml(photo)}" alt="" referrerpolicy="no-referrer" />
        <span class="user-name">${escapeHtml(name)}</span>
      </button>
      <div class="user-dropdown" id="user-dropdown">
        <a href="${opts.panelHref}" class="user-dropdown-item">${escapeHtml(panel)}</a>
        <button type="button" class="user-dropdown-item logout" id="logout-btn">${escapeHtml(logout)}</button>
      </div>
    </div>`;
  bindUserMenu(container, opts);
}

function renderLoginLink(container, loginHref, i18n) {
  const { login } = labels(i18n);
  container.innerHTML = `<a class="nav-login" href="${loginHref}">${escapeHtml(login)}</a>`;
}

export function initNavAuth(opts) {
  const container = document.getElementById("nav-auth");
  if (!container) return;

  const cached = getSessionCookie();
  if (cached) renderUserMenu(container, cached, opts);
  else renderLoginLink(container, opts.loginHref, opts.i18n);

  onAuthStateChanged(auth, (user) => {
    if (user) {
      setSessionCookie(user);
      renderUserMenu(container, user, opts);
    } else {
      clearSessionCookie();
      renderLoginLink(container, opts.loginHref, opts.i18n);
    }
  });
}

export function onAuthReady(callback) {
  onAuthStateChanged(auth, (user) => {
    if (user) setSessionCookie(user);
    else clearSessionCookie();
    callback(user);
  });
}

export async function logout() {
  await signOut(auth);
  clearSessionCookie();
}

export function requireAuth(opts = {}) {
  const loginHref = opts.loginHref || "../login/";
  const loader = document.getElementById("auth-loader");

  document.documentElement.classList.add("auth-pending");

  return new Promise((resolve) => {
    let settled = false;
    const finish = (user) => {
      if (settled) return;
      settled = true;
      document.documentElement.classList.remove("auth-pending");
      loader?.classList.add("hidden");
      resolve(user);
      opts.onAuthed?.(user);
    };

    onAuthStateChanged(auth, (user) => {
      if (user) {
        setSessionCookie(user);
        finish(user);
        return;
      }

      clearSessionCookie();
      if (settled) return;
      settled = true;

      const loginUrl = new URL(loginHref, window.location.href);
      loginUrl.searchParams.set(
        "redirect",
        opts.returnTo || window.location.pathname + window.location.search,
      );
      window.location.replace(loginUrl.toString());
    });
  });
}
