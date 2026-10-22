# StackedHub mobile installation

This adds a Progressive Web App to the **existing branded homepage** (`/`). It does not create an APK or native iOS application.

## Build and deployment
1. Install dependencies: `npm ci` (or `npm install` if the lockfile is not compatible).
2. Build: `npm run build`.
3. Deploy the updated frontend over HTTPS. The `public` assets must be served at root URLs `/manifest.webmanifest`, `/sw.js` and `/icons/*`.
4. Open the deployed URL on a phone. Android Chrome: menu > Install app. iPhone Safari: Share > Add to Home Screen.
5. Test homepage, sign-in, customer order, staff status changes and logout on actual devices.

## Limitations
- The service worker deliberately does not cache order pages, API responses or user/payment data. An internet connection is needed for ordering.
- The icons are simple temporary StackedHub lettermark placeholders; replace with approved brand artwork before final submission.
- iOS/Android installation behaviour depends on browser/version and HTTPS deployment.
- Do not claim production payment, delivery tracking or offline checkout from this PWA work.
