import './style.css';
import {
    initRealtimeSync,
    subscribeToState,
    saveUser,
    deleteUser,
    unbindUserDevice,
    extendUserExpiry,
    toggleUserStatus,
    saveGlobalConfig,
    saveAdminGeminiKey,
    loginAdmin,
    registerAdmin,
    getCurrentAdmin,
    logoutAdmin,
    testGeminiApiKey,
    testCloudConnection,
    firebaseConfig,
    db,
    generateWindowsLicenseKey,
    createLicenseKeys,
    extendLicenseKey,
    resetLicenseKeyDevice,
    toggleLicenseKeyRevoke,
    clearKeyRegisteredUsers,
    updateKeyMaxUsers,
    removeStudentFromKey,
    addStudentToKey,
    deleteLicenseKey
} from './firebase.js';

// Application State
let appState = {
    admin: null,
    users: [],
    licenses: [],
    config: { globalGeminiApiKey: '' },
    connection: { connected: false, mode: 'checking', error: null },
    currentTab: 'licenses', // Default to Windows License Keys
    currentFilter: 'all',
    licenseFilter: 'all',
    searchQuery: '',
    licenseSearchQuery: '',
    selectedDurationDays: 30,
    editingUser: null,
    targetExtendUser: null,
    targetExtendLicenseKey: null,
    targetManageStudentsKey: null
};

// Tab UI Elements
const tabLicensesBtn = document.getElementById('tabLicensesBtn');
const tabUsersBtn = document.getElementById('tabUsersBtn');
const tabSettingsBtn = document.getElementById('tabSettingsBtn');
const tabFirebaseBtn = document.getElementById('tabFirebaseBtn');
const tabActivityBtn = document.getElementById('tabActivityBtn');

const viewLicenses = document.getElementById('viewLicenses');
const viewUsers = document.getElementById('viewUsers');
const viewSettings = document.getElementById('viewSettings');
const viewFirebase = document.getElementById('viewFirebase');
const viewActivity = document.getElementById('viewActivity');

// License Stats & Filter Elements
const statTotalLicenses = document.getElementById('statTotalLicenses');
const statActiveLicenses = document.getElementById('statActiveLicenses');
const statUnusedLicenses = document.getElementById('statUnusedLicenses');
const statExpiredLicenses = document.getElementById('statExpiredLicenses');

const searchLicensesInput = document.getElementById('searchLicensesInput');
const licFilterPills = document.querySelectorAll('[data-lic-filter]');
const refreshLicensesBtn = document.getElementById('refreshLicensesBtn');
const exportLicensesBtn = document.getElementById('exportLicensesBtn');
const licensesTableBody = document.getElementById('licensesTableBody');
const licensesEmptyState = document.getElementById('licensesEmptyState');

const licCountAll = document.getElementById('licCountAll');
const licCountActive = document.getElementById('licCountActive');
const licCountUnused = document.getElementById('licCountUnused');
const licCountExpired = document.getElementById('licCountExpired');
const licCountRevoked = document.getElementById('licCountRevoked');

// Generator Form Elements
const licenseGeneratorForm = document.getElementById('licenseGeneratorForm');
const btnGenerateLicense = document.getElementById('btnGenerateLicense');
const durationPresetBtns = document.querySelectorAll('.duration-preset-btn');
const inputCustomDays = document.getElementById('inputCustomDays');
const inputKeyQuantity = document.getElementById('inputKeyQuantity');
const inputKeyMaxUsers = document.getElementById('inputKeyMaxUsers');
const customMaxUsersWrap = document.getElementById('customMaxUsersWrap');
const inputCustomMaxUsers = document.getElementById('inputCustomMaxUsers');
const inputKeyNotes = document.getElementById('inputKeyNotes');
const liveKeyPreview = document.getElementById('liveKeyPreview');

// Generated Keys Modal Elements
const generatedKeysModal = document.getElementById('generatedKeysModal');
const generatedKeysCount = document.getElementById('generatedKeysCount');
const generatedKeysDuration = document.getElementById('generatedKeysDuration');
const generatedKeysTextarea = document.getElementById('generatedKeysTextarea');
const copyAllGeneratedKeysBtn = document.getElementById('copyAllGeneratedKeysBtn');
const downloadGeneratedKeysBtn = document.getElementById('downloadGeneratedKeysBtn');
const closeGeneratedKeysModalBtn = document.getElementById('closeGeneratedKeysModalBtn');
const closeGeneratedKeysFooterBtn = document.getElementById('closeGeneratedKeysFooterBtn');

// Extend License Modal Elements
const extendLicenseModal = document.getElementById('extendLicenseModal');
const extendLicenseKeyDisplay = document.getElementById('extendLicenseKeyDisplay');
const extendLicenseCurrentStatus = document.getElementById('extendLicenseCurrentStatus');
const closeExtendLicenseModalBtn = document.getElementById('closeExtendLicenseModalBtn');
const cancelExtendLicenseModalBtn = document.getElementById('cancelExtendLicenseModalBtn');
const extendLicQuickBtns = document.querySelectorAll('.extend-lic-quick-btn');

// Manage Students & User Lock Modal Elements
const manageStudentsModal = document.getElementById('manageStudentsModal');
const manageModalKey = document.getElementById('manageModalKey');
const manageModalDeviceName = document.getElementById('manageModalDeviceName');
const manageModalHwid = document.getElementById('manageModalHwid');
const inputModalKeyMaxUsers = document.getElementById('inputModalKeyMaxUsers');
const btnSaveModalKeyMaxUsers = document.getElementById('btnSaveModalKeyMaxUsers');
const manageModalUserCountBadge = document.getElementById('manageModalUserCountBadge');
const manageModalUserList = document.getElementById('manageModalUserList');
const inputModalNewStudentId = document.getElementById('inputModalNewStudentId');
const btnAddModalStudentBtn = document.getElementById('btnAddModalStudentBtn');
const btnClearRegisteredUsersBtn = document.getElementById('btnClearRegisteredUsersBtn');
const closeManageStudentsModalBtn = document.getElementById('closeManageStudentsModalBtn');
const closeManageStudentsFooterBtn = document.getElementById('closeManageStudentsFooterBtn');

const cloudStatusBadge = document.getElementById('cloudStatusBadge');
const cloudStatusDot = document.getElementById('cloudStatusDot');
const cloudStatusText = document.getElementById('cloudStatusText');

const statTotalUsers = document.getElementById('statTotalUsers');
const statActiveUsers = document.getElementById('statActiveUsers');
const statExpiredUsers = document.getElementById('statExpiredUsers');
const statLockedUsers = document.getElementById('statLockedUsers');

const searchInput = document.getElementById('searchInput');
const filterPills = document.querySelectorAll('.filter-pill');
const refreshUsersBtn = document.getElementById('refreshUsersBtn');
const openNewUserModalBtn = document.getElementById('openNewUserModalBtn');
const emptyCreateBtn = document.getElementById('emptyCreateBtn');

const usersTableBody = document.getElementById('usersTableBody');
const usersEmptyState = document.getElementById('usersEmptyState');

const countAll = document.getElementById('countAll');
const countActive = document.getElementById('countActive');
const countExpired = document.getElementById('countExpired');
const countSuspended = document.getElementById('countSuspended');
const countLocked = document.getElementById('countLocked');
const countUnbound = document.getElementById('countUnbound');

// User Modal Elements
const userModal = document.getElementById('userModal');
const userForm = document.getElementById('userForm');
const modalUserTitle = document.getElementById('modalUserTitle');
const closeUserModalBtn = document.getElementById('closeUserModalBtn');
const cancelUserModalBtn = document.getElementById('cancelUserModalBtn');
const inputUserId = document.getElementById('inputUserId');
const inputDisplayName = document.getElementById('inputDisplayName');
const inputPassword = document.getElementById('inputPassword');
const inputExpiryDate = document.getElementById('inputExpiryDate');
const inputApiKey = document.getElementById('inputApiKey');
const inputNotes = document.getElementById('inputNotes');
const inputIsActive = document.getElementById('inputIsActive');
const genRandomPassBtn = document.getElementById('genRandomPassBtn');
const presetChips = document.querySelectorAll('.preset-chip');

// Extend Modal Elements
const extendModal = document.getElementById('extendModal');
const extendModalUsername = document.getElementById('extendModalUsername');
const closeExtendModalBtn = document.getElementById('closeExtendModalBtn');
const cancelExtendModalBtn = document.getElementById('cancelExtendModalBtn');
const extendQuickBtns = document.querySelectorAll('.extend-quick-btn');

// Settings Elements
const globalApiKeyInput = document.getElementById('globalApiKeyInput');
const toggleGlobalKeyVisibilityBtn = document.getElementById('toggleGlobalKeyVisibilityBtn');
const saveGlobalConfigBtn = document.getElementById('saveGlobalConfigBtn');
const testGlobalApiKeyBtn = document.getElementById('testGlobalApiKeyBtn');
const apiKeyTestResult = document.getElementById('apiKeyTestResult');

// Firebase View Elements
const firebaseDiagStatus = document.getElementById('firebaseDiagStatus');
const recheckCloudBtn = document.getElementById('recheckCloudBtn');
const copySnippetBtns = document.querySelectorAll('.copy-snippet-btn');
const toastContainer = document.getElementById('toastContainer');

