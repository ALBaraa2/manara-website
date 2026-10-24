import React, { useContext, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiArrowUpRight, FiRefreshCw } from 'react-icons/fi';
import { LanguageContext } from '../LanguageContext';
import { localize } from '../lib/localize';
import { resolveMediaUrl } from '../lib/media';
import { CoverImage, Kicker } from './brand';
import { excerpt, formatDate, readingTime, reveal } from '../lib/brand';
import { usePosts } from '../hooks/usePosts';

// تصميم تحريري: مقال رئيسي (الأحدث نشراً — لا نسميه «مميزاً» أو «الأكثر قراءة»)، ثلاثة مقالات مختصرة بجانبه،
// وبقية المنشورات المتاحة خلف «عرض المزيد». البيانات من GET /posts (المنشور فقط) مرتبة هنا حسب تاريخ النشر.
// لا يعيد الـ API تصنيفات أو كتّاباً، لذا نعرض التاريخ ومدة القراءة (مشتقة من النص الفعلي) فقط.
function Meta({ post, lang, isAr }) {
  const date = formatDate(post.published_at, isAr);
  const content = localize(post.content, lang);
  return (
    <p className="post-meta">
      {date && <time dateTime={post.published_at}>{date}</time>}
      {date && <span aria-hidden="true">·</span>}
      <span>{readingTime(content, isAr)}</span>
    </p>
  );
}

function LeadPost({ post, lang, isAr }) {
  const title = localize(post.title, lang);
  return (
    <motion.article {...reveal()} className="post-lead group">
      <Link to={`/posts/${post.slug}`} className="post-lead-link">
        <CoverImage src={resolveMediaUrl(post.cover_image)} tone="light" className="post-lead-media" imgClassName="post-zoom" />
        <div className="post-lead-body">
          <Meta post={post} lang={lang} isAr={isAr} />
          <h3 className="post-title text-2xl md:text-[2.1rem] leading-snug mt-3" dir="auto"><span>{title}</span></h3>
          <p className="mt-4 text-gray-600 leading-8 line-clamp-3" dir="auto">{excerpt(localize(post.content, lang), 260)}</p>
          <span className="post-read mt-5">{isAr ? 'اقرأ المقال' : 'Read the article'}<FiArrowUpRight aria-hidden="true" className={isAr ? '-scale-x-100' : ''} /></span>
        </div>
      </Link>
    </motion.article>
  );
}

function CompactPost({ post, lang, isAr, index }) {
  const title = localize(post.title, lang);
  return (
    <motion.li {...reveal(0.08 * index, 16)}>
      <Link to={`/posts/${post.slug}`} className="post-compact group">
        <CoverImage src={resolveMediaUrl(post.cover_image)} tone="light" className="post-compact-media" imgClassName="post-zoom" />
        <span className="min-w-0">
          <Meta post={post} lang={lang} isAr={isAr} />
          <span className="post-title block text-lg leading-snug mt-1.5 line-clamp-3" dir="auto"><span>{title}</span></span>
        </span>
      </Link>
    </motion.li>
  );
}

function GridPost({ post, lang, isAr }) {
  const title = localize(post.title, lang);
  return (
    <motion.li initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
      <Link to={`/posts/${post.slug}`} className="post-grid-item group">
        <CoverImage src={resolveMediaUrl(post.cover_image)} tone="light" className="post-grid-media" imgClassName="post-zoom" />
        <Meta post={post} lang={lang} isAr={isAr} />
        <span className="post-title block text-lg leading-snug mt-1.5 line-clamp-2" dir="auto"><span>{title}</span></span>
      </Link>
    </motion.li>
  );
}

function LatestPostsSection() {
  const { lang } = useContext(LanguageContext);
  const isAr = lang === 'AR';
  const { posts, status, retry } = usePosts();
  const [expanded, setExpanded] = useState(false);

  const [lead, ...others] = posts;
  const side = others.slice(0, 3);
  const more = others.slice(3);

  return (
    <section id="posts" className="posts-section" aria-labelledby="posts-title">
      <div className="container mx-auto px-6 md:px-10" dir={isAr ? 'rtl' : 'ltr'}>
        <motion.div {...reveal()} className="posts-masthead">
          <div>
            <Kicker tone="light">{isAr ? 'من منارة' : 'From Manara'}</Kicker>
            <h2 id="posts-title" className="mt-4 text-3xl md:text-[2.6rem] font-bold text-brand-purple leading-tight">{isAr ? 'أحدث المنشورات والمقالات' : 'Latest Posts & Articles'}</h2>
          </div>
          <p className="text-gray-600 max-w-md leading-relaxed">{isAr ? 'أخبار منارة وأنشطتها، ونصائح وتحديثات تقنية من الفريق.' : 'Manara news and activities, plus tips and technical updates from the team.'}</p>
        </motion.div>

        {status === 'loading' && (
          <div aria-hidden="true" className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-7 skeleton-block skeleton-block--light rounded-3xl h-[28rem]" />
            <div className="lg:col-span-5 grid gap-4">{[0, 1, 2].map(i => <div key={i} className="skeleton-block skeleton-block--light rounded-2xl h-28" />)}</div>
            <span className="sr-only" role="status">{isAr ? 'جاري تحميل المقالات…' : 'Loading posts…'}</span>
          </div>
        )}

        {status === 'error' && (
          <div className="post-state" role="alert">
            <p className="font-bold text-brand-purple">{isAr ? 'تعذّر تحميل المنشورات حالياً.' : 'Posts could not be loaded right now.'}</p>
            <button type="button" onClick={retry} className="post-read mt-4"><FiRefreshCw aria-hidden="true" />{isAr ? 'إعادة المحاولة' : 'Try again'}</button>
          </div>
        )}

        {status === 'ready' && posts.length === 0 && (
          <div className="post-state"><p className="text-gray-600">{isAr ? 'لا توجد منشورات بعد — ستظهر هنا أخبار منارة ومقالاتها فور نشرها.' : 'No posts yet — Manara news and articles will appear here once published.'}</p></div>
        )}

        {status === 'ready' && lead && (
          <>
            <div className={`grid grid-cols-1 gap-8 lg:gap-10 ${side.length ? 'lg:grid-cols-12' : ''}`}>
              <div className={side.length ? 'lg:col-span-7' : ''}><LeadPost post={lead} lang={lang} isAr={isAr} /></div>
              {side.length > 0 && (
                <ul className="lg:col-span-5 post-side">
                  {side.map((post, i) => <CompactPost key={post.id ?? post.slug} post={post} lang={lang} isAr={isAr} index={i} />)}
                </ul>
              )}
            </div>
            {more.length > 0 && (
              <div className="mt-12">
                {expanded && (
                  <ul className="post-grid" id="more-posts">
                    {more.map(post => <GridPost key={post.id ?? post.slug} post={post} lang={lang} isAr={isAr} />)}
                  </ul>
                )}
                {!expanded && (
                  <button type="button" onClick={() => setExpanded(true)} className="post-more">
                    {isAr ? `عرض المزيد من المنشورات (${more.length})` : `Show more posts (${more.length})`}
                  </button>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}

export default LatestPostsSection;
