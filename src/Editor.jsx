import { $getRoot, $createParagraphNode, $createTextNode } from 'lexical';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';

const theme = {
  paragraph: 'editor-paragraph',
};

function onError(error) {
  console.error(error);
}

const initialConfig = {
  namespace: 'MyEditor',
  theme,
  onError,
};

export default function Editor() {
  return (
    <div className="editor-container">
      <LexicalComposer initialConfig={initialConfig}>
        <div className="editor-inner">
          <RichTextPlugin
            contentEditable={
              <ContentEditable 
                className="editor-input" 
                ariaLabel="Write your text here..."
              />
            }
            placeholder={
              <div className="editor-placeholder">
                Start typing...
              </div>
            }
            ErrorBoundary={LexicalErrorBoundary}
          />
          <HistoryPlugin />
        </div>
      </LexicalComposer>
    </div>
  );
}