// Admin Auth & Dashboard Container Elements
const authSection = document.getElementById('authSection');
const dashboardContainer = document.getElementById('dashboardContainer');
const adminLoginForm = document.getElementById('adminLoginForm');
const loginAdminId = document.getElementById('loginAdminId');
const loginAdminPassword = document.getElementById('loginAdminPassword');
const loginAuthError = document.getElementById('loginAuthError');
const submitAdminLoginBtn = document.getElementById('submitAdminLoginBtn');

const adminProfilePill = document.getElementById('adminProfilePill');
const navAdminName = document.getElementById('navAdminName');
const navAdminId = document.getElementById('navAdminId');
const adminLogoutBtn = document.getElementById('adminLogoutBtn');
const settingsAdminHandle = document.getElementById('settingsAdminHandle');

// ── SONNER-STYLE INTERRUPTIBLE TOAST SYSTEM (Emil Kowalski Architecture) ──
function showToast(message, type = 'success', duration = 3800) {
    if (!toastContainer) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.setAttribute('role', 'status');
    toast.setAttribute('aria-live', 'polite');

    const icons = {
        success: '🟢',
        error: '🔴',
        info: 'ℹ️',
        warning: '🟡'
    };
    const icon = icons[type] || 'ℹ️';

    toast.innerHTML = `
        <div class="toast-content">
            <span class="toast-icon">${icon}</span>
            <span class="toast-message">${message}</span>
        </div>
        <button type="button" class="toast-close-btn" aria-label="Dismiss notification">&times;</button>
    `;

    toastContainer.appendChild(toast);

    // Trigger interruptible CSS entrance on next frame
    requestAnimationFrame(() => {
        toast.classList.add('visible');
    });

    let dismissTimer = null;
    let isLeaving = false;

    function dismiss() {
        if (isLeaving) return;
        isLeaving = true;
        clearTimeout(dismissTimer);
        toast.classList.remove('visible');
        toast.classList.add('leaving');
        toast.addEventListener('transitionend', () => {
            toast.remove();
        }, { once: true });
        // Fallback cleanup
        setTimeout(() => toast.remove(), 260);
    }

    function startTimer() {
        dismissTimer = setTimeout(dismiss, duration);
    }

    function pauseTimer() {
        clearTimeout(dismissTimer);
    }

    startTimer();

    // Hover to pause auto-dismiss
    toast.addEventListener('mouseenter', pauseTimer);
    toast.addEventListener('mouseleave', startTimer);

    // Instant click to dismiss
    toast.addEventListener('click', dismiss);
    const closeBtn = toast.querySelector('.toast-close-btn');
    if (closeBtn) {
        closeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            dismiss();
        });
    }
}

// ── DATE FORMATTING HELPERS ──
function formatExpiryDate(isoStr) {
    if (!isoStr) return { text: 'Permanent', badgeClass: 'badge-active', days: 9999 };
    try {
        const exp = new Date(isoStr);
        const now = new Date();
        const diffMs = exp.getTime() - now.getTime();
        const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

        const dateFormatted = exp.toLocaleDateString(undefined, {
            year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
        });

        if (diffDays < 0) {
            return {
                text: `${dateFormatted} (Expired ${Math.abs(diffDays)}d ago)`,
                badgeClass: 'badge-expired',
                isExpired: true,
                days: diffDays
            };
        } else if (diffDays === 0) {
            return {
                text: `${dateFormatted} (Expires Today)`,
                badgeClass: 'badge-suspended',
                isExpired: false,
                days: 0
            };
        } else if (diffDays <= 3) {
            return {
                text: `${dateFormatted} (${diffDays}d left)`,
                badgeClass: 'badge-suspended',
                isExpired: false,
                days: diffDays
            };
        } else {
            return {
                text: `${dateFormatted} (${diffDays}d left)`,
                badgeClass: 'badge-active',
                isExpired: false,
                days: diffDays
            };
        }
    } catch (e) {
        return { text: isoStr, badgeClass: 'badge-active', days: 100 };
    }
}

