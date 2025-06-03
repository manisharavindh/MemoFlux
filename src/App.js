import './App.css';
import { useState, useEffect } from 'react';

function App() {
  const [isDark, setIsDark] = useState(() => {
    const savedTheme = localStorage.getItem('isDark');
    return savedTheme !== null ? JSON.parse(savedTheme) : true;
  });

  const toggleTheme = () => {
    setIsDark(!isDark);
  };

  useEffect(() => {
    localStorage.setItem('isDark', JSON.stringify(isDark));
  }, [isDark]);

  return (
    <div className={`App ${isDark ? 'dark' : 'light'}`}>
      <div className="bg_effect"></div>
      <div className="wrapper">
        <button
          onClick={toggleTheme}
          className={`toggle-button ${isDark ? 'dark' : 'light'}`}
        >
        </button>
        <div className="nav">
          <div className='title'>[<span className='logo'>memoflux</span>]{/*  <span className='links'>[Links]</span>*/}[<span className='todo'>todo</span>]</div>
        </div>
        <div className="content">
          <p>Links will be implemented here</p>
        </div>
      </div>
    </div>
  );
}

export default App;