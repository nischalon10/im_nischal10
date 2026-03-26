import { useState, useEffect, useRef } from "react";
import "./App.css";

const REPO = "nischalon10/im_nischal10";

const PROFILE = {
  name: "Nischal Oletynagesh",
  handle: "nischalon10",
  role: "Software Engineer",
  school: "University of South Florida",
  location: "Tampa, FL",
  bio: "Senior student passionate about technology and building things that matter.",
  links: [
    { label: "github",   url: "https://github.com/nischalon10" },
    { label: "linkedin", url: "https://www.linkedin.com/in/nischaloletynagesh/" },
    { label: "twitter",  url: "https://twitter.com/ONischal" },
    { label: "email",    url: "mailto:nischalolety@usf.edu" },
  ],
};

const COMMANDS = ["help", "about", "whoami", "blog", "contact", "clear", "exit"];

// ── Markdown ────────────────────────────────────────────────────────────────

function renderInline(text) {
  const regex = /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`|\[[^\]]+\]\([^)]+\))/g;
  const parts = [];
  let last = 0, key = 0;
  let m;
  while ((m = regex.exec(text)) !== null) {
    if (m.index > last) parts.push(text.slice(last, m.index));
    const s = m[0];
    if (s.startsWith("**"))      parts.push(<strong key={key++}>{s.slice(2, -2)}</strong>);
    else if (s.startsWith("*")) parts.push(<em key={key++}>{s.slice(1, -1)}</em>);
    else if (s.startsWith("`")) parts.push(<code key={key++} className="ic">{s.slice(1, -1)}</code>);
    else {
      const label = s.match(/\[([^\]]+)\]/)[1];
      const href  = s.match(/\(([^)]+)\)/)[1];
      parts.push(<a key={key++} href={href} target="_blank" rel="noopener noreferrer">{label}</a>);
    }
    last = m.index + m.length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts;
}

function parseFrontmatter(raw) {
  const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!m) return { meta: {}, body: raw };
  const meta = {};
  m[1].split("\n").forEach((line) => {
    const i = line.indexOf(":");
    if (i > -1) meta[line.slice(0, i).trim()] = line.slice(i + 1).trim();
  });
  return { meta, body: m[2] };
}

function renderMarkdown(text) {
  const lines = text.split("\n");
  const out = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (line.startsWith("```")) {
      const code = [];
      i++;
      while (i < lines.length && !lines[i].startsWith("```")) { code.push(lines[i]); i++; }
      out.push(<pre key={i} className="cb"><code>{code.join("\n")}</code></pre>);
    } else if (line.startsWith("### ")) {
      out.push(<div key={i} className="mh3">{renderInline(line.slice(4))}</div>);
    } else if (line.startsWith("## ")) {
      out.push(<div key={i} className="mh2">{renderInline(line.slice(3))}</div>);
    } else if (line.startsWith("# ")) {
      out.push(<div key={i} className="mh1">{renderInline(line.slice(2))}</div>);
    } else if (/^[-*]\s/.test(line)) {
      out.push(<div key={i} className="mli"><span>▸</span><span>{renderInline(line.slice(2))}</span></div>);
    } else if (/^\d+\.\s/.test(line)) {
      const num = line.match(/^(\d+)/)[1];
      out.push(<div key={i} className="mli"><span>{num}.</span><span>{renderInline(line.replace(/^\d+\.\s/, ""))}</span></div>);
    } else if (/^---+$/.test(line.trim())) {
      out.push(<div key={i} className="mhr" />);
    } else if (!line.trim()) {
      out.push(<div key={i} className="mbr" />);
    } else {
      out.push(<div key={i} className="mp">{renderInline(line)}</div>);
    }
    i++;
  }
  return out;
}

// ── GitHub API ──────────────────────────────────────────────────────────────

async function apiFetchPosts() {
  const res = await fetch(`https://api.github.com/repos/${REPO}/contents/posts`);
  if (!res.ok) throw new Error(`GitHub API returned ${res.status}`);
  const files = await res.json();
  return files
    .filter((f) => f.name.endsWith(".md"))
    .map((f) => ({
      slug:  f.name.replace(".md", ""),
      title: f.name.replace(".md", "").replace(/-/g, " "),
    }));
}

