import {
  AlignmentType,
  Document,
  HeadingLevel,
  NumberFormat,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
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
): Array<{
  content: string;
  level?: number;
  listType?: 'bullet' | 'numbered';
  tableData?: string[][];
  type: string;
}> => {
  const blocks: Array<{
    content: string;
    level?: number;
    listType?: 'bullet' | 'numbered';
    tableData?: string[][];
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

    // Handle tables
    if (line.includes('|') && line.trim().startsWith('|') && line.trim().endsWith('|')) {
      const tableRows: string[][] = [];
      let currentLine = line;

      // Parse table rows
      while (i < lines.length && currentLine.includes('|')) {
        const cells = currentLine
          .split('|')
          .slice(1, -1) // Remove empty first and last elements
          .map((cell) => cell.trim());

        // Skip separator rows (like |---|---|
        if (!cells.every((cell) => /^-+$/.test(cell))) {
          tableRows.push(cells);
        }

        i++;
        if (i < lines.length) {
          currentLine = lines[i];
        } else {
          break;
        }
      }

      if (tableRows.length > 0) {
        blocks.push({
          content: '',
          tableData: tableRows,
          type: 'table',
        });
      }
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
        /^\s*[*+-]\s/.test(nextLine) ||
        (nextLine.includes('|') && nextLine.trim().startsWith('|') && nextLine.trim().endsWith('|'))
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
 * Parse inline markdown formatting (bold, italic, code) in text
 * @param text - Text that may contain inline markdown
 * @returns Array of TextRun objects with appropriate formatting
 */
const parseInlineFormatting = (text: string): TextRun[] => {
  const runs: TextRun[] = [];
  let currentIndex = 0;

  // Find all matches and their positions
  const matches: Array<{ end: number; format: string; start: number; text: string }> = [];

  // Bold text (**text**)
  const boldRegex = /\*\*(.*?)\*\*/g;
  let match: RegExpExecArray | null;
  while ((match = boldRegex.exec(text)) !== null) {
    matches.push({
      end: match.index + match[0].length,
      format: 'bold',
      start: match.index,
      text: match[1],
    });
  }

  // Italic text (*text*) - simplified to avoid lookbehind issues
  const italicRegex = /\*([^*]+?)\*/g;
  let italicMatch: RegExpExecArray | null;
  const checkIsInsideBold = (matchItem: RegExpExecArray) => {
    return matches.some(
      (m) =>
        m.format === 'bold' &&
        matchItem.index >= m.start &&
        matchItem.index + matchItem[0].length <= m.end,
    );
  };

  while ((italicMatch = italicRegex.exec(text)) !== null) {
    // Check if this italic is not inside a bold
    const isInsideBold = checkIsInsideBold(italicMatch);
    if (!isInsideBold) {
      matches.push({
        end: italicMatch.index + italicMatch[0].length,
        format: 'italic',
        start: italicMatch.index,
        text: italicMatch[1],
      });
    }
  }

  // Inline code (`text`)
  const codeRegex = /`(.*?)`/g;
  while ((match = codeRegex.exec(text)) !== null) {
    matches.push({
      end: match.index + match[0].length,
      format: 'code',
      start: match.index,
      text: match[1],
    });
  }

  // Sort matches by start position and remove overlapping matches
  matches.sort((a, b) => a.start - b.start);
  const filteredMatches: Array<{ end: number; format: string; start: number; text: string }> = [];
  for (const matchItem of matches) {
    const hasOverlap = filteredMatches.some(
      (existing) => matchItem.start < existing.end && matchItem.end > existing.start,
    );
    if (!hasOverlap) {
      filteredMatches.push(matchItem);
    }
  }

  // Process text with formatting
  for (const matchItem of filteredMatches) {
    // Add plain text before the match
    if (currentIndex < matchItem.start) {
      const plainText = text.slice(currentIndex, matchItem.start);
      if (plainText) {
        runs.push(new TextRun({ size: 22, text: plainText }));
      }
    }

    // Add formatted text
    const runOptions: any = { size: 22, text: matchItem.text };

    switch (matchItem.format) {
      case 'bold': {
        runOptions.bold = true;
        break;
      }
      case 'italic': {
        runOptions.italics = true;
        break;
      }
      case 'code': {
        runOptions.font = 'Courier New';
        runOptions.size = 20;
        break;
      }
    }

    runs.push(new TextRun(runOptions));
    currentIndex = matchItem.end;
  }

  // Add remaining plain text
  if (currentIndex < text.length) {
    const remainingText = text.slice(currentIndex);
    if (remainingText) {
      runs.push(new TextRun({ size: 22, text: remainingText }));
    }
  }

  // If no formatting was found, return the original text
  if (runs.length === 0) {
    runs.push(new TextRun({ size: 22, text }));
  }

  return runs;
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
          // Add proper Word heading with inline formatting
          const headerRuns = parseInlineFormatting(block.content);
          // Make all header text bold
          headerRuns.forEach((run) => {
            (run as any).bold = true;
          });

          docParagraphs.push(
            new Paragraph({
              children: headerRuns,
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
          const listRuns = parseInlineFormatting(block.content);

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
                children: listRuns,
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
                children: listRuns,
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

        case 'table': {
          // Handle tables
          if (block.tableData && block.tableData.length > 0) {
            const numColumns = block.tableData[0].length;

            const tableRows = block.tableData.map((rowData, rowIndex) => {
              const cells = rowData.map((cellText) => {
                const cellRuns = parseInlineFormatting(cellText);
                return new TableCell({
                  children: [
                    new Paragraph({
                      children: cellRuns,
                      spacing: { after: 120, before: 120 },
                    }),
                  ],
                  margins: {
                    bottom: 150,
                    left: 200,
                    right: 200,
                    top: 150,
                  },
                  width: {
                    size: 8500 / numColumns, // Equal width distribution based on table width
                    type: WidthType.DXA,
                  },
                });
              });

              return new TableRow({
                children: cells,
                tableHeader: rowIndex === 0, // First row as header
              });
            });

            const table = new Table({
              // Fixed table layout for consistent width
              borders: {
                bottom: { size: 2, style: 'single' },
                insideHorizontal: { size: 1, style: 'single' },
                insideVertical: { size: 1, style: 'single' },
                left: { size: 2, style: 'single' },
                right: { size: 2, style: 'single' },
                top: { size: 2, style: 'single' },
              },

              layout: 'fixed',

              rows: tableRows,
              width: {
                size: 8500, // Fixed width for A4 document (approximately 5.9 inches in DXA)
                type: WidthType.DXA,
              },
            });

            // Add table and spacing after table
            docParagraphs.push(
              table as any,
              new Paragraph({
                children: [new TextRun({ text: '' })],
                spacing: { after: 240 },
              }),
            );
          }
          break;
        }

        default: {
          // Add regular paragraph with inline formatting
          const textLines = block.content.split('\n');
          for (const line of textLines) {
            if (line.trim()) {
              const textRuns = parseInlineFormatting(line);
              docParagraphs.push(
                new Paragraph({
                  children: textRuns,
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
      styles: {
        paragraphStyles: [
          {
            basedOn: 'Normal',
            id: 'Code',
            name: 'Code',
            paragraph: {
              spacing: {
                after: 0,
                before: 0,
              },
            },
            run: {
              color: '000000',
              font: 'Courier New',
              size: 20, // 10pt
            },
          },
        ],
      },
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
  const tableRegex = /^\|.*\|$/m;
  const boldRegex = /\*\*.*?\*\*/;
  const italicRegex = /\*.*?\*/;
  const inlineCodeRegex = /`.*?`/;

  return (
    codeBlockRegex.test(content) ||
    headerRegex.test(content) ||
    listRegex.test(content) ||
    tableRegex.test(content) ||
    boldRegex.test(content) ||
    italicRegex.test(content) ||
    inlineCodeRegex.test(content)
  );
};
