const soonLinks = document.querySelectorAll("[data-soon]");
const openPrepLinks = document.querySelectorAll("[data-open-prep]");
const spaceCards = document.querySelectorAll("[data-space-card]");
const prepRoom = document.querySelector("#prep-room");
const closePrepButton = document.querySelector("#close-prep");
const themeToggleButtons = document.querySelectorAll("[data-theme-toggle]");
const toast = document.querySelector(".toast");
const categoryList = document.querySelector("#category-list");
const statusChips = document.querySelectorAll("[data-status]");
const sortButtons = document.querySelectorAll("[data-sort]");
const searchInput = document.querySelector("#reagent-search");
const searchButton = document.querySelector("#search-button");
const resetFiltersButton = document.querySelector("#reset-filters");
const tableBody = document.querySelector("#reagent-table-body");
const emptyState = document.querySelector("#empty-state");
const visibleCount = document.querySelector("#visible-count");
const totalReagents = document.querySelector("#total-reagents");
const toxicReagents = document.querySelector("#toxic-reagents");
const lowReagents = document.querySelector("#low-reagents");
const authShells = document.querySelectorAll("[data-auth-shell]");
const authOpenButtons = document.querySelectorAll("[data-auth-open]");
const authModal = document.querySelector("[data-auth-modal]");
const authForm = document.querySelector("[data-auth-form]");
const authTitle = document.querySelector("[data-auth-title]");
const authSubmit = document.querySelector("[data-auth-submit]");
const authSwitch = document.querySelector("[data-auth-switch]");
const authMessage = document.querySelector("[data-auth-message]");
const authCloseButtons = document.querySelectorAll("[data-auth-close]");
const signupOnlyFields = document.querySelectorAll("[data-signup-only]");
const userMenus = document.querySelectorAll("[data-user-menu]");
const userNames = document.querySelectorAll("[data-user-name]");
const userRoleLabels = document.querySelectorAll("[data-user-role]");
const userAvatars = document.querySelectorAll("[data-user-avatar]");
const signOutButtons = document.querySelectorAll("[data-sign-out]");
const adminPanels = document.querySelectorAll("[data-admin-panel]");
const adminTableColumns = document.querySelectorAll("[data-admin-table-column]");
const accountList = document.querySelector("[data-account-list]");
const accountCount = document.querySelector("[data-account-count]");

const baseReagents = Array.isArray(window.REAGENTS) ? window.REAGENTS : [];
const SUPABASE_URL = "https://exgbktkirqnqyjvbwupp.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV4Z2JrdGtpcnFucXlqdmJ3dXBwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg4NTM2OTksImV4cCI6MjA5NDQyOTY5OX0._Oposq5zl8n0O96qk9I1pgUPi6XeNEuMq_Hz8Bgh5kg";
const supabaseClient = window.supabase && SUPABASE_URL && SUPABASE_ANON_KEY
  ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;
const AUTH_USERS_KEY = "science-lab-users";
const AUTH_SESSION_KEY = "science-lab-session";
const LEGACY_GOOGLE_AUTH_KEY = "science-lab-google-user";
const REAGENT_OVERRIDES_KEY = "science-lab-reagent-overrides";
const USER_ROLES = {
  admin: "관리자",
  member: "일반",
};
const filterState = {
  category: "all",
  status: "all",
  sort: "id",
  query: "",
};
let reagents = [];
let toastTimer;
let currentUser = null;
let authMode = "login";

try {
  if (!history.state) {
    history.replaceState({ view: "home" }, "", window.location.href.split("#")[0]);
  }
} catch {
  // History updates can be restricted in some local-file contexts.
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("is-visible");

  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast.classList.remove("is-visible");
  }, 2200);
}

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function normalizeRole(role) {
  return role === "admin" ? "admin" : "member";
}

function getRoleLabel(role) {
  return USER_ROLES[normalizeRole(role)];
}

function getUserKey(user) {
  return user.id || normalizeEmail(user.email);
}

