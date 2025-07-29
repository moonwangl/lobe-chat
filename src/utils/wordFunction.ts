import {
  AlignmentType,
  Document,
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
        runs.push(new TextRun({ text: plainText }));
      }
    }

    // Add formatted text
    const runOptions: any = { text: matchItem.text };

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
        // Let the paragraph style handle the size
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
      runs.push(new TextRun({ text: remainingText }));
    }
  }

  // If no formatting was found, return the original text
  if (runs.length === 0) {
    runs.push(new TextRun({ text }));
  }

  return runs;
};

/**
 * Export content to DOCX format with proper Word formatting
 * @param content - The content to export
 * @param filename - The filename for the exported file
 */
/**
 * Extract content between the first and last --- markers
 * @param content - The full content string
 * @returns The filtered content between --- markers
 */
const extractContentBetweenMarkers = (content: string): string => {
  const lines = content.split('\n');
  const firstMarkerIndex = lines.findIndex((line) => line.trim() === '---');
  const lastMarkerIndex = lines.lastIndexOf('---');

  // If no markers found or only one marker, return original content
  if (firstMarkerIndex === -1 || lastMarkerIndex === -1 || firstMarkerIndex === lastMarkerIndex) {
    return content;
  }

  // Extract content between markers (excluding the marker lines themselves)
  const extractedLines = lines.slice(firstMarkerIndex + 1, lastMarkerIndex);
  return extractedLines.join('\n');
};

