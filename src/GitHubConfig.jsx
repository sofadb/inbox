import { useState, useEffect } from 'react'
import './GitHubConfig.css'

const GitHubConfig = ({ isOpen, onClose, onSave }) => {
  const [step, setStep] = useState(1)
  const [token, setToken] = useState('')
  const [repos, setRepos] = useState([])
  const [selectedRepo, setSelectedRepo] = useState('')
  const [folder, setFolder] = useState('/inbox')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (isOpen) {
      // Reset form when opening
      setStep(1)
      setToken('')
      setRepos([])
      setSelectedRepo('')
      setFolder('/inbox')
      setError('')
    }
  }, [isOpen])

  const validateToken = async () => {
    if (!token.trim()) {
      setError('Please enter a Personal Access Token')
      return
    }

    setLoading(true)
    setError('')

    try {
      const response = await fetch('https://api.github.com/user/repos?sort=updated&per_page=100', {
        headers: {
          'Authorization': `token ${token.trim()}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      })

      if (!response.ok) {
        throw new Error('Invalid token or insufficient permissions')
      }

      const repoData = await response.json()
      setRepos(repoData)
      setStep(2)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = () => {
    if (!selectedRepo) {
      setError('Please select a repository')
      return
    }

    const config = {
      token: token.trim(),
      repo: selectedRepo,
      folder: folder || '/inbox'
    }

    localStorage.setItem('github_token', config.token)
    localStorage.setItem('github_repo', config.repo)
    localStorage.setItem('github_folder', config.folder)

    onSave(config)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="github-config-overlay">
      <div className="github-config-modal">
        <div className="github-config-header">
          <h2>Configure GitHub Integration</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>

        {step === 1 && (
          <div className="github-config-step">
            <div className="step-indicator">
              <span className="step-number active">1</span>
              <span className="step-number">2</span>
              <span className="step-number">3</span>
            </div>

            <h3>Generate Personal Access Token</h3>
            
            <div className="instructions">
              <p>Follow these steps to create a GitHub Personal Access Token:</p>
              <ol>
                <li>Go to <a href="https://github.com/settings/tokens" target="_blank" rel="noopener noreferrer">GitHub Settings → Developer settings → Personal access tokens</a></li>
                <li>Click <strong>"Generate new token (classic)"</strong></li>
                <li>Give it a descriptive name (e.g., "Markdown Editor")</li>
                <li>Select the <strong>"repo"</strong> scope for repository access</li>
                <li>Click <strong>"Generate token"</strong></li>
                <li>Copy the token and paste it below</li>
              </ol>
            </div>

            <div className="form-group">
              <label htmlFor="token">Personal Access Token</label>
              <input
                id="token"
                type="password"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                className="token-input"
              />
              {error && <div className="error-message">{error}</div>}
            </div>

            <div className="form-actions">
              <button 
                onClick={validateToken} 
                disabled={loading || !token.trim()}
                className="primary-button"
              >
                {loading ? 'Validating...' : 'Continue'}
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="github-config-step">
            <div className="step-indicator">
              <span className="step-number completed">✓</span>
              <span className="step-number active">2</span>
              <span className="step-number">3</span>
            </div>

            <h3>Select Repository</h3>
            
            <div className="form-group">
              <label htmlFor="repo">Choose repository to save documents:</label>
              <div className="repo-list">
                {repos.map((repo) => (
                  <div 
                    key={repo.id}
                    className={`repo-item ${selectedRepo === repo.full_name ? 'selected' : ''}`}
                    onClick={() => setSelectedRepo(repo.full_name)}
                  >
                    <div className="repo-info">
                      <div className="repo-name">{repo.full_name}</div>
                      {repo.description && (
                        <div className="repo-description">{repo.description}</div>
                      )}
                    </div>
                    <div className="repo-visibility">
                      {repo.private ? '🔒 Private' : '🌍 Public'}
                    </div>
                  </div>
                ))}
              </div>
              {error && <div className="error-message">{error}</div>}
            </div>

            <div className="form-actions">
              <button 
                onClick={() => setStep(1)} 
                className="secondary-button"
              >
                Back
              </button>
              <button 
                onClick={() => setStep(3)} 
                disabled={!selectedRepo}
                className="primary-button"
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="github-config-step">
            <div className="step-indicator">
              <span className="step-number completed">✓</span>
              <span className="step-number completed">✓</span>
              <span className="step-number active">3</span>
            </div>

            <h3>Configure Folder</h3>
            
            <div className="config-summary">
              <h4>Configuration Summary:</h4>
              <div className="summary-item">
                <strong>Repository:</strong> {selectedRepo}
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="folder">Folder path (where documents will be saved):</label>
              <input
                id="folder"
                type="text"
                value={folder}
                onChange={(e) => setFolder(e.target.value)}
                placeholder="/inbox"
                className="folder-input"
              />
              <div className="help-text">
                Documents will be saved as: <code>{selectedRepo}{folder}/document-YYYY-MM-DD-HHMMSS.md</code>
              </div>
            </div>

            <div className="form-actions">
              <button 
                onClick={() => setStep(2)} 
                className="secondary-button"
              >
                Back
              </button>
              <button 
                onClick={handleSave}
                className="primary-button save-button"
              >
                Save Configuration
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default GitHubConfig