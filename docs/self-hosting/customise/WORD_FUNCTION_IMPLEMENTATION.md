# Word Function Implementation

This document describes the implementation of the word function feature in LobeChat, which allows users to detect and extract Markdown blocks from AI-generated messages and export them in various formats.

## Files Created/Modified

### 1. Core Utility Functions

**File:** `src/utils/wordFunction.ts`

- `extractMarkdownBlocks()` - Extracts markdown blocks from message content
- `exportToDocx()` - Exports content to DOCX format using the `docx` library
- `downloadAsMarkdown()` - Downloads content as a Markdown file
- `copyAsHtml()` - Converts markdown to HTML and copies to clipboard
- `hasMarkdownBlocks()` - Checks if content contains markdown blocks
- `markdownToHtml()` - Converts markdown content to HTML using `marked`

### 2. Word Function Buttons Component

**File:** `src/features/Conversation/components/WordFunctionButtons/index.tsx`

- React component that renders three action buttons:
  - Export as DOCX
  - Download as Markdown
  - Copy as HTML for Word
- Only displays when content contains markdown blocks
- Includes loading states and error handling

### 3. Integration with Assistant Actions

**File:** `src/features/Conversation/Actions/Assistant.tsx`

- Modified to include WordFunctionButtons alongside existing action buttons
- Added import for WordFunctionButtons component
- Updated component to pass content prop to the buttons

### 4. Internationalization

**File:** `src/locales/default/chat.ts`

- Added translation keys for word function buttons:
  - `wordFunction.exportDocx`: ' 导出为 DOCX'
  - `wordFunction.downloadMarkdown`: ' 下载为 Markdown'
  - `wordFunction.copyHtml`: ' 复制为 HTML（适用于 Word）'

## Dependencies Added

The following packages were installed via `pnpm add`:

- `docx@9.5.1` - For creating DOCX documents
- `file-saver@2.0.5` - For triggering file downloads
- `marked@16.1.1` - For converting markdown to HTML

## Features Implemented

### 1. Markdown Block Detection

- Detects code blocks (\`\`\`)
- Detects headers (# ## ###)
- Detects lists (- \* 1.)
- Only shows word function buttons when markdown blocks are present

### 2. Export to DOCX

- Converts markdown blocks to properly formatted Word document
- Preserves code formatting with monospace font
- Maintains header hierarchy
- Formats lists appropriately
- Handles regular text paragraphs

### 3. Download as Markdown

- Downloads the raw markdown content as a .md file
- Preserves original formatting

### 4. Copy as HTML

- Converts markdown to HTML using the `marked` library
- Copies HTML to clipboard for pasting into Word
- Includes fallback for older browsers

## Usage

1. When an AI assistant generates a message containing markdown blocks (code, headers, lists), the word function buttons will automatically appear in the message actions.

2. Users can click any of the three buttons:
   - **Export as DOCX**: Downloads a formatted Word document
   - **Download as Markdown**: Downloads the raw markdown file
   - **Copy as HTML**: Copies HTML to clipboard for Word

## Technical Implementation Details

### Button Visibility Logic

The buttons only appear when `hasMarkdownBlocks()` returns true, which checks for:

- Code blocks: `/```[\s\S]*?```/`
- Headers: `/^#+\s/m`
- Lists: `/^[-*]\s|^\d+\./m`

### DOCX Generation

Uses the `docx` library to create structured documents with:

- Different paragraph styles for different content types
- Monospace font for code blocks
- Bold formatting for headers with size hierarchy
- Bullet points for lists

### Error Handling

- Try-catch blocks around all export functions
- Loading states for async operations
- Console error logging for debugging

## Future Enhancements

As mentioned in the requirements document, potential future enhancements include:

- Support for tables, images, and other markdown elements
- Customizable export templates
- Batch export of multiple messages
- Integration with cloud storage services
- Advanced formatting options

## Testing

To test the implementation:

1. Start the development server: `pnpm dev`
2. Navigate to <http://localhost:3210>
3. Create a conversation with an AI assistant
4. Send a message that will generate a response with markdown content (code blocks, headers, lists)
5. Verify that the word function buttons appear in the assistant message actions
6. Test each button to ensure proper functionality

The implementation follows the requirements specified in the `docs/self-hosting/customise/word-function.md` document and integrates seamlessly with the existing LobeChat architecture.
