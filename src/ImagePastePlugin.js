import { useEffect } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $getSelection, $isRangeSelection, $insertNodes } from 'lexical';
import { $createImageNode } from './ImageNode';

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

export default ImagePastePlugin;