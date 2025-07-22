import type { ActionIconGroupItemType } from '@lobehub/ui';
import {
  Copy,
  DownloadIcon,
  Edit,
  FileText,
  ListRestart,
  RotateCcw,
  Share2,
  Split,
  Trash,
} from 'lucide-react';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

interface ChatListActionsBar {
  branching: ActionIconGroupItemType;
  copy: ActionIconGroupItemType;
  del: ActionIconGroupItemType;
  delAndRegenerate: ActionIconGroupItemType;
  divider: { type: 'divider' };
  downloadMarkdown: ActionIconGroupItemType;
  edit: ActionIconGroupItemType;
  export: ActionIconGroupItemType;
  regenerate: ActionIconGroupItemType;
  share: ActionIconGroupItemType;
}

export const useChatListActionsBar = ({
  hasThread,
}: { hasThread?: boolean } = {}): ChatListActionsBar => {
  const { t } = useTranslation('common');

  return useMemo(
    () => ({
      branching: {
        disable: true,
        icon: Split,
        key: 'branching',
        label: t('branchingDisable'),
      },
      copy: {
        icon: Copy,
        key: 'copy',
        label: t('copy', { defaultValue: 'Copy' }),
      },
      del: {
        danger: true,
        disable: hasThread,
        icon: Trash,
        key: 'del',
        label: hasThread ? t('messageAction.deleteDisabledByThreads', { ns: 'chat' }) : t('delete'),
      },
      delAndRegenerate: {
        disable: hasThread,
        icon: ListRestart,
        key: 'delAndRegenerate',
        label: t('messageAction.delAndRegenerate', {
          defaultValue: 'Delete and regenerate',
          ns: 'chat',
        }),
      },
      divider: {
        type: 'divider',
      },
      downloadMarkdown: {
        icon: FileText,
        key: 'downloadMarkdown',
        label: t('downloadMarkdown', { defaultValue: 'Download as Markdown', ns: 'chat' }),
      },
      edit: {
        icon: Edit,
        key: 'edit',
        label: t('edit', { defaultValue: 'Edit' }),
      },
      export: {
        icon: DownloadIcon,
        key: 'export',
        label: '导出为 PDF',
      },
      regenerate: {
        icon: RotateCcw,
        key: 'regenerate',
        label: t('regenerate', { defaultValue: 'Regenerate' }),
      },
      share: {
        icon: Share2,
        key: 'share',
        label: t('share', { defaultValue: 'Share' }),
      },
    }),
    [hasThread],
  );
};
