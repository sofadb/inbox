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
import { $convertToMarkdownString, $convertFromMarkdownString, ELEMENT_TRANSFORMERS, TEXT_FORMAT_TRANSFORMERS, TEXT_MATCH_TRANSFORMERS } from '@lexical/markdown';
import { $getRoot, $getSelection, $isRangeSelection, DecoratorNode, $applyNodeReplacement, $insertNodes } from 'lexical';
import CommandPalette from './CommandPalette';

class ImageNode extends DecoratorNode {
  constructor(src, altText, width, height, key) {
    super(key);
    this.__src = src;
    this.__altText = altText;
    this.__width = width || 'inherit';
    this.__height = height || 'inherit';
  }

  static getType() {
    return 'image';
  }

  static clone(node) {
    return new ImageNode(
      node.__src,
      node.__altText,
      node.__width,
      node.__height,
      node.__key,
    );
  }

  static importJSON(serializedNode) {
    const { altText, height, width, src } = serializedNode;
    return $createImageNode({
      altText,
      height,
      src,
      width,
    });
  }

  exportJSON() {
    return {
      altText: this.getAltText(),
      height: this.__height === 'inherit' ? 0 : this.__height,
      src: this.getSrc(),
      type: 'image',
      version: 1,
      width: this.__width === 'inherit' ? 0 : this.__width,
    };
  }

  getSrc() {
    return this.__src;
  }

  getAltText() {
    return this.__altText;
  }

  setAltText(altText) {
    const writable = this.getWritable();
    writable.__altText = altText;
  }

  createDOM() {
    const element = document.createElement('span');
    element.style.display = 'inline-block';
    return element;
  }

  updateDOM() {
    return false;
  }

  decorate() {
    return (
      <img
        src={this.__src}
        alt={this.__altText}
        style={{
          width: this.__width,
          height: this.__height,
          maxWidth: '100%',
          display: 'block',
          margin: '10px 0',
        }}
      />
    );
  }

  exportDOM() {
    const element = document.createElement('img');
    element.setAttribute('src', this.__src);
    element.setAttribute('alt', this.__altText);
    if (this.__width !== 'inherit') {
      element.setAttribute('width', this.__width.toString());
    }
    if (this.__height !== 'inherit') {
      element.setAttribute('height', this.__height.toString());
    }
    return { element };
  }
}

function $createImageNode({
  altText,
  height,
  src,
  width,
  key,
}) {
  return $applyNodeReplacement(
    new ImageNode(src, altText, width, height, key),
  );
}

function $isImageNode(node) {
  return node instanceof ImageNode;
}

const IMAGE_TRANSFORMER = {
  dependencies: [ImageNode],
  export: (node) => {
    if (!$isImageNode(node)) {
      return null;
    }
    return `![${node.getAltText()}](${node.getSrc()})`;
  },
  importRegExp: /^!\[([^\]]*)\]\(([^)]+)\)$/,
  regExp: /^!\[([^\]]*)\]\(([^)]+)\)$/,
  replace: (textNode, match) => {
    const [, altText, src] = match;
    const imageNode = $createImageNode({
      altText,
      src,
      width: 'inherit',
      height: 'inherit',
    });
    textNode.replace(imageNode);
  },
  trigger: ')',
  type: 'text-match',
};

const CUSTOM_TRANSFORMERS = [
  ...ELEMENT_TRANSFORMERS,
  ...TEXT_FORMAT_TRANSFORMERS,
  ...TEXT_MATCH_TRANSFORMERS,
  IMAGE_TRANSFORMER,
];

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
    ImageNode,
  ],
};