function toLocalDatetimeInput(date) {
    const pad = (n) => String(n).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

// ── TAB SWITCHING ──
function switchTab(tabId) {
    closeLicenseActionMenu();
    appState.currentTab = tabId;

    [tabLicensesBtn, tabUsersBtn, tabSettingsBtn, tabFirebaseBtn, tabActivityBtn].forEach(btn => btn?.classList.remove('active'));
    [viewLicenses, viewUsers, viewSettings, viewFirebase, viewActivity].forEach(view => {
        if (view) view.style.display = 'none';
    });

    if (tabId === 'licenses') {
        tabLicensesBtn?.classList.add('active');
        if (viewLicenses) viewLicenses.style.display = 'block';
        renderLicenses();
    } else if (tabId === 'users') {
        tabUsersBtn?.classList.add('active');
        if (viewUsers) viewUsers.style.display = 'block';
        renderUsers();
    } else if (tabId === 'settings') {
        tabSettingsBtn?.classList.add('active');
        if (viewSettings) viewSettings.style.display = 'block';
    } else if (tabId === 'firebase') {
        tabFirebaseBtn?.classList.add('active');
        if (viewFirebase) viewFirebase.style.display = 'block';
    } else if (tabId === 'activity') {
        tabActivityBtn?.classList.add('active');
        if (viewActivity) viewActivity.style.display = 'block';
        loadActivityLogs();
    }
}

tabLicensesBtn?.addEventListener('click', () => switchTab('licenses'));
tabUsersBtn?.addEventListener('click', () => switchTab('users'));
tabSettingsBtn?.addEventListener('click', () => switchTab('settings'));
tabFirebaseBtn?.addEventListener('click', () => switchTab('firebase'));
tabActivityBtn?.addEventListener('click', () => switchTab('activity'));

// ── CLOUD CONNECTION STATUS UPDATE ──
function updateConnectionUI(conn) {
    if (!cloudStatusDot || !cloudStatusText) return;

    if (conn.mode === 'checking') {
        cloudStatusDot.className = 'status-dot warning';
        cloudStatusText.innerText = 'Connecting to Firebase...';
        if (firebaseDiagStatus) firebaseDiagStatus.innerText = 'Checking Firestore connection...';
    } else if (conn.connected) {
        cloudStatusDot.className = 'status-dot online';
        cloudStatusText.innerText = `Firebase Live (${conn.mode.toUpperCase()})`;
        if (firebaseDiagStatus) {
            firebaseDiagStatus.innerHTML = `
                <span style="color: #34d399; font-weight: 600;">🟢 Connected & Operational</span>
                <span style="color: #94a3b8; margin-left: 8px;">(Project: buss-60c92, Mode: ${conn.mode})</span>
            `;
        }
    } else {
        cloudStatusDot.className = 'status-dot error';
        cloudStatusText.innerText = 'Connection Issue';
        if (firebaseDiagStatus) {
            firebaseDiagStatus.innerHTML = `
                <span style="color: #f87171; font-weight: 600;">🔴 ${conn.mode === 'permission_denied' ? 'Permission Denied' : 'Error'}</span>
                <div style="color: #cbd5e1; font-size: 11.5px; margin-top: 4px;">${conn.error || 'Check Firestore security rules.'}</div>
            `;
        }
    }
}

// ── RENDER SEB PRODUCT LICENSES (WINDOWS STYLE) ──
function renderLicenses() {
    const licenses = appState.licenses || [];
    const now = Date.now();

    // 1. Calculate KPI Counts
    let activeCount = 0;
    let unusedCount = 0;
    let expiredCount = 0;
    let revokedCount = 0;

    licenses.forEach(l => {
        const isRevoked = l.status === 'REVOKED';
        const isExp = l.expiresAt && new Date(l.expiresAt).getTime() < now;
        const isBound = !!(l.hardwareId && l.hardwareId.trim() !== '');

        if (isRevoked) {
            revokedCount++;
        } else if (isExp) {
            expiredCount++;
        } else if (isBound) {
            activeCount++;
        } else {
            unusedCount++;
        }
    });

    if (statTotalLicenses) statTotalLicenses.innerText = licenses.length;
    if (statActiveLicenses) statActiveLicenses.innerText = activeCount;
    if (statUnusedLicenses) statUnusedLicenses.innerText = unusedCount;
    if (statExpiredLicenses) statExpiredLicenses.innerText = (expiredCount + revokedCount);

    if (licCountAll) licCountAll.innerText = licenses.length;
    if (licCountActive) licCountActive.innerText = activeCount;
    if (licCountUnused) licCountUnused.innerText = unusedCount;
    if (licCountExpired) licCountExpired.innerText = expiredCount;
    if (licCountRevoked) licCountRevoked.innerText = revokedCount;

    // 2. Filter Licenses
    const queryStr = (appState.licenseSearchQuery || '').toLowerCase().trim();
    const filter = appState.licenseFilter || 'all';

    const filtered = licenses.filter(l => {
        const isRevoked = l.status === 'REVOKED';
        const isExp = l.expiresAt && new Date(l.expiresAt).getTime() < now;
        const isBound = !!(l.hardwareId && l.hardwareId.trim() !== '');

        if (filter === 'active' && (!isBound || isExp || isRevoked)) return false;
        if (filter === 'unused' && (isBound || isExp || isRevoked)) return false;
        if (filter === 'expired' && (!isExp || isRevoked)) return false;
        if (filter === 'revoked' && !isRevoked) return false;

        if (queryStr) {
            const matchKey = (l.key || '').toLowerCase().includes(queryStr);
            const matchHwid = (l.hardwareId || '').toLowerCase().includes(queryStr);
            const matchMachine = (l.machineName || '').toLowerCase().includes(queryStr);
            const matchNotes = (l.notes || '').toLowerCase().includes(queryStr);
            const matchStudents = (l.registeredUsers || []).some(id => String(id).toLowerCase().includes(queryStr));
            if (!matchKey && !matchHwid && !matchMachine && !matchNotes && !matchStudents) return false;
        }

        return true;
    });

    // 3. Render Table Rows
    if (!licensesTableBody) return;
    licensesTableBody.innerHTML = '';

    if (filtered.length === 0) {
        if (licensesEmptyState) licensesEmptyState.style.display = 'block';
        return;
    }
    if (licensesEmptyState) licensesEmptyState.style.display = 'none';

    filtered.forEach(l => {
        const tr = document.createElement('tr');
        const isRevoked = l.status === 'REVOKED';
        const isExp = l.expiresAt && new Date(l.expiresAt).getTime() < now;
        const isBound = !!(l.hardwareId && l.hardwareId.trim() !== '');

        // Status Badge
        let statusBadge = '';
        if (isRevoked) {
            statusBadge = '<span class="badge badge-expired">⛔ Revoked</span>';
        } else if (isExp) {
            statusBadge = '<span class="badge badge-expired">🔴 Expired</span>';
        } else if (isBound) {
            statusBadge = '<span class="badge badge-active">🟢 Active (Locked)</span>';
        } else {
            statusBadge = '<span class="badge badge-suspended">🟡 Unused (1-Time)</span>';
        }

        // Expiry Info
        let expiryDisplay = '';
        if (isRevoked) {
            expiryDisplay = '<span style="color: #ef4444; font-size: 12px;">Revoked by Admin</span>';
        } else if (l.expiresAt) {
            const expInfo = formatExpiryDate(l.expiresAt);
            expiryDisplay = `<div style="font-size: 12.5px; font-weight: 500;">${expInfo.text}</div>`;
        } else {
            expiryDisplay = `<span style="font-size: 12px; color: var(--text-dim);">Starts on 1st PC (+${l.durationDays || 30}d)</span>`;
        }

        // Hardware Lock Cell
        let deviceCell = '';
        if (isBound) {
            const shortHwid = l.hardwareId.length > 16 ? l.hardwareId.substring(0, 16) + '...' : l.hardwareId;
            deviceCell = `
                <div class="device-lock-cell">
                    <span class="badge badge-device-locked" style="flex-shrink: 0;">🔒 Bound</span>
                    <div class="device-info-tag" style="min-width: 0; flex: 1;">
                        <div style="font-weight: 600; color: var(--text-main); font-size: 12.5px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${l.machineName || 'Host PC'}</div>
                        <span class="device-id-mono" title="${l.hardwareId}" style="display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${shortHwid}</span>
                    </div>
                    <button class="btn btn-secondary btn-sm unlock-hwid-btn" data-key="${l.key}" title="Reset device lock to allow re-activation on another PC" style="color: var(--apple-red); border-color: rgba(255, 69, 58, 0.35); flex-shrink: 0; white-space: nowrap;">
                        Unlock HWID
                    </button>
                </div>
            `;
        } else {
            deviceCell = '<span class="badge badge-device-unbound">🔓 Unbound (Waiting for PC)</span>';
        }

        // Training Website User Restriction Cell (Dynamic Limit)
        const regUsers = l.registeredUsers || [];
        const regCount = regUsers.length;
        const maxUsers = l.maxUsers || 5;
        const isLimit = regCount >= maxUsers;
        let studentUsersCell = '';

        if (regCount === 0) {
            studentUsersCell = `
                <div style="display: flex; align-items: center; justify-content: space-between; gap: 6px;">
                    <span style="font-size: 12px; color: var(--text-dim);">0/${maxUsers} registered</span>
                    <button class="btn btn-secondary btn-sm manage-students-btn" data-key="${l.key}" title="Manage student IDs & user limit" style="font-size: 11px; padding: 2px 8px; flex-shrink: 0; white-space: nowrap;">
                        Manage
                    </button>
                </div>
            `;
        } else {
            const chips = regUsers.map(id => `<code class="student-id-chip ${isLimit ? 'limit-reached' : ''}">${id}</code>`).join(' ');
            studentUsersCell = `
                <div>
                    <div style="display: flex; align-items: center; justify-content: space-between; gap: 6px; margin-bottom: 4px;">
                        <span class="badge ${isLimit ? 'badge-expired' : 'badge-active'}" style="font-size: 10.5px; padding: 2px 7px;">
                            ${regCount}/${maxUsers} ${isLimit ? 'Limit' : 'Users'}
                        </span>
                        <button class="btn btn-secondary btn-sm manage-students-btn" data-key="${l.key}" title="Manage student IDs & user limit" style="font-size: 11px; padding: 2px 8px; flex-shrink: 0; white-space: nowrap;">
                            Manage
                        </button>
                    </div>
                    <div class="student-id-tags">${chips}</div>
                </div>
            `;
        }

        tr.innerHTML = `
            <td>
                <div class="license-key-pill">
                    <span class="key-text mono">${l.key}</span>
                    <button class="copy-key-btn" data-key="${l.key}" title="Copy Windows product key to clipboard">
                        📋
                    </button>
                </div>
                ${l.notes ? `<div style="font-size: 11px; color: var(--text-dim); margin-top: 4px;">📝 ${l.notes}</div>` : ''}
            </td>
            <td>
                <span class="duration-badge">${l.durationDays || 30} Days</span>
            </td>
            <td>${statusBadge}</td>
            <td>${deviceCell}</td>
            <td>${expiryDisplay}</td>
            <td>${studentUsersCell}</td>
            <td style="text-align: right;">
                <button type="button" class="btn btn-secondary btn-sm lic-actions-trigger" data-key="${l.key}" aria-haspopup="true" aria-expanded="false" title="Actions menu for key ${l.key}">
                    <span>Actions</span>
                    <svg class="chevron-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                        <polyline points="6 9 12 15 18 9"></polyline>
                    </svg>
                </button>
            </td>
        `;

        licensesTableBody.appendChild(tr);
    });

    // Attach row events
    licensesTableBody.querySelectorAll('.copy-key-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const key = btn.getAttribute('data-key');
            if (key) {
                navigator.clipboard.writeText(key).then(() => {
                    showToast(`Product Key copied: ${key}`);
                }).catch(() => {
                    showToast('Failed to copy key', 'error');
                });
            }
        });
    });

    licensesTableBody.querySelectorAll('.unlock-hwid-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            e.stopPropagation();
            const key = btn.getAttribute('data-key');
            if (!key) return;
            if (!confirm(`Are you sure you want to reset Hardware Lock for key:\n${key}?\n\nThis will allow the student to activate SafeExamBrowser on a new computer.`)) {
                return;
            }
            try {
                await resetLicenseKeyDevice(key);
                showToast(`Hardware Lock reset for ${key}. Ready for new PC.`);
            } catch(err) {
                showToast(err.message, 'error');
            }
        });
    });

    licensesTableBody.querySelectorAll('.lic-actions-trigger').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const key = btn.getAttribute('data-key');
            if (key) {
                openLicenseActionMenu(btn, key);
            }
        });
    });

    licensesTableBody.querySelectorAll('.manage-students-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const key = btn.getAttribute('data-key');
            openManageStudentsModal(key);
        });
    });
}

// ── FLOATING APPLE ACTIONS POPUP MENU CONTROLLER ──
const licenseActionMenu = document.getElementById('licenseActionMenu');
const actionMenuRevokeIcon = document.getElementById('actionMenuRevokeIcon');
const actionMenuRevokeLabel = document.getElementById('actionMenuRevokeLabel');
const actionMenuUnlockItem = document.getElementById('actionMenuUnlockItem');

let currentActionMenuKey = null;
let currentActionTriggerBtn = null;

function closeLicenseActionMenu() {
    if (!licenseActionMenu) return;
    licenseActionMenu.classList.remove('open');
    if (currentActionTriggerBtn) {
        currentActionTriggerBtn.classList.remove('active');
        currentActionTriggerBtn.setAttribute('aria-expanded', 'false');
        currentActionTriggerBtn = null;
    }
    currentActionMenuKey = null;
    setTimeout(() => {
        if (!licenseActionMenu.classList.contains('open')) {
            licenseActionMenu.style.display = 'none';
        }
    }, 150);
}

