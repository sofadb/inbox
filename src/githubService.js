export const saveToGitHub = async (content, clearEditor) => {
  const githubToken = localStorage.getItem('github_token');
  const selectedRepo = localStorage.getItem('github_repo');
  
  if (!githubToken || !selectedRepo) {
    alert('Please configure GitHub first (Ctrl+Enter)');
    return false;
  }

  try {
    const githubFolder = localStorage.getItem('github_folder') || '/inbox';
    const now = new Date();
    const timestamp = now.getFullYear().toString() + 
                     (now.getMonth() + 1).toString().padStart(2, '0') +
                     now.getDate().toString().padStart(2, '0') +
                     now.getHours().toString().padStart(2, '0') +
                     now.getMinutes().toString().padStart(2, '0') +
                     now.getSeconds().toString().padStart(2, '0');
    const filename = `${timestamp}.md`;
    const folder = githubFolder.startsWith('/') ? githubFolder.slice(1) : githubFolder;
    const path = folder ? `${folder}/${filename}` : filename;
    
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
    });

    if (response.ok) {
      if (clearEditor) {
        clearEditor();
        localStorage.removeItem('editorContent');
      }
      return true;
    } else {
      const error = await response.json();
      alert(`Error saving to GitHub: ${error.message}`);
      return false;
    }
  } catch (error) {
    console.error('Error saving to GitHub:', error);
    alert('Error saving to GitHub');
    return false;
  }
};