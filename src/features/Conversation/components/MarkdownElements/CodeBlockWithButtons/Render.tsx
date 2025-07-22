import { ActionIcon } from '@lobehub/ui';
import { createStyles } from 'antd-style';
import { Copy, Download } from 'lucide-react';
import { memo, useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Flexbox } from 'react-layout-kit';

import { copyAsHtml, exportToDocx } from '@/utils/wordFunction';

import { MarkdownElementProps } from '../type';

const useStyles = createStyles(({ css, token }) => ({
  buttonContainer: css`
    position: absolute;
    z-index: 10;
    inset-block-start: 8px;
    inset-inline-end: 8px;

    padding: 4px;
    border-radius: ${token.borderRadius}px;

    opacity: 0;
    background: ${token.colorBgContainer};
    box-shadow: ${token.boxShadow};

    transition: opacity 0.2s ease;
  `,

  container: css`
    position: relative;

    &:hover .word-function-buttons {
      opacity: 1;
    }
  `,
}));

interface CodeBlockWithButtonsProps extends MarkdownElementProps {
  node: {
    properties: {
      codeContent: string;
      language?: string;
    };
  };
}

/**
 * Component that renders a code block with integrated word function buttons
 * Buttons appear on hover and allow exporting/copying the specific code block
 */
const CodeBlockWithButtons = memo<CodeBlockWithButtonsProps>(({ children, id, node }) => {
  const { t } = useTranslation('chat');
  const { styles } = useStyles();
  const [isExporting, setIsExporting] = useState(false);
  const [isCopying, setIsCopying] = useState(false);

  const { codeContent, language } = node.properties;

  /**
   * Handle DOCX export for this specific code block
   */
  const handleExportDocx = useCallback(async () => {
    if (isExporting || !codeContent) return;

    setIsExporting(true);
    try {
      // Create markdown formatted content for this code block
      const markdownContent = language
        ? `\`\`\`${language}\n${codeContent}\n\`\`\``
        : `\`\`\`\n${codeContent}\n\`\`\``;

      const filename = `code-block-${id}.docx`;
      await exportToDocx(markdownContent, filename);
    } catch (error) {
      console.error('Failed to export code block as DOCX:', error);
    } finally {
      setIsExporting(false);
    }
  }, [codeContent, language, id, isExporting]);

  /**
   * Handle HTML copy for this specific code block
   */
  const handleCopyHtml = useCallback(async () => {
    if (isCopying || !codeContent) return;

    setIsCopying(true);
    try {
      // Create markdown formatted content for this code block
      const markdownContent = language
        ? `\`\`\`${language}\n${codeContent}\n\`\`\``
        : `\`\`\`\n${codeContent}\n\`\`\``;

      await copyAsHtml(markdownContent);
    } catch (error) {
      console.error('Failed to copy code block as HTML:', error);
    } finally {
      setIsCopying(false);
    }
  }, [codeContent, language, isCopying]);

  // Only show buttons if the code content contains meaningful markdown
  const showButtons = codeContent && codeContent.trim().length > 10;

  return (
    <div className={styles.container}>
      {children}
      {showButtons && (
        <div className={`${styles.buttonContainer} word-function-buttons`}>
          <Flexbox gap={4} horizontal>
            <ActionIcon
              icon={Download}
              loading={isExporting}
              onClick={handleExportDocx}
              size="small"
              title={t('wordFunction.exportDocx', { defaultValue: 'Export as DOCX' })}
            />
            <ActionIcon
              icon={Copy}
              loading={isCopying}
              onClick={handleCopyHtml}
              size="small"
              title={t('wordFunction.copyHtml', { defaultValue: 'Copy as HTML for Word' })}
            />
          </Flexbox>
        </div>
      )}
    </div>
  );
});

CodeBlockWithButtons.displayName = 'CodeBlockWithButtons';

export default CodeBlockWithButtons;