function openLicenseActionMenu(triggerBtn, key) {
    if (!licenseActionMenu) return;

    if (currentActionMenuKey === key && licenseActionMenu.classList.contains('open')) {
        closeLicenseActionMenu();
        return;
    }

    if (currentActionTriggerBtn) {
        currentActionTriggerBtn.classList.remove('active');
        currentActionTriggerBtn.setAttribute('aria-expanded', 'false');
    }

    const lic = (appState.licenses || []).find(l => l.key === key);
    if (!lic) return;

    currentActionMenuKey = key;
    currentActionTriggerBtn = triggerBtn;

    // Update labels and state
    const isRevoked = lic.status === 'REVOKED';
    if (actionMenuRevokeIcon) actionMenuRevokeIcon.innerText = isRevoked ? '✅' : '🚫';
    if (actionMenuRevokeLabel) actionMenuRevokeLabel.innerText = isRevoked ? 'Enable / Reactivate' : 'Revoke Key';

    const isBound = !!(lic.hardwareId && lic.hardwareId.trim() !== '');
    if (actionMenuUnlockItem) {
        actionMenuUnlockItem.style.display = isBound ? 'flex' : 'none';
    }

    // Display element to calculate layout
    licenseActionMenu.style.display = 'flex';
    licenseActionMenu.style.visibility = 'hidden';

    const rect = triggerBtn.getBoundingClientRect();
    const menuWidth = licenseActionMenu.offsetWidth || 196;
    const menuHeight = licenseActionMenu.offsetHeight || 210;

    // Positioning logic (smart flipping)
    const spaceBelow = window.innerHeight - rect.bottom;
    let top = rect.bottom + 6;
    let transformOrigin = 'top right';

    if (spaceBelow < menuHeight && rect.top > menuHeight) {
        top = rect.top - menuHeight - 6;
        transformOrigin = 'bottom right';
    }

    let left = rect.right - menuWidth;
    if (left < 10) left = 10;
    if (left + menuWidth > window.innerWidth - 10) {
        left = window.innerWidth - menuWidth - 10;
    }

    licenseActionMenu.style.top = `${top}px`;
    licenseActionMenu.style.left = `${left}px`;
    licenseActionMenu.style.transformOrigin = transformOrigin;
    licenseActionMenu.style.visibility = 'visible';

    requestAnimationFrame(() => {
        licenseActionMenu.classList.add('open');
        licenseActionMenu.setAttribute('aria-hidden', 'false');
        triggerBtn.classList.add('active');
        triggerBtn.setAttribute('aria-expanded', 'true');
    });
}

// Menu item click dispatcher
licenseActionMenu?.querySelectorAll('.action-menu-item').forEach(item => {
    item.addEventListener('click', async (e) => {
        e.stopPropagation();
        const action = item.getAttribute('data-action');
        const key = currentActionMenuKey;
        closeLicenseActionMenu();

        if (!key) return;
        const lic = (appState.licenses || []).find(l => l.key === key);

        if (action === 'extend') {
            openExtendLicenseModal(key);
        } else if (action === 'revoke') {
            const isRevoked = lic?.status === 'REVOKED';
            try {
                await toggleLicenseKeyRevoke(key, !isRevoked);
                showToast(`Key ${key} ${!isRevoked ? 'revoked' : 're-activated'}.`);
            } catch(err) {
                showToast(err.message, 'error');
            }
        } else if (action === 'students') {
            openManageStudentsModal(key);
        } else if (action === 'unlock-hwid') {
            if (!confirm(`Are you sure you want to reset Hardware Lock for key:\n${key}?\n\nThis will allow the student to activate SafeExamBrowser on a new computer.`)) {
                return;
            }
            try {
                await resetLicenseKeyDevice(key);
                showToast(`Hardware Lock reset for ${key}. Ready for new PC.`);
            } catch(err) {
                showToast(err.message, 'error');
            }
        } else if (action === 'copy') {
            navigator.clipboard.writeText(key).then(() => {
                showToast(`Product Key copied: ${key}`);
            }).catch(() => {
                showToast('Failed to copy key', 'error');
            });
        } else if (action === 'delete') {
            if (!confirm(`Permanently delete license key:\n${key}?`)) return;
            try {
                await deleteLicenseKey(key);
                showToast(`Key ${key} deleted.`);
            } catch(err) {
                showToast(err.message, 'error');
            }
        }
    });
});

// Dismiss popup on outside click, window scroll or resize
document.addEventListener('click', (e) => {
    if (licenseActionMenu && licenseActionMenu.classList.contains('open')) {
        if (!licenseActionMenu.contains(e.target) && (!currentActionTriggerBtn || !currentActionTriggerBtn.contains(e.target))) {
            closeLicenseActionMenu();
        }
    }
});

window.addEventListener('resize', () => {
    if (licenseActionMenu && licenseActionMenu.classList.contains('open')) {
        closeLicenseActionMenu();
    }
});

window.addEventListener('scroll', () => {
    if (licenseActionMenu && licenseActionMenu.classList.contains('open')) {
        closeLicenseActionMenu();
    }
}, true);

function openExtendLicenseModal(key) {
    appState.targetExtendLicenseKey = key;
    const lic = (appState.licenses || []).find(l => l.key === key);
    if (!lic) return;

    if (extendLicenseKeyDisplay) extendLicenseKeyDisplay.innerText = key;
    if (extendLicenseCurrentStatus) {
        if (lic.expiresAt) {
            extendLicenseCurrentStatus.innerText = `Current Expiry: ${formatExpiryDate(lic.expiresAt).text}`;
        } else {
            extendLicenseCurrentStatus.innerText = `Current Duration: ${lic.durationDays || 30} Days (Unused)`;
        }
    }

    extendLicenseModal?.classList.add('open');
}

function openManageStudentsModal(key) {
    appState.targetManageStudentsKey = key;
    const lic = (appState.licenses || []).find(l => l.key === key);
    if (!lic) return;

    if (manageModalKey) manageModalKey.innerText = lic.key;
    if (manageModalDeviceName) manageModalDeviceName.innerText = lic.machineName || 'Host PC';
    if (manageModalHwid) manageModalHwid.innerText = lic.hardwareId || 'Unbound';

    const maxUsers = (lic && lic.maxUsers > 0) ? lic.maxUsers : 5;
    if (inputModalKeyMaxUsers) {
        inputModalKeyMaxUsers.value = maxUsers;
    }

    const users = lic.registeredUsers || [];
    const isLimit = users.length >= maxUsers;

    if (manageModalUserCountBadge) {
        manageModalUserCountBadge.innerText = `${users.length} / ${maxUsers} Used`;
        manageModalUserCountBadge.className = `badge ${isLimit ? 'badge-expired' : 'badge-active'}`;
    }

    if (manageModalUserList) {
        if (users.length === 0) {
            manageModalUserList.innerHTML = '<span style="font-size: 12px; color: var(--text-dim);">No students authorized or logged in on this PC yet.</span>';
        } else {
            manageModalUserList.innerHTML = users.map(id => `
                <div style="background: rgba(255, 255, 255, 0.08); border: 1px solid rgba(255, 255, 255, 0.15); border-radius: 6px; padding: 4px 8px 4px 10px; display: inline-flex; align-items: center; gap: 8px;">
                    <span style="font-size: 13px;">🎓</span>
                    <span class="mono" style="font-weight: 600; color: #38bdf8;">${id}</span>
                    <button type="button" class="btn-remove-single-student" data-key="${lic.key}" data-student-id="${id}" title="Remove student ${id}" style="background: transparent; border: none; color: #ef4444; cursor: pointer; padding: 1px 4px; font-size: 15px; line-height: 1; border-radius: 4px; display: inline-flex; align-items: center; justify-content: center; transition: background 0.2s;">&times;</button>
                </div>
            `).join('');

            manageModalUserList.querySelectorAll('.btn-remove-single-student').forEach(btn => {
                btn.addEventListener('click', async (e) => {
                    e.stopPropagation();
                    const k = btn.dataset.key;
                    const stId = btn.dataset.studentId;
                    if (!confirm(`Are you sure you want to remove student ID ${stId} from key ${k}?`)) return;

                    btn.disabled = true;
                    btn.innerText = '...';
                    try {
                        await removeStudentFromKey(k, stId);
                        showToast(`Student ID ${stId} removed.`);
                        openManageStudentsModal(k);
                    } catch(err) {
                        showToast(err.message, 'error');
                        btn.disabled = false;
                        btn.innerText = '×';
                    }
                });
            });
        }
    }

    if (inputModalNewStudentId) inputModalNewStudentId.value = '';
    manageStudentsModal?.classList.add('open');
}

