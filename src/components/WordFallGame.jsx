import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";

// ─── Configuration ────────────────────────────────────────────────────────────
const WORD_POOLS = {
    easy:   ["cat","dog","run","big","map","hat","sun","key","zip","cup","log","ant","bus","fan","gem"],
    medium: ["plant","brave","chess","dream","flame","globe","honey","ivory","joker","karma","lemon","magic","ninja","orbit","pixel"],
    hard:   ["abstract","alchemy","blizzard","catalyst","delegate","eloquent","flourish","gradient","hallmark","integral","jubilant","keyboard"],
};

const DIFFICULTIES = {
    easy:   { speed: 55,  spawnRate: 3200, maxWords: 3, label: "Easy"   },
    medium: { speed: 80,  spawnRate: 2400, maxWords: 4, label: "Medium" },
    hard:   { speed: 115, spawnRate: 1800, maxWords: 5, label: "Hard"   },
};

const LIVES = 3;
let wordIdCounter = 0;

const WORD_COLORS = [
    { bg: "#00ffe1", text: "#0a0f1e", glow: "#00ffe1" },
    { bg: "#ff6bdf", text: "#0a0f1e", glow: "#ff6bdf" },
    { bg: "#ffe84d", text: "#0a0f1e", glow: "#ffe84d" },
    { bg: "#7b61ff", text: "#fff",    glow: "#7b61ff" },
    { bg: "#ff8c42", text: "#0a0f1e", glow: "#ff8c42" },
];

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

// ─── Particle Effect Component ────────────────────────────────────────────────
// Isolated with its own animation — never re-mounts mid-burst
function Particles({ x, y, color, onDone }) {
    const [frame, setFrame] = useState(0);
    const onDoneRef = useRef(onDone);

    useEffect(() => {
        const id  = setInterval(() => setFrame(f => f + 1), 30);
        const tid = setTimeout(() => {
            clearInterval(id);
            onDoneRef.current?.();
        }, 600);
        return () => { clearInterval(id); clearTimeout(tid); };
    }, []); // empty deps — never re-runs, never re-mounts

    return (
        <>
            {Array.from({ length: 12 }, (_, i) => {
                const angle   = (i / 12) * Math.PI * 2;
                const dist    = frame * 5;
                const opacity = Math.max(0, 1 - frame / 20);
                const size    = 6 + (i % 3) * 3; // varied sizes: 6, 9, 12
                return (
                    <div key={i} style={{
                        position: "absolute",
                        left: x + Math.cos(angle) * dist - size / 2,
                        top:  y + Math.sin(angle) * dist - size / 2,
                        width: size,
                        height: size,
                        borderRadius: "50%",
                        background: color,
                        opacity,
                        pointerEvents: "none",
                        zIndex: 10,
                        boxShadow: `0 0 ${size}px ${color}`,
                    }} />
                );
            })}
        </>
    );
}

