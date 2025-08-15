
function CommandPaletteButton({ onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        width: '48px',
        height: '48px',
        borderRadius: '50%',
        backgroundColor: '#667eea',
        border: 'none',
        color: 'white',
        fontSize: '20px',
        cursor: 'pointer',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'all 0.2s ease',
        zIndex: 1000
      }}
      onMouseEnter={(e) => {
        e.target.style.backgroundColor = '#5a67d8';
        e.target.style.transform = 'scale(1.05)';
      }}
      onMouseLeave={(e) => {
        e.target.style.backgroundColor = '#667eea';
        e.target.style.transform = 'scale(1)';
      }}
      title="Open Command Palette (Ctrl+Enter)"
    >
      ⌘
    </button>
  );
}

export default CommandPaletteButton;