async function apiFetchPost(slug) {
  const res = await fetch(
    `https://raw.githubusercontent.com/${REPO}/main/posts/${slug}.md`
  );
  if (!res.ok) throw new Error(`post not found: ${slug}`);
  return res.text();
}

// ── Components ──────────────────────────────────────────────────────────────

function Spinner({ msg = "fetching" }) {
  const frames = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];
  const [f, setF] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setF((n) => (n + 1) % frames.length), 80);
    return () => clearInterval(id);
  }, []);
  return (
    <div className="spinner">
      <span className="spin-chr">{frames[f]}</span>
      <span className="dim">{msg}...</span>
    </div>
  );
}

function SectionLabel({ children }) {
  return <div className="section-label">{children}</div>;
}

function Welcome() {
  return (
    <div className="out welcome">
      <div className="banner">
        <span className="banner-name">NISCHAL</span>
        <span className="banner-last">OLETYNAGESH</span>
      </div>
      <div className="banner-sub">Software Engineer · Tampa, FL</div>
      <div className="welcome-hint">
        <span className="dim">session started · type </span>
        <span className="kw">help</span>
        <span className="dim"> to begin</span>
      </div>
    </div>
  );
}

function HelpOutput() {
  const rows = [
    ["about",       "who i am"],
    ["blog",        "list posts — fetched live from github"],
    ["blog <slug>", "read a specific post"],
    ["contact",     "find me online"],
    ["clear",       "reset the terminal"],
    ["exit",        "close the session"],
  ];
  return (
    <div className="out">
      <SectionLabel>commands</SectionLabel>
      <div className="table">
        {rows.map(([cmd, desc]) => (
          <div key={cmd} className="table-row">
            <span className="tcell kw">{cmd}</span>
            <span className="tcell dim">{desc}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function AboutOutput() {
  return (
    <div className="out">
      <SectionLabel>whoami</SectionLabel>
      <div className="table">
        {[
          ["name",     PROFILE.name],
          ["role",     PROFILE.role],
          ["location", PROFILE.location],
          ["school",   PROFILE.school],
        ].map(([k, v]) => (
          <div key={k} className="table-row">
            <span className="tcell dim">{k}</span>
            <span className="tcell">{v}</span>
          </div>
        ))}
      </div>
      <div className="bio">{PROFILE.bio}</div>
    </div>
  );
}

function ContactOutput() {
  return (
    <div className="out">
      <SectionLabel>contact</SectionLabel>
      <div className="table">
        {PROFILE.links.map(({ label, url }) => (
          <div key={label} className="table-row">
            <span className="tcell dim">{label}</span>
            <a className="tcell link" href={url} target="_blank" rel="noopener noreferrer">
              {url.replace("mailto:", "")}
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}

function BlogListOutput({ posts }) {
  if (!posts.length) {
    return (
      <div className="out">
        <SectionLabel>blog</SectionLabel>
        <div className="dim">no posts yet — add .md files to /posts in the repo.</div>
      </div>
    );
  }
  return (
    <div className="out">
      <SectionLabel>blog</SectionLabel>
      <div className="post-list">
        {posts.map((p, i) => (
          <div key={p.slug} className="post-row">
            <span className="post-num">{String(i + 1).padStart(2, "0")}</span>
            <span className="post-title">{p.title}</span>
            <span className="post-cmd dim">blog {p.slug}</span>
          </div>
        ))}
      </div>
      <div className="footnote dim">↑ live from github · no rebuild needed</div>
    </div>
  );
}

function PostOutput({ meta, body }) {
  return (
    <div className="out">
      <SectionLabel>blog</SectionLabel>
      {meta.title && <div className="post-heading">{meta.title}</div>}
      {meta.date  && <div className="post-date dim">{meta.date}</div>}
      <div className="post-rule" />
      <div className="markdown">{renderMarkdown(body)}</div>
    </div>
  );
}

function ErrOutput({ msg }) {
  return (
    <div className="out err-out">
      <span className="err-x">✗</span>
      <span>{msg}</span>
    </div>
  );
}

function NotFound({ cmd }) {
  return (
    <div className="out err-out">
      <span className="err-x">✗</span>
      <span>
        command not found: <span className="kw">{cmd}</span>
        <span className="dim"> — try </span>
        <span className="kw">help</span>
      </span>
    </div>
  );
}

// ── Shutdown HUD (macOS volume-style) ────────────────────────────────────────

function ShutdownHUD({ count }) {
  const progress = ((5 - count) / 5) * 100;
  return (
    <div className="hud">
      <div className="hud-icon">⏻</div>
      <div className="hud-label">system shutting down</div>
      <div className="hud-count">{count}</div>
      <div className="hud-track">
        <div className="hud-fill" style={{ width: `${progress}%` }} />
      </div>
    </div>
  );
}

// ── Terminal ─────────────────────────────────────────────────────────────────

let uid = 1;

const DEFAULT_POS = () => ({
  x: Math.max(40, window.innerWidth  / 2 - 360),
  y: Math.max(40, window.innerHeight / 2 - 260),
});

export default function App() {
  const [history, setHistory] = useState([
    { id: 0, input: null, output: <Welcome /> },
  ]);
  const [cmd, setCmd]         = useState("");
  const [cmdHist, setCmdHist] = useState([]);
  const [histIdx, setHistIdx] = useState(-1);
  const [loading, setLoading] = useState(false);

  // Shutdown countdown (-1 = inactive)
  const [shutdown, setShutdown] = useState(-1);

  // Window position & key (key bump resets CSS resize)
  const [pos, setPos]             = useState(DEFAULT_POS);
  const [windowKey, setWindowKey] = useState(0);

  // Fullscreen
  const [isFullscreen, setIsFullscreen] = useState(false);

  const dragging  = useRef(false);
  const dragStart = useRef({ mx: 0, my: 0, wx: 0, wy: 0 });
  const bottomRef = useRef(null);
  const inputRef  = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [history, loading]);

  // Drag handlers
  useEffect(() => {
    function onMove(e) {
      if (!dragging.current) return;
      setPos({
        x: dragStart.current.wx + e.clientX - dragStart.current.mx,
        y: dragStart.current.wy + e.clientY - dragStart.current.my,
      });
    }
    function onUp() { dragging.current = false; }
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup",   onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup",   onUp);
    };
  }, []);

  // Track Esc-key fullscreen exit
  useEffect(() => {
    function onChange() {
      if (!document.fullscreenElement) setIsFullscreen(false);
    }
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  // Shutdown ticker
  useEffect(() => {
    if (shutdown < 0) return;
    if (shutdown === 0) { window.close(); return; }
    const id = setTimeout(() => setShutdown((n) => n - 1), 1000);
    return () => clearTimeout(id);
  }, [shutdown]);

  function onTitleBarMouseDown(e) {
    if (isFullscreen || e.target.closest(".dot")) return;
    dragging.current = true;
    dragStart.current = { mx: e.clientX, my: e.clientY, wx: pos.x, wy: pos.y };
  }

  // 🔴 Close — hide window, show HUD countdown, close tab
  function handleClose() { setShutdown(5); }

  // 🟡 Reset position & size
  function handleResetPos() {
    setPos(DEFAULT_POS());
    setWindowKey((k) => k + 1);
    if (isFullscreen) {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  }

  // 🟢 Fullscreen toggle
  function handleFullscreen() {
    if (!isFullscreen) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  }

  function push(input, output) {
    setHistory((h) => [...h, { id: uid++, input, output }]);
  }

  async function run(raw) {
    const input = raw.trim();
    if (!input) return;

    setCmdHist((h) => [input, ...h]);
    setHistIdx(-1);

    const parts = input.split(/\s+/);
    const base  = parts[0].toLowerCase();
    const args  = parts.slice(1);

    if (base === "clear")  { setHistory([]); return; }
    if (base === "exit")   { handleClose(); return; }
    if (base === "help")   { push(input, <HelpOutput />); return; }
    if (base === "about" || base === "whoami") { push(input, <AboutOutput />); return; }
    if (base === "contact") { push(input, <ContactOutput />); return; }

    if (base === "blog") {
      if (!args.length) {
        setLoading(true);
        try {
          const posts = await apiFetchPosts();
          push(input, <BlogListOutput posts={posts} />);
        } catch (e) {
          push(input, <ErrOutput msg={e.message} />);
        }
        setLoading(false);
      } else {
        const slug = args.join("-").toLowerCase();
        setLoading(true);
        try {
          const raw  = await apiFetchPost(slug);
          const { meta, body } = parseFrontmatter(raw);
          push(input, <PostOutput meta={meta} body={body} />);
        } catch (e) {
          push(input, <ErrOutput msg={e.message} />);
        }
        setLoading(false);
      }
      return;
    }

    push(input, <NotFound cmd={input} />);
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (loading || !cmd.trim()) return;
    run(cmd);
    setCmd("");
  }

  function handleKeyDown(e) {
    if (e.key === "ArrowUp") {
      e.preventDefault();
      const next = Math.min(histIdx + 1, cmdHist.length - 1);
      setHistIdx(next);
      setCmd(cmdHist[next] ?? "");
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      const next = Math.max(histIdx - 1, -1);
      setHistIdx(next);
      setCmd(next === -1 ? "" : cmdHist[next]);
    } else if (e.key === "Tab") {
      e.preventDefault();
      const match = COMMANDS.find((c) => c.startsWith(cmd) && c !== cmd);
      if (match) setCmd(match);
    }
  }

  const windowStyle = isFullscreen
    ? { left: 0, top: 0, width: "100vw", height: "100vh", borderRadius: 0, resize: "none" }
    : { left: pos.x, top: pos.y };

  return (
    <div className="desktop">
      {shutdown >= 0 && <ShutdownHUD count={shutdown} />}

      {shutdown < 0 && (
        <div
          key={windowKey}
          className="window"
          style={windowStyle}
          onClick={() => inputRef.current?.focus()}
        >
          <header className="win-titlebar" onMouseDown={onTitleBarMouseDown}>
            <div className="dots">
              <button className="dot dot-r" title="close"      onClick={handleClose}      />
              <button className="dot dot-y" title="reset pos"  onClick={handleResetPos}   />
              <button className="dot dot-g" title="fullscreen" onClick={handleFullscreen} />
            </div>
            <span className="win-title">nischal — terminal</span>
            <span className="win-status dim">● active</span>
          </header>

          <main className="win-body">
            {history.map((entry) => (
              <div key={entry.id} className="entry">
                {entry.input && (
                  <div className="entry-prompt">
                    <span className="ps1">nischal</span>
                    <span className="ps1-at">@</span>
                    <span className="ps1-host">portfolio</span>
                    <span className="ps1-colon">:</span>
                    <span className="ps1-path">~</span>
                    <span className="ps1-dollar"> $ </span>
                    <span className="entry-cmd">{entry.input}</span>
                  </div>
                )}
                {entry.output}
              </div>
            ))}
            {loading && <div className="entry"><Spinner /></div>}
            <div ref={bottomRef} />
          </main>

          <footer className="win-footer">
            <form className="input-row" onSubmit={handleSubmit}>
              <span className="ps1">nischal</span>
              <span className="ps1-at">@</span>
              <span className="ps1-host">portfolio</span>
              <span className="ps1-colon">:</span>
              <span className="ps1-path">~</span>
              <span className="ps1-dollar"> $ </span>
              <input
                ref={inputRef}
                className="term-input"
                type="text"
                value={cmd}
                onChange={(e) => setCmd(e.target.value)}
                onKeyDown={handleKeyDown}
                autoFocus
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck={false}
              />
            </form>
          </footer>

          {!isFullscreen && <div className="resize-grip" />}
        </div>
      )}
    </div>
  );
}
