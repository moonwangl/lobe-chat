# LobeChat Frontend Customization Guide

This guide explains how to remove branding and hide specific functions in your LobeChat instance.

## Overview

LobeChat uses environment variables and feature flags to control branding and functionality. The configuration has been added to your `.env.local` file.

## Environment Variables for Customization

### Branding Configuration

```bash
# Custom application name (replaces "LobeChat")
NEXT_PUBLIC_BRANDING_NAME="Your Custom Name"

# Custom logo URL (replaces LobeChat logo)
# Can be a full URL or relative path
NEXT_PUBLIC_BRANDING_LOGO_URL="https://your-domain.com/your-logo.png"

# Organization name
NEXT_PUBLIC_ORG_NAME="Your Organization"
```

**Note**: The branding configuration has been updated to read from environment variables. Make sure to restart your development server after making changes.

## Feature Flags - Hide Functions

LobeChat uses a single `FEATURE_FLAGS` environment variable to control various features. Use comma-separated values with `+` to enable or `-` to disable features.

### Feature Flags Configuration

```bash
# Format: FEATURE_FLAGS="flag1,flag2,flag3"
# Use + to enable, - to disable
FEATURE_FLAGS="-market,-knowledge_base,+hide_github,+hide_docs"
```

### Available Feature Flags

| Flag                      | Description                        | Default  |
| ------------------------- | ---------------------------------- | -------- |
| `webrtc_sync`             | WebRTC synchronization features    | enabled  |
| `check_updates`           | Update notifications and changelog | enabled  |
| `pin_list`                | Pin list functionality             | enabled  |
| `language_model_settings` | Language model settings panel      | enabled  |
| `provider_settings`       | AI provider settings panel         | enabled  |
| `openai_api_key`          | OpenAI API key settings            | enabled  |
| `create_session`          | Session creation functionality     | enabled  |
| `agent_editing`           | Agent editing capabilities         | enabled  |
| `plugin_dev_mode`         | Plugin development features        | enabled  |
| `dalle`                   | DALL-E image generation            | enabled  |
| `speech_to_text`          | Speech-to-text functionality       | enabled  |
| `token_counter`           | Token counter display              | enabled  |
| `welcome_suggest`         | Welcome suggestions                | enabled  |
| `changelog`               | Changelog notifications            | enabled  |
| `clerk_sign_up`           | Clerk authentication sign-up       | enabled  |
| `market`                  | Market/discover section            | enabled  |
| `knowledge_base`          | Knowledge base features            | enabled  |
| `rag_eval`                | RAG evaluation features            | enabled  |
| `cloud_promotion`         | Cloud promotion features           | enabled  |
| `hide_github`             | Hide GitHub links                  | disabled |
| `hide_docs`               | Hide documentation links           | disabled |

### Example Configurations

**Minimal Setup** (Hide most features):

```bash
FEATURE_FLAGS="-market,-knowledge_base,-plugin_dev_mode,-dalle,-speech_to_text,-token_counter,-welcome_suggest,-check_updates,-agent_editing,-create_session,-pin_list,-language_model_settings,-provider_settings,-openai_api_key,-rag_eval,-cloud_promotion,+hide_github,+hide_docs"
```

**Hide Navigation Links Only**:

```bash
FEATURE_FLAGS="+hide_github,+hide_docs"
```

**Disable AI Features**:

```bash
FEATURE_FLAGS="-dalle,-speech_to_text,-knowledge_base,-rag_eval"
```

## Implementation Steps

1. **Environment Configuration**: The configuration has been added to your `.env.local` file.

2. **Customize Values**: Edit the values in `.env.local` to match your requirements:

   - Replace placeholder URLs with your actual logo URL
   - Change the branding name to your preferred name
   - Adjust feature flags based on what you want to hide/disable

3. **Restart Development Server**: After making changes, restart your development server:

   ```bash
   pnpm dev
   ```

4. **Build for Production**: When ready for production:
   ```bash
   pnpm build
   pnpm start
   ```

## Additional Customization

### Custom Styling

For deeper UI customization, you can modify:

- `src/styles/globals.css` - Global styles
- Component-specific CSS modules
- Tailwind configuration in `tailwind.config.js`

### Logo Placement

For local logos, place them in the `public` folder and reference them as:

```bash
NEXT_PUBLIC_BRANDING_LOGO_URL="/your-logo.png"
```

### Environment-Specific Configuration

- `.env.local` - Local development (ignored by git)
- `.env.production` - Production environment
- `.env` - Default values (committed to git)

## Verification

After applying the configuration:

1. Check that your custom branding appears in the header
2. Verify that hidden features are no longer visible
3. Test that remaining functionality works as expected

## Troubleshooting

- **Changes not appearing**: Restart the development server
- **Logo not loading**: Ensure the URL is publicly accessible
- **Feature still visible**: Check the exact environment variable name and value
- **Build errors**: Verify all environment variables are properly formatted

## Notes

- Environment variables starting with `NEXT_PUBLIC_` are exposed to the browser
- Changes to environment variables require a server restart
- Some features may have dependencies on other features
- Always test thoroughly before deploying to production
