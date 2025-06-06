import './App.css';
import logo from './assets/img/memoflux_logo.png';
import { useState, useEffect } from 'react';
import { Plus, X, Home, Link, MoreHorizontal, CheckSquare, Menu, ChevronLeft, ChevronRight, Sun, Moon, Settings} from 'lucide-react';

function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [isDark, setIsDark] = useState(true);
  const [currentView, setCurrentView] = useState('MemoFlux');
  const [linkGroups, setLinkGroups] = useState({
    'links': []
  });
  const [showAddLinkModal, setShowAddLinkModal] = useState(false);
  const [showAddGroupModal, setShowAddGroupModal] = useState(false);
  const [newLink, setNewLink] = useState({ name: '', url: '', group: 'links' });
  const [newGroupName, setNewGroupName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [sidebarMinimized, setSidebarMinimized] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showEditLinkModal, setShowEditLinkModal] = useState(false);
  const [editingLink, setEditingLink] = useState(null);
  const [homeLinks, setHomeLinks] = useState([]); // Separate array for home page links

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  const toggleTheme = () => {
    setIsDark(!isDark);
  };

  const getFavicon = (url) => {
    try {
      const domain = new URL(url).hostname;
      const faviconUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
      // Check if it's the default Google favicon URL pattern that indicates no favicon
      if (faviconUrl === 'https://www.google.com/s2/favicons?domain=as&sz=32') {
        return null;
      }
      return faviconUrl;
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

  const addHomeLink = () => {
    if (newLink.name && newLink.url) {
      const fullUrl = newLink.url.startsWith('http') ? newLink.url : `https://${newLink.url}`;
      setHomeLinks(prev => [...prev, {
        id: Date.now(),
        name: newLink.name,
        url: fullUrl,
        favicon: getFavicon(fullUrl)
      }]);
      setNewLink({ name: '', url: '', group: 'links' });
      setShowAddLinkModal(false);
    }
  };

  const editLink = (link, isHome = false) => {
    setEditingLink({ ...link, isHome });
    setNewLink({ name: link.name, url: link.url, group: 'links' });
    setShowEditLinkModal(true);
  };

  const updateLink = () => {
    if (newLink.name && newLink.url && editingLink) {
      const fullUrl = newLink.url.startsWith('http') ? newLink.url : `https://${newLink.url}`;
      const updatedLink = {
        ...editingLink,
        name: newLink.name,
        url: fullUrl,
        favicon: getFavicon(fullUrl)
      };

      if (editingLink.isHome) {
        setHomeLinks(prev => prev.map(link => 
          link.id === editingLink.id ? updatedLink : link
        ));
      } else {
        setLinkGroups(prev => ({
          ...prev,
          [editingLink.group]: prev[editingLink.group].map(link => 
            link.id === editingLink.id ? updatedLink : link
          )
        }));
      }

      setNewLink({ name: '', url: '', group: 'links' });
      setShowEditLinkModal(false);
      setEditingLink(null);
    }
  };

  const removeHomeLink = (linkId) => {
    setHomeLinks(prev => prev.filter(link => link.id !== linkId));
  };

  const handleGoogleSearch = () => {
    if (searchQuery.trim()) {
      window.open(`https://www.google.com/search?q=${encodeURIComponent(searchQuery)}`, '_blank');
      setSearchQuery('');
    }
  };

  const handleNavClick = (view) => {
    setCurrentView(view);
    setMobileMenuOpen(false);
  };

  const removeLink = (groupName, linkId) => {
    setLinkGroups(prev => ({
      ...prev,
      [groupName]: prev[groupName].filter(link => link.id !== linkId)
    }));
  };

  const removeCurrentLink = () => {
    if (editingLink) {
      if (editingLink.isHome) {
        setHomeLinks(prev => prev.filter(link => link.id !== editingLink.id));
      } else {
        setLinkGroups(prev => ({
          ...prev,
          [editingLink.group]: prev[editingLink.group].filter(link => link.id !== editingLink.id)
        }));
      }
      
      setNewLink({ name: '', url: '', group: 'links' });
      setShowEditLinkModal(false);
      setEditingLink(null);
    }
  };


  if (isLoading) {
    return (
      <div className={`loading-screen ${isDark ? 'dark' : 'light'}`}>
          <div className="loading-logo glow-text">MemoFlux</div>
      </div>
    );
  }

  return (
    <div className={`App ${isDark ? 'dark' : 'light'}`}>
      <div className="bg_effect"></div>
      
      {/* Mobile Menu Button */}
      <button 
        className="mobile-menu-btn"
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
      >
        <Menu size={20} />
      </button>
      
      {/* Sidebar */}
      <div className={`sidebar ${sidebarMinimized ? 'minimized' : ''} ${mobileMenuOpen ? 'mobile-open' : ''}`}>
        <div className="sidebar-header">
          <div className="logo">
            {!sidebarMinimized && <span>HELLOWORLD</span>}
          </div>
          <button 
            className="minimize-btn desktop-only"
            onClick={() => setSidebarMinimized(!sidebarMinimized)}
          >
            {sidebarMinimized ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
          <button 
            className="close-btn mobile-only"
            onClick={() => setMobileMenuOpen(false)}
          >
            <X size={16} />
          </button>
        </div>
        
        <nav className="sidebar-nav">
          <div 
            className={`nav-item ${currentView === 'MemoFlux' ? 'active' : ''}`} 
            onClick={() => handleNavClick('MemoFlux')}
          >
            <Home size={16} />
            {!sidebarMinimized && <span>Home</span>}
          </div>
          
          <div 
            className={`nav-item ${currentView === 'links' ? 'active' : ''}`} 
            onClick={() => handleNavClick('links')}
          >
            <Link size={16} />
            {!sidebarMinimized && <span>links</span>}
          </div>
          
          {Object.keys(linkGroups).filter(group => group !== 'links').map(group => (
            <div 
              key={group} 
              className={`nav-item ${currentView === group ? 'active' : ''}`} 
              onClick={() => handleNavClick(group)}
            >
              <MoreHorizontal size={16} />
              {!sidebarMinimized && <span>{group}</span>}
            </div>
          ))}
          
          <div 
            className="nav-item" 
            onClick={() => setShowAddGroupModal(true)}
          >
            <Plus size={16} />
            {!sidebarMinimized && <span>add group</span>}
          </div>
          
          <div 
            className={`nav-item ${currentView === 'todo' ? 'active' : ''}`} 
            onClick={() => handleNavClick('todo')}
          >
            <CheckSquare size={16} />
            {!sidebarMinimized && <span>todo</span>}
          </div>
          <div 
            onClick={toggleTheme}
            className={`nav-item dl-toggle ${isDark ? 'dark' : 'light'}`}
          >
            {isDark ? <Sun size={16} /> : <Moon size={16} />}
            {!sidebarMinimized && <span>{isDark ? 'Light' : 'Dark'}</span>}
          </div>
        </nav>
      </div>
      
      {/* Mobile Overlay */}
      {mobileMenuOpen && <div className="mobile-overlay" onClick={() => setMobileMenuOpen(false)}></div>}
      
      <div className={`wrapper ${sidebarMinimized ? 'sidebar-minimized' : ''}`}>
        
      {/* Main Header */}
      <div className="main-header">
        <div className="header-content">
          {currentView === 'MemoFlux' && <img src={logo} alt='MemoFlux' className="header-logo" />}
          <h1>{currentView}</h1>
        </div>
      </div>

        {/* Main Content Container */}
        <div className="main-content">
          {currentView === 'MemoFlux' && (
            <div className="home-view">
              <div className="search-section">
                <div className="search-bar">
                  <button onClick={handleGoogleSearch}>
                    <img src="https://static.dezeen.com/uploads/2025/05/sq-google-g-logo-update_dezeen_2364_col_0.jpg" alt="" />
                  </button>
                  <input
                    type="text"
                    placeholder="Search with Google or enter address"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleGoogleSearch()}
                  />
                </div>
              </div>
              
              <div className="quick-links">
                <div className="lh-grid">
                  <div className="links-grid home-grid">
                    {homeLinks.map((link) => (
                      <div key={link.id} className="link-item">
                        <button className="edit-btn" onClick={() => editLink(link, true)}>
                          <Settings size={8} />
                        </button>
                        {/* <button className="remove-btn" onClick={() => removeHomeLink(link.id)}>
                          <X size={9} />
                        </button> */}
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
                    
                    {/* Fill remaining slots up to 4 rows (16 items) */}
                    {Array.from({ length: Math.max(0, 40 - homeLinks.length) }, (_, index) => (
                      <div key={`empty-${index}`} className="link-item add-link" onClick={() => {
                        setNewLink({ name: '', url: '', group: 'home' });
                        setShowAddLinkModal(true);
                      }}>
                        <div className="link-icon">
                          <Plus size={16} />
                        </div>
                        <span className="link-name">add link</span>
                      </div>
                    ))}
                    
                    {/* Show additional "add more" if all 16 slots are filled */}
                    {homeLinks.length >= 40 && (
                      <div className="link-item add-link" onClick={() => {
                        setNewLink({ name: '', url: '', group: 'home' });
                        setShowAddLinkModal(true);
                      }}>
                        <div className="link-icon">
                          <Plus size={16} />
                        </div>
                        <span className="link-name">add more</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {currentView !== 'MemoFlux' && currentView !== 'todo' && (
            <div className="links-view">
              {/* <div className="section-header">
                <h2>{currentView}</h2>
                <button className="add-btn" onClick={() => {
                  setNewLink({ ...newLink, group: currentView });
                  setShowAddLinkModal(true);
                }}>
                  <Plus size={16} /> add link
                </button>
              </div> */}
              
              <div className="links-grid">
                {(linkGroups[currentView] || []).map((link) => (
                  <div key={link.id} className="link-item">
                    <button className="edit-btn" onClick={() => editLink({...link, group: currentView})}>
                      <Settings size={8} />
                    </button>
                    {/* <button className="remove-btn" onClick={() => removeLink(currentView, link.id)}>
                      <X size={12} />
                    </button> */}
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
              {/* <select
                value={newLink.group}
                onChange={(e) => setNewLink({ ...newLink, group: e.target.value })}
              >
                {Object.keys(linkGroups).map(group => (
                  <option key={group} value={group}>{group}</option>
                ))}
              </select> */}
              <button className="submit-btn" onClick={newLink.group === 'home' ? addHomeLink : addLink}>
                add link
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Group Modal */}
      {/* Edit Link Modal */}
      {showEditLinkModal && (
        <div className="modal-overlay" onClick={() => setShowEditLinkModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>edit link</h3>
              <button onClick={() => setShowEditLinkModal(false)}>
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
              <div className="modal-actions">
                <button className="remove-btn-modal" onClick={removeCurrentLink}>
                  Delete
                </button>
                <button className="submit-btn" onClick={updateLink}>
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;