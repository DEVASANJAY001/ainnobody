// Admin Portal - Multi-Tenant Firebase Service Layer
// Supports isolated Admin accounts (admins/{adminId}), scoped student users (users/{userId}),
// single-device binding, and dedicated per-admin Gemini API keys.

import { initializeApp } from "firebase/app";
import { 
    getFirestore, 
    collection, 
    doc, 
    setDoc, 
    getDoc, 
    getDocs, 
    deleteDoc, 
    updateDoc, 
    onSnapshot, 
    query, 
    where 
} from "firebase/firestore";

export const firebaseConfig = {
    apiKey: (typeof import.meta !== "undefined" && import.meta.env?.VITE_FIREBASE_API_KEY) || "AIzaSyDnxlseFpHyeiYLuCa8u46h9w7F_OL5PLw",
    authDomain: (typeof import.meta !== "undefined" && import.meta.env?.VITE_FIREBASE_AUTH_DOMAIN) || "buss-60c92.firebaseapp.com",
    projectId: (typeof import.meta !== "undefined" && import.meta.env?.VITE_FIREBASE_PROJECT_ID) || "buss-60c92",
    storageBucket: (typeof import.meta !== "undefined" && import.meta.env?.VITE_FIREBASE_STORAGE_BUCKET) || "buss-60c92.firebasestorage.app",
    messagingSenderId: (typeof import.meta !== "undefined" && import.meta.env?.VITE_FIREBASE_MESSAGING_SENDER_ID) || "437938732668",
    appId: (typeof import.meta !== "undefined" && import.meta.env?.VITE_FIREBASE_APP_ID) || "1:437938732668:web:6ac6a48d442dcb516453f9",
    measurementId: (typeof import.meta !== "undefined" && import.meta.env?.VITE_FIREBASE_MEASUREMENT_ID) || "G-TJWK77P8D8",
    rtdbUrl: (typeof import.meta !== "undefined" && import.meta.env?.VITE_FIREBASE_RTDB_URL) || "https://buss-60c92-default-rtdb.firebaseio.com"
};

// Initialize Firebase App
export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

// In-memory cache & state keys
const LOCAL_STORAGE_USERS = "lms_admin_portal_users";
const LOCAL_STORAGE_LICENSES = "lms_admin_portal_licenses";
const LOCAL_STORAGE_ADMINS = "lms_admin_portal_admins";
const LOCAL_STORAGE_SESSION = "lms_admin_active_session";
const LOCAL_STORAGE_CONFIG = "lms_admin_portal_config";

let usersCache = [];
let licensesCache = [];
let adminsCache = [];
let currentAdmin = null;
let globalConfigCache = { globalGeminiApiKey: "" };
let connectionStatus = { connected: false, mode: "checking", error: null };
let listeners = [];

// Load persisted caches
try {
    const savedU = localStorage.getItem(LOCAL_STORAGE_USERS);
    if (savedU) usersCache = JSON.parse(savedU);
    const savedL = localStorage.getItem(LOCAL_STORAGE_LICENSES);
    if (savedL) licensesCache = JSON.parse(savedL);
    const savedA = localStorage.getItem(LOCAL_STORAGE_ADMINS);
    if (savedA) {
        adminsCache = JSON.parse(savedA);
    }
    const savedS = localStorage.getItem(LOCAL_STORAGE_SESSION);
    if (savedS) {
        currentAdmin = JSON.parse(savedS);
    }
    const savedC = localStorage.getItem(LOCAL_STORAGE_CONFIG);
    if (savedC) globalConfigCache = JSON.parse(savedC);
} catch (e) { }

function persistLocalData() {
    try {
        localStorage.setItem(LOCAL_STORAGE_USERS, JSON.stringify(usersCache));
        localStorage.setItem(LOCAL_STORAGE_LICENSES, JSON.stringify(licensesCache));
        localStorage.setItem(LOCAL_STORAGE_ADMINS, JSON.stringify(adminsCache));
        localStorage.setItem(LOCAL_STORAGE_CONFIG, JSON.stringify(globalConfigCache));
        if (currentAdmin) {
            localStorage.setItem(LOCAL_STORAGE_SESSION, JSON.stringify(currentAdmin));
        } else {
            localStorage.removeItem(LOCAL_STORAGE_SESSION);
        }
    } catch (e) { }
}

// ── MULTI-TENANT FILTERED STATE SUBSCRIBER ──
export function subscribeToState(fn) {
    listeners.push(fn);
    notifySingleListener(fn);
    return () => {
        listeners = listeners.filter(l => l !== fn);
    };
}