// ── RENDER USERS TABLE & STATS ──
function renderUsers() {
    const users = appState.users;
    const now = Date.now();

    // 1. Calculate KPI Counts
    let activeCount = 0;
    let expiredCount = 0;
    let suspendedCount = 0;
    let lockedCount = 0;
    let unboundCount = 0;

    users.forEach(u => {
        const isExp = u.expiryDate && new Date(u.expiryDate).getTime() < now;
        const isSusp = u.isActive === false;
        const isBound = !!(u.boundDeviceId && u.boundDeviceId !== '' && u.boundDeviceId !== 'unbound');

        if (isSusp) {
            suspendedCount++;
        } else if (isExp) {
            expiredCount++;
        } else {
            activeCount++;
        }

        if (isBound) {
            lockedCount++;
        } else {
            unboundCount++;
        }
    });

    if (statTotalUsers) statTotalUsers.innerText = users.length;
    if (statActiveUsers) statActiveUsers.innerText = activeCount;
    if (statExpiredUsers) statExpiredUsers.innerText = expiredCount;
    if (statLockedUsers) statLockedUsers.innerText = lockedCount;

    if (countAll) countAll.innerText = users.length;
    if (countActive) countActive.innerText = activeCount;
    if (countExpired) countExpired.innerText = expiredCount;
    if (countSuspended) countSuspended.innerText = suspendedCount;
    if (countLocked) countLocked.innerText = lockedCount;
    if (countUnbound) countUnbound.innerText = unboundCount;

    // 2. Filter Users
    const queryStr = appState.searchQuery.toLowerCase().trim();
    const filter = appState.currentFilter;

    const filtered = users.filter(u => {
        const isExp = u.expiryDate && new Date(u.expiryDate).getTime() < now;
        const isSusp = u.isActive === false;
        const isBound = !!(u.boundDeviceId && u.boundDeviceId !== '' && u.boundDeviceId !== 'unbound');

        // Status Filter
        if (filter === 'active' && (isSusp || isExp)) return false;
        if (filter === 'expired' && !isExp) return false;
        if (filter === 'suspended' && !isSusp) return false;
        if (filter === 'locked' && !isBound) return false;
        if (filter === 'unbound' && isBound) return false;

        // Search Query
        if (queryStr) {
            const matchUser = (u.username || '').toLowerCase().includes(queryStr);
            const matchName = (u.displayName || '').toLowerCase().includes(queryStr);
            const matchNotes = (u.notes || '').toLowerCase().includes(queryStr);
            const matchDev = (u.boundDeviceId || '').toLowerCase().includes(queryStr) || (u.boundDeviceName || '').toLowerCase().includes(queryStr);
            if (!matchUser && !matchName && !matchNotes && !matchDev) return false;
        }

        return true;
    });

    // 3. Render Table Rows
    if (!usersTableBody) return;
    usersTableBody.innerHTML = '';

    if (filtered.length === 0) {
        if (usersEmptyState) usersEmptyState.style.display = 'block';
        return;
    }
    if (usersEmptyState) usersEmptyState.style.display = 'none';

    filtered.forEach(u => {
        const tr = document.createElement('tr');
        const isExp = u.expiryDate && new Date(u.expiryDate).getTime() < now;
        const isSusp = u.isActive === false;
        const isBound = !!(u.boundDeviceId && u.boundDeviceId !== '' && u.boundDeviceId !== 'unbound');

        // Status Badge
        let statusBadge = '';
        if (isSusp) {
            statusBadge = '<span class="badge badge-suspended">🟡 Suspended</span>';
        } else if (isExp) {
            statusBadge = '<span class="badge badge-expired">🔴 Expired</span>';
        } else {
            statusBadge = '<span class="badge badge-active">🟢 Active</span>';
        }

        // Expiry Info
        const expInfo = formatExpiryDate(u.expiryDate);

        // Single Device Cell
        let deviceCell = '';
        if (isBound) {
            const shortDev = u.boundDeviceId.length > 14 ? u.boundDeviceId.substring(0, 14) + '...' : u.boundDeviceId;
            deviceCell = `
                <div class="device-lock-cell">
                    <span class="badge badge-device-locked" style="flex-shrink: 0;">🔒 Bound</span>
                    <div class="device-info-tag" style="min-width: 0; flex: 1;">
                        <div style="font-weight: 600; color: var(--text-main); font-size: 12.5px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${u.boundDeviceName || 'Device'}</div>
                        <span class="device-id-mono" title="${u.boundDeviceId}" style="display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${shortDev}</span>
                    </div>
                    <button class="btn btn-secondary btn-sm unbind-device-btn" data-user="${u.username}" title="Reset single-device lock so user can switch computers" style="color: var(--apple-red); border-color: rgba(255, 69, 58, 0.35); flex-shrink: 0; white-space: nowrap;">
                        Unbind
                    </button>
                </div>
            `;
        } else {
            deviceCell = `
                <span class="badge badge-device-unbound">🔓 Unbound (Ready for 1st Device)</span>
            `;
        }

        // Gemini Key status
        let keyStatus = '';
        if (u.apiKey) {
            const masked = u.apiKey.substring(0, 7) + '...' + u.apiKey.slice(-4);
            keyStatus = `<span class="badge badge-active" title="${u.apiKey}">🔑 Custom Key (${masked})</span>`;
        } else {
            keyStatus = `<span class="badge badge-device-unbound">🌐 Global Key</span>`;
        }

        tr.innerHTML = `
            <td>
                <div class="user-identity">
                    <div class="user-avatar">${(u.username || 'U')[0].toUpperCase()}</div>
                    <div class="user-name-box">
                        <span class="user-username">${u.username}</span>
                        <span class="user-notes">${u.displayName ? u.displayName : (u.notes ? u.notes : 'Student Account')}</span>
                    </div>
                </div>
            </td>
            <td>
                <div class="password-box">
                    <span class="pass-text" data-pass="${u.password}">••••••••</span>
                    <button class="password-btn toggle-pass-btn" title="Show/Hide Password">👁️</button>
                    <button class="password-btn copy-pass-btn" title="Copy Password">📋</button>
                </div>
            </td>
            <td>${statusBadge}</td>
            <td>
                <span class="badge ${expInfo.badgeClass}">
                    ${expInfo.text}
                </span>
            </td>
            <td>${deviceCell}</td>
            <td>${keyStatus}</td>
            <td style="text-align: right;">
                <div class="action-buttons">
                    <button class="btn-share share-btn" data-user="${u.username}" title="Copy & Share Access Credentials for Student">
                        📋 Share
                    </button>
                    <button class="btn-icon extend-btn" data-user="${u.username}" title="Extend Expiry Date">
                        ⏳
                    </button>
                    <button class="btn-icon toggle-status-btn" data-user="${u.username}" data-active="${u.isActive !== false}" title="${u.isActive === false ? 'Activate User' : 'Suspend User'}">
                        ${u.isActive === false ? '▶️' : '⏸️'}
                    </button>
                    <button class="btn-icon edit-btn" data-user="${u.username}" title="Edit User License">
                        ✏️
                    </button>
                    <button class="btn-icon danger delete-btn" data-user="${u.username}" title="Delete User">
                        🗑️
                    </button>
                </div>
            </td>
        `;

        usersTableBody.appendChild(tr);
    });

    // Attach row listeners
    attachTableRowListeners();
}

// ── ROW EVENT LISTENERS ──
function attachTableRowListeners() {
    // 1. Password Toggle & Copy
    document.querySelectorAll('.toggle-pass-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const box = e.target.closest('.password-box');
            const passSpan = box.querySelector('.pass-text');
            const rawPass = passSpan.getAttribute('data-pass');
            if (passSpan.innerText === '••••••••') {
                passSpan.innerText = rawPass;
                btn.innerText = '🔒';
            } else {
                passSpan.innerText = '••••••••';
                btn.innerText = '👁️';
            }
        });
    });

    document.querySelectorAll('.copy-pass-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const box = e.target.closest('.password-box');
            const rawPass = box.querySelector('.pass-text').getAttribute('data-pass');
            navigator.clipboard.writeText(rawPass).then(() => {
                showToast('Password copied to clipboard!');
            });
        });
    });

    // 2. Unbind Device Lock
    document.querySelectorAll('.unbind-device-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
            const username = btn.getAttribute('data-user');
            if (confirm(`Unbind device lock for user '${username}'?\n\nThis will allow the student to bind a new device on their next login.`)) {
                btn.disabled = true;
                btn.innerText = '⏳';
                try {
                    await unbindUserDevice(username);
                    showToast(`Device lock reset for user '${username}'. Account is now unbound.`);
                } catch (err) {
                    showToast(`Failed to unbind device: ${err.message}`, 'error');
                }
            }
        });
    });

    // 3. Extend License
    document.querySelectorAll('.extend-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const username = btn.getAttribute('data-user');
            openExtendModal(username);
        });
    });

    // 4. Toggle Suspend / Active
    document.querySelectorAll('.toggle-status-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
            const username = btn.getAttribute('data-user');
            const isCurrentlyActive = btn.getAttribute('data-active') === 'true';
            btn.disabled = true;
            try {
                await toggleUserStatus(username, !isCurrentlyActive);
                showToast(`User '${username}' ${!isCurrentlyActive ? 'activated' : 'suspended'}.`);
            } catch (err) {
                showToast(`Failed to update status: ${err.message}`, 'error');
            }
        });
    });

    // 5. Edit User
    document.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const username = btn.getAttribute('data-user');
            const u = appState.users.find(item => item.username === username);
            if (u) openUserModal(u);
        });
    });

    // 6. Delete User
    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
            const username = btn.getAttribute('data-user');
            if (confirm(`Are you sure you want to completely delete user '${username}'?\n\nTheir extension access will immediately cease.`)) {
                btn.disabled = true;
                try {
                    await deleteUser(username);
                    showToast(`User '${username}' deleted successfully.`);
                } catch (err) {
                    showToast(`Failed to delete user: ${err.message}`, 'error');
                }
            }
        });
    });

    // 7. Share / Copy User Credentials Message
    document.querySelectorAll('.share-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const username = btn.getAttribute('data-user');
            const user = appState.users.find(u => u.username === username);
            if (user) openShareModal(user);
        });
    });
}

// ── SEARCH & FILTER CONTROLS ──
if (searchInput) {
    searchInput.addEventListener('input', (e) => {
        appState.searchQuery = e.target.value;
        renderUsers();
    });
}

filterPills.forEach(pill => {
    pill.addEventListener('click', () => {
        filterPills.forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        appState.currentFilter = pill.getAttribute('data-filter');
        renderUsers();
    });
});

if (refreshUsersBtn) {
    refreshUsersBtn.addEventListener('click', () => {
        refreshUsersBtn.disabled = true;
        refreshUsersBtn.innerText = '🔄 Syncing...';
        testCloudConnection().then(() => {
            refreshUsersBtn.disabled = false;
            refreshUsersBtn.innerText = '🔄 Sync';
            showToast('Refreshed data from Cloud Firestore!');
            renderUsers();
        });
    });
}

