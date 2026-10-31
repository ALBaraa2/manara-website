import React, { useContext, useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiArrowLeft, FiArrowRight, FiArrowUpRight } from 'react-icons/fi';
import { LanguageContext } from '../LanguageContext';
import axiosClient from '../Api/axiosClient';
import { localize } from '../lib/localize';
import { resolveMediaUrl } from '../lib/media';
import { formatDate, readingTime, EASE } from '../lib/brand';
import { usePosts } from '../hooks/usePosts';
import { CoverImage, Kicker } from './brand';
import Navbar from './Navbar';
import Footer from './Footer';

// شريط تقدّم القراءة: يكتب transform فقط (بلا إعادة رسم)، ويُحدَّث مرة واحدة لكل إطار
function ReadingProgress({ target }) {
  const bar = useRef(null);
  useEffect(() => {
    let raf = 0;
    const update = () => {
      raf = 0;
      const el = target.current;
      if (!el || !bar.current) return;
      const rect = el.getBoundingClientRect();
      const total = Math.max(1, rect.height - window.innerHeight * 0.6);
      const p = Math.min(1, Math.max(0, (window.innerHeight * 0.25 - rect.top) / total));
      bar.current.style.transform = `scaleX(${p})`;
    };
    const schedule = () => { if (!raf) raf = requestAnimationFrame(update); };
    update();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    return () => { cancelAnimationFrame(raf); window.removeEventListener('scroll', schedule); window.removeEventListener('resize', schedule); };
  }, [target]);
  return <div className="reading-progress" aria-hidden="true"><span ref={bar} /></div>;
}

// المحتوى نص عادي: الأسطر الفارغة تفصل الفقرات، والأسطر المفردة تبقى داخل الفقرة
const paragraphs = (text) => String(text || '').split(/\n\s*\n/).map(p => p.trim()).filter(Boolean);

// صفحة المنشور الكاملة: GET /posts/{slug} (المنشور فقط — المسودات تعيد 404)
function PostDetail() {
  const { slug } = useParams();
  const { lang } = useContext(LanguageContext);
  const isAr = lang === 'AR';
  const article = useRef(null);

  const [post, setPost] = useState(null);
  const [status, setStatus] = useState('loading');
  const { posts: allPosts } = usePosts();

  useEffect(() => {
    let cancelled = false;
    setStatus('loading');
    window.scrollTo({ top: 0, behavior: 'instant' });

    axiosClient.get(`/posts/${slug}`)
      .then((response) => {
        if (cancelled) return;
        setPost(response.data.data);
        setStatus('ready');
      })
      .catch((error) => {
        if (!cancelled) setStatus(error.response?.status === 404 ? 'not-found' : 'error');
      });

    return () => {
      cancelled = true;
    };
  }, [slug]);

  const title = post ? localize(post.title, lang) : '';
  const content = post ? localize(post.content, lang) : '';
  const coverUrl = post ? resolveMediaUrl(post.cover_image) : null;
  const postDate = formatDate(post?.published_at, isAr);
  const others = allPosts.filter(p => p.slug !== slug).slice(0, 3);

  useEffect(() => {
    if (title) document.title = `${title} | ${isAr ? 'منارة' : 'Manara'}`;
    return () => {
      document.title = 'منارة';
    };
  }, [title, isAr]);

  const BackIcon = isAr ? FiArrowRight : FiArrowLeft;

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Navbar />
      {status === 'ready' && <ReadingProgress target={article} />}

      <main className="flex-1" dir={isAr ? 'rtl' : 'ltr'}>
        <header className="post-hero">
          <div className="container mx-auto px-6 md:px-10 pt-28 pb-6">
            <div className="max-w-3xl mx-auto">
              <Link to="/#posts" className="inline-flex items-center gap-2 text-brand-orange-light hover:text-white text-sm font-semibold transition-colors">
                <BackIcon aria-hidden="true" />
                {isAr ? 'العودة إلى المنشورات' : 'Back to posts'}
              </Link>

              {status === 'loading' && <p className="text-brand-gray py-16" role="status">{isAr ? 'جاري تحميل المنشور…' : 'Loading post…'}</p>}

              {(status === 'not-found' || status === 'error') && (
                <div className="py-14" role="alert">
                  <h1 className="text-3xl font-bold text-white">
                    {status === 'not-found' ? (isAr ? 'المنشور غير موجود' : 'Post not found') : (isAr ? 'تعذّر تحميل المنشور' : 'Could not load this post')}
                  </h1>
                  <p className="text-brand-gray mt-3">
                    {status === 'not-found' ? (isAr ? 'ربما حُذف هذا المنشور أو أُلغي نشره.' : 'This post may have been removed or unpublished.') : (isAr ? 'يرجى المحاولة مرة أخرى لاحقاً.' : 'Please try again later.')}
                  </p>
                </div>
              )}

              {status === 'ready' && (
                <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease: EASE }} className="pt-6">
                  <Kicker tone="dark">{isAr ? 'من منارة' : 'From Manara'}</Kicker>
                  <h1 className="mt-3 text-2xl md:text-4xl font-bold text-white leading-[1.35]" dir="auto">{title}</h1>
                  <p className="mt-4 flex flex-wrap items-center gap-2 text-sm text-brand-gray">
                    {postDate && <time dateTime={post.published_at}>{postDate}</time>}
                    {postDate && <span aria-hidden="true">·</span>}
                    <span>{readingTime(content, isAr)}</span>
                  </p>
                </motion.div>
              )}
            </div>
          </div>
        </header>

        {status === 'ready' && (
          <article ref={article} className="container mx-auto px-6 md:px-10 pb-20">
            {coverUrl && (
              <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.1, ease: EASE }} className="max-w-4xl mx-auto -mt-2">
                <CoverImage src={coverUrl} tone="light" className="aspect-[16/9] rounded-3xl shadow-xl shadow-brand-purple/10" />
              </motion.div>
            )}
            {/* المحتوى نص عادي — React يهرّب أي HTML تلقائياً */}
            <div className="post-body max-w-[68ch] mx-auto mt-12" dir="auto">
              {paragraphs(content).map((para, i) => <p key={i}>{para}</p>)}
            </div>
          </article>
        )}

        {status === 'ready' && others.length > 0 && (
          <aside className="bg-brand-tint py-16" aria-labelledby="more-reading">
            <div className="container mx-auto px-6 md:px-10">
              <h2 id="more-reading" className="text-2xl font-bold text-brand-purple mb-8">{isAr ? 'مقالات أخرى من منارة' : 'More from Manara'}</h2>
              <ul className="post-grid">
                {others.map(p => (
                  <li key={p.id ?? p.slug}>
                    <Link to={`/posts/${p.slug}`} className="post-grid-item group">
                      <CoverImage src={resolveMediaUrl(p.cover_image)} tone="light" className="post-grid-media" imgClassName="post-zoom" />
                      <span className="post-meta">{formatDate(p.published_at, isAr)}</span>
                      <span className="post-title block text-lg leading-snug mt-1.5 line-clamp-2" dir="auto"><span>{localize(p.title, lang)}</span></span>
                      <span className="post-read mt-3 text-sm">{isAr ? 'اقرأ' : 'Read'}<FiArrowUpRight aria-hidden="true" className={isAr ? '-scale-x-100' : ''} /></span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </aside>
        )}
      </main>

      <Footer />
    </div>
  );
}

export default PostDetail;
