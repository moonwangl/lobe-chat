import { ActionIcon } from '@lobehub/ui';
import { Copy, Download, FileText } from 'lucide-react';
import { memo, useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Flexbox } from 'react-layout-kit';

import {
  copyAsHtml,
  downloadAsMarkdown,
  exportToDocx,
  hasMarkdownBlocks,
} from '@/utils/wordFunction';

interface WordFunctionButtonsProps {
  content: string;
  messageId?: string;
}

const WordFunctionButtons = memo<WordFunctionButtonsProps>(({ content, messageId }) => {
  const { t } = useTranslation('chat');
  const [isExporting, setIsExporting] = useState(false);
  const [isCopying, setIsCopying] = useState(false);

  const handleExportDocx = useCallback(async () => {
    if (isExporting) return;

    setIsExporting(true);
    try {
      const filename = messageId ? `message-${messageId}.docx` : 'document.docx';
      await exportToDocx(content, filename);
    } catch (error) {
      console.error('Failed to export DOCX:', error);
      // You might want to show a toast notification here
    } finally {
      setIsExporting(false);
    }
  }, [content, messageId, isExporting]);

  const handleDownloadMarkdown = useCallback(() => {
    try {
      const filename = messageId ? `message-${messageId}.md` : 'document.md';
      downloadAsMarkdown(content, filename);
    } catch (error) {
      console.error('Failed to download markdown:', error);
      // You might want to show a toast notification here
    }
  }, [content, messageId]);

  const handleCopyHtml = useCallback(async () => {
    if (isCopying) return;

    setIsCopying(true);
    try {
      await copyAsHtml(content);
      // You might want to show a success toast notification here
    } catch (error) {
      console.error('Failed to copy HTML:', error);
      // You might want to show an error toast notification here
    } finally {
      setIsCopying(false);
    }
  }, [content, isCopying]);

  // Only show buttons if content contains markdown blocks
  if (!hasMarkdownBlocks(content)) {
    return null;
  }

  return (
    <Flexbox gap={4} horizontal>
      <ActionIcon
        icon={Download}
        loading={isExporting}
        onClick={handleExportDocx}
        size="small"
        title={t('wordFunction.exportDocx', { defaultValue: 'Export as DOCX' })}
      />
      <ActionIcon
        icon={FileText}
        onClick={handleDownloadMarkdown}
        size="small"
        title={t('wordFunction.downloadMarkdown', { defaultValue: 'Download as Markdown' })}
      />
      <ActionIcon
        icon={Copy}
        loading={isCopying}
        onClick={handleCopyHtml}
        size="small"
        title={t('wordFunction.copyHtml', { defaultValue: 'Copy as HTML for Word' })}
      />
    </Flexbox>
  );
});

WordFunctionButtons.displayName = 'WordFunctionButtons';

export default WordFunctionButtons;
