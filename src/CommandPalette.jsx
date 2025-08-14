import { useState, useEffect } from 'react'
import { Command } from 'cmdk'
import GitHubConfig from './GitHubConfig'
import './CommandPalette.css'

const CommandPalette = ({ isOpen, onClose, onSave, getCurrentContent, clearEditor, onLinkFiles, onFileSelect }) => {
  const [search, setSearch] = useState('')
  const [githubToken, setGithubToken] = useState(localStorage.getItem('github_token'))
  const [selectedRepo, setSelectedRepo] = useState(localStorage.getItem('github_repo'))
  const [githubFolder, setGithubFolder] = useState(localStorage.getItem('github_folder') || '/inbox')
  const [showGitHubConfig, setShowGitHubConfig] = useState(false)
  const [markdownFiles, setMarkdownFiles] = useState([])
  const [filesLoading, setFilesLoading] = useState(false)
  const [filesError, setFilesError] = useState('')

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown)
      loadMarkdownFiles()
      return () => document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, onClose])

  const loadMarkdownFiles = async () => {
    if (!githubToken || !selectedRepo) {
      return
    }

    setFilesLoading(true)
    setFilesError('')

    try {
      const folder = githubFolder.startsWith('/') ? githubFolder.slice(1) : githubFolder
      const apiUrl = `https://api.github.com/repos/${selectedRepo}/contents/${folder}`

      const response = await fetch(apiUrl, {
        headers: {
          'Authorization': `token ${githubToken}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      })

      if (!response.ok) {
        if (response.status === 404) {
          setFilesError(`Folder '${githubFolder}' not found`)
        } else {
          throw new Error(`Failed to fetch files: ${response.statusText}`)
        }
        return
      }

      const data = await response.json()
      
      const markdownFiles = data
        .filter(file => file.type === 'file' && file.name.endsWith('.md'))
        .map(file => ({
          name: file.name,
          path: file.path,
          downloadUrl: file.download_url
        }))
        .sort((a, b) => b.name.localeCompare(a.name))

      // Fetch content preview for each file using GitHub API
      const filesWithPreview = await Promise.all(
        markdownFiles.map(async (file) => {
          try {
            const contentApiUrl = `https://api.github.com/repos/${selectedRepo}/contents/${file.path}`
            const contentResponse = await fetch(contentApiUrl, {
              headers: {
                'Authorization': `token ${githubToken}`,
                'Accept': 'application/vnd.github.v3+json'
              }
            })
            
            if (contentResponse.ok) {
              const contentData = await contentResponse.json()
              // Decode base64 content with proper UTF-8 handling
              const content = new TextDecoder().decode(
                Uint8Array.from(atob(contentData.content), c => c.charCodeAt(0))
              )
              // Get first 100 characters, remove markdown syntax for cleaner preview
              const preview = content
                .replace(/^#+\s*/gm, '') // Remove heading markers
                .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold markers
                .replace(/\*(.*?)\*/g, '$1') // Remove italic markers
                .replace(/`(.*?)`/g, '$1') // Remove inline code markers
                .replace(/\n+/g, ' ') // Replace newlines with spaces
                .trim()
                .substring(0, 100)
              return { ...file, preview: preview || 'No content preview available' }
            }
          } catch (error) {
            console.warn(`Failed to fetch preview for ${file.name}:`, error)
          }
          return { ...file, preview: 'Preview unavailable' }
        })
      )

      setMarkdownFiles(filesWithPreview)
    } catch (err) {
      setFilesError(err.message)
    } finally {
      setFilesLoading(false)
    }
  }

  const handleFileSelect = (file) => {
    const fileName = file.name.endsWith('.md') ? file.name.slice(0, -3) : file.name
    const linkText = `[[${fileName}]]`
    onFileSelect?.(linkText)
    onClose()
  }

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
          content: btoa(new TextEncoder().encode(content).reduce((data, byte) => data + String.fromCharCode(byte), '')),
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
            {githubToken && selectedRepo && markdownFiles.length > 0 && (
              <Command.Group heading="Link Markdown Files" className="command-group">
                {markdownFiles.map((file) => (
                  <Command.Item
                    key={file.path}
                    onSelect={() => handleFileSelect(file)}
                    className="command-item"
                  >
                    <div className="file-info">
                      <div className="file-name">📄 {file.name}</div>
                      <div className="file-preview">{file.preview}</div>
                    </div>
                  </Command.Item>
                ))}
              </Command.Group>
            )}
            
            {githubToken && selectedRepo && filesLoading && (
              <Command.Group heading="Link Markdown Files" className="command-group">
                <Command.Item className="command-item loading-item">
                  Loading files...
                </Command.Item>
              </Command.Group>
            )}
            
            {githubToken && selectedRepo && filesError && (
              <Command.Group heading="Link Markdown Files" className="command-group">
                <Command.Item className="command-item error-item">
                  {filesError}
                </Command.Item>
              </Command.Group>
            )}

            {githubToken && selectedRepo && (
              <Command.Group heading="Actions" className="command-group">
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
              </Command.Group>
            )}
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