function isAdmin() {
  return currentUser?.role === "admin";
}

function normalizeUsers(users) {
  let changed = false;
  const normalizedUsers = users
    .filter((user) => user && user.email)
    .map((user, index) => {
      const normalized = { ...user };

      if (!normalized.id) {
        normalized.id = `user-${index}-${normalizeEmail(normalized.email).replace(/[^a-z0-9]/g, "")}`;
        changed = true;
      }

      const role = normalizeRole(normalized.role);
      if (normalized.role !== role) {
        normalized.role = role;
        changed = true;
      }

      return normalized;
    });

  if (normalizedUsers.length > 0 && !normalizedUsers.some((user) => user.role === "admin")) {
    normalizedUsers[0].role = "admin";
    changed = true;
  }

  return { users: normalizedUsers, changed };
}

function getStoredUsers() {
  try {
    const users = JSON.parse(localStorage.getItem(AUTH_USERS_KEY) || "[]");
    const { users: normalizedUsers, changed } = normalizeUsers(Array.isArray(users) ? users : []);

    if (changed) {
      storeUsers(normalizedUsers);
    }

    return normalizedUsers;
  } catch {
    return [];
  }
}

function storeUsers(users) {
  try {
    localStorage.setItem(AUTH_USERS_KEY, JSON.stringify(users));
  } catch {
    // Local files may block storage in some browsers.
  }
}

function getSessionEmail() {
  try {
    return normalizeEmail(localStorage.getItem(AUTH_SESSION_KEY));
  } catch {
    return "";
  }
}

function storeSession(email) {
  try {
    localStorage.setItem(AUTH_SESSION_KEY, normalizeEmail(email));
  } catch {
    // Local files may block storage in some browsers.
  }
}

function clearSession() {
  try {
    localStorage.removeItem(AUTH_SESSION_KEY);
    localStorage.removeItem(LEGACY_GOOGLE_AUTH_KEY);
  } catch {
    // Local files may block storage in some browsers.
  }
}

function getStoredReagentOverrides() {
  try {
    const overrides = JSON.parse(localStorage.getItem(REAGENT_OVERRIDES_KEY) || "{}");
    return overrides && typeof overrides === "object" ? overrides : {};
  } catch {
    return {};
  }
}

function storeReagentOverrides(overrides) {
  try {
    localStorage.setItem(REAGENT_OVERRIDES_KEY, JSON.stringify(overrides));
  } catch {
    // Local files may block storage in some browsers.
  }
}

function refreshReagents() {
  const overrides = getStoredReagentOverrides();
  reagents = baseReagents.map((reagent) => ({
    ...reagent,
    ...(overrides[String(reagent.id)] || {}),
  }));
}

