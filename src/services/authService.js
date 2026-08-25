// Admin Authentication and User Management Service

const STORAGE_ADMINS_KEY = 'cm_admins';
const STORAGE_CURRENT_ADMIN_KEY = 'cm_current_admin';

// Default pre-seeded admin accounts
const DEFAULT_ADMINS = [
  {
    id: 'ADMIN-001',
    name: 'Combine Mentor Admin',
    email: 'admin@combinementor.in',
    password: 'admin@combinementor',
    role: 'SUPER_ADMIN',
    createdAt: new Date().toISOString()
  },
  {
    id: 'ADMIN-002',
    name: 'Swapnil Nikat (Chief Admin)',
    email: 'swapnilnikat9399@gmail.com',
    password: 'admin@combinementor',
    role: 'SUPER_ADMIN',
    createdAt: new Date().toISOString()
  }
];

// Initialize admins storage
export function initAdmins() {
  const existing = localStorage.getItem(STORAGE_ADMINS_KEY);
  if (!existing) {
    localStorage.setItem(STORAGE_ADMINS_KEY, JSON.stringify(DEFAULT_ADMINS));
  }
}

// Get all registered administrators
export function getRegisteredAdmins() {
  initAdmins();
  try {
    const raw = localStorage.getItem(STORAGE_ADMINS_KEY);
    return raw ? JSON.parse(raw) : DEFAULT_ADMINS;
  } catch (e) {
    return DEFAULT_ADMINS;
  }
}

// Register a new Administrator
export function registerAdmin({ name, email, password }) {
  initAdmins();
  if (!name || !name.trim()) {
    return { success: false, message: 'Please enter your Full Name.' };
  }
  if (!email || !email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    return { success: false, message: 'Please enter a valid official Email Address.' };
  }
  if (!password || password.length < 6) {
    return { success: false, message: 'Password must be at least 6 characters long.' };
  }

  const cleanEmail = email.trim().toLowerCase();
  const admins = getRegisteredAdmins();

  const existing = admins.find(a => a.email.toLowerCase() === cleanEmail);
  if (existing) {
    return { success: false, message: 'An administrator with this email address already exists. Please log in.' };
  }

  const newAdmin = {
    id: `ADMIN-${Date.now().toString().slice(-6)}`,
    name: name.trim(),
    email: cleanEmail,
    password: password, // In production, hashed with bcrypt/argon2
    role: admins.length === 0 ? 'SUPER_ADMIN' : 'EXAM_ADMIN',
    createdAt: new Date().toISOString()
  };

  const updatedAdmins = [...admins, newAdmin];
  localStorage.setItem(STORAGE_ADMINS_KEY, JSON.stringify(updatedAdmins));

  // Automatically log in the newly registered admin
  const sessionUser = {
    id: newAdmin.id,
    name: newAdmin.name,
    email: newAdmin.email,
    role: newAdmin.role,
    loginTime: new Date().toISOString()
  };
  localStorage.setItem(STORAGE_CURRENT_ADMIN_KEY, JSON.stringify(sessionUser));

  return {
    success: true,
    message: 'Admin account registered successfully!',
    user: sessionUser
  };
}

// Login an Administrator
export function loginAdmin(email, password) {
  initAdmins();
  if (!email || !email.trim()) {
    return { success: false, message: 'Please enter your Admin Email Address.' };
  }
  if (!password) {
    return { success: false, message: 'Please enter your Admin Password.' };
  }

  const cleanEmail = email.trim().toLowerCase();
  const admins = getRegisteredAdmins();

  const matched = admins.find(
    a => a.email.toLowerCase() === cleanEmail && a.password === password
  );

  if (!matched) {
    return {
      success: false,
      message: 'Invalid Admin Email or Password. Please check credentials or register a new admin account.'
    };
  }

  const sessionUser = {
    id: matched.id,
    name: matched.name,
    email: matched.email,
    role: matched.role || 'EXAM_ADMIN',
    loginTime: new Date().toISOString()
  };

  localStorage.setItem(STORAGE_CURRENT_ADMIN_KEY, JSON.stringify(sessionUser));

  return {
    success: true,
    message: `Welcome back, ${matched.name}!`,
    user: sessionUser
  };
}

// Get Currently Logged In Admin Session
export function getCurrentAdmin() {
  try {
    const raw = localStorage.getItem(STORAGE_CURRENT_ADMIN_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) {
    return null;
  }
}

// Logout Administrator
export function logoutAdmin() {
  localStorage.removeItem(STORAGE_CURRENT_ADMIN_KEY);
  return { success: true };
}
