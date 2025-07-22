import { css } from 'antd-style';

// Override chat action button visibility to make them always visible
export default () => css`
  /* Make all action buttons always visible */
  .ant-btn-group .ant-btn {
    opacity: 1 !important;
  }

  [data-testid*='action-icon'] {
    opacity: 1 !important;
  }

  /* Override @lobehub/ui ActionIconGroup default hover behavior */
  [class*='ActionIconGroup'] {
    [class*='actionIcon'] {
      opacity: 1 !important;
      transition: opacity 0.2s ease;
    }
  }

  [class*='actionIconGroup'] {
    [class*='actionIcon'] {
      opacity: 1 !important;
      transition: opacity 0.2s ease;
    }
  }

  /* Ensure chat item action bars are always visible */
  [class*='ChatItem'] {
    [class*='actionBar'],
    [class*='ActionsBar'],
    [class*='actions'] {
      opacity: 1 !important;
    }
  }
`;
