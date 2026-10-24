import axios from 'axios';
import { clearSession, getToken } from '../lib/auth';

// الواجهة والـ API يُخدَمان من نفس الأصل (Caddy)، لذا المسار النسبي هو الافتراضي الآمن.
// VITE_API_URL يبقى متاحاً لبيئة التطوير أو أي نشر منفصل.
const axiosClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: { Accept: 'application/json' },
});

axiosClient.interceptors.request.use((config) => {
  const token = getToken();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  if (config.data instanceof FormData) {
    // المتصفح يضبط multipart/form-data مع الـ boundary بنفسه
    delete config.headers['Content-Type'];
  } else {
    config.headers['Content-Type'] = 'application/json';
  }

  return config;
});

// الجلسة منتهية أو المستخدم ليس أدمن: نعيده لصفحة الدخول بدلاً من عرض قوائم فارغة.
// نطبّق ذلك فقط داخل لوحة التحكم حتى لا تتأثر الصفحات العامة.
axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const url = error.config?.url || '';
    const inAdminArea = window.location.pathname.startsWith('/admin') && window.location.pathname !== '/admin/login';
    const isAuthFailure = status === 401 || (status === 403 && url.startsWith('/admin'));

    if (inAdminArea && isAuthFailure && url !== '/login') {
      clearSession();
      const reason = status === 401 ? 'expired' : 'forbidden';
      window.location.assign(`/admin/login?reason=${reason}`);
    }

    return Promise.reject(error);
  }
);

export default axiosClient;
