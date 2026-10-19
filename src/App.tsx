import React, { useState, useEffect, useRef } from 'react';
import { GameItem, AnnouncementItem } from './types';
import { indieApi } from './services/api';

export default function App() {
  const [games, setGames] = useState<GameItem[]>([]);
  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>([]);
  const [activeIframeUrl, setActiveIframeUrl] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [activeGameTitle, setActiveGameTitle] = useState<string>('');
  
  // Feedback form state
  const [feedbackName, setFeedbackName] = useState<string>('');
  const [feedbackEmail, setFeedbackEmail] = useState<string>('');
  const [feedbackMessage, setFeedbackMessage] = useState<string>('');
  const [feedbackStatus, setFeedbackStatus] = useState<string | null>(null);

  // Add Game modal state
  const [isAddGameOpen, setIsAddGameOpen] = useState<boolean>(false);
  const [newTitle, setNewTitle] = useState<string>('');
  const [newUrl, setNewUrl] = useState<string>('');
  const [newDesc, setNewDesc] = useState<string>('');
  const [newThumb, setNewThumb] = useState<string>('');

  // Edit Announcement modal state
  const [isEditAnnOpen, setIsEditAnnOpen] = useState<boolean>(false);
  const [annTitle, setAnnTitle] = useState<string>('');
  const [annContent, setAnnContent] = useState<string>('');

  const modalRef = useRef<HTMLDivElement>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const lastFocusedRef = useRef<HTMLElement | null>(null);

  // Load games & announcements
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [gamesData, annData] = await Promise.all([
        indieApi.getGames(),
        indieApi.getAnnouncements()
      ]);
      setGames(gamesData);
      setAnnouncements(annData);
      if (annData.length > 0) {
        setAnnTitle(annData[0].title);
        setAnnContent(annData[0].content);
      }
    } catch (e) {
      console.error('Failed to load data:', e);
    }
  };

  // Open game player modal and record view
  const openGame = async (game: GameItem, triggerEl?: HTMLElement) => {
    lastFocusedRef.current = triggerEl || (document.activeElement as HTMLElement);
    setActiveIframeUrl(game.url);
    setActiveGameTitle(game.title);
    setIsModalOpen(true);
    document.body.style.overflow = 'hidden';

    // Record view in backend & update count locally
    try {
      const res = await indieApi.recordView(game.id);
      setGames(prev =>
        prev.map(g => (g.id === game.id ? { ...g, views: res.views } : g))
      );
    } catch (e) {
      console.warn('View record failed:', e);
    }

    setTimeout(() => {
      closeBtnRef.current?.focus();
    }, 50);
  };

  // Close game player modal
  const closeGame = () => {
    setIsModalOpen(false);
    setActiveIframeUrl('');
    setActiveGameTitle('');
    document.body.style.overflow = '';
    if (lastFocusedRef.current && typeof lastFocusedRef.current.focus === 'function') {
      lastFocusedRef.current.focus();
    }
  };

  // Keyboard trap & ESC listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isModalOpen) return;

      if (e.key === 'Escape') {
        e.preventDefault();
        closeGame();
        return;
      }

      if (e.key === 'Tab' && modalRef.current) {
        const focusables = modalRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, textarea, iframe, [tabindex]:not([tabindex="-1"])'
        );
        if (!focusables.length) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];

        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isModalOpen]);

  // Handle Feedback Submission
  const handleFeedbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedbackName || !feedbackEmail || !feedbackMessage) return;

    setFeedbackStatus('Submitting...');
    try {
      await indieApi.sendFeedback({
        name: feedbackName,
        email: feedbackEmail,
        message: feedbackMessage
      });
      setFeedbackStatus('Thank you! Your feedback has been sent.');
      setFeedbackName('');
      setFeedbackEmail('');
      setFeedbackMessage('');
      setTimeout(() => setFeedbackStatus(null), 4000);
    } catch (e) {
      setFeedbackStatus('Error submitting feedback. Please try again.');
    }
  };

  // Handle Adding New Game
  const handleAddGame = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newUrl.trim()) return;

    try {
      const created = await indieApi.addGame({
        title: newTitle.trim(),
        url: newUrl.trim(),
        description: newDesc.trim() || 'Official indie game release.',
        thumb: newThumb.trim() || '/src/assets/images/professional_studio_workspace_1792341210954.jpg'
      });

      setGames(prev => [created, ...prev]);
      setIsAddGameOpen(false);
      setNewTitle('');
      setNewUrl('');
      setNewDesc('');
      setNewThumb('');
    } catch (e) {
      console.error(e);
    }
  };

  // Handle Deleting a Game
  const handleDeleteGame = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to remove this game?')) {
      await indieApi.deleteGame(id);
      setGames(prev => prev.filter(g => g.id !== id));
    }
  };

  // Handle Updating Announcement
  const handleSaveAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const updated = await indieApi.updateAnnouncement(annTitle, annContent);
      setAnnouncements([updated]);
      setIsEditAnnOpen(false);
    } catch (e) {
      console.error(e);
    }
  };

  const totalViews = games.reduce((sum, g) => sum + (g.views || 0), 0);

  return (
    <>
      <a className="skip-link" href="#main">Skip to content</a>

      <header>
        <h1>🎮 Official.Ramansh Indie</h1>
        <div style={{ position: 'absolute', right: '1.5rem', top: '1.5rem', display: 'flex', gap: '0.5rem' }}>
          <button
            onClick={() => setIsAddGameOpen(true)}
            className="admin-btn"
            title="Upload a new game iframe link"
          >
            + Add Game
          </button>
        </div>
      </header>

      <main id="main" className="container">
        
        {/* Announcements Section */}
        {announcements.length > 0 && (
          <section className="announcements" aria-labelledby="announcements-heading" style={{ position: 'relative' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <h2 id="announcements-heading">{announcements[0].title}</h2>
              <button
                onClick={() => setIsEditAnnOpen(true)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#c7d2fe',
                  cursor: 'pointer',
                  fontSize: '0.8rem',
                  textDecoration: 'underline'
                }}
              >
                Edit
              </button>
            </div>
            <p>{announcements[0].content}</p>
          </section>
        )}

        {/* Featured Games Section */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ margin: 0 }}>🕹️ Featured Games</h2>
          <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
            Total Plays: <strong style={{ color: 'var(--text-color)' }}>{totalViews.toLocaleString()}</strong>
          </div>
        </div>

        <div className="game-grid" role="list">
          {games.length > 0 ? (
            games.map((game) => (
              <article key={game.id} className="game-card" role="listitem">
                <img
                  className="game-thumb"
                  src={game.thumb || '/src/assets/images/professional_studio_workspace_1792341210954.jpg'}
                  alt={`${game.title} thumbnail`}
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/src/assets/images/professional_studio_workspace_1792341210954.jpg';
                  }}
                />
                <div className="game-info">
                  <h3>{game.title}</h3>
                  <p>{game.description}</p>
                  
                  <div className="views-badge">
                    <span>👁️</span>
                    <span>{game.views.toLocaleString()} plays</span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem' }}>
                    <button
                      className="play-btn"
                      aria-label={`Play ${game.title}`}
                      data-url={game.url}
                      onClick={(e) => openGame(game, e.currentTarget)}
                      style={{ margin: 0 }}
                    >
                      Play Game
                    </button>

                    <button
                      onClick={(e) => handleDeleteGame(game.id, e)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#64748b',
                        fontSize: '0.8rem',
                        cursor: 'pointer',
                        padding: '0.2rem 0.5rem'
                      }}
                      title="Remove game"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </article>
            ))
          ) : (
            <div
              style={{
                gridColumn: '1 / -1',
                textAlign: 'center',
                padding: '3rem 1.5rem',
                background: 'var(--card-bg)',
                borderRadius: '8px',
                color: 'var(--text-muted)'
              }}
            >
              <p style={{ margin: '0 0 1rem 0', fontSize: '1rem' }}>No games added yet.</p>
              <button
                onClick={() => setIsAddGameOpen(true)}
                className="play-btn"
                style={{ margin: '0 auto', display: 'inline-block' }}
              >
                + Add Game Link
              </button>
            </div>
          )}
        </div>

        {/* Contact & Feedback Section */}
        <section className="contact-section" aria-labelledby="contact-heading">
          <h2 id="contact-heading">✉️ Send Feedback / Bug Reports</h2>
          
          {feedbackStatus && (
            <div style={{ padding: '0.75rem', marginBottom: '1rem', borderRadius: '4px', background: '#1e3a8a', color: '#bfdbfe', fontSize: '0.9rem' }}>
              {feedbackStatus}
            </div>
          )}

          <form onSubmit={handleFeedbackSubmit} aria-describedby="form-help">
            <p id="form-help" className="sr-only">We will only use your email to respond to this feedback.</p>
            
            <div className="form-group">
              <label htmlFor="name">Name / Gamer Tag</label>
              <input
                type="text"
                id="name"
                name="name"
                required
                placeholder="Player1"
                value={feedbackName}
                onChange={(e) => setFeedbackName(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <input
                type="email"
                id="email"
                name="_replyto"
                required
                placeholder="player@example.com"
                value={feedbackEmail}
                onChange={(e) => setFeedbackEmail(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label htmlFor="message">Message</label>
              <textarea
                id="message"
                name="message"
                rows={4}
                required
                placeholder="Found a bug in the sample game? Tell me!"
                value={feedbackMessage}
                onChange={(e) => setFeedbackMessage(e.target.value)}
              />
            </div>

            <button type="submit" className="submit-btn">Submit Feedback</button>
          </form>
        </section>

      </main>

      {/* Game Player Modal */}
      <div
        id="gameModal"
        ref={modalRef}
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-hidden={!isModalOpen}
        aria-label="Game player"
        onClick={(e) => {
          if (e.target === e.currentTarget) closeGame();
        }}
      >
        <div className="modal-content" role="document">
          <button
            id="modalClose"
            ref={closeBtnRef}
            className="close-btn"
            aria-label="Close game player"
            onClick={closeGame}
          >
            &times;
          </button>
          
          {activeIframeUrl && (
            <iframe
              id="gameFrame"
              src={activeIframeUrl}
              title={activeGameTitle || 'Game frame'}
              allow="fullscreen; autoplay; encrypted-media; gamepad; picture-in-picture"
              sandbox="allow-scripts allow-same-origin allow-forms allow-pointer-lock allow-popups"
            />
          )}
        </div>
      </div>

      {/* Add Game Modal */}
      {isAddGameOpen && (
        <div
          className="modal"
          aria-hidden="false"
          style={{ display: 'flex' }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsAddGameOpen(false);
          }}
        >
          <div
            style={{
              background: 'var(--card-bg)',
              borderRadius: '8px',
              padding: '2rem',
              width: '90%',
              maxWidth: '520px',
              boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
              position: 'relative'
            }}
          >
            <button
              onClick={() => setIsAddGameOpen(false)}
              className="close-btn"
              style={{ position: 'absolute', top: '12px', right: '12px' }}
            >
              &times;
            </button>

            <h2 style={{ marginTop: 0, marginBottom: '1.2rem', color: 'var(--text-color)' }}>
              Add Game Link
            </h2>

            <form onSubmit={handleAddGame}>
              <div className="form-group">
                <label>Game Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Solaris: Orbit Defender"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>Iframe Game Link (URL) *</label>
                <input
                  type="url"
                  required
                  placeholder="https://..."
                  value={newUrl}
                  onChange={(e) => setNewUrl(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  rows={3}
                  placeholder="Official game overview..."
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>Thumbnail Image URL (optional)</label>
                <input
                  type="url"
                  placeholder="https://..."
                  value={newThumb}
                  onChange={(e) => setNewThumb(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button
                  type="button"
                  onClick={() => setIsAddGameOpen(false)}
                  style={{
                    background: '#334155',
                    color: '#fff',
                    border: 'none',
                    padding: '0.75rem',
                    borderRadius: '4px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    flex: 1
                  }}
                >
                  Cancel
                </button>
                <button type="submit" className="submit-btn" style={{ flex: 1 }}>
                  Save Game
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Announcement Modal */}
      {isEditAnnOpen && (
        <div
          className="modal"
          aria-hidden="false"
          style={{ display: 'flex' }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsEditAnnOpen(false);
          }}
        >
          <div
            style={{
              background: 'var(--card-bg)',
              borderRadius: '8px',
              padding: '2rem',
              width: '90%',
              maxWidth: '520px',
              boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
              position: 'relative'
            }}
          >
            <button
              onClick={() => setIsEditAnnOpen(false)}
              className="close-btn"
              style={{ position: 'absolute', top: '12px', right: '12px' }}
            >
              &times;
            </button>

            <h2 style={{ marginTop: 0, marginBottom: '1.2rem', color: 'var(--text-color)' }}>
              Edit Announcement
            </h2>

            <form onSubmit={handleSaveAnnouncement}>
              <div className="form-group">
                <label>Title</label>
                <input
                  type="text"
                  required
                  value={annTitle}
                  onChange={(e) => setAnnTitle(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>Content</label>
                <textarea
                  rows={4}
                  required
                  value={annContent}
                  onChange={(e) => setAnnContent(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button
                  type="button"
                  onClick={() => setIsEditAnnOpen(false)}
                  style={{
                    background: '#334155',
                    color: '#fff',
                    border: 'none',
                    padding: '0.75rem',
                    borderRadius: '4px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    flex: 1
                  }}
                >
                  Cancel
                </button>
                <button type="submit" className="submit-btn" style={{ flex: 1 }}>
                  Save Announcement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
