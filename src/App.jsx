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
  Sun,
  Moon,
  ChevronRight,
  Star,
  Smartphone,
  Monitor,
  Eye
} from 'lucide-react';

// High-contrast, accessible themes
const themes = {
  dark: {
    name: 'Midnight',
    bg: 'bg-slate-950',
    surface: 'bg-slate-900',
    surfaceHover: 'hover:bg-slate-800',
    card: 'bg-slate-800/80',
    border: 'border-slate-700',
    text: 'text-slate-100',
    textMuted: 'text-slate-400',
    textSecondary: 'text-slate-300',
    accent: 'text-cyan-400',
    accentBg: 'bg-cyan-500',
    accentLight: 'bg-cyan-400/20',
    correct: 'text-emerald-400',
    incorrect: 'text-rose-400 bg-rose-500/20',
    current: 'bg-cyan-500/40 border-b-2 border-cyan-400',
    cursor: 'bg-cyan-400',
    shadow: 'shadow-slate-950/50',
    gradient: 'from-slate-900 to-slate-800'
  },
  light: {
    name: 'Daylight',
    bg: 'bg-gray-50',
    surface: 'bg-white',
    surfaceHover: 'hover:bg-gray-100',
    card: 'bg-white/90',
    border: 'border-gray-200',
    text: 'text-gray-900',
    textMuted: 'text-gray-500',
    textSecondary: 'text-gray-600',
    accent: 'text-blue-600',
    accentBg: 'bg-blue-600',
    accentLight: 'bg-blue-100',
    correct: 'text-emerald-600',
    incorrect: 'text-rose-600 bg-rose-100',
    current: 'bg-blue-200/70 border-b-2 border-blue-600',
    cursor: 'bg-blue-600',
    shadow: 'shadow-gray-200',
    gradient: 'from-gray-100 to-white'
  },
  ocean: {
    name: 'Ocean',
    bg: 'bg-blue-950',
    surface: 'bg-blue-900',
    surfaceHover: 'hover:bg-blue-800',
    card: 'bg-blue-900/80',
    border: 'border-blue-800',
    text: 'text-blue-50',
    textMuted: 'text-blue-300',
    textSecondary: 'text-blue-200',
    accent: 'text-cyan-300',
    accentBg: 'bg-cyan-500',
    accentLight: 'bg-cyan-400/20',
    correct: 'text-teal-300',
    incorrect: 'text-rose-300 bg-rose-500/30',
    current: 'bg-cyan-400/40 border-b-2 border-cyan-300',
    cursor: 'bg-cyan-300',
    shadow: 'shadow-blue-950/50',
    gradient: 'from-blue-900 to-slate-900'
  }
};

const paragraphs = [
  "If you see me fighting with a bear, help the bear. The only way to do great work is to love what you do. The best way to predict the future is to invent it.",
  "Real self confidence does not come from shouting affirmations in the mirror. It comes from shocasing the world irrefutable proof that you are who you say you are.",
  "You can be depressed and still get things done. Its called being an adult. The only limit to our realization of tomorrow will be our doubts of today.",
  "I am not saying that its impossible to find love all I am saying is that statistically you you have not; from the bottom of my heart I believe that 80 percent of relationship in the world is horseshit. A bunch of people who never took time to learn how to be alone therefore never learned how to love themself, so you employed some one else to do it.",
  "Accept people as they are, but place them where they belong. You are the CEO of your life. Hire, fire and promote accordingly."
];

