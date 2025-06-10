import './App.css';
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Plus, X, Home, Link, CheckSquare, Menu, Settings, BookOpen, Star, Heart, Zap, Command, Coffee, Music } from 'lucide-react';
import logo from './assets/img/memoflux_logo.png';

function App() {
  const version = 'v0.4.12';
  // Initialize save function first to avoid hoisting issues
  const saveToLocalStorage = useMemo(() => {
    return (data) => {
      try {
        const dataToSave = {
          ...data,
          loadingScreenEnabled: data.loadingScreenEnabled ?? true,
        };
        localStorage.setItem('memofluxData', JSON.stringify(dataToSave));
      } catch (error) {
        console.error('Error saving to localStorage:', error);
      }
    };
  }, []);

  // Available icons for groups
  const availableIcons = useMemo(() => ({
    'Link': Link,
    'Star': Star,
    'Heart': Heart,
    'Zap': Zap,
    'Command': Command,
    'Coffee': Coffee,
    'Music': Music,
    'BookOpen': BookOpen
  }), []);

  // Get initial state from localStorage
  const initialState = useMemo(() => {
    try {
      const savedData = localStorage.getItem('memofluxData');
      if (savedData) {
        const parsedData = JSON.parse(savedData);
        return {
          isDark: parsedData.isDark ?? true,
          loadingScreenEnabled: parsedData.loadingScreenEnabled ?? true,
          linkGroups: parsedData.linkGroups || { 'links': { name: 'links', icon: 'Link', items: [] } },
          homeLinks: parsedData.homeLinks || []
        };
      }
    } catch (error) {
      console.error('Error loading initial state:', error);
    }
    return {
      isDark: true,
      loadingScreenEnabled: true,
      linkGroups: { 'links': { name: 'links', icon: 'Link', items: [] } },
      homeLinks: []
    };
  }, []);

  const [isLoading, setIsLoading] = useState(true);
  const [isDark, setIsDark] = useState(initialState.isDark);
  const [loadingScreenEnabled, setLoadingScreenEnabled] = useState(initialState.loadingScreenEnabled ?? true);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 600);
  const [showLongPressHint, setShowLongPressHint] = useState(false);
  const [currentView, setCurrentView] = useState('MemoFlux'); 
  const [linkGroups, setLinkGroups] = useState(initialState.linkGroups);
  const [homeLinks, setHomeLinks] = useState(initialState.homeLinks);
  const [showAddLinkModal, setShowAddLinkModal] = useState(false);
  const [showAddGroupModal, setShowAddGroupModal] = useState(false);
  const [showEditGroupModal, setShowEditGroupModal] = useState(false);
  const [newLink, setNewLink] = useState({ name: '', url: '', group: 'links', customFavicon: '' });
  const [newGroupInfo, setNewGroupInfo] = useState({ name: '', icon: 'Link', customEmoji: '' });
  const [faviconError, setFaviconError] = useState(false);
  const [editingGroup, setEditingGroup] = useState(null);
  const [isDuplicateName, setIsDuplicateName] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sidebarMinimized, setSidebarMinimized] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showEditLinkModal, setShowEditLinkModal] = useState(false);
  const [editingLink, setEditingLink] = useState(null);

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
    setIsDark(prev => {
      const newIsDark = !prev;
      // Save immediately after updating
      saveToLocalStorage({ linkGroups, homeLinks, isDark: newIsDark });
      return newIsDark;
    });
  }, [saveToLocalStorage, linkGroups, homeLinks]);

  // Memoize favicon function to prevent recreating it on every render
  const validateImageUrl = useCallback((url) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve(true);
      img.onerror = () => resolve(false);
      img.src = url;
    });
  }, []);

  const getFavicon = useCallback(async (url, customFavicon) => {
    if (customFavicon) {
      const isValid = await validateImageUrl(customFavicon);
      if (isValid) {
        return customFavicon;
      }
      setFaviconError(true);
      setTimeout(() => setFaviconError(false), 820);
      return null;
    }

    try {
      const domain = new URL(url).hostname;
      const googleFaviconUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
      const defaultFaviconUrl = `https://${domain}/favicon.ico`;
      
      if (!domain) {
        return null;
      }

      // Try Google's favicon service first
      const googleValid = await validateImageUrl(googleFaviconUrl);
      if (googleValid) {
        const img = new Image();
        await new Promise((resolve) => {
          img.onload = resolve;
          img.src = googleFaviconUrl;
        });
        
        if (img.width > 16 || img.height > 16) {
          return googleFaviconUrl;
        }
      }

      // Try the default favicon.ico as fallback
      const defaultValid = await validateImageUrl(defaultFaviconUrl);
      if (defaultValid) {
        return defaultFaviconUrl;
      }

      return null;
    } catch {
      return null;
    }
  }, [validateImageUrl]);

  const getInitial = useCallback((name) => {
    return name.charAt(0).toUpperCase();
  }, []);

  const addLink = useCallback(() => {
    if (newLink.name && newLink.url) {
      const fullUrl = newLink.url.startsWith('http') ? newLink.url : `https://${newLink.url}`;
      
      // Make getFavicon async
      getFavicon(fullUrl, newLink.customFavicon).then(faviconUrl => {
        setLinkGroups(prev => {
          const newGroups = {
            ...prev,
            [newLink.group]: {
              ...prev[newLink.group],
              items: [...(prev[newLink.group].items || []), {
                id: Date.now(),
                name: newLink.name,
                url: fullUrl,
                favicon: faviconUrl,
                customFavicon: newLink.customFavicon
              }]
            }
          };
          // Save immediately after updating
          saveToLocalStorage({ linkGroups: newGroups, homeLinks, isDark });
          return newGroups;
        });
      });
      
      setNewLink({ name: '', url: '', group: 'links', customFavicon: '' });
      setShowAddLinkModal(false);
    }
  }, [newLink, getFavicon, saveToLocalStorage, homeLinks, isDark]);

  const addGroup = useCallback(() => {
    const trimmedName = newGroupInfo.name.trim();
    const lowercaseName = trimmedName.toLowerCase();
    
    if (trimmedName && !linkGroups[lowercaseName]) {
      setLinkGroups(prev => {
        const newGroups = {
          ...prev,
          [lowercaseName]: {
            name: trimmedName,
            icon: newGroupInfo.customEmoji || newGroupInfo.icon,
            items: []
          }
        };
        // Save immediately after updating
        saveToLocalStorage({ linkGroups: newGroups, homeLinks, isDark });
        return newGroups;
      });
      setNewGroupInfo({ name: '', icon: 'Link', customEmoji: '' });
      setShowAddGroupModal(false);
    }
  }, [newGroupInfo, linkGroups, saveToLocalStorage, homeLinks, isDark]);

  const handleGroupEdit = useCallback(() => {
    if (!editingGroup) return;
    
    const oldKey = editingGroup.key;
    const trimmedName = newGroupInfo.name.trim();
    const lowercaseName = trimmedName.toLowerCase();
    
    if (trimmedName && (lowercaseName === oldKey || !linkGroups[lowercaseName])) {
      setLinkGroups(prev => {
        const newGroups = { ...prev };
        
        // If name changed, create new key and delete old one
        if (lowercaseName !== oldKey) {
          delete newGroups[oldKey];
        }
        
        newGroups[lowercaseName] = {
          name: trimmedName,
          icon: newGroupInfo.customEmoji || newGroupInfo.icon,
          items: prev[oldKey]?.items || []
        };
        
        // Save immediately after updating
        saveToLocalStorage({ linkGroups: newGroups, homeLinks, isDark });
        return newGroups;
      });
      
      // Update current view if needed
      if (currentView === oldKey) {
        setCurrentView(lowercaseName);
      }
      
      setNewGroupInfo({ name: '', icon: 'Link', customEmoji: '' });
      setEditingGroup(null);
      setShowEditGroupModal(false);
    }
  }, [editingGroup, newGroupInfo, linkGroups, currentView, saveToLocalStorage, homeLinks, isDark]);

  const addHomeLink = useCallback(() => {
    if (newLink.name && newLink.url) {
      const fullUrl = newLink.url.startsWith('http') ? newLink.url : `https://${newLink.url}`;
      
      // Make getFavicon async
      getFavicon(fullUrl, newLink.customFavicon).then(faviconUrl => {
        setHomeLinks(prev => {
          const newHomeLinks = [...prev, {
            id: Date.now(),
            name: newLink.name,
            url: fullUrl,
            favicon: faviconUrl,
            customFavicon: newLink.customFavicon
          }];
          // Save immediately after updating
          saveToLocalStorage({ linkGroups, homeLinks: newHomeLinks, isDark });
          return newHomeLinks;
        });
      });
      
      setNewLink({ name: '', url: '', group: 'links', customFavicon: '' });
      setShowAddLinkModal(false);
    }
  }, [newLink, getFavicon, saveToLocalStorage, linkGroups, isDark]);

  const editLink = useCallback((link, isHome = false) => {
    setEditingLink({ ...link, isHome });
    setNewLink({ 
      name: link.name, 
      url: link.url, 
      group: 'links', 
      customFavicon: link.customFavicon || '' 
    });
    setShowEditLinkModal(true);
  }, []);

  const updateLink = useCallback(() => {
    if (newLink.name && newLink.url && editingLink) {
      const fullUrl = newLink.url.startsWith('http') ? newLink.url : `https://${newLink.url}`;
      
      // Make getFavicon async
      getFavicon(fullUrl, newLink.customFavicon).then(faviconUrl => {
        const updatedLink = {
          ...editingLink,
          name: newLink.name,
          url: fullUrl,
          favicon: faviconUrl,
          customFavicon: newLink.customFavicon
        };

        if (editingLink.isHome) {
          setHomeLinks(prev => {
            const newHomeLinks = prev.map(link => 
              link.id === editingLink.id ? updatedLink : link
            );
            // Save immediately after updating
            saveToLocalStorage({ linkGroups, homeLinks: newHomeLinks, isDark });
            return newHomeLinks;
          });
        } else {
          setLinkGroups(prev => {
            const newGroups = {
              ...prev,
              [editingLink.group]: {
                ...prev[editingLink.group],
                items: prev[editingLink.group].items.map(link => 
                  link.id === editingLink.id ? updatedLink : link
                )
              }
            };
            // Save immediately after updating
            saveToLocalStorage({ linkGroups: newGroups, homeLinks, isDark });
            return newGroups;
          });
        }

        setNewLink({ name: '', url: '', group: 'links' });
        setShowEditLinkModal(false);
        setEditingLink(null);
      });
    }
  }, [newLink, editingLink, getFavicon, saveToLocalStorage, linkGroups, homeLinks, isDark]);

  const deleteGroup = useCallback(() => {
    if (!editingGroup) return;
    
    const groupKey = editingGroup.key;
    if (window.confirm(`Are you sure you want to delete "${editingGroup.name}" group and all its links?`)) {
      setLinkGroups(prev => {
        const newGroups = { ...prev };
        delete newGroups[groupKey];
        
        // Save immediately after updating
        saveToLocalStorage({ linkGroups: newGroups, homeLinks, isDark });
        
        // If we're currently viewing the deleted group, switch to MemoFlux
        if (currentView === groupKey) {
          setCurrentView('MemoFlux');
        }
        
        return newGroups;
      });
      
      setShowEditGroupModal(false);
      setEditingGroup(null);
      setNewGroupInfo({ name: '', icon: 'Link', customEmoji: '' });
    }
  }, [editingGroup, currentView, saveToLocalStorage, homeLinks, isDark]);

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
        setHomeLinks(prev => {
          const newHomeLinks = prev.filter(link => link.id !== editingLink.id);
          // Save immediately after updating
          saveToLocalStorage({ linkGroups, homeLinks: newHomeLinks, isDark });
          return newHomeLinks;
        });
      } else {
        setLinkGroups(prev => {
          const newGroups = {
            ...prev,
            [editingLink.group]: prev[editingLink.group].filter(link => link.id !== editingLink.id)
          };
          // Save immediately after updating
          saveToLocalStorage({ linkGroups: newGroups, homeLinks, isDark });
          return newGroups;
        });
      }
      
      setNewLink({ name: '', url: '', group: 'links' });
      setShowEditLinkModal(false);
      setEditingLink(null);
    }
  }, [editingLink, saveToLocalStorage, linkGroups, homeLinks, isDark]);

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

  // Escape key handler for modals
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        if (showAddLinkModal) setShowAddLinkModal(false);
        if (showAddGroupModal) setShowAddGroupModal(false);
        if (showEditLinkModal) setShowEditLinkModal(false);
        if (showEditGroupModal) setShowEditGroupModal(false);
      }
    };
    
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [showAddLinkModal, showAddGroupModal, showEditLinkModal, showEditGroupModal]);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 600);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 600);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Data management functions
  const exportData = useCallback(() => {
    const dataToExport = {
      linkGroups,
      homeLinks,
      isDark,
      loadingScreenEnabled,
      exportDate: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `memoflux-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [linkGroups, homeLinks, isDark]);

  const importData = useCallback((file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedData = JSON.parse(e.target.result);
        const newLinkGroups = importedData.linkGroups || { 'links': [] };
        const newHomeLinks = importedData.homeLinks || [];
        const newIsDark = importedData.isDark ?? true;
        const newLoadingScreenEnabled = importedData.loadingScreenEnabled ?? true;
        
        // Update state
        setLinkGroups(newLinkGroups);
        setHomeLinks(newHomeLinks);
        setIsDark(newIsDark);
        setLoadingScreenEnabled(newLoadingScreenEnabled);

        // Save to localStorage immediately
        saveToLocalStorage({
          linkGroups: newLinkGroups,
          homeLinks: newHomeLinks,
          isDark: newIsDark,
          loadingScreenEnabled: newLoadingScreenEnabled
        });

        // Reload the page to ensure a clean state, matching deletion behavior
        window.location.reload();
      } catch (error) {
        console.error('Error importing data:', error);
        alert('Invalid backup file format');
      }
    };
    reader.readAsText(file);
  }, [saveToLocalStorage]);

  const deleteAllData = useCallback(() => {
    if (window.confirm('-Are you sure you want to delete all data? \n-This action cannot be undone.')) {
      localStorage.removeItem('memofluxData');
      setLinkGroups({ 'links': [] });
      setHomeLinks([]);
      window.location.reload(); // Reload the page to ensure a clean state
    }
  }, []);

  useEffect(() => {
    if (isMobile) {
      const hasSeenHint = localStorage.getItem('hasSeenLongPressHint');
      if (!hasSeenHint) {
        setShowLongPressHint(true);
        setTimeout(() => {
          setShowLongPressHint(false);
          localStorage.setItem('hasSeenLongPressHint', 'true');
        }, 3000);
      }
    }
  }, [isMobile]);

  if (isLoading && (loadingScreenEnabled || (!loadingScreenEnabled && isLoading === 'force'))) {
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
            <span>Home</span>
          </div>
          
          <div 
            className={`nav-item ${currentView === 'links' ? 'active' : ''}`} 
            onClick={() => handleNavClick('links')}
          >
            <Link size={16} />
            <span>links</span>
          </div>
          
          {filteredLinkGroups.map(groupKey => {
            const group = linkGroups[groupKey];
            const IconComponent = group.icon in availableIcons ? availableIcons[group.icon] : Link;
            
            return (
              <div 
                key={groupKey} 
                className={`nav-item ${currentView === groupKey ? 'active' : ''}`}
                onClick={() => handleNavClick(groupKey)}
              >
                {group.icon in availableIcons ? (
                  <IconComponent size={16} />
                ) : (
                  <span className="emoji-icon">{group.icon}</span>
                )}
                  <span>{group.name}</span>
                  {!isMobile && (
                    <button
                      className="edit-group-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingGroup({ key: groupKey, ...group });
                        setNewGroupInfo({
                          name: group.name,
                          icon: group.icon in availableIcons ? group.icon : 'Link',
                          customEmoji: group.icon in availableIcons ? '' : group.icon
                        });
                        setShowEditGroupModal(true);
                      }}
                    >
                      <Settings size={12} />
                    </button>
                  )}
              </div>
            );
          })}
          
          <div 
            className="nav-item" 
            onClick={() => setShowAddGroupModal(true)}
          >
            <Plus size={16} />
            <span>add group</span>
          </div>
          
          <div 
            className={`nav-item ${currentView === 'todo' ? 'active' : ''}`} 
            onClick={() => handleNavClick('todo')}
          >
            <CheckSquare size={16} />
            <span>todo</span>
          </div>
          
          <div 
            className={`nav-item ${currentView === 'settings' ? 'active' : ''}`} 
            onClick={() => handleNavClick('settings')}
          >
            <Settings size={16} />
            <span>settings</span>
          </div>
        </nav>
      </div>
      
      <div className={`wrapper ${sidebarMinimized ? 'sidebar-minimized' : ''} ${mobileMenuOpen ? 'mobile-menu-open' : ''}`}>
        {(
          <>
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
            
            <div className={currentView == 'MemoFlux' ? 'main-header home-header' : 'main-header'}>
              <div className='header-content'>
                {currentView === 'MemoFlux' ? (
                  <img src={logo} alt='MemoFlux' className="header-logo" />
                ) : (
                  currentView === 'todo' ? (
                    <CheckSquare size={24} />
                  ) : currentView === 'settings' ? (
                    <Settings size={24} />
                  ) : currentView === 'links' ? (
                    <Link size={24} />
                  ) : (
                    linkGroups[currentView] && (
                      availableIcons[linkGroups[currentView].icon] ? (
                        React.createElement(availableIcons[linkGroups[currentView].icon], { size: 24 })
                      ) : (
                        <span className="emoji-icon header-icon">{linkGroups[currentView].icon}</span>
                      )
                    )
                  )
                )}
                <h1>{currentView}</h1>
                {isMobile && currentView !== 'MemoFlux' && currentView !== 'todo' && currentView !== 'settings' && currentView !== 'links' && (
                  <button
                    className="mobile-edit-group-btn"
                    onClick={() => {
                      const group = linkGroups[currentView];
                      setEditingGroup({ key: currentView, ...group });
                      setNewGroupInfo({
                        name: group.name,
                        icon: group.icon in availableIcons ? group.icon : 'Link',
                        customEmoji: group.icon in availableIcons ? '' : group.icon
                      });
                      setShowEditGroupModal(true);
                    }}
                  >
                    <Settings size={17} />
                  </button>
                )}
              </div>
            </div>
          </>
        )}

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

          {currentView !== 'MemoFlux' && currentView !== 'todo' && currentView !== 'settings' && (
            <div className="links-view">
              <div className="links-grid">
                {linkGroups[currentView]?.items.map((link) => (
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

          {currentView === 'settings' && (
            <div className="settings-view">
              <div className="settings-section">
                <h2>Theme Settings</h2>
                <div className="settings-actions">
                  <button 
                    className="settings-btn"
                    onClick={toggleTheme}
                  >
                    Switch to {isDark ? 'Light' : 'Dark'} Mode
                  </button>
                  <button 
                    className="settings-btn"
                    onClick={() => {
                      setLoadingScreenEnabled(prev => {
                        const newValue = !prev;
                        saveToLocalStorage({ linkGroups, homeLinks, isDark, loadingScreenEnabled: newValue });
                        return newValue;
                      });
                    }}
                  >
                    {loadingScreenEnabled ? 'Disable' : 'Enable'} Loading Screen
                  </button>
                </div>

                <h2>Data Management</h2>
                <div className="settings-actions">
                  <button className="settings-btn" onClick={exportData}>
                    Export Data Backup
                  </button>
                  
                  <div className="settings-btn-container">
                    <input
                      type="file"
                      id="importData"
                      accept=".json"
                      style={{ display: 'none' }}
                      onChange={(e) => {
                        if (e.target.files?.[0]) {
                          importData(e.target.files[0]);
                          e.target.value = '';
                        }
                      }}
                    />
                    <button 
                      className="settings-btn"
                      onClick={() => document.getElementById('importData').click()}
                    >
                      Import Data Backup
                    </button>
                  </div>

                  <button className="settings-btn delete-btn" onClick={deleteAllData}>
                    Delete All Data
                  </button>
                </div>
                <h2>More</h2>
                <p>beta version - {version}</p>
                {/* <div className="settings-info">
                  <h3>About Data Management</h3>
                  <ul>
                    <li>Your data is automatically saved in your browser's local storage</li>
                    <li>Export creates a backup file of all your data</li>
                    <li>Import allows you to restore from a previous backup</li>
                    <li>Delete All Data will remove everything and cannot be undone</li>
                  </ul>
                </div> */}
              </div>
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
              <div className="modal-content-wrapper">
                <div className="modal-inputs">
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
                  <h4>Custom Icon URL (optional)</h4>
                  <input
                    type="text"
                    placeholder="Enter image URL for custom favicon"
                    value={newLink.customFavicon}
                    className={faviconError ? 'input-error' : ''}
                    onChange={(e) => setNewLink({ ...newLink, customFavicon: e.target.value })}
                  />
                </div>
                <div className="favicon-preview">
                  <FaviconPreview 
                    url={newLink.url}
                    customFavicon={newLink.customFavicon}
                    name={newLink.name}
                    onError={() => {
                      setFaviconError(true);
                      setTimeout(() => setFaviconError(false), 820);
                    }}
                  />
                  <div className="favicon-preview-title">
                    {newLink.name || 'Untitled'}
                  </div>
                </div>
              </div>
              <div className="modal-actions">
                <button className="modal-cancel" onClick={() => setShowAddLinkModal(false)}>
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
              <div className="modal-content-wrapper">
                <div className="modal-inputs">
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
                  <h4>Custom Favicon URL (optional)</h4>
                  <input
                    type="text"
                    placeholder="Enter image URL for custom favicon"
                    value={newLink.customFavicon}
                    className={faviconError ? 'input-error' : ''}
                    onChange={(e) => setNewLink({ ...newLink, customFavicon: e.target.value })}
                  />
                </div>
                <div className="favicon-preview">
                  <FaviconPreview 
                    url={newLink.url}
                    customFavicon={newLink.customFavicon}
                    name={newLink.name}
                    onError={() => {
                      setFaviconError(true);
                      setTimeout(() => setFaviconError(false), 820);
                    }}
                  />
                  <div className="favicon-preview-title">
                    {newLink.name || 'Untitled'}
                  </div>
                </div>
              </div>
              <div className="modal-actions">
                <button className="remove-btn-modal" onClick={removeCurrentLink}>
                  Delete
                </button>
                <button className="modal-cancel" onClick={() => setShowEditLinkModal(false)}>
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
                value={newGroupInfo.name}
                onChange={(e) => {
                  const value = e.target.value;
                  setNewGroupInfo({ ...newGroupInfo, name: value });
                  const lowercaseName = value.trim().toLowerCase();
                  setIsDuplicateName(Object.keys(linkGroups).includes(lowercaseName) && 
                    (!editingGroup || editingGroup.key !== lowercaseName));
                }}
                className={isDuplicateName ? 'input-error' : ''}
                autoFocus
              />
              
              <h4>Icon</h4>
              <div className="icon-selection">
                <div className="icon-grid">
                  {Object.entries(availableIcons).map(([name, Icon]) => (
                    <button
                      key={name}
                      className={`icon-option ${newGroupInfo.icon === name ? 'selected' : ''}`}
                      onClick={() => setNewGroupInfo({ ...newGroupInfo, icon: name, customEmoji: '' })}
                    >
                      <Icon size={20} />
                    </button>
                  ))}
                </div>
                
                <div className="custom-emoji-input">
                  <input
                    type="text"
                    placeholder="Or type emoji 😊"
                    value={newGroupInfo.customEmoji}
                    onChange={(e) => {
                      const input = e.target.value;
                      // More comprehensive regex that includes emojis with variation selectors
                      const emojiRegex = /(\p{Emoji}|\p{Emoji_Presentation}|\p{Extended_Pictographic})[\u{FE00}-\u{FE0F}\u{1F3FB}-\u{1F3FF}]*/gu;
                      const match = input.match(emojiRegex);
                      const firstEmoji = match ? match[0] : '';
                      setNewGroupInfo({ ...newGroupInfo, customEmoji: firstEmoji, icon: 'Link' });
                    }}
                  />
                </div>
              </div>

              <div className="modal-actions">
                <button className="modal-cancel" onClick={() => {
                  setShowAddGroupModal(false);
                  setNewGroupInfo({ name: '', icon: 'Link', customEmoji: '' });
                }}>
                  Cancel
                </button>
                <button 
                  className="submit-btn" 
                  onClick={addGroup}
                  disabled={!newGroupInfo.name.trim() || isDuplicateName}
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Group Modal */}
      {showEditGroupModal && (
        <div className="modal-overlay" onClick={() => setShowEditGroupModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Edit Group</h3>
            </div>
            <div className="modal-body">
              <h4>Name</h4>
              <input
                type="text"
                placeholder="Enter a name"
                value={newGroupInfo.name}
                onChange={(e) => {
                  const value = e.target.value;
                  setNewGroupInfo({ ...newGroupInfo, name: value });
                  const lowercaseName = value.trim().toLowerCase();
                  setIsDuplicateName(Object.keys(linkGroups).includes(lowercaseName) && 
                    (!editingGroup || editingGroup.key !== lowercaseName));
                }}
                className={isDuplicateName ? 'input-error' : ''}
                autoFocus
              />
              
              <h4>Icon</h4>
              <div className="icon-selection">
                <div className="icon-grid">
                  {Object.entries(availableIcons).map(([name, Icon]) => (
                    <button
                      key={name}
                      className={`icon-option ${newGroupInfo.icon === name ? 'selected' : ''}`}
                      onClick={() => setNewGroupInfo({ ...newGroupInfo, icon: name, customEmoji: '' })}
                    >
                      <Icon size={20} />
                    </button>
                  ))}
                </div>
                
                <div className="custom-emoji-input">
                  <input
                    type="text"
                    placeholder="Or type emoji 😊"
                    value={newGroupInfo.customEmoji}
                    onChange={(e) => {
                      const input = e.target.value;
                      // More comprehensive regex that includes emojis with variation selectors
                      const emojiRegex = /(\p{Emoji}|\p{Emoji_Presentation}|\p{Extended_Pictographic})[\u{FE00}-\u{FE0F}\u{1F3FB}-\u{1F3FF}]*/gu;
                      const match = input.match(emojiRegex);
                      const firstEmoji = match ? match[0] : '';
                      setNewGroupInfo({ ...newGroupInfo, customEmoji: firstEmoji, icon: 'Link' });
                    }}
                  />
                </div>
              </div>

              <div className="modal-actions">
                <button 
                  className="remove-btn-modal"
                  onClick={deleteGroup}
                >
                  Delete
                </button>
                <button className="modal-cancel" onClick={() => {
                  setShowEditGroupModal(false);
                  setNewGroupInfo({ name: '', icon: 'Link', customEmoji: '' });
                  setEditingGroup(null);
                }}>
                  Cancel
                </button>
                <button 
                  className="submit-btn" 
                  onClick={handleGroupEdit}
                  disabled={!newGroupInfo.name.trim() || isDuplicateName}
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showLongPressHint && (
        <div className="long-press-hint">
          Long press any link to edit or delete
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

  const [showFavicon, setShowFavicon] = useState(false);
  const [faviconUrl, setFaviconUrl] = useState(link.favicon);
  const [isMobile] = useState(window.innerWidth <= 600);
  const [longPressTimer, setLongPressTimer] = useState(null);
  
  useEffect(() => {
    // Reset state when link changes
    setShowFavicon(false);
    setFaviconUrl(link.favicon);

    if (link.favicon) {
      const img = new Image();
      img.onload = () => {
        if (img.width > 16 && img.height > 16) {
          setShowFavicon(true);
        }
      };
      img.onerror = () => {
        setShowFavicon(false);
        setFaviconUrl(null);
      };
      img.src = link.favicon;
    }
  }, [link.favicon]);

  const handleClick = useCallback((e) => {
    // Prevent click from firing immediately on touch devices
    if (e.type === 'click' && e.nativeEvent.pointerType === 'touch') {
      return;
    }
    e.preventDefault();
    window.open(link.url, '_blank', 'noopener,noreferrer');
  }, [link.url]);

  const handleEditClick = useCallback((e) => {
    e.stopPropagation();
    onEdit();
  }, [onEdit]);

  const [touchStartTime, setTouchStartTime] = useState(0);

  const handleTouchStart = useCallback((e) => {
    if (!isMobile) return;
    setTouchStartTime(Date.now());
    const timer = setTimeout(() => {
      onEdit();
    }, 500); // 500ms long press
    setLongPressTimer(timer);
  }, [isMobile, onEdit]);

  const handleTouchEnd = useCallback((e) => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
    // If the touch duration was less than 500ms, treat it as a click
    const touchDuration = Date.now() - touchStartTime;
    if (touchDuration < 500) {
      window.open(link.url, '_blank', 'noopener,noreferrer');
    }
  }, [longPressTimer, touchStartTime, link.url]);

  return (
    <div 
      className="link-item"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
      onClick={handleClick}
    >
      {!isMobile && (
        <button className="edit-btn" onClick={handleEditClick}>
          <Settings size={8} />
        </button>
      )}
      <div className="link-content">
        <div className="link-icon">
          <div className="link-initial" style={{ 
            display: showFavicon ? 'none' : 'flex', 
            background: initialBgColor 
          }}>
            {getInitial(link.name)}
          </div>
          {faviconUrl && (
            <img 
              src={faviconUrl} 
              alt="" 
              style={{ 
                display: showFavicon ? 'block' : 'none', 
                position: 'absolute' 
              }}
              loading="lazy"
              width="32"
              height="32"
            />
          )}
        </div>
        <span className="link-name">{link.name}</span>
      </div>
    </div>
  );
});

// Memoized FaviconPreview component for previewing favicons safely
const FaviconPreview = React.memo(({ url, customFavicon, name, onError }) => {
  const [showPlaceholder, setShowPlaceholder] = React.useState(!customFavicon && !url);
  const [showImage, setShowImage] = React.useState(false);

  const handleImageError = React.useCallback(() => {
    setShowPlaceholder(true);
    setShowImage(false);
    if (customFavicon && onError) {
      onError();
    }
  }, [customFavicon, onError]);

  const handleImageLoad = React.useCallback((e) => {
    if (e.target.width === 16) {
      handleImageError();
    } else {
      setShowPlaceholder(false);
      setShowImage(true);
    }
  }, [handleImageError]);

  return (
    <div className="favicon-preview-box">
      {showPlaceholder && (
        <div className="favicon-placeholder">
          {name ? name.charAt(0).toUpperCase() : '?'}
        </div>
      )}
      {(customFavicon || url) && (
        <img 
          src={customFavicon || `https://www.google.com/s2/favicons?domain=${new URL(url.startsWith('http') ? url : `https://${url}`).hostname}&sz=32`}
          alt=""
          style={{ display: showImage ? 'block' : 'none' }}
          onError={handleImageError}
          onLoad={handleImageLoad}
        />
      )}
    </div>
  );
});

export default App;