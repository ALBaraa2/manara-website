import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { FiArrowLeft } from 'react-icons/fi';
import axiosClient from './axiosClient';
import { localize } from '../lib/localize';
import { getApiErrorMessage } from '../lib/apiError';
import useObjectUrl from '../hooks/useObjectUrl';

const MAX_COVER_BYTES = 2048 * 1024; // نفس حد الـ backend (max:2048 KB)

const inputClass = 'w-full px-4 py-3 bg-[#0d1117] text-white border border-gray-800 rounded-xl focus:outline-none focus:border-[#ff7a00] focus:ring-1 focus:ring-[#ff7a00] text-sm placeholder-gray-500';

// صفحة إنشاء وتعديل المنشورات: /admin/posts/create و /admin/posts/edit/:slug
const PostForm = () => {
  const { slug } = useParams();
  const isEdit = Boolean(slug);
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [status, setStatus] = useState('published');
  const [originalStatus, setOriginalStatus] = useState(null);
  const [existingCover, setExistingCover] = useState(null);
  const [coverImage, setCoverImage] = useState(null);
  const coverPreview = useObjectUrl(coverImage) || existingCover;

  const [loading, setLoading] = useState(isEdit);
  const [loadError, setLoadError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // GET /admin/posts/{slug}
  useEffect(() => {
    if (!isEdit) return undefined;
    let cancelled = false;

    axiosClient.get(`/admin/posts/${slug}`)
      .then((response) => {
        if (cancelled) return;
        const post = response.data.data;
        setTitle(localize(post.title, 'AR'));
        setContent(localize(post.content, 'AR'));
        setStatus(post.status);
        setOriginalStatus(post.status);
        setExistingCover(post.cover_image || null);
      })
      .catch((err) => {
        if (!cancelled) setLoadError(getApiErrorMessage(err, 'Failed to load the post.'));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isEdit, slug]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    setError('');
    if (file && file.size > MAX_COVER_BYTES) {
      setError('The cover image must be 2 MB or smaller.');
      e.target.value = '';
      return;
    }
    setCoverImage(file || null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    const formData = new FormData();

    if (isEdit) {
      // UpdatePostRequest يقبل title/content (تُحفظ كنص عربي) — الترجمة الإنجليزية تُولَّد تلقائياً
      formData.append('_method', 'PUT');
      formData.append('title', title.trim());
      formData.append('content', content.trim());
      // نرسل الحالة فقط عند تغييرها، لأن إرسال published يعيد ضبط تاريخ النشر
      if (status !== originalStatus) formData.append('status', status);
    } else {
      // StorePostRequest يتطلب title_ar و content_ar
      formData.append('title_ar', title.trim());
      formData.append('content_ar', content.trim());
      formData.append('status', status);
    }

    if (coverImage) formData.append('cover_image', coverImage);

    try {
      if (isEdit) {
        await axiosClient.post(`/admin/posts/${slug}`, formData);
      } else {
        await axiosClient.post('/admin/posts', formData);
      }
      navigate('/admin/posts', { state: { flash: isEdit ? 'Post updated successfully.' : 'Post created successfully.' } });
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to save the post.'));
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-gray-400 min-h-screen bg-[#0d1117]">Loading post...</div>;
  }

  if (loadError) {
    return (
      <div className="p-8 min-h-screen bg-[#0d1117] text-center space-y-4" dir="ltr">
        <p role="alert" className="text-red-400 text-sm">{loadError}</p>
        <Link to="/admin/posts" className="text-[#ff7a00] text-sm hover:underline">Back to posts</Link>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-3xl mx-auto min-h-screen bg-[#0d1117] text-gray-100" dir="ltr">
      <div className="flex flex-wrap justify-between items-center gap-4 mb-6 border-b border-gray-800 pb-4">
        <div>
          <span className="text-xs text-gray-400">Admin / Posts /</span>
          <h1 className="text-xl font-bold text-white">{isEdit ? 'Edit Post' : 'Create Post'}</h1>
        </div>
        <button
          type="button"
          onClick={() => navigate('/admin/posts')}
          className="px-4 py-2.5 bg-[#161b22] border border-gray-800 text-gray-300 rounded-xl text-sm font-semibold hover:bg-gray-800 hover:text-white transition flex items-center gap-2 cursor-pointer"
        >
          <FiArrowLeft size={16} />
          <span>Back</span>
        </button>
      </div>

      {error && (
        <div role="alert" className="mb-4 p-4 rounded-xl text-sm border bg-red-500/10 text-red-400 border-red-500/25">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-[#161b22] p-6 md:p-8 rounded-2xl border border-gray-800 space-y-5">
        <p className="text-xs text-gray-500">
          Write the post in Arabic. The English version is translated automatically after saving.
        </p>

        <div>
          <label htmlFor="post-title" className="block text-sm font-semibold text-gray-300 mb-2">Title (Arabic) *</label>
          <input
            id="post-title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            maxLength={255}
            dir="auto"
            className={inputClass}
            placeholder="عنوان المنشور..."
          />
        </div>

        <div>
          <label htmlFor="post-content" className="block text-sm font-semibold text-gray-300 mb-2">Content (Arabic) *</label>
          <textarea
            id="post-content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            required
            rows="8"
            dir="auto"
            className={`${inputClass} resize-y`}
            placeholder="محتوى المنشور..."
          ></textarea>
        </div>

        <div>
          <label htmlFor="post-cover" className="block text-sm font-semibold text-gray-300 mb-2">
            Cover image <span className="text-gray-500 font-normal">(optional, max 2 MB{isEdit ? ' — leave empty to keep the current image' : ''})</span>
          </label>
          <input
            id="post-cover"
            type="file"
            onChange={handleImageChange}
            accept="image/*"
            className="w-full text-sm text-gray-400 file:mr-4 file:py-2.5 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-[#ff7a00]/20 file:text-[#ff7a00] hover:file:bg-[#ff7a00]/30 cursor-pointer"
          />
          {coverPreview && (
            <img src={coverPreview} alt="Cover preview" className="mt-3 h-32 w-auto object-cover rounded-lg border border-gray-800" />
          )}
        </div>

        <div>
          <label htmlFor="post-status" className="block text-sm font-semibold text-gray-300 mb-2">Status</label>
          <select
            id="post-status"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className={inputClass}
          >
            <option value="published">Published</option>
            <option value="draft">Draft</option>
          </select>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-[#ff7a00] text-white font-semibold py-3 px-4 rounded-xl hover:bg-[#e06c00] transition disabled:opacity-50 cursor-pointer"
        >
          {submitting ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Post'}
        </button>
      </form>
    </div>
  );
};

export default PostForm;
