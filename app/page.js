"use client";
import { useEffect, useRef, useState } from "react";

const THRESHOLD = 100;

function Icon({ name, size = 22 }) {
  const paths = {
    compass: <><circle cx="12" cy="12" r="9"/><path d="m15.5 8.5-2.1 4.9-4.9 2.1 2.1-4.9 4.9-2.1Z"/></>,
    heart: <path d="M20.8 4.9a5.5 5.5 0 0 0-7.8 0L12 6l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.3 1-1a5.5 5.5 0 0 0 0-7.8Z"/>,
    x: <path d="M18 6 6 18M6 6l12 12"/>,
    chat: <path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4v8Z"/>,
    user: <><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></>,
    pin: <><path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/></>,
    spark: <path d="m12 3 1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3Z"/>,
  };
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>;
}

function Card({ p, onDecide, top }) {
  const [dx, setDx] = useState(0);
  const [fly, setFly] = useState(0);
  const start = useRef(null);
  if (!top) return <div className="card card-back"><img src={p.photo} alt="" /></div>;

  const decide = (dir) => {
    if (fly) return;
    setFly(dir === "like" ? 1 : -1);
    setTimeout(() => onDecide(p, dir), 260);
  };
  window.__decide = decide;
  const x = fly ? fly * 760 : dx;
  return (
    <article className="card"
      style={{ transform: `translateX(${x}px) rotate(${x / 20}deg)`, transition: start.current === null ? "transform .26s cubic-bezier(.2,.8,.2,1)" : "none" }}
      onPointerDown={(e) => { start.current = e.clientX; e.currentTarget.setPointerCapture(e.pointerId); }}
      onPointerMove={(e) => start.current !== null && setDx(e.clientX - start.current)}
      onPointerUp={() => { const d = dx; start.current = null; if (d > THRESHOLD) decide("like"); else if (d < -THRESHOLD) decide("pass"); else setDx(0); }}>
      <img className="card-photo" src={p.photo} alt={p.name} draggable={false} />
      <div className="photo-wash" />
      <div className="stamp like-stamp" style={{ opacity: Math.min(Math.max(x, 0) / THRESHOLD, 1) }}>LIKE</div>
      <div className="stamp nope-stamp" style={{ opacity: Math.min(Math.max(-x, 0) / THRESHOLD, 1) }}>PASS</div>
      <div className="profile-details">
        <div className="name-row"><h2>{p.name}</h2><span>{p.age}</span><i aria-label="Verified">✓</i></div>
        <p className="place"><Icon name="pin" size={15} /> {p.place}</p>
        <p className="bio">“{p.bio}”</p>
        <div className="chips">{p.interests.map((i) => <span key={i}>{i}</span>)}</div>
      </div>
    </article>
  );
}

