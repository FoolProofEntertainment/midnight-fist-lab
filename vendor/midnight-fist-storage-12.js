(function () {
  const TOKEN_KEY = "midnight-fist-auth-token";
  const ACTIVE_FIGHTER_KEY = "midnight-fist-active-fighter-id";
  const DEFAULT_FIGHTER_PREFIX = "midnight-fist-default-fighter:";
  const LOCAL_ACCOUNTS_KEY = "midnight-fist-local-accounts";
  const LOCAL_FIGHTERS_KEY = "midnight-fist-local-fighters";
  const LOCAL_TOKEN_PREFIX = "local:";
  const LOCAL_ACCOUNT_LIMIT = 10;
  const listeners = new Set();

  function apiBase() {
    const config = window.MIDNIGHT_FIST_CONFIG || {};
    if (config.storageApi) return String(config.storageApi).replace(/\/$/, "");
    const origin = window.location.origin || "https://plot-pulse.com";
    return `${origin.replace(/\/$/, "")}/wp-json/midnight-fist/v1`;
  }

  function notify() {
    for (const listener of listeners) {
      try {
        listener(session);
      } catch (error) {
        console.warn("MidnightFistStorage listener error", error);
      }
    }
  }

  let session = {
    token: null,
    user: null,
    fighters: [],
    ready: false,
    available: null,
    localMode: false,
    lastError: null,
  };

  function getToken() {
    try {
      return window.localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  }

  function setToken(token) {
    try {
      if (token) window.localStorage.setItem(TOKEN_KEY, token);
      else window.localStorage.removeItem(TOKEN_KEY);
    } catch {
      // Private browsing may block storage.
    }
  }

  function getActiveFighterId() {
    try {
      return window.localStorage.getItem(ACTIVE_FIGHTER_KEY);
    } catch {
      return null;
    }
  }

  function setActiveFighterId(id) {
    try {
      if (id) window.localStorage.setItem(ACTIVE_FIGHTER_KEY, id);
      else window.localStorage.removeItem(ACTIVE_FIGHTER_KEY);
    } catch {
      // Ignore storage failures.
    }
  }

  function currentLocalUsername() {
    const token = session.token || getToken();
    if (isLocalToken(token)) return localUsernameFromToken(token);
    return session.user?.username || session.user?.id || "";
  }

  function defaultFighterKey(username = currentLocalUsername()) {
    return username ? `${DEFAULT_FIGHTER_PREFIX}${username}` : "";
  }

  function getDefaultFighter() {
    try {
      const key = defaultFighterKey();
      if (!key) return null;
      const raw = window.localStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  function setDefaultFighter(fighter) {
    const key = defaultFighterKey();
    if (!key) throw new Error("Not logged in.");
    try {
      window.localStorage.setItem(key, JSON.stringify(fighter));
    } catch {
      throw new Error("Default build could not be saved.");
    }
    notify();
    return fighter;
  }

  function isLocalToken(token) {
    return String(token || "").startsWith(LOCAL_TOKEN_PREFIX);
  }

  function readLocalAccounts() {
    try {
      const raw = window.localStorage.getItem(LOCAL_ACCOUNTS_KEY);
      const parsed = raw ? JSON.parse(raw) : {};
      return parsed && typeof parsed === "object" ? parsed : {};
    } catch {
      return {};
    }
  }

  function writeLocalAccounts(accounts) {
    try {
      window.localStorage.setItem(LOCAL_ACCOUNTS_KEY, JSON.stringify(accounts));
    } catch {
      // Ignore storage failures.
    }
  }

  function readLocalFighters() {
    try {
      const raw = window.localStorage.getItem(LOCAL_FIGHTERS_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  function writeLocalFighters(fighters) {
    try {
      window.localStorage.setItem(LOCAL_FIGHTERS_KEY, JSON.stringify(fighters));
    } catch {
      // Ignore storage failures.
    }
  }

  function enableLocalMode() {
    session.localMode = true;
    session.available = true;
  }

  function disableLocalMode() {
    session.localMode = false;
  }

  function localUsernameFromToken(token) {
    return String(token || "").slice(LOCAL_TOKEN_PREFIX.length);
  }

  function localUserRecord(username) {
    const accounts = readLocalAccounts();
    const record = accounts[username];
    if (!record) return null;
    return {
      id: `local:${username}`,
      username,
      displayName: record.displayName || username,
      email: record.email || "",
      role: record.role || "local",
    };
  }

  function localFightersForUser(username) {
    return readLocalFighters().filter((entry) => entry.owner === username);
  }

  async function api(path, options = {}) {
    const headers = {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    };
    const token = session.token || getToken();
    if (token && !isLocalToken(token)) headers.Authorization = `Bearer ${token}`;
    const response = await fetch(`${apiBase()}${path}`, {
      ...options,
      headers,
      credentials: "same-origin",
    });
    let data = {};
    try {
      data = await response.json();
    } catch {
      data = {};
    }
    if (!response.ok) {
      const message = data.message || response.statusText || "Request failed";
      const error = new Error(message);
      error.status = response.status;
      throw error;
    }
    return data;
  }

  async function checkAvailable() {
    try {
      const data = await api("/status", { method: "GET" });
      session.available = Boolean(data.ok);
      session.lastError = null;
      if (session.available) disableLocalMode();
      return session.available;
    } catch (error) {
      session.lastError = error && error.message ? error.message : "Storage API unavailable";
      console.error("Midnight Fist storage API unavailable:", session.lastError, apiBase());
      enableLocalMode();
      return false;
    }
  }

  async function restoreLocalSession(token) {
    const username = localUsernameFromToken(token);
    const user = localUserRecord(username);
    if (!user) {
      setToken(null);
      session.token = null;
      session.user = null;
      session.fighters = [];
      session.ready = true;
      notify();
      return null;
    }
    session.token = token;
    session.user = user;
    session.fighters = localFightersForUser(username);
    session.ready = true;
    enableLocalMode();
    notify();
    return session;
  }

  async function restoreSession() {
    session.ready = false;
    const token = getToken();
    if (!token) {
      session.token = null;
      session.user = null;
      session.fighters = [];
      session.ready = true;
      notify();
      return null;
    }
    if (isLocalToken(token)) {
      return restoreLocalSession(token);
    }
    session.token = token;
    try {
      const data = await api("/session");
      session.user = data.user || null;
      disableLocalMode();
      session.available = true;
      await refreshFighters();
      session.ready = true;
      notify();
      return session;
    } catch {
      return restoreLocalSession(token);
    }
  }

  async function loginLocal(username, password) {
    const normalized = String(username || "").trim().toLowerCase();
    const accounts = readLocalAccounts();
    const record = accounts[normalized];
    if (!record || record.password !== password) {
      throw new Error("Invalid username or password.");
    }
    const token = `${LOCAL_TOKEN_PREFIX}${normalized}`;
    session.token = token;
    session.user = localUserRecord(normalized);
    session.fighters = localFightersForUser(normalized);
    setToken(token);
    enableLocalMode();
    session.ready = true;
    notify();
    return session;
  }

  function normalizeAccessCode(code) {
    return String(code || "").trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
  }

  function generateAccessCode(accounts) {
    const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    for (let attempts = 0; attempts < 80; attempts += 1) {
      let code = "MF";
      for (let i = 0; i < 8; i += 1) code += alphabet[Math.floor(Math.random() * alphabet.length)];
      if (!accounts[code.toLowerCase()]) return code;
    }
    throw new Error("Could not generate a unique access code.");
  }

  async function claimAccessCode() {
    const accounts = readLocalAccounts();
    const accountCount = Object.keys(accounts).length;
    if (accountCount >= LOCAL_ACCOUNT_LIMIT) {
      throw new Error("All 10 terminal access codes have been claimed on this device.");
    }
    const code = generateAccessCode(accounts);
    const username = code.toLowerCase();
    accounts[username] = {
      username,
      displayName: `Code ${code}`,
      email: "",
      password: code,
      accessCode: code,
      role: "code-user",
      createdAt: new Date().toISOString(),
    };
    writeLocalAccounts(accounts);
    return loginWithCode(code);
  }

  async function loginWithCode(code) {
    const normalized = normalizeAccessCode(code);
    if (!normalized) throw new Error("Enter an access code.");
    return loginLocal(normalized.toLowerCase(), normalized);
  }

  async function registerLocal(username, email, password) {
    const normalized = String(username || "").trim().toLowerCase();
    const accounts = readLocalAccounts();
    if (accounts[normalized]) {
      throw new Error("Username already registered on this device.");
    }
    accounts[normalized] = {
      username: normalized,
      displayName: username,
      email,
      password,
      role: "local",
      createdAt: new Date().toISOString(),
    };
    writeLocalAccounts(accounts);
    const token = `${LOCAL_TOKEN_PREFIX}${normalized}`;
    session.token = token;
    session.user = localUserRecord(normalized);
    session.fighters = [];
    setToken(token);
    enableLocalMode();
    session.ready = true;
    notify();
    return session;
  }

  async function login(username, password) {
    if (session.localMode || session.available === null) {
      await checkAvailable();
    }
    if (session.localMode) {
      return loginLocal(username, password);
    }
    try {
      const data = await api("/login", {
        method: "POST",
        body: JSON.stringify({ username, password }),
      });
      session.token = data.token;
      session.user = data.user || null;
      setToken(data.token);
      disableLocalMode();
      session.available = true;
      await refreshFighters();
      session.ready = true;
      notify();
      return session;
    } catch (error) {
      enableLocalMode();
      return loginLocal(username, password);
    }
  }

  async function register(username, email, password) {
    if (session.localMode || session.available === null) {
      await checkAvailable();
    }
    if (session.localMode) {
      return registerLocal(username, email, password);
    }
    try {
      const data = await api("/register", {
        method: "POST",
        body: JSON.stringify({ username, email, password }),
      });
      session.token = data.token;
      session.user = {
        ...(data.user || null),
        confirmationEmailSent: data.confirmationEmailSent ?? data.user?.confirmationEmailSent ?? null,
      };
      setToken(data.token);
      disableLocalMode();
      session.available = true;
      await refreshFighters();
      session.ready = true;
      notify();
      return session;
    } catch (error) {
      enableLocalMode();
      return registerLocal(username, email, password);
    }
  }

  async function logout() {
    if (!session.localMode && (session.token || getToken())) {
      try {
        await api("/logout", { method: "POST", body: "{}" });
      } catch {
        // Clear local session even if revoke fails.
      }
    }
    setToken(null);
    setActiveFighterId(null);
    session.token = null;
    session.user = null;
    session.fighters = [];
    session.ready = true;
    notify();
  }

  async function refreshFighters() {
    const token = session.token || getToken();
    if (!token) {
      session.fighters = [];
      return [];
    }
    if (isLocalToken(token)) {
      session.fighters = localFightersForUser(localUsernameFromToken(token));
      return session.fighters;
    }
    const data = await api("/fighters");
    session.fighters = Array.isArray(data.fighters) ? data.fighters : [];
    return session.fighters;
  }

  async function saveFighterLocal(fighter, id) {
    const username = localUsernameFromToken(session.token || getToken());
    if (!username) throw new Error("Not logged in.");
    const fighters = readLocalFighters().filter((entry) => entry.owner !== username);
    const owned = localFightersForUser(username);
    const now = new Date().toISOString();
    let saved = null;
    if (id) {
      const existing = owned.find((entry) => entry.id === id);
      if (!existing) throw new Error("Fighter not found.");
      saved = { ...existing, fighter, updatedAt: now };
      fighters.push(...owned.filter((entry) => entry.id !== id), saved);
    } else {
      if (owned.length >= 24) throw new Error("Fighter archive full. Delete one to save another.");
      saved = {
        id: `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        owner: username,
        fighter,
        createdAt: now,
        updatedAt: now,
      };
      fighters.push(...owned, saved);
    }
    writeLocalFighters(fighters);
    session.fighters = fighters.filter((entry) => entry.owner === username);
    if (saved?.id) setActiveFighterId(saved.id);
    notify();
    return saved;
  }

  async function saveFighter(fighter, id) {
    if (session.localMode || isLocalToken(session.token || getToken())) {
      return saveFighterLocal(fighter, id);
    }
    const payload = { fighter };
    if (id) payload.id = id;
    const data = await api("/fighters", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    await refreshFighters();
    if (data.fighter?.id) setActiveFighterId(data.fighter.id);
    notify();
    return data.fighter;
  }

  async function deleteFighterLocal(id) {
    const username = localUsernameFromToken(session.token || getToken());
    if (!username) throw new Error("Not logged in.");
    const fighters = readLocalFighters().filter((entry) => !(entry.owner === username && entry.id === id));
    writeLocalFighters(fighters);
    if (getActiveFighterId() === id) setActiveFighterId(null);
    session.fighters = fighters.filter((entry) => entry.owner === username);
    notify();
  }

  async function deleteFighter(id) {
    if (session.localMode || isLocalToken(session.token || getToken())) {
      return deleteFighterLocal(id);
    }
    await api(`/fighters/${encodeURIComponent(id)}`, { method: "DELETE" });
    if (getActiveFighterId() === id) setActiveFighterId(null);
    await refreshFighters();
    notify();
  }

  function clearAllLocalData() {
    try {
      const keys = [];
      for (let index = 0; index < window.localStorage.length; index += 1) {
        const key = window.localStorage.key(index);
        if (key && key.startsWith("midnight-fist")) keys.push(key);
      }
      keys.forEach((key) => window.localStorage.removeItem(key));
    } catch {
      throw new Error("Saved data could not be cleared. Browser storage may be blocked.");
    }
    session = {
      token: null,
      user: null,
      fighters: [],
      ready: true,
      available: session.available,
      localMode: session.localMode,
    };
    notify();
  }

  window.MidnightFistStorage = {
    apiBase,
    checkAvailable,
    restoreSession,
    login,
    register,
    logout,
    refreshFighters,
    saveFighter,
    deleteFighter,
    claimAccessCode,
    loginWithCode,
    getDefaultFighter,
    setDefaultFighter,
    clearAllLocalData,
    getSession() {
      return session;
    },
    isLoggedIn() {
      return Boolean(session.user && (session.token || getToken()));
    },
    getActiveFighterId,
    setActiveFighterId,
    onChange(callback) {
      listeners.add(callback);
      return () => listeners.delete(callback);
    },
  };

  checkAvailable().finally(() => restoreSession());
})();
