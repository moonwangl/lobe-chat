import {
  AlignmentType,
  Document,
  HeadingLevel,
  NumberFormat,
  Packer,
  Paragraph,
  TextRun,
} from 'docx';
import { saveAs } from 'file-saver';
import { marked } from 'marked';

/**
 * Parse markdown content into structured blocks
 * @param content - The markdown content to parse
 * @returns Array of parsed blocks with their types and content
 */
export const parseMarkdownContent = (
  content: string,
): Array<{ content: string; level?: number; listType?: 'bullet' | 'numbered'; type: string }> => {
  const blocks: Array<{
    content: string;
    level?: number;
    listType?: 'bullet' | 'numbered';
    type: string;
  }> = [];
  const lines = content.split('\n');

  let i = 0;
  while (i < lines.length) {
    const line = lines[i];

    // Skip empty lines
    if (line.trim() === '') {
      i++;
      continue;
    }

    // Handle code blocks
    if (line.startsWith('```')) {
      let codeContent = '';
      i++;

      while (i < lines.length && !lines[i].startsWith('```')) {
        codeContent += (codeContent ? '\n' : '') + lines[i];
        i++;
      }

      blocks.push({
        content: codeContent,
        level: 0,
        type: 'code',
      });
      i++; // Skip closing ```
      continue;
    }

    // Handle headers
    const headerMatch = line.match(/^(#{1,6})\s+(.+)$/);
    if (headerMatch) {
      blocks.push({
        content: headerMatch[2],
        level: headerMatch[1].length,
        type: 'header',
      });
      i++;
      continue;
    }

    // Handle numbered lists
    const numberedListMatch = line.match(/^(\s*)(\d+)\.(\s+)(.+)$/);
    if (numberedListMatch) {
      blocks.push({
        content: numberedListMatch[4],
        level: Math.floor(numberedListMatch[1].length / 2),
        listType: 'numbered',
        type: 'list',
      });
      i++;
      continue;
    }

    // Handle bullet lists
    const bulletListMatch = line.match(/^(\s*)[*+-](\s+)(.+)$/);
    if (bulletListMatch) {
      blocks.push({
        content: bulletListMatch[3],
        level: Math.floor(bulletListMatch[1].length / 2),
        listType: 'bullet',
        type: 'list',
      });
      i++;
      continue;
    }

    // Handle regular text (may span multiple lines)
    let textContent = line;
    i++;

    // Collect consecutive non-special lines as a single paragraph
    while (i < lines.length) {
      const nextLine = lines[i];

      // Stop if we hit a special line or empty line
      if (
        nextLine.trim() === '' ||
        nextLine.startsWith('#') ||
        nextLine.startsWith('```') ||
        /^\s*\d+\.\s/.test(nextLine) ||
        /^\s*[*+-]\s/.test(nextLine)
      ) {
        break;
      }

      textContent += '\n' + nextLine;
      i++;
    }

    if (textContent.trim()) {
      blocks.push({
        content: textContent.trim(),
        type: 'text',
      });
    }
  }

  return blocks;
};

/**
 * Extract markdown blocks from a message content (legacy function for compatibility)
 * @param content - The message content to extract markdown from
 * @returns Array of markdown blocks with their types
 */
export const extractMarkdownBlocks = (
  content: string,
): Array<{ content: string; type: string }> => {
  return parseMarkdownContent(content).map((block) => ({
    content: block.content,
    type: block.type === 'code' ? `code-text` : block.type,
  }));
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
 * Get Word heading level from markdown header level
 * @param level - Markdown header level (1-6)
 * @returns Word HeadingLevel
 */
const getHeadingLevel = (level: number) => {
  switch (level) {
    case 1: {
      return HeadingLevel.HEADING_1;
    }
    case 2: {
      return HeadingLevel.HEADING_2;
    }
    case 3: {
      return HeadingLevel.HEADING_3;
    }
    case 4: {
      return HeadingLevel.HEADING_4;
    }
    case 5: {
      return HeadingLevel.HEADING_5;
    }
    case 6: {
      return HeadingLevel.HEADING_6;
    }
    default: {
      return HeadingLevel.HEADING_1;
    }
  }
};

/**
 * Export content to DOCX format with proper Word formatting
 * @param content - The content to export
 * @param filename - The filename for the exported file
 */
export const exportToDocx = async (
  content: string,
  filename: string = 'document.docx',
): Promise<void> => {
  try {
    const blocks = parseMarkdownContent(content);
    const docParagraphs: Paragraph[] = [];

    let lastListLevel = -1;
    let listCounters: { [key: number]: number } = {};

    for (const block of blocks) {
      switch (block.type) {
        case 'header': {
          // Add proper Word heading
          docParagraphs.push(
            new Paragraph({
              children: [
                new TextRun({
                  bold: true,
                  text: block.content,
                }),
              ],
              heading: getHeadingLevel(block.level || 1),
              spacing: {
                after: 240, // 12pt
                before: 240, // 12pt
              },
            }),
          );
          break;
        }

        case 'code': {
          // Add code block with proper formatting
          const codeLines = block.content.split('\n');
          for (const line of codeLines) {
            docParagraphs.push(
              new Paragraph({
                children: [
                  new TextRun({
                    font: 'Courier New',
                    size: 20, // 10pt
                    text: line || ' ', // Ensure empty lines are preserved
                  }),
                ],
                spacing: { after: 0 },
                style: 'Code',
              }),
            );
          }
          // Add spacing after code block
          docParagraphs.push(
            new Paragraph({
              children: [new TextRun({ text: '' })],
              spacing: { after: 240 },
            }),
          );
          break;
        }

        case 'list': {
          const currentLevel = block.level || 0;

          if (block.listType === 'numbered') {
            // Handle numbered lists with proper numbering
            if (currentLevel !== lastListLevel) {
              // Reset counter for new level or restart
              if (currentLevel <= lastListLevel || lastListLevel === -1) {
                listCounters[currentLevel] = 1;
              }
            } else {
              listCounters[currentLevel] = (listCounters[currentLevel] || 0) + 1;
            }

            const indent = currentLevel * 720; // 0.5 inch per level

            docParagraphs.push(
              new Paragraph({
                children: [
                  new TextRun({
                    size: 22, // 11pt
                    text: block.content,
                  }),
                ],
                indent: {
                  left: indent,
                },
                numbering: {
                  level: currentLevel,
                  reference: 'numbered-list',
                },
                spacing: { after: 120 }, // 6pt
              }),
            );
          } else {
            // Handle bullet lists
            const indent = currentLevel * 720; // 0.5 inch per level

            docParagraphs.push(
              new Paragraph({
                bullet: {
                  level: currentLevel,
                },
                children: [
                  new TextRun({
                    size: 22, // 11pt
                    text: block.content,
                  }),
                ],
                indent: {
                  left: indent,
                },
                spacing: { after: 120 }, // 6pt
              }),
            );
          }

          lastListLevel = currentLevel;
          break;
        }

        default: {
          // Add regular paragraph
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
                  spacing: { after: 120 }, // 6pt
                }),
              );
            }
          }
          break;
        }
      }
    }

    const doc = new Document({
      numbering: {
        config: [
          {
            levels: [
              {
                alignment: AlignmentType.START,
                format: NumberFormat.DECIMAL,
                level: 0,
                style: {
                  paragraph: {
                    indent: { hanging: 260, left: 720 },
                  },
                },
                text: '%1.',
              },
              {
                alignment: AlignmentType.START,
                format: NumberFormat.LOWER_LETTER,
                level: 1,
                style: {
                  paragraph: {
                    indent: { hanging: 260, left: 1440 },
                  },
                },
                text: '%2.',
              },
              {
                alignment: AlignmentType.START,
                format: NumberFormat.LOWER_ROMAN,
                level: 2,
                style: {
                  paragraph: {
                    indent: { hanging: 260, left: 2160 },
                  },
                },
                text: '%3.',
              },
            ],
            reference: 'numbered-list',
          },
        ],
      },
      sections: [
        {
          children: docParagraphs,
          properties: {
            page: {
              margin: {
                bottom: 1440,
                left: 1440,
                right: 1440,
                top: 1440, // 1 inch
              },
            },
          },
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
