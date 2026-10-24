import axiosClient from '../Api/axiosClient';

// الـ API يعيد روابط الصور كاملة (ResolvesMediaUrls)، لكن نحافظ على دعم المسارات النسبية
// بحلّها على نفس أصل الـ API بدلاً من عنوان IP ثابت.
export const resolveMediaUrl = (path) => {
  if (!path || typeof path !== 'string') return null;
  if (/^(https?:)?\/\//.test(path) || path.startsWith('blob:') || path.startsWith('data:')) return path;

  const apiBase = axiosClient.defaults.baseURL || '/api';
  const origin = apiBase.replace(/\/api\/?$/, '');
  const cleanPath = path.replace(/^\/+/, '').replace(/^storage\//, '');

  return `${origin}/storage/${cleanPath}`;
};
