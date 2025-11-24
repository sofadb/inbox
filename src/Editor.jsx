import { useState, useEffect, useRef } from 'react';
import Editor from '@monaco-editor/react';
import CommandPalette from './CommandPalette';
import { saveToGitHub } from './githubService';
import CommandPaletteButton from './CommandPaletteButton';
import { useCommandPalette } from './useCommandPalette';


export default function MonacoEditor() {
  const [isSaving, setIsSaving] = useState(false);
  const [content, setContent] = useState('');
  const editorRef = useRef(null);
  const monacoRef = useRef(null);

  // Load initial content from localStorage
  useEffect(() => {
    const savedContent = localStorage.getItem('editorContent');
    if (savedContent) {
      // Try to parse as JSON first (old Lexical format)
      try {
        const parsed = JSON.parse(savedContent);
        if (parsed.root) {
          // It's Lexical format, just clear it and start fresh
          setContent('');
        } else {
          setContent(savedContent);
        }
      } catch {
        // It's plain text/markdown
        setContent(savedContent);
      }
    }
  }, []);

  // Auto-save to localStorage
  useEffect(() => {
    if (content !== null && content !== undefined) {
      const timeoutId = setTimeout(() => {
        if (content.trim()) {
          localStorage.setItem('editorContent', content);
        } else {
          localStorage.removeItem('editorContent');
        }
      }, 1000);

      return () => clearTimeout(timeoutId);
    }
  }, [content]);

  const handleEditorDidMount = (editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;
    
    // Focus the editor
    editor.focus();
  };

  const handleChange = (value) => {
    setContent(value || '');
  };

  const getCurrentContent = useRef(() => {
    return Promise.resolve(content);
  });

  const clearEditor = useRef(() => {
    setContent('');
    if (editorRef.current) {
      editorRef.current.setValue('');
    }
  });

  const insertText = useRef((text) => {
    if (editorRef.current) {
      const selection = editorRef.current.getSelection();
      const id = { major: 1, minor: 1 };
      const op = {
        identifier: id,
        range: selection,
        text: text,
        forceMoveMarkers: true
      };
      editorRef.current.executeEdits('insert-text', [op]);
      editorRef.current.focus();
    }
  });

  const focusEditor = useRef(() => {
    if (editorRef.current) {
      editorRef.current.focus();
    }
  });

  const handleDirectGitHubSave = async () => {
    if (isSaving) return;
    
    setIsSaving(true);
    
    try {
      await saveToGitHub(content, clearEditor.current);
    } finally {
      setIsSaving(false);
    }
  };

  const { isCommandPaletteOpen, handleCommandPaletteOpen, handleCommandPaletteClose } = useCommandPalette(handleDirectGitHubSave, focusEditor);

  const handleFileSelect = (linkText) => {
    insertText.current(linkText);
  };

  const handleSave = () => {
    console.log('Saving content:', content);
    localStorage.setItem('editorContent', content);
    alert('Content saved!');
  };

  return (
    <div className="editor-container">
      <div className="editor-inner" style={{ position: 'relative', height: '100vh' }}>
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
        <Editor
          height="100vh"
          defaultLanguage="markdown"
          value={content}
          onChange={handleChange}
          onMount={handleEditorDidMount}
          theme="vs-light"
          options={{
            minimap: { enabled: false },
            fontSize: 16,
            lineNumbers: 'on',
            wordWrap: 'on',
            wrappingIndent: 'same',
            scrollBeyondLastLine: false,
            automaticLayout: true,
            padding: { top: 16, bottom: 16 },
            readOnly: isSaving,
            quickSuggestions: false,
            suggestOnTriggerCharacters: false,
            acceptSuggestionOnEnter: 'off',
            tabCompletion: 'off',
            wordBasedSuggestions: 'off',
          }}
        />
      </div>
      <CommandPaletteButton onClick={handleCommandPaletteOpen} />
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={handleCommandPaletteClose}
        onSave={handleSave}
        getCurrentContent={getCurrentContent}
        clearEditor={clearEditor}
        onFileSelect={handleFileSelect}
      />
    </div>
  );
}