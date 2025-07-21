import { ActionIconGroup } from '@lobehub/ui';
import type { ActionIconGroupItemType } from '@lobehub/ui';
import { memo, useContext, useMemo } from 'react';
import { Flexbox } from 'react-layout-kit';

import { useChatStore } from '@/store/chat';
import { threadSelectors } from '@/store/chat/selectors';

import { InPortalThreadContext } from '../components/ChatItem/InPortalThreadContext';
import WordFunctionButtons from '../components/WordFunctionButtons';
import { useChatListActionsBar } from '../hooks/useChatListActionsBar';
import { RenderAction } from '../types';
import { ErrorActionsBar } from './Error';
import { useCustomActions } from './customAction';

export const AssistantActionsBar: RenderAction = memo(
  ({ onActionClick, error, tools, id, content }) => {
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
          onActionClick={onActionClick}
        />
        <WordFunctionButtons content={content || ''} messageId={id} />
      </Flexbox>
    );
  },
);
