import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import axiosClient from './axiosClient';
import { FiArrowLeft } from 'react-icons/fi';
import { localize } from '../lib/localize';
import { getApiErrorMessage } from '../lib/apiError';
import useObjectUrl from '../hooks/useObjectUrl';

const MAX_IMAGE_BYTES = 255 * 1024; // نفس حد الـ backend (max:255 KB)

const inputClass = 'w-full bg-[#0d1117] border border-gray-800 rounded-xl p-3 text-white focus:border-[#ff7a00] focus:ring-1 focus:ring-[#ff7a00] focus:outline-none text-sm';

const FieldVoiceForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = Boolean(id);

  const [formData, setFormData] = useState({ name: '', role: '', quote: '' });
  const [image, setImage] = useState(null);
  const [currentImage, setCurrentImage] = useState(null);
  const imagePreview = useObjectUrl(image) || currentImage;

  const [loading, setLoading] = useState(isEditing);
  const [loadError, setLoadError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // لا يوجد GET /admin/field-voices/{id} في الـ backend، لذا نبحث عن العنصر في القائمة
  useEffect(() => {
    if (!isEditing) return undefined;
    let cancelled = false;

    axiosClient.get('/admin/field-voices')
      .then((response) => {
        if (cancelled) return;
        const currentVoice = (response.data.data || []).find((v) => String(v.id) === id);
        if (!currentVoice) {
          setLoadError('This field voice was not found.');
          return;
        }
        setFormData({
          name: currentVoice.name || '',
          role: localize(currentVoice.role, 'AR'),
          quote: localize(currentVoice.quote, 'AR'),
        });
        setCurrentImage(currentVoice.image || null);
      })
      .catch((err) => {
        if (!cancelled) setLoadError(getApiErrorMessage(err, 'Failed to load field voice.'));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [id, isEditing]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setError('');
    if (file && file.size > MAX_IMAGE_BYTES) {
      setError('The image must be 255 KB or smaller.');
      e.target.value = '';
      return;
    }
    setImage(file || null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    const data = new FormData();
    data.append('name', formData.name.trim());
    data.append('role', formData.role.trim());
    data.append('quote', formData.quote.trim());
    data.append('is_published', '1');
    if (image) data.append('image', image);

    try {
      if (isEditing) {
        // PUT /admin/field-voices/{id} عبر POST + _method لأن الطلب multipart
        data.append('_method', 'PUT');
        await axiosClient.post(`/admin/field-voices/${id}`, data);
      } else {
        await axiosClient.post('/admin/field-voices', data);
      }
      navigate('/admin/field-voices', { state: { flash: isEditing ? 'Field voice updated.' : 'Field voice added.' } });
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to save field voice.'));
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-gray-400 min-h-screen bg-[#0d1117]">Loading...</div>;
  }

  if (loadError) {
    return (
      <div className="p-8 min-h-screen bg-[#0d1117] text-center space-y-4" dir="ltr">
        <p role="alert" className="text-red-400 text-sm">{loadError}</p>
        <Link to="/admin/field-voices" className="text-[#ff7a00] text-sm hover:underline">Back to field voices</Link>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto min-h-screen bg-[#0d1117] text-gray-100" dir="ltr">
      <div className="flex flex-wrap justify-between items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">
            {isEditing ? 'Edit Field Voice' : 'Add New Field Voice'}
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Write the role and story in Arabic — the English version is translated automatically.
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate('/admin/field-voices')}
          className="px-4 py-2.5 bg-[#161b22] border border-gray-800 text-gray-300 rounded-xl text-sm font-semibold hover:bg-gray-800 hover:text-white transition flex items-center gap-2 cursor-pointer"
        >
          <FiArrowLeft size={16} />
          <span>Back</span>
        </button>
      </div>

      {error && (
        <div role="alert" className="p-4 mb-4 rounded-xl text-sm border bg-red-500/10 text-red-400 border-red-500/25">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="bg-[#161b22] p-6 md:p-8 rounded-2xl border border-gray-800 space-y-6 shadow-xs">
        <div>
          <label htmlFor="voice-name" className="block text-sm font-medium text-gray-300 mb-2">Name *</label>
          <input id="voice-name" type="text" name="name" value={formData.name} onChange={handleChange} required maxLength={255} dir="auto" className={inputClass} placeholder="Enter name..." />
        </div>

        <div>
          <label htmlFor="voice-role" className="block text-sm font-medium text-gray-300 mb-2">Role</label>
          <input id="voice-role" type="text" name="role" value={formData.role} onChange={handleChange} maxLength={255} dir="auto" className={inputClass} placeholder="Enter role..." />
        </div>

        <div>
          <label htmlFor="voice-quote" className="block text-sm font-medium text-gray-300 mb-2">Quote / Story *</label>
          <textarea id="voice-quote" name="quote" value={formData.quote} onChange={handleChange} required rows="4" dir="auto" className={inputClass} placeholder="Enter quote..." />
        </div>

        <div>
          <label htmlFor="voice-image" className="block text-sm font-medium text-gray-300 mb-2">
            Image <span className="text-gray-500 font-normal">(max 255 KB{isEditing ? ' — leave empty to keep the current image' : ''})</span>
          </label>
          <div className="flex items-center gap-4">
            {imagePreview && <img src={imagePreview} alt="Selected" className="w-16 h-16 rounded-full object-cover border border-gray-800 shrink-0" />}
            <input
              id="voice-image"
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="w-full text-sm text-gray-400 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-[#ff7a00] file:text-white hover:file:bg-[#e06c00] cursor-pointer"
            />
          </div>
        </div>

        <div className="flex justify-end gap-4 pt-4 border-t border-gray-800">
          <button
            type="button"
            onClick={() => navigate('/admin/field-voices')}
            className="px-5 py-2.5 bg-gray-800 text-gray-300 rounded-xl text-sm font-semibold hover:bg-gray-700 transition cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="px-5 py-2.5 bg-[#ff7a00] text-white rounded-xl text-sm font-semibold hover:bg-[#e06c00] transition shadow-sm cursor-pointer disabled:opacity-50"
          >
            {submitting ? 'Saving...' : isEditing ? 'Update Voice' : 'Save Voice'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default FieldVoiceForm;
