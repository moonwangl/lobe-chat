import { visit } from 'unist-util-visit';

/**
 * Extract text content from a code element
 */
function extractTextContent(element: any): string {
  let text = '';

  function traverse(node: any) {
    if (node.type === 'text') {
      text += node.value;
    } else if (node.children) {
      node.children.forEach(traverse);
    }
  }

  traverse(element);
  return text;
}

/**
 * Extract language from className array (e.g., ['language-javascript'] -> 'javascript')
 */
function getLanguageFromClass(classNames: string[]): string {
  for (const className of classNames) {
    if (className.startsWith('language-')) {
      return className.replace('language-', '');
    }
  }
  return '';
}

/**
 * Rehype plugin that wraps code blocks with a custom component
 * This allows us to add word function buttons inside code blocks
 */
export const rehypeCodeBlockWithButtons = () => {
  return (tree: any) => {
    visit(tree, 'element', (node: any, index, parent) => {
      // Look for pre > code elements (markdown code blocks)
      if (
        node.tagName === 'pre' &&
        node.children &&
        node.children.length > 0 &&
        node.children[0].type === 'element' &&
        node.children[0].tagName === 'code'
      ) {
        const codeElement = node.children[0];
        const codeContent = extractTextContent(codeElement);

        // Only wrap if the code block has substantial content
        if (codeContent && codeContent.trim().length > 10) {
          // Create wrapper element with our custom tag
          const wrapper = {
            children: [node], // Wrap the original pre element
            properties: {
              codeContent: codeContent,
              language: getLanguageFromClass(codeElement.properties?.className || []),
            },
            tagName: 'code-block-with-buttons',
            type: 'element',
          };

          // Replace the pre element with our wrapper
          if (parent && typeof index === 'number') {
            parent.children[index] = wrapper;
          }
        }
      }
    });
  };
};