function notifySingleListener(fn) {
    // If not authenticated as an admin, NEVER expose student data or config!
    if (!currentAdmin || !currentAdmin.adminId) {
        fn({
            admin: null,
            users: [],
            licenses: [],
            config: { globalGeminiApiKey: "" },
            connection: { ...connectionStatus }
        });
        return;
    }

    // Isolate users: Admin only sees their own students & licenses!
    const scopedUsers = usersCache.filter(u => u.adminId === currentAdmin.adminId);
    const scopedLicenses = licensesCache.filter(l => !l.adminId || l.adminId === currentAdmin.adminId);

    const scopedConfig = {
        globalGeminiApiKey: (currentAdmin && currentAdmin.geminiApiKey) 
            ? currentAdmin.geminiApiKey 
            : (globalConfigCache.globalGeminiApiKey || "")
    };

    fn({
        admin: { ...currentAdmin },
        users: [...scopedUsers],
        licenses: [...scopedLicenses],
        config: scopedConfig,
        connection: { ...connectionStatus }
    });
}

function notifyState() {
    persistLocalData();
    listeners.forEach(fn => notifySingleListener(fn));
}

// ── ADMIN AUTHENTICATION & MANAGEMENT ──

export function getCurrentAdmin() {
    return currentAdmin ? { ...currentAdmin } : null;
}

export function setCurrentAdmin(admin) {
    if (admin) {
        // Strip out sensitive password fields before caching session
        const safe = { ...admin };
        delete safe.password;
        delete safe.passwordHash;
        currentAdmin = safe;
    } else {
        currentAdmin = null;
    }
    notifyState();
}

export function logoutAdmin() {
    currentAdmin = null;
    usersCache = [];
    licensesCache = [];
    stopRealtimeSync();
    notifyState();
}

// ── CRYPTOGRAPHIC SHA-256 HASH FOR SECURE CREDENTIALS ──
export async function hashPassword(plainText) {
    if (!plainText) return "";
    try {
        const encoder = new TextEncoder();
        const data = encoder.encode(plainText.trim() + "_lms_secure_salt_#2026");
        const hashBuffer = await crypto.subtle.digest("SHA-256", data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
    } catch (e) {
        let hash = 0;
        const str = plainText.trim() + "_lms_secure_salt_#2026";
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash |= 0;
        }
        return "h_" + Math.abs(hash).toString(16);
    }
}

// Register New Admin Account
export async function registerAdmin(adminData) {
    const adminId = adminData.adminId.trim().toLowerCase();
    if (!adminId) throw new Error("Admin ID is required.");
    if (!adminData.password) throw new Error("Password is required.");

    const passwordHash = await hashPassword(adminData.password);

    const payload = {
        adminId: adminId,
        displayName: adminData.displayName ? adminData.displayName.trim() : adminId,
        passwordHash: passwordHash, // Cryptographically secured with SHA-256
        geminiApiKey: adminData.geminiApiKey ? adminData.geminiApiKey.trim() : "",
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString()
    };

    // 1. Check if admin ID already exists in Firestore
    try {
        const adminDoc = await getDoc(doc(db, "admins", adminId));
        if (adminDoc.exists()) {
            throw new Error(`Admin ID '${adminId}' is already registered. Please choose another ID or Sign In.`);
        }
        await setDoc(doc(db, "admins", adminId), payload);
    } catch (err) {
        if (err.message && err.message.includes("already registered")) throw err;
        // RTDB fallback
        try {
            await fetch(`${firebaseConfig.rtdbUrl}/admins/${encodeURIComponent(adminId)}.json`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });
        } catch (e) { }
    }

    // Check local cache
    const existing = adminsCache.find(a => a.adminId === adminId);
    if (existing) {
        throw new Error(`Admin ID '${adminId}' already exists locally.`);
    }
    adminsCache.push(payload);
    setCurrentAdmin(payload);
    return { success: true, admin: payload };
}

// Login Admin Account
export async function loginAdmin(adminId, password) {
    const cleanId = adminId.trim().toLowerCase();
    let admin = null;

    // 1. Try Firestore
    try {
        const snap = await getDoc(doc(db, "admins", cleanId));
        if (snap.exists()) {
            admin = snap.data();
        }
    } catch (e) {
        console.warn("Firestore admin lookup error:", e);
    }

    // 2. Try RTDB
    if (!admin) {
        try {
            const res = await fetch(`${firebaseConfig.rtdbUrl}/admins/${encodeURIComponent(cleanId)}.json`);
            if (res.ok) {
                const data = await res.json();
                if (data && typeof data === "object") admin = data;
            }
        } catch (e) { }
    }

    // 3. Try LocalStorage backup
    if (!admin) {
        admin = adminsCache.find(a => a.adminId === cleanId);
    }

    if (!admin) {
        throw new Error(`Admin ID '${cleanId}' not found. Please check credentials.`);
    }

    // Cryptographic Password Verification
    const inputHash = await hashPassword(password);
    const isHashMatch = admin.passwordHash && admin.passwordHash === inputHash;
    const isPlainMatch = admin.password && String(admin.password).trim() === String(password).trim();

    if (!isHashMatch && !isPlainMatch) {
        throw new Error("Incorrect Admin Password.");
    }

    // Automatically migrate legacy plaintext password to secure SHA-256 hash
    if (!admin.passwordHash) {
        admin.passwordHash = inputHash;
        delete admin.password;
        try {
            await updateDoc(doc(db, "admins", cleanId), { 
                passwordHash: inputHash,
                password: null,
                lastLogin: new Date().toISOString()
            });
        } catch (e) { }
    } else {
        admin.lastLogin = new Date().toISOString();
        try {
            await updateDoc(doc(db, "admins", cleanId), { lastLogin: admin.lastLogin });
        } catch (e) { }
    }

    setCurrentAdmin(admin);
    return { success: true, admin };
}