function createSalt() {
  const bytes = new Uint8Array(16);

  if (window.crypto?.getRandomValues) {
    window.crypto.getRandomValues(bytes);
  } else {
    bytes.forEach((_, index) => {
      bytes[index] = Math.floor(Math.random() * 256);
    });
  }

  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function hashPassword(password, salt) {
  const source = `${salt}:${password}`;

  if (window.crypto?.subtle) {
    const data = new TextEncoder().encode(source);
    const digest = await window.crypto.subtle.digest("SHA-256", data);
    return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
  }

  return btoa(unescape(encodeURIComponent(source)));
}

function getPublicUser(user) {
  return {
    name: user.name,
    email: user.email,
    role: normalizeRole(user.role),
    signedInAt: Date.now(),
  };
}

function buildUserFromSupabaseUser(supabaseUser) {
  const metadata = supabaseUser.user_metadata || {};
  const email = normalizeEmail(supabaseUser.email || "");
  const role = normalizeRole(metadata.role || getLocalUserRole(email));
  return {
    name: metadata.name || getLocalUserName(email) || email,
    email,
    role,
    signedInAt: Date.now(),
  };
}

function getLocalUserRole(email) {
  const user = findUserByEmail(email);
  return user ? user.role : "member";
}

function getLocalUserName(email) {
  const user = findUserByEmail(email);
  return user?.name || "";
}

function findUserByEmail(email) {
  const normalizedEmail = normalizeEmail(email);
  return getStoredUsers().find((user) => normalizeEmail(user.email) === normalizedEmail) || null;
}

function updateAdminVisibility() {
  const canManage = isAdmin();

  document.body.classList.toggle("is-admin", canManage);

  adminPanels.forEach((panel) => {
    panel.hidden = !canManage;
  });

  adminTableColumns.forEach((column) => {
    column.hidden = !canManage;
  });
}

function renderAccountList() {
  if (!accountList) {
    return;
  }

  if (!isAdmin()) {
    accountList.innerHTML = "";
    if (accountCount) {
      accountCount.textContent = "0";
    }
    return;
  }

  const users = getStoredUsers();
  const adminCount = users.filter((user) => user.role === "admin").length;
  const currentEmail = normalizeEmail(currentUser?.email);

  if (accountCount) {
    accountCount.textContent = users.length.toLocaleString("ko-KR");
  }

  accountList.innerHTML = users
    .map((user) => {
      const userKey = escapeHtml(getUserKey(user));
      const isCurrentUser = normalizeEmail(user.email) === currentEmail;
      const cannotDelete = isCurrentUser || (user.role === "admin" && adminCount <= 1);

      return `
        <div class="account-row">
          <div class="account-user">
            <span class="user-avatar" aria-hidden="true">${escapeHtml((user.name || user.email).trim().charAt(0).toUpperCase())}</span>
            <span>
              <strong>${escapeHtml(user.name || user.email)}</strong>
              <small>${escapeHtml(user.email)}${isCurrentUser ? " · 현재 계정" : ""}</small>
            </span>
          </div>
          <select data-account-role="${userKey}" aria-label="${escapeHtml(user.name || user.email)} 권한">
            <option value="admin" ${user.role === "admin" ? "selected" : ""}>관리자</option>
            <option value="member" ${user.role === "member" ? "selected" : ""}>일반</option>
          </select>
          <button type="button" data-account-delete="${userKey}" ${cannotDelete ? "disabled" : ""}>삭제</button>
        </div>
      `;
    })
    .join("");
}

function updateUserRole(userKey, nextRole) {
  if (!isAdmin()) {
    showToast("관리자만 계정 권한을 수정할 수 있습니다.");
    return;
  }

  const users = getStoredUsers();
  const index = users.findIndex((user) => getUserKey(user) === userKey);

  if (index < 0) {
    showToast("계정을 찾지 못했습니다.");
    renderAccountList();
    return;
  }

  const role = normalizeRole(nextRole);
  const adminCount = users.filter((user) => user.role === "admin").length;

  if (users[index].role === "admin" && role !== "admin" && adminCount <= 1) {
    showToast("관리자는 최소 1명 필요합니다.");
    renderAccountList();
    return;
  }

  users[index].role = role;
  storeUsers(users);

  if (normalizeEmail(users[index].email) === normalizeEmail(currentUser.email)) {
    currentUser = getPublicUser(users[index]);
    storeSession(currentUser.email);
  }

  updateAuthUi();
  renderDashboard();
  showToast(`${users[index].name} 계정 권한을 ${getRoleLabel(role)}로 변경했습니다.`);
}

function deleteUser(userKey) {
  if (!isAdmin()) {
    showToast("관리자만 계정을 삭제할 수 있습니다.");
    return;
  }

  const users = getStoredUsers();
  const target = users.find((user) => getUserKey(user) === userKey);

  if (!target) {
    showToast("계정을 찾지 못했습니다.");
    renderAccountList();
    return;
  }

  if (normalizeEmail(target.email) === normalizeEmail(currentUser.email)) {
    showToast("현재 로그인한 계정은 삭제할 수 없습니다.");
    return;
  }

  if (target.role === "admin" && users.filter((user) => user.role === "admin").length <= 1) {
    showToast("관리자는 최소 1명 필요합니다.");
    return;
  }

  storeUsers(users.filter((user) => getUserKey(user) !== userKey));
  renderAccountList();
  showToast(`${target.name} 계정을 삭제했습니다.`);
}

function updateAuthUi() {
  const isSignedIn = Boolean(currentUser);

  authOpenButtons.forEach((button) => {
    button.hidden = isSignedIn;
  });

  authShells.forEach((shell) => {
    shell.classList.toggle("is-signed-in", isSignedIn);
  });

  userMenus.forEach((menu) => {
    menu.hidden = !isSignedIn;
  });

  if (!isSignedIn) {
    userNames.forEach((name) => {
      name.textContent = "";
    });

    userAvatars.forEach((avatar) => {
      avatar.hidden = true;
      avatar.textContent = "";
    });

    userRoleLabels.forEach((label) => {
      label.textContent = "";
    });

    updateAdminVisibility();
    renderAccountList();
    return;
  }

  userNames.forEach((name) => {
    name.textContent = currentUser.name || currentUser.email;
  });

  userRoleLabels.forEach((label) => {
    label.textContent = getRoleLabel(currentUser.role);
  });

  userAvatars.forEach((avatar) => {
    const label = currentUser.name || currentUser.email || "U";
    avatar.hidden = false;
    avatar.textContent = label.trim().charAt(0).toUpperCase();
  });

  updateAdminVisibility();
  renderAccountList();
}

function setCurrentUser(user, options = {}) {
  currentUser = user;

  if (options.persist !== false) {
    storeSession(user.email);
  }

  updateAuthUi();
  renderDashboard();
}

function setAuthMode(mode) {
  authMode = mode;
  const isSignup = mode === "signup";

  authTitle.textContent = isSignup ? "회원가입" : "로그인";
  authSubmit.textContent = isSignup ? "계정 만들기" : "로그인";
  authSwitch.textContent = isSignup ? "로그인으로 전환" : "회원가입으로 전환";

  signupOnlyFields.forEach((field) => {
    field.hidden = !isSignup;
  });

  const nameInput = authForm.elements.namedItem("name");
  const confirmInput = authForm.elements.namedItem("confirmPassword");
  const passwordInput = authForm.elements.namedItem("password");

  nameInput.required = isSignup;
  confirmInput.required = isSignup;
  passwordInput.autocomplete = isSignup ? "new-password" : "current-password";

  authMessage.textContent = "";
}

function openAuthModal(mode = "login") {
  setAuthMode(mode);
  authForm.reset();
  authModal.hidden = false;
  document.body.classList.add("is-auth-open");

  requestAnimationFrame(() => {
    authForm.elements.namedItem("email").focus();
  });
}

function closeAuthModal() {
  authModal.hidden = true;
  document.body.classList.remove("is-auth-open");
  authMessage.textContent = "";
}

function setAuthMessage(message) {
  authMessage.textContent = message;
}

async function handleSignup(formData) {
  const name = String(formData.get("name") || "").trim();
  const email = normalizeEmail(formData.get("email"));
  const password = String(formData.get("password") || "");
  const confirmPassword = String(formData.get("confirmPassword") || "");

  if (!name || !email || !password || !confirmPassword) {
    setAuthMessage("모든 항목을 입력하세요.");
    return;
  }

  if (!isValidEmail(email)) {
    setAuthMessage("이메일 형식이 올바르지 않습니다.");
    return;
  }

  if (password.length < 6) {
    setAuthMessage("비밀번호는 6자 이상이어야 합니다.");
    return;
  }

  if (password !== confirmPassword) {
    setAuthMessage("비밀번호가 서로 다릅니다.");
    return;
  }

  if (!supabaseClient) {
    setAuthMessage("Supabase 설정이 필요합니다. SUPABASE_URL과 SUPABASE_ANON_KEY를 입력하세요.");
    return;
  }

  const users = getStoredUsers();
  const role = users.some((user) => user.role === "admin") ? "member" : "admin";
  const { data, error } = await supabaseClient.auth.signUp(
    { email, password },
    { data: { name, role } }
  );

  if (error) {
    setAuthMessage(error.message || "회원가입 중 오류가 발생했습니다.");
    return;
  }

  const user = {
    id: `user-${Date.now()}`,
    name,
    email,
    role,
    createdAt: new Date().toISOString(),
  };

  users.push(user);
  storeUsers(users);

  if (data?.user) {
    setCurrentUser(getPublicUser(user));
    showToast(role === "admin" ? `${name}님, 관리자 계정이 생성되었습니다.` : `${name}님, 회원가입이 완료되었습니다.`);
    closeAuthModal();
    return;
  }

  closeAuthModal();
  showToast("회원가입 요청이 접수되었습니다. 이메일 인증을 완료해주세요.");
}

async function handleLogin(formData) {
  const email = normalizeEmail(formData.get("email"));
  const password = String(formData.get("password") || "");

  if (!isValidEmail(email)) {
    setAuthMessage("이메일 형식이 올바르지 않습니다.");
    return;
  }

  if (!supabaseClient) {
    setAuthMessage("Supabase 설정이 필요합니다. SUPABASE_URL과 SUPABASE_ANON_KEY를 입력하세요.");
    return;
  }

  const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });

  if (error) {
    setAuthMessage(error.message || "로그인 중 오류가 발생했습니다.");
    return;
  }

  if (!data?.user) {
    setAuthMessage("로그인에 실패했습니다. 입력 정보를 확인해주세요.");
    return;
  }

  const publicUser = buildUserFromSupabaseUser(data.user);
  setCurrentUser(publicUser);
  closeAuthModal();
  showToast(`${publicUser.name}님, 로그인되었습니다.`);
}

