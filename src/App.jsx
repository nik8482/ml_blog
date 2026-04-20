import React, { useState, useEffect, useRef } from 'react';
import { Search, ArrowUpRight, ArrowLeft, Circle } from 'lucide-react';
import { blogPosts } from './posts';

// ============ BACKGROUND: Animated Neural Network ============
function NeuralBackground() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let raf;
    let w, h;
    let isMobile = window.innerWidth < 768;
    // Cap dpr on mobile — phones often report 3x which triples GPU load
    const dpr = Math.min(window.devicePixelRatio || 1, isMobile ? 1.5 : 2);

    // Fewer, chunkier nodes on mobile. Portrait-friendly shape.
    const layers = isMobile ? [3, 5, 5, 3] : [5, 8, 8, 4];
    const nodes = [];
    layers.forEach((count, layerIdx) => {
      const layerNodes = [];
      for (let i = 0; i < count; i++) {
        layerNodes.push({
          layer: layerIdx,
          idx: i,
          count,
          phase: Math.random() * Math.PI * 2,
        });
      }
      nodes.push(layerNodes);
    });

    const resize = () => {
      isMobile = window.innerWidth < 768;
      // Use documentElement.clientHeight instead of innerHeight — doesn't change
      // when mobile URL bar shows/hides, which prevents constant re-layout.
      const cssW = window.innerWidth;
      const cssH = document.documentElement.clientHeight;
      w = canvas.width = cssW * dpr;
      h = canvas.height = cssH * dpr;
      canvas.style.width = cssW + 'px';
      canvas.style.height = cssH + 'px';
    };
    resize();

    // Debounce resize so it only fires after the user's done resizing
    let resizeTimer;
    const onResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(resize, 150);
    };
    window.addEventListener('resize', onResize);

    const getPos = (node) => {
      const marginX = w * (isMobile ? 0.08 : 0.15);
      const usableW = w - marginX * 2;
      const x = marginX + (usableW / (layers.length - 1)) * node.layer;
      const spacing = h / (node.count + 1);
      const y = spacing * (node.idx + 1);
      return { x, y };
    };

    // Pause rendering when the tab isn't visible (saves battery, stops jank on resume)
    let visible = !document.hidden;
    const onVisibility = () => {
      visible = !document.hidden;
      if (visible && !raf) loop();
    };
    document.addEventListener('visibilitychange', onVisibility);

    let t = 0;
    const loop = () => {
      if (!visible) {
        raf = null;
        return;
      }
      t += 0.004;
      ctx.clearRect(0, 0, w, h);

      for (let l = 0; l < nodes.length - 1; l++) {
        for (const a of nodes[l]) {
          for (const b of nodes[l + 1]) {
            const pa = getPos(a);
            const pb = getPos(b);
            const activation = (Math.sin(t * 2 + a.phase + b.phase) + 1) / 2;
            const alpha = 0.04 + activation * 0.12;
            ctx.strokeStyle = `rgba(120, 200, 255, ${alpha})`;
            ctx.lineWidth = 1 * dpr;
            ctx.beginPath();
            ctx.moveTo(pa.x, pa.y);
            ctx.lineTo(pb.x, pb.y);
            ctx.stroke();

            const dx = pb.x - pa.x;
            const dy = pb.y - pa.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            // Speed in pixels per time unit — constant regardless of line length
            const pxPerUnit = 220 * dpr;
            const travel = ((t * pxPerUnit + a.phase * 50) % dist) / dist;
            if (activation > 0.7) {
              const px = pa.x + dx * travel;
              const py = pa.y + dy * travel;
              ctx.fillStyle = `rgba(180, 230, 255, ${0.6 * activation})`;
              ctx.beginPath();
              ctx.arc(px, py, 2 * dpr, 0, Math.PI * 2);
              ctx.fill();
            }
          }
        }
      }

      for (const layer of nodes) {
        for (const node of layer) {
          const { x, y } = getPos(node);
          const pulse = (Math.sin(t * 1.5 + node.phase) + 1) / 2;
          const r = (3 + pulse * 2) * dpr;
          ctx.fillStyle = `rgba(140, 210, 255, ${0.35 + pulse * 0.35})`;
          ctx.beginPath();
          ctx.arc(x, y, r, 0, Math.PI * 2);
          ctx.fill();

          // Skip the expensive radial gradient glow on mobile
          if (!isMobile) {
            const grad = ctx.createRadialGradient(x, y, 0, x, y, r * 6);
            grad.addColorStop(0, `rgba(140, 210, 255, ${0.15 * pulse})`);
            grad.addColorStop(1, 'rgba(140, 210, 255, 0)');
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(x, y, r * 6, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }

      raf = requestAnimationFrame(loop);
    };
    loop();

    return () => {
      if (raf) cancelAnimationFrame(raf);
      clearTimeout(resizeTimer);
      window.removeEventListener('resize', onResize);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 0,
        opacity: 0.55,
        pointerEvents: 'none',
      }}
    />
  );
}