// Save Admin's Dedicated Gemini API Key
export async function saveAdminGeminiKey(apiKey) {
    if (!currentAdmin || !currentAdmin.adminId) throw new Error("Unauthorized: Sign in required.");
    const cleanKey = apiKey ? apiKey.trim() : "";

    currentAdmin.geminiApiKey = cleanKey;
    
    // Update local cache
    const idx = adminsCache.findIndex(a => a.adminId === currentAdmin.adminId);
    if (idx >= 0) adminsCache[idx].geminiApiKey = cleanKey;

    // Save to Firestore
    try {
        const adminRef = doc(db, "admins", currentAdmin.adminId);
        await updateDoc(adminRef, {
            geminiApiKey: cleanKey,
            updatedAt: new Date().toISOString()
        });
    } catch (e) {
        // Fallback RTDB
        try {
            await fetch(`${firebaseConfig.rtdbUrl}/admins/${encodeURIComponent(currentAdmin.adminId)}.json`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ geminiApiKey: cleanKey })
            });
        } catch (err) { }
    }

    setCurrentAdmin(currentAdmin);
    return { success: true };
}

// Save Global or Admin Gemini Key
export async function saveGlobalConfig(config) {
    if (!currentAdmin || !currentAdmin.adminId) throw new Error("Unauthorized: Sign in required.");
    const key = (typeof config === 'string' ? config : (config?.globalGeminiApiKey || "")).trim();
    await saveAdminGeminiKey(key);
    globalConfigCache.globalGeminiApiKey = key;
    try {
        await setDoc(doc(db, "system_settings", "config"), { globalGeminiApiKey: key }, { merge: true });
    } catch (e) {
        try {
            await fetch(`${firebaseConfig.rtdbUrl}/system_settings/config.json`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ globalGeminiApiKey: key })
            });
        } catch (err) { }
    }
    notifyState();
    return { success: true };
}

// ── TEST CLOUD CONNECTION ──
export async function testCloudConnection() {
    connectionStatus.mode = "checking";
    notifyState();

    // 1. Try Firestore
    try {
        const testRef = doc(db, "system_settings", "config");
        const snap = await getDoc(testRef);
        connectionStatus = { connected: true, mode: "firestore", error: null };
        if (snap.exists()) {
            globalConfigCache = { ...globalConfigCache, ...snap.data() };
        }
        notifyState();
        return { success: true, mode: "firestore" };
    } catch (err) {
        console.warn("Firestore connection check error:", err);
        const errMsg = err.message || "";

        if (errMsg.includes("permission-denied") || errMsg.includes("insufficient permissions")) {
            connectionStatus = { 
                connected: false, 
                mode: "permission_denied", 
                error: "Firestore Security Rules deny access. Please update rules in Firebase Console (see Setup Guide tab)." 
            };
            notifyState();
            return { success: false, mode: "permission_denied", error: connectionStatus.error };
        }

        try {
            const rtdbRes = await fetch(`${firebaseConfig.rtdbUrl}/system_settings/config.json`);
            if (rtdbRes.ok) {
                const data = await rtdbRes.json();
                if (data) globalConfigCache = { ...globalConfigCache, ...data };
                connectionStatus = { connected: true, mode: "rtdb", error: null };
                notifyState();
                return { success: true, mode: "rtdb" };
            }
        } catch (e) { }

        connectionStatus = { connected: false, mode: "error", error: errMsg };
        notifyState();
        return { success: false, mode: "error", error: errMsg };
    }
}

// ── INITIALIZE REALTIME SYNC (STRICTLY GATED TO AUTHENTICATED ADMIN) ──
let usersUnsubscribe = null;
let licensesUnsubscribe = null;
let configUnsubscribe = null;
let rtdbPollInterval = null;

