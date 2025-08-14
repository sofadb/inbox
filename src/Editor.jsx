import { useState, useEffect } from 'react';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
import { MarkdownShortcutPlugin } from '@lexical/react/LexicalMarkdownShortcutPlugin';
import { ListPlugin } from '@lexical/react/LexicalListPlugin';
import { TabIndentationPlugin } from '@lexical/react/LexicalTabIndentationPlugin';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { HeadingNode, QuoteNode } from '@lexical/rich-text';
import { ListItemNode, ListNode } from '@lexical/list';
import { CodeNode } from '@lexical/code';
import { LinkNode } from '@lexical/link';
import { TRANSFORMERS, $convertToMarkdownString } from '@lexical/markdown';
import { $getRoot, $getSelection, $isRangeSelection } from 'lexical';
import CommandPalette from './CommandPalette';

const theme = {
  paragraph: 'editor-paragraph',
  heading: {
    h1: 'editor-heading-h1',
    h2: 'editor-heading-h2',
    h3: 'editor-heading-h3',
  },
  list: {
    ul: 'editor-list-ul',
    ol: 'editor-list-ol',
    listitem: 'editor-listitem',
    nested: {
      listitem: 'editor-nested-listitem',
    },
  },
  quote: 'editor-quote',
  code: 'editor-code',
  link: 'editor-link',
};

function onError(error) {
  console.error(error);
}

const initialConfig = {
  namespace: 'SimpleMarkdownEditor',
  theme,
  onError,
  nodes: [
    HeadingNode,
    ListNode,
    ListItemNode,
    QuoteNode,
    CodeNode,
    LinkNode,
  ],
};

function SavePlugin({ onSave, saveCallback, getCurrentContent, clearEditor, isSaving, insertText }) {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    const saveHandler = () => {
      editor.read(() => {
        const markdown = $convertToMarkdownString(TRANSFORMERS);
        saveCallback(markdown);
      });
    };

    const getContentHandler = () => {
      return new Promise((resolve) => {
        editor.read(() => {
          const markdown = $convertToMarkdownString(TRANSFORMERS);
          resolve(markdown);
        });
      });
    };

    const clearEditorHandler = () => {
      editor.update(() => {
        const root = $getRoot();
        root.clear();
      });
    };

    const insertTextHandler = (text) => {
      editor.update(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
          selection.insertText(text);
        }
      });
    };

    onSave.current = saveHandler;
    getCurrentContent.current = getContentHandler;
    clearEditor.current = clearEditorHandler;
    insertText.current = insertTextHandler;
  }, [editor, onSave, saveCallback, getCurrentContent, clearEditor, insertText]);

  useEffect(() => {
    editor.setEditable(!isSaving);
  }, [editor, isSaving]);

  return null;
}

export default function Editor() {
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const saveHandler = { current: null };
  const getCurrentContent = { current: null };
  const clearEditor = { current: null };
  const insertText = { current: null };

  const handleDirectGitHubSave = async () => {
    if (isSaving) return; // Prevent multiple saves
    
    const githubToken = localStorage.getItem('github_token');
    const selectedRepo = localStorage.getItem('github_repo');
    
    if (!githubToken || !selectedRepo) {
      alert('Please configure GitHub first (Ctrl+Enter)');
      return;
    }

    if (getCurrentContent?.current) {
      setIsSaving(true);
      
      try {
        const content = await getCurrentContent.current();
        
        // Same logic as in CommandPalette
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
            content: btoa(content),
          })
        });

        if (response.ok) {
          if (clearEditor?.current) {
            clearEditor.current();
          }
        } else {
          const error = await response.json();
          alert(`Error saving to GitHub: ${error.message}`);
        }
      } catch (error) {
        console.error('Error saving to GitHub:', error);
        alert('Error saving to GitHub');
      } finally {
        setIsSaving(false);
      }
    }
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.ctrlKey && e.key === 'Enter') {
        e.preventDefault();
        setIsCommandPaletteOpen(true);
      } else if (e.altKey && e.key === 'Enter') {
        e.preventDefault();
        handleDirectGitHubSave();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleFileSelect = (linkText) => {
    if (insertText.current) {
      insertText.current(linkText);
    }
  };

  const handleSave = () => {
    if (saveHandler.current) {
      saveHandler.current();
    }
  };

  const handleContentSave = (content) => {
    console.log('Saving content:', content);
    localStorage.setItem('editorContent', content);
    alert('Content saved!');
  };

  return (
    <div className="editor-container">
      <LexicalComposer initialConfig={initialConfig}>
        <div className="editor-inner" style={{ position: 'relative' }}>
          <RichTextPlugin
            contentEditable={
              <ContentEditable 
                className="editor-input" 
                ariaLabel="Write your markdown here..."
              />
            }
            placeholder={
              <div className="editor-placeholder">
                {isSaving ? 'Saving...' : 'Start writing markdown... (Ctrl+Enter: command palette, Alt+Enter: save to GitHub)'}
              </div>
            }
            ErrorBoundary={LexicalErrorBoundary}
          />
          {isSaving && (
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(255, 255, 255, 0.8)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '18px',
              fontWeight: 'bold',
              color: '#667eea',
              zIndex: 10
            }}>
              Saving...
            </div>
          )}
          <HistoryPlugin />
          <ListPlugin />
          <TabIndentationPlugin />
          <MarkdownShortcutPlugin transformers={TRANSFORMERS} />
          <SavePlugin onSave={saveHandler} saveCallback={handleContentSave} getCurrentContent={getCurrentContent} clearEditor={clearEditor} isSaving={isSaving} insertText={insertText} />
        </div>
      </LexicalComposer>
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onSave={handleSave}
        getCurrentContent={getCurrentContent}
        clearEditor={clearEditor}
        onFileSelect={handleFileSelect}
      />
    </div>
  );
}