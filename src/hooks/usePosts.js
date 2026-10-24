import { useCallback, useEffect, useState } from 'react';
import axiosClient from '../Api/axiosClient';

// GET /posts — صفحة من المنشورات المنشورة (بلا ترتيب من الخادم)، نرتبها هنا من الأحدث نشراً.
// يُستخدم في قسم المنشورات وفي «مقالات أخرى» بصفحة المقال.
const publishedTime = (post) => {
  const time = new Date(post.published_at || 0).getTime();
  return Number.isNaN(time) ? 0 : time;
};

export function usePosts() {
  const [posts, setPosts] = useState([]);
  const [status, setStatus] = useState('loading');
  const load = useCallback(() => {
    let cancelled = false;
    setStatus('loading');
    axiosClient.get('/posts')
      .then((response) => {
        if (cancelled) return;
        const fetched = Array.isArray(response.data.data) ? response.data.data.filter(p => p?.slug) : [];
        setPosts([...fetched].sort((a, b) => publishedTime(b) - publishedTime(a)));
        setStatus('ready');
      })
      .catch(() => { if (!cancelled) setStatus('error'); });
    return () => { cancelled = true; };
  }, []);
  useEffect(() => load(), [load]);
  return { posts, status, retry: load };
}

