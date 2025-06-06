import './App.css';
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Plus, X, Home, Link, CheckSquare, Menu, Sun, Moon, Settings } from 'lucide-react';
import logo from './assets/img/memoflux_logo.png';

function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [isDark, setIsDark] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 600);
  const [currentView, setCurrentView] = useState('MemoFlux'); 
  const [linkGroups, setLinkGroups] = useState({ 'links': [] });
  const [showAddLinkModal, setShowAddLinkModal] = useState(false);
  const [showAddGroupModal, setShowAddGroupModal] = useState(false);
  const [newLink, setNewLink] = useState({ name: '', url: '', group: 'links' });
  const [newGroupName, setNewGroupName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [sidebarMinimized, setSidebarMinimized] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showEditLinkModal, setShowEditLinkModal] = useState(false);
  const [editingLink, setEditingLink] = useState(null);
  const [homeLinks, setHomeLinks] = useState([]);

  // Loading screen effect
  useEffect(() => {
    let minLoadingTimer;
    let assetsLoaded = false;
    let minTimeElapsed = false;

    const checkAndSetLoading = () => {
      if (assetsLoaded && minTimeElapsed) {
        setIsLoading(false);
      }
    };

    minLoadingTimer = setTimeout(() => {
      minTimeElapsed = true;
      checkAndSetLoading();
    }, 2000);

    Promise.all([
      ...Array.from(document.images).map(img => {
        return new Promise(resolve => {
          if (img.complete) resolve();
          img.onload = resolve;
          img.onerror = resolve;
        });
      }),
      document.fonts.ready
    ]).then(() => {
      assetsLoaded = true;
      checkAndSetLoading();
    });

    return () => clearTimeout(minLoadingTimer);
  }, []);

  const toggleTheme = useCallback(() => {
    setIsDark(prev => !prev);
  }, []);

  // Memoize favicon function to prevent recreating it on every render
  const getFavicon = useCallback((url) => {
    try {
      const domain = new URL(url).hostname;
      const faviconUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
      
      // Return null if the URL is not valid or domain is empty
      if (!domain) {
        return null;
      }

      return new Promise((resolve) => {
        const img = new Image();
        img.onload = function() {
          // Check if the image is the default favicon by comparing dimensions
          // Google's default favicon is typically 16x16
          if (this.width === 16 && this.height === 16) {
            resolve(null);
          } else {
            resolve(faviconUrl);
          }
        };
        img.onerror = () => resolve(null);
        img.src = faviconUrl;
      });
    } catch {
      return null;
    }
  }, []);

  const getInitial = useCallback((name) => {
    return name.charAt(0).toUpperCase();
  }, []);

  const addLink = useCallback(() => {
    if (newLink.name && newLink.url) {
      const fullUrl = newLink.url.startsWith('http') ? newLink.url : `https://${newLink.url}`;
      
      // Make getFavicon async
      getFavicon(fullUrl).then(faviconUrl => {
        setLinkGroups(prev => ({
          ...prev,
          [newLink.group]: [...(prev[newLink.group] || []), {
            id: Date.now(),
            name: newLink.name,
            url: fullUrl,
            favicon: faviconUrl
          }]
        }));
      });
      
      setNewLink({ name: '', url: '', group: 'links' });
      setShowAddLinkModal(false);
    }
  }, [newLink, getFavicon]);

  const addGroup = useCallback(() => {
    const trimmedName = newGroupName.trim();
    const lowercaseName = trimmedName.toLowerCase();
    
    if (trimmedName && !linkGroups[lowercaseName]) {
      setLinkGroups(prev => ({
        ...prev,
        [lowercaseName]: []
      }));
      setNewGroupName('');
      setShowAddGroupModal(false);
    }
  }, [newGroupName, linkGroups]);

  const addHomeLink = useCallback(() => {
    if (newLink.name && newLink.url) {
      const fullUrl = newLink.url.startsWith('http') ? newLink.url : `https://${newLink.url}`;
      
      // Make getFavicon async
      getFavicon(fullUrl).then(faviconUrl => {
        setHomeLinks(prev => [...prev, {
          id: Date.now(),
          name: newLink.name,
          url: fullUrl,
          favicon: faviconUrl
        }]);
      });
      
      setNewLink({ name: '', url: '', group: 'links' });
      setShowAddLinkModal(false);
    }
  }, [newLink, getFavicon]);

  const editLink = useCallback((link, isHome = false) => {
    setEditingLink({ ...link, isHome });
    setNewLink({ name: link.name, url: link.url, group: 'links' });
    setShowEditLinkModal(true);
  }, []);

  const updateLink = useCallback(() => {
    if (newLink.name && newLink.url && editingLink) {
      const fullUrl = newLink.url.startsWith('http') ? newLink.url : `https://${newLink.url}`;
      
      // Make getFavicon async
      getFavicon(fullUrl).then(faviconUrl => {
        const updatedLink = {
          ...editingLink,
          name: newLink.name,
          url: fullUrl,
          favicon: faviconUrl
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
      });
    }
  }, [newLink, editingLink, getFavicon]);

  const handleGoogleSearch = useCallback(() => {
    if (searchQuery.trim()) {
      window.open(`https://www.google.com/search?q=${encodeURIComponent(searchQuery)}`, '_blank');
      setSearchQuery('');
    }
  }, [searchQuery]);

  const handleNavClick = useCallback((view) => {
    setCurrentView(view);
    setMobileMenuOpen(false);
  }, []);

  const removeCurrentLink = useCallback(() => {
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
  }, [editingLink]);

  // Memoize filtered link groups to prevent recalculation
  const filteredLinkGroups = useMemo(() => 
    Object.keys(linkGroups).filter(group => group !== 'links'),
    [linkGroups]
  );

  // Memoize empty slots calculation
  const emptySlots = useMemo(() => 
    Math.max(0, isMobile ? 16 - homeLinks.length : 40 - homeLinks.length),
    [homeLinks.length, isMobile]
  );

  // Memoize current group links
  const currentGroupLinks = useMemo(() => 
    linkGroups[currentView] || [],
    [linkGroups, currentView]
  );

  // Escape key handler for modals
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        if (showAddLinkModal) setShowAddLinkModal(false);
        if (showAddGroupModal) setShowAddGroupModal(false);
        if (showEditLinkModal) setShowEditLinkModal(false);
      }
    };
    
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [showAddLinkModal, showAddGroupModal, showEditLinkModal]);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 600);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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
      
      <div className={`sidebar ${sidebarMinimized ? 'minimized' : ''} ${mobileMenuOpen ? 'mobile-open' : ''}`}>
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
          
          {filteredLinkGroups.map(group => (
            <div 
              key={group} 
              className={`nav-item ${currentView === group ? 'active' : ''}`} 
              onClick={() => handleNavClick(group)}
            >
              <Link size={16} />
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
      
      <div className={`wrapper ${sidebarMinimized ? 'sidebar-minimized' : ''} ${mobileMenuOpen ? 'mobile-menu-open' : ''}`}>
        <button 
          className="minimize-btn"
          onClick={() => {
            if (isMobile) {
              setMobileMenuOpen(!mobileMenuOpen);
              setSidebarMinimized(false);
            } else {
              setSidebarMinimized(!sidebarMinimized);
            }
          }}
        >
          {isMobile ? (mobileMenuOpen ? <X size={20} /> : <Menu size={20} />) : (!sidebarMinimized ? <X size={20} /> : <Menu size={20} />)}
        </button>
        
        <div className="main-header">
          <div className="header-content">
            {currentView === 'MemoFlux' && <img src={logo} alt='MemoFlux' className="header-logo" />}
            <h1>{currentView}</h1>
          </div>
        </div>

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
                    onKeyDown={(e) => e.key === 'Enter' && handleGoogleSearch()}
                  />
                </div>
              </div>
              
              <div className="quick-links">
                <div className="lh-grid">
                  <div className="links-grid home-grid">
                    {(isMobile ? homeLinks.slice(0, 16) : homeLinks).map((link) => (
                      <LinkItem 
                        key={link.id}
                        link={link}
                        isHome={true}
                        onEdit={() => editLink(link, true)}
                        getInitial={getInitial}
                      />
                    ))}
                    
                    {/* Fill remaining slots up to 40 items or 16 on mobile */}
                    {Array.from({ length: window.innerWidth <= 600 ? Math.max(0, 16 - homeLinks.length) : emptySlots }, (_, index) => (
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
                    
                    {/* Show additional "add more" if all 40 slots are filled */}
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
              <div className="links-grid">
                {currentGroupLinks.map((link) => (
                  <LinkItem 
                    key={link.id}
                    link={link}
                    isHome={false}
                    onEdit={() => editLink({...link, group: currentView})}
                    getInitial={getInitial}
                  />
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
              <h3>Add link</h3>
            </div>
            <div className="modal-body">
              <h4>Title</h4>
              <input
                type="text"
                placeholder="Enter a title"
                value={newLink.name}
                onChange={(e) => setNewLink({ ...newLink, name: e.target.value })}
              />
              <h4>URL</h4>
              <input
                type="text"
                placeholder="Type or paste a URL"
                value={newLink.url}
                onChange={(e) => setNewLink({ ...newLink, url: e.target.value })}
              />
              <div className="modal-actions">
                <button className="remove-btn-modal modal-cancel" onClick={() => setShowAddLinkModal(false)}>
                  Cancel
                </button>
                <button className="submit-btn" onClick={newLink.group === 'home' ? addHomeLink : addLink}>
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Link Modal */}
      {showEditLinkModal && (
        <div className="modal-overlay" onClick={() => setShowEditLinkModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Edit Link</h3>
            </div>
            <div className="modal-body">
              <h4>Title</h4>
              <input
                type="text"
                placeholder="link name"
                value={newLink.name}
                onChange={(e) => setNewLink({ ...newLink, name: e.target.value })}
              />
              <h4>URL</h4>
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
                <button className="remove-btn-modal modal-cancel" onClick={() => setShowEditLinkModal(false)}>
                  Cancel
                </button>
                <button className="submit-btn" onClick={updateLink}>
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Group Modal */}
      {showAddGroupModal && (
        <div className="modal-overlay" onClick={() => setShowAddGroupModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Add New Group</h3>
            </div>
            <div className="modal-body">
              <h4>Name</h4>
              <input
                type="text"
                placeholder="Enter a name"
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                autoFocus
                onKeyDown={(e) => e.key === 'Enter' && addGroup()}
              />
              <div className="modal-actions">
                <button className="remove-btn-modal modal-cancel" onClick={() => setShowAddGroupModal(false)}>
                  Cancel
                </button>
                <button 
                    className="submit-btn" 
                    onClick={addGroup}
                    disabled={!newGroupName.trim()}
                  >
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

// Memoized LinkItem component to prevent unnecessary re-renders
const LinkItem = React.memo(({ link, isHome, onEdit, getInitial }) => {
  const [initialBgColor] = React.useState(() => {
    const colors = [
      'var(--initial-color-1)',
      'var(--initial-color-2)',
      'var(--initial-color-3)',
      'var(--initial-color-4)',
      'var(--initial-color-5)',
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  });

  const handleImageError = useCallback((e) => {
    e.target.style.display = 'none';
    e.target.nextSibling.style.display = 'flex';
  }, []);

  const handleClick = useCallback((e) => {
    e.preventDefault();
    window.open(link.url, '_blank', 'noopener,noreferrer');
  }, [link.url]);

  const handleEditClick = useCallback((e) => {
    e.stopPropagation();
    onEdit();
  }, [onEdit]);

  return (
    <div className="link-item">
      <button className="edit-btn" onClick={handleEditClick}>
        <Settings size={8} />
      </button>
      <div className="link-content" onClick={handleClick}>
        <div className="link-icon">
          {link.favicon ? (
            <img 
              src={link.favicon} 
              alt="" 
              onError={handleImageError}
              loading="lazy"
              width="32"
              height="32"
            />
          ) : null}
          <div className="link-initial" style={{ display: link.favicon ? 'none' : 'flex', background: initialBgColor }}>
            {getInitial(link.name)}
          </div>
        </div>
        <span className="link-name">{link.name}</span>
      </div>
    </div>
  );
});

export default App;