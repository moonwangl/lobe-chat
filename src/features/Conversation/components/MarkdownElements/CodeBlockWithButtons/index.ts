import { MarkdownElement } from '../type';
import CodeBlockWithButtons from './Render';
import { rehypeCodeBlockWithButtons } from './rehypePlugin';

export const codeBlockWithButtons: MarkdownElement = {
  Component: CodeBlockWithButtons,
  rehypePlugin: rehypeCodeBlockWithButtons,
  tag: 'code-block-with-buttons',
};
