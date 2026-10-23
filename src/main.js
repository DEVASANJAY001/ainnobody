/* ==========================================================================
   LMS JAVA HELPER - ENTERPRISE ADMIN CONTROLLER
   Full Multi-tenant, Hardware Locking, Command Palette & Batch Architecture
   Authored by: Senior Principal Frontend Engineer
   ========================================================================== */

import './style.css';
import {
    initRealtimeSync,
    subscribeToState,
    saveUser,
    deleteUser,
    unbindUserDevice,
    extendUserExpiry,
    setUserExactExpiry,
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
    db
} from './firebase.js';

// Application State
let appState = {
    admin: null,
    users: [],
    config: { globalGeminiApiKey: '' },
    connection: { connected: false, mode: 'checking', error: null },
    currentTab: 'users',
    currentFilter: 'all',
    searchQuery: '',
    editingUser: null,
    targetExtendUser: null,
    selectedUserIds: new Set()
};

// UI Elements - Navigation & Views
const tabUsersBtn = document.getElementById('tabUsersBtn');
const tabSettingsBtn = document.getElementById('tabSettingsBtn');
const tabFirebaseBtn = document.getElementById('tabFirebaseBtn');
const tabActivityBtn = document.getElementById('tabActivityBtn');

const viewUsers = document.getElementById('viewUsers');
const viewSettings = document.getElementById('viewSettings');
const viewFirebase = document.getElementById('viewFirebase');
const viewActivity = document.getElementById('viewActivity');

const cloudStatusBadge = document.getElementById('cloudStatusBadge');
const cloudStatusDot = document.getElementById('cloudStatusDot');
const cloudStatusText = document.getElementById('cloudStatusText');

// KPI Stat Badges
const statTotalUsers = document.getElementById('statTotalUsers');
const statActiveUsers = document.getElementById('statActiveUsers');
const statExpiredUsers = document.getElementById('statExpiredUsers');
const statLockedUsers = document.getElementById('statLockedUsers');

// Toolbar & Filters
const searchInput = document.getElementById('searchInput');
const filterPills = document.querySelectorAll('.filter-pill');
const refreshUsersBtn = document.getElementById('refreshUsersBtn');
const openNewUserModalBtn = document.getElementById('openNewUserModalBtn');
const emptyCreateBtn = document.getElementById('emptyCreateBtn');
const exportCsvBtn = document.getElementById('exportCsvBtn');
const openCsvModalBtn = document.getElementById('openCsvModalBtn');

const usersTableBody = document.getElementById('usersTableBody');
const usersEmptyState = document.getElementById('usersEmptyState');
const selectAllCheckbox = document.getElementById('selectAllCheckbox');

const countAll = document.getElementById('countAll');
const countActive = document.getElementById('countActive');
const countExpired = document.getElementById('countExpired');
const countSuspended = document.getElementById('countSuspended');
const countLocked = document.getElementById('countLocked');
const countUnbound = document.getElementById('countUnbound');

// Floating Bulk Action Bar
const bulkActionBar = document.getElementById('bulkActionBar');
const bulkCountBadge = document.getElementById('bulkCountBadge');
const bulkExtend7Btn = document.getElementById('bulkExtend7Btn');
const bulkExtend30Btn = document.getElementById('bulkExtend30Btn');
const bulkUnbindBtn = document.getElementById('bulkUnbindBtn');
const bulkToggleStatusBtn = document.getElementById('bulkToggleStatusBtn');
const bulkDeleteBtn = document.getElementById('bulkDeleteBtn');
const bulkClearBtn = document.getElementById('bulkClearBtn');

// Command Palette Elements
const cmdPaletteModal = document.getElementById('cmdPaletteModal');
const cmdInput = document.getElementById('cmdInput');
const cmdList = document.getElementById('cmdList');
const openCmdPaletteBtn = document.getElementById('openCmdPaletteBtn');

// Batch CSV Modal Elements
const csvModal = document.getElementById('csvModal');
const closeCsvModalBtn = document.getElementById('closeCsvModalBtn');
const cancelCsvModalBtn = document.getElementById('cancelCsvModalBtn');
const submitCsvImportBtn = document.getElementById('submitCsvImportBtn');
const csvTextarea = document.getElementById('csvTextarea');
const csvExpiryDays = document.getElementById('csvExpiryDays');

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

// User Modal LMS & Student Profile Inputs
const inputLmsUsername = document.getElementById('inputLmsUsername');
const inputLmsPassword = document.getElementById('inputLmsPassword');
const inputLmsDomain = document.getElementById('inputLmsDomain');
const inputBatch = document.getElementById('inputBatch');
const inputStudentPhone = document.getElementById('inputStudentPhone');
const inputStudentEmail = document.getElementById('inputStudentEmail');

// Advanced User Detail Modal Elements
const userDetailModal = document.getElementById('userDetailModal');
const closeDetailModalBtn = document.getElementById('closeDetailModalBtn');
const closeDetailModalFooterBtn = document.getElementById('closeDetailModalFooterBtn');
const detailAvatar = document.getElementById('detailAvatar');
const detailDisplayName = document.getElementById('detailDisplayName');
const detailStatusBadge = document.getElementById('detailStatusBadge');
const detailUsername = document.getElementById('detailUsername');
const detailBatchBadge = document.getElementById('detailBatchBadge');

const detailShareBtn = document.getElementById('detailShareBtn');
const detailExtend7Btn = document.getElementById('detailExtend7Btn');
const detailExtend30Btn = document.getElementById('detailExtend30Btn');
const detailExtendCustomBtn = document.getElementById('detailExtendCustomBtn');
const detailUnbindBtn = document.getElementById('detailUnbindBtn');
const detailToggleStatusBtn = document.getElementById('detailToggleStatusBtn');
const detailEditBtn = document.getElementById('detailEditBtn');
const detailDeleteBtn = document.getElementById('detailDeleteBtn');

const detailExtUser = document.getElementById('detailExtUser');
const detailExtPass = document.getElementById('detailExtPass');
const copyExtUserBtn = document.getElementById('copyExtUserBtn');
const toggleDetailPassBtn = document.getElementById('toggleDetailPassBtn');
const copyExtPassBtn = document.getElementById('copyExtPassBtn');
const detailExtStatus = document.getElementById('detailExtStatus');

const detailLmsId = document.getElementById('detailLmsId');
const detailLmsPass = document.getElementById('detailLmsPass');
const copyLmsIdBtn = document.getElementById('copyLmsIdBtn');
const toggleDetailLmsPassBtn = document.getElementById('toggleDetailLmsPassBtn');
const copyLmsPassBtn = document.getElementById('copyLmsPassBtn');
const detailLmsDomain = document.getElementById('detailLmsDomain');
const detailContact = document.getElementById('detailContact');

const detailLockStatus = document.getElementById('detailLockStatus');
const detailBoundDeviceId = document.getElementById('detailBoundDeviceId');
const detailBoundDeviceName = document.getElementById('detailBoundDeviceName');
const detailBoundDate = document.getElementById('detailBoundDate');
const detailLastLogin = document.getElementById('detailLastLogin');

const detailExpiryText = document.getElementById('detailExpiryText');
const detailGeminiKey = document.getElementById('detailGeminiKey');
const detailNotes = document.getElementById('detailNotes');
const detailCreatedAt = document.getElementById('detailCreatedAt');

// Active selected user for detail modal
let currentDetailUser = null;

