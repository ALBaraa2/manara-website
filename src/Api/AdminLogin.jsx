// AdminLogin.jsx

import React, { useState } from 'react';
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import axiosClient from './axiosClient';
import { FiLock, FiMail } from 'react-icons/fi';
import { clearSession, getToken, isAdminUser, setToken } from '../lib/auth';

const reasonMessages = {
  expired: 'انتهت الجلسة، يرجى تسجيل الدخول مجدداً.',
  forbidden: 'هذا الحساب لا يملك صلاحيات الإدارة.',
};

function AdminLogin() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(reasonMessages[searchParams.get('reason')] || '');

  // POST /login — يعيد token و user (مع role)
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage('');

    try {
      const { data } = await axiosClient.post('/login', { email: email.trim(), password });

      if (!data.token) {
        setErrorMessage('لم يتم العثور على رمز المصادقة في الاستجابة.');
        return;
      }

      // الـ backend يصدر توكن لأي مستخدم، لكن لوحة التحكم للأدمن فقط
      if (!isAdminUser(data.user)) {
        await axiosClient.post('/logout', null, { headers: { Authorization: `Bearer ${data.token}` } }).catch(() => {});
        setErrorMessage(reasonMessages.forbidden);
        return;
      }

      clearSession();
      setToken(data.token);
      navigate('/admin/forms', { replace: true });
    } catch (error) {
      if (error.response?.status === 401) {
        setErrorMessage('البريد الإلكتروني أو كلمة المرور غير صحيحة.');
      } else if (error.response?.status === 422) {
        setErrorMessage('يرجى إدخال بريد إلكتروني وكلمة مرور صحيحين.');
      } else if (error.response?.status === 429) {
        setErrorMessage('محاولات كثيرة، يرجى الانتظار قليلاً ثم المحاولة مجدداً.');
      } else if (error.request && !error.response) {
        setErrorMessage('لا يوجد اتصال بالخادم، تحقق من اتصال الإنترنت.');
      } else {
        setErrorMessage('حدث خطأ غير متوقع، يرجى المحاولة مجدداً.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (getToken()) {
    return <Navigate to="/admin/forms" replace />;
  }

  const inputClass = 'w-full p-4 pr-12 rounded-2xl bg-white border border-transparent outline-none text-gray-700 shadow-xs text-right focus:border-[#f97316] focus:ring-2 focus:ring-[#f97316]/20 transition';

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6 w-full" dir="rtl">
      <div className="bg-[#f9f9ff] p-8 md:p-12 rounded-[3rem] shadow-sm w-full max-w-md relative">

        <div className="text-center mb-8 space-y-2">
          <div className="w-12 h-1 bg-[#f97316] rounded-full mx-auto"></div>
          <h1 className="text-3xl font-bold text-[#211551]">لوحة التحكم</h1>
          <p className="text-gray-500 text-sm">قم بتسجيل الدخول للوصول إلى أدوات الإدارة</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">

          <div className="flex flex-col gap-2">
            <label htmlFor="admin-email" className="text-sm font-bold text-[#211551] text-right">البريد الإلكتروني</label>
            <div className="relative flex items-center">
              <input
                id="admin-email"
                type="email"
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@example.com"
                dir="ltr"
                className={inputClass}
                required
              />
              <FiMail aria-hidden="true" className="absolute right-4 text-gray-400 text-lg" />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="admin-password" className="text-sm font-bold text-[#211551] text-right">كلمة المرور</label>
            <div className="relative flex items-center">
              <input
                id="admin-password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className={inputClass}
                required
              />
              <FiLock aria-hidden="true" className="absolute right-4 text-gray-400 text-lg" />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#f97316] text-white py-4 rounded-2xl font-bold hover:bg-[#ea580c] transition-all shadow-md shadow-orange-500/20 disabled:opacity-50 cursor-pointer focus:outline-none focus-visible:ring-4 focus-visible:ring-[#f97316]/30"
          >
            {loading ? 'جاري التحقق...' : 'تسجيل الدخول'}
          </button>

          {errorMessage && (
            <div role="alert" className="p-4 bg-red-100 text-red-700 rounded-2xl text-center font-medium text-sm">
              {errorMessage}
            </div>
          )}

        </form>

      </div>
    </div>
  );
}

export default AdminLogin;