// ── USER CREATE / EDIT MODAL ──
function openUserModal(user = null) {
    appState.editingUser = user;

    if (user) {
        modalUserTitle.innerText = `✏️ Edit User: ${user.username}`;
        inputUserId.value = user.username;
        inputUserId.disabled = true;
        inputDisplayName.value = user.displayName || '';
        inputPassword.value = user.password || '';
        inputApiKey.value = user.apiKey || '';
        inputNotes.value = user.notes || '';
        inputIsActive.checked = user.isActive !== false;

        if (user.expiryDate) {
            inputExpiryDate.value = toLocalDatetimeInput(new Date(user.expiryDate));
        } else {
            const d = new Date();
            d.setDate(d.getDate() + 30);
            inputExpiryDate.value = toLocalDatetimeInput(d);
        }
    } else {
        modalUserTitle.innerText = '➕ Create User License';
        inputUserId.value = '';
        inputUserId.disabled = false;
        inputDisplayName.value = '';
        inputPassword.value = generateStrongPassword();
        inputApiKey.value = '';
        inputNotes.value = '';
        inputIsActive.checked = true;

        // Default expiry: 30 days from now
        const defaultExp = new Date();
        defaultExp.setDate(defaultExp.getDate() + 30);
        defaultExp.setHours(23, 59, 0, 0);
        inputExpiryDate.value = toLocalDatetimeInput(defaultExp);
    }

    userModal.classList.add('open');
    if (!user) inputUserId.focus();
}

function closeUserModal() {
    userModal.classList.remove('open');
    appState.editingUser = null;
}

openNewUserModalBtn?.addEventListener('click', () => openUserModal());
emptyCreateBtn?.addEventListener('click', () => openUserModal());
closeUserModalBtn?.addEventListener('click', closeUserModal);
cancelUserModalBtn?.addEventListener('click', closeUserModal);

// Preset Expiry Chips
presetChips.forEach(chip => {
    chip.addEventListener('click', () => {
        const days = parseInt(chip.getAttribute('data-days'), 10);
        const exp = new Date();
        exp.setDate(exp.getDate() + days);
        exp.setHours(23, 59, 0, 0);
        inputExpiryDate.value = toLocalDatetimeInput(exp);
    });
});

// Random Password Generator
function generateStrongPassword() {
    const chars = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#$';
    let pass = '';
    for (let i = 0; i < 10; i++) {
        pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return pass;
}

genRandomPassBtn?.addEventListener('click', () => {
    inputPassword.value = generateStrongPassword();
});

// User Form Submit
userForm?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const username = inputUserId.value.trim().toLowerCase();
    const password = inputPassword.value.trim();
    const displayName = inputDisplayName.value.trim();
    const apiKey = inputApiKey.value.trim();
    const notes = inputNotes.value.trim();
    const isActive = inputIsActive.checked;
    const expiryDateVal = inputExpiryDate.value;

    if (!username || !password) {
        showToast('Please provide both User ID and Password.', 'error');
        return;
    }

    const payload = {
        username: username,
        displayName: displayName || username,
        password: password,
        apiKey: apiKey,
        notes: notes,
        isActive: isActive,
        expiryDate: expiryDateVal ? new Date(expiryDateVal).toISOString() : null
    };

    if (appState.editingUser) {
        payload.boundDeviceId = appState.editingUser.boundDeviceId || null;
        payload.boundDeviceName = appState.editingUser.boundDeviceName || null;
        payload.boundDeviceAt = appState.editingUser.boundDeviceAt || null;
        payload.lastLogin = appState.editingUser.lastLogin || null;
    }

    const saveBtn = document.getElementById('saveUserBtn');
    saveBtn.disabled = true;
    saveBtn.innerText = '⏳ Saving to Firebase...';

    try {
        await saveUser(payload);
        showToast(`User '${username}' saved successfully!`);
        closeUserModal();
        renderUsers();
        // Immediately pop up the Share Access credentials modal!
        openShareModal(payload);
    } catch (err) {
        showToast(`Error saving user: ${err.message}`, 'error');
    } finally {
        saveBtn.disabled = false;
        saveBtn.innerText = '💾 Save License';
    }
});

// ── SHARE ACCESS CREDENTIALS MESSAGE ──
function generateShareMessage(user) {
    const expInfo = formatExpiryDate(user.expiryDate);
    const expiryText = user.expiryDate 
        ? new Date(user.expiryDate).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
        : 'Permanent / Unlimited';

    const daysRemaining = expInfo.days > 0 ? `${expInfo.days} Days Remaining` : (expInfo.isExpired ? 'Expired' : 'Active');

    return `☕ LMS JAVA HELPER - ACCESS CREDENTIALS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
👤 User ID:     ${user.username}
🔑 Password:    ${user.password}
📅 Valid Until: ${expiryText} (${daysRemaining})
🔒 Policy:      Single Device Only (Locks to 1st computer)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🚀 QUICK ACTIVATION GUIDE FOR STUDENT:
1. Open Google Chrome with "LMS Java Helper" installed.
2. Go to your LMS coding problem page.
3. Press Ctrl + K (or F10) on your keyboard.
4. Enter your User ID and Password, then click "Activate".
5. Press Ctrl + Shift + E anytime to auto-inject the solved Java solution!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚠️ Warning: Do not share your login credentials. Your account will automatically bind and lock to your machine on first login.`;
}

function openShareModal(user) {
    if (!user) return;
    const msg = generateShareMessage(user);
    const shareModal = document.getElementById('shareModal');
    const shareTextarea = document.getElementById('shareMessageTextarea');
    const whatsappLink = document.getElementById('whatsappShareLink');

    if (shareTextarea) shareTextarea.value = msg;
    if (whatsappLink) whatsappLink.href = `https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`;

    shareModal?.classList.add('open');

    // Auto-copy to clipboard immediately
    navigator.clipboard.writeText(msg).then(() => {
        showToast(`📋 Credentials for '${user.username}' copied to clipboard!`);
    }).catch(() => {});
}

const shareModal = document.getElementById('shareModal');
const closeShareModalBtn = document.getElementById('closeShareModalBtn');
const closeShareModalFooterBtn = document.getElementById('closeShareModalFooterBtn');
const copyShareMessageBtn = document.getElementById('copyShareMessageBtn');
const shareMessageTextarea = document.getElementById('shareMessageTextarea');

closeShareModalBtn?.addEventListener('click', () => shareModal?.classList.remove('open'));
closeShareModalFooterBtn?.addEventListener('click', () => shareModal?.classList.remove('open'));
copyShareMessageBtn?.addEventListener('click', () => {
    if (shareMessageTextarea) {
        navigator.clipboard.writeText(shareMessageTextarea.value).then(() => {
            const oldText = copyShareMessageBtn.innerText;
            copyShareMessageBtn.innerText = '✅ Copied to Clipboard!';
            setTimeout(() => copyShareMessageBtn.innerText = oldText, 2000);
            showToast('Credentials message copied to clipboard!');
        });
    }
});

// ── EXTEND MODAL LOGIC ──
function openExtendModal(username) {
    appState.targetExtendUser = username;
    if (extendModalUsername) extendModalUsername.innerText = username;
    extendModal.classList.add('open');
}

function closeExtendModal() {
    extendModal.classList.remove('open');
    appState.targetExtendUser = null;
}

closeExtendModalBtn?.addEventListener('click', closeExtendModal);
cancelExtendModalBtn?.addEventListener('click', closeExtendModal);

extendQuickBtns.forEach(btn => {
    btn.addEventListener('click', async () => {
        const days = parseInt(btn.getAttribute('data-days'), 10);
        const username = appState.targetExtendUser;
        if (!username) return;

        btn.disabled = true;
        try {
            await extendUserExpiry(username, days);
            showToast(`Extended '${username}' license by ${days} days!`);
            closeExtendModal();
            renderUsers();
        } catch (err) {
            showToast(`Failed to extend license: ${err.message}`, 'error');
        } finally {
            btn.disabled = false;
        }
    });
});

// ── GLOBAL GEMINI API KEY SETTINGS ──
toggleGlobalKeyVisibilityBtn?.addEventListener('click', () => {
    if (globalApiKeyInput.type === 'password') {
        globalApiKeyInput.type = 'text';
        toggleGlobalKeyVisibilityBtn.innerText = '🔒 Hide';
    } else {
        globalApiKeyInput.type = 'password';
        toggleGlobalKeyVisibilityBtn.innerText = '👁️ Show';
    }
});

saveGlobalConfigBtn?.addEventListener('click', async () => {
    const key = globalApiKeyInput.value.trim();
    saveGlobalConfigBtn.disabled = true;
    saveGlobalConfigBtn.innerText = '⏳ Saving...';

    try {
        await saveAdminGeminiKey(key);
        showToast('Dedicated Gemini API Key saved to your admin account!');
    } catch (err) {
        showToast(`Failed to save Key: ${err.message}`, 'error');
    } finally {
        saveGlobalConfigBtn.disabled = false;
        saveGlobalConfigBtn.innerText = '💾 Save Dedicated API Key';
    }
});