export function stopRealtimeSync() {
    if (usersUnsubscribe) {
        try { usersUnsubscribe(); } catch(e){}
        usersUnsubscribe = null;
    }
    if (licensesUnsubscribe) {
        try { licensesUnsubscribe(); } catch(e){}
        licensesUnsubscribe = null;
    }
    if (configUnsubscribe) {
        try { configUnsubscribe(); } catch(e){}
        configUnsubscribe = null;
    }
    if (rtdbPollInterval) {
        try { clearInterval(rtdbPollInterval); } catch(e){}
        rtdbPollInterval = null;
    }
    usersCache = [];
    licensesCache = [];
    notifyState();
}

export async function syncLicensesFromRtdb() {
    try {
        const [resKeys, resUsers] = await Promise.all([
            fetch(`${firebaseConfig.rtdbUrl}/license_keys.json`).catch(() => null),
            fetch(`${firebaseConfig.rtdbUrl}/users.json`).catch(() => null)
        ]);

        let keysData = null;
        let usersData = null;

        if (resKeys && resKeys.ok) {
            keysData = await resKeys.json();
        }
        if (resUsers && resUsers.ok) {
            usersData = await resUsers.json();
        }

        const licensesMap = new Map();

        // 1. Load keys from /license_keys.json
        if (keysData && typeof keysData === "object") {
            Object.keys(keysData).forEach(k => {
                if (keysData[k]) {
                    const item = { key: k, id: k, ...keysData[k] };
                    if (!Array.isArray(item.registeredUsers)) item.registeredUsers = [];
                    licensesMap.set(k, item);
                }
            });
        }

        // 2. Load keys and registered users from /users.json
        const studentList = [];
        if (usersData && typeof usersData === "object") {
            Object.keys(usersData).forEach(k => {
                const item = usersData[k];
                if (!item) return;

                if (k.startsWith("KEY_")) {
                    const cleanKey = k.replace(/^KEY_/, "");
                    const existing = licensesMap.get(cleanKey) || { key: cleanKey, id: cleanKey };
                    const mergedRegUsers = Array.isArray(item.registeredUsers) && item.registeredUsers.length > 0
                        ? item.registeredUsers
                        : (existing.registeredUsers || []);
                    licensesMap.set(cleanKey, {
                        ...existing,
                        ...item,
                        key: cleanKey,
                        id: cleanKey,
                        registeredUsers: mergedRegUsers,
                        registeredCount: mergedRegUsers.length
                    });
                } else if (k.startsWith("REG_")) {
                    const cleanId = k.replace(/^REG_/, "");
                    studentList.push({ id: cleanId, userId: cleanId, ...item });
                } else if (/^\d{8}$/.test(k)) {
                    studentList.push({ id: k, userId: k, ...item });
                }
            });
        }

        // 3. For any student without adminId, match with their license's adminId
        const activeAdminId = currentAdmin?.adminId || "";
        studentList.forEach(s => {
            if (!s.adminId) {
                if (s.licenseKey && licensesMap.has(s.licenseKey)) {
                    s.adminId = licensesMap.get(s.licenseKey).adminId || activeAdminId;
                } else {
                    s.adminId = activeAdminId;
                }
            }
        });

        // 4. Also collect any student IDs belonging to each license
        licensesMap.forEach((lic, key) => {
            const studentsForThisKey = studentList
                .filter(s => s.licenseKey === key || (s.id && (lic.registeredUsers || []).includes(s.id)))
                .map(s => s.userId || s.id);

            const combined = Array.from(new Set([...(lic.registeredUsers || []), ...studentsForThisKey]));
            lic.registeredUsers = combined;
            lic.registeredCount = combined.length;
        });

        if (licensesMap.size > 0) {
            licensesCache = Array.from(licensesMap.values());
        }

        if (studentList.length > 0) {
            const userMap = new Map();
            usersCache.forEach(u => userMap.set(u.id || u.userId, u));
            studentList.forEach(s => userMap.set(s.id || s.userId, { ...(userMap.get(s.id || s.userId) || {}), ...s }));
            usersCache = Array.from(userMap.values());
        }

        notifyState();
    } catch (e) {
        console.error("syncLicensesFromRtdb error:", e);
    }
}

