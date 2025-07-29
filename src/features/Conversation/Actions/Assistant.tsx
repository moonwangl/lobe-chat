import { ActionIconGroup, Icon } from '@lobehub/ui';
import type { ActionIconGroupEvent, ActionIconGroupItemType } from '@lobehub/ui';
import { memo, useCallback, useMemo } from 'react';
import { Flexbox } from 'react-layout-kit';

import { useChatStore } from '@/store/chat';
import { threadSelectors } from '@/store/chat/selectors';
import {
  copyAsHtml,
  copyAsPlainText,
  downloadAsMarkdown,
  exportToDocx,
} from '@/utils/wordFunction';

import { useChatListActionsBar } from '../hooks/useChatListActionsBar';
import { RenderAction } from '../types';
import { ErrorActionsBar } from './Error';
import { useCustomActions } from './customAction';

export const AssistantActionsBar: RenderAction = memo(
  ({ onActionClick, error, tools, id, content }) => {
    // Handle download markdown action
    const handleDownloadMarkdown = useCallback(() => {
      try {
        // Use default filename to trigger title extraction from H1 heading
        downloadAsMarkdown(content || '', 'document.md');
      } catch (error) {
        console.error('Failed to download markdown:', error);
      }
    }, [content]);

    // Handle export DOCX action
    const handleExportDocx = useCallback(() => {
      try {
        // Use default filename to trigger title extraction from H1 heading
        exportToDocx(content || '', 'document.docx');
      } catch (error) {
        console.error('Failed to export DOCX:', error);
      }
    }, [content]);

    // Handle copy HTML action
    const handleCopyHtml = useCallback(() => {
      try {
        copyAsHtml(content || '');
      } catch (error) {
        console.error('Failed to copy HTML:', error);
      }
    }, [content]);

    // Handle copy plain text action
    const handleCopyPlainText = useCallback(() => {
      try {
        copyAsPlainText(content || '');
      } catch (error) {
        console.error('Failed to copy plain text:', error);
      }
    }, [content]);

    // Enhanced action click handler
    const handleActionClick = useCallback(
      (action: ActionIconGroupEvent) => {
        if (action.key === 'downloadMarkdown') {
          handleDownloadMarkdown();
          return;
        }
        if (action.key === 'exportDocx') {
          handleExportDocx();
          return;
        }
        if (action.key === 'copyHtml') {
          handleCopyHtml();
          return;
        }
        if (action.key === 'copyPlainText') {
          handleCopyPlainText();
          return;
        }
        onActionClick?.(action);
      },
      [
        handleDownloadMarkdown,
        handleExportDocx,
        handleCopyHtml,
        handleCopyPlainText,
        onActionClick,
      ],
    );
    const hasThread = useChatStore((s) => threadSelectors.hasThreadBySourceMsgId(id)(s));

    const {
      regenerate,
      edit,
      delAndRegenerate,
      copy,
      copyHtml,
      copyPlainText,
      del,
      downloadMarkdown,
      exportDocx,
      // export: exportPDF,
      // share, // Hidden per user request
    } = useChatListActionsBar({ hasThread });

    const { translate, tts } = useCustomActions();
    const hasTools = !!tools;

    const items = useMemo(() => {
      if (hasTools) return [delAndRegenerate, copy];

      return [edit, exportDocx, copyPlainText].filter(Boolean) as ActionIconGroupItemType[];
    }, [edit, exportDocx, copyPlainText, hasTools]);

    if (error) return <ErrorActionsBar onActionClick={onActionClick} />;

    return (
      <Flexbox gap={8} horizontal>
        <ActionIconGroup
          items={items}
          menu={{
            items: [
              {
                icon: <Icon icon={copy.icon} />,
                key: copy.key,
                label: copy.label,
              },
              {
                icon: <Icon icon={copyHtml.icon} />,
                key: copyHtml.key,
                label: copyHtml.label,
              },
              {
                icon: <Icon icon={downloadMarkdown.icon} />,
                key: downloadMarkdown.key,
                label: downloadMarkdown.label,
              },
              {
                type: 'divider',
              },
              {
                icon: <Icon icon={tts.icon} />,
                key: tts.key,
                label: tts.label,
              },
              {
                icon: <Icon icon={translate.icon} />,
                key: translate.key,
                label: translate.label,
              },
              {
                type: 'divider',
              },
              {
                icon: <Icon icon={regenerate.icon} />,
                key: regenerate.key,
                label: regenerate.label,
              },
              {
                danger: del.danger,
                icon: <Icon icon={del.icon} />,
                key: del.key,
                label: del.label,
              },
            ],
          }}
          onActionClick={handleActionClick}
        />
        {/* <WordFunctionButtons content={content || ''} messageId={id} /> */}
      </Flexbox>
    );
  },
);
