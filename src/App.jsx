import { useState, useEffect } from 'react'
import './App.css'
import DaynNight from './components/DaynNight';
import { BiRefresh } from 'react-icons/bi'; // Import refresh icon

function App() {
  const [text, setText] = useState('');
  const [userInput, setUserInput] = useState('');
  const [startTime, setStartTime] = useState(null);
  const [wpm, setWpm] = useState(0);
  const [accuracy, setAccuracy] = useState(100);

  // Array of sample texts
  const sampleTexts = [
    "The quick brown fox jumps over the lazy dog. This pangram contains every letter of the English alphabet at least once.",
    "To be, or not to be, that is the question. Whether 'tis nobler in the mind to suffer the slings and arrows of outrageous fortune.",
    "In three words I can sum up everything I've learned about life: it goes on. - Robert Frost",
    "Success is not final, failure is not fatal: it is the courage to continue that counts. - Winston Churchill"
  ];

  // Function to get random text
  const getRandomText = () => {
    return sampleTexts[Math.floor(Math.random() * sampleTexts.length)];
  };

  // Function to reset everything
  const handleRefresh = () => {
    setText(getRandomText());
    setUserInput('');
    setStartTime(null);
    setWpm(0);
    setAccuracy(100);
  };

  useEffect(() => {
    setText(getRandomText());
  }, []);

  const handleInput = (e) => {
    const value = e.target.value;
    
    if (!startTime && value.length === 1) {
      setStartTime(new Date());
    }

    setUserInput(value);

    // Calculate accuracy
    let correct = 0;
    const textToCompare = text.substring(0, value.length);
    for (let i = 0; i < value.length; i++) {
      if (value[i] === textToCompare[i]) {
        correct++;
      }
    }
    const accuracyValue = (correct / value.length) * 100;
    setAccuracy(Math.round(accuracyValue));

    // Calculate WPM
    if (startTime) {
      const timeElapsed = (new Date() - startTime) / 1000 / 60; // in minutes
      const wordsTyped = value.length / 5; // assuming average word length of 5 characters
      const currentWpm = Math.round(wordsTyped / timeElapsed);
      setWpm(currentWpm);
    }

    // Check if completed
    if (value === text) {
      console.log('Completed!');
    }
  };

  return (
    <div className="min-h-screen transition-all duration-500">
      <DaynNight />
      <div className="py-8 px-4">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl font-bold text-center text-white mb-8">
            Typing Practice
          </h1>
          
          <div className="bg-white/10 backdrop-blur-md dark:bg-gray-800/10 rounded-lg shadow-lg p-6 mb-6 transition-all">
            <div className="flex justify-between items-center mb-4">
              <div className="flex gap-4">
                <div className="text-lg text-white">
                  <span className="font-semibold">WPM:</span> {wpm}
                </div>
                <div className="text-lg text-white">
                  <span className="font-semibold">Accuracy:</span> {accuracy}%
                </div>
              </div>
              <button
                onClick={handleRefresh}
                className="p-2 rounded-full hover:bg-white/10 transition-all text-white"
                aria-label="Refresh text"
              >
                <BiRefresh className="text-2xl" />
              </button>
            </div>

            <div className="mb-4 p-4 bg-white/5 dark:bg-gray-700/5 rounded typing-text text-white transition-all">
              {text.split('').map((char, index) => {
                let className = '';
                if (index < userInput.length) {
                  className = userInput[index] === char ? 'correct' : 'incorrect';
                } else if (index === userInput.length) {
                  className = 'current';
                }
                return (
                  <span key={index} className={className}>
                    {char}
                  </span>
                );
              })}
            </div>

            <textarea
              className="w-full p-4 border-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/50 typing-text bg-white/5 dark:bg-gray-700/5 text-white placeholder-white/50 transition-all"
              value={userInput}
              onChange={handleInput}
              rows="3"
              placeholder="Start typing here..."
            />
          </div>
        </div>
      </div>
    </div>
  )
}

export default App
