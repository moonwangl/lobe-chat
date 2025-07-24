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

  /* Force visibility for all action-related elements */
  [class*='action'] {
    visibility: visible !important;
    opacity: 1 !important;
  }

  /* Base ChatItem action visibility and layout - must come before more specific selectors */
  [class*='ChatItem'] [class*='actionBar'],
  [class*='ChatItem'] [class*='ActionsBar'],
  [class*='ChatItem'] [class*='actions'] {
    justify-content: flex-start !important;
    order: 2 !important;

    width: 100% !important;
    margin-block-start: 8px !important;
    margin-inline: 0 !important;

    visibility: visible !important;
    opacity: 1 !important;
  }

  /* More specific ChatItem action visibility overrides */
  [class*='ChatItem']:hover [class*='actionBar'],
  [class*='ChatItem']:hover [class*='ActionsBar'],
  [class*='ChatItem']:hover [class*='actions'],
  [class*='ChatItem'] [class*='actionBar']:hover,
  [class*='ChatItem'] [class*='ActionsBar']:hover,
  [class*='ChatItem'] [class*='actions']:hover,
  [class*='ChatItem']:not(:hover) [class*='actionBar'],
  [class*='ChatItem']:not(:hover) [class*='ActionsBar'],
  [class*='ChatItem']:not(:hover) [class*='actions'] {
    visibility: visible !important;
    opacity: 1 !important;
  }

  /* Ensure action buttons in message bubbles are always visible */
  [class*='message'] [class*='action'],
  [class*='bubble'] [class*='action'],
  [class*='chat'] [class*='action'] {
    visibility: visible !important;
    opacity: 1 !important;
  }

  /* Target react-layout-kit flexbox containers for action bars */
  [class*='layoutkit-flexbox'][role='menubar'] {
    visibility: visible !important;
    opacity: 1 !important;
  }

  /* Target all action buttons within layoutkit containers */
  [class*='layoutkit-flexbox'] [role='button'],
  [class*='layoutkit-center'] [role='button'],
  [class*='layoutkit-flexbox'] .anticon,
  [class*='layoutkit-center'] .anticon {
    visibility: visible !important;
    opacity: 1 !important;
  }

  /* Override any hover-based visibility for layoutkit components */
  [class*='layoutkit-flexbox']:not(:hover) [role='button'],
  [class*='layoutkit-center']:not(:hover) [role='button'] {
    visibility: visible !important;
    opacity: 1 !important;
  }

  /* Ensure all action-related elements are always visible */
  [role='menubar'],
  [role='menubar'] * {
    visibility: visible !important;
    opacity: 1 !important;
  }

  /* ChatItem layout: move action bar below the chat bubble */
  [class*='ChatItem'] {
    flex-direction: column !important;
  }

  /* Ensure message content comes first */
  [class*='ChatItem'] [class*='message'],
  [class*='ChatItem'] [class*='bubble'],
  [class*='ChatItem'] [class*='content'] {
    order: 1 !important;
  }

  /* For right-aligned user messages, keep actions aligned to the right */
  [class*='ChatItem'][class*='right'] [class*='actionBar'],
  [class*='ChatItem'][class*='right'] [class*='ActionsBar'],
  [class*='ChatItem'][class*='right'] [class*='actions'] {
    justify-content: flex-end !important;
  }
`;
