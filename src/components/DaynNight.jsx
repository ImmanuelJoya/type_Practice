//create a butten to switch between day and night mode
import React, { useState, useEffect } from "react";
import { BsFillMoonStarsFill } from "react-icons/bs";
import { BsFillSunFill } from "react-icons/bs";

const DaynNight = () => {
  const [theme, setTheme] = useState(localStorage.getItem("theme") || "light");

  useEffect(() => {
    // Update localStorage
    localStorage.setItem("theme", theme);
    
    // Update document class
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
      document.body.style.backgroundImage = "linear-gradient(-20deg, #1a1c3d 0%, #2d1b36 100%)";
    } else {
      document.documentElement.classList.remove("dark");
      document.body.style.backgroundImage = "linear-gradient(-20deg, #2b5876 0%, #4e4376 100%)";
    }
  }, [theme]);

  const handleThemeSwitch = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  return (
    <div className="fixed top-5 right-5 z-50">
      <button
        className="bg-white/10 backdrop-blur-sm dark:bg-gray-800/10 rounded-lg p-2 hover:bg-white/20 dark:hover:bg-gray-700/20 transition-colors"
        onClick={handleThemeSwitch}
        aria-label="Toggle dark mode"
      >
        {theme === "dark" ? (
          <BsFillSunFill className="text-yellow-400 text-xl" />
        ) : (
          <BsFillMoonStarsFill className="text-white text-xl" />
        )}
      </button>
    </div>
  );
};

export default DaynNight;