export function initRealtimeSync() {
    // SECURITY GATE: Never sync student records unless admin is authenticated!
    if (!currentAdmin || !currentAdmin.adminId) {
        usersCache = [];
        licensesCache = [];
        notifyState();
        return;
    }

    // Always run initial RTDB sync
    syncLicensesFromRtdb();

    // Setup periodic 8s polling for background updates
    if (rtdbPollInterval) clearInterval(rtdbPollInterval);
    rtdbPollInterval = setInterval(() => {
        syncLicensesFromRtdb();
    }, 8000);

    testCloudConnection().then(() => {
        try {
            if (usersUnsubscribe) usersUnsubscribe();
            const usersCol = collection(db, "users");
            usersUnsubscribe = onSnapshot(usersCol, (snapshot) => {
                const list = [];
                snapshot.forEach(docSnap => {
                    list.push({ id: docSnap.id, ...docSnap.data() });
                });
                usersCache = list;
                connectionStatus = { connected: true, mode: "firestore", error: null };
                notifyState();
            }, (error) => {
                console.warn("Firestore onSnapshot error:", error);
                if (error.code === "permission-denied") {
                    connectionStatus = { 
                        connected: false, 
                        mode: "permission_denied", 
                        error: "Firestore rules deny read. Update rules in Firebase Console." 
                    };
                    notifyState();
                }
            });

            // License Keys Snapshot
            if (licensesUnsubscribe) licensesUnsubscribe();
            try {
                const licCol = collection(db, "license_keys");
                licensesUnsubscribe = onSnapshot(licCol, (snapshot) => {
                    const list = [];
                    snapshot.forEach(docSnap => {
                        const data = docSnap.data();
                        const existing = licensesCache.find(l => l.key === docSnap.id);
                        const regUsers = (Array.isArray(data.registeredUsers) && data.registeredUsers.length > 0)
                            ? data.registeredUsers
                            : (existing?.registeredUsers || []);
                        list.push({
                            key: docSnap.id,
                            id: docSnap.id,
                            ...data,
                            registeredUsers: regUsers,
                            registeredCount: regUsers.length
                        });
                    });
                    licensesCache = list;
                    notifyState();
                }, (error) => {
                    console.warn("Firestore license_keys onSnapshot error, falling back to RTDB:", error);
                    syncLicensesFromRtdb();
                });
            } catch (err) {
                syncLicensesFromRtdb();
            }

            if (configUnsubscribe) configUnsubscribe();
            const configDoc = doc(db, "system_settings", "config");
            configUnsubscribe = onSnapshot(configDoc, (snap) => {
                if (snap.exists()) {
                    globalConfigCache = snap.data();
                    notifyState();
                }
            }, (err) => { });
        } catch (e) {
            console.error("Failed to attach Firestore listeners:", e);
            syncLicensesFromRtdb();
        }
    });
}

// ── STUDENT USER CRUD (STRICTLY GATED TO CURRENT ADMIN) ──

export async function saveUser(userData) {
    if (!currentAdmin || !currentAdmin.adminId) {
        throw new Error("Unauthorized: Sign in required before creating or modifying student licenses.");
    }
    const username = userData.username.trim().toLowerCase();
    if (!username) throw new Error("User ID is required.");

    const adminId = currentAdmin.adminId;

    const payload = {
        username: username,
        displayName: userData.displayName || username,
        password: userData.password.trim(),
        // LMS institutional credentials & student profile
        lmsUsername: userData.lmsUsername ? userData.lmsUsername.trim() : "",
        lmsPassword: userData.lmsPassword ? userData.lmsPassword.trim() : "",
        lmsDomain: userData.lmsDomain ? userData.lmsDomain.trim() : "",
        batch: userData.batch ? userData.batch.trim() : "",
        studentEmail: userData.studentEmail ? userData.studentEmail.trim() : "",
        studentPhone: userData.studentPhone ? userData.studentPhone.trim() : "",
        expiryDate: userData.expiryDate || null,
        apiKey: userData.apiKey ? userData.apiKey.trim() : "",
        adminId: adminId, // STRICTLY ISOLATED TO THIS ADMIN
        isActive: userData.isActive !== false,
        notes: userData.notes || "",
        boundDeviceId: userData.boundDeviceId || null,
        boundDeviceName: userData.boundDeviceName || null,
        boundDeviceAt: userData.boundDeviceAt || null,
        lastLogin: userData.lastLogin || null,
        updatedAt: new Date().toISOString()
    };

    if (!payload.createdAt && !userData.id) {
        payload.createdAt = new Date().toISOString();
    }

    // 1. Save to Firestore
    try {
        const userRef = doc(db, "users", username);
        await setDoc(userRef, payload, { merge: true });
    } catch (e) {
        console.warn("Firestore save failed, using RTDB fallback:", e);
        try {
            await fetch(`${firebaseConfig.rtdbUrl}/users/${encodeURIComponent(username)}.json`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });
        } catch (err) { }
    }

    // Update local cache
    const idx = usersCache.findIndex(u => u.username === username);
    if (idx >= 0) {
        usersCache[idx] = { id: username, ...usersCache[idx], ...payload };
    } else {
        usersCache.push({ id: username, ...payload });
    }
    notifyState();

    return { success: true, username };
}

