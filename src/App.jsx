import React, { useState, useEffect } from 'react';
import { blogPosts } from './posts';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import profilePhoto from './assets/profile.jpeg';
import artImage from './assets/art.jpg';

// ============ DESIGN TOKENS ============
const c = {
  bg: '#f6f1e7',        // warm paper
  text: '#26221b',      // warm near-black ink
  muted: '#6f685c',
  faint: '#a59c89',
  border: '#e0d8c6',
  hairline: '#ece4d4',
  accent: '#9a6a2f',    // muted sepia/bronze
  codeBg: '#efe8d8',
  body: '#3c382f',
};
const sans = "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif";
const mono = "'JetBrains Mono', ui-monospace, 'SF Mono', Menlo, monospace";
const typewriter = "'Courier Prime', 'Courier New', Courier, monospace";

// ============ GOLD & BLACK MARBLE SIDEBARS ============
function SideDecor() {
  const panelBase = {
    position: 'fixed',
    top: 0,
    width: '165px',
    height: '100vh',
    backgroundImage: `url(${artImage})`,
    backgroundSize: 'cover',
    backgroundRepeat: 'no-repeat',
    pointerEvents: 'none',
    zIndex: 0,
  };

  return (
    <>
      <style>{`@media (max-width: 1180px) { .side-decor { display: none !important; } }`}</style>
      <div
        className="side-decor"
        style={{
          ...panelBase,
          left: 0,
          backgroundPosition: 'left center',
          borderRight: '2px solid #18181b',
        }}
      />
      <div
        className="side-decor"
        style={{
          ...panelBase,
          right: 0,
          backgroundPosition: 'right center',
          borderLeft: '2px solid #18181b',
        }}
      />
    </>
  );
}

// ============ CODE BLOCK ============
function CodeBlock({ code, lang = 'python' }) {
  const tokenize = (line) => {
    const keywords = ['def', 'return', 'import', 'from', 'for', 'in', 'if', 'else', 'class', 'self', 'with', 'as', 'while', 'True', 'False', 'None', 'lambda', 'and', 'or', 'not'];
    const parts = [];
    let current = '';
    let inStr = null;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (inStr) {
        current += ch;
        if (ch === inStr) { parts.push({ type: 'string', text: current }); current = ''; inStr = null; }
      } else if (ch === '"' || ch === "'") {
        if (current) parts.push({ type: 'text', text: current });
        current = ch; inStr = ch;
      } else if (ch === '#') {
        if (current) parts.push({ type: 'text', text: current });
        parts.push({ type: 'comment', text: line.slice(i) });
        return parts;
      } else if (/[\s().,:[\]{}=+\-*/<>!]/.test(ch)) {
        if (current) {
          if (keywords.includes(current)) parts.push({ type: 'keyword', text: current });
          else if (/^\d/.test(current)) parts.push({ type: 'number', text: current });
          else parts.push({ type: 'text', text: current });
          current = '';
        }
        parts.push({ type: 'punct', text: ch });
      } else { current += ch; }
    }
    if (current) {
      if (keywords.includes(current)) parts.push({ type: 'keyword', text: current });
      else parts.push({ type: 'text', text: current });
    }
    return parts;
  };

  const colorMap = {
    keyword: '#7c3aed',
    string: '#16a34a',
    comment: '#a1a1aa',
    number: '#ea580c',
    punct: '#52525b',
    text: '#27272a',
  };

  return (
    <pre style={{
      background: c.codeBg,
      border: `1px solid ${c.border}`,
      borderRadius: '8px',
      padding: '1rem 1.25rem',
      overflow: 'auto',
      fontFamily: mono,
      fontSize: '13.5px',
      lineHeight: 1.7,
      margin: '1.75rem 0',
    }}>
      <div style={{ fontSize: '10px', color: c.faint, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '0.6rem' }}>{lang}</div>
      <code>
        {code.split('\n').map((line, i) => (
          <div key={i}>
            {tokenize(line).map((tok, j) => (
              <span key={j} style={{ color: colorMap[tok.type] }}>{tok.text}</span>
            ))}
          </div>
        ))}
      </code>
    </pre>
  );
}

