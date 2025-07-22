import { ActionIconGroup } from '@lobehub/ui';
import type { ActionIconGroupEvent, ActionIconGroupItemType } from '@lobehub/ui';
import { memo, useCallback, useContext, useMemo } from 'react';
import { Flexbox } from 'react-layout-kit';

import { useChatStore } from '@/store/chat';
import { threadSelectors } from '@/store/chat/selectors';
import { downloadAsMarkdown } from '@/utils/wordFunction';

import { InPortalThreadContext } from '../components/ChatItem/InPortalThreadContext';
import WordFunctionButtons from '../components/WordFunctionButtons';
import { useChatListActionsBar } from '../hooks/useChatListActionsBar';
import { RenderAction } from '../types';
import { ErrorActionsBar } from './Error';
import { useCustomActions } from './customAction';

export const AssistantActionsBar: RenderAction = memo(
  ({ onActionClick, error, tools, id, content }) => {
    // Handle download markdown action
    const handleDownloadMarkdown = useCallback(() => {
      try {
        const filename = id ? `message-${id}.md` : 'document.md';
        downloadAsMarkdown(content || '', filename);
      } catch (error) {
        console.error('Failed to download markdown:', error);
      }
    }, [content, id]);

    // Enhanced action click handler
    const handleActionClick = useCallback(
      (action: ActionIconGroupEvent) => {
        if (action.key === 'downloadMarkdown') {
          handleDownloadMarkdown();
          return;
        }
        onActionClick?.(action);
      },
      [handleDownloadMarkdown, onActionClick],
    );
    const [isThreadMode, hasThread] = useChatStore((s) => [
      !!s.activeThreadId,
      threadSelectors.hasThreadBySourceMsgId(id)(s),
    ]);

    const {
      regenerate,
      edit,
      delAndRegenerate,
      copy,
      divider,
      del,
      downloadMarkdown,
      // export: exportPDF,
      // share, // Hidden per user request
    } = useChatListActionsBar({ hasThread });

    const { translate, tts } = useCustomActions();
    const hasTools = !!tools;

    const inPortalThread = useContext(InPortalThreadContext);
    const inThread = isThreadMode || inPortalThread;

    const items = useMemo(() => {
      if (hasTools) return [delAndRegenerate, copy];

      return [edit, copy].filter(Boolean) as ActionIconGroupItemType[];
    }, [inThread, hasTools]);

    if (error) return <ErrorActionsBar onActionClick={onActionClick} />;

    return (
      <Flexbox gap={8} horizontal>
        <ActionIconGroup
          items={items}
          menu={{
            items: [
              edit,
              copy,
              downloadMarkdown,
              divider,
              tts,
              translate,
              divider,
              // share, // Hidden per user request
              // exportPDF,
              divider,
              regenerate,
              delAndRegenerate,
              del,
            ],
          }}
          onActionClick={handleActionClick}
        />
        <WordFunctionButtons content={content || ''} messageId={id} />
      </Flexbox>
    );
  },
);