async function handleAuthSubmit() {
  const formData = new FormData(authForm);
  authSubmit.disabled = true;
  setAuthMessage("");

  try {
    if (authMode === "signup") {
      await handleSignup(formData);
    } else {
      await handleLogin(formData);
    }
  } finally {
    authSubmit.disabled = false;
  }
}

async function signOut() {
  if (supabaseClient) {
    try {
      await supabaseClient.auth.signOut();
    } catch {
      // Supabase 로그아웃이 실패해도 로컬 세션은 정리합니다.
    }
  }

  currentUser = null;
  clearSession();
  updateAuthUi();
  renderDashboard();
  showToast("로그아웃되었습니다.");
}

async function initLocalAuth() {
  if (!supabaseClient) {
    const sessionEmail = getSessionEmail();
    const user = sessionEmail ? findUserByEmail(sessionEmail) : null;

    if (user) {
      setCurrentUser(getPublicUser(user), { persist: false });
    } else {
      clearSession();
      updateAuthUi();
    }
    return;
  }

  try {
    const { data } = await supabaseClient.auth.getSession();
    const sessionUser = data?.session?.user;

    if (sessionUser) {
      setCurrentUser(buildUserFromSupabaseUser(sessionUser), { persist: false });
      return;
    }
  } catch {
    // Supabase 세션 읽기 실패 시 로컬 값으로 복구하지 않습니다.
  }

  clearSession();
  updateAuthUi();
}

