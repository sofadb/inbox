import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
import { MarkdownShortcutPlugin } from '@lexical/react/LexicalMarkdownShortcutPlugin';
import { ListPlugin } from '@lexical/react/LexicalListPlugin';
import { TabIndentationPlugin } from '@lexical/react/LexicalTabIndentationPlugin';
import { HeadingNode, QuoteNode } from '@lexical/rich-text';
import { ListItemNode, ListNode } from '@lexical/list';
import { CodeNode } from '@lexical/code';
import { LinkNode } from '@lexical/link';
import { TRANSFORMERS } from '@lexical/markdown';

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

export default function Editor() {
  return (
    <div className="editor-container">
      <LexicalComposer initialConfig={initialConfig}>
        <div className="editor-inner">
          <RichTextPlugin
            contentEditable={
              <ContentEditable 
                className="editor-input" 
                ariaLabel="Write your markdown here..."
              />
            }
            placeholder={
              <div className="editor-placeholder">
                Start writing markdown...
              </div>
            }
            ErrorBoundary={LexicalErrorBoundary}
          />
          <HistoryPlugin />
          <ListPlugin />
          <TabIndentationPlugin />
          <MarkdownShortcutPlugin transformers={TRANSFORMERS} />
        </div>
      </LexicalComposer>
    </div>
  );
}