export const exportToDocx = async (
  content: string,
  filename: string = 'document.docx',
): Promise<void> => {
  try {
    // Filter content to only include text between first and last --- markers
    const filteredContent = extractContentBetweenMarkers(content);

    const blocks = parseMarkdownContent(filteredContent);
    const docParagraphs: Paragraph[] = [];

    // Extract title from first H1 heading for filename
    let documentTitle = 'document';
    const firstH1 = blocks.find((block) => block.type === 'header' && block.level === 1);
    if (firstH1) {
      // Remove markdown formatting and clean up the title
      documentTitle = firstH1.content
        .replaceAll(/\*\*(.*?)\*\*/g, '$1') // Remove bold
        .replaceAll(/\*(.*?)\*/g, '$1') // Remove italic
        .replaceAll(/`(.*?)`/g, '$1') // Remove code
        .replaceAll(/\[(.*?)]\(.*?\)/g, '$1') // Remove links, keep text
        .replaceAll(/["*/:<>?\\|]/g, '') // Remove invalid filename characters
        .trim();
    }
    const finalFilename = filename === 'document.docx' ? `${documentTitle}.docx` : filename;

    let lastListLevel = -1;
    let listCounters: { [key: number]: number } = {};

    for (const block of blocks) {
      switch (block.type) {
        case 'header': {
          // Add proper Word heading with inline formatting
          const headerRuns = parseInlineFormatting(block.content);

          // Use appropriate heading styles based on level
          let headingStyle = 'BodyText';
          switch (block.level) {
            case 1: {
              headingStyle = 'Title'; // 方正小标宋简体, 22pt, center
              break;
            }
            case 2: {
              headingStyle = 'Heading1'; // SimHei, 16pt, justified
              break;
            }
            case 3: {
              headingStyle = 'Heading2'; // KaiTi, 16pt, justified
              break;
            }
            case 4: {
              headingStyle = 'Heading3'; // FangSong, 16pt, justified
              break;
            }
            case 5: {
              headingStyle = 'Heading4'; // FangSong, 16pt, justified
              break;
            }
            default: {
              headingStyle = 'BodyText';
              break;
            }
          }

          docParagraphs.push(
            new Paragraph({
              children: headerRuns,
              style: headingStyle,
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
                style: 'BodyText',
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
                style: 'BodyText',
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
                      style: 'BodyText',
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
              // Detect if text contains Chinese characters
              const hasChinese = /[\u4E00-\u9FFF]/.test(line);
              const textRuns = parseInlineFormatting(line);

              // Apply different styles based on language
              const bodyStyle = hasChinese ? 'BodyTextChinese' : 'BodyTextEnglish';

              docParagraphs.push(
                new Paragraph({
                  children: textRuns,
                  style: bodyStyle,
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
              // GB/T 9704—2012 margins: top 37mm, bottom 34mm, left 28mm, right 26mm
              margin: {
                // 37mm in DXA (37 * 56.7)
                bottom: 1928,
                // 34mm in DXA (34 * 56.7)
                left: 1588,
                // 28mm in DXA (28 * 56.7)
                right: 1474,
                top: 2098, // 26mm in DXA (26 * 56.7)
              },

              // A4 paper size (210mm x 297mm)
              size: {
                // 210mm in DXA (210 * 56.7)
                height: 16_838,
                width: 11_906, // 297mm in DXA (297 * 56.7)
              },
            },
          },
        },
      ],
      styles: {
        default: {
          document: {
            paragraph: {
              alignment: AlignmentType.JUSTIFIED,
              indent: {
                firstLine: 567, // 2字符缩进 (2 * 283.5 DXA)
              },
              spacing: {
                line: 560, // 28pt fixed line height (28 * 20)
                lineRule: 'exact',
              },
            },
            run: {
              font: 'FangSong',
              size: 32, // 16pt
            },
          },
        },
        paragraphStyles: [
          {
            basedOn: 'Normal',
            id: 'Code',
            name: 'Code',
            paragraph: {
              alignment: AlignmentType.LEFT,
              spacing: {
                after: 0,
                before: 0,
                line: 560,
                lineRule: 'exact',
              },
            },
            run: {
              color: '000000',
              font: 'Courier New',
              size: 20, // 10pt for code
            },
          },
          {
            basedOn: 'Normal',
            id: 'Title',
            name: 'Title',
            paragraph: {
              alignment: AlignmentType.CENTER, // center alignment
              spacing: {
                after: 280,
                before: 280,
                line: 560,
                lineRule: 'exact',
              },
            },
            run: {
              font: '方正小标宋简体', // 方正小标宋简体
              size: 44, // 22pt
            },
          },
          {
            basedOn: 'Normal',
            id: 'BodyTextChinese',
            name: 'BodyTextChinese',
            paragraph: {
              alignment: AlignmentType.JUSTIFIED, // justified alignment
              indent: {
                firstLine: 567, // 2字符缩进
              },
              spacing: {
                after: 0,
                before: 0,
                line: 560,
                lineRule: 'exact',
              },
            },
            run: {
              font: 'FangSong', // 仿宋体 for Chinese
              size: 32, // 16pt
            },
          },
          {
            basedOn: 'Normal',
            id: 'BodyTextEnglish',
            name: 'BodyTextEnglish',
            paragraph: {
              alignment: AlignmentType.JUSTIFIED, // justified alignment
              indent: {
                firstLine: 567, // 2字符缩进
              },
              spacing: {
                after: 0,
                before: 0,
                line: 560,
                lineRule: 'exact',
              },
            },
            run: {
              font: 'Times New Roman', // Times New Roman for English
              size: 32, // 16pt
            },
          },
          {
            basedOn: 'Normal',
            id: 'BodyText',
            name: 'BodyText',
            paragraph: {
              alignment: AlignmentType.JUSTIFIED,
              indent: {
                firstLine: 567, // 2字符缩进
              },
              spacing: {
                after: 0,
                before: 0,
                line: 560,
                lineRule: 'exact',
              },
            },
            run: {
              font: 'FangSong',
              size: 32, // 16pt
            },
          },
          {
            basedOn: 'Normal',
            id: 'Heading1',
            name: 'Heading1',
            paragraph: {
              alignment: AlignmentType.JUSTIFIED, // justified alignment
              indent: {
                firstLine: 567, // 2字符缩进
              },
              spacing: {
                after: 0,
                before: 0,
                line: 560,
                lineRule: 'exact',
              },
            },
            run: {
              font: 'SimHei', // 黑体
              size: 32, // 16pt
            },
          },
          {
            basedOn: 'Normal',
            id: 'Heading2',
            name: 'Heading2',
            paragraph: {
              alignment: AlignmentType.JUSTIFIED, // justified alignment
              indent: {
                firstLine: 567, // 2字符缩进
              },
              spacing: {
                after: 0,
                before: 0,
                line: 560,
                lineRule: 'exact',
              },
            },
            run: {
              font: 'KaiTi', // 楷体
              size: 32, // 16pt
            },
          },
          {
            basedOn: 'Normal',
            id: 'Heading3',
            name: 'Heading3',
            paragraph: {
              alignment: AlignmentType.JUSTIFIED, // justified alignment
              indent: {
                firstLine: 567, // 2字符缩进
              },
              spacing: {
                after: 0,
                before: 0,
                line: 560,
                lineRule: 'exact',
              },
            },
            run: {
              font: 'FangSong', // 仿宋体
              size: 32, // 16pt
            },
          },
          {
            basedOn: 'Normal',
            id: 'Heading4',
            name: 'Heading4',
            paragraph: {
              alignment: AlignmentType.JUSTIFIED, // justified alignment
              indent: {
                firstLine: 567, // 2字符缩进
              },
              spacing: {
                after: 0,
                before: 0,
                line: 560,
                lineRule: 'exact',
              },
            },
            run: {
              font: 'FangSong', // 仿宋体
              size: 32, // 16pt
            },
          },
        ],
      },
    });

    const buffer = await Packer.toBuffer(doc);
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    });
    saveAs(blob, finalFilename);
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
    // Filter content to only include text between first and last --- markers
    const filteredContent = extractContentBetweenMarkers(content);

    // Extract title from first H1 heading for filename
    let documentTitle = 'document';
    const blocks = parseMarkdownContent(filteredContent);
    const firstH1 = blocks.find((block) => block.type === 'header' && block.level === 1);
    if (firstH1) {
      // Remove markdown formatting and clean up the title
      documentTitle = firstH1.content
        .replaceAll(/\*\*(.*?)\*\*/g, '$1') // Remove bold
        .replaceAll(/\*(.*?)\*/g, '$1') // Remove italic
        .replaceAll(/`(.*?)`/g, '$1') // Remove code
        .replaceAll(/\[(.*?)]\(.*?\)/g, '$1') // Remove links, keep text
        .replaceAll(/["*/:<>?\\|]/g, '') // Remove invalid filename characters
        .trim();
    }
    const finalFilename = filename === 'document.md' ? `${documentTitle}.md` : filename;

    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
    saveAs(blob, finalFilename);
  } catch (error) {
    console.error('Error downloading markdown:', error);
    throw new Error('Failed to download markdown file');
  }
};

/**
 * Convert parsed markdown blocks to HTML with GB/T 9704—2012 formatting
 * @param blocks - Array of parsed markdown blocks
 * @returns HTML string with inline CSS for GB/T 9704—2012 compliance
 */
const blocksToHtml = (
  blocks: Array<{
    content: string;
    level?: number;
    listType?: 'bullet' | 'numbered';
    tableData?: string[][];
    type: string;
  }>,
): string => {
  const htmlParts: string[] = [];

  // Add CSS styles for GB/T 9704—2012 format
  const gbStyles = `
    <style>
      body {
        font-family: 'SimSun', '宋体', serif;
        font-size: 12pt; /* 四号字 */
        line-height: 28pt; /* 28pt固定行距 */
        text-align: justify; /* 两端对齐 */
        margin: 0;
        padding: 0;
      }
      .gb-title {
        font-family: 'SimSun', '宋体', serif;
        font-size: 15pt; /* 小三号字 */
        font-weight: bold;
        text-align: center; /* 居中对齐 */
        line-height: 28pt;
        margin: 14pt 0;
      }
      .gb-body {
        font-family: 'SimSun', '宋体', serif;
        font-size: 12pt; /* 四号字 */
        line-height: 28pt;
        text-align: justify; /* 两端对齐 */
        margin: 0;
      }
      .gb-code {
        font-family: 'Courier New', monospace;
        font-size: 10pt;
        line-height: 28pt;
        text-align: left;
        background-color: #f5f5f5;
        padding: 6pt;
        margin: 6pt 0;
      }
      .gb-table {
        font-family: 'SimSun', '宋体', serif;
        font-size: 12pt;
        line-height: 28pt;
        border-collapse: collapse;
        width: 100%;
        margin: 14pt 0;
      }
      .gb-table th, .gb-table td {
        border: 1pt solid black;
        padding: 6pt;
        text-align: center;
      }
      .gb-table th {
        font-weight: bold;
        background-color: #f0f0f0;
      }
      .gb-list {
        font-family: 'SimSun', '宋体', serif;
        font-size: 12pt;
        line-height: 28pt;
        text-align: justify;
        margin: 0;
        padding-left: 24pt;
      }
    </style>
  `;

  htmlParts.push(gbStyles);

  for (const block of blocks) {
    switch (block.type) {
      case 'header': {
        const level = block.level || 1;
        if (level === 1) {
          // Main title - 居中，小三号字，粗体
          htmlParts.push(`<h1 class="gb-title">${block.content}</h1>`);
        } else {
          // Sub-headers - 四号字，粗体，两端对齐
          htmlParts.push(
            `<h${Math.min(level, 6)} class="gb-body" style="font-weight: bold; margin: 14pt 0;">${block.content}</h${Math.min(level, 6)}>`,
          );
        }
        break;
      }

      case 'code': {
        htmlParts.push(`<pre class="gb-code"><code>${block.content}</code></pre>`);
        break;
      }

      case 'list': {
        const listTag = block.listType === 'numbered' ? 'ol' : 'ul';
        const indent = '  '.repeat(block.level || 0);
        htmlParts.push(
          `${indent}<${listTag} class="gb-list">\n${indent}  <li>${block.content}</li>\n${indent}</${listTag}>`,
        );
        break;
      }

      case 'table': {
        if (block.tableData && block.tableData.length > 0) {
          let tableHtml = '<table class="gb-table">\n';

          block.tableData.forEach((row, rowIndex) => {
            const cellTag = rowIndex === 0 ? 'th' : 'td';
            tableHtml += '  <tr>\n';
            row.forEach((cell) => {
              tableHtml += `    <${cellTag}>${cell}</${cellTag}>\n`;
            });
            tableHtml += '  </tr>\n';
          });

          tableHtml += '</table>';
          htmlParts.push(tableHtml);
        }
        break;
      }

      default: {
        // Convert inline markdown formatting to HTML
        let htmlContent = block.content
          .replaceAll(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
          .replaceAll(/\*(.*?)\*/g, '<em>$1</em>')
          .replaceAll(/`(.*?)`/g, '<code style="font-family: Courier New, monospace;">$1</code>');

        htmlParts.push(`<p class="gb-body">${htmlContent}</p>`);
        break;
      }
    }
  }

  return htmlParts.join('\n');
};

/**
 * Copy content as HTML to clipboard with GB/T 9704—2012 formatting
 * @param content - The message content to extract markdown blocks from and convert to HTML
 * @returns Promise that resolves when content is copied
 */
export const copyAsHtml = async (content: string): Promise<void> => {
  try {
    // Parse markdown content into structured blocks
    const blocks = parseMarkdownContent(content);

    // Convert blocks to HTML with GB/T 9704—2012 formatting
    const bodyContent = blocksToHtml(blocks);

    // Wrap in complete HTML document structure for proper Word import
    const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>GB/T 9704—2012 Document</title>
</head>
<body>
${bodyContent}
</body>
</html>`;

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
