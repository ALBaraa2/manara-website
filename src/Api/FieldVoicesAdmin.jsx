// FieldVoicesAdmin.jsx

import React, { useCallback, useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axiosClient from './axiosClient';
import { FiPlus, FiEdit2, FiTrash2 } from 'react-icons/fi';
import { localize } from '../lib/localize';
import { getApiErrorMessage } from '../lib/apiError';

const FieldVoicesAdmin = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [voices, setVoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [notice, setNotice] = useState(() => (location.state?.flash ? { type: 'success', text: location.state.flash } : null));
  const [busyId, setBusyId] = useState(null);

  useEffect(() => {
    if (location.state?.flash) navigate(location.pathname, { replace: true, state: null });
  }, [location.pathname, location.state, navigate]);

  // GET /admin/field-voices (الـ backend يعيد المنشور منها فقط)
  const fetchVoices = useCallback(async () => {
    try {
      setLoadError('');
      const response = await axiosClient.get('/admin/field-voices');
      setVoices(response.data.data || []);
    } catch (error) {
      setLoadError(getApiErrorMessage(error, 'Failed to load field voices.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchVoices();
  }, [fetchVoices]);

  // DELETE /admin/field-voices/{id}
  const handleDelete = async (voice) => {
    if (!window.confirm(`Delete the story by "${voice.name}"?`)) return;
    setBusyId(voice.id);
    try {
      await axiosClient.delete(`/admin/field-voices/${voice.id}`);
      setVoices((prev) => prev.filter((v) => v.id !== voice.id));
      setNotice({ type: 'success', text: 'Field voice deleted.' });
    } catch (error) {
      setNotice({ type: 'error', text: getApiErrorMessage(error, 'Failed to delete field voice.') });
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto min-h-screen bg-[#0d1117] text-gray-100" dir="ltr">
      <div className="flex flex-wrap justify-between items-center gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 text-xs text-gray-400 mb-1">
            <span>Admin</span>
            <span>/</span>
            <span className="text-[#ff7a00] font-semibold">Field Voices</span>
          </div>
          <h1 className="text-2xl font-bold text-white">Voices from the Field</h1>
          <p className="text-sm text-gray-400 mt-1">Manage success stories displayed on the website.</p>
        </div>

        <button
          onClick={() => navigate('/admin/field-voices/create')}
          className="px-4 py-2.5 bg-[#ff7a00] text-white rounded-xl text-sm font-semibold hover:bg-[#e06c00] transition flex items-center gap-2 shadow-sm cursor-pointer"
        >
          <FiPlus size={16} />
          <span>Add New Voice</span>
        </button>
      </div>

      {notice && (
        <div role="status" className={`p-4 mb-6 rounded-xl text-sm border ${notice.type === 'success' ? 'bg-green-500/10 text-green-400 border-green-500/25' : 'bg-red-500/10 text-red-400 border-red-500/25'}`}>
          {notice.text}
        </div>
      )}

      {loading ? (
        <div className="text-center py-12 text-gray-500 text-sm">Loading voices...</div>
      ) : loadError ? (
        <div role="alert" className="bg-[#161b22] rounded-2xl p-12 text-center border border-red-500/25 space-y-3">
          <p className="text-red-400 text-sm">{loadError}</p>
          <button onClick={() => { setLoading(true); fetchVoices(); }} className="text-[#ff7a00] font-semibold text-sm hover:underline cursor-pointer">Try again</button>
        </div>
      ) : voices.length === 0 ? (
        <div className="bg-[#161b22] rounded-2xl p-12 text-center border border-gray-800 shadow-xs">
          <p className="text-gray-400 text-sm">No field voices found yet.</p>
        </div>
      ) : (
        <div className="bg-[#161b22] rounded-2xl shadow-xs border border-gray-800 overflow-x-auto">
          <table className="w-full min-w-[600px] text-left border-collapse">
            <thead className="bg-[#0d1117]/70 border-b border-gray-800 text-xs text-gray-400 uppercase tracking-wider">
              <tr>
                <th className="p-4 font-semibold">Name & Role</th>
                <th className="p-4 font-semibold">Quote / Story</th>
                <th className="p-4 font-semibold text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/60 text-sm text-gray-300">
              {voices.map((voice) => (
                <tr key={voice.id} className="hover:bg-gray-800/30 transition">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-[#ff7a00]/15 text-[#ff7a00] flex items-center justify-center font-bold overflow-hidden shrink-0">
                        {voice.image ? <img src={voice.image} alt="" className="w-full h-full object-cover" /> : (voice.name?.[0] || '?')}
                      </div>
                      <div>
                        <div className="font-semibold text-white" dir="auto">{voice.name}</div>
                        <div className="text-xs text-[#ff7a00]" dir="auto">{localize(voice.role, 'AR')}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 max-w-md">
                    <p className="text-xs text-gray-300 line-clamp-2" dir="auto">{localize(voice.quote, 'AR')}</p>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => navigate(`/admin/field-voices/edit/${voice.id}`)}
                        className="p-2 bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white rounded-lg transition cursor-pointer"
                        title="Edit"
                        aria-label={`Edit story by ${voice.name}`}
                      >
                        <FiEdit2 size={15} />
                      </button>
                      <button
                        onClick={() => handleDelete(voice)}
                        disabled={busyId === voice.id}
                        className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition cursor-pointer disabled:opacity-40"
                        title="Delete"
                        aria-label={`Delete story by ${voice.name}`}
                      >
                        <FiTrash2 size={15} />
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

export default FieldVoicesAdmin;