export async function deleteUser(username) {
    if (!currentAdmin || !currentAdmin.adminId) {
        throw new Error("Unauthorized: Sign in required.");
    }
    const cleanId = username.trim().toLowerCase();
    try {
        await deleteDoc(doc(db, "users", cleanId));
    } catch (e) {
        try {
            await fetch(`${firebaseConfig.rtdbUrl}/users/${encodeURIComponent(cleanId)}.json`, {
                method: "DELETE"
            });
        } catch (err) { }
    }

    usersCache = usersCache.filter(u => u.username !== cleanId && u.id !== cleanId);
    notifyState();
    return { success: true };
}

export async function unbindUserDevice(username) {
    if (!currentAdmin || !currentAdmin.adminId) {
        throw new Error("Unauthorized: Sign in required.");
    }
    const cleanId = username.trim().toLowerCase();
    const patch = {
        boundDeviceId: null,
        boundDeviceName: null,
        boundDeviceAt: null
    };

    try {
        const userRef = doc(db, "users", cleanId);
        await updateDoc(userRef, patch);
    } catch (e) {
        try {
            await fetch(`${firebaseConfig.rtdbUrl}/users/${encodeURIComponent(cleanId)}.json`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(patch)
            });
        } catch (err) { }
    }

    const idx = usersCache.findIndex(u => u.username === cleanId || u.id === cleanId);
    if (idx >= 0) {
        usersCache[idx] = { ...usersCache[idx], ...patch };
        notifyState();
    }
    return { success: true };
}

export async function extendUserExpiry(username, additionalDays) {
    if (!currentAdmin || !currentAdmin.adminId) {
        throw new Error("Unauthorized: Sign in required.");
    }
    const cleanId = username.trim().toLowerCase();
    const user = usersCache.find(u => u.username === cleanId || u.id === cleanId);
    
    let baseTime = Date.now();
    if (user?.expiryDate) {
        const existingExp = new Date(user.expiryDate).getTime();
        if (existingExp > baseTime) {
            baseTime = existingExp;
        }
    }

    const newExpiry = new Date(baseTime + (additionalDays * 24 * 60 * 60 * 1000)).toISOString();
    const patch = {
        expiryDate: newExpiry,
        isActive: true
    };

    try {
        const userRef = doc(db, "users", cleanId);
        await updateDoc(userRef, patch);
    } catch (e) {
        try {
            await fetch(`${firebaseConfig.rtdbUrl}/users/${encodeURIComponent(cleanId)}.json`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(patch)
            });
        } catch (err) { }
    }

    const idx = usersCache.findIndex(u => u.username === cleanId || u.id === cleanId);
    if (idx >= 0) {
        usersCache[idx] = { ...usersCache[idx], ...patch };
        notifyState();
    }
    return { success: true, newExpiry };
}

export async function setUserExactExpiry(username, isoDateString) {
    if (!currentAdmin || !currentAdmin.adminId) {
        throw new Error("Unauthorized: Sign in required.");
    }
    const cleanId = username.trim().toLowerCase();
    const patch = {
        expiryDate: isoDateString,
        isActive: true,
        updatedAt: new Date().toISOString()
    };

    try {
        const userRef = doc(db, "users", cleanId);
        await updateDoc(userRef, patch);
    } catch (e) {
        try {
            await fetch(`${firebaseConfig.rtdbUrl}/users/${encodeURIComponent(cleanId)}.json`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(patch)
            });
        } catch (err) { }
    }

    const idx = usersCache.findIndex(u => u.username === cleanId || u.id === cleanId);
    if (idx >= 0) {
        usersCache[idx] = { ...usersCache[idx], ...patch };
        notifyState();
    }
    return { success: true, newExpiry: isoDateString };
}

export async function toggleUserStatus(username, makeActive) {
    if (!currentAdmin || !currentAdmin.adminId) {
        throw new Error("Unauthorized: Sign in required.");
    }
    const cleanId = username.trim().toLowerCase();
    const patch = { isActive: !!makeActive };

    try {
        const userRef = doc(db, "users", cleanId);
        await updateDoc(userRef, patch);
    } catch (e) {
        try {
            await fetch(`${firebaseConfig.rtdbUrl}/users/${encodeURIComponent(cleanId)}.json`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(patch)
            });
        } catch (err) { }
    }

    const idx = usersCache.findIndex(u => u.username === cleanId || u.id === cleanId);
    if (idx >= 0) {
        usersCache[idx] = { ...usersCache[idx], ...patch };
        notifyState();
    }
    return { success: true, isActive: !!makeActive };
}

