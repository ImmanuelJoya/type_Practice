
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Timer, 
  Zap, 
  Target, 
  RefreshCw, 
  Trophy,
  Keyboard,
  Volume2,
  VolumeX,
  Palette,
  Settings,
  ChevronRight,
  Star
} from 'lucide-react';

// Professional color themes
const themes = {
  cyberpunk: {
    name: 'Cyberpunk',
    bg: 'from-slate-900 via-purple-900 to-slate-900',
    accent: 'cyan-400',
    secondary: 'fuchsia-500',
    text: 'slate-100',
    glass: 'bg-slate-900/40',
    border: 'border-cyan-400/30',
    correct: 'text-cyan-400',
    incorrect: 'text-rose-500',
    current: 'bg-cyan-400/30'
  },
  minimal: {
    name: 'Minimal',
    bg: 'from-gray-50 to-gray-100',
    accent: 'slate-800',
    secondary: 'slate-600',
    text: 'slate-800',
    glass: 'bg-white/70',
    border: 'border-slate-200',
    correct: 'text-emerald-600',
    incorrect: 'text-rose-600',
    current: 'bg-slate-200'
  },
  ocean: {
    name: 'Ocean',
    bg: 'from-blue-900 via-cyan-900 to-teal-900',
    accent: 'cyan-300',
    secondary: 'teal-400',
    text: 'cyan-50',
    glass: 'bg-blue-900/30',
    border: 'border-cyan-300/30',
    correct: 'text-teal-300',
    incorrect: 'text-rose-400',
    current: 'bg-cyan-300/30'
  },
  sunset: {
    name: 'Sunset',
    bg: 'from-orange-900 via-red-900 to-purple-900',
    accent: 'orange-400',
    secondary: 'pink-400',
    text: 'orange-50',
    glass: 'bg-red-900/30',
    border: 'border-orange-400/30',
    correct: 'text-amber-300',
    incorrect: 'text-rose-400',
    current: 'bg-orange-400/30'
  }
};

const paragraphs = [
  "The quick brown fox jumps over the lazy dog. Programming is the art of telling another human what one wants the computer to do.",
  "Success is not final, failure is not fatal: it is the courage to continue that counts. Code is like humor. When you have to explain it, it's bad.",
  "In the middle of difficulty lies opportunity. The only way to do great work is to love what you do. Innovation distinguishes between a leader and a follower.",
  "Technology is best when it brings people together. The Web does not just connect machines, it connects people. Data is the new oil.",
  "Simplicity is the ultimate sophistication. Design is not just what it looks like and feels like. Design is how it works."
];

const KeyboardKey = ({ char, isActive, isPressed, theme }) => (
  <motion.div
    animate={{
      scale: isPressed ? 0.9 : 1,
      backgroundColor: isActive ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.05)',
      borderColor: isActive ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.1)'
    }}
    className={`
      w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold
      border-2 backdrop-blur-sm transition-all duration-75
      ${theme === 'minimal' ? 'text-slate-700 border-slate-300 bg-white/50' : 'text-white'}
    `}
  >
    {char}
  </motion.div>
);

const CircularProgress = ({ value, max, color, size = 120, strokeWidth = 8, children }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (value / max) * circumference;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg className="transform -rotate-90 w-full h-full">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="transparent"
          className="text-white/10"
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className={color}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center flex-col">
        {children}
      </div>
    </div>
  );
};

const StatCard = ({ icon: Icon, label, value, subtext, delay, theme }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.5 }}
    className={`
      ${themes[theme].glass} backdrop-blur-xl rounded-2xl p-6 border ${themes[theme].border}
      hover:scale-105 transition-transform duration-300 shadow-2xl
    `}
  >
    <div className="flex items-center gap-3 mb-2">
      <div className={`p-2 rounded-lg bg-gradient-to-br from-${themes[theme].accent} to-${themes[theme].secondary} opacity-80`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      <span className={`text-sm font-medium opacity-70 ${themes[theme].text}`}>{label}</span>
    </div>
    <div className={`text-3xl font-bold ${themes[theme].text}`}>{value}</div>
    {subtext && <div className="text-xs opacity-50 mt-1">{subtext}</div>}
  </motion.div>
);