// ============ CODE BLOCK with naive syntax coloring ============
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
        if (c === inStr) {
          parts.push({ type: 'string', text: current });
          current = '';
          inStr = null;
        }
      } else if (c === '"' || c === "'") {
        if (current) parts.push({ type: 'text', text: current });
        current = c;
        inStr = c;
      } else if (c === '#') {
        if (current) parts.push({ type: 'text', text: current });
        parts.push({ type: 'comment', text: line.slice(i) });
        current = '';
        return parts;
      } else if (/[\s().,:\[\]{}=+\-*/<>!]/.test(c)) {
        if (current) {
          if (keywords.includes(current)) parts.push({ type: 'keyword', text: current });
          else if (/^\d/.test(current)) parts.push({ type: 'number', text: current });
          else parts.push({ type: 'text', text: current });
          current = '';
        }
        parts.push({ type: 'punct', text: c });
      } else {
        current += c;
      }
    }
    if (current) {
      if (keywords.includes(current)) parts.push({ type: 'keyword', text: current });
      else parts.push({ type: 'text', text: current });
    }
    return parts;
  };

  const colorMap = {
    keyword: '#ff9ec9',
    string: '#c5e88c',
    comment: '#6b8299',
    number: '#ffcc88',
    punct: '#8aa4be',
    text: '#d4e0eb',
  };

  return (
    <pre style={{
      background: 'rgba(5, 10, 20, 0.8)',
      border: '1px solid rgba(140, 210, 255, 0.15)',
      borderRadius: '6px',
      padding: '1rem 1.25rem',
      overflow: 'auto',
      fontFamily: 'JetBrains Mono, monospace',
      fontSize: '13px',
      lineHeight: 1.6,
      margin: '1.5rem 0',
    }}>
      <div style={{ fontSize: '10px', color: '#6b8299', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
        {lang}
      </div>
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

// ============ MAIN COMPONENT ============
export default function MLBlog() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedPost, setSelectedPost] = useState(null);


  const categories = [
    { id: 'all', name: 'all' },
    { id: 'fundamentals', name: 'fundamentals' },
    { id: 'inference', name: 'inference' },
    { id: 'transformers', name: 'transformers' },
    { id: 'safety', name: 'safety' },
    { id: 'rl', name: 'rl' },
    { id: 'others', name: 'others' },
  ];

  const filteredPosts = blogPosts.filter(post => {
    const matchesCategory = selectedCategory === 'all' || post.category === selectedCategory;
    const matchesSearch = post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          post.excerpt.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const formatDate = (s) => {
    const d = new Date(s);
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }).toLowerCase();
  };

  const difficultyColor = {
    beginner: '#99ffbb',
    intermediate: '#ffdd88',
    advanced: '#ff9ec9',
  };

  // ==================== POST VIEW ====================
  if (selectedPost) {
    const post = blogPosts.find(p => p.id === selectedPost);

    const renderContent = () => {
      const lines = post.content.split('\n');
      const elements = [];
      let codeBlock = null;
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
        if (codeBlock) {
          codeBlock.lines.push(line);
          return;
        }
        if (line.startsWith('## ')) {
          elements.push(
            <h2 key={i} style={{ fontFamily: 'IBM Plex Serif, serif', fontSize: '24px', marginTop: '2.5rem', marginBottom: '1rem', color: '#e8f0f8' }}>
              {line.replace('## ', '')}
            </h2>
          );
        } else if (line.startsWith('- ')) {
          elements.push(
            <li key={i} style={{ fontSize: '16px', lineHeight: 1.75, color: '#c5d8ea', marginLeft: '1.5rem', marginBottom: '0.5rem' }}>
              {line.replace('- ', '')}
            </li>
          );
        } else if (line.trim() === '') {
          return;
        } else {
          elements.push(
            <p key={i} style={{ fontSize: '16px', lineHeight: 1.75, color: '#c5d8ea', marginBottom: '1rem' }}>
              {line}
            </p>
          );
        }
      });
      return <>{elements}</>;
    };

    return (
      <div style={{ minHeight: '100vh', background: '#050810', color: '#e8f0f8', position: 'relative' }}>
        <NeuralBackground />
        <div style={{ position: 'relative', zIndex: 1, maxWidth: '760px', margin: '0 auto', padding: '3rem 1.5rem 6rem' }}>
          <button
            onClick={() => setSelectedPost(null)}
            style={{
              background: 'none',
              border: 'none',
              color: '#7fd1ff',
              cursor: 'pointer',
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: '13px',
              padding: 0,
              marginBottom: '3rem',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <ArrowLeft size={14} /> back to index
          </button>

          <div style={{ marginBottom: '2rem' }}>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', fontFamily: 'JetBrains Mono, monospace', fontSize: '12px' }}>
              <span style={{ color: '#6ea8d0' }}>{formatDate(post.date)}</span>
              <span style={{ color: '#445a72' }}>·</span>
              <span style={{ color: '#7fd1ff' }}>{post.category}</span>
              <span style={{ color: '#445a72' }}>·</span>
              <span style={{ color: '#6ea8d0' }}>{post.readTime}</span>
              {post.difficulty && (
                <>
                  <span style={{ color: '#445a72' }}>·</span>
                  <span style={{ color: difficultyColor[post.difficulty] }}>{post.difficulty}</span>
                </>
              )}
            </div>
            <h1 style={{
              fontFamily: 'IBM Plex Serif, serif',
              fontSize: 'clamp(32px, 5vw, 44px)',
              fontWeight: 500,
              lineHeight: 1.15,
              letterSpacing: '-0.02em',
              margin: '0 0 1.25rem',
            }}>
              {post.title}
            </h1>
            {post.paper && (
              <div style={{
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: '12px',
                color: '#8aa4be',
                padding: '8px 12px',
                background: 'rgba(140, 210, 255, 0.05)',
                border: '1px solid rgba(140, 210, 255, 0.15)',
                borderRadius: '4px',
                display: 'inline-block',
              }}>
                ref → {post.paper}
              </div>
            )}
          </div>

          <article>{renderContent()}</article>

          <div style={{ marginTop: '4rem', paddingTop: '2rem', borderTop: '1px solid rgba(140, 210, 255, 0.15)' }}>
            <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '12px', color: '#6b8299', marginBottom: '1rem' }}>
              // end of post
            </p>
            <button
              onClick={() => setSelectedPost(null)}
              style={{
                background: 'rgba(140, 210, 255, 0.08)',
                border: '1px solid rgba(140, 210, 255, 0.3)',
                color: '#7fd1ff',
                padding: '10px 18px',
                borderRadius: '4px',
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: '13px',
                cursor: 'pointer',
              }}
            >
              ← read another
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ==================== INDEX VIEW ====================
  return (
    <div style={{ minHeight: '100vh', background: '#050810', color: '#e8f0f8', position: 'relative', overflow: 'hidden' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Serif:ital,wght@0,400;0,500;0,600;1,400&family=JetBrains+Mono:wght@400;500;600&display=swap');
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes blink {
          0%, 50% { opacity: 1; }
          51%, 100% { opacity: 0; }
        }
        .fade-up { animation: fadeUp 0.6s ease-out backwards; }
        .cursor-blink { animation: blink 1.1s infinite; }
        @media (max-width: 640px) {
          .post-row {
            grid-template-columns: 1fr !important;
            gap: 0.5rem !important;
          }
          .post-row .post-arrow { display: none; }
        }
      `}</style>

      <NeuralBackground />

      <div style={{ position: 'relative', zIndex: 1 }}>
        {/* HEADER */}
        <header style={{ padding: '2rem 1.5rem 0' }}>
          <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '13px', fontWeight: 500 }}>
              <span style={{ color: '#7fd1ff' }}>./lab-notebook</span>
              <span style={{ color: '#445a72' }}>/</span>
              <span style={{ color: '#9db4cc' }}>nikhil_modha</span>
            </div>
            <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '11px', color: '#6b8299', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Circle size={6} fill="#99ffbb" color="#99ffbb" />
              currently reading: &quot;Mamba&quot; (Gu &amp; Dao, 2023)
            </div>
          </div>
        </header>

        {/* HERO */}
        <section style={{ maxWidth: '1100px', margin: '0 auto', padding: '4rem 1.5rem 3rem' }}>
          <div className="fade-up" style={{ animationDelay: '0.1s', fontFamily: 'JetBrains Mono, monospace', fontSize: '12px', letterSpacing: '0.15em', color: '#6ea8d0', textTransform: 'uppercase', marginBottom: '1.5rem' }}>
            ▸ machine learning · notes · experiments
          </div>
          <h1 className="fade-up" style={{
            animationDelay: '0.2s',
            fontFamily: 'IBM Plex Serif, serif',
            fontSize: 'clamp(44px, 8vw, 84px)',
            fontWeight: 400,
            lineHeight: 1.02,
            letterSpacing: '-0.035em',
            margin: '0 0 1.5rem',
            maxWidth: '900px',
          }}>
            Thinking about machines<br />
            <em style={{ color: '#7fd1ff', fontStyle: 'italic' }}>that think</em>
            <span className="cursor-blink" style={{ color: '#7fd1ff' }}>_</span>
          </h1>
          <p className="fade-up" style={{
            animationDelay: '0.35s',
            fontSize: '18px',
            color: '#9db4cc',
            lineHeight: 1.6,
            maxWidth: '620px',
            marginBottom: '2.5rem',
          }}>
            Machine learning, worked through from first principles. Fundamentals, inference, safety, and the occasional detour.
          </p>
          <div className="fade-up" style={{ animationDelay: '0.5s', display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap', fontFamily: 'JetBrains Mono, monospace', fontSize: '12px' }}>
            <span style={{ padding: '6px 12px', background: 'rgba(140, 210, 255, 0.08)', border: '1px solid rgba(140, 210, 255, 0.2)', borderRadius: '4px', color: '#7fd1ff' }}>
              {blogPosts.length} posts
            </span>
            {blogPosts.length > 0 && (
              <span style={{ color: '#6b8299' }}>
                last updated {formatDate(blogPosts[0].date)}
              </span>
            )}
          </div>
        </section>

        {/* FILTER BAR */}
        <section style={{ maxWidth: '1100px', margin: '0 auto', padding: '0 1.5rem 2rem' }}>
          <div style={{
            borderTop: '1px solid rgba(140, 210, 255, 0.15)',
            borderBottom: '1px solid rgba(140, 210, 255, 0.15)',
            padding: '1rem 0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '1rem',
            flexWrap: 'wrap',
          }}>
            <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'center', flexWrap: 'wrap' }}>
              {categories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    fontFamily: 'JetBrains Mono, monospace',
                    fontSize: '13px',
                    color: selectedCategory === cat.id ? '#7fd1ff' : '#6b8299',
                    padding: 0,
                    textDecoration: selectedCategory === cat.id ? 'underline' : 'none',
                    textUnderlineOffset: '6px',
                  }}
                >
                  {cat.name}
                </button>
              ))}
            </div>
            <div style={{ position: 'relative' }}>
              <Search size={14} style={{ position: 'absolute', left: '10px', top: '8px', color: '#6b8299' }} />
              <input
                type="text"
                placeholder="search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  background: 'rgba(140, 210, 255, 0.05)',
                  border: '1px solid rgba(140, 210, 255, 0.2)',
                  borderRadius: '4px',
                  padding: '6px 10px 6px 30px',
                  color: '#e8f0f8',
                  fontFamily: 'JetBrains Mono, monospace',
                  fontSize: '13px',
                  width: '180px',
                  outline: 'none',
                }}
              />
            </div>
          </div>
        </section>

        {/* POSTS LIST */}
        <main style={{ maxWidth: '1100px', margin: '0 auto', padding: '0 1.5rem 5rem', minHeight: '40vh' }}>
          {filteredPosts.length === 0 ? (
            <div className="fade-up" style={{ animationDelay: '0.6s', padding: '4rem 0', textAlign: 'center' }}>
              <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '13px', color: '#6b8299', marginBottom: '0.5rem' }}>
                // no posts yet
              </div>
              <div style={{ fontFamily: 'IBM Plex Serif, serif', fontStyle: 'italic', fontSize: '20px', color: '#9db4cc' }}>
                first post dropping soon
                <span className="cursor-blink" style={{ color: '#7fd1ff', marginLeft: '2px' }}>_</span>
              </div>
            </div>
          ) : (
            <div>
              {filteredPosts.map((post, idx) => (
                <article
                  key={post.id}
                  onClick={() => setSelectedPost(post.id)}
                  className="fade-up post-row"
                  style={{
                    animationDelay: `${0.1 + idx * 0.06}s`,
                    padding: '2rem 0',
                    borderBottom: '1px solid rgba(140, 210, 255, 0.1)',
                    cursor: 'pointer',
                    display: 'grid',
                    gridTemplateColumns: 'auto 1fr auto',
                    gap: '2rem',
                    alignItems: 'baseline',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.paddingLeft = '1rem';
                    e.currentTarget.querySelector('h2').style.color = '#7fd1ff';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.paddingLeft = '0';
                    e.currentTarget.querySelector('h2').style.color = '#e8f0f8';
                  }}
                >
                  <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '12px', color: '#6b8299', minWidth: '80px' }}>
                    {String(idx + 1).padStart(2, '0')} / {formatDate(post.date).split(',')[0]}
                  </div>
                  <div>
                    <h2 style={{
                      fontFamily: 'IBM Plex Serif, serif',
                      fontSize: '26px',
                      fontWeight: 500,
                      letterSpacing: '-0.015em',
                      margin: '0 0 0.5rem',
                      color: '#e8f0f8',
                      transition: 'color 0.2s',
                      lineHeight: 1.25,
                    }}>
                      {post.title}
                    </h2>
                    <p style={{ fontSize: '15px', color: '#9db4cc', lineHeight: 1.55, margin: '0 0 0.75rem', maxWidth: '580px' }}>
                      {post.excerpt}
                    </p>
                    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', fontFamily: 'JetBrains Mono, monospace', fontSize: '11px', flexWrap: 'wrap' }}>
                      <span style={{ color: '#7fd1ff' }}>#{post.category}</span>
                      {post.difficulty && (
                        <>
                          <span style={{ color: '#445a72' }}>·</span>
                          <span style={{ color: difficultyColor[post.difficulty] }}>{post.difficulty}</span>
                        </>
                      )}
                      <span style={{ color: '#445a72' }}>·</span>
                      <span style={{ color: '#6b8299' }}>{post.readTime}</span>
                    </div>
                  </div>
                  <ArrowUpRight size={20} color="#6b8299" className="post-arrow" style={{ transition: 'transform 0.2s' }} />
                </article>
              ))}
            </div>
          )}
        </main>

        {/* FOOTER */}
        <footer style={{ borderTop: '1px solid rgba(140, 210, 255, 0.15)', padding: '3rem 1.5rem', textAlign: 'center' }}>
          <div style={{ maxWidth: '1100px', margin: '0 auto', fontFamily: 'JetBrains Mono, monospace', fontSize: '12px', color: '#6b8299', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <span style={{ color: '#7fd1ff' }}>~/blog</span> · built with curiosity and too much chai
            </div>
            <div style={{ display: 'flex', gap: '1.5rem' }}>
              <a href="https://github.com/nik8482" target="_blank" rel="noopener noreferrer" style={{ color: '#9db4cc', textDecoration: 'none' }}>github</a>
              <a href="https://www.linkedin.com/in/nikhil-modha-7aa604119/" target="_blank" rel="noopener noreferrer" style={{ color: '#9db4cc', textDecoration: 'none' }}>linkedin</a>
              <a href="mailto:nikhil.modha21@gmail.com" style={{ color: '#9db4cc', textDecoration: 'none' }}>email</a>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
