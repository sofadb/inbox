import { ImageNode, $createImageNode, $isImageNode } from './ImageNode';

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

export { IMAGE_TRANSFORMER };