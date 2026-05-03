import { useState, useEffect, useRef, useCallback } from "react";

// ─── Word pools by difficulty ────────────────────────────────────────────────
const WORD_POOLS = {
    easy: ["cat", "dog", "run", "big", "map", "hat", "sun", "key", "zip", "cup", "log", "ant", "bus", "fan", "gem"],
    medium: ["plant", "brave", "chess", "dream", "flame", "globe", "honey", "ivory", "joker", "karma", "lemon", "magic", "ninja", "orbit", "pixel"],
    hard: ["abstract", "alchemy", "blizzard", "catalyst", "delegate", "eloquent", "flourish", "gradient", "hallmark", "integral", "jubilant", "keyboard"],
};

const DIFFICULTIES = {
    easy: { speed: 55, spawnRate: 3200, maxWords: 3, label: "Easy" },
    medium: { speed: 80, spawnRate: 2400, maxWords: 4, label: "Medium" },
    hard: { speed: 115, spawnRate: 1800, maxWords: 5, label: "Hard" },
};

const LIVES = 3;
let wordIdCounter = 0;

// ─── Palette ─────────────────────────────────────────────────────────────────
const WORD_COLORS = [
    { bg: "#00ffe1", text: "#0a0f1e", glow: "#00ffe1" },
    { bg: "#ff6bdf", text: "#0a0f1e", glow: "#ff6bdf" },
    { bg: "#ffe84d", text: "#0a0f1e", glow: "#ffe84d" },
    { bg: "#7b61ff", text: "#fff", glow: "#7b61ff" },
    { bg: "#ff8c42", text: "#0a0f1e", glow: "#ff8c42" },
];

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

