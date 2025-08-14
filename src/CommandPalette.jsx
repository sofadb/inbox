import { useState, useEffect } from 'react'
import { Command } from 'cmdk'
import './CommandPalette.css'

const CommandPalette = ({ isOpen, onClose, onSave }) => {
  const [search, setSearch] = useState('')

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown)
      return () => document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div className="command-palette-overlay" onClick={onClose}>
      <Command className="command-palette" onClick={(e) => e.stopPropagation()}>
        <Command.Input
          value={search}
          onValueChange={setSearch}
          placeholder="Type a command or search..."
          className="command-input"
          autoFocus
        />
        <Command.List className="command-list">
          <Command.Empty className="command-empty">
            No results found.
          </Command.Empty>
          <Command.Group heading="Actions" className="command-group">
            <Command.Item
              onSelect={() => {
                onSave()
                onClose()
              }}
              className="command-item"
            >
              💾 Save
            </Command.Item>
          </Command.Group>
        </Command.List>
      </Command>
    </div>
  )
}

export default CommandPalette