function formatNumber(value) {
  if (value === "" || value === null || Number.isNaN(Number(value))) {
    return "-";
  }

  return Number(value).toLocaleString("ko-KR", {
    maximumFractionDigits: 2,
  });
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function getRemainingRatio(reagent) {
  const initial = Number(reagent.initialAmount);
  const remaining = Number(reagent.remainingAmount);

  if (!Number.isFinite(initial) || initial <= 0 || !Number.isFinite(remaining)) {
    return 1;
  }

  return remaining / initial;
}

function isLowStock(reagent) {
  const remaining = Number(reagent.remainingAmount);
  return getRemainingRatio(reagent) <= 0.2 || (Number.isFinite(remaining) && remaining > 0 && remaining <= 50);
}

function getStatusLabel(reagent) {
  if (reagent.toxic) {
    return "유독";
  }

  if (isLowStock(reagent)) {
    return "부족";
  }

  return "보통";
}

function getStatusClass(reagent) {
  if (reagent.toxic) {
    return "toxic";
  }

  if (isLowStock(reagent)) {
    return "low";
  }

  return "";
}

function saveReagentRemaining(reagentId) {
  if (!isAdmin()) {
    showToast("관리자만 시약 잔량을 수정할 수 있습니다.");
    return;
  }

  const input = tableBody.querySelector(`[data-stock-input="${reagentId}"]`);
  const reagent = reagents.find((item) => String(item.id) === String(reagentId));

  if (!input || !reagent) {
    showToast("수정할 시약을 찾지 못했습니다.");
    return;
  }

  const remainingAmount = Number(input.value);

  if (!Number.isFinite(remainingAmount) || remainingAmount < 0) {
    showToast("잔량은 0 이상의 숫자로 입력하세요.");
    input.focus();
    return;
  }

  const initialAmount = Number(reagent.initialAmount);
  const usedAmount = Number.isFinite(initialAmount) ? Math.max(initialAmount - remainingAmount, 0) : reagent.usedAmount;
  const overrides = getStoredReagentOverrides();

  overrides[String(reagent.id)] = {
    remainingAmount,
    usedAmount,
    updatedAt: new Date().toISOString(),
    updatedBy: currentUser.email,
  };

  storeReagentOverrides(overrides);
  refreshReagents();
  renderDashboard();
  showToast(`${reagent.name} 잔량을 ${formatNumber(remainingAmount)}로 저장했습니다.`);
}

function setTheme(theme) {
  const isDark = theme === "dark";
  document.body.classList.toggle("site-theme-dark", isDark);
  document.body.classList.toggle("prep-theme-light", !isDark);

  themeToggleButtons.forEach((button) => {
    button.setAttribute("aria-pressed", String(isDark));
    button.setAttribute("aria-label", isDark ? "라이트 모드로 전환" : "다크 모드로 전환");
  });

  try {
    localStorage.setItem("science-lab-theme", isDark ? "dark" : "light");
  } catch {
    // Local files may block storage in some browsers.
  }
}

function openPrepRoom(options = {}) {
  const { pushHistory = true } = options;
  prepRoom.hidden = false;
  document.body.classList.add("is-prep-open");
  window.scrollTo({ top: 0, behavior: "auto" });
  renderDashboard();

  if (pushHistory) {
    try {
      if (history.state?.view !== "prep") {
        history.pushState({ view: "prep" }, "", "#prep-room");
      }
    } catch {
      // The visual transition still works if history is unavailable.
    }
  }
}

function closePrepRoom(options = {}) {
  const { fromHistory = false } = options;

  if (!fromHistory && document.body.classList.contains("is-prep-open") && history.state?.view === "prep") {
    history.back();
    return;
  }

  document.body.classList.remove("is-prep-open");
  prepRoom.hidden = true;
  window.scrollTo({ top: 0, behavior: "auto" });
}

function selectSpace(card) {
  spaceCards.forEach((item) => item.classList.remove("is-selected"));
  card.classList.add("is-selected");

  if (card.dataset.room === "prep") {
    openPrepRoom();
    return;
  }

  const title = card.querySelector("h3").textContent.trim();
  showToast(`${title} 세부 화면은 다음 단계에서 만들면 됩니다.`);
}

function buildCategoryFilters() {
  const counts = reagents.reduce((result, reagent) => {
    result.set(reagent.category, (result.get(reagent.category) || 0) + 1);
    return result;
  }, new Map());

  const categories = [...counts.entries()].sort((a, b) => a[0].localeCompare(b[0], "ko-KR"));
  categoryList.innerHTML = "";

  const allButton = document.createElement("button");
  allButton.type = "button";
  allButton.className = "category-chip is-active";
  allButton.dataset.category = "all";
  allButton.innerHTML = `전체 <span>${reagents.length}</span>`;
  categoryList.append(allButton);

  categories.forEach(([category, count]) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "category-chip";
    button.dataset.category = category;
    button.innerHTML = `${escapeHtml(category)} <span>${count}</span>`;
    categoryList.append(button);
  });
}