// ─── Particle burst on word destroy ──────────────────────────────────────────
function Particles({ x, y, color, onDone }) {
    const [frame, setFrame] = useState(0);
    useEffect(() => {
        const id = setInterval(() => setFrame(f => f + 1), 30);
        setTimeout(() => { clearInterval(id); onDone(); }, 600);
        return () => clearInterval(id);
    }, []);
    const particles = Array.from({ length: 10 }, (_, i) => {
        const angle = (i / 10) * Math.PI * 2;
        const dist = frame * 4;
        const opacity = Math.max(0, 1 - frame / 20);
        return (
            <div key={i} style={{
                position: "absolute",
                left: x + Math.cos(angle) * dist - 4,
                top: y + Math.sin(angle) * dist - 4,
                width: 8, height: 8, borderRadius: "50%",
                background: color,
                opacity,
                pointerEvents: "none",
                transition: "none",
            }} />
        );
    });
    return <>{particles}</>;
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function WordFallGame() {
    const [screen, setScreen] = useState("menu");       // menu | game | over
    const [difficulty, setDifficulty] = useState("medium");
    const [words, setWords] = useState([]);
    const [input, setInput] = useState("");
    const [score, setScore] = useState(0);
    const [lives, setLives] = useState(LIVES);
    const [combo, setCombo] = useState(0);
    const [bestScore, setBestScore] = useState(() => Number(localStorage.getItem("wf_best") || 0));
    const [particles, setParticles] = useState([]);
    const [shakeKey, setShakeKey] = useState(0);
    const [flashWord, setFlashWord] = useState(null);

    const arenaRef = useRef(null);
    const inputRef = useRef(null);
    const rafRef = useRef(null);
    const lastRef = useRef(null);
    const spawnRef = useRef(null);
    const wordsRef = useRef([]);
    const liveRef = useRef(LIVES);
    const scoreRef = useRef(0);
    const comboRef = useRef(0);

    // keep refs in sync
    useEffect(() => { wordsRef.current = words; }, [words]);
    useEffect(() => { liveRef.current = lives; }, [lives]);
    useEffect(() => { scoreRef.current = score; }, [score]);
    useEffect(() => { comboRef.current = combo; }, [combo]);

    // ── Spawn a word ──────────────────────────────────────────────────────────
    const spawnWord = useCallback(() => {
        const arena = arenaRef.current;
        if (!arena) return;
        const cfg = DIFFICULTIES[difficulty];
        if (wordsRef.current.length >= cfg.maxWords) return;

        const pool = WORD_POOLS[difficulty];
        const existing = new Set(wordsRef.current.map(w => w.text));
        const available = pool.filter(w => !existing.has(w));
        if (!available.length) return;

        const text = pick(available);
        const color = pick(WORD_COLORS);
        const areaW = arena.offsetWidth;
        const x = Math.random() * (areaW - 140) + 20;
        const id = ++wordIdCounter;

        setWords(prev => [...prev, { id, text, x, y: -50, color, speed: cfg.speed }]);
    }, [difficulty]);

    // ── Game loop ─────────────────────────────────────────────────────────────
    const gameLoop = useCallback((ts) => {
        if (!lastRef.current) lastRef.current = ts;
        const dt = (ts - lastRef.current) / 1000;
        lastRef.current = ts;

        const arena = arenaRef.current;
        if (!arena) return;
        const floor = arena.offsetHeight;

        setWords(prev => {
            const next = [];
            let hitFloor = false;
            for (const w of prev) {
                const ny = w.y + w.speed * dt;
                if (ny + 48 >= floor) {
                    hitFloor = true;
                    setShakeKey(k => k + 1);
                } else {
                    next.push({ ...w, y: ny });
                }
            }
            if (hitFloor) {
                const newLives = liveRef.current - 1;
                liveRef.current = newLives;
                setLives(newLives);
                setCombo(0);
                comboRef.current = 0;
                if (newLives <= 0) endGame();
            }
            return next;
        });

        rafRef.current = requestAnimationFrame(gameLoop);
    }, [difficulty]);

    // ── Start / End ───────────────────────────────────────────────────────────
    const startGame = useCallback(() => {
        wordIdCounter = 0;
        wordsRef.current = [];
        liveRef.current = LIVES;
        scoreRef.current = 0;
        comboRef.current = 0;
        setWords([]); setScore(0); setLives(LIVES); setCombo(0);
        setInput(""); setParticles([]); setFlashWord(null);
        setScreen("game");
        lastRef.current = null;
        setTimeout(() => inputRef.current?.focus(), 50);
    }, []);

    const endGame = useCallback(() => {
        cancelAnimationFrame(rafRef.current);
        clearInterval(spawnRef.current);
        const final = scoreRef.current;
        setBestScore(prev => {
            const nb = Math.max(prev, final);
            localStorage.setItem("wf_best", nb);
            return nb;
        });
        setScreen("over");
    }, []);

    // ── Mount game loop + spawner when screen === game ────────────────────────
    useEffect(() => {
        if (screen !== "game") return;
        const cfg = DIFFICULTIES[difficulty];
        spawnWord(); // immediate first word
        spawnRef.current = setInterval(spawnWord, cfg.spawnRate);
        rafRef.current = requestAnimationFrame(gameLoop);
        return () => {
            cancelAnimationFrame(rafRef.current);
            clearInterval(spawnRef.current);
        };
    }, [screen, difficulty, gameLoop, spawnWord]);

    // ── Typing logic ──────────────────────────────────────────────────────────
    const handleInput = useCallback((e) => {
        const val = e.target.value.replace(/\s/g, "");
        setInput(val);
        const matched = wordsRef.current.find(w => w.text === val);
        if (!matched) return;

        // find position for particles
        setFlashWord(matched.id);
        const cx = matched.x + 60;
        const cy = matched.y + 24;
        const pid = Date.now();
        setParticles(prev => [...prev, { id: pid, x: cx, y: cy, color: matched.color.glow }]);

        const newCombo = comboRef.current + 1;
        comboRef.current = newCombo;
        setCombo(newCombo);

        const bonus = newCombo >= 5 ? 3 : newCombo >= 3 ? 2 : 1;
        const pts = matched.text.length * 10 * bonus;
        scoreRef.current += pts;
        setScore(scoreRef.current);

        setWords(prev => prev.filter(w => w.id !== matched.id));
        setInput("");
        setTimeout(() => setFlashWord(null), 200);
    }, []);

    // ── Highlight matched prefix ──────────────────────────────────────────────
    function renderWordLabel(word) {
        const txt = word.text;
        let matchLen = 0;
        for (let i = 0; i < Math.min(input.length, txt.length); i++) {
            if (input[i] === txt[i]) matchLen++; else break;
        }
        return (
            <span>
                <span style={{ textDecoration: "underline", textDecorationColor: "#0a0f1e" }}>
                    {txt.slice(0, matchLen)}
                </span>
                {txt.slice(matchLen)}
            </span>
        );
    }

    const comboColor = combo >= 5 ? "#ffe84d" : combo >= 3 ? "#ff6bdf" : "#00ffe1";

    // ════════════════════════════════════════════════════════════════════════════
    // RENDER
    // ════════════════════════════════════════════════════════════════════════════
    return (
        <div style={{
            fontFamily: "'Space Mono', 'Courier New', monospace",
            background: "#0a0f1e",
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "1rem",
        }}>
            <link href="https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&display=swap" rel="stylesheet" />

            {/* ── MENU ── */}
            {screen === "menu" && (
                <div style={{ textAlign: "center", maxWidth: 480 }}>
                    <div style={{ fontSize: "3.5rem", fontWeight: 700, letterSpacing: "-2px", color: "#fff", lineHeight: 1 }}>
                        WORD<span style={{ color: "#00ffe1" }}>FALL</span>
                    </div>
                    <p style={{ color: "#aaa", margin: "0.75rem 0 2rem", fontSize: "0.95rem" }}>
                        Type the falling words before they hit the ground.
                    </p>

                    <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center", marginBottom: "2rem" }}>
                        {Object.entries(DIFFICULTIES).map(([key, cfg]) => (
                            <button key={key} onClick={() => setDifficulty(key)} style={{
                                padding: "0.5rem 1.2rem",
                                border: `2px solid ${difficulty === key ? "#00ffe1" : "#333"}`,
                                background: difficulty === key ? "#00ffe1" : "transparent",
                                color: difficulty === key ? "#0a0f1e" : "#aaa",
                                fontFamily: "inherit", fontWeight: 700, fontSize: "0.85rem",
                                borderRadius: 6, cursor: "pointer", transition: "all 0.15s",
                            }}>{cfg.label}</button>
                        ))}
                    </div>

                    <button onClick={startGame} style={{
                        padding: "0.85rem 3rem",
                        background: "#00ffe1", color: "#0a0f1e",
                        border: "none", borderRadius: 8,
                        fontFamily: "inherit", fontWeight: 700, fontSize: "1.1rem",
                        cursor: "pointer", letterSpacing: 1,
                        boxShadow: "0 0 24px #00ffe180",
                        transition: "transform 0.1s",
                    }}
                        onMouseDown={e => e.currentTarget.style.transform = "scale(0.96)"}
                        onMouseUp={e => e.currentTarget.style.transform = "scale(1)"}
                    >START GAME</button>

                    {bestScore > 0 && (
                        <div style={{ marginTop: "1.5rem", color: "#555", fontSize: "0.85rem" }}>
                            Best: <span style={{ color: "#ffe84d", fontWeight: 700 }}>{bestScore}</span>
                        </div>
                    )}
                </div>
            )}

            {/* ── GAME ── */}
            {screen === "game" && (
                <div style={{ width: "100%", maxWidth: 700, userSelect: "none" }}>
                    {/* HUD */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
                        <div>
                            <span style={{ color: "#555", fontSize: "0.75rem" }}>SCORE</span>
                            <div style={{ color: "#fff", fontWeight: 700, fontSize: "1.5rem", lineHeight: 1 }}>{score}</div>
                        </div>
                        <div style={{ textAlign: "center" }}>
                            {combo >= 2 && (
                                <div style={{ color: comboColor, fontWeight: 700, fontSize: "0.9rem", letterSpacing: 1 }}>
                                    ×{combo} COMBO{combo >= 5 ? " 🔥" : ""}
                                </div>
                            )}
                        </div>
                        <div style={{ textAlign: "right" }}>
                            <span style={{ color: "#555", fontSize: "0.75rem" }}>LIVES</span>
                            <div style={{ fontSize: "1.3rem" }}>{"❤️".repeat(lives)}{"🖤".repeat(LIVES - lives)}</div>
                        </div>
                    </div>

                    {/* Arena */}
                    <div
                        key={shakeKey}
                        ref={arenaRef}
                        style={{
                            position: "relative",
                            width: "100%",
                            height: 420,
                            background: "#080d18",
                            borderRadius: 12,
                            border: "1px solid #1a2040",
                            overflow: "hidden",
                            animation: shakeKey > 0 ? "shake 0.3s ease" : "none",
                        }}
                    >
                        {/* scanline effect */}
                        <div style={{
                            position: "absolute", inset: 0, pointerEvents: "none",
                            background: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.015) 2px, rgba(255,255,255,0.015) 4px)",
                        }} />

                        {/* floor line */}
                        <div style={{
                            position: "absolute", bottom: 0, left: 0, right: 0,
                            height: 2, background: "#ff3b3b44",
                        }} />

                        {/* falling words */}
                        {words.map(w => (
                            <div key={w.id} style={{
                                position: "absolute",
                                left: w.x, top: w.y,
                                background: w.color.bg,
                                color: w.color.text,
                                fontWeight: 700,
                                fontSize: "1rem",
                                padding: "0.35rem 0.85rem",
                                borderRadius: 6,
                                boxShadow: `0 0 16px ${w.color.glow}88`,
                                whiteSpace: "nowrap",
                                transition: flashWord === w.id ? "none" : "top 0ms",
                                opacity: flashWord === w.id ? 0 : 1,
                                transform: flashWord === w.id ? "scale(1.3)" : "scale(1)",
                                letterSpacing: 1,
                            }}>
                                {renderWordLabel(w)}
                            </div>
                        ))}

                        {/* particles */}
                        {particles.map(p => (
                            <Particles key={p.id} x={p.x} y={p.y} color={p.color}
                                onDone={() => setParticles(prev => prev.filter(pp => pp.id !== p.id))} />
                        ))}
                    </div>

                    {/* Input */}
                    <input
                        ref={inputRef}
                        value={input}
                        onChange={handleInput}
                        autoComplete="off" spellCheck={false}
                        placeholder="type here..."
                        style={{
                            width: "100%",
                            marginTop: "0.75rem",
                            padding: "0.75rem 1rem",
                            background: "#0e1428",
                            border: "2px solid #1e2a50",
                            borderRadius: 8,
                            color: "#00ffe1",
                            fontFamily: "inherit",
                            fontSize: "1.1rem",
                            fontWeight: 700,
                            outline: "none",
                            letterSpacing: 2,
                            boxSizing: "border-box",
                            transition: "border-color 0.15s",
                        }}
                        onFocus={e => e.target.style.borderColor = "#00ffe1"}
                        onBlur={e => e.target.style.borderColor = "#1e2a50"}
                    />

                    <button onClick={endGame} style={{
                        marginTop: "0.5rem",
                        background: "transparent", border: "none",
                        color: "#333", fontFamily: "inherit",
                        fontSize: "0.75rem", cursor: "pointer",
                    }}>quit</button>
                </div>
            )}

            {/* ── GAME OVER ── */}
            {screen === "over" && (
                <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: "2rem", fontWeight: 700, color: "#ff3b3b", letterSpacing: 2 }}>GAME OVER</div>
                    <div style={{ margin: "1.5rem 0" }}>
                        <div style={{ color: "#555", fontSize: "0.8rem" }}>FINAL SCORE</div>
                        <div style={{ color: "#fff", fontWeight: 700, fontSize: "3rem", lineHeight: 1 }}>{score}</div>
                        {score >= bestScore && score > 0 && (
                            <div style={{ color: "#ffe84d", fontSize: "0.85rem", marginTop: "0.4rem" }}>🏆 New Best!</div>
                        )}
                    </div>
                    <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center" }}>
                        <button onClick={startGame} style={{
                            padding: "0.75rem 2rem",
                            background: "#00ffe1", color: "#0a0f1e",
                            border: "none", borderRadius: 8,
                            fontFamily: "inherit", fontWeight: 700, fontSize: "1rem",
                            cursor: "pointer",
                        }}>PLAY AGAIN</button>
                        <button onClick={() => setScreen("menu")} style={{
                            padding: "0.75rem 2rem",
                            background: "transparent", color: "#aaa",
                            border: "1px solid #333", borderRadius: 8,
                            fontFamily: "inherit", fontWeight: 700, fontSize: "1rem",
                            cursor: "pointer",
                        }}>MENU</button>
                    </div>
                </div>
            )}

            <style>{`
        @keyframes shake {
          0%,100% { transform: translateX(0); }
          20%      { transform: translateX(-6px); }
          40%      { transform: translateX(6px); }
          60%      { transform: translateX(-4px); }
          80%      { transform: translateX(4px); }
        }
      `}</style>
        </div>
    );
}