function Discover() {
  const [feed, setFeed] = useState(null);
  const [view, setView] = useState("discover");
  const [matches, setMatches] = useState([]);
  const [match, setMatch] = useState(null);
  const [error, setError] = useState("");

  const loadFeed = () => fetch("/api/feed").then((r) => r.json()).then((d) => setFeed(d.profiles)).catch(() => setError("Couldn't load profiles. Check your connection and retry."));
  const loadMatches = () => fetch("/api/matches").then((r) => r.json()).then((d) => setMatches(d.matches)).catch(() => setError("Couldn't load matches."));
  useEffect(() => { loadFeed(); loadMatches(); }, []);

  const onDecide = async (p, dir) => {
    setFeed((f) => f.filter((x) => x.id !== p.id));
    try {
      const r = await fetch("/api/swipe", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ profileId: p.id, direction: dir }) });
      if (!r.ok) throw new Error();
      const d = await r.json();
      if (d.matched) { setMatch(d.profile); loadMatches(); }
    } catch {
      setFeed((f) => [p, ...f]);
      setError("That swipe didn't save. Try again.");
    }
  };

  useEffect(() => {
    const k = (e) => { if (e.key === "ArrowRight") window.__decide?.("like"); if (e.key === "ArrowLeft") window.__decide?.("pass"); };
    window.addEventListener("keydown", k); return () => window.removeEventListener("keydown", k);
  }, []);

  return (
    <div className="screen">
      <header className="topbar">
        <button className="brand" aria-label="Coy home" onClick={() => setView("discover")}><span>c</span> coy</button>
        <button className="profile-button" aria-label="Open profile"><Icon name="user" /></button>
      </header>

      <div className="section-tabs">
        <button aria-pressed={view === "discover"} onClick={() => setView("discover")}>Discover</button>
        <button aria-pressed={view === "matches"} onClick={() => { setView("matches"); loadMatches(); }}>Matches <span>{matches.length}</span></button>
      </div>

      {error && <button className="toast" role="alert" onClick={() => setError("")}>{error}</button>}

      {view === "matches" ? (
        matches.length === 0 ? <div className="center empty"><div className="empty-icon"><Icon name="heart" size={34}/></div><h3>No matches yet</h3><p>Your next great conversation is closer than you think.</p><button onClick={() => setView("discover")}>Start discovering</button></div> :
        <div className="matches-view"><p className="match-count">{matches.length} people liked you back</p><div className="grid">{matches.map((m) => <button className="tile" key={m.id}><img src={m.photo} alt="" /><div><b>{m.name}, {m.age}</b><span><Icon name="chat" size={16}/> Say hello</span></div></button>)}</div></div>
      ) : feed === null ? <div className="center loading"><div className="loader"/><p>Finding someone interesting…</p></div>
      : feed.length === 0 ? <div className="center empty"><div className="empty-icon"><Icon name="spark" size={34}/></div><h3>You’re all caught up</h3><p>Take a breather. New people will appear here soon.</p><button onClick={loadFeed}>Refresh</button></div>
      : (<>
          <div className="stack">
            {feed[1] && <Card key={feed[1].id} p={feed[1]} />}
            <Card key={feed[0].id} p={feed[0]} top onDecide={onDecide} />
          </div>
          <div className="actions">
            <button className="action pass-action" aria-label="Pass" onClick={() => window.__decide?.("pass")}><Icon name="x" size={28}/></button>
            <button className="action like-action" aria-label="Like" onClick={() => window.__decide?.("like")}><Icon name="heart" size={27}/></button>
          </div>
        </>)}

      {match && (
        <div className="overlay" role="dialog" aria-label="It's a match">
          <div className="match-glow"><Icon name="spark" size={28}/></div>
          <p className="eyebrow">NEW CONNECTION</p>
          <h1>It’s a match!</h1>
          <div className="pair"><img src="https://i.pravatar.cc/200?img=68" alt="You" /><img src={match.photo} alt={match.name} /></div>
          <p className="match-copy">You and <strong>{match.name}</strong> liked each other.</p>
          <button className="keep-button" onClick={() => setMatch(null)}>Keep swiping</button>
        </div>
      )}
    </div>
  );
}

export default function App() {
  const [tab, setTab] = useState("discover");
  return (
    <main className="app">
      {tab === "home" ? <div className="screen home-screen"><header className="topbar"><button className="brand"><span>c</span> coy</button></header><div className="center empty"><div className="empty-icon"><Icon name="compass" size={34}/></div><h3>Ready to meet someone?</h3><p>Find people who share your kind of energy.</p><button onClick={() => setTab("discover")}>Discover people</button></div></div> : <Discover />}
      <nav className="tabs" aria-label="Main navigation">
        <button aria-selected={tab === "home"} onClick={() => setTab("home")}><Icon name="compass"/><span>Home</span></button>
        <button aria-selected={tab === "discover"} onClick={() => setTab("discover")}><Icon name="heart"/><span>Discover</span></button>
        <button aria-selected={false} onClick={() => setTab("discover")}><Icon name="chat"/><span>Chats</span></button>
      </nav>
    </main>
  );
}