function getFilteredReagents() {
  const query = filterState.query.trim().toLowerCase();

  return reagents
    .filter((reagent) => {
      if (filterState.category !== "all" && reagent.category !== filterState.category) {
        return false;
      }

      if (filterState.status === "toxic" && !reagent.toxic) {
        return false;
      }

      if (filterState.status === "low" && !isLowStock(reagent)) {
        return false;
      }

      if (!query) {
        return true;
      }

      const searchable = [
        reagent.name,
        reagent.category,
        reagent.iupac,
        reagent.commonName,
        reagent.formula,
        reagent.structuralFormula,
      ].join(" ").toLowerCase();

      return searchable.includes(query);
    })
    .sort((a, b) => {
      if (filterState.sort === "category") {
        return String(a.category).localeCompare(String(b.category), "ko-KR") ||
          String(a.name).localeCompare(String(b.name), "ko-KR");
      }

      if (filterState.sort === "name") {
        return String(a.name).localeCompare(String(b.name), "ko-KR");
      }

      if (filterState.sort === "remaining") {
        return Number(b.remainingAmount || 0) - Number(a.remainingAmount || 0);
      }

      return a.id - b.id;
    });
}

function renderTable() {
  const rows = getFilteredReagents();
  const canEditStock = isAdmin();

  adminTableColumns.forEach((column) => {
    column.hidden = !canEditStock;
  });

  visibleCount.textContent = rows.length.toLocaleString("ko-KR");
  emptyState.hidden = rows.length > 0;

  tableBody.innerHTML = rows
    .map((reagent) => {
      const statusClass = getStatusClass(reagent);
      const formula = reagent.formula || reagent.structuralFormula || "-";
      const subtitle = reagent.iupac || reagent.commonName || "IUPAC 정보 없음";
      const remainingCell = canEditStock
        ? `<input class="stock-input" type="text" inputmode="decimal" value="${escapeHtml(reagent.remainingAmount)}" data-stock-input="${reagent.id}" aria-label="${escapeHtml(reagent.name)} 현재 잔량">`
        : formatNumber(reagent.remainingAmount);
      const adminCell = canEditStock
        ? `<td><button class="stock-save" type="button" data-stock-save="${reagent.id}">저장</button></td>`
        : "";

      return `
        <tr>
          <td>${String(reagent.id).padStart(3, "0")}</td>
          <td><span class="category-badge">${escapeHtml(reagent.category)}</span></td>
          <td>
            <span class="reagent-name">
              <strong>${escapeHtml(reagent.name)}</strong>
              <small>${escapeHtml(subtitle)}</small>
            </span>
          </td>
          <td><span class="formula">${escapeHtml(formula)}</span></td>
          <td>${remainingCell}</td>
          <td><span class="state-badge ${statusClass}">${getStatusLabel(reagent)}</span></td>
          ${adminCell}
        </tr>
      `;
    })
    .join("");
}

