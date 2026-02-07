# PWA Install Prompt Feature

## Overview

This feature adds a Progressive Web App (PWA) installation prompt for first-time users, encouraging them to install the app for a better experience.

## Components

### 1. **PWAInstallPrompt Component**
Location: `src/components/PWAInstallPrompt.tsx`

A beautiful, animated modal that prompts users to install the PWA. Features include:

- **Platform Detection**: Automatically detects iOS, Chrome/Edge, and other browsers
- **Native Integration**: Uses the browser's native `beforeinstallprompt` event when available
- **iOS Instructions**: Provides step-by-step instructions for iOS users (Safari)
- **Responsive Design**: Fully responsive with smooth animations using Framer Motion
- **Theme Integration**: Uses the app's theme colors for consistent branding

#### Features:
- ✅ Detects if app is already installed (standalone mode)
- ✅ Shows platform-specific installation instructions
- ✅ Displays benefits of installing (offline support, fast loading, etc.)
- ✅ Skip/Install options with clear CTAs
- ✅ Auto-closes on install or if already installed

### 2. **usePWAInstall Hook**
Location: `src/hooks/usePWAInstall.ts`

A custom React hook that manages the PWA prompt state and user preferences.

#### Features:
- **First-Time Detection**: Only shows prompt for new users
- **Persistence**: Remembers user choice using localStorage
- **Delayed Display**: Shows prompt 2 seconds after login for better UX
- **State Management**: Tracks dismissed/installed states

#### API:
```typescript
const {
  shouldShowPrompt,  // boolean - whether to show the prompt
  handleDismiss,     // function - call when user dismisses
  handleInstall,     // function - call when user installs
  resetPrompt,       // function - reset state (for testing)
} = usePWAInstall();
```

### 3. **Dashboard Integration**
Location: `src/app/dashboard/page.tsx`

The prompt is integrated into the dashboard page and shows after successful login.

```tsx
// PWA Install Prompt
const { shouldShowPrompt, handleDismiss, handleInstall } = usePWAInstall();

// In JSX
{shouldShowPrompt && (
  <PWAInstallPrompt
    onClose={handleDismiss}
    onInstall={handleInstall}
  />
)}
```

### 4. **Admin Testing Panel**
Location: `src/app/admin/page.tsx`

Admin users can reset the PWA prompt to test the first-time user experience:

- Navigate to `/admin`
- Go to the "Migrations" tab
- Click "Reset PWA Install Prompt"
- Refresh the dashboard to see the prompt again

## User Flow

### First-Time User (Chrome/Edge):
1. User logs in and lands on dashboard
2. After 2 seconds, PWA install prompt appears
3. User sees benefits and native install button
4. Click "Install Now" → Browser's native install prompt
5. App is added to home screen/app drawer
6. Prompt never shows again

### First-Time User (iOS/Safari):
1. User logs in and lands on dashboard
2. After 2 seconds, PWA install prompt appears
3. User sees step-by-step iOS installation instructions:
   - Tap Share button
   - Tap "Add to Home Screen"
   - Tap Add
4. User can dismiss or follow instructions
5. Choice is remembered

### Returning User:
- Prompt does not show if:
  - User previously installed the app
  - User previously dismissed the prompt
  - App is already running in standalone mode

## LocalStorage Keys

- `pwa_install_prompt_dismissed`: Set to "true" when user clicks "Maybe Later"
- `pwa_install_installed`: Set to "true" when user successfully installs

## Browser Support

| Browser | Support | Install Method |
|---------|---------|----------------|
| Chrome (Android/Desktop) | ✅ Full | Native prompt |
| Edge (Desktop) | ✅ Full | Native prompt |
| Safari (iOS) | ⚠️ Manual | Step-by-step instructions |
| Firefox | ⚠️ Limited | Manual (no native prompt) |
| Samsung Internet | ✅ Full | Native prompt |

## Customization

### Styling
The component uses your app's theme colors:
- Primary color for header and buttons
- Responsive design for all screen sizes
- Dark mode support

### Timing
Adjust the delay before showing the prompt in `usePWAInstall.ts`:
```typescript
const timer = setTimeout(() => {
  setShouldShowPrompt(true);
}, 2000); // Change this value (milliseconds)
```

### Content
Modify the benefits, instructions, or text in `PWAInstallPrompt.tsx`

## Testing

1. **Local Testing**:
   ```bash
   npm run dev
   ```
   - Clear browser data
   - Login as a new user
   - Wait 2 seconds to see the prompt

2. **Reset Prompt**:
   - Go to `/admin`
   - Click "Reset PWA Install Prompt"
   - Or manually clear localStorage:
     ```javascript
     localStorage.removeItem("pwa_install_prompt_dismissed");
     localStorage.removeItem("pwa_install_installed");
     ```

3. **Production Testing**:
   - Must be served over HTTPS
   - Service worker must be registered
   - Manifest file must be properly configured

## Future Enhancements

Potential improvements:
- [ ] Add analytics tracking for install metrics
- [ ] Show prompt only after user performs certain actions (e.g., 3 expenses added)
- [ ] A/B test different messaging
- [ ] Add screenshot preview of installed app
- [ ] Show reminder after X days if dismissed
- [ ] Platform-specific screenshots in prompt

## Troubleshooting

**Prompt not showing:**
- Check browser console for errors
- Verify localStorage is not blocked
- Check if running over HTTPS (required for PWA)
- Verify service worker is registered

**Install button not working:**
- `beforeinstallprompt` event may not be supported
- User may have already installed
- Check browser compatibility

**iOS not showing instructions:**
- Verify running in Safari (not Chrome on iOS)
- Check if already in standalone mode

## Related Files

- Service Worker: `public/sw.js`
- Manifest: `public/manifest.json`
- Theme Config: `src/lib/theme.ts`
- Auth Flow: `src/app/auth/signin/page.tsx`
