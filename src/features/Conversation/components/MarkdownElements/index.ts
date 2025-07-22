import { codeBlockWithButtons } from './CodeBlockWithButtons';
import LobeArtifact from './LobeArtifact';
import LobeThinking from './LobeThinking';
import LocalFile from './LocalFile';
import Thinking from './Thinking';
import { MarkdownElement } from './type';

export const markdownElements: MarkdownElement[] = [
  Thinking,
  LobeArtifact,
  LobeThinking,
  LocalFile,
  codeBlockWithButtons,
];
