import React, { useCallback, useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axiosClient from './axiosClient';
import { FiPlus, FiEdit3, FiEye, FiTrash2, FiCopy, FiList } from 'react-icons/fi';
import { localize } from '../lib/localize';
import { getApiErrorMessage } from '../lib/apiError';

const FormsList = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [forms, setForms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [notice, setNotice] = useState(() => (location.state?.flash ? { type: 'success', text: location.state.flash } : null));
  const [busySlug, setBusySlug] = useState(null);

  // إزالة رسالة النجاح من history حتى لا تظهر مجدداً عند التحديث
  useEffect(() => {
    if (location.state?.flash) navigate(location.pathname, { replace: true, state: null });
  }, [location.pathname, location.state, navigate]);

  // GET /admin/forms
  const fetchForms = useCallback(async () => {
    try {
      setLoadError('');
      const response = await axiosClient.get('/admin/forms');
      const allForms = response.data.data;
      setForms(Array.isArray(allForms) ? allForms.filter((form) => form?.slug) : []);
    } catch (error) {
      setLoadError(getApiErrorMessage(error, 'Failed to load forms.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchForms();
  }, [fetchForms]);

  // DELETE /admin/forms/{slug}
  const handleDelete = async (form) => {
    if (!window.confirm(`Delete "${localize(form.title, 'AR', form.slug)}"? All of its submissions will be deleted too.`)) return;
    setBusySlug(form.slug);
    try {
      await axiosClient.delete(`/admin/forms/${form.slug}`);
      setForms((prev) => prev.filter((f) => f.slug !== form.slug));
      setNotice({ type: 'success', text: 'Form deleted successfully.' });
    } catch (error) {
      setNotice({ type: 'error', text: getApiErrorMessage(error, 'Failed to delete form.') });
    } finally {
      setBusySlug(null);
    }
  };

  // POST /admin/forms/{slug}/duplicate — النسخة تُنشأ كمسودة
  const handleDuplicate = async (slug) => {
    setBusySlug(slug);
    try {
      await axiosClient.post(`/admin/forms/${slug}/duplicate`);
      await fetchForms();
      setNotice({ type: 'success', text: 'Form duplicated as a draft.' });
    } catch (error) {
      setNotice({ type: 'error', text: getApiErrorMessage(error, 'Failed to duplicate form.') });
    } finally {
      setBusySlug(null);
    }
  };

  const actionClass = 'p-2 rounded-lg transition inline-flex items-center cursor-pointer disabled:opacity-40';

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto min-h-screen bg-[#0d1117] text-gray-100" dir="ltr">
      <div className="flex flex-wrap justify-between items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Forms Management</h1>
          <p className="text-sm text-gray-400 mt-1">Manage your dynamic forms and check submissions.</p>
        </div>
        <button
          onClick={() => navigate('/admin/forms/create')}
          className="bg-[#ff7a00] text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-[#e06c00] transition shadow-md shadow-orange-500/10 flex items-center gap-2 cursor-pointer"
        >
          <FiPlus size={18} />
          <span>Create Form</span>
        </button>
      </div>

      {notice && (
        <div role="status" className={`p-4 mb-6 rounded-xl text-sm font-medium border ${notice.type === 'success' ? 'bg-green-500/10 text-green-400 border-green-500/25' : 'bg-red-500/10 text-red-400 border-red-500/25'}`}>
          {notice.text}
        </div>
      )}

      {loading ? (
        <div className="text-center py-12 text-gray-500 text-sm">Loading forms...</div>
      ) : loadError ? (
        <div role="alert" className="bg-[#161b22] rounded-2xl p-12 text-center border border-red-500/25 space-y-3">
          <p className="text-red-400 text-sm">{loadError}</p>
          <button onClick={() => { setLoading(true); fetchForms(); }} className="text-[#ff7a00] font-semibold text-sm hover:underline cursor-pointer">Try again</button>
        </div>
      ) : forms.length === 0 ? (
        <div className="bg-[#161b22] rounded-2xl p-12 text-center border border-gray-800 shadow-xs">
          <p className="text-gray-400 text-sm mb-4">No forms found yet.</p>
          <button
            onClick={() => navigate('/admin/forms/create')}
            className="text-[#ff7a00] font-semibold text-sm hover:underline cursor-pointer"
          >
            Create your first form &rarr;
          </button>
        </div>
      ) : (
        <div className="bg-[#161b22] rounded-2xl shadow-xs border border-gray-800 overflow-x-auto">
          <table className="w-full min-w-[640px] text-left border-collapse">
            <thead className="bg-[#0d1117]/70 border-b border-gray-800 text-xs text-gray-400 uppercase tracking-wider">
              <tr>
                <th className="p-4 font-semibold">Title</th>
                <th className="p-4 font-semibold">Slug</th>
                <th className="p-4 font-semibold">Status</th>
                <th className="p-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/60 text-sm text-gray-300">
              {forms.map((form) => (
                <tr key={form.id ?? form.slug} className="hover:bg-gray-800/30 transition">
                  <td className="p-4 font-medium text-white" dir="auto">
                    {localize(form.title, 'AR', 'Untitled Form')}
                  </td>
                  <td className="p-4 text-gray-500 font-mono text-xs">{form.slug}</td>
                  <td className="p-4">
                    <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold ${form.is_active ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'}`}>
                      {form.is_active ? 'Published' : 'Draft'}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => navigate(`/admin/forms/${form.slug}/submissions`)}
                        title="View submissions"
                        aria-label="View submissions"
                        className={`${actionClass} bg-blue-500/10 text-blue-400 hover:bg-blue-500/20`}
                      >
                        <FiList size={16} />
                      </button>
                      <button
                        title={form.is_active ? 'Open public form' : 'Drafts are not publicly visible'}
                        aria-label="Open public form"
                        disabled={!form.is_active}
                        onClick={() => window.open(`/forms/${form.slug}`, '_blank', 'noopener')}
                        className={`${actionClass} bg-gray-800 text-gray-300 hover:text-white`}
                      >
                        <FiEye size={16} />
                      </button>
                      <button
                        onClick={() => navigate(`/admin/forms/edit/${form.slug}`)}
                        title="Edit form"
                        aria-label="Edit form"
                        className={`${actionClass} bg-amber-500/10 text-amber-400 hover:bg-amber-500/20`}
                      >
                        <FiEdit3 size={16} />
                      </button>
                      <button
                        onClick={() => handleDuplicate(form.slug)}
                        disabled={busySlug === form.slug}
                        title="Duplicate form"
                        aria-label="Duplicate form"
                        className={`${actionClass} bg-gray-800 text-gray-300 hover:bg-gray-700`}
                      >
                        <FiCopy size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(form)}
                        disabled={busySlug === form.slug}
                        title="Delete form"
                        aria-label="Delete form"
                        className={`${actionClass} bg-red-500/10 text-red-400 hover:bg-red-500/20`}
                      >
                        <FiTrash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default FormsList;
