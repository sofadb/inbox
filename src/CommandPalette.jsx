import { useState, useEffect } from 'react'
import { Command } from 'cmdk'
import GitHubConfig from './GitHubConfig'
import './CommandPalette.css'

const CommandPalette = ({ isOpen, onClose, onSave, getCurrentContent, clearEditor }) => {
  const [search, setSearch] = useState('')
  const [githubToken, setGithubToken] = useState(localStorage.getItem('github_token'))
  const [selectedRepo, setSelectedRepo] = useState(localStorage.getItem('github_repo'))
  const [githubFolder, setGithubFolder] = useState(localStorage.getItem('github_folder') || '/inbox')
  const [showGitHubConfig, setShowGitHubConfig] = useState(false)

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

  const handleGitHubConfigSave = (config) => {
    setGithubToken(config.token)
    setSelectedRepo(config.repo)
    setGithubFolder(config.folder)
  }

  const saveToGitHub = async (content) => {
    if (!githubToken || !selectedRepo) {
      alert('Please configure GitHub first')
      return
    }

    try {
      const now = new Date()
      const timestamp = now.getFullYear().toString() + 
                       (now.getMonth() + 1).toString().padStart(2, '0') +
                       now.getDate().toString().padStart(2, '0') +
                       now.getHours().toString().padStart(2, '0') +
                       now.getMinutes().toString().padStart(2, '0') +
                       now.getSeconds().toString().padStart(2, '0')
      const filename = `${timestamp}.md`
      const folder = githubFolder.startsWith('/') ? githubFolder.slice(1) : githubFolder
      const path = folder ? `${folder}/${filename}` : filename
      
      const response = await fetch(`https://api.github.com/repos/${selectedRepo}/contents/${path}`, {
        method: 'PUT',
        headers: {
          'Authorization': `token ${githubToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: `Add document ${filename}`,
          content: btoa(content),
        })
      })

      if (response.ok) {
        if (clearEditor?.current) {
          clearEditor.current()
        }
      } else {
        const error = await response.json()
        alert(`Error saving to GitHub: ${error.message}`)
      }
    } catch (error) {
      console.error('Error saving to GitHub:', error)
      alert('Error saving to GitHub')
    }
  }

  if (!isOpen) return null

  return (
    <>
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
              {githubToken && selectedRepo ? (
                <Command.Item
                  onSelect={async () => {
                    const content = getCurrentContent?.current ? await getCurrentContent.current() : localStorage.getItem('editorContent') || ''
                    await saveToGitHub(content)
                    onClose()
                  }}
                  className="command-item"
                >
                  🚀 Save to GitHub ({selectedRepo}{githubFolder})
                </Command.Item>
              ) : (
                <Command.Item
                  onSelect={() => {
                    setShowGitHubConfig(true)
                  }}
                  className="command-item"
                >
                  ⚙️ Configure GitHub to Save
                </Command.Item>
              )}
            </Command.Group>
            <Command.Group heading="GitHub" className="command-group">
              <Command.Item
                onSelect={() => {
                  setShowGitHubConfig(true)
                }}
                className="command-item"
              >
                ⚙️ Configure GitHub
              </Command.Item>
              {githubToken && (
                <Command.Item
                  onSelect={() => {
                    localStorage.removeItem('github_token')
                    localStorage.removeItem('github_repo')
                    localStorage.removeItem('github_folder')
                    setGithubToken(null)
                    setSelectedRepo(null)
                    setGithubFolder('/inbox')
                  }}
                  className="command-item"
                >
                  🚪 Sign Out from GitHub
                </Command.Item>
              )}
            </Command.Group>
          </Command.List>
        </Command>
      </div>
      
      <GitHubConfig
        isOpen={showGitHubConfig}
        onClose={() => setShowGitHubConfig(false)}
        onSave={handleGitHubConfigSave}
      />
    </>
  )
}

export default CommandPalette