// ── TEST GEMINI API KEY REALTIME ──
export async function testGeminiApiKey(apiKey) {
    const key = apiKey ? apiKey.trim() : (currentAdmin?.geminiApiKey || globalConfigCache.globalGeminiApiKey);
    if (!key) {
        return { success: false, error: "Please provide a Gemini API key to test." };
    }

    const startTime = Date.now();
    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${key}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                contents: [{ parts: [{ text: "Respond with single word: OK" }] }]
            })
        });

        const latency = Date.now() - startTime;
        if (response.ok) {
            const data = await response.json();
            const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || "OK";
            return { 
                success: true, 
                latencyMs: latency, 
                model: "gemini-2.5-flash",
                reply: text.trim() 
            };
        } else {
            const err = await response.json().catch(() => ({}));
            const msg = err?.error?.message || `HTTP ${response.status}`;
            return { success: false, error: msg, latencyMs: latency };
        }
    } catch (err) {
        return { success: false, error: err.message, latencyMs: Date.now() - startTime };
    }
}

// ── WINDOWS-STYLE PRODUCT ACTIVATION KEYS (ONE-TIME, HARDWARE-LOCKED, 5-USER TRACKED) ──

export function generateWindowsLicenseKey() {
    const chars = "2346789BCDFGHJKMNPQRTVWXY";
    const getRandomSeg = () => {
        let seg = "";
        const cryptoObj = (typeof window !== "undefined" && (window.crypto || window.msCrypto));
        if (cryptoObj && cryptoObj.getRandomValues) {
            const arr = new Uint8Array(5);
            cryptoObj.getRandomValues(arr);
            for (let i = 0; i < 5; i++) {
                seg += chars[arr[i] % chars.length];
            }
        } else {
            for (let i = 0; i < 5; i++) {
                seg += chars.charAt(Math.floor(Math.random() * chars.length));
            }
        }
        return seg;
    };
    return `${getRandomSeg()}-${getRandomSeg()}-${getRandomSeg()}-${getRandomSeg()}-${getRandomSeg()}`;
}

export async function createLicenseKeys({ durationDays, notes, count = 1 }) {
    if (!currentAdmin || !currentAdmin.adminId) {
        throw new Error("Unauthorized: Sign in required before creating product keys.");
    }

    const qty = Math.max(1, Math.min(50, parseInt(count) || 1));
    const days = Math.max(1, parseInt(durationDays) || 30);
    const createdKeys = [];

    for (let i = 0; i < qty; i++) {
        let key = generateWindowsLicenseKey();
        while (licensesCache.some(l => l.key === key)) {
            key = generateWindowsLicenseKey();
        }

        const payload = {
            key: key,
            adminId: currentAdmin.adminId,
            durationDays: days,
            status: "UNUSED", // UNUSED | ACTIVE | EXPIRED | REVOKED
            createdAt: new Date().toISOString(),
            activatedAt: null,
            expiresAt: null,
            hardwareId: null,
            machineName: null,
            isOneTimeUsed: false,
            registeredUsers: [],
            maxUsers: 5,
            notes: notes ? String(notes).trim() : "",
            updatedAt: new Date().toISOString()
        };

        // 1. Save to Firestore
        try {
            const keyRef = doc(db, "license_keys", key);
            await setDoc(keyRef, payload, { merge: true });
        } catch (e) {
            console.warn("Firestore save failed for key:", key, e);
        }

        // 2. Save to RTDB (both /license_keys and /users/KEY_ for instant compatibility)
        try {
            await fetch(`${firebaseConfig.rtdbUrl}/license_keys/${encodeURIComponent(key)}.json`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });
        } catch (err) { }

        try {
            await fetch(`${firebaseConfig.rtdbUrl}/users/KEY_${encodeURIComponent(key)}.json`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });
        } catch (err) { }

        // Update local cache
        const idx = licensesCache.findIndex(l => l.key === key);
        if (idx >= 0) {
            licensesCache[idx] = { ...payload };
        } else {
            licensesCache.push({ ...payload });
        }

        createdKeys.push(payload);
    }

    notifyState();
    return { success: true, keys: createdKeys };
}

export async function extendLicenseKey(key, additionalDays) {
    if (!currentAdmin || !currentAdmin.adminId) {
        throw new Error("Unauthorized: Sign in required.");
    }
    const cleanKey = String(key).trim().toUpperCase();
    const lic = licensesCache.find(l => l.key === cleanKey);
    const extra = parseInt(additionalDays) || 30;

    let patch = {};
    if (lic && lic.expiresAt) {
        let baseTime = Date.now();
        const existingExp = new Date(lic.expiresAt).getTime();
        if (existingExp > baseTime) baseTime = existingExp;
        const newExpiry = new Date(baseTime + (extra * 24 * 60 * 60 * 1000)).toISOString();
        patch = {
            expiresAt: newExpiry,
            status: "ACTIVE",
            updatedAt: new Date().toISOString()
        };
    } else {
        const curDur = (lic && lic.durationDays) ? lic.durationDays : 30;
        patch = {
            durationDays: curDur + extra,
            updatedAt: new Date().toISOString()
        };
    }

    try {
        await updateDoc(doc(db, "license_keys", cleanKey), patch);
    } catch(e) { }

    try {
        await fetch(`${firebaseConfig.rtdbUrl}/license_keys/${encodeURIComponent(cleanKey)}.json`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(patch)
        });
        await fetch(`${firebaseConfig.rtdbUrl}/users/KEY_${encodeURIComponent(cleanKey)}.json`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(patch)
        });
    } catch (e) { }

    const idx = licensesCache.findIndex(l => l.key === cleanKey);
    if (idx >= 0) {
        licensesCache[idx] = { ...licensesCache[idx], ...patch };
        notifyState();
    }

    return { success: true, patch };
}

