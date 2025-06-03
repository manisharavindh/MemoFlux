import './App.css';
import { useState } from 'react';

function App() {
  const [isDark, setIsDark] = useState(true);

  const toggleTheme = () => {
    setIsDark(!isDark);
  };

  return (
    <div className={`App ${isDark ? 'dark' : 'light'}`}>
      <div className="bg_effect"></div>
      <div className="wrapper">
        <button
          onClick={toggleTheme}
          className={`toggle-button ${isDark ? 'dark' : 'light'}`}
        >
        </button>
        <h1>Initializing MemoFlux</h1>
      </div>
    </div>
  );
}

export default App;