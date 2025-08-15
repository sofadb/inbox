import { useState, useEffect } from 'react';

export function useCommandPalette(handleDirectGitHubSave, focusEditor) {
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.ctrlKey && e.key === 'Enter') {
        e.preventDefault();
        e.stopPropagation();
        setIsCommandPaletteOpen(true);
      } else if (e.altKey && e.key === 'Enter') {
        e.preventDefault();
        e.stopPropagation();
        handleDirectGitHubSave();
      }
    };

    document.addEventListener('keydown', handleKeyDown, true);
    return () => document.removeEventListener('keydown', handleKeyDown, true);
  }, [handleDirectGitHubSave]);

  const handleCommandPaletteOpen = () => {
    setIsCommandPaletteOpen(true);
  };

  const handleCommandPaletteClose = () => {
    setIsCommandPaletteOpen(false);
    setTimeout(() => {
      if (focusEditor.current) {
        focusEditor.current();
      }
    }, 100);
  };

  return {
    isCommandPaletteOpen,
    handleCommandPaletteOpen,
    handleCommandPaletteClose
  };
}