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
    targetExtendUser: null
};

// UI Elements
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

// Admin Auth & Profile Elements
const adminAuthOverlay = document.getElementById('adminAuthOverlay');
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

// ── TOAST HELPER ──
function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    const icon = type === 'success' ? '✅' : (type === 'error' ? '❌' : 'ℹ️');
    toast.innerHTML = `<span>${icon}</span> <span>${message}</span>`;
    toastContainer.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(10px)';
        toast.style.transition = 'all 0.25s ease';
        setTimeout(() => toast.remove(), 250);
    }, 3500);
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
                    <span class="badge badge-device-locked">🔒 Bound</span>
                    <div class="device-info-tag">
                        <div style="font-weight: 500; color: #f1f5f9;">${u.boundDeviceName || 'Device'}</div>
                        <span class="device-id-mono" title="${u.boundDeviceId}">${shortDev}</span>
                    </div>
                    <button class="btn btn-secondary btn-sm unbind-device-btn" data-user="${u.username}" title="Reset single-device lock so user can switch computers" style="color: #fca5a5; border-color: rgba(239, 68, 68, 0.3);">
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
    if (!admin) {
        if (adminAuthOverlay) adminAuthOverlay.style.display = 'flex';
        if (adminProfilePill) adminProfilePill.style.display = 'none';
        if (settingsAdminHandle) settingsAdminHandle.innerText = '@login-required';
    } else {
        if (adminAuthOverlay) adminAuthOverlay.style.display = 'none';
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

// Start Realtime Synchronization with Firebase
initRealtimeSync();
