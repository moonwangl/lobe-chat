## 🎯 Functional Requirements Summary

### For AI-generated messages containing:

> "Here's your article:\n\n`markdown\n# Title\n...content...\n`"

You want to:

- 🔘 Detect and extract the Markdown block
- 💾 Add buttons:
  - Download as `.docx`
  - Download as `.md`
  - Copy as HTML (for Word)

---

## 🧰 Dependencies to Install (Frontend)

Your developer should install:

```bash
npm install docx file-saver marked
```

Optional for improved .docx formatting:

```bash
npm install markdown-to-docx
```

---

## 🧱 High-Level Steps for Developer

### STEP 1: Identify the AI Message Renderer

- **File:** `app/components/chat/ChatMessage.tsx` or equivalent
- This component renders the AI and user messages.

---

### STEP 2: Extract Markdown Block from Message Content

#### 📌 Add this utility function:

````ts
const extractMarkdownBlock = (text: string): string | null => {
  const match = text.match(/```(?:markdown)?\n([\s\S]*?)```/i);
  return match ? match[1].trim() : null;
};
````

> This extracts the first Markdown code block (` ```markdown ... ``` `) from an AI message.

---

### STEP 3: Add Action Buttons (Below AI Message)

In the JSX that renders the AI message, **check if it includes a Markdown block**, and if so, render three buttons:

```tsx
{
  isAIMessage && extractMarkdownBlock(message.content) && (
    <div className="flex gap-2 mt-2">
      <Button onClick={() => exportToDocx(extractMarkdownBlock(message.content)!)}>
        Download as Word
      </Button>
      <Button onClick={() => downloadAsMarkdown(extractMarkdownBlock(message.content)!)}>
        Download as Markdown
      </Button>
      <Button onClick={() => copyAsHtml(extractMarkdownBlock(message.content)!)}>
        Copy for Word
      </Button>
    </div>
  );
}
```

> Ensure buttons use Tailwind or Shadcn UI (whatever your UI setup uses).

---

### STEP 4: Export to Word (`.docx`)

```ts
import { Document, Packer, Paragraph, TextRun } from 'docx';
import { saveAs } from 'file-saver';

const exportToDocx = async (markdown: string) => {
  const lines = markdown.split('\n');
  const paragraphs = lines.map((line) => new Paragraph(line));

  const doc = new Document({
    sections: [{ children: paragraphs }],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, 'ai-content.docx');
};
```

> This converts raw text to paragraphs. For richer formatting, see Step 7 below.

---

### STEP 5: Export to Markdown (`.md`)

```ts
const downloadAsMarkdown = (markdown: string) => {
  const blob = new Blob([markdown], { type: 'text/markdown' });
  saveAs(blob, 'ai-content.md');
};
```

---

### STEP 6: Copy as Word-Compatible HTML

```ts
import { marked } from 'marked';

const copyAsHtml = async (markdown: string) => {
  const html = marked.parse(markdown);
  await navigator.clipboard.write([
    new ClipboardItem({
      'text/html': new Blob([html], { type: 'text/html' }),
    }),
  ]);
};
```

> Now when a user pastes in Word, formatting like headings and bullets are preserved.

---

### STEP 7: (Optional) Better Word Formatting

To preserve actual **Markdown styling (headings, lists, etc.)** in `.docx`, use:

```bash
npm install markdown-to-docx
```

```ts
import md2docx from 'markdown-to-docx';

const exportToDocx = async (markdown: string) => {
  const buffer = await md2docx(markdown);
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  });
  saveAs(blob, 'ai-content.docx');
};
```

---

### STEP 8: UI Enhancements (Optional but Recommended)

- Highlight Markdown block in the message bubble
- Add tooltip over buttons: “Download article only”, etc.
- Add toast notifications: “Copied to clipboard”, “File downloaded”, etc.

---

## ✅ Deliverables for Your Developer

### 💻 Code Changes

- `ChatMessage.tsx` modified
- New utility functions:
  - `extractMarkdownBlock()`
  - `exportToDocx()`
  - `downloadAsMarkdown()`
  - `copyAsHtml()`

### 📦 Libraries Installed

- `docx` for Word export
- `file-saver` for triggering downloads
- `marked` for Markdown → HTML
- Optional: `markdown-to-docx` for richer .docx output

---

## 🧪 Testing Scenarios

| Scenario                           | Expected Behavior                           |
| ---------------------------------- | ------------------------------------------- |
| AI response has markdown doc block | Buttons appear below message                |
| Click "Download as Word"           | `.docx` file downloads with article content |
| Click "Download as Markdown"       | `.md` file downloads                        |
| Click "Copy for Word"              | User pastes into Word with full formatting  |

---

## ✨ Future Enhancements

- Export full conversation with all document blocks
- Save to Google Docs / OneDrive
- Support `.pdf` export using `html-pdf` or `pdf-lib`
