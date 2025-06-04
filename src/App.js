import './App.css';
import { useState, useEffect } from 'react';
import { Plus, Search, X, Home, Link, MoreHorizontal, CheckSquare } from 'lucide-react';

function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [isDark, setIsDark] = useState(() => {
    const savedTheme = localStorage?.getItem('isDark');
    return savedTheme !== null ? JSON.parse(savedTheme) : true;
  });
  
  const [currentView, setCurrentView] = useState('home');
  const [linkGroups, setLinkGroups] = useState({
    'links': []
  });
  const [showAddLinkModal, setShowAddLinkModal] = useState(false);
  const [showAddGroupModal, setShowAddGroupModal] = useState(false);
  const [newLink, setNewLink] = useState({ name: '', url: '', group: 'links' });
  const [newGroupName, setNewGroupName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('isDark', JSON.stringify(isDark));
    }
  }, [isDark]);

  const toggleTheme = () => {
    setIsDark(!isDark);
  };

  const getFavicon = (url) => {
    try {
      const domain = new URL(url).hostname;
      return `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
    } catch {
      return null;
    }
  };

  const getInitial = (name) => {
    return name.charAt(0).toUpperCase();
  };

  const addLink = () => {
    if (newLink.name && newLink.url) {
      setLinkGroups(prev => ({
        ...prev,
        [newLink.group]: [...(prev[newLink.group] || []), {
          id: Date.now(),
          name: newLink.name,
          url: newLink.url.startsWith('http') ? newLink.url : `https://${newLink.url}`,
          favicon: getFavicon(newLink.url.startsWith('http') ? newLink.url : `https://${newLink.url}`)
        }]
      }));
      setNewLink({ name: '', url: '', group: 'links' });
      setShowAddLinkModal(false);
    }
  };

  const addGroup = () => {
    if (newGroupName && !linkGroups[newGroupName.toLowerCase()]) {
      setLinkGroups(prev => ({
        ...prev,
        [newGroupName.toLowerCase()]: []
      }));
      setNewGroupName('');
      setShowAddGroupModal(false);
    }
  };

  const handleGoogleSearch = () => {
    if (searchQuery.trim()) {
      window.open(`https://www.google.com/search?q=${encodeURIComponent(searchQuery)}`, '_blank');
      setSearchQuery('');
    }
  };

  const removeLink = (groupName, linkId) => {
    setLinkGroups(prev => ({
      ...prev,
      [groupName]: prev[groupName].filter(link => link.id !== linkId)
    }));
  };

  if (isLoading) {
    return (
      <div className={`loading-screen ${isDark ? 'dark' : 'light'}`}>
        <div className="loading-content">
          <div className="loading-logo">memoflux</div>
          <div className="loading-spinner"></div>
        </div>
      </div>
    );
  }

  return (
    <div className={`App ${isDark ? 'dark' : 'light'}`}>
      <div className="bg_effect"></div>
      <div className="wrapper">
        <button
          onClick={toggleTheme}
          className={`toggle-button ${isDark ? 'dark' : 'light'}`}
        ></button>
        
        {/* Navigation */}
        <div className="nav">
          <div className='title'>
            [<span className='logo' onClick={() => setCurrentView('home')}>memoflux</span>]
            [<span className={`nav-item ${currentView === 'home' ? 'active' : ''}`} onClick={() => setCurrentView('home')}>
              <Home size={16} style={{ display: 'inline', marginRight: '4px' }} />home
            </span>]
            [<span className={`nav-item ${currentView === 'links' ? 'active' : ''}`} onClick={() => setCurrentView('links')}>
              <Link size={16} style={{ display: 'inline', marginRight: '4px' }} />links
            </span>]
            {Object.keys(linkGroups).filter(group => group !== 'links').map(group => (
              <span key={group} className={`nav-item ${currentView === group ? 'active' : ''}`} onClick={() => setCurrentView(group)}>
                [{group}]
              </span>
            ))}
            [<span className='nav-item' onClick={() => setShowAddGroupModal(true)}>
              <MoreHorizontal size={16} style={{ display: 'inline', marginRight: '4px' }} />more
            </span>]
            [<span className={`nav-item ${currentView === 'todo' ? 'active' : ''}`} onClick={() => setCurrentView('todo')}>
              <CheckSquare size={16} style={{ display: 'inline', marginRight: '4px' }} />todo
            </span>]
          </div>
        </div>

        {/* Content */}
        <div className="content">
          {currentView === 'home' && (
            <div className="home-view">
              <div className="search-section">
                <div className="search-bar">
                  <input
                    type="text"
                    placeholder="search google..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleGoogleSearch()}
                  />
                  <button onClick={handleGoogleSearch}>
                    <Search size={16} />
                  </button>
                </div>
              </div>
              
              <div className="quick-links">
                <h3>quick links</h3>
                <div className="links-grid home-grid">
                  {Object.values(linkGroups).flat().slice(0, 14).map((link, index) => (
                    <div key={link.id} className="link-item" onClick={() => window.open(link.url, '_blank')}>
                      <div className="link-icon">
                        {link.favicon ? (
                          <img src={link.favicon} alt="" onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'flex';
                          }} />
                        ) : null}
                        <div className="link-initial" style={{ display: link.favicon ? 'none' : 'flex' }}>
                          {getInitial(link.name)}
                        </div>
                      </div>
                      <span className="link-name">{link.name}</span>
                    </div>
                  ))}
                  
                  {/* Fill remaining slots with add buttons */}
                  {Array.from({ length: Math.max(0, 14 - Object.values(linkGroups).flat().length) }).map((_, index) => (
                    <div key={`empty-${index}`} className="link-item add-link" onClick={() => setShowAddLinkModal(true)}>
                      <div className="link-icon">
                        <Plus size={16} />
                      </div>
                      <span className="link-name">add link</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {currentView !== 'home' && currentView !== 'todo' && (
            <div className="links-view">
              <div className="section-header">
                <h2>{currentView}</h2>
                <button className="add-btn" onClick={() => {
                  setNewLink({ ...newLink, group: currentView });
                  setShowAddLinkModal(true);
                }}>
                  <Plus size={16} /> add link
                </button>
              </div>
              
              <div className="links-grid">
                {(linkGroups[currentView] || []).map((link) => (
                  <div key={link.id} className="link-item">
                    <button className="remove-btn" onClick={() => removeLink(currentView, link.id)}>
                      <X size={12} />
                    </button>
                    <div className="link-content" onClick={() => window.open(link.url, '_blank')}>
                      <div className="link-icon">
                        {link.favicon ? (
                          <img src={link.favicon} alt="" onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'flex';
                          }} />
                        ) : null}
                        <div className="link-initial" style={{ display: link.favicon ? 'none' : 'flex' }}>
                          {getInitial(link.name)}
                        </div>
                      </div>
                      <span className="link-name">{link.name}</span>
                    </div>
                  </div>
                ))}
                
                <div className="link-item add-link" onClick={() => {
                  setNewLink({ ...newLink, group: currentView });
                  setShowAddLinkModal(true);
                }}>
                  <div className="link-icon">
                    <Plus size={16} />
                  </div>
                  <span className="link-name">add link</span>
                </div>
              </div>
            </div>
          )}

          {currentView === 'todo' && (
            <div className="todo-view">
              <h2>todo</h2>
              <p>todo functionality coming soon...</p>
            </div>
          )}
        </div>
      </div>

      {/* Add Link Modal */}
      {showAddLinkModal && (
        <div className="modal-overlay" onClick={() => setShowAddLinkModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>add new link</h3>
              <button onClick={() => setShowAddLinkModal(false)}>
                <X size={16} />
              </button>
            </div>
            <div className="modal-body">
              <input
                type="text"
                placeholder="link name"
                value={newLink.name}
                onChange={(e) => setNewLink({ ...newLink, name: e.target.value })}
              />
              <input
                type="text"
                placeholder="url (with or without https://)"
                value={newLink.url}
                onChange={(e) => setNewLink({ ...newLink, url: e.target.value })}
              />
              <select
                value={newLink.group}
                onChange={(e) => setNewLink({ ...newLink, group: e.target.value })}
              >
                {Object.keys(linkGroups).map(group => (
                  <option key={group} value={group}>{group}</option>
                ))}
              </select>
              <button className="submit-btn" onClick={addLink}>
                add link
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Group Modal */}
      {showAddGroupModal && (
        <div className="modal-overlay" onClick={() => setShowAddGroupModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>add new group</h3>
              <button onClick={() => setShowAddGroupModal(false)}>
                <X size={16} />
              </button>
            </div>
            <div className="modal-body">
              <input
                type="text"
                placeholder="group name"
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
              />
              <button className="submit-btn" onClick={addGroup}>
                add group
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;