function renderStats() {
  totalReagents.textContent = reagents.length.toLocaleString("ko-KR");
  toxicReagents.textContent = reagents.filter((reagent) => reagent.toxic).length.toLocaleString("ko-KR");
  lowReagents.textContent = reagents.filter((reagent) => isLowStock(reagent)).length.toLocaleString("ko-KR");
}

function renderDashboard() {
  renderStats();
  renderAccountList();
  renderTable();
}

function resetFilters() {
  filterState.category = "all";
  filterState.status = "all";
  filterState.sort = "id";
  filterState.query = "";
  searchInput.value = "";

  document.querySelectorAll("[data-category]").forEach((button) => {
    button.classList.toggle("is-active", button.dataset.category === "all");
  });

  statusChips.forEach((button) => {
    button.classList.toggle("is-active", button.dataset.status === "all");
  });

  sortButtons.forEach((button) => {
    button.classList.toggle("is-active", button.dataset.sort === "id");
  });

  renderDashboard();
}

soonLinks.forEach((link) => {
  link.addEventListener("click", (event) => {
    event.preventDefault();

    const label = link.textContent.trim();
    showToast(`${label} 내용은 다음 단계에서 같이 정하면 됩니다.`);
  });
});

openPrepLinks.forEach((link) => {
  link.addEventListener("click", (event) => {
    event.preventDefault();
    openPrepRoom();
  });
});