testGlobalApiKeyBtn?.addEventListener('click', async () => {
    const key = globalApiKeyInput.value.trim();
    if (!key) {
        showToast('Please enter an API Key to test.', 'error');
        return;
    }

    testGlobalApiKeyBtn.disabled = true;
    testGlobalApiKeyBtn.innerText = '⚡ Testing API...';
    if (apiKeyTestResult) {
        apiKeyTestResult.style.display = 'block';
        apiKeyTestResult.innerHTML = '<div style="font-size: 12.5px; color: #38bdf8;">Connecting to Google Generative Language API...</div>';
    }

    const res = await testGeminiApiKey(key);
    testGlobalApiKeyBtn.disabled = false;
    testGlobalApiKeyBtn.innerText = '⚡ Test API Key Live';

    if (res.success) {
        apiKeyTestResult.innerHTML = `
            <div style="background: rgba(16, 185, 129, 0.15); border: 1px solid rgba(16, 185, 129, 0.35); padding: 12px; border-radius: 8px;">
                <div style="font-weight: 600; color: #34d399; font-size: 13px;">✅ Gemini API Key is Valid & Active!</div>
                <div style="font-size: 11.5px; color: #cbd5e1; margin-top: 4px;">
                    Model: <b>${res.model}</b> | Latency: <b>${res.latencyMs}ms</b> | Response: <code>"${res.reply}"</code>
                </div>
            </div>
        `;
        showToast('Gemini API Key verification passed!');
    } else {
        apiKeyTestResult.innerHTML = `
            <div style="background: rgba(239, 68, 68, 0.15); border: 1px solid rgba(239, 68, 68, 0.35); padding: 12px; border-radius: 8px;">
                <div style="font-weight: 600; color: #f87171; font-size: 13px;">❌ Gemini API Key Verification Failed</div>
                <div style="font-size: 11.5px; color: #fca5a5; margin-top: 4px;">${res.error}</div>
            </div>
        `;
        showToast('Gemini API Key test failed.', 'error');
    }
});

// ── FIREBASE RULES SNIPPET COPY ──
copySnippetBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        const targetId = btn.getAttribute('data-target');
        const text = document.getElementById(targetId)?.innerText;
        if (text) {
            navigator.clipboard.writeText(text).then(() => {
                const old = btn.innerText;
                btn.innerText = '✅ Copied!';
                setTimeout(() => btn.innerText = old, 2000);
                showToast('Rules copied to clipboard!');
            });
        }
    });
});

recheckCloudBtn?.addEventListener('click', () => {
    recheckCloudBtn.disabled = true;
    recheckCloudBtn.innerText = '🔍 Checking...';
    testCloudConnection().then(() => {
        recheckCloudBtn.disabled = false;
        recheckCloudBtn.innerText = '🔍 Test Cloud Read/Write';
        showToast('Diagnostics complete!');
    });
});