export default function App() {
  const [theme, setTheme] = useState('cyberpunk');
  const [currentText, setCurrentText] = useState('');
  const [input, setInput] = useState('');
  const [timeLeft, setTimeLeft] = useState(60);
  const [isActive, setIsActive] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [wpm, setWpm] = useState(0);
  const [accuracy, setAccuracy] = useState(100);
  const [errors, setErrors] = useState(0);
  const [characters, setCharacters] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [pressedKey, setPressedKey] = useState(null);
  const [showKeyboard, setShowKeyboard] = useState(true);
  const [highScore, setHighScore] = useState(0);
  
  const inputRef = useRef(null);
  const intervalRef = useRef(null);

  const currentTheme = themes[theme];

  const initGame = useCallback(() => {
    const randomText = paragraphs[Math.floor(Math.random() * paragraphs.length)];
    setCurrentText(randomText);
    setInput('');
    setTimeLeft(60);
    setIsActive(false);
    setIsFinished(false);
    setWpm(0);
    setAccuracy(100);
    setErrors(0);
    setCharacters(0);
    setPressedKey(null);
    if (intervalRef.current) clearInterval(intervalRef.current);
  }, []);

  useEffect(() => {
    initGame();
    const saved = localStorage.getItem('typePracticeHighScore');
    if (saved) setHighScore(parseInt(saved));
  }, [initGame]);

  useEffect(() => {
    if (isActive && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      finishGame();
    }
    return () => clearInterval(intervalRef.current);
  }, [isActive, timeLeft]);

  const finishGame = () => {
    setIsActive(false);
    setIsFinished(true);
    clearInterval(intervalRef.current);
    
    const timeElapsed = 60 - timeLeft;
    const minutes = timeElapsed / 60;
    const wpmCalc = Math.round((characters / 5) / minutes) || 0;
    const accuracyCalc = Math.round(((characters - errors) / characters) * 100) || 0;
    
    setWpm(wpmCalc);
    setAccuracy(accuracyCalc);
    
    if (wpmCalc > highScore) {
      setHighScore(wpmCalc);
      localStorage.setItem('typePracticeHighScore', wpmCalc.toString());
    }
  };

  const handleInput = (e) => {
    if (!isActive && !isFinished) {
      setIsActive(true);
    }
    
    const value = e.target.value;
    setInput(value);
    setCharacters(value.length);

    let errorCount = 0;
    for (let i = 0; i < value.length; i++) {
      if (value[i] !== currentText[i]) errorCount++;
    }
    setErrors(errorCount);

    if (value === currentText) {
      finishGame();
    }
  };

  const handleKeyDown = (e) => {
    setPressedKey(e.key);
    setTimeout(() => setPressedKey(null), 100);
  };

  const getCharClass = (charIndex) => {
    if (charIndex < input.length) {
      return input[charIndex] === currentText[charIndex] 
        ? currentTheme.correct 
        : currentTheme.incorrect;
    }
    if (charIndex === input.length) {
      return `${currentTheme.current} rounded px-1`;
    }
    return `${currentTheme.text} opacity-50`;
  };

  const keyboardRows = [
    ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
    ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'],
    ['z', 'x', 'c', 'v', 'b', 'n', 'm']
  ];

  return (
    <div className={`min-h-screen bg-gradient-to-br ${currentTheme.bg} transition-all duration-1000 overflow-hidden relative`}>
      {/* Animated Background Particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className={`absolute w-2 h-2 rounded-full bg-${currentTheme.accent} opacity-20`}
            animate={{
              y: [0, -1000],
              x: [0, Math.random() * 100 - 50],
              opacity: [0, 1, 0]
            }}
            transition={{
              duration: Math.random() * 10 + 10,
              repeat: Infinity,
              delay: Math.random() * 5
            }}
            style={{
              left: `${Math.random() * 100}%`,
              top: '100%'
            }}
          />
        ))}
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <motion.header 
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="flex justify-between items-center mb-12"
        >
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-2xl bg-gradient-to-br from-${currentTheme.accent} to-${currentTheme.secondary} shadow-2xl`}>
              <Keyboard className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className={`text-3xl font-bold ${currentTheme.text} tracking-tight`}>
                Type<span className={`text-${currentTheme.accent}`}>Master</span>
              </h1>
              <p className="text-sm opacity-60">Professional Typing Training</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Theme Selector */}
            <div className="relative group">
              <button className={`p-3 rounded-xl ${currentTheme.glass} backdrop-blur-md border ${currentTheme.border} hover:scale-110 transition-all`}>
                <Palette className={`w-5 h-5 ${currentTheme.text}`} />
              </button>
              <div className="absolute right-0 top-full mt-2 w-48 py-2 rounded-xl bg-slate-900/90 backdrop-blur-xl border border-white/10 shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                {Object.entries(themes).map(([key, t]) => (
                  <button
                    key={key}
                    onClick={() => setTheme(key)}
                    className={`w-full px-4 py-2 text-left text-sm hover:bg-white/10 transition-colors flex items-center gap-2 ${theme === key ? 'text-cyan-400' : 'text-white'}`}
                  >
                    <div className={`w-3 h-3 rounded-full bg-gradient-to-br ${t.bg}`} />
                    {t.name}
                  </button>
                ))}
              </div>
            </div>

            <button 
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`p-3 rounded-xl ${currentTheme.glass} backdrop-blur-md border ${currentTheme.border} hover:scale-110 transition-all`}
            >
              {soundEnabled ? <Volume2 className={`w-5 h-5 ${currentTheme.text}`} /> : <VolumeX className={`w-5 h-5 ${currentTheme.text}`} />}
            </button>

            <button 
              onClick={() => setShowKeyboard(!showKeyboard)}
              className={`p-3 rounded-xl ${currentTheme.glass} backdrop-blur-md border ${currentTheme.border} hover:scale-110 transition-all ${showKeyboard ? 'ring-2 ring-cyan-400/50' : ''}`}
            >
              <Keyboard className={`w-5 h-5 ${currentTheme.text}`} />
            </button>
          </div>
        </motion.header>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatCard 
            icon={Timer} 
            label="Time Left" 
            value={`${timeLeft}s`} 
            subtext="Keep going!" 
            delay={0.1}
            theme={theme}
          />
          <StatCard 
            icon={Zap} 
            label="WPM" 
            value={isFinished ? wpm : '-'} 
            subtext={highScore > 0 ? `Best: ${highScore}` : 'No record yet'}
            delay={0.2}
            theme={theme}
          />
          <StatCard 
            icon={Target} 
            label="Accuracy" 
            value={`${isFinished ? accuracy : '-'}%`} 
            subtext={`${errors} errors`}
            delay={0.3}
            theme={theme}
          />
          <StatCard 
            icon={Trophy} 
            label="Characters" 
            value={characters} 
            subtext={`${Math.round(characters / 5)} words`}
            delay={0.4}
            theme={theme}
          />
        </div>

        {/* Main Typing Area */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.5 }}
          className={`
            ${currentTheme.glass} backdrop-blur-2xl rounded-3xl p-8 md:p-12 
            border ${currentTheme.border} shadow-2xl mb-8
            relative overflow-hidden
          `}
        >
          {/* Progress Bar */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-white/10">
            <motion.div 
              className={`h-full bg-gradient-to-r from-${currentTheme.accent} to-${currentTheme.secondary}`}
              initial={{ width: 0 }}
              animate={{ width: `${(input.length / currentText.length) * 100}%` }}
            />
          </div>

          {/* Text Display */}
          <div className="mb-6 relative">
            <p className={`text-2xl md:text-3xl leading-relaxed font-mono tracking-wide ${currentTheme.text}`}>
              {currentText.split('').map((char, index) => (
                <motion.span
                  key={index}
                  initial={false}
                  animate={index === input.length ? { scale: [1, 1.2, 1] } : {}}
                  className={`inline-block transition-all duration-150 ${getCharClass(index)}`}
                >
                  {char === ' ' ? '\u00A0' : char}
                </motion.span>
              ))}
            </p>
            
            {/* Cursor */}
            <motion.div
              animate={{ opacity: [1, 0] }}
              transition={{ duration: 0.5, repeat: Infinity }}
              className={`absolute h-8 w-0.5 bg-${currentTheme.accent} top-2`}
              style={{ left: `${(input.length / currentText.length) * 100}%` }}
            />
          </div>

          {/* Hidden Input */}
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            disabled={isFinished}
            className="absolute opacity-0 inset-0 w-full h-full cursor-default"
            autoFocus
          />

          {/* Focus Indicator */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: document.hasFocus() ? 0 : 1 }}
            className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm rounded-3xl"
          >
            <p className="text-white text-xl font-medium">Click here to focus</p>
          </motion.div>
        </motion.div>

        {/* Virtual Keyboard */}
        <AnimatePresence>
          {showKeyboard && (
            <motion.div
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 50, opacity: 0 }}
              className={`
                ${currentTheme.glass} backdrop-blur-xl rounded-2xl p-6 
                border ${currentTheme.border} shadow-2xl
              `}
            >
              <div className="flex flex-col items-center gap-2">
                {keyboardRows.map((row, rowIndex) => (
                  <div key={rowIndex} className="flex gap-2" style={{ marginLeft: rowIndex === 1 ? '20px' : rowIndex === 2 ? '40px' : '0' }}>
                    {row.map((key) => (
                      <KeyboardKey
                        key={key}
                        char={key}
                        isActive={input[input.length - 1]?.toLowerCase() === key}
                        isPressed={pressedKey?.toLowerCase() === key}
                        theme={theme}
                      />
                    ))}
                  </div>
                ))}
                <div className="flex gap-2 mt-2">
                  <KeyboardKey char="space" isActive={pressedKey === ' '} isPressed={pressedKey === ' '} theme={theme} />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Results Modal */}
        <AnimatePresence>
          {isFinished && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            >
              <motion.div
                initial={{ scale: 0.8, y: 50 }}
                animate={{ scale: 1, y: 0 }}
                className={`
                  ${currentTheme.glass} backdrop-blur-2xl rounded-3xl p-8 max-w-md w-full
                  border ${currentTheme.border} shadow-2xl text-center
                `}
              >
                <div className="mb-6">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 200, damping: 15 }}
                    className={`inline-flex p-4 rounded-full bg-gradient-to-br from-${currentTheme.accent} to-${currentTheme.secondary} mb-4`}
                  >
                    <Trophy className="w-12 h-12 text-white" />
                  </motion.div>
                  <h2 className={`text-3xl font-bold ${currentTheme.text} mb-2`}>Test Complete!</h2>
                  <p className="opacity-60">Great job! Here's how you performed:</p>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-8">
                  <div className={`p-4 rounded-2xl ${currentTheme.glass} border ${currentTheme.border}`}>
                    <div className={`text-4xl font-bold ${currentTheme.text} mb-1`}>{wpm}</div>
                    <div className="text-sm opacity-60">WPM</div>
                  </div>
                  <div className={`p-4 rounded-2xl ${currentTheme.glass} border ${currentTheme.border}`}>
                    <div className={`text-4xl font-bold ${currentTheme.text} mb-1`}>{accuracy}%</div>
                    <div className="text-sm opacity-60">Accuracy</div>
                  </div>
                </div>

                {wpm === highScore && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="mb-6 p-3 rounded-xl bg-gradient-to-r from-yellow-400/20 to-orange-400/20 border border-yellow-400/30"
                  >
                    <div className="flex items-center justify-center gap-2 text-yellow-400">
                      <Star className="w-5 h-5 fill-current" />
                      <span className="font-bold">New High Score!</span>
                      <Star className="w-5 h-5 fill-current" />
                    </div>
                  </motion.div>
                )}

                <button
                  onClick={initGame}
                  className={`
                    w-full py-4 rounded-2xl font-bold text-lg
                    bg-gradient-to-r from-${currentTheme.accent} to-${currentTheme.secondary}
                    text-white shadow-lg hover:shadow-xl hover:scale-105 
                    transition-all duration-300 flex items-center justify-center gap-2
                  `}
                >
                  <RefreshCw className="w-5 h-5" />
                  Try Again
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Footer Controls */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="flex justify-center mt-8"
        >
          <button
            onClick={initGame}
            disabled={isActive}
            className={`
              px-8 py-3 rounded-xl font-medium
              ${isActive 
                ? 'opacity-50 cursor-not-allowed' 
                : `hover:scale-105 ${currentTheme.glass} backdrop-blur-md border ${currentTheme.border}`
              }
              ${currentTheme.text} transition-all duration-300 flex items-center gap-2
            `}
          >
            <RefreshCw className="w-4 h-4" />
            Restart Test
          </button>
        </motion.div>
      </div>
    </div>
  );
}