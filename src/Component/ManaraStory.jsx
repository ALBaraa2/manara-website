import React from 'react';
import {
  FiZapOff, FiWifiOff, FiMonitor, FiCpu, FiBookOpen, FiBriefcase, FiUsers, FiHome, FiTrendingUp, FiLink, FiPackage, FiMinimize2,
} from 'react-icons/fi';
import StoryChapter, { ClarityGroup } from './StoryChapter';
// أزرار المشاركة تفتح نموذج التواصل الموجود وتحدد موضوع الرسالة (يستمع له Contact)
import { announceIntent } from '../lib/contactIntent';

const ICONS = {
  power: FiZapOff, wifi: FiWifiOff, device: FiMonitor, cpu: FiCpu, book: FiBookOpen, briefcase: FiBriefcase,
  users: FiUsers, space: FiHome, growth: FiTrendingUp, link: FiLink, resources: FiPackage, limit: FiMinimize2,
};
const Icon = ({ name }) => { const C = ICONS[name]; return C ? <C aria-hidden="true" focusable="false" /> : null; };


// كل النصوص التي يعرضها المشهد بترتيب ظهورها، ليتضح تباعاً
function beatStrings(beat) {
  const v = beat.visual || {};
  return [
    ...(beat.text || []),
    v.from, v.to, ...(v.rows || []).flatMap(r => (Array.isArray(r) ? r : [r.label, r.text])),
    ...(v.steps || []), ...(v.items || []).flatMap(it => [it.label, it.title, it.desc, it.meets]),
    v.text, ...(beat.actions || []).map(a => a.label),
  ].filter(Boolean);
}

function Visual({ v, w, copy }) {
  switch (v.kind) {
    case 'signals':
      return <ul className="story-signals">{v.items.map((it, i) => <li key={i} className="story-signal" style={{ '--i': i }}>
        <Icon name={it.icon} /><span>{w(it.label)}</span>
      </li>)}</ul>;
    case 'path':
      return <ol className={`story-path${v.broken ? ' is-broken' : ''}`} style={{ '--n': v.steps.length }}>{v.steps.map((step, i) => <li key={i} className="story-path-step" style={{ '--i': i }}>
        <span className="story-path-dot" aria-hidden="true" />{w(step)}
      </li>)}</ol>;
    case 'map':
      return <div className="story-map">
        <p className="story-map-head"><span>{w(v.from)}</span><span>{w(v.to)}</span></p>
        <ul>{v.rows.map(([from, to], i) => <li key={i} style={{ '--i': i }}>
          <span className="story-map-from">{w(from)}</span>
          <span className="story-map-arrow" aria-hidden="true">←</span>
          <span className="story-map-to">{w(to)}</span>
        </li>)}</ul>
      </div>;
    case 'cards':
      return <ul className={`story-cards story-cards--${v.variant}`}>{v.items.map((it, i) => <li key={i} className="story-card" style={{ '--i': i }}>
        <Icon name={it.icon} />
        <strong>{w(it.title)}</strong>
        {it.desc && <span className="story-card-desc">{w(it.desc)}</span>}
        {it.meets && <span className="story-card-meets"><span>{copy.meets}</span> {w(it.meets)}</span>}
      </li>)}</ul>;
    case 'gap':
      return <dl className="story-gap">{v.rows.map((row, i) => <div key={i} className={`story-gap-row${row.full ? ' is-full' : ''}`}>
        <dt>{w(row.label)}</dt><dd>{w(row.text)}</dd>
      </div>)}</dl>;
    case 'statement':
      return <p className="story-statement">{w(v.text)}</p>;
    case 'question':
      return <p className="story-question"><span>{w(v.text)}</span><span aria-hidden="true">↓</span></p>;
    default:
      return null;
  }
}

// الفصل: عنوان ثابت، ثم مشاهد تتبدّل داخل البطاقة. tone يمنح كل فصل طابعه البصري.
export default function ManaraStory({ copy }) {
  return <div className="manara-chapters">
    {copy.chapters.map((chapter, index) => (
      <StoryChapter key={chapter.id} id={chapter.id} tone={chapter.tone} beats={chapter.beats.length} layoutKey={chapter.title} entry={index === 0}>
        <ClarityGroup as="header" strings={[chapter.title]} className="manara-chapter-head">{(w) => <>
          <h2 id={`${chapter.id}-title`}>{w(chapter.title)}</h2>
        </>}</ClarityGroup>
        <div className="manara-beats">
          {chapter.beats.map((beat, i) => <ClarityGroup key={i} beat={i} strings={beatStrings(beat)} className="manara-beat">{(w) => <>
            {(beat.text || []).map((para, j) => <p key={j} className="manara-beat-text">{w(para)}</p>)}
            {beat.visual && <Visual v={beat.visual} w={w} copy={copy} />}
            {beat.actions && <div className="manara-actions">{beat.actions.map(action => (
              <a key={action.intent} href="#contact" onClick={() => announceIntent(action.intent)}
                className={action.primary ? 'manara-primary' : 'manara-secondary'}>
                <span>{w(action.label)}</span>{action.primary && <span aria-hidden="true">↗</span>}
              </a>
            ))}</div>}
          </>}</ClarityGroup>)}
        </div>
        {chapter.beats.length > 1 && <ol className="manara-steps" aria-hidden="true">
          {chapter.beats.map((_, i) => <li key={i} data-step={i} />)}
        </ol>}
      </StoryChapter>
    ))}
  </div>;
}
