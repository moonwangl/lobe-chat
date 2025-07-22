import { Document, Packer, Paragraph, TextRun } from 'docx';
import { saveAs } from 'file-saver';
import { marked } from 'marked';

/**
 * Extract markdown blocks from a message content
 * @param content - The message content to extract markdown from
 * @returns Array of markdown blocks with their types
 */
export const extractMarkdownBlocks = (
  content: string,
): Array<{ content: string; type: string }> => {
  const blocks: Array<{ content: string; type: string }> = [];

  // Extract code blocks
  const codeBlockRegex = /```([\S\s]*?)```/g;
  let match;

  while ((match = codeBlockRegex.exec(content)) !== null) {
    const blockContent = match[1].trim();
    const lines = blockContent.split('\n');
    const language = lines[0] || 'text';

    // Remove the language identifier from the first line if it exists
    const actualContent =
      lines.length > 1 && lines[0].trim() && !lines[0].includes(' ')
        ? lines.slice(1).join('\n').trim()
        : blockContent;

    blocks.push({
      content: actualContent,
      type: `code-${language}`,
    });
  }

  // Extract other markdown elements (headers, lists, etc.)
  const lines = content.split('\n');
  let currentBlock = '';
  let blockType = 'text';

  for (const line of lines) {
    if (line.startsWith('#')) {
      if (currentBlock.trim()) {
        blocks.push({ content: currentBlock.trim(), type: blockType });
      }
      blockType = 'header';
      currentBlock = line;
    } else if (line.startsWith('- ') || line.startsWith('* ') || /^\d+\./.test(line)) {
      if (blockType !== 'list') {
        if (currentBlock.trim()) {
          blocks.push({ content: currentBlock.trim(), type: blockType });
        }
        blockType = 'list';
        currentBlock = line;
      } else {
        currentBlock += '\n' + line;
      }
    } else if (line.trim() === '') {
      if (currentBlock.trim()) {
        blocks.push({ content: currentBlock.trim(), type: blockType });
        currentBlock = '';
        blockType = 'text';
      }
    } else {
      if (blockType !== 'text' && currentBlock.trim()) {
        blocks.push({ content: currentBlock.trim(), type: blockType });
        currentBlock = line;
        blockType = 'text';
      } else {
        currentBlock += (currentBlock ? '\n' : '') + line;
      }
    }
  }

  if (currentBlock.trim()) {
    blocks.push({ content: currentBlock.trim(), type: blockType });
  }

  return blocks.filter((block) => block.content.trim() !== '');
};

/**
 * Convert markdown content to HTML
 * @param markdown - The markdown content to convert
 * @returns HTML string
 */
export const markdownToHtml = (markdown: string): string => {
  return marked(markdown).toString();
};

/**
 * Export content to DOCX format
 * @param content - The content to export
 * @param filename - The filename for the exported file
 */
export const exportToDocx = async (
  content: string,
  filename: string = 'document.docx',
): Promise<void> => {
  try {
    const blocks = extractMarkdownBlocks(content);
    const docParagraphs: Paragraph[] = [];

    for (const block of blocks) {
      if (block.type.startsWith('code-')) {
        // Add code block with monospace font
        const codeLines = block.content.split('\n');
        for (const line of codeLines) {
          docParagraphs.push(
            new Paragraph({
              children: [
                new TextRun({
                  font: 'Courier New',
                  size: 20, // 10pt
                  text: line,
                }),
              ],
              spacing: { after: 100 },
            }),
          );
        }
      } else if (block.type === 'header') {
        // Add header with larger font
        const headerLevel = (block.content.match(/^#+/) || [''])[0].length;
        const headerText = block.content.replace(/^#+\s*/, '');

        docParagraphs.push(
          new Paragraph({
            children: [
              new TextRun({
                bold: true,
                size: Math.max(24 - headerLevel * 2, 16), // Decreasing size for deeper headers,
                text: headerText,
              }),
            ],
            spacing: { after: 100, before: 200 },
          }),
        );
      } else if (block.type === 'list') {
        // Add list items
        const listItems = block.content.split('\n');
        for (const item of listItems) {
          const cleanItem = item.replace(/^[*-]\s*|^\d+\.\s*/, '');
          docParagraphs.push(
            new Paragraph({
              children: [
                new TextRun({
                  size: 22, // 11pt
                  text: `• ${cleanItem}`,
                }),
              ],
              spacing: { after: 100 },
            }),
          );
        }
      } else {
        // Add regular text
        const textLines = block.content.split('\n');
        for (const line of textLines) {
          if (line.trim()) {
            docParagraphs.push(
              new Paragraph({
                children: [
                  new TextRun({
                    size: 22, // 11pt
                    text: line,
                  }),
                ],
                spacing: { after: 100 },
              }),
            );
          }
        }
      }
    }

    const doc = new Document({
      sections: [
        {
          children: docParagraphs,
          properties: {},
        },
      ],
    });

    const buffer = await Packer.toBlob(doc);
    saveAs(buffer, filename);
  } catch (error) {
    console.error('Error exporting to DOCX:', error);
    throw new Error('Failed to export to DOCX format');
  }
};

/**
 * Download content as Markdown file
 * @param content - The markdown content to download
 * @param filename - The filename for the downloaded file
 */
export const downloadAsMarkdown = (content: string, filename: string = 'document.md'): void => {
  try {
    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
    saveAs(blob, filename);
  } catch (error) {
    console.error('Error downloading markdown:', error);
    throw new Error('Failed to download markdown file');
  }
};

/**
 * Copy content as HTML to clipboard
 * @param content - The message content to extract markdown blocks from and convert to HTML
 * @returns Promise that resolves when content is copied
 */
export const copyAsHtml = async (content: string): Promise<void> => {
  try {
    // Extract markdown blocks from the content
    const blocks = extractMarkdownBlocks(content);

    // Combine all extracted block content
    const markdownContent = blocks.map((block) => block.content).join('\n\n');

    // Convert the extracted markdown content to HTML
    const html = markdownToHtml(markdownContent);

    if (navigator.clipboard && navigator.clipboard.writeText) {
      // Use modern clipboard API if available
      await navigator.clipboard.writeText(html);
    } else {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = html;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.append(textArea);
      textArea.focus();
      textArea.select();
      document.execCommand('copy');
      textArea.remove();
    }
  } catch (error) {
    console.error('Error copying HTML:', error);
    throw new Error('Failed to copy HTML to clipboard');
  }
};

/**
 * Check if content contains markdown blocks
 * @param content - The content to check
 * @returns Boolean indicating if markdown blocks are present
 */
export const hasMarkdownBlocks = (content: string): boolean => {
  const codeBlockRegex = /```[\S\s]*?```/;
  const headerRegex = /^#+\s/m;
  const listRegex = /^[*-]\s|^\d+\./m;

  return codeBlockRegex.test(content) || headerRegex.test(content) || listRegex.test(content);
};
