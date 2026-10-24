// تخزين جلسة الأدمن في مكان واحد بدلاً من تكرار مفاتيح localStorage في كل ملف
const TOKEN_KEY = 'admin_token';
const LEGACY_KEYS = ['adminToken', 'isAdminLoggedIn'];

const safeStorage = {
  get(key) {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  set(key, value) {
    try {
      localStorage.setItem(key, value);
    } catch {
      // التخزين غير متاح (وضع خاص مثلاً) — تبقى الجلسة للصفحة الحالية فقط
    }
  },
  remove(key) {
    try {
      localStorage.removeItem(key);
    } catch {
      // تجاهل
    }
  },
};

export const getToken = () => safeStorage.get(TOKEN_KEY);

export const setToken = (token) => safeStorage.set(TOKEN_KEY, token);

export const clearSession = () => {
  safeStorage.remove(TOKEN_KEY);
  LEGACY_KEYS.forEach((key) => safeStorage.remove(key));
};

export const isAdminUser = (user) => user?.role === 'admin';