export async function resetLicenseKeyDevice(key) {
    if (!currentAdmin || !currentAdmin.adminId) {
        throw new Error("Unauthorized: Sign in required.");
    }
    const cleanKey = String(key).trim().toUpperCase();
    const patch = {
        hardwareId: null,
        machineName: null,
        isOneTimeUsed: false,
        status: "UNUSED",
        activatedAt: null,
        expiresAt: null,
        registeredUsers: [],
        updatedAt: new Date().toISOString()
    };

    try {
        await updateDoc(doc(db, "license_keys", cleanKey), patch);
    } catch(e) { }

    try {
        await fetch(`${firebaseConfig.rtdbUrl}/license_keys/${encodeURIComponent(cleanKey)}.json`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(patch)
        });
        await fetch(`${firebaseConfig.rtdbUrl}/users/KEY_${encodeURIComponent(cleanKey)}.json`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(patch)
        });
    } catch (e) { }

    const idx = licensesCache.findIndex(l => l.key === cleanKey);
    if (idx >= 0) {
        licensesCache[idx] = { ...licensesCache[idx], ...patch };
        notifyState();
    }

    return { success: true };
}

export async function toggleLicenseKeyRevoke(key, revoke) {
    if (!currentAdmin || !currentAdmin.adminId) {
        throw new Error("Unauthorized: Sign in required.");
    }
    const cleanKey = String(key).trim().toUpperCase();
    const lic = licensesCache.find(l => l.key === cleanKey);
    const newStatus = revoke ? "REVOKED" : (lic && lic.hardwareId ? "ACTIVE" : "UNUSED");
    const patch = {
        status: newStatus,
        updatedAt: new Date().toISOString()
    };

    try {
        await updateDoc(doc(db, "license_keys", cleanKey), patch);
    } catch(e) { }

    try {
        await fetch(`${firebaseConfig.rtdbUrl}/license_keys/${encodeURIComponent(cleanKey)}.json`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(patch)
        });
        await fetch(`${firebaseConfig.rtdbUrl}/users/KEY_${encodeURIComponent(cleanKey)}.json`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(patch)
        });
    } catch (e) { }

    const idx = licensesCache.findIndex(l => l.key === cleanKey);
    if (idx >= 0) {
        licensesCache[idx] = { ...licensesCache[idx], ...patch };
        notifyState();
    }

    return { success: true, status: newStatus };
}

export async function clearKeyRegisteredUsers(key) {
    if (!currentAdmin || !currentAdmin.adminId) {
        throw new Error("Unauthorized: Sign in required.");
    }
    const cleanKey = String(key).trim().toUpperCase();
    const patch = {
        registeredUsers: [],
        updatedAt: new Date().toISOString()
    };

    try {
        await updateDoc(doc(db, "license_keys", cleanKey), patch);
    } catch(e) { }

    try {
        await fetch(`${firebaseConfig.rtdbUrl}/license_keys/${encodeURIComponent(cleanKey)}.json`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(patch)
        });
        await fetch(`${firebaseConfig.rtdbUrl}/users/KEY_${encodeURIComponent(cleanKey)}.json`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(patch)
        });
    } catch (e) { }

    const idx = licensesCache.findIndex(l => l.key === cleanKey);
    if (idx >= 0) {
        licensesCache[idx] = { ...licensesCache[idx], ...patch };
        notifyState();
    }

    return { success: true };
}

export async function deleteLicenseKey(key) {
    if (!currentAdmin || !currentAdmin.adminId) {
        throw new Error("Unauthorized: Sign in required.");
    }
    const cleanKey = String(key).trim().toUpperCase();

    try {
        await deleteDoc(doc(db, "license_keys", cleanKey));
    } catch(e) { }

    try {
        await fetch(`${firebaseConfig.rtdbUrl}/license_keys/${encodeURIComponent(cleanKey)}.json`, {
            method: "DELETE"
        });
        await fetch(`${firebaseConfig.rtdbUrl}/users/KEY_${encodeURIComponent(cleanKey)}.json`, {
            method: "DELETE"
        });
    } catch (e) { }

    licensesCache = licensesCache.filter(l => l.key !== cleanKey);
    notifyState();

    return { success: true };
}
