// Dedicated Single Administrator Authentication Service for Combine Mentor Official

const STORAGE_CURRENT_ADMIN_KEY = 'cm_current_admin';

// Fixed Dedicated Master Administrator Credentials
export const FIXED_ADMIN_EMAIL = 'admin@admin.com';
export const FIXED_ADMIN_PASSWORD = 'Combinementor@1234';

// Clean up any legacy multi-user accounts
export function clearLegacyAdmins() {
  localStorage.removeItem('cm_admins');
  const current = localStorage.getItem(STORAGE_CURRENT_ADMIN_KEY);
  if (current) {
    try {
      const parsed = JSON.parse(current);
      if (parsed.email?.toLowerCase() !== FIXED_ADMIN_EMAIL.toLowerCase()) {
        localStorage.removeItem(STORAGE_CURRENT_ADMIN_KEY);
      }
    } catch (e) {
      localStorage.removeItem(STORAGE_CURRENT_ADMIN_KEY);
    }
  }
}

// Authenticate Administrator
export function loginAdmin(email, password) {
  clearLegacyAdmins();

  if (!email || !email.trim()) {
    return { success: false, message: 'Please enter the Admin Login ID / Email.' };
  }
  if (!password) {
    return { success: false, message: 'Please enter the Admin Password.' };
  }

  const cleanEmail = email.trim().toLowerCase();

  // Strict match against the dedicated master credentials
  if (cleanEmail === FIXED_ADMIN_EMAIL.toLowerCase() && password === FIXED_ADMIN_PASSWORD) {
    const sessionUser = {
      id: 'ADMIN-01',
      name: 'Combine Mentor Admin',
      email: FIXED_ADMIN_EMAIL,
      role: 'MASTER_ADMIN',
      loginTime: new Date().toISOString()
    };

    localStorage.setItem(STORAGE_CURRENT_ADMIN_KEY, JSON.stringify(sessionUser));

    return {
      success: true,
      message: 'Admin Authentication Successful!',
      user: sessionUser
    };
  }

  return {
    success: false,
    message: 'Invalid User ID or Password. Only authorized administrators can access.'
  };
}

// Get Active Admin Session
export function getCurrentAdmin() {
  clearLegacyAdmins();
  try {
    const raw = localStorage.getItem(STORAGE_CURRENT_ADMIN_KEY);
    if (!raw) return null;
    const user = JSON.parse(raw);
    if (user && user.email?.toLowerCase() === FIXED_ADMIN_EMAIL.toLowerCase()) {
      return user;
    }
    localStorage.removeItem(STORAGE_CURRENT_ADMIN_KEY);
    return null;
  } catch (e) {
    localStorage.removeItem(STORAGE_CURRENT_ADMIN_KEY);
    return null;
  }
}

// Logout Administrator Session
export function logoutAdmin() {
  localStorage.removeItem(STORAGE_CURRENT_ADMIN_KEY);
  return { success: true };
}