spaceCards.forEach((card) => {
  card.addEventListener("click", () => {
    selectSpace(card);
  });

  card.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      selectSpace(card);
    }
  });
});

categoryList.addEventListener("click", (event) => {
  const button = event.target.closest("[data-category]");

  if (!button) {
    return;
  }

  filterState.category = button.dataset.category;
  document.querySelectorAll("[data-category]").forEach((item) => item.classList.remove("is-active"));
  button.classList.add("is-active");
  renderTable();
});

tableBody.addEventListener("click", (event) => {
  const button = event.target.closest("[data-stock-save]");

  if (!button) {
    return;
  }

  saveReagentRemaining(button.dataset.stockSave);
});

tableBody.addEventListener("keydown", (event) => {
  if (event.key !== "Enter") {
    return;
  }

  const input = event.target.closest("[data-stock-input]");

  if (!input) {
    return;
  }

  event.preventDefault();
  saveReagentRemaining(input.dataset.stockInput);
});

statusChips.forEach((button) => {
  button.addEventListener("click", () => {
    filterState.status = button.dataset.status;
    statusChips.forEach((item) => item.classList.remove("is-active"));
    button.classList.add("is-active");
    renderTable();
  });
});

sortButtons.forEach((button) => {
  button.addEventListener("click", () => {
    filterState.sort = button.dataset.sort;
    sortButtons.forEach((item) => item.classList.remove("is-active"));
    button.classList.add("is-active");
    renderTable();
  });
});

searchInput.addEventListener("input", () => {
  filterState.query = searchInput.value;
  renderTable();
});

searchButton.addEventListener("click", () => {
  filterState.query = searchInput.value;
  renderTable();
});

resetFiltersButton.addEventListener("click", resetFilters);
closePrepButton.addEventListener("click", closePrepRoom);

accountList.addEventListener("change", (event) => {
  const select = event.target.closest("[data-account-role]");

  if (!select) {
    return;
  }

  updateUserRole(select.dataset.accountRole, select.value);
});

accountList.addEventListener("click", (event) => {
  const button = event.target.closest("[data-account-delete]");

  if (!button) {
    return;
  }

  deleteUser(button.dataset.accountDelete);
});

authOpenButtons.forEach((button) => {
  button.addEventListener("click", () => {
    openAuthModal(button.dataset.authOpen);
  });
});

authCloseButtons.forEach((button) => {
  button.addEventListener("click", closeAuthModal);
});

authSwitch.addEventListener("click", () => {
  openAuthModal(authMode === "signup" ? "login" : "signup");
});

authForm.addEventListener("submit", (event) => {
  event.preventDefault();
  handleAuthSubmit();
});

signOutButtons.forEach((button) => {
  button.addEventListener("click", signOut);
});

window.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !authModal.hidden) {
    closeAuthModal();
  }
});

window.addEventListener("popstate", (event) => {
  if (event.state?.view === "prep") {
    openPrepRoom({ pushHistory: false });
    return;
  }

  closePrepRoom({ fromHistory: true });
});

themeToggleButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const nextTheme = document.body.classList.contains("site-theme-dark") ? "light" : "dark";
    setTheme(nextTheme);
  });
});

let savedTheme = "light";
try {
  savedTheme = localStorage.getItem("science-lab-theme") || localStorage.getItem("prep-theme") || "light";
} catch {
  savedTheme = "light";
}

refreshReagents();
buildCategoryFilters();
setTheme(savedTheme);
renderDashboard();
(async () => {
  await initLocalAuth();
})();
