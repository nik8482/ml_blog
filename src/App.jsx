import React, { useState, useEffect } from 'react';
import { blogPosts } from './posts';
import katex from 'katex';
import 'katex/dist/katex.min.css';

// ============ CODE BLOCK ============
function CodeBlock({ code, lang = 'python' }) {
  const tokenize = (line) => {
    const keywords = ['def', 'return', 'import', 'from', 'for', 'in', 'if', 'else', 'class', 'self', 'with', 'as', 'while', 'True', 'False', 'None', 'lambda', 'and', 'or', 'not'];
    const parts = [];
    let current = '';
    let inStr = null;
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (inStr) {
        current += c;
        if (c === inStr) { parts.push({ type: 'string', text: current }); current = ''; inStr = null; }
      } else if (c === '"' || c === "'") {
        if (current) parts.push({ type: 'text', text: current });
        current = c; inStr = c;
      } else if (c === '#') {
        if (current) parts.push({ type: 'text', text: current });
        parts.push({ type: 'comment', text: line.slice(i) });
        return parts;
      } else if (/[\s().,:\[\]{}=+\-*/<>!]/.test(c)) {
        if (current) {
          if (keywords.includes(current)) parts.push({ type: 'keyword', text: current });
          else if (/^\d/.test(current)) parts.push({ type: 'number', text: current });
          else parts.push({ type: 'text', text: current });
          current = '';
        }
        parts.push({ type: 'punct', text: c });
      } else { current += c; }
    }
    if (current) {
      if (keywords.includes(current)) parts.push({ type: 'keyword', text: current });
      else parts.push({ type: 'text', text: current });
    }
    return parts;
  };

  const colorMap = {
    keyword: '#7c3aed',
    string: '#15803d',
    comment: '#9ca3af',
    number: '#b45309',
    punct: '#6b7280',
    text: '#1f2937',
  };

  return (
    <pre style={{
      background: '#f3f4f6',
      border: '1px solid #e5e7eb',
      borderRadius: '4px',
      padding: '1rem 1.25rem',
      overflow: 'auto',
      fontFamily: '"JetBrains Mono", "Fira Code", monospace',
      fontSize: '13px',
      lineHeight: 1.6,
      margin: '1.5rem 0',
    }}>
      <div style={{ fontSize: '10px', color: '#9ca3af', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '0.5rem' }}>{lang}</div>
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
      parts.push(<strong key={key++}>{token.slice(2, -2)}</strong>);
    } else if (token.startsWith('`')) {
      parts.push(
        <code key={key++} style={{ background: '#f3f4f6', border: '1px solid #e5e7eb', padding: '1px 5px', borderRadius: '3px', fontFamily: 'monospace', fontSize: '0.9em' }}>
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
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedPost, setSelectedPost] = useState(null);

  useEffect(() => { window.scrollTo(0, 0); }, [selectedPost]);

  const categories = [
    { id: 'all', name: 'all' },
    { id: 'fundamentals', name: 'fundamentals' },
    { id: 'inference', name: 'inference' },
    { id: 'safety', name: 'safety' },
    { id: 'projects', name: 'projects' },
    { id: 'other', name: 'other' },
  ];

  const filteredPosts = blogPosts.filter(post => {
    const matchesCategory = selectedCategory === 'all' || post.category === selectedCategory;
    const matchesSearch = post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          post.excerpt.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const formatDate = (s) => {
    const d = new Date(s);
    return d.toISOString().slice(0, 10);
  };

  const difficultyColor = { beginner: '#15803d', intermediate: '#b45309', advanced: '#dc2626' };

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
        const parseCells = (row) => row.split('|').map(c => c.trim()).filter((_, idx, arr) => idx > 0 && idx < arr.length - 1);
        elements.push(
          <div key={key} style={{ overflowX: 'auto', margin: '1.5rem 0' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px', fontFamily: 'monospace' }}>
              <thead>
                <tr>
                  {parseCells(header).map((cell, ci) => (
                    <th key={ci} style={{ padding: '8px 16px', textAlign: 'left', borderBottom: '2px solid #1a1a1a', whiteSpace: 'nowrap', fontWeight: 600 }}>
                      {renderInline(cell)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {body.map((row, ri) => (
                  <tr key={ri} style={{ background: ri % 2 === 0 ? '#f9fafb' : 'transparent' }}>
                    {parseCells(row).map((cell, ci) => (
                      <td key={ci} style={{ padding: '8px 16px', borderBottom: '1px solid #e5e7eb', color: '#374151' }}>
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
        if (line.startsWith('## ')) {
          elements.push(
            <h2 key={i} style={{ fontFamily: "'Courier Prime', 'Courier New', Courier, monospace", fontSize: '20px', fontWeight: 700, marginTop: '2.5rem', marginBottom: '0.75rem', color: '#1a1a1a' }}>
              {renderInline(line.replace(/^## /, ''))}
            </h2>
          );
        } else if (line.startsWith('- ')) {
          elements.push(
            <li key={i} style={{ fontSize: '16px', lineHeight: 1.8, color: '#374151', marginLeft: '1.5rem', marginBottom: '0.4rem', fontFamily: "'Courier Prime', 'Courier New', Courier, monospace" }}>
              {renderInline(line.replace(/^-\s+/, ''))}
            </li>
          );
        } else if (line.trim() === '') {
          return;
        } else {
          elements.push(
            <p key={i} style={{ fontSize: '16px', lineHeight: 1.8, color: '#374151', marginBottom: '1.1rem', fontFamily: "'Courier Prime', 'Courier New', Courier, monospace" }}>
              {renderInline(line)}
            </p>
          );
        }
      });
      flushTable('table-end');
      return <>{elements}</>;
    };

    return (
      <div style={{ minHeight: '100vh', background: '#fafaf8', color: '#1a1a1a', fontFamily: "'Courier Prime', 'Courier New', Courier, monospace" }}>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Courier+Prime:ital,wght@0,400;0,700;1,400&display=swap');
          * { box-sizing: border-box; }
          a { color: #1a1a1a; }
        `}</style>
        <div style={{ maxWidth: '680px', margin: '0 auto', padding: '3rem 1.5rem 6rem' }}>
          <button
            onClick={() => setSelectedPost(null)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '15px', color: '#1a1a1a', padding: 0, marginBottom: '3rem', textDecoration: 'underline', fontFamily: 'inherit' }}
          >
            ← back
          </button>

          <div style={{ marginBottom: '2rem' }}>
            <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '0.75rem', fontFamily: '"JetBrains Mono", monospace' }}>
              {formatDate(post.date)}
              {post.category && <span> · {post.category}</span>}
              {post.readTime && <span> · {post.readTime}</span>}
              {post.difficulty && <span style={{ color: difficultyColor[post.difficulty] }}> · {post.difficulty}</span>}
            </div>
            <h1 style={{ fontFamily: 'inherit', fontSize: 'clamp(24px, 4vw, 36px)', fontWeight: 700, lineHeight: 1.25, margin: '0 0 1rem', color: '#1a1a1a' }}>
              {post.title}
            </h1>
            {post.paper && (
              <p style={{ fontSize: '14px', color: '#6b7280', fontFamily: '"JetBrains Mono", monospace', margin: 0 }}>
                {post.paper}
              </p>
            )}
          </div>

          <hr style={{ border: 'none', borderTop: '1px solid #e5e7eb', margin: '2rem 0' }} />
          <article>{renderContent()}</article>
          <hr style={{ border: 'none', borderTop: '1px solid #e5e7eb', margin: '3rem 0 2rem' }} />

          <button
            onClick={() => setSelectedPost(null)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '15px', color: '#1a1a1a', padding: 0, textDecoration: 'underline', fontFamily: 'inherit' }}
          >
            ← back to all posts
          </button>
        </div>
      </div>
    );
  }

  // ==================== INDEX VIEW ====================
  return (
    <div style={{ minHeight: '100vh', background: '#fafaf8', color: '#1a1a1a' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Courier+Prime:ital,wght@0,400;0,700;1,400&display=swap');
        * { box-sizing: border-box; }
        body { margin: 0; font-family: 'Courier Prime', 'Courier New', Courier, monospace; }
        .post-link:hover .post-title { text-decoration: underline; }
        .nav-link { background: none; border: none; cursor: pointer; font-size: 15px; color: #1a1a1a; padding: 0; font-family: inherit; }
        .nav-link:hover { text-decoration: underline; }
        .nav-link.active { text-decoration: underline; }
        input::placeholder { color: #9ca3af; }
        input:focus { outline: none; }
        a { color: #1a1a1a; }
      `}</style>

      <div style={{ maxWidth: '700px', margin: '0 auto', padding: '4rem 1.5rem 6rem', fontFamily: "'Courier Prime', 'Courier New', Courier, monospace" }}>

        {/* HEADER */}
        <header style={{ marginBottom: '2.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '2rem' }}>
          <div>
            <h1 style={{ fontSize: '30px', fontWeight: 700, margin: '0 0 0.5rem', letterSpacing: '0', fontFamily: 'inherit' }}>
              Nikhil Modha
            </h1>
            <nav style={{ display: 'flex', alignItems: 'center', fontSize: '15px', flexWrap: 'wrap' }}>
              <a href="mailto:nikhil.modha21@gmail.com">email</a>
              <span style={{ color: '#9ca3af', margin: '0 0.5rem' }}>|</span>
              <a href="https://github.com/nik8482" target="_blank" rel="noopener noreferrer">github</a>
              <span style={{ color: '#9ca3af', margin: '0 0.5rem' }}>|</span>
              <a href="https://www.linkedin.com/in/nikhil-modha-7aa604119/" target="_blank" rel="noopener noreferrer">linkedin</a>
            </nav>
          </div>
          {/* Avatar placeholder — swap src for a real photo when ready */}
          <div style={{
            width: '90px', height: '90px', borderRadius: '50%', flexShrink: 0,
            background: '#e5e7eb', border: '2px solid #1a1a1a',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '22px', fontWeight: 700, color: '#6b7280', letterSpacing: '0.05em',
          }}>
            NM
          </div>
        </header>

        {/* BIO */}
        <p style={{ fontSize: '15px', lineHeight: 1.7, color: '#374151', marginBottom: '2.5rem', maxWidth: '560px', fontFamily: 'inherit' }}>
          ML engineer writing about machine learning from first principles — inference, fundamentals, safety, and the occasional detour.
        </p>

        {/* FILTER */}
        <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '0', fontSize: '15px' }}>
            {categories.map((cat, idx) => (
              <React.Fragment key={cat.id}>
                {idx > 0 && <span style={{ color: '#9ca3af', margin: '0 0.6rem' }}>|</span>}
                <button
                  className={`nav-link${selectedCategory === cat.id ? ' active' : ''}`}
                  onClick={() => setSelectedCategory(cat.id)}
                >
                  {cat.name}
                </button>
              </React.Fragment>
            ))}
          </div>
          <input
            type="text"
            placeholder="search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              border: 'none',
              borderBottom: '1px solid #d1d5db',
              background: 'transparent',
              fontSize: '15px',
              padding: '2px 0',
              width: '140px',
              fontFamily: 'inherit',
              color: '#1a1a1a',
            }}
          />
        </div>

        <hr style={{ border: 'none', borderTop: '1px solid #e5e7eb', marginBottom: '1.5rem' }} />

        {/* POSTS LIST */}
        <main>
          {filteredPosts.length === 0 ? (
            <p style={{ color: '#6b7280', fontSize: '15px' }}>No posts found.</p>
          ) : (
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {filteredPosts.map((post) => (
                <li key={post.id} style={{ marginBottom: '0.6rem' }}>
                  <button
                    onClick={() => setSelectedPost(post.id)}
                    className="post-link"
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: 0,
                      fontFamily: 'inherit',
                      fontSize: '15px',
                      color: '#1a1a1a',
                      textAlign: 'left',
                      display: 'flex',
                      alignItems: 'baseline',
                      gap: '0.75rem',
                    }}
                  >
                    <span style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: '13px', color: '#9ca3af', flexShrink: 0 }}>
                      {formatDate(post.date)}
                    </span>
                    <span className="post-title" style={{ borderBottom: '1px solid #1a1a1a' }}>{post.title}</span>
                    {post.difficulty && (
                      <span style={{ fontSize: '12px', color: difficultyColor[post.difficulty], fontFamily: '"JetBrains Mono", monospace', flexShrink: 0 }}>
                        {post.difficulty}
                      </span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </main>

        {/* FOOTER */}
        <footer style={{ marginTop: '4rem', fontSize: '14px', color: '#9ca3af' }}>
          {blogPosts.length} posts · built with curiosity and too much chai
        </footer>
      </div>
    </div>
  );
}