// ─── Main Game Component ──────────────────────────────────────────────────────
export default function WordFallGame({ onClose }) {
    const navigate = useNavigate();

    const [screen, setScreen]         = useState("menu");
    const [difficulty, setDifficulty] = useState("medium");
    const [words, setWords]           = useState([]);
    const [input, setInput]           = useState("");
    const [score, setScore]           = useState(0);
    const [lives, setLives]           = useState(LIVES);
    const [combo, setCombo]           = useState(0);
    const [bestScore, setBestScore]   = useState(() => Number(localStorage.getItem("wf_best") || 0));
    const [particles, setParticles]   = useState([]);
    const [shakeKey, setShakeKey]     = useState(0);

    // Use a REF for exploding IDs — not state — so the game loop never restarts
    const explodingIdsRef = useRef(new Set());

    const arenaRef  = useRef(null);
    const inputRef  = useRef(null);
    const rafRef    = useRef(null);
    const lastRef   = useRef(null);
    const spawnRef  = useRef(null);
    const wordsRef  = useRef([]);
    const liveRef   = useRef(LIVES);
    const scoreRef  = useRef(0);
    const comboRef  = useRef(0);

    useEffect(() => { wordsRef.current = words; }, [words]);
    useEffect(() => { liveRef.current  = lives; }, [lives]);
    useEffect(() => { scoreRef.current = score; }, [score]);
    useEffect(() => { comboRef.current = combo; }, [combo]);

    const handleClose = useCallback(() => {
        if (typeof onClose === "function") onClose();
        else navigate("/");
    }, [onClose, navigate]);

    // ── End game ──────────────────────────────────────────────────────────────
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

    // ── Game loop — no explodingIds in deps, reads ref instead ────────────────
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
                // Skip words mid-explosion — they're already fading out
                if (explodingIdsRef.current.has(w.id)) {
                    next.push(w);
                    continue;
                }
                const ny = w.y + w.speed * dt;
                if (ny + 48 >= floor) {
                    hitFloor = true;
                } else {
                    next.push({ ...w, y: ny });
                }
            }

            if (hitFloor) {
                setShakeKey(k => k + 1);
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
    }, [endGame]); // no explodingIds dep — reads ref directly

    // ── Spawn ─────────────────────────────────────────────────────────────────
    const spawnWord = useCallback(() => {
        const arena = arenaRef.current;
        if (!arena) return;
        const cfg = DIFFICULTIES[difficulty];

        const activeCount = wordsRef.current.filter(w => !explodingIdsRef.current.has(w.id)).length;
        if (activeCount >= cfg.maxWords) return;

        const pool      = WORD_POOLS[difficulty];
        const existing  = new Set(wordsRef.current.map(w => w.text));
        const available = pool.filter(w => !existing.has(w));
        if (!available.length) return;

        const text  = pick(available);
        const color = pick(WORD_COLORS);
        const areaW = arena.offsetWidth;
        const x     = Math.random() * (areaW - 160) + 10;
        const id    = ++wordIdCounter;

        setWords(prev => [...prev, { id, text, x, y: -50, color, speed: cfg.speed }]);
    }, [difficulty]); // no explodingIds dep

    // ── Start ─────────────────────────────────────────────────────────────────
    const startGame = useCallback(() => {
        wordIdCounter    = 0;
        wordsRef.current = [];
        liveRef.current  = LIVES;
        scoreRef.current = 0;
        comboRef.current = 0;
        explodingIdsRef.current = new Set();
        setWords([]); setScore(0); setLives(LIVES); setCombo(0);
        setInput(""); setParticles([]);
        setScreen("game");
        lastRef.current = null;
        setTimeout(() => inputRef.current?.focus(), 50);
    }, []);

    useEffect(() => {
        if (screen !== "game") return;
        const cfg = DIFFICULTIES[difficulty];
        spawnWord();
        spawnRef.current = setInterval(spawnWord, cfg.spawnRate);
        rafRef.current   = requestAnimationFrame(gameLoop);
        return () => {
            cancelAnimationFrame(rafRef.current);
            clearInterval(spawnRef.current);
        };
    }, [screen, difficulty, gameLoop, spawnWord]);

    // ── Input — triggers explosion ────────────────────────────────────────────
    const handleInput = useCallback((e) => {
        const val = e.target.value.replace(/\s/g, "");
        setInput(val);

        const matched = wordsRef.current.find(
            w => w.text === val && !explodingIdsRef.current.has(w.id)
        );
        if (!matched) return;

        // 1. Mark as exploding in the REF (doesn't trigger re-render / loop restart)
        explodingIdsRef.current.add(matched.id);

        // 2. Force a re-render so the word gets the explosion CSS applied
        setWords(prev => [...prev]);

        // 3. Spawn particle burst at word centre
        const pid = Date.now();
        setParticles(prev => [
            ...prev,
            { id: pid, x: matched.x + 60, y: matched.y + 24, color: matched.color.glow },
        ]);

        // 4. Scoring & combo
        const newCombo = comboRef.current + 1;
        comboRef.current = newCombo;
        setCombo(newCombo);
        const bonus = newCombo >= 5 ? 3 : newCombo >= 3 ? 2 : 1;
        scoreRef.current += matched.text.length * 10 * bonus;
        setScore(scoreRef.current);

        // 5. Clear input
        setInput("");

        // 6. Remove word after animation (200ms)
        setTimeout(() => {
            explodingIdsRef.current.delete(matched.id);
            setWords(prev => prev.filter(w => w.id !== matched.id));
        }, 200);
    }, []);

    // ── Prefix highlight ──────────────────────────────────────────────────────
    function renderWordLabel(word) {
        const txt = word.text;
        let matchLen = 0;
        for (let i = 0; i < Math.min(input.length, txt.length); i++) {
            if (input[i] === txt[i]) matchLen++; else break;
        }
        return (
            <span>
                <span style={{ textDecoration: "underline", textDecorationColor: "#0a0f1e", opacity: 0.7 }}>
                    {txt.slice(0, matchLen)}
                </span>
                {txt.slice(matchLen)}
            </span>
        );
    }

    const comboColor = combo >= 5 ? "#ffe84d" : combo >= 3 ? "#ff6bdf" : "#00ffe1";

    const btnStyle = {
        background: "transparent",
        border: "1px solid #1e2a50",
        color: "#aaa",
        fontFamily: "inherit",
        fontSize: "0.85rem",
        padding: "0.5rem 1.2rem",
        borderRadius: 6,
        cursor: "pointer",
        transition: "all 0.15s",
        fontWeight: 700,
    };

    // ─────────────────────────────────────────────────────────────────────────
    return (
        <div style={{
            position: "fixed", inset: 0,
            fontFamily: "'Space Mono', monospace",
            background: "#0a0f1e",
            display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center",
            zIndex: 9999, overflow: "hidden", color: "#fff",
        }}>
            <link href="https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&display=swap" rel="stylesheet" />

            {/* ── MENU ── */}
            {screen === "menu" && (
                <div style={{ textAlign: "center", width: "100%", maxWidth: 480, position: "relative" }}>
                    <button onClick={handleClose} style={{ ...btnStyle, position: "absolute", top: -60, left: "1rem" }}>
                        ← Back to Site
                    </button>
                    <h1 style={{ fontSize: "clamp(2.5rem, 10vw, 4rem)", margin: 0 }}>
                        WORD<span style={{ color: "#00ffe1" }}>FALL</span>
                    </h1>
                    <p style={{ color: "#aaa", marginBottom: "2rem" }}>Type the words before they hit the ground!</p>

                    <div style={{ display: "flex", gap: "0.5rem", justifyContent: "center", marginBottom: "2rem" }}>
                        {Object.keys(DIFFICULTIES).map(k => (
                            <button key={k} onClick={() => setDifficulty(k)} style={{
                                ...btnStyle,
                                background:  difficulty === k ? "#00ffe1" : "transparent",
                                color:       difficulty === k ? "#0a0f1e" : "#aaa",
                                borderColor: difficulty === k ? "#00ffe1" : "#1e2a50",
                            }}>{DIFFICULTIES[k].label}</button>
                        ))}
                    </div>

                    <button onClick={startGame} style={{
                        ...btnStyle, background: "#00ffe1", color: "#0a0f1e",
                        border: "none", fontSize: "1.2rem", padding: "1rem 3rem",
                        boxShadow: "0 0 20px #00ffe144",
                    }}>START GAME</button>

                    {bestScore > 0 && (
                        <div style={{ marginTop: "1rem", color: "#555" }}>
                            Best Score: <span style={{ color: "#ffe84d", fontWeight: 700 }}>{bestScore}</span>
                        </div>
                    )}
                </div>
            )}

            {/* ── GAME ── */}
            {screen === "game" && (
                <div style={{
                    width: "100%", height: "100%",
                    display: "flex", flexDirection: "column",
                    padding: "1rem", boxSizing: "border-box",
                }}>
                    {/* HUD */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem", flexShrink: 0 }}>
                        <div>
                            <div style={{ fontSize: "0.65rem", color: "#555" }}>SCORE</div>
                            <div style={{ fontSize: "clamp(1rem, 4vw, 1.5rem)", fontWeight: 700 }}>{score}</div>
                        </div>
                        {combo > 1 && (
                            <div style={{ color: comboColor, fontWeight: 700, fontSize: "clamp(0.8rem, 3vw, 1.2rem)" }}>
                                ×{combo} COMBO{combo >= 5 ? " 🔥" : ""}
                            </div>
                        )}
                        <div style={{ textAlign: "right" }}>
                            <div style={{ fontSize: "0.65rem", color: "#555" }}>LIVES</div>
                            <div style={{ fontSize: "clamp(0.9rem, 4vw, 1.2rem)" }}>{"❤️".repeat(lives)}{"🖤".repeat(LIVES - lives)}</div>
                        </div>
                    </div>

                    {/* Arena */}
                    <div
                        key={shakeKey}
                        ref={arenaRef}
                        style={{
                            position: "relative", flex: 1, minHeight: 0,
                            background: "#080d18", borderRadius: 12,
                            border: "1px solid #1a2040", overflow: "hidden",
                            animation: shakeKey > 0 ? "shake 0.3s ease" : "none",
                        }}
                    >
                        {/* scanlines */}
                        <div style={{
                            position: "absolute", inset: 0, pointerEvents: "none",
                            background: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.012) 2px, rgba(255,255,255,0.012) 4px)",
                        }} />
                        {/* floor line */}
                        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 2, background: "#ff3b3b55" }} />

                        {/* Falling words */}
                        {words.map(w => {
                            const isExploding = explodingIdsRef.current.has(w.id);
                            return (
                                <div key={w.id} style={{
                                    position: "absolute",
                                    left: w.x, top: w.y,
                                    background: w.color.bg,
                                    color: w.color.text,
                                    fontWeight: 700,
                                    fontSize: "clamp(0.75rem, 2.5vw, 1rem)",
                                    padding: "0.4rem 0.8rem",
                                    borderRadius: 6,
                                    boxShadow: isExploding
                                        ? `0 0 40px ${w.color.glow}, 0 0 80px ${w.color.glow}66`
                                        : `0 0 15px ${w.color.glow}66`,
                                    whiteSpace: "nowrap",
                                    pointerEvents: "none",
                                    // ── Explosion animation via CSS transition ──
                                    opacity: isExploding ? 0 : 1,
                                    transform: isExploding ? "scale(2)" : "scale(1)",
                                    transition: isExploding
                                        ? "opacity 0.2s ease-out, transform 0.2s ease-out, box-shadow 0.2s ease-out"
                                        : "none",
                                }}>
                                    {renderWordLabel(w)}
                                </div>
                            );
                        })}

                        {/* Particles */}
                        {particles.map(p => (
                            <Particles
                                key={p.id}
                                x={p.x} y={p.y} color={p.color}
                                onDone={() => setParticles(prev => prev.filter(pp => pp.id !== p.id))}
                            />
                        ))}
                    </div>

                    {/* Input row */}
                    <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.75rem", flexShrink: 0 }}>
                        <input
                            ref={inputRef}
                            value={input}
                            onChange={handleInput}
                            placeholder="Type here..."
                            autoFocus
                            autoComplete="off"
                            autoCorrect="off"
                            autoCapitalize="none"
                            spellCheck={false}
                            style={{
                                flex: 1,
                                background: "#0e1428",
                                border: "2px solid #1e2a50",
                                borderRadius: 8,
                                color: "#00ffe1",
                                padding: "0.75rem 1rem",
                                fontSize: "clamp(0.9rem, 3vw, 1.1rem)",
                                fontFamily: "inherit",
                                fontWeight: 700,
                                outline: "none",
                                letterSpacing: 2,
                                boxSizing: "border-box",
                                transition: "border-color 0.15s",
                            }}
                            onFocus={e => e.target.style.borderColor = "#00ffe1"}
                            onBlur={e  => e.target.style.borderColor = "#1e2a50"}
                        />
                        <button
                            onClick={endGame}
                            style={btnStyle}
                            onMouseEnter={e => { e.currentTarget.style.color = "#ff3b3b"; e.currentTarget.style.borderColor = "#ff3b3b"; }}
                            onMouseLeave={e => { e.currentTarget.style.color = "#aaa";    e.currentTarget.style.borderColor = "#1e2a50"; }}
                        >Quit</button>
                    </div>
                </div>
            )}

            {/* ── GAME OVER ── */}
            {screen === "over" && (
                <div style={{ textAlign: "center" }}>
                    <h2 style={{ color: "#ff3b3b", fontSize: "clamp(2rem, 8vw, 3rem)", margin: 0 }}>GAME OVER</h2>
                    <div style={{ margin: "2rem 0" }}>
                        <div style={{ color: "#555", fontSize: "0.8rem" }}>FINAL SCORE</div>
                        <div style={{ fontSize: "clamp(2.5rem, 8vw, 4rem)", fontWeight: 700 }}>{score}</div>
                        {score >= bestScore && score > 0 && (
                            <div style={{ color: "#ffe84d", marginTop: "0.5rem" }}>🏆 New Personal Best!</div>
                        )}
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem", justifyContent: "center" }}>
                        <button onClick={startGame} style={{ ...btnStyle, background: "#00ffe1", color: "#0a0f1e", border: "none" }}>PLAY AGAIN</button>
                        <button onClick={() => setScreen("menu")} style={btnStyle}>MENU</button>
                        <button onClick={handleClose} style={btnStyle}>EXIT</button>
                    </div>
                </div>
            )}

            <style>{`
                @keyframes shake {
                    0%, 100% { transform: translateX(0); }
                    25%      { transform: translateX(-6px); }
                    75%      { transform: translateX(6px); }
                }
            `}</style>
        </div>
    );
}