// Extend Modal Elements (macOS Liquid Glass)
const extendModal = document.getElementById('extendModal');
const extendModalUsername = document.getElementById('extendModalUsername');
const extendModalAvatar = document.getElementById('extendModalAvatar');
const extendModalStatusBadge = document.getElementById('extendModalStatusBadge');
const extendModalCurrentExpiryText = document.getElementById('extendModalCurrentExpiryText');
const closeExtendModalBtn = document.getElementById('closeExtendModalBtn');
const closeExtendModalDot = document.getElementById('closeExtendModalDot');
const cancelExtendModalBtn = document.getElementById('cancelExtendModalBtn');
const extendPresetBtns = document.querySelectorAll('.extend-preset-btn');
const inputCustomExtendExpiry = document.getElementById('inputCustomExtendExpiry');
const setPermanentExpiryBtn = document.getElementById('setPermanentExpiryBtn');
const extendCalculatedPreviewText = document.getElementById('extendCalculatedPreviewText');
const saveCustomExtendBtn = document.getElementById('saveCustomExtendBtn');

// macOS Window Traffic Light Controls
const closeDetailModalDot = document.getElementById('closeDetailModalDot');
const closeUserModalDot = document.getElementById('closeUserModalDot');
const closeCsvModalDot = document.getElementById('closeCsvModalDot');
const closeShareModalDot = document.getElementById('closeShareModalDot');

// Share Modal Elements
const shareModal = document.getElementById('shareModal');
const closeShareModalBtn = document.getElementById('closeShareModalBtn');
const closeShareModalFooterBtn = document.getElementById('closeShareModalFooterBtn');
const copyShareMessageBtn = document.getElementById('copyShareMessageBtn');
const shareMessageTextarea = document.getElementById('shareMessageTextarea');
const whatsappShareLink = document.getElementById('whatsappShareLink');

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

// ── TOAST NOTIFICATIONS ──
function showToast(message, type = 'success') {
    if (!toastContainer) return;
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    const iconSvg = type === 'success' 
        ? `<svg class="svg-icon" style="color: #34c759;" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"></polyline></svg>`
        : (type === 'error' 
            ? `<svg class="svg-icon" style="color: #ff3b30;" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>`
            : `<svg class="svg-icon" style="color: #0071e3;" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>`);

    toast.innerHTML = `${iconSvg} <span>${message}</span>`;
    toastContainer.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(12px) scale(0.96)';
        toast.style.transition = 'all 0.25s ease';
        setTimeout(() => toast.remove(), 250);
    }, 3800);
}

// ── DATE FORMATTING ──
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
    appState.currentTab = tabId;

    [tabUsersBtn, tabSettingsBtn, tabFirebaseBtn, tabActivityBtn].forEach(btn => btn?.classList.remove('active'));
    [viewUsers, viewSettings, viewFirebase, viewActivity].forEach(view => {
        if (view) view.style.display = 'none';
    });

    if (tabId === 'users') {
        tabUsersBtn?.classList.add('active');
        if (viewUsers) viewUsers.style.display = 'block';
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

tabUsersBtn?.addEventListener('click', () => switchTab('users'));
tabSettingsBtn?.addEventListener('click', () => switchTab('settings'));
tabFirebaseBtn?.addEventListener('click', () => switchTab('firebase'));
tabActivityBtn?.addEventListener('click', () => switchTab('activity'));

// ── CLOUD CONNECTION STATUS ──
function updateConnectionUI(conn) {
    if (!cloudStatusDot || !cloudStatusText) return;

    if (conn.mode === 'checking') {
        cloudStatusDot.className = 'status-dot warning';
        cloudStatusText.innerText = 'Connecting...';
        if (firebaseDiagStatus) firebaseDiagStatus.innerText = 'Validating Firestore connection...';
    } else if (conn.connected) {
        cloudStatusDot.className = 'status-dot online';
        cloudStatusText.innerText = `Firebase Live (${conn.mode.toUpperCase()})`;
        if (firebaseDiagStatus) {
            firebaseDiagStatus.innerHTML = `
                <span style="color: #34d399; font-weight: 600;">Connected & Operational</span>
                <span style="color: #94a3b8; margin-left: 8px;">(Project: buss-60c92, Mode: ${conn.mode})</span>
            `;
        }
    } else {
        cloudStatusDot.className = 'status-dot error';
        cloudStatusText.innerText = 'Offline';
        if (firebaseDiagStatus) {
            firebaseDiagStatus.innerHTML = `
                <span style="color: #f87171; font-weight: 600;">Cloud Error (${conn.mode})</span>
                <div style="color: #cbd5e1; font-size: 11.5px; margin-top: 4px;">${conn.error || 'Check Firebase rules.'}</div>
            `;
        }
    }
}

// ── RENDER USERS & MULTI-SELECT ──
function updateBulkActionBar() {
    const count = appState.selectedUserIds.size;
    if (!bulkActionBar) return;

    if (count > 0) {
        bulkActionBar.classList.add('visible');
        if (bulkCountBadge) bulkCountBadge.innerText = `${count} Selected`;
    } else {
        bulkActionBar.classList.remove('visible');
    }

    // Update select-all checkbox state
    if (selectAllCheckbox) {
        const visibleUsers = getFilteredUsers();
        if (visibleUsers.length > 0 && visibleUsers.every(u => appState.selectedUserIds.has(u.username))) {
            selectAllCheckbox.checked = true;
            selectAllCheckbox.indeterminate = false;
        } else if (visibleUsers.some(u => appState.selectedUserIds.has(u.username))) {
            selectAllCheckbox.checked = false;
            selectAllCheckbox.indeterminate = true;
        } else {
            selectAllCheckbox.checked = false;
            selectAllCheckbox.indeterminate = false;
        }
    }
}

function getFilteredUsers() {
    const users = appState.users;
    const now = Date.now();
    const queryStr = appState.searchQuery.toLowerCase().trim();
    const filter = appState.currentFilter;

    return users.filter(u => {
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
}

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

        if (isSusp) suspendedCount++;
        else if (isExp) expiredCount++;
        else activeCount++;

        if (isBound) lockedCount++;
        else unboundCount++;
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
    const filtered = getFilteredUsers();

    if (!usersTableBody) return;
    usersTableBody.innerHTML = '';

    if (filtered.length === 0) {
        if (usersEmptyState) usersEmptyState.style.display = 'flex';
        updateBulkActionBar();
        return;
    }
    if (usersEmptyState) usersEmptyState.style.display = 'none';

    filtered.forEach(u => {
        const tr = document.createElement('tr');
        const isExp = u.expiryDate && new Date(u.expiryDate).getTime() < now;
        const isSusp = u.isActive === false;
        const isBound = !!(u.boundDeviceId && u.boundDeviceId !== '' && u.boundDeviceId !== 'unbound');
        const isSelected = appState.selectedUserIds.has(u.username);

        if (isSelected) tr.classList.add('row-selected');

        // Status Badge
        let statusBadge = '';
        if (isSusp) {
            statusBadge = '<span class="status-badge badge-suspended">Suspended</span>';
        } else if (isExp) {
            statusBadge = '<span class="status-badge badge-expired">Expired</span>';
        } else {
            statusBadge = '<span class="status-badge badge-active">Active</span>';
        }

        const expInfo = formatExpiryDate(u.expiryDate);

        // Hardware Lock Cell
        let deviceCell = '';
        if (isBound) {
            const shortDev = u.boundDeviceId.length > 12 ? u.boundDeviceId.substring(0, 12) + '...' : u.boundDeviceId;
            deviceCell = `
                <div style="display: flex; align-items: center; gap: 8px;">
                    <span class="status-badge badge-locked" title="${u.boundDeviceId}">Locked: ${shortDev}</span>
                    <button class="action-icon-btn unbind-device-btn" data-user="${u.username}" title="Reset single-device hardware lock">
                        <svg class="svg-icon" viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 9.9-1"></path></svg>
                    </button>
                </div>
            `;
        } else {
            deviceCell = `<span class="status-badge badge-unbound">Unbound (Ready)</span>`;
        }

        // Gemini Key status
        let keyStatus = '';
        if (u.apiKey) {
            const masked = u.apiKey.substring(0, 5) + '...' + u.apiKey.slice(-3);
            keyStatus = `<span class="status-badge badge-active" title="${u.apiKey}">Custom (${masked})</span>`;
        } else {
            keyStatus = `<span class="status-badge badge-unbound">Global Key</span>`;
        }

        tr.innerHTML = `
            <td style="text-align: center;">
                <input type="checkbox" class="custom-checkbox user-row-checkbox" data-user="${u.username}" ${isSelected ? 'checked' : ''}>
            </td>
            <td>
                <div class="user-identity-cell user-row-clickable" data-user="${u.username}" title="Click to view complete student details">
                    <div class="user-avatar-badge">${(u.username || 'U')[0].toUpperCase()}</div>
                    <div class="user-names">
                        <span class="user-id-text">${u.username}</span>
                        <span class="user-display-name">${u.displayName || (u.notes ? u.notes : 'Student Account')}</span>
                    </div>
                </div>
            </td>
            <td>
                <div class="credential-pill">
                    <span class="pass-text" data-pass="${u.password}">••••••••</span>
                    <button class="copy-mini-btn toggle-pass-btn" title="Reveal / Hide Password">
                        <svg class="svg-icon" style="width: 13px; height: 13px;" viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                    </button>
                    <button class="copy-mini-btn copy-pass-btn" title="Copy Password">
                        <svg class="svg-icon" style="width: 13px; height: 13px;" viewBox="0 0 24 24"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                    </button>
                </div>
            </td>
            <td>${statusBadge}</td>
            <td><span class="status-badge ${expInfo.badgeClass}">${expInfo.text}</span></td>
            <td>${deviceCell}</td>
            <td>${keyStatus}</td>
            <td style="text-align: right;">
                <div class="row-actions">
                    <button class="action-icon-btn share-btn" data-user="${u.username}" title="Share formatted credentials">
                        <svg class="svg-icon" viewBox="0 0 24 24"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
                    </button>
                    <button class="action-icon-btn extend-btn" data-user="${u.username}" title="Extend Expiry Date">
                        <svg class="svg-icon" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                    </button>
                    <button class="action-icon-btn toggle-status-btn" data-user="${u.username}" data-active="${u.isActive !== false}" title="${u.isActive === false ? 'Activate License' : 'Suspend License'}">
                        <svg class="svg-icon" viewBox="0 0 24 24"><path d="M18.36 6.64a9 9 0 1 1-12.73 0"></path><line x1="12" y1="2" x2="12" y2="12"></line></svg>
                    </button>
                    <button class="action-icon-btn edit-btn" data-user="${u.username}" title="Edit User License">
                        <svg class="svg-icon" viewBox="0 0 24 24"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
                    </button>
                    <button class="action-icon-btn danger delete-btn" data-user="${u.username}" title="Delete User">
                        <svg class="svg-icon" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                    </button>
                </div>
            </td>
        `;

        usersTableBody.appendChild(tr);
    });

    attachTableRowListeners();
    updateBulkActionBar();
}

// ── ROW EVENT LISTENERS ──
function attachTableRowListeners() {
    // Checkbox multi-select
    document.querySelectorAll('.user-row-checkbox').forEach(cb => {
        cb.addEventListener('change', (e) => {
            const username = e.target.getAttribute('data-user');
            if (e.target.checked) {
                appState.selectedUserIds.add(username);
            } else {
                appState.selectedUserIds.delete(username);
            }
            renderUsers();
        });
    });

    // Password Toggle & Copy
    document.querySelectorAll('.toggle-pass-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const pill = e.target.closest('.credential-pill');
            const passSpan = pill.querySelector('.pass-text');
            const rawPass = passSpan.getAttribute('data-pass');
            if (passSpan.innerText === '••••••••') {
                passSpan.innerText = rawPass;
            } else {
                passSpan.innerText = '••••••••';
            }
        });
    });

    document.querySelectorAll('.copy-pass-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const pill = e.target.closest('.credential-pill');
            const rawPass = pill.querySelector('.pass-text').getAttribute('data-pass');
            navigator.clipboard.writeText(rawPass).then(() => {
                showToast('Password copied to clipboard!');
            });
        });
    });

    // Unbind Device Lock
    document.querySelectorAll('.unbind-device-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
            const username = btn.getAttribute('data-user');
            if (confirm(`Reset device lock for student '${username}'?\n\nThis unbinds their computer hardware ID, allowing login on a new machine.`)) {
                btn.disabled = true;
                try {
                    await unbindUserDevice(username);
                    showToast(`Device lock reset for '${username}'. Account unbound.`);
                } catch (err) {
                    showToast(`Failed to unbind device: ${err.message}`, 'error');
                }
            }
        });
    });

    // Extend License
    document.querySelectorAll('.extend-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const username = btn.getAttribute('data-user');
            openExtendModal(username);
        });
    });

    // Toggle Suspend / Active
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

    // Edit User
    document.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const username = btn.getAttribute('data-user');
            const u = appState.users.find(item => item.username === username);
            if (u) openUserModal(u);
        });
    });

    // Delete User
    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
            const username = btn.getAttribute('data-user');
            if (confirm(`Permanently delete student license '${username}'?\n\nExtension access will cease immediately.`)) {
                btn.disabled = true;
                try {
                    await deleteUser(username);
                    appState.selectedUserIds.delete(username);
                    showToast(`User '${username}' deleted successfully.`);
                } catch (err) {
                    showToast(`Failed to delete user: ${err.message}`, 'error');
                }
            }
        });
    });

    // Share / Copy User Credentials Message
    document.querySelectorAll('.share-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const username = btn.getAttribute('data-user');
            const user = appState.users.find(u => u.username === username);
            if (user) openShareModal(user);
        });
    });

    // 8. Click on Student Row to open Advanced User Details
    document.querySelectorAll('.user-row-clickable').forEach(el => {
        el.addEventListener('click', () => {
            const username = el.getAttribute('data-user');
            const user = appState.users.find(u => u.username === username);
            if (user) openUserDetailModal(user);
        });
    });
}

// Select All visible
selectAllCheckbox?.addEventListener('change', (e) => {
    const visibleUsers = getFilteredUsers();
    if (e.target.checked) {
        visibleUsers.forEach(u => appState.selectedUserIds.add(u.username));
    } else {
        visibleUsers.forEach(u => appState.selectedUserIds.delete(u.username));
    }
    renderUsers();
});

// ── BULK ACTION HANDLERS ──
bulkClearBtn?.addEventListener('click', () => {
    appState.selectedUserIds.clear();
    renderUsers();
});

bulkExtend7Btn?.addEventListener('click', async () => {
    const ids = Array.from(appState.selectedUserIds);
    if (!ids.length) return;
    bulkExtend7Btn.disabled = true;
    try {
        for (const id of ids) {
            await extendUserExpiry(id, 7);
        }
        showToast(`Extended ${ids.length} licenses by +7 days!`);
        appState.selectedUserIds.clear();
        renderUsers();
    } catch (err) {
        showToast(`Bulk extension error: ${err.message}`, 'error');
    } finally {
        bulkExtend7Btn.disabled = false;
    }
});

bulkExtend30Btn?.addEventListener('click', async () => {
    const ids = Array.from(appState.selectedUserIds);
    if (!ids.length) return;
    bulkExtend30Btn.disabled = true;
    try {
        for (const id of ids) {
            await extendUserExpiry(id, 30);
        }
        showToast(`Extended ${ids.length} licenses by +30 days!`);
        appState.selectedUserIds.clear();
        renderUsers();
    } catch (err) {
        showToast(`Bulk extension error: ${err.message}`, 'error');
    } finally {
        bulkExtend30Btn.disabled = false;
    }
});

bulkUnbindBtn?.addEventListener('click', async () => {
    const ids = Array.from(appState.selectedUserIds);
    if (!ids.length) return;
    if (confirm(`Reset device binding for all ${ids.length} selected students?`)) {
        bulkUnbindBtn.disabled = true;
        try {
            for (const id of ids) {
                await unbindUserDevice(id);
            }
            showToast(`Device locks reset for ${ids.length} accounts!`);
            appState.selectedUserIds.clear();
            renderUsers();
        } catch (err) {
            showToast(`Bulk unbind error: ${err.message}`, 'error');
        } finally {
            bulkUnbindBtn.disabled = false;
        }
    }
});

bulkToggleStatusBtn?.addEventListener('click', async () => {
    const ids = Array.from(appState.selectedUserIds);
    if (!ids.length) return;
    bulkToggleStatusBtn.disabled = true;
    try {
        for (const id of ids) {
            const user = appState.users.find(u => u.username === id);
            if (user) {
                await toggleUserStatus(id, !(user.isActive !== false));
            }
        }
        showToast(`Toggled account status for ${ids.length} students!`);
        appState.selectedUserIds.clear();
        renderUsers();
    } catch (err) {
        showToast(`Bulk status error: ${err.message}`, 'error');
    } finally {
        bulkToggleStatusBtn.disabled = false;
    }
});

bulkDeleteBtn?.addEventListener('click', async () => {
    const ids = Array.from(appState.selectedUserIds);
    if (!ids.length) return;
    if (confirm(`CAUTION: Permanently delete ${ids.length} student licenses? This cannot be undone.`)) {
        bulkDeleteBtn.disabled = true;
        try {
            for (const id of ids) {
                await deleteUser(id);
            }
            showToast(`Deleted ${ids.length} student licenses!`);
            appState.selectedUserIds.clear();
            renderUsers();
        } catch (err) {
            showToast(`Bulk delete error: ${err.message}`, 'error');
        } finally {
            bulkDeleteBtn.disabled = false;
        }
    }
});

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
        testCloudConnection().then(() => {
            refreshUsersBtn.disabled = false;
            showToast('Refreshed data from Cloud Firestore!');
            renderUsers();
        });
    });
}

