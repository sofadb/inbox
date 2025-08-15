import React from 'react';
import { DecoratorNode, $applyNodeReplacement } from 'lexical';

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
    return React.createElement('img', {
      src: this.__src,
      alt: this.__altText,
      style: {
        width: this.__width,
        height: this.__height,
        maxWidth: '100%',
        display: 'block',
        margin: '10px 0',
      }
    });
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

export { ImageNode, $createImageNode, $isImageNode };