function SavePlugin({ onSave, saveCallback, getCurrentContent, clearEditor, isSaving, insertText, focusEditor, loadInitialContent }) {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    const saveHandler = () => {
      editor.read(() => {
        const markdown = $convertToMarkdownString(CUSTOM_TRANSFORMERS);
        saveCallback(markdown);
      });
    };

    const getContentHandler = () => {
      return new Promise((resolve) => {
        editor.read(() => {
          const markdown = $convertToMarkdownString(CUSTOM_TRANSFORMERS);
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

    const focusEditorHandler = () => {
      editor.focus();
    };

    onSave.current = saveHandler;
    getCurrentContent.current = getContentHandler;
    clearEditor.current = clearEditorHandler;
    insertText.current = insertTextHandler;
    focusEditor.current = focusEditorHandler;
  }, [editor, onSave, saveCallback, getCurrentContent, clearEditor, insertText, focusEditor]);

  useEffect(() => {
    editor.setEditable(!isSaving);
  }, [editor, isSaving]);

  useEffect(() => {
    if (loadInitialContent) {
      const savedContent = localStorage.getItem('editorContent');
      if (savedContent && savedContent.trim()) {
        editor.update(() => {
          const root = $getRoot();
          const currentContent = $convertToMarkdownString(CUSTOM_TRANSFORMERS);
          if (!currentContent.trim()) {
            root.clear();
            $convertFromMarkdownString(savedContent, CUSTOM_TRANSFORMERS);
          }
        });
      }
    }
  }, [editor, loadInitialContent]);

  useEffect(() => {
    const autoSave = () => {
      editor.read(() => {
        const markdown = $convertToMarkdownString(CUSTOM_TRANSFORMERS);
        if (markdown.trim()) {
          localStorage.setItem('editorContent', markdown);
        } else {
          localStorage.removeItem('editorContent');
        }
      });
    };

    const intervalId = setInterval(autoSave, 1000);

    return () => clearInterval(intervalId);
  }, [editor]);

  return null;
}

function ImagePastePlugin() {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    const handlePaste = (event) => {
      const items = event.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.type.indexOf('image') !== -1) {
          event.preventDefault();
          const file = item.getAsFile();
          if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
              const dataURL = e.target.result;
              const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
              
              editor.update(() => {
                const selection = $getSelection();
                if ($isRangeSelection(selection)) {
                  const imageNode = $createImageNode({
                    src: dataURL,
                    altText: `Pasted image ${timestamp}`,
                    width: 'inherit',
                    height: 'inherit',
                  });
                  $insertNodes([imageNode]);
                }
              });
            };
            reader.readAsDataURL(file);
          }
          break;
        }
      }
    };

    const editorElement = editor.getRootElement();
    if (editorElement) {
      editorElement.addEventListener('paste', handlePaste);
      return () => {
        editorElement.removeEventListener('paste', handlePaste);
      };
    }
  }, [editor]);

  return null;
}

export default function Editor() {
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [loadInitialContent] = useState(true);
  const saveHandler = { current: null };
  const getCurrentContent = { current: null };
  const clearEditor = { current: null };
  const insertText = { current: null };
  const focusEditor = { current: null };

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
            content: btoa(new TextEncoder().encode(content).reduce((data, byte) => data + String.fromCharCode(byte), '')),
          })
        });

        if (response.ok) {
          if (clearEditor?.current) {
            clearEditor.current();
            localStorage.removeItem('editorContent');
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
  }, []);

  const handleFileSelect = (linkText) => {
    if (insertText.current) {
      insertText.current(linkText);
    }
  };

  const handleCommandPaletteClose = () => {
    setIsCommandPaletteOpen(false);
    setTimeout(() => {
      if (focusEditor.current) {
        focusEditor.current();
      }
    }, 100);
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
          <MarkdownShortcutPlugin transformers={CUSTOM_TRANSFORMERS} />
          <ImagePastePlugin />
          <SavePlugin onSave={saveHandler} saveCallback={handleContentSave} getCurrentContent={getCurrentContent} clearEditor={clearEditor} isSaving={isSaving} insertText={insertText} focusEditor={focusEditor} loadInitialContent={loadInitialContent} />
        </div>
      </LexicalComposer>
      <button
        onClick={() => setIsCommandPaletteOpen(true)}
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