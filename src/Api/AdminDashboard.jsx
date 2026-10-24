import React, { Suspense, useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { FiFileText, FiLayers, FiMic, FiLogOut, FiMenu, FiX, FiExternalLink } from 'react-icons/fi';
import axiosClient from './axiosClient';
import { clearSession, isAdminUser } from '../lib/auth';

const navItems = [
  { to: '/admin/forms', label: 'Forms Management', icon: FiFileText },
  { to: '/admin/posts', label: 'Posts Management', icon: FiLayers },
  { to: '/admin/field-voices', label: 'Field Voices', icon: FiMic },
];

const AdminDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  // التحقق من الجلسة والدور عند فتح اللوحة: GET /user (الـ 401 يعالجه axiosClient)
  useEffect(() => {
    let cancelled = false;
    axiosClient.get('/user')
      .then((response) => {
        if (cancelled) return;
        if (!isAdminUser(response.data)) {
          clearSession();
          navigate('/admin/login?reason=forbidden', { replace: true });
          return;
        }
        setUser(response.data);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [navigate]);

  // إغلاق القائمة الجانبية على الموبايل عند الانتقال لصفحة أخرى
  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  // POST /logout يلغي التوكن في الخادم، ثم نمسح الجلسة محلياً حتى لو فشل الطلب
  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await axiosClient.post('/logout');
    } catch {
      // التوكن قد يكون منتهياً أصلاً
    } finally {
      clearSession();
      navigate('/admin/login', { replace: true });
    }
  };

  const linkClass = ({ isActive }) =>
    `flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition ${isActive ? 'bg-[#ff7a00]/15 text-[#ff7a00]' : 'text-gray-300 hover:bg-[#ff7a00]/10 hover:text-[#ff7a00]'}`;

  return (
    <div className="flex min-h-screen bg-[#0d1117] text-gray-100" dir="ltr">
      {/* شريط علوي للموبايل */}
      <div className="md:hidden fixed top-0 inset-x-0 z-30 flex items-center justify-between px-4 h-14 bg-[#161b22] border-b border-gray-800">
        <span className="font-bold text-white">Admin Panel</span>
        <button
          type="button"
          onClick={() => setMenuOpen((open) => !open)}
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={menuOpen}
          aria-controls="admin-sidebar"
          className="p-2 text-gray-300 hover:text-white rounded-lg"
        >
          {menuOpen ? <FiX size={22} /> : <FiMenu size={22} />}
        </button>
      </div>

      {menuOpen && <div className="md:hidden fixed inset-0 z-30 bg-black/60" onClick={() => setMenuOpen(false)} aria-hidden="true" />}

      {/* القائمة الجانبية */}
      <aside
        id="admin-sidebar"
        className={`fixed md:sticky top-0 z-40 h-screen w-64 shrink-0 border-r border-gray-800 p-6 flex flex-col justify-between bg-[#161b22] transition-transform md:translate-x-0 ${menuOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div>
          <h2 className="text-white font-bold text-lg mb-1 tracking-wide">Admin Panel</h2>
          <p className="text-xs text-gray-500 mb-8 truncate">{user ? user.name || user.email : ' '}</p>

          <nav aria-label="Admin" className="space-y-2">
            {navItems.map(({ to, label, icon: Icon }) => (
              <NavLink key={to} to={to} className={linkClass}>
                <Icon size={18} />
                <span>{label}</span>
              </NavLink>
            ))}
            <a href="/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-gray-400 hover:text-white transition">
              <FiExternalLink size={18} />
              <span>View website</span>
            </a>
          </nav>
        </div>

        <button
          onClick={handleLogout}
          disabled={loggingOut}
          className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-red-400 hover:bg-red-500/10 transition border border-transparent hover:border-red-500/20 cursor-pointer disabled:opacity-50"
        >
          <FiLogOut size={18} />
          <span>{loggingOut ? 'Logging out...' : 'Logout'}</span>
        </button>
      </aside>

      <main className="flex-1 min-w-0 pt-14 md:pt-0">
        <Suspense fallback={<div className="p-8 text-center text-gray-500 text-sm">Loading...</div>}>
          <Outlet />
        </Suspense>
      </main>
    </div>
  );
};

export default AdminDashboard;