// ============ INLINE CONTENT: math + bold + inline code ============
function renderInline(text) {
  const parts = [];
  const re = /(\$[^$]+\$|\*\*[^*]+\*\*|`[^`]+`)/g;
  let last = 0; let match; let key = 0;
  while ((match = re.exec(text)) !== null) {
    if (match.index > last) parts.push(text.slice(last, match.index));
    const token = match[0];
    if (token.startsWith('$')) {
      try {
        const html = katex.renderToString(token.slice(1, -1), { throwOnError: false });
        parts.push(<span key={key++} dangerouslySetInnerHTML={{ __html: html }} />);
      } catch { parts.push(token); }
    } else if (token.startsWith('**')) {
      parts.push(<strong key={key++} style={{ fontWeight: 650 }}>{token.slice(2, -2)}</strong>);
    } else if (token.startsWith('`')) {
      parts.push(
        <code key={key++} style={{ background: c.hairline, border: `1px solid ${c.border}`, padding: '1px 5px', borderRadius: '4px', fontFamily: mono, fontSize: '0.88em' }}>
          {token.slice(1, -1)}
        </code>
      );
    }
    last = match.index + token.length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts;
}

// ============ MAIN COMPONENT ============
export default function MLBlog() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPost, setSelectedPost] = useState(null);

  // Keep the URL in sync with the open post so each post has its own shareable
  // link (/<slug>) — the prerender step bakes per-post OG tags into those paths.
  useEffect(() => {
    const syncFromPath = () => {
      const slug = window.location.pathname.replace(/^\/+|\/+$/g, '');
      const post = blogPosts.find(p => p.slug === slug);
      setSelectedPost(post ? post.id : null);
    };
    syncFromPath();
    window.addEventListener('popstate', syncFromPath);
    return () => window.removeEventListener('popstate', syncFromPath);
  }, []);

  const openPost = (id) => {
    const post = blogPosts.find(p => p.id === id);
    window.history.pushState({}, '', post?.slug ? `/${post.slug}` : '/');
    setSelectedPost(id);
  };
  const goHome = () => {
    window.history.pushState({}, '', '/');
    setSelectedPost(null);
  };

  useEffect(() => {
    window.scrollTo(0, 0);
    const post = blogPosts.find(p => p.id === selectedPost);
    document.title = post ? `${post.title} · Nikhil Modha` : 'Nikhil Modha';
  }, [selectedPost]);

  const filteredPosts = blogPosts.filter(post =>
    post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    post.excerpt.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (s) => {
    const d = new Date(s);
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const globalStyles = `
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&family=Courier+Prime:ital,wght@0,400;0,700;1,400&display=swap');
    * { box-sizing: border-box; }
    body { margin: 0; }
    ::selection { background: #e6d9bf; }
    a { color: ${c.text}; text-decoration: none; }
    .link-u { border-bottom: 1px solid ${c.border}; transition: border-color 0.15s ease; }
    .link-u:hover { border-color: ${c.text}; }
    .post-row:hover .post-title { color: ${c.accent}; }
    .post-row:hover .post-arrow { opacity: 1; transform: translateX(0); }
    input::placeholder { color: ${c.faint}; }
    input:focus { outline: none; }
    .back-btn:hover { color: ${c.text}; }
  `;

  // ==================== POST VIEW ====================
  if (selectedPost) {
    const post = blogPosts.find(p => p.id === selectedPost);

    const renderContent = () => {
      const lines = post.content.split('\n');
      const elements = [];
      let codeBlock = null;
      let tableRows = null;

      const flushTable = (key) => {
        if (!tableRows) return;
        const [header, , ...body] = tableRows;
        const parseCells = (row) => row.split('|').map(cell => cell.trim()).filter((_, idx, arr) => idx > 0 && idx < arr.length - 1);
        elements.push(
          <div key={key} style={{ overflowX: 'auto', margin: '1.75rem 0' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
              <thead>
                <tr>
                  {parseCells(header).map((cell, ci) => (
                    <th key={ci} style={{ padding: '8px 16px', textAlign: 'left', borderBottom: `2px solid ${c.text}`, whiteSpace: 'nowrap', fontWeight: 600 }}>
                      {renderInline(cell)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {body.map((row, ri) => (
                  <tr key={ri}>
                    {parseCells(row).map((cell, ci) => (
                      <td key={ci} style={{ padding: '8px 16px', borderBottom: `1px solid ${c.border}`, color: c.body }}>
                        {renderInline(cell)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
        tableRows = null;
      };

      lines.forEach((line, i) => {
        if (line.startsWith('```')) {
          if (codeBlock === null) {
            codeBlock = { lang: line.replace('```', '').trim() || 'python', lines: [] };
          } else {
            elements.push(<CodeBlock key={i} code={codeBlock.lines.join('\n')} lang={codeBlock.lang} />);
            codeBlock = null;
          }
          return;
        }
        if (codeBlock) { codeBlock.lines.push(line); return; }
        if (line.trim().startsWith('|')) {
          if (!tableRows) tableRows = [];
          tableRows.push(line);
          return;
        } else { flushTable(`table-${i}`); }
        const imgMatch = line.match(/^!\[([^\]]*)\]\(([^)"]+?)(?:\s+"([^"]+)")?\)$/);
        if (imgMatch) {
          const [, alt, src, caption] = imgMatch;
          elements.push(
            <figure key={i} style={{ margin: '2rem 0', padding: 0 }}>
              <img src={src} alt={alt} style={{ maxWidth: '100%', display: 'block', borderRadius: '8px', border: `1px solid ${c.border}` }} />
              {caption && <figcaption style={{ fontSize: '13px', color: c.faint, marginTop: '0.6rem', textAlign: 'center' }}>{caption}</figcaption>}
            </figure>
          );
        } else if (line.startsWith('## ')) {
          elements.push(
            <h2 key={i} style={{ fontSize: '21px', fontWeight: 650, letterSpacing: '-0.01em', marginTop: '2.75rem', marginBottom: '0.85rem', color: c.text }}>
              {renderInline(line.replace(/^## /, ''))}
            </h2>
          );
        } else if (line.startsWith('- ')) {
          elements.push(
            <li key={i} style={{ fontSize: '16.5px', lineHeight: 1.75, color: c.body, marginLeft: '1.25rem', marginBottom: '0.5rem' }}>
              {renderInline(line.replace(/^-\s+/, ''))}
            </li>
          );
        } else if (line.trim() === '') {
          return;
        } else {
          elements.push(
            <p key={i} style={{ fontSize: '16.5px', lineHeight: 1.75, color: c.body, marginBottom: '1.25rem' }}>
              {renderInline(line)}
            </p>
          );
        }
      });
      flushTable('table-end');
      return <>{elements}</>;
    };

    return (
      <div style={{ minHeight: '100vh', background: c.bg, color: c.text, fontFamily: typewriter, WebkitFontSmoothing: 'antialiased' }}>
        <style>{globalStyles}</style>
        <SideDecor />
        <div style={{ maxWidth: '660px', margin: '0 auto', padding: '3.5rem 1.5rem 7rem', position: 'relative', zIndex: 1 }}>
          <button
            onClick={goHome}
            className="back-btn"
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px', color: c.muted, padding: 0, marginBottom: '3rem', fontFamily: 'inherit', transition: 'color 0.15s ease' }}
          >
            ← back
          </button>

          <header style={{ marginBottom: '0.5rem' }}>
            <div style={{ fontSize: '13px', color: c.faint, marginBottom: '1rem', fontFamily: mono, display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <span>{formatDate(post.date)}</span>
              {post.category && <span>· {post.category}</span>}
              {post.readTime && <span>· {post.readTime}</span>}
            </div>
            <h1 style={{ fontSize: 'clamp(26px, 3.6vw, 34px)', fontWeight: 700, lineHeight: 1.25, margin: '0 0 1rem', color: c.text }}>
              {post.title}
            </h1>
            {post.paper && (
              <p style={{ fontSize: '14px', color: c.muted, fontFamily: mono, margin: 0 }}>
                {post.paper}
              </p>
            )}
          </header>

          <hr style={{ border: 'none', borderTop: `1px solid ${c.border}`, margin: '2.25rem 0' }} />
          <article>{renderContent()}</article>
          <hr style={{ border: 'none', borderTop: `1px solid ${c.border}`, margin: '3.5rem 0 2rem' }} />

          <button
            onClick={goHome}
            className="back-btn"
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px', color: c.muted, padding: 0, fontFamily: 'inherit', transition: 'color 0.15s ease' }}
          >
            ← back to all posts
          </button>
        </div>
      </div>
    );
  }

  // ==================== INDEX VIEW ====================
  return (
    <div style={{ minHeight: '100vh', background: c.bg, color: c.text, fontFamily: sans, WebkitFontSmoothing: 'antialiased' }}>
      <style>{globalStyles}</style>
      <SideDecor />

      <div style={{ maxWidth: '640px', margin: '0 auto', padding: '5rem 1.5rem 7rem', position: 'relative', zIndex: 1 }}>

        {/* HEADER */}
        <header style={{ marginBottom: '2.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.25rem' }}>
            <img
              src={profilePhoto}
              alt="Nikhil Modha"
              style={{ width: '56px', height: '56px', borderRadius: '50%', flexShrink: 0, objectFit: 'cover' }}
            />
            <div>
              <h1 style={{ fontSize: '22px', fontWeight: 650, letterSpacing: '-0.01em', margin: '0 0 0.25rem' }}>
                Nikhil Modha
              </h1>
              <nav style={{ display: 'flex', alignItems: 'center', fontSize: '14px', color: c.muted }}>
                <a className="link-u" href="mailto:nikhil.modha21@gmail.com">email</a>
                <span style={{ color: c.faint, margin: '0 0.6rem' }}>·</span>
                <a className="link-u" href="https://www.linkedin.com/in/nikhil-modha-7aa604119/" target="_blank" rel="noopener noreferrer">linkedin</a>
              </nav>
            </div>
          </div>

          {/* BIO */}
          <p style={{ fontSize: '16px', lineHeight: 1.7, color: c.body, margin: 0 }}>
            Senior ML Engineer. I use this blog as a scratchpad of my thoughts.
          </p>
        </header>

        {/* SEARCH */}
        <div style={{ marginBottom: '2rem' }}>
          <input
            type="text"
            placeholder="Search posts…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              border: `1px solid ${c.border}`,
              borderRadius: '8px',
              background: c.bg,
              fontSize: '14px',
              padding: '8px 12px',
              width: '100%',
              fontFamily: 'inherit',
              color: c.text,
            }}
          />
        </div>

        {/* POSTS LIST */}
        <main>
          <div style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.08em', color: c.faint, marginBottom: '0.75rem', fontFamily: mono }}>
            Writing
          </div>
          {filteredPosts.length === 0 ? (
            <p style={{ color: c.muted, fontSize: '15px' }}>No posts found.</p>
          ) : (
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {filteredPosts.map((post) => (
                <li key={post.id} style={{ borderBottom: `1px solid ${c.hairline}` }}>
                  <button
                    onClick={() => openPost(post.id)}
                    className="post-row"
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: '0.85rem 0',
                      width: '100%',
                      fontFamily: 'inherit',
                      color: c.text,
                      textAlign: 'left',
                      display: 'flex',
                      alignItems: 'baseline',
                      gap: '1rem',
                    }}
                  >
                    <span style={{ fontFamily: mono, fontSize: '12.5px', color: c.faint, flexShrink: 0, width: '92px' }}>
                      {formatDate(post.date)}
                    </span>
                    <span className="post-title" style={{ fontSize: '16px', fontWeight: 500, transition: 'color 0.15s ease' }}>
                      {post.title}
                    </span>
                    <span className="post-arrow" style={{ marginLeft: 'auto', color: c.accent, opacity: 0, transform: 'translateX(-4px)', transition: 'all 0.15s ease', flexShrink: 0 }}>
                      →
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </main>

        {/* FOOTER */}
        <footer style={{ marginTop: '4rem', fontSize: '13px', color: c.faint, fontFamily: mono }}>
          {blogPosts.length} posts · built with curiosity and too much chai
        </footer>
      </div>
    </div>
  );
}