// ── CSV EXPORT & IMPORT ──
exportCsvBtn?.addEventListener('click', () => {
    const users = appState.users;
    if (!users.length) {
        showToast('No user licenses available to export.', 'error');
        return;
    }

    const headers = ['User ID', 'Display Name', 'Password', 'Active', 'Expiry Date', 'Bound Device ID', 'Bound Device Name', 'Notes'];
    const rows = users.map(u => [
        `"${u.username}"`,
        `"${u.displayName || ''}"`,
        `"${u.password || ''}"`,
        u.isActive !== false ? 'TRUE' : 'FALSE',
        `"${u.expiryDate || ''}"`,
        `"${u.boundDeviceId || ''}"`,
        `"${u.boundDeviceName || ''}"`,
        `"${u.notes || ''}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `lms_student_licenses_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    showToast(`Exported ${users.length} licenses to CSV!`);
});

openCsvModalBtn?.addEventListener('click', () => {
    if (csvModal) csvModal.classList.add('open');
});

closeCsvModalBtn?.addEventListener('click', () => csvModal?.classList.remove('open'));
cancelCsvModalBtn?.addEventListener('click', () => csvModal?.classList.remove('open'));

submitCsvImportBtn?.addEventListener('click', async () => {
    const rawText = csvTextarea.value.trim();
    if (!rawText) {
        showToast('Please paste CSV text or student IDs.', 'error');
        return;
    }

    const days = parseInt(csvExpiryDays.value, 10) || 30;
    const lines = rawText.split(/\r?\n/).filter(line => line.trim().length > 0);
    submitCsvImportBtn.disabled = true;
    submitCsvImportBtn.innerText = 'Importing...';

    const defaultExp = new Date();
    defaultExp.setDate(defaultExp.getDate() + days);
    defaultExp.setHours(23, 59, 0, 0);

    let successCount = 0;
    for (const line of lines) {
        const parts = line.split(',').map(s => s.trim().replace(/^["']|["']$/g, ''));
        const username = parts[0]?.toLowerCase();
        if (!username || username === 'user id' || username === 'username') continue;

        const displayName = parts[1] || username;
        const password = parts[2] || generateStrongPassword();

        try {
            await saveUser({
                username: username,
                displayName: displayName,
                password: password,
                isActive: true,
                expiryDate: defaultExp.toISOString()
            });
            successCount++;
        } catch (e) {
            console.warn(`Error importing ${username}:`, e);
        }
    }

    submitCsvImportBtn.disabled = false;
    submitCsvImportBtn.innerText = 'Import & Create Licenses';
    csvModal?.classList.remove('open');
    csvTextarea.value = '';
    showToast(`Successfully batch-imported ${successCount} student licenses!`);
    renderUsers();
});

// ── COMMAND PALETTE (CTRL+K) ──
const COMMANDS = [
    { title: 'Create New User License', shortcut: 'N', action: () => openUserModal() },
    { title: 'Batch Import Students (CSV)', shortcut: 'I', action: () => csvModal?.classList.add('open') },
    { title: 'Export Licenses to CSV', shortcut: 'E', action: () => exportCsvBtn?.click() },
    { title: 'Switch to Gemini AI Key', shortcut: 'G', action: () => switchTab('settings') },
    { title: 'Switch to Firebase Cloud & Rules', shortcut: 'F', action: () => switchTab('firebase') },
    { title: 'Switch to Security Audit Logs', shortcut: 'L', action: () => switchTab('activity') },
    { title: 'Filter: Active Licenses', shortcut: 'A', action: () => setFilterFromCmd('active') },
    { title: 'Filter: Expired Licenses', shortcut: 'X', action: () => setFilterFromCmd('expired') },
    { title: 'Filter: Device Bound', shortcut: 'B', action: () => setFilterFromCmd('locked') },
    { title: 'Sync with Cloud Database', shortcut: 'S', action: () => refreshUsersBtn?.click() }
];

function setFilterFromCmd(filterName) {
    switchTab('users');
    filterPills.forEach(p => {
        if (p.getAttribute('data-filter') === filterName) {
            p.click();
        }
    });
}

function openCommandPalette() {
    if (!cmdPaletteModal) return;
    cmdPaletteModal.classList.add('open');
    if (cmdInput) {
        cmdInput.value = '';
        renderCommandList('');
        setTimeout(() => cmdInput.focus(), 50);
    }
}

function closeCommandPalette() {
    cmdPaletteModal?.classList.remove('open');
}

openCmdPaletteBtn?.addEventListener('click', openCommandPalette);

function renderCommandList(query) {
    if (!cmdList) return;
    cmdList.innerHTML = '';
    const cleanQ = query.toLowerCase().trim();

    // 1. Actions Group
    const matchingCmds = COMMANDS.filter(c => !cleanQ || c.title.toLowerCase().includes(cleanQ));
    if (matchingCmds.length > 0) {
        const groupLabel = document.createElement('div');
        groupLabel.className = 'cmd-group-label';
        groupLabel.innerText = 'Actions';
        cmdList.appendChild(groupLabel);

        matchingCmds.forEach((c, idx) => {
            const item = document.createElement('div');
            item.className = `cmd-item ${idx === 0 ? 'selected' : ''}`;
            item.innerHTML = `
                <div class="cmd-item-left">
                    <svg class="svg-icon cmd-icon" viewBox="0 0 24 24"><polyline points="9 18 15 12 9 6"></polyline></svg>
                    <span>${c.title}</span>
                </div>
                <span class="cmd-shortcut">${c.shortcut}</span>
            `;
            item.addEventListener('click', () => {
                closeCommandPalette();
                c.action();
            });
            cmdList.appendChild(item);
        });
    }

    // 2. User Accounts Group
    if (cleanQ) {
        const matchingUsers = appState.users.filter(u => 
            u.username.toLowerCase().includes(cleanQ) || 
            (u.displayName && u.displayName.toLowerCase().includes(cleanQ))
        ).slice(0, 8);

        if (matchingUsers.length > 0) {
            const userGroupLabel = document.createElement('div');
            userGroupLabel.className = 'cmd-group-label';
            userGroupLabel.innerText = 'Student Accounts';
            cmdList.appendChild(userGroupLabel);

            matchingUsers.forEach(u => {
                const item = document.createElement('div');
                item.className = 'cmd-item';
                item.innerHTML = `
                    <div class="cmd-item-left">
                        <svg class="svg-icon cmd-icon" viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                        <span>${u.username} <small style="color: var(--text-dim); margin-left: 6px;">${u.displayName || ''}</small></span>
                    </div>
                    <span class="cmd-shortcut">Open</span>
                `;
                item.addEventListener('click', () => {
                    closeCommandPalette();
                    switchTab('users');
                    openUserDetailModal(u);
                });
                cmdList.appendChild(item);
            });
        }
    }
}

cmdInput?.addEventListener('input', (e) => {
    renderCommandList(e.target.value);
});

// Global Keyboard Shortcuts
window.addEventListener('keydown', (e) => {
    // Ctrl+K or Cmd+K
    if ((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault();
        if (cmdPaletteModal?.classList.contains('open')) {
            closeCommandPalette();
        } else {
            openCommandPalette();
        }
        return;
    }

    // Escape closes modals
    if (e.key === 'Escape') {
        if (cmdPaletteModal?.classList.contains('open')) closeCommandPalette();
        if (userDetailModal?.classList.contains('open')) closeUserDetailModal();
        if (userModal?.classList.contains('open')) closeUserModal();
        if (extendModal?.classList.contains('open')) closeExtendModal();
        if (shareModal?.classList.contains('open')) shareModal.classList.remove('open');
        if (csvModal?.classList.contains('open')) csvModal.classList.remove('open');
        return;
    }

    // "/" focuses search when outside inputs
    if (e.key === '/' && document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') {
        e.preventDefault();
        searchInput?.focus();
        return;
    }

    // Arrow navigation inside command palette
    if (cmdPaletteModal?.classList.contains('open')) {
        const items = Array.from(cmdList.querySelectorAll('.cmd-item'));
        if (!items.length) return;
        const currentIdx = items.findIndex(el => el.classList.contains('selected'));

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            const nextIdx = currentIdx < items.length - 1 ? currentIdx + 1 : 0;
            items.forEach((it, i) => it.classList.toggle('selected', i === nextIdx));
            items[nextIdx].scrollIntoView({ block: 'nearest' });
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            const prevIdx = currentIdx > 0 ? currentIdx - 1 : items.length - 1;
            items.forEach((it, i) => it.classList.toggle('selected', i === prevIdx));
            items[prevIdx].scrollIntoView({ block: 'nearest' });
        } else if (e.key === 'Enter') {
            e.preventDefault();
            const selected = items[currentIdx] || items[0];
            if (selected) selected.click();
        }
    }
});

cmdPaletteModal?.addEventListener('click', (e) => {
    if (e.target === cmdPaletteModal) closeCommandPalette();
});

// ── USER CREATE / EDIT MODAL ──
function openUserModal(user = null) {
    appState.editingUser = user;

    if (user) {
        modalUserTitle.innerHTML = `
            <svg class="svg-icon" viewBox="0 0 24 24"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
            <span>Edit User: ${user.username}</span>
        `;
        inputUserId.value = user.username;
        inputUserId.disabled = true;
        inputDisplayName.value = user.displayName || '';
        inputPassword.value = user.password || '';
        inputApiKey.value = user.apiKey || '';
        inputNotes.value = user.notes || '';
        inputIsActive.checked = user.isActive !== false;

        // LMS & Profile fields
        if (inputLmsUsername) inputLmsUsername.value = user.lmsUsername || '';
        if (inputLmsPassword) inputLmsPassword.value = user.lmsPassword || '';
        if (inputLmsDomain) inputLmsDomain.value = user.lmsDomain || '';
        if (inputBatch) inputBatch.value = user.batch || '';
        if (inputStudentPhone) inputStudentPhone.value = user.studentPhone || '';
        if (inputStudentEmail) inputStudentEmail.value = user.studentEmail || '';

        if (user.expiryDate) {
            inputExpiryDate.value = toLocalDatetimeInput(new Date(user.expiryDate));
        } else {
            const d = new Date();
            d.setDate(d.getDate() + 30);
            inputExpiryDate.value = toLocalDatetimeInput(d);
        }
    } else {
        modalUserTitle.innerHTML = `
            <svg class="svg-icon" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
            <span>Create User License</span>
        `;
        inputUserId.value = '';
        inputUserId.disabled = false;
        inputDisplayName.value = '';
        inputPassword.value = generateStrongPassword();
        inputApiKey.value = '';
        inputNotes.value = '';
        inputIsActive.checked = true;

        // Reset LMS & Profile fields
        if (inputLmsUsername) inputLmsUsername.value = '';
        if (inputLmsPassword) inputLmsPassword.value = '';
        if (inputLmsDomain) inputLmsDomain.value = '';
        if (inputBatch) inputBatch.value = '';
        if (inputStudentPhone) inputStudentPhone.value = '';
        if (inputStudentEmail) inputStudentEmail.value = '';

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

// Strong Password Generator
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

    const lmsUsername = inputLmsUsername ? inputLmsUsername.value.trim() : '';
    const lmsPassword = inputLmsPassword ? inputLmsPassword.value.trim() : '';
    const lmsDomain = inputLmsDomain ? inputLmsDomain.value.trim() : '';
    const batch = inputBatch ? inputBatch.value.trim() : '';
    const studentPhone = inputStudentPhone ? inputStudentPhone.value.trim() : '';
    const studentEmail = inputStudentEmail ? inputStudentEmail.value.trim() : '';

    if (!username || !password) {
        showToast('Please provide both User ID and Password.', 'error');
        return;
    }

    const payload = {
        username: username,
        displayName: displayName || username,
        password: password,
        lmsUsername: lmsUsername,
        lmsPassword: lmsPassword,
        lmsDomain: lmsDomain,
        batch: batch,
        studentPhone: studentPhone,
        studentEmail: studentEmail,
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
    saveBtn.innerText = 'Saving...';

    try {
        await saveUser(payload);
        showToast(`User '${username}' saved successfully!`);
        closeUserModal();
        renderUsers();
        // If details modal was open for this user, refresh it!
        if (currentDetailUser && currentDetailUser.username === username) {
            openUserDetailModal(payload);
        }
        openShareModal(payload);
    } catch (err) {
        showToast(`Error saving user: ${err.message}`, 'error');
    } finally {
        saveBtn.disabled = false;
        saveBtn.innerHTML = `
            <svg class="svg-icon" viewBox="0 0 24 24"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg>
            <span>Save License</span>
        `;
    }
});

// ── SHARE ACCESS CREDENTIALS MESSAGE ──
function generateShareMessage(user) {
    const expInfo = formatExpiryDate(user.expiryDate);
    const expiryText = user.expiryDate 
        ? new Date(user.expiryDate).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
        : 'Permanent / Unlimited';

    const daysRemaining = expInfo.days > 0 ? `${expInfo.days} Days Remaining` : (expInfo.isExpired ? 'Expired' : 'Active');

    let lmsSection = '';
    if (user.lmsUsername || user.lmsPassword) {
        lmsSection = `
🎓 COLLEGE / LMS PORTAL DETAILS:
🌐 LMS Portal:    ${user.lmsDomain || 'College LMS Platform'}
👤 LMS ID / Roll: ${user.lmsUsername || '-'}
🔑 LMS Password:  ${user.lmsPassword || '-'}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;
    }

    return `☕ LMS JAVA HELPER - ACCESS CREDENTIALS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
👤 Extension User ID:  ${user.username}
🔑 Extension Password: ${user.password}${lmsSection}
📅 Valid Until:        ${expiryText} (${daysRemaining})
🔒 Security Policy:    Single Device Locked (Auto-binds on 1st login)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🚀 QUICK ACTIVATION GUIDE FOR STUDENT:
1. Open Google Chrome with "LMS Java Helper" extension installed.
2. Go to your LMS coding problem page.
3. Press Ctrl + K (or F10) on your keyboard.
4. Enter your Extension User ID and Password, then click "Activate".
5. Press Ctrl + Shift + E anytime to auto-inject the solved Java solution!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚠️ Warning: Do not share credentials. Account locks to your computer hardware upon first sign in.`;
}

// ── ADVANCED USER DETAILS MODAL LOGIC ──
function openUserDetailModal(user) {
    if (!user) return;
    currentDetailUser = user;

    if (detailAvatar) detailAvatar.innerText = (user.username || 'U')[0].toUpperCase();
    if (detailDisplayName) detailDisplayName.innerText = user.displayName || user.username;
    if (detailUsername) detailUsername.innerText = `@${user.username}`;
    if (detailBatchBadge) detailBatchBadge.innerText = user.batch ? `Batch: ${user.batch}` : 'Batch: General';

    const now = Date.now();
    const isExp = user.expiryDate && new Date(user.expiryDate).getTime() < now;
    const isSusp = user.isActive === false;
    const isBound = !!(user.boundDeviceId && user.boundDeviceId !== '' && user.boundDeviceId !== 'unbound');

    if (detailStatusBadge) {
        if (isSusp) {
            detailStatusBadge.className = 'status-badge badge-suspended';
            detailStatusBadge.innerText = 'Suspended';
        } else if (isExp) {
            detailStatusBadge.className = 'status-badge badge-expired';
            detailStatusBadge.innerText = 'Expired';
        } else {
            detailStatusBadge.className = 'status-badge badge-active';
            detailStatusBadge.innerText = 'Active';
        }
    }

    // Extension Credentials
    if (detailExtUser) detailExtUser.innerText = user.username;
    if (detailExtPass) {
        detailExtPass.innerText = '••••••••';
        detailExtPass.setAttribute('data-pass', user.password || '');
    }
    if (detailExtStatus) {
        detailExtStatus.innerHTML = isSusp 
            ? '<span class="status-badge badge-suspended">Suspended</span>' 
            : '<span class="status-badge badge-active">Active</span>';
    }

    // LMS Credentials
    if (detailLmsId) detailLmsId.innerText = user.lmsUsername || 'Not assigned';
    if (detailLmsPass) {
        detailLmsPass.innerText = user.lmsPassword ? '••••••••' : 'None';
        detailLmsPass.setAttribute('data-pass', user.lmsPassword || '');
    }
    if (detailLmsDomain) {
        detailLmsDomain.innerHTML = user.lmsDomain 
            ? `<a href="${user.lmsDomain.startsWith('http') ? user.lmsDomain : 'https://' + user.lmsDomain}" target="_blank" style="color: #38bdf8;">${user.lmsDomain} &nearr;</a>` 
            : '<span style="color: var(--text-dim);">Default LMS</span>';
    }
    if (detailContact) {
        const contactParts = [];
        if (user.studentEmail) contactParts.push(`<a href="mailto:${user.studentEmail}" style="color: #38bdf8;">${user.studentEmail}</a>`);
        if (user.studentPhone) contactParts.push(`<a href="https://wa.me/${user.studentPhone.replace(/[^0-9]/g, '')}" target="_blank" style="color: #86efac; text-decoration: none;">📱 ${user.studentPhone}</a>`);
        detailContact.innerHTML = contactParts.length > 0 ? contactParts.join(' | ') : '<span style="color: var(--text-dim);">No contact info</span>';
    }

    // Hardware Lock & Telemetry
    if (detailLockStatus) {
        detailLockStatus.innerHTML = isBound 
            ? '<span class="status-badge badge-locked">🔒 Bound to 1 Device</span>' 
            : '<span class="status-badge badge-unbound">🔓 Unbound (Ready)</span>';
    }
    if (detailBoundDeviceId) detailBoundDeviceId.innerText = user.boundDeviceId || 'None';
    if (detailBoundDeviceName) detailBoundDeviceName.innerText = user.boundDeviceName || 'No device registered yet';
    if (detailBoundDate) detailBoundDate.innerText = user.boundDeviceAt ? new Date(user.boundDeviceAt).toLocaleString() : 'Not bound';
    if (detailLastLogin) detailLastLogin.innerText = user.lastLogin ? new Date(user.lastLogin).toLocaleString() : 'Never logged in';

    // Expiry & Gemini AI Key
    const expInfo = formatExpiryDate(user.expiryDate);
    if (detailExpiryText) detailExpiryText.innerHTML = `<span class="status-badge ${expInfo.badgeClass}">${expInfo.text}</span>`;
    if (detailGeminiKey) {
        detailGeminiKey.innerText = user.apiKey 
            ? `Custom Override (${user.apiKey.substring(0, 6)}...${user.apiKey.slice(-3)})` 
            : 'Global Workspace Gemini Key';
    }
    if (detailNotes) detailNotes.innerText = user.notes || 'No admin notes recorded.';
    if (detailCreatedAt) detailCreatedAt.innerText = user.createdAt ? new Date(user.createdAt).toLocaleString() : '-';

    userDetailModal?.classList.add('open');
}

function closeUserDetailModal() {
    userDetailModal?.classList.remove('open');
    currentDetailUser = null;
}

closeDetailModalBtn?.addEventListener('click', closeUserDetailModal);
closeDetailModalFooterBtn?.addEventListener('click', closeUserDetailModal);

// Detail Modal Password Reveal Toggles
toggleDetailPassBtn?.addEventListener('click', () => {
    if (!detailExtPass) return;
    const raw = detailExtPass.getAttribute('data-pass');
    detailExtPass.innerText = (detailExtPass.innerText === '••••••••') ? raw : '••••••••';
});

copyExtPassBtn?.addEventListener('click', () => {
    if (!detailExtPass) return;
    const raw = detailExtPass.getAttribute('data-pass');
    navigator.clipboard.writeText(raw).then(() => showToast('Extension password copied!'));
});

copyExtUserBtn?.addEventListener('click', () => {
    if (!detailExtUser) return;
    navigator.clipboard.writeText(detailExtUser.innerText).then(() => showToast('Extension User ID copied!'));
});

toggleDetailLmsPassBtn?.addEventListener('click', () => {
    if (!detailLmsPass) return;
    const raw = detailLmsPass.getAttribute('data-pass');
    if (!raw) return;
    detailLmsPass.innerText = (detailLmsPass.innerText === '••••••••') ? raw : '••••••••';
});

copyLmsPassBtn?.addEventListener('click', () => {
    if (!detailLmsPass) return;
    const raw = detailLmsPass.getAttribute('data-pass');
    if (raw) navigator.clipboard.writeText(raw).then(() => showToast('LMS password copied!'));
});

copyLmsIdBtn?.addEventListener('click', () => {
    if (!detailLmsId) return;
    const raw = detailLmsId.innerText;
    if (raw && raw !== 'Not assigned') navigator.clipboard.writeText(raw).then(() => showToast('LMS ID copied!'));
});

// Detail Modal Quick Actions
detailShareBtn?.addEventListener('click', () => {
    if (currentDetailUser) openShareModal(currentDetailUser);
});

detailExtend7Btn?.addEventListener('click', async () => {
    if (!currentDetailUser) return;
    detailExtend7Btn.disabled = true;
    try {
        await extendUserExpiry(currentDetailUser.username, 7);
        showToast(`Extended ${currentDetailUser.username} by +7 days!`);
        const updated = appState.users.find(u => u.username === currentDetailUser.username);
        if (updated) openUserDetailModal(updated);
        renderUsers();
    } catch (e) {
        showToast(`Error: ${e.message}`, 'error');
    } finally {
        detailExtend7Btn.disabled = false;
    }
});

detailExtend30Btn?.addEventListener('click', async () => {
    if (!currentDetailUser) return;
    detailExtend30Btn.disabled = true;
    try {
        await extendUserExpiry(currentDetailUser.username, 30);
        showToast(`Extended ${currentDetailUser.username} by +30 days!`);
        const updated = appState.users.find(u => u.username === currentDetailUser.username);
        if (updated) openUserDetailModal(updated);
        renderUsers();
    } catch (e) {
        showToast(`Error: ${e.message}`, 'error');
    } finally {
        detailExtend30Btn.disabled = false;
    }
});

detailUnbindBtn?.addEventListener('click', async () => {
    if (!currentDetailUser) return;
    if (confirm(`Reset device hardware lock for '${currentDetailUser.username}'?`)) {
        detailUnbindBtn.disabled = true;
        try {
            await unbindUserDevice(currentDetailUser.username);
            showToast(`Device lock reset for '${currentDetailUser.username}'. Account unbound.`);
            const updated = appState.users.find(u => u.username === currentDetailUser.username);
            if (updated) openUserDetailModal(updated);
            renderUsers();
        } catch (e) {
            showToast(`Error: ${e.message}`, 'error');
        } finally {
            detailUnbindBtn.disabled = false;
        }
    }
});

detailToggleStatusBtn?.addEventListener('click', async () => {
    if (!currentDetailUser) return;
    detailToggleStatusBtn.disabled = true;
    try {
        const nextState = !(currentDetailUser.isActive !== false);
        await toggleUserStatus(currentDetailUser.username, nextState);
        showToast(`User '${currentDetailUser.username}' ${nextState ? 'activated' : 'suspended'}.`);
        const updated = appState.users.find(u => u.username === currentDetailUser.username);
        if (updated) openUserDetailModal(updated);
        renderUsers();
    } catch (e) {
        showToast(`Error: ${e.message}`, 'error');
    } finally {
        detailToggleStatusBtn.disabled = false;
    }
});

detailEditBtn?.addEventListener('click', () => {
    if (!currentDetailUser) return;
    const userToEdit = { ...currentDetailUser };
    closeUserDetailModal();
    openUserModal(userToEdit);
});

detailDeleteBtn?.addEventListener('click', async () => {
    if (!currentDetailUser) return;
    const target = currentDetailUser.username;
    if (confirm(`Permanently delete student license '${target}'? This cannot be undone.`)) {
        detailDeleteBtn.disabled = true;
        try {
            await deleteUser(target);
            showToast(`User '${target}' deleted.`);
            closeUserDetailModal();
            renderUsers();
        } catch (e) {
            showToast(`Error: ${e.message}`, 'error');
        } finally {
            detailDeleteBtn.disabled = false;
        }
    }
});

function openShareModal(user) {
    if (!user) return;
    const msg = generateShareMessage(user);
    if (shareMessageTextarea) shareMessageTextarea.value = msg;
    if (whatsappShareLink) whatsappShareLink.href = `https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`;

    shareModal?.classList.add('open');

    navigator.clipboard.writeText(msg).then(() => {
        showToast(`Credentials for '${user.username}' copied to clipboard!`);
    }).catch(() => {});
}

closeShareModalBtn?.addEventListener('click', () => shareModal?.classList.remove('open'));
closeShareModalFooterBtn?.addEventListener('click', () => shareModal?.classList.remove('open'));

copyShareMessageBtn?.addEventListener('click', () => {
    if (shareMessageTextarea) {
        navigator.clipboard.writeText(shareMessageTextarea.value).then(() => {
            const oldHtml = copyShareMessageBtn.innerHTML;
            copyShareMessageBtn.innerText = 'Copied to Clipboard!';
            setTimeout(() => copyShareMessageBtn.innerHTML = oldHtml, 2000);
            showToast('Credentials copied to clipboard!');
        });
    }
});

// ── EXTEND MODAL LOGIC (macOS Liquid Glass & Custom Date/Time) ──
function updateExtendPreview() {
    if (!extendCalculatedPreviewText) return;
    const val = inputCustomExtendExpiry?.value?.trim();
    if (!val) {
        extendCalculatedPreviewText.innerHTML = `<span><strong>Permanent License:</strong> This license will never expire.</span>`;
        return;
    }
    try {
        const targetDate = new Date(val);
        if (isNaN(targetDate.getTime())) {
            extendCalculatedPreviewText.innerText = 'Please select a valid date';
            return;
        }
        const now = new Date();
        const diffMs = targetDate.getTime() - now.getTime();
        const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
        const formatted = targetDate.toLocaleString(undefined, {
            weekday: 'short', month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit'
        });

        if (diffDays < 0) {
            extendCalculatedPreviewText.innerHTML = `<span style="color: #fb7185;">⚠️ Expiry set in past: ${formatted} (${Math.abs(diffDays)}d ago)</span>`;
        } else if (diffDays === 0) {
            extendCalculatedPreviewText.innerHTML = `<span>Expires <strong>Today</strong> at ${formatted}</span>`;
        } else {
            extendCalculatedPreviewText.innerHTML = `<span>New Expiry: <strong>${formatted}</strong> (in ~${diffDays} days)</span>`;
        }
    } catch (e) {
        extendCalculatedPreviewText.innerText = 'Select or adjust date above';
    }
}

function openExtendModal(username) {
    appState.targetExtendUser = username;
    const user = appState.users.find(u => u.username === username);

    if (extendModalUsername) extendModalUsername.innerText = username;
    if (extendModalAvatar) {
        extendModalAvatar.innerText = (user?.displayName || username || 'U').charAt(0).toUpperCase();
    }

    if (user) {
        const expInfo = formatExpiryDate(user.expiryDate);
        if (extendModalStatusBadge) {
            extendModalStatusBadge.className = `status-badge ${expInfo.badgeClass}`;
            extendModalStatusBadge.innerText = expInfo.isExpired ? 'Expired' : (user.isActive ? 'Active' : 'Suspended');
        }
        if (extendModalCurrentExpiryText) {
            extendModalCurrentExpiryText.innerText = `Current Expiry: ${expInfo.text}`;
        }

        // Compute sensible default: if current expiry is in future, add +7 days from it; else +7 days from now
        let defaultDate;
        if (user.expiryDate && !expInfo.isExpired) {
            defaultDate = new Date(new Date(user.expiryDate).getTime() + 7 * 24 * 60 * 60 * 1000);
        } else {
            defaultDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        }

        if (inputCustomExtendExpiry) {
            inputCustomExtendExpiry.value = toLocalDatetimeInput(defaultDate);
        }
    } else {
        const fallback = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        if (inputCustomExtendExpiry) {
            inputCustomExtendExpiry.value = toLocalDatetimeInput(fallback);
        }
    }

    // Reset presets visual state and highlight +7 Days by default
    extendPresetBtns.forEach(btn => btn.classList.remove('active'));
    const default7Btn = Array.from(extendPresetBtns).find(b => b.getAttribute('data-days') === '7');
    if (default7Btn) default7Btn.classList.add('active');

    updateExtendPreview();
    extendModal.classList.add('open');
}

function closeExtendModal() {
    extendModal.classList.remove('open');
    appState.targetExtendUser = null;
}

closeExtendModalBtn?.addEventListener('click', closeExtendModal);
closeExtendModalDot?.addEventListener('click', closeExtendModal);
cancelExtendModalBtn?.addEventListener('click', closeExtendModal);

// Preset chips: calculate target date and update the custom datetime input in real-time
extendPresetBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        const days = parseInt(btn.getAttribute('data-days'), 10);
        const username = appState.targetExtendUser;
        const user = appState.users.find(u => u.username === username);

        let baseTime = Date.now();
        if (user && user.expiryDate) {
            const expTime = new Date(user.expiryDate).getTime();
            if (expTime > baseTime) {
                baseTime = expTime; // extend from current unexpired timestamp
            }
        }

        const newTargetDate = new Date(baseTime + days * 24 * 60 * 60 * 1000);
        if (inputCustomExtendExpiry) {
            inputCustomExtendExpiry.value = toLocalDatetimeInput(newTargetDate);
            updateExtendPreview();
        }

        extendPresetBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
    });
});

// Real-time custom datetime typing/picking listener
inputCustomExtendExpiry?.addEventListener('input', () => {
    extendPresetBtns.forEach(b => b.classList.remove('active'));
    updateExtendPreview();
});

// Set Permanent (Never expires)
setPermanentExpiryBtn?.addEventListener('click', () => {
    if (inputCustomExtendExpiry) {
        inputCustomExtendExpiry.value = '';
    }
    extendPresetBtns.forEach(b => b.classList.remove('active'));
    updateExtendPreview();
});

// Save Custom Expiration Date & Time
saveCustomExtendBtn?.addEventListener('click', async () => {
    const username = appState.targetExtendUser;
    if (!username) return;

    const rawVal = inputCustomExtendExpiry?.value?.trim();
    let isoString = null;

    if (rawVal) {
        const parsed = new Date(rawVal);
        if (isNaN(parsed.getTime())) {
            showToast('Please select a valid expiration date and time.', 'error');
            return;
        }
        isoString = parsed.toISOString();
    }

    saveCustomExtendBtn.disabled = true;
    saveCustomExtendBtn.innerText = 'Updating...';

    try {
        await setUserExactExpiry(username, isoString);
        if (isoString) {
            const niceDate = new Date(isoString).toLocaleDateString(undefined, {
                year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
            });
            showToast(`License for '${username}' updated to ${niceDate}!`);
        } else {
            showToast(`License for '${username}' updated to Permanent (Never expires)!`);
        }

        closeExtendModal();
        renderUsers();

        // Refresh active user detail drawer if currently open for this student
        if (currentDetailUser && currentDetailUser.username === username) {
            const updated = appState.users.find(u => u.username === username);
            if (updated) openUserDetailModal(updated);
        }
    } catch (err) {
        showToast(`Failed to update expiration: ${err.message}`, 'error');
    } finally {
        saveCustomExtendBtn.disabled = false;
        saveCustomExtendBtn.innerHTML = `
            <svg class="svg-icon" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"></polyline></svg>
            <span>Update Expiration</span>
        `;
    }
});

// Wire up Custom Expiry button in User Detail Modal
detailExtendCustomBtn?.addEventListener('click', () => {
    if (currentDetailUser) {
        openExtendModal(currentDetailUser.username);
    }
});

// Wire up macOS Window Close Dots across modals
closeDetailModalDot?.addEventListener('click', closeUserDetailModal);
closeUserModalDot?.addEventListener('click', closeUserModal);
closeCsvModalDot?.addEventListener('click', () => csvModal?.classList.remove('open'));
closeShareModalDot?.addEventListener('click', () => shareModal?.classList.remove('open'));

// ── GEMINI API KEY SETTINGS ──
toggleGlobalKeyVisibilityBtn?.addEventListener('click', () => {
    if (globalApiKeyInput.type === 'password') {
        globalApiKeyInput.type = 'text';
        toggleGlobalKeyVisibilityBtn.innerText = 'Hide';
    } else {
        globalApiKeyInput.type = 'password';
        toggleGlobalKeyVisibilityBtn.innerText = 'Show';
    }
});

saveGlobalConfigBtn?.addEventListener('click', async () => {
    const key = globalApiKeyInput.value.trim();
    saveGlobalConfigBtn.disabled = true;
    saveGlobalConfigBtn.innerText = 'Saving...';

    try {
        await saveAdminGeminiKey(key);
        showToast('Dedicated Gemini API Key saved to admin account!');
    } catch (err) {
        showToast(`Failed to save Key: ${err.message}`, 'error');
    } finally {
        saveGlobalConfigBtn.disabled = false;
        saveGlobalConfigBtn.innerHTML = `
            <svg class="svg-icon" viewBox="0 0 24 24"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg>
            <span>Save API Key</span>
        `;
    }
});

testGlobalApiKeyBtn?.addEventListener('click', async () => {
    const key = globalApiKeyInput.value.trim();
    if (!key) {
        showToast('Please enter an API Key to test.', 'error');
        return;
    }

    testGlobalApiKeyBtn.disabled = true;
    testGlobalApiKeyBtn.innerText = 'Testing...';
    if (apiKeyTestResult) {
        apiKeyTestResult.style.display = 'block';
        apiKeyTestResult.innerHTML = '<div style="font-size: 12.5px; color: #38bdf8;">Connecting to Google Generative Language API...</div>';
    }

    const res = await testGeminiApiKey(key);
    testGlobalApiKeyBtn.disabled = false;
    testGlobalApiKeyBtn.innerHTML = `
        <svg class="svg-icon" viewBox="0 0 24 24"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>
        <span>Test API Key Live</span>
    `;

    if (res.success) {
        apiKeyTestResult.innerHTML = `
            <div style="background: rgba(16, 185, 129, 0.12); border: 1px solid rgba(16, 185, 129, 0.35); padding: 14px; border-radius: var(--radius-md);">
                <div style="font-weight: 600; color: #34d399; font-size: 13px;">Gemini API Key is Valid & Active!</div>
                <div style="font-size: 11.5px; color: #cbd5e1; margin-top: 4px;">
                    Model: <b>${res.model}</b> | Latency: <b>${res.latencyMs}ms</b> | Sample Response: <code>"${res.reply}"</code>
                </div>
            </div>
        `;
        showToast('Gemini API Key verified successfully!');
    } else {
        apiKeyTestResult.innerHTML = `
            <div style="background: rgba(244, 63, 94, 0.12); border: 1px solid rgba(244, 63, 94, 0.35); padding: 14px; border-radius: var(--radius-md);">
                <div style="font-weight: 600; color: #fb7185; font-size: 13px;">Gemini API Key Verification Failed</div>
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
                const oldHtml = btn.innerHTML;
                btn.innerText = 'Copied!';
                setTimeout(() => btn.innerHTML = oldHtml, 2000);
                showToast('Rules copied to clipboard!');
            });
        }
    });
});

recheckCloudBtn?.addEventListener('click', () => {
    recheckCloudBtn.disabled = true;
    testCloudConnection().then(() => {
        recheckCloudBtn.disabled = false;
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
                        <td style="font-size: 12px; color: var(--text-dim); font-family: monospace;">${ts ? new Date(ts).toLocaleString() : '-'}</td>
                        <td style="font-weight: 600; color: #38bdf8;">${user}</td>
                        <td><span class="status-badge badge-active">${action}</span></td>
                        <td style="font-size: 12px; color: #cbd5e1;">${details}</td>
                    `;
                    tableBody.appendChild(row);
                });
                return;
            }
        }
    } catch (e) { }

    if (emptyState) emptyState.style.display = 'flex';
}

// ── MULTI-TENANT ADMIN AUTHENTICATION ──
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
        submitAdminLoginBtn.innerHTML = `
            <svg class="svg-icon" viewBox="0 0 24 24"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"></path><polyline points="10 17 15 12 10 7"></polyline><line x1="15" y1="12" x2="3" y2="12"></line></svg>
            <span>Authenticate to Dashboard</span>
        `;
    }
});

// Admin Logout
adminLogoutBtn?.addEventListener('click', () => {
    logoutAdmin();
    showToast('Signed out of admin dashboard.', 'info');
    if (loginAdminPassword) loginAdminPassword.value = '';
    loginAdminId?.focus();
});

// ── INITIALIZE PORTAL ──
subscribeToState((state) => {
    appState.admin = state.admin;
    appState.users = state.users;
    appState.config = state.config;
    appState.connection = state.connection;

    syncAdminAuthUI(state.admin);

    if (globalApiKeyInput && !globalApiKeyInput.value && state.config.globalGeminiApiKey) {
        globalApiKeyInput.value = state.config.globalGeminiApiKey;
    }

    updateConnectionUI(state.connection);
    renderUsers();
});

// Initial check for active session
syncAdminAuthUI(getCurrentAdmin());

// Realtime sync with Firebase
initRealtimeSync();