export default function App() {
  const [theme, setTheme] = useState('dark');
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
  const [showKeyboard, setShowKeyboard] = useState(false);
  const [highScore, setHighScore] = useState(0);
  const [isFocused, setIsFocused] = useState(true);
  const [fontSize, setFontSize] = useState('text-2xl');
  
  const inputRef = useRef(null);
  const containerRef = useRef(null);
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
    if (intervalRef.current) clearInterval(intervalRef.current);
    // Auto-focus after reset
    setTimeout(() => inputRef.current?.focus(), 100);
  }, []);

  useEffect(() => {
    initGame();
    const saved = localStorage.getItem('typePracticeHighScore');
    if (saved) setHighScore(parseInt(saved));
    
    // Check system preference for theme
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
      setTheme('light');
    }
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

  // Handle focus/blur globally
  useEffect(() => {
    const handleFocus = () => setIsFocused(true);
    const handleBlur = () => setIsFocused(false);
    
    window.addEventListener('focus', handleFocus);
    window.addEventListener('blur', handleBlur);
    
    return () => {
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('blur', handleBlur);
    };
  }, []);

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

  const handleContainerClick = () => {
    inputRef.current?.focus();
  };

  const getCharClass = (charIndex) => {
    if (charIndex < input.length) {
      return input[charIndex] === currentText[charIndex] 
        ? currentTheme.correct 
        : currentTheme.incorrect;
    }
    if (charIndex === input.length) {
      return `${currentTheme.current} rounded px-0.5`;
    }
    return `${currentTheme.textSecondary}`;
  };

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : prev === 'light' ? 'ocean' : 'dark');
  };

  return (
    <div className={`min-h-screen ${currentTheme.bg} transition-colors duration-500`}>
      {/* Navigation Bar */}
      <nav className={`${currentTheme.surface} border-b ${currentTheme.border} sticky top-0 z-40 backdrop-blur-md bg-opacity-90`}>
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${currentTheme.accentBg} shadow-lg`}>
                <Keyboard className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className={`text-xl md:text-2xl font-bold ${currentTheme.text}`}>
                  Type<span className={currentTheme.accent}>Master</span>
                </h1>
                <p className={`text-xs ${currentTheme.textMuted} hidden sm:block`}>Professional Typing Training</p>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-2 md:gap-4">
              {/* Font Size Toggle */}
              <div className="hidden md:flex items-center gap-1 bg-slate-800/50 rounded-lg p-1">
                <button 
                  onClick={() => setFontSize('text-xl')}
                  className={`p-1.5 rounded ${fontSize === 'text-xl' ? 'bg-slate-600 text-white' : currentTheme.textMuted}`}
                >
                  <span className="text-xs font-bold">A</span>
                </button>
                <button 
                  onClick={() => setFontSize('text-2xl')}
                  className={`p-1.5 rounded ${fontSize === 'text-2xl' ? 'bg-slate-600 text-white' : currentTheme.textMuted}`}
                >
                  <span className="text-sm font-bold">A</span>
                </button>
                <button 
                  onClick={() => setFontSize('text-3xl')}
                  className={`p-1.5 rounded ${fontSize === 'text-3xl' ? 'bg-slate-600 text-white' : currentTheme.textMuted}`}
                >
                  <span className="text-base font-bold">A</span>
                </button>
              </div>

              {/* Theme Toggle */}
              <button
                onClick={toggleTheme}
                className={`p-2.5 rounded-xl ${currentTheme.card} border ${currentTheme.border} ${currentTheme.surfaceHover} transition-all`}
                title={`Current: ${currentTheme.name}`}
              >
                {theme === 'light' ? <Sun className={`w-5 h-5 ${currentTheme.accent}`} /> : 
                 theme === 'ocean' ? <Eye className={`w-5 h-5 ${currentTheme.accent}`} /> : 
                 <Moon className={`w-5 h-5 ${currentTheme.accent}`} />}
              </button>

              {/* Sound Toggle */}
              <button
                onClick={() => setSoundEnabled(!soundEnabled)}
                className={`p-2.5 rounded-xl ${currentTheme.card} border ${currentTheme.border} ${currentTheme.surfaceHover} transition-all hidden sm:block`}
              >
                {soundEnabled ? <Volume2 className={`w-5 h-5 ${currentTheme.text}`} /> : <VolumeX className={`w-5 h-5 ${currentTheme.textMuted}`} />}
              </button>

              {/* Keyboard Toggle */}
              <button
                onClick={() => setShowKeyboard(!showKeyboard)}
                className={`p-2.5 rounded-xl ${showKeyboard ? currentTheme.accentLight : ''} border ${currentTheme.border} ${currentTheme.surfaceHover} transition-all`}
              >
                <Monitor className={`w-5 h-5 ${showKeyboard ? currentTheme.accent : currentTheme.text}`} />
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-4 py-6 md:py-8">
        {/* Stats Grid - Mobile Optimized */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6 md:mb-8">
          {[
            { icon: Timer, label: 'Time', value: `${timeLeft}s`, subtext: 'seconds left' },
            { icon: Zap, label: 'WPM', value: isFinished ? wpm : '-', subtext: highScore ? `Best: ${highScore}` : 'No record' },
            { icon: Target, label: 'Accuracy', value: isFinished ? `${accuracy}%` : '-', subtext: `${errors} errors` },
            { icon: Trophy, label: 'Progress', value: `${Math.round((input.length / currentText.length) * 100)}%`, subtext: `${characters} chars` }
          ].map((stat, idx) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className={`${currentTheme.card} border ${currentTheme.border} rounded-2xl p-4 ${currentTheme.shadow} shadow-lg`}
            >
              <div className="flex items-center gap-2 mb-2">
                <stat.icon className={`w-4 h-4 ${currentTheme.accent}`} />
                <span className={`text-xs font-medium ${currentTheme.textMuted} uppercase tracking-wider`}>{stat.label}</span>
              </div>
              <div className={`text-2xl md:text-3xl font-bold ${currentTheme.text}`}>{stat.value}</div>
              <div className={`text-xs ${currentTheme.textMuted} mt-1`}>{stat.subtext}</div>
            </motion.div>
          ))}
        </div>

        {/* Typing Area - Click to Focus Fixed */}
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className={`relative ${currentTheme.card} border ${currentTheme.border} rounded-2xl md:rounded-3xl p-6 md:p-10 ${currentTheme.shadow} shadow-xl min-h-[200px] md:min-h-[300px] cursor-text`}
          onClick={handleContainerClick}
        >
          {/* Progress Bar */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-slate-700/30 rounded-t-2xl md:rounded-t-3xl overflow-hidden">
            <motion.div 
              className={`h-full ${currentTheme.accentBg}`}
              initial={{ width: 0 }}
              animate={{ width: `${(input.length / currentText.length) * 100}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>

          {/* Text Display - High Contrast */}
          <div className="relative mb-4">
            <p className={`${fontSize} md:text-3xl leading-relaxed md:leading-relaxed font-mono tracking-wide break-words`}>
              {currentText.split('').map((char, index) => (
                <span
                  key={index}
                  className={`inline-block transition-all duration-150 ${getCharClass(index)}`}
                >
                  {char === ' ' ? '\u00A0' : char}
                </span>
              ))}
            </p>
            
            {/* Blinking Cursor */}
            {!isFinished && (
              <motion.span
                animate={{ opacity: [1, 0] }}
                transition={{ duration: 0.8, repeat: Infinity }}
                className={`absolute h-6 md:h-8 w-0.5 ${currentTheme.cursor} top-1`}
                style={{ 
                  left: `${Math.min((input.length / currentText.length) * 100, 98)}%`,
                  transform: 'translateX(-50%)'
                }}
              />
            )}
          </div>

          {/* Hidden Input */}
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={handleInput}
            disabled={isFinished}
            className="absolute opacity-0 inset-0 w-full h-full cursor-text"
            autoFocus
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck="false"
          />

          {/* Focus Indicator - Fixed */}
          <AnimatePresence>
            {!isFocused && !isFinished && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className={`absolute inset-0 flex items-center justify-center ${currentTheme.surface} bg-opacity-95 backdrop-blur-sm rounded-2xl md:rounded-3xl`}
                onClick={handleContainerClick}
              >
                <div className="text-center p-6">
                  <div className={`inline-flex p-4 rounded-full ${currentTheme.accentLight} mb-4`}>
                    <Keyboard className={`w-8 h-8 ${currentTheme.accent}`} />
                  </div>
                  <p className={`text-lg font-semibold ${currentTheme.text} mb-2`}>Click here or press any key</p>
                  <p className={`text-sm ${currentTheme.textMuted}`}>to continue typing</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Mobile Keyboard Toggle */}
        <div className="md:hidden mt-4 flex justify-center">
          <button
            onClick={() => setShowKeyboard(!showKeyboard)}
            className={`flex items-center gap-2 px-4 py-2 rounded-full ${currentTheme.card} border ${currentTheme.border} ${currentTheme.text}`}
          >
            <Smartphone className="w-4 h-4" />
            <span className="text-sm">{showKeyboard ? 'Hide Keyboard Guide' : 'Show Keyboard Guide'}</span>
          </button>
        </div>

        {/* Virtual Keyboard - Responsive */}
        <AnimatePresence>
          {showKeyboard && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="mt-6 overflow-hidden"
            >
              <div className={`${currentTheme.card} border ${currentTheme.border} rounded-2xl p-4 md:p-6 ${currentTheme.shadow} shadow-lg`}>
                <div className="flex flex-col items-center gap-1.5 md:gap-2">
                  {[
                    ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
                    ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'],
                    ['z', 'x', 'c', 'v', 'b', 'n', 'm']
                  ].map((row, rowIndex) => (
                    <div key={rowIndex} className="flex gap-1 md:gap-1.5" style={{ marginLeft: rowIndex === 1 ? '12px' : rowIndex === 2 ? '24px' : '0' }}>
                      {row.map((key) => {
                        const isNext = input[input.length]?.toLowerCase() === key;
                        const isPressed = input[input.length - 1]?.toLowerCase() === key;
                        return (
                          <motion.div
                            key={key}
                            animate={{
                              scale: isPressed ? 0.9 : 1,
                              backgroundColor: isNext ? 'rgba(6, 182, 212, 0.3)' : 'rgba(255,255,255,0.05)',
                              borderColor: isNext ? 'rgba(6, 182, 212, 0.6)' : 'rgba(255,255,255,0.1)'
                            }}
                            className={`
                              w-7 h-9 md:w-10 md:h-12 rounded md:rounded-lg flex items-center justify-center text-xs md:text-sm font-bold border-2
                              ${theme === 'light' ? 'bg-white border-gray-200 text-gray-700' : 'text-white'}
                              ${isNext ? currentTheme.accent : ''}
                            `}
                          >
                            {key}
                          </motion.div>
                        );
                      })}
                    </div>
                  ))}
                  <div className="flex gap-1 md:gap-1.5 mt-1">
                    <motion.div
                      animate={{
                        backgroundColor: input[input.length] === ' ' ? 'rgba(6, 182, 212, 0.3)' : 'rgba(255,255,255,0.05)'
                      }}
                      className={`
                        w-32 h-9 md:w-48 md:h-12 rounded md:rounded-lg flex items-center justify-center text-xs font-bold border-2
                        ${theme === 'light' ? 'bg-white border-gray-200 text-gray-700' : 'text-white'}
                      `}
                    >
                      space
                    </motion.div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Controls */}
        <div className="mt-6 md:mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={initGame}
            disabled={isActive}
            className={`
              w-full sm:w-auto px-6 py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all
              ${isActive 
                ? 'opacity-50 cursor-not-allowed bg-gray-700 text-gray-400' 
                : `${currentTheme.accentBg} text-white hover:opacity-90 shadow-lg hover:shadow-xl`
              }
            `}
          >
            <RefreshCw className={`w-5 h-5 ${isActive ? '' : 'animate-spin-slow'}`} />
            {isActive ? 'Test in Progress...' : 'Restart Test'}
          </button>

          <div className={`flex items-center gap-2 px-4 py-2 rounded-xl ${currentTheme.card} border ${currentTheme.border}`}>
            <span className={`text-sm ${currentTheme.textMuted}`}>Theme:</span>
            <span className={`text-sm font-semibold ${currentTheme.accent}`}>{currentTheme.name}</span>
          </div>
        </div>
      </main>

      {/* Results Modal */}
      <AnimatePresence>
        {isFinished && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
            onClick={() => {}} // Prevent closing on background click
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className={`${currentTheme.card} border ${currentTheme.border} rounded-3xl p-6 md:p-8 max-w-md w-full ${currentTheme.shadow} shadow-2xl`}
            >
              <div className="text-center mb-6">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200 }}
                  className={`inline-flex p-4 rounded-full ${currentTheme.accentBg} mb-4 shadow-lg`}
                >
                  <Trophy className="w-10 h-10 text-white" />
                </motion.div>
                <h2 className={`text-2xl md:text-3xl font-bold ${currentTheme.text} mb-2`}>Test Complete!</h2>
                <p className={currentTheme.textMuted}>Here's how you performed</p>
              </div>

              <div className="grid grid-cols-2 gap-3 md:gap-4 mb-6">
                <div className={`p-4 rounded-2xl ${currentTheme.surface} border ${currentTheme.border}`}>
                  <div className={`text-3xl md:text-4xl font-bold ${currentTheme.accent} mb-1`}>{wpm}</div>
                  <div className={`text-xs ${currentTheme.textMuted} uppercase tracking-wider`}>WPM</div>
                </div>
                <div className={`p-4 rounded-2xl ${currentTheme.surface} border ${currentTheme.border}`}>
                  <div className={`text-3xl md:text-4xl font-bold ${currentTheme.accent} mb-1`}>{accuracy}%</div>
                  <div className={`text-xs ${currentTheme.textMuted} uppercase tracking-wider`}>Accuracy</div>
                </div>
              </div>

              {wpm >= highScore && highScore > 0 && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className={`mb-6 p-3 rounded-xl ${currentTheme.accentLight} border ${currentTheme.border} flex items-center justify-center gap-2`}
                >
                  <Star className={`w-5 h-5 ${currentTheme.accent} fill-current`} />
                  <span className={`font-bold ${currentTheme.accent}`}>New High Score!</span>
                  <Star className={`w-5 h-5 ${currentTheme.accent} fill-current`} />
                </motion.div>
              )}

              <button
                onClick={initGame}
                className={`
                  w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-all
                  ${currentTheme.accentBg} text-white hover:opacity-90 shadow-lg hover:shadow-xl
                `}
              >
                <RefreshCw className="w-5 h-5" />
                Try Again
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}