import React, { useCallback, useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axiosClient from './axiosClient';
import { FiPlus, FiEdit2, FiTrash2, FiCheckCircle, FiXCircle } from 'react-icons/fi';
import { localize } from '../lib/localize';
import { getApiErrorMessage } from '../lib/apiError';

const PostsList = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [notice, setNotice] = useState(() => (location.state?.flash ? { type: 'success', text: location.state.flash } : null));
  const [busySlug, setBusySlug] = useState(null);

  useEffect(() => {
    if (location.state?.flash) navigate(location.pathname, { replace: true, state: null });
  }, [location.pathname, location.state, navigate]);

  // GET /admin/posts
  const fetchPosts = useCallback(async () => {
    try {
      setLoadError('');
      const response = await axiosClient.get('/admin/posts');
      setPosts(response.data.data || []);
    } catch (error) {
      setLoadError(getApiErrorMessage(error, 'Failed to load posts.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const runAction = async (slug, request, successText, failureText) => {
    setBusySlug(slug);
    try {
      await request();
      await fetchPosts();
      setNotice({ type: 'success', text: successText });
    } catch (error) {
      setNotice({ type: 'error', text: getApiErrorMessage(error, failureText) });
    } finally {
      setBusySlug(null);
    }
  };

  // DELETE /admin/posts/{slug}
  const handleDelete = (post) => {
    if (!window.confirm(`Delete "${localize(post.title, 'AR', post.slug)}"?`)) return;
    runAction(post.slug, () => axiosClient.delete(`/admin/posts/${post.slug}`), 'Post deleted successfully.', 'Failed to delete post.');
  };

  // POST /admin/posts/{slug}/publish و /unpublish
  const handlePublish = (slug) =>
    runAction(slug, () => axiosClient.post(`/admin/posts/${slug}/publish`), 'Post published.', 'Failed to publish post.');

  const handleUnpublish = (slug) =>
    runAction(slug, () => axiosClient.post(`/admin/posts/${slug}/unpublish`), 'Post moved to drafts.', 'Failed to unpublish post.');

  const actionClass = 'p-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition cursor-pointer disabled:opacity-40';

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto min-h-screen bg-[#0d1117] text-gray-100" dir="ltr">
      <div className="flex flex-wrap justify-between items-center gap-4 mb-6 border-b border-gray-800 pb-4">
        <div>
          <span className="text-xs text-gray-400">Admin /</span>
          <h1 className="text-xl font-bold text-white">Posts Management</h1>
        </div>
        <button
          onClick={() => navigate('/admin/posts/create')}
          className="px-4 py-2 bg-[#ff7a00] text-white rounded-xl text-sm font-semibold hover:bg-[#e06c00] transition flex items-center gap-2 shadow-md shadow-orange-500/10 cursor-pointer"
        >
          <FiPlus size={18} />
          <span>Create Post</span>
        </button>
      </div>

      {notice && (
        <div role="status" className={`p-4 mb-4 rounded-xl text-sm border ${notice.type === 'success' ? 'bg-green-500/10 text-green-400 border-green-500/25' : 'bg-red-500/10 text-red-400 border-red-500/25'}`}>
          {notice.text}
        </div>
      )}

      <div className="bg-[#161b22] border border-gray-800 rounded-2xl overflow-x-auto shadow-xs">
        {loading ? (
          <p className="text-center py-8 text-gray-500 text-sm">Loading posts...</p>
        ) : loadError ? (
          <div role="alert" className="text-center py-8 space-y-3">
            <p className="text-red-400 text-sm">{loadError}</p>
            <button onClick={() => { setLoading(true); fetchPosts(); }} className="text-[#ff7a00] font-semibold text-sm hover:underline cursor-pointer">Try again</button>
          </div>
        ) : posts.length === 0 ? (
          <p className="text-center py-8 text-gray-500 text-sm">No posts found.</p>
        ) : (
          <table className="w-full min-w-[600px] text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-800 text-xs font-semibold text-gray-400 uppercase bg-[#0d1117]/50">
                <th className="p-4">Title / Slug</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/60 text-sm">
              {posts.map((post) => {
                const isPublished = post.status === 'published';
                const busy = busySlug === post.slug;

                return (
                  <tr key={post.id ?? post.slug} className="hover:bg-gray-800/30 transition">
                    <td className="p-4">
                      <div className="font-semibold text-gray-200" dir="auto">{localize(post.title, 'AR', 'Untitled')}</div>
                      <div className="text-xs text-gray-500">{post.slug}</div>
                    </td>
                    <td className="p-4">
                      <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium ${isPublished ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'}`}>
                        {isPublished ? 'Published' : 'Draft'}
                      </span>
                      {post.translation_status && post.translation_status !== 'completed' && (
                        <span className="block mt-1 text-[11px] text-gray-500">English translation: {post.translation_status}</span>
                      )}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-end gap-2">
                        {isPublished ? (
                          <button onClick={() => handleUnpublish(post.slug)} disabled={busy} title="Unpublish" aria-label="Unpublish post" className={`${actionClass} text-yellow-400`}>
                            <FiXCircle size={16} />
                          </button>
                        ) : (
                          <button onClick={() => handlePublish(post.slug)} disabled={busy} title="Publish" aria-label="Publish post" className={`${actionClass} text-green-400`}>
                            <FiCheckCircle size={16} />
                          </button>
                        )}

                        <button onClick={() => navigate(`/admin/posts/edit/${post.slug}`)} title="Edit" aria-label="Edit post" className={`${actionClass} text-blue-400`}>
                          <FiEdit2 size={16} />
                        </button>

                        <button onClick={() => handleDelete(post)} disabled={busy} title="Delete" aria-label="Delete post" className={`${actionClass} text-red-400`}>
                          <FiTrash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default PostsList;