// ── ACTIVITY AUDIT LOGS ──
async function loadActivityLogs() {
    const tableBody = document.getElementById('activityTableBody');
    const emptyState = document.getElementById('activityEmptyState');
    if (!tableBody) return;

    try {
        const res = await fetch(`https://firestore.googleapis.com/v1/projects/${firebaseConfig.projectId}/databases/(default)/documents/activity_logs?key=${firebaseConfig.apiKey}`);
        if (res.ok) {
            const data = await res.json();
            const docs = data.documents || [];
            if (docs.length > 0) {
                if (emptyState) emptyState.style.display = 'none';
                tableBody.innerHTML = '';
                docs.reverse().slice(0, 50).forEach(d => {
                    const f = d.fields || {};
                    const ts = f.timestamp?.stringValue || '';
                    const user = f.username?.stringValue || 'Unknown';
                    const action = f.action?.stringValue || 'LOG';
                    const details = f.details?.stringValue || '';

                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td style="font-size: 11.5px; color: #94a3b8; font-family: monospace;">${ts ? new Date(ts).toLocaleString() : '-'}</td>
                        <td style="font-weight: 600; color: #38bdf8;">${user}</td>
                        <td><span class="badge badge-active">${action}</span></td>
                        <td style="font-size: 12px; color: #cbd5e1;">${details}</td>
                    `;
                    tableBody.appendChild(row);
                });
                return;
            }
        }
    } catch (e) { }

    if (emptyState) emptyState.style.display = 'block';
}

// ── MULTI-TENANT ADMIN AUTHENTICATION & DASHBOARD SWITCHING ──
function syncAdminAuthUI(admin) {
    if (!admin || !admin.adminId) {
        if (authSection) authSection.style.display = 'flex';
        if (dashboardContainer) {
            dashboardContainer.style.display = 'none';
            dashboardContainer.setAttribute('hidden', 'true');
        }
        if (adminProfilePill) adminProfilePill.style.display = 'none';
        if (usersTableBody) usersTableBody.innerHTML = '';
        if (settingsAdminHandle) settingsAdminHandle.innerText = '@login-required';
    } else {
        if (authSection) authSection.style.display = 'none';
        if (dashboardContainer) {
            dashboardContainer.style.display = 'block';
            dashboardContainer.removeAttribute('hidden');
        }
        if (adminProfilePill) adminProfilePill.style.display = 'flex';
        if (navAdminName) navAdminName.innerText = admin.displayName || admin.adminId;
        if (navAdminId) navAdminId.innerText = `@${admin.adminId}`;
        if (settingsAdminHandle) settingsAdminHandle.innerText = `@${admin.adminId}`;
        if (globalApiKeyInput && admin.geminiApiKey) {
            globalApiKeyInput.value = admin.geminiApiKey;
        }
    }
}

// Admin Sign In Form Submission
adminLoginForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (loginAuthError) loginAuthError.style.display = 'none';

    const id = loginAdminId.value.trim();
    const pass = loginAdminPassword.value.trim();

    if (!id || !pass) {
        if (loginAuthError) {
            loginAuthError.innerText = 'Please enter both Admin ID and Password.';
            loginAuthError.style.display = 'block';
        }
        return;
    }

    submitAdminLoginBtn.disabled = true;
    submitAdminLoginBtn.innerText = 'Verifying Admin...';

    try {
        const res = await loginAdmin(id, pass);
        showToast(`Welcome back, ${res.admin.displayName || res.admin.adminId}!`);
        loginAdminPassword.value = '';
    } catch (err) {
        if (loginAuthError) {
            loginAuthError.innerText = err.message || 'Login failed. Please check credentials.';
            loginAuthError.style.display = 'block';
        }
        showToast(err.message, 'error');
    } finally {
        submitAdminLoginBtn.disabled = false;
        submitAdminLoginBtn.innerText = '🚀 Sign In to Dashboard';
    }
});

// Admin Logout
adminLogoutBtn?.addEventListener('click', () => {
    logoutAdmin();
    showToast('Signed out of admin dashboard.', 'info');
    if (loginAdminPassword) loginAdminPassword.value = '';
    loginAdminId?.focus();
});

// ── LICENSE KEY GENERATOR & MANAGEMENT EVENT HANDLERS ──

// Duration presets in Generator
durationPresetBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        durationPresetBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        appState.selectedDurationDays = parseInt(btn.getAttribute('data-days'), 10) || 30;
        if (inputCustomDays) inputCustomDays.value = '';
        updateLiveKeyPreview();
    });
});

inputCustomDays?.addEventListener('input', () => {
    const val = parseInt(inputCustomDays.value, 10);
    if (val && val > 0) {
        durationPresetBtns.forEach(b => b.classList.remove('active'));
        appState.selectedDurationDays = val;
    } else {
        appState.selectedDurationDays = 30;
    }
    updateLiveKeyPreview();
});

function updateLiveKeyPreview() {
    if (!liveKeyPreview) return;
    const sample = generateWindowsLicenseKey();
    const codeEl = liveKeyPreview.querySelector('.key-preview-code');
    if (codeEl) codeEl.innerText = sample;
}

inputKeyMaxUsers?.addEventListener('change', () => {
    if (customMaxUsersWrap) {
        customMaxUsersWrap.style.display = inputKeyMaxUsers.value === 'custom' ? 'flex' : 'none';
    }
});

// Generate License Key(s) Submit
licenseGeneratorForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const duration = appState.selectedDurationDays || 30;
    const qty = parseInt(inputKeyQuantity?.value, 10) || 1;
    const notes = inputKeyNotes?.value || '';

    let maxUsers = 5;
    if (inputKeyMaxUsers?.value === 'custom') {
        maxUsers = parseInt(inputCustomMaxUsers?.value, 10) || 5;
    } else {
        maxUsers = parseInt(inputKeyMaxUsers?.value, 10) || 5;
    }

    if (btnGenerateLicense) {
        btnGenerateLicense.disabled = true;
        btnGenerateLicense.innerText = 'Generating Keys...';
    }

    try {
        const res = await createLicenseKeys({ durationDays: duration, notes: notes, count: qty, maxUsers: maxUsers });
        showToast(`Successfully created ${res.keys.length} product ${res.keys.length === 1 ? 'key' : 'keys'} with ${maxUsers}-student limit!`);

        if (generatedKeysCount) generatedKeysCount.innerText = res.keys.length;
        if (generatedKeysDuration) generatedKeysDuration.innerText = `${duration} Days`;
        if (generatedKeysTextarea) {
            generatedKeysTextarea.value = res.keys.map(k => k.key).join('\n');
        }

        generatedKeysModal?.classList.add('open');
        if (inputKeyNotes) inputKeyNotes.value = '';
        updateLiveKeyPreview();
    } catch(err) {
        showToast(err.message, 'error');
    } finally {
        if (btnGenerateLicense) {
            btnGenerateLicense.disabled = false;
            btnGenerateLicense.innerText = '🎲 Generate Activation Key(s)';
        }
    }
});

// Generated Keys Modal Buttons
copyAllGeneratedKeysBtn?.addEventListener('click', () => {
    if (generatedKeysTextarea) {
        navigator.clipboard.writeText(generatedKeysTextarea.value).then(() => {
            showToast('All product keys copied to clipboard!');
        }).catch(() => {
            showToast('Failed to copy keys', 'error');
        });
    }
});

downloadGeneratedKeysBtn?.addEventListener('click', () => {
    if (!generatedKeysTextarea || !generatedKeysTextarea.value) return;
    const blob = new Blob([generatedKeysTextarea.value], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `SEB_Windows_License_Keys_${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Keys downloaded as .txt');
});

function closeGeneratedKeysModal() {
    generatedKeysModal?.classList.remove('open');
}
closeGeneratedKeysModalBtn?.addEventListener('click', closeGeneratedKeysModal);
closeGeneratedKeysFooterBtn?.addEventListener('click', closeGeneratedKeysModal);

// Search & Filter Licenses
searchLicensesInput?.addEventListener('input', (e) => {
    appState.licenseSearchQuery = e.target.value;
    renderLicenses();
});

licFilterPills.forEach(pill => {
    pill.addEventListener('click', () => {
        licFilterPills.forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        appState.licenseFilter = pill.getAttribute('data-lic-filter');
        renderLicenses();
    });
});

refreshLicensesBtn?.addEventListener('click', () => {
    refreshLicensesBtn.disabled = true;
    refreshLicensesBtn.innerText = '🔄 Syncing...';
    testCloudConnection().then(() => {
        refreshLicensesBtn.disabled = false;
        refreshLicensesBtn.innerText = '🔄 Sync';
        showToast('License keys synchronized!');
        renderLicenses();
    });
});

// Export All Keys Button
exportLicensesBtn?.addEventListener('click', () => {
    const licenses = appState.licenses || [];
    if (licenses.length === 0) {
        showToast('No license keys to export.', 'warning');
        return;
    }

    let content = `SafeExamBrowser Product License Keys Export - ${new Date().toLocaleString()}\n`;
    content += `=========================================================================\n\n`;

    licenses.forEach((l, idx) => {
        content += `${idx + 1}. Key: ${l.key}\n`;
        content += `   Duration: ${l.durationDays || 30} Days\n`;
        content += `   Status: ${l.status || 'UNUSED'}\n`;
        content += `   Hardware Lock: ${l.hardwareId || 'Unbound'}\n`;
        content += `   Machine Name: ${l.machineName || 'None'}\n`;
        content += `   Expiry: ${l.expiresAt || 'Pending 1st activation'}\n`;
        content += `   5-User Training IDs: ${(l.registeredUsers || []).join(', ') || 'None'}\n`;
        if (l.notes) content += `   Notes: ${l.notes}\n`;
        content += `\n`;
    });

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `SEB_All_License_Keys_${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    showToast(`Exported ${licenses.length} keys!`);
});

// Extend License Modal Handlers
function closeExtendLicenseModal() {
    extendLicenseModal?.classList.remove('open');
    appState.targetExtendLicenseKey = null;
}
closeExtendLicenseModalBtn?.addEventListener('click', closeExtendLicenseModal);
cancelExtendLicenseModalBtn?.addEventListener('click', closeExtendLicenseModal);

extendLicQuickBtns.forEach(btn => {
    btn.addEventListener('click', async () => {
        const key = appState.targetExtendLicenseKey;
        if (!key) return;
        const days = parseInt(btn.getAttribute('data-days'), 10) || 30;

        btn.disabled = true;
        try {
            await extendLicenseKey(key, days);
            showToast(`Extended ${key} by +${days} days!`);
            closeExtendLicenseModal();
        } catch(err) {
            showToast(err.message, 'error');
        } finally {
            btn.disabled = false;
        }
    });
});

// Manage Students & User Limit Modal Handlers
function closeManageStudentsModal() {
    manageStudentsModal?.classList.remove('open');
    appState.targetManageStudentsKey = null;
    if (inputModalNewStudentId) inputModalNewStudentId.value = '';
}
closeManageStudentsModalBtn?.addEventListener('click', closeManageStudentsModal);
closeManageStudentsFooterBtn?.addEventListener('click', closeManageStudentsModal);

// Save Max User Limit
btnSaveModalKeyMaxUsers?.addEventListener('click', async () => {
    const key = appState.targetManageStudentsKey;
    if (!key) return;
    const val = parseInt(inputModalKeyMaxUsers?.value, 10);
    if (!val || val < 1) {
        showToast('Please enter a valid max user limit (at least 1).', 'error');
        return;
    }

    btnSaveModalKeyMaxUsers.disabled = true;
    btnSaveModalKeyMaxUsers.innerText = 'Saving...';
    try {
        await updateKeyMaxUsers(key, val);
        showToast(`User limit updated to ${val} students.`);
        openManageStudentsModal(key);
    } catch(err) {
        showToast(err.message, 'error');
    } finally {
        btnSaveModalKeyMaxUsers.disabled = false;
        btnSaveModalKeyMaxUsers.innerText = '💾 Save Limit';
    }
});

// Add Single Student ID
async function handleAddModalStudent() {
    const key = appState.targetManageStudentsKey;
    if (!key) return;
    const stId = (inputModalNewStudentId?.value || '').trim();
    if (!/^\d{8}$/.test(stId)) {
        showToast('Please enter an 8-digit student ID (e.g. 24009664).', 'error');
        return;
    }

    if (btnAddModalStudentBtn) {
        btnAddModalStudentBtn.disabled = true;
        btnAddModalStudentBtn.innerText = 'Adding...';
    }

    try {
        await addStudentToKey(key, stId);
        showToast(`Student ${stId} authorized successfully!`);
        if (inputModalNewStudentId) inputModalNewStudentId.value = '';
        openManageStudentsModal(key);
    } catch(err) {
        showToast(err.message, 'error');
    } finally {
        if (btnAddModalStudentBtn) {
            btnAddModalStudentBtn.disabled = false;
            btnAddModalStudentBtn.innerText = '➕ Add Student';
        }
    }
}

btnAddModalStudentBtn?.addEventListener('click', handleAddModalStudent);
inputModalNewStudentId?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        e.preventDefault();
        handleAddModalStudent();
    }
});

btnClearRegisteredUsersBtn?.addEventListener('click', async () => {
    const key = appState.targetManageStudentsKey;
    if (!key) return;
    const lic = (appState.licenses || []).find(l => l.key === key);
    const maxUsers = lic?.maxUsers || 5;

    if (!confirm(`Are you sure you want to clear all registered student IDs for key ${key}?\n\nThis will reset the user count to 0/${maxUsers}.`)) {
        return;
    }

    try {
        await clearKeyRegisteredUsers(key);
        showToast('Registered student IDs cleared successfully.');
        openManageStudentsModal(key);
    } catch(err) {
        showToast(err.message, 'error');
    }
});

// ── INITIALIZE PORTAL ──
subscribeToState((state) => {
    appState.admin = state.admin;
    appState.users = state.users;
    appState.licenses = state.licenses || [];
    appState.config = state.config;
    appState.connection = state.connection;

    syncAdminAuthUI(state.admin);

    if (globalApiKeyInput && !globalApiKeyInput.value && state.config.globalGeminiApiKey) {
        globalApiKeyInput.value = state.config.globalGeminiApiKey;
    }

    updateConnectionUI(state.connection);
    renderLicenses();
    renderUsers();
});


// ── APPLE DUAL THEME CONTROLLER (Light & Dark Mode) ──
const themeToggleBtn = document.getElementById('themeToggleBtn');

function initTheme() {
    const savedTheme = localStorage.getItem('apple_portal_theme') || 'dark';
    applyTheme(savedTheme);
}

function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('apple_portal_theme', theme);
    if (themeToggleBtn) {
        themeToggleBtn.innerHTML = theme === 'light' ? '🌙' : '☀️';
        themeToggleBtn.title = theme === 'light' ? 'Switch to Apple Dark Pro' : 'Switch to Apple White Theme';
        themeToggleBtn.setAttribute('aria-label', theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode');
    }
}

themeToggleBtn?.addEventListener('click', () => {
    const current = document.documentElement.getAttribute('data-theme') || 'dark';
    applyTheme(current === 'light' ? 'dark' : 'light');
});

initTheme();

// Initial check for active session
syncAdminAuthUI(getCurrentAdmin());


// ── MODAL ACCESSIBILITY & BACKDROP / ESCAPE DISMISSAL (Emil Kowalski Pattern) ──
function closeOpenModals() {
    closeLicenseActionMenu();
    [userModal, extendModal, shareModal, generatedKeysModal, extendLicenseModal, manageStudentsModal].forEach(m => {
        if (m && m.classList.contains('open')) {
            m.classList.remove('open');
        }
    });
    appState.editingUser = null;
    appState.targetExtendUser = null;
    appState.targetExtendLicenseKey = null;
    appState.targetManageStudentsKey = null;
}

window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeOpenModals();
    }
});

[userModal, extendModal, shareModal, generatedKeysModal, extendLicenseModal, manageStudentsModal].forEach(modal => {
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeOpenModals();
            }
        });
    }
});

// Security Observer: Prevents DevTools DOM tampering from displaying dashboard without authentication
const securityGuard = new MutationObserver(() => {
    const current = getCurrentAdmin();
    if (!current || !current.adminId) {
        if (dashboardContainer && (!dashboardContainer.hasAttribute('hidden') || dashboardContainer.style.display !== 'none')) {
            dashboardContainer.style.display = 'none';
            dashboardContainer.setAttribute('hidden', 'true');
            if (usersTableBody) usersTableBody.innerHTML = '';
        }
        if (authSection && authSection.style.display !== 'flex') {
            authSection.style.display = 'flex';
        }
    }
});
securityGuard.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['style', 'hidden', 'class'] });

// Start Realtime Synchronization with Firebase (will only connect if admin is signed in)
initRealtimeSync();
