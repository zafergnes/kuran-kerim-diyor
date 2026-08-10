# Store Release Runbook — Kur'an-ı Kerim Diyor 1.0.0

This document is the release gate for App Store Connect and Google Play Console. A release must not be submitted while any item marked **OWNER REQUIRED** is unresolved.

## Build identity

- iOS bundle ID: `com.kurankerimdiyor`
- Android application ID: `com.kurankerimdiyor`
- App version: `1.0.0`; iOS build `1`; Android version code `1`
- Expo SDK 54 targets Android API 36, satisfying the Google Play requirement effective 31 August 2026.
- Production builds use `eas build --platform all --profile production`.
- The first iOS release intentionally excludes the unfinished widget extension. Android keeps the existing widget configuration. Re-enable the iOS widget only after supplying the real ten-character Apple Team ID and testing the extension on a physical device.
- Universal links/app links are intentionally disabled for 1.0 because the production domain does not yet publish valid AASA and `assetlinks.json` association files. The custom app scheme remains available.

## Required production secrets and ownership

- **OWNER REQUIRED before AI testing/submission:** Open Admin → AI Ayarları, enter a valid Gemini API key and complete the built-in connection test. The key is encrypted at rest and AI verse chat returns 503 until configured.
- **OWNER REQUIRED:** Set a long random `JWT_SECRET`; never use the compose example/default value.
- Support does not depend on email: `/support` creates a private-status ticket and `/admin/support` manages it. Verify ticket creation, status lookup and admin response after every production deployment.
- **OWNER REQUIRED:** Confirm the Apple Developer and Google Play developer agreements, tax/contact details and signing credentials.
- Content provenance, exact translation matches and public attributions are recorded in `docs/CONTENT_SOURCES.md` and exposed at `/sources`. **OWNER REQUIRED before monetization:** re-check territory-specific translation/recitation rights and obtain any additional commercial permission; current audio terms are framed around free personal and educational use.
- Keep Firebase iOS/Android configuration in the encrypted build-secret path; do not publish it in documentation or screenshots.

## Review notes

Paste and adapt this in both review consoles:

> Kur'an-ı Kerim Diyor is usable without an account. Account features synchronize favorites, collections, comments and reading progress. Reviewers can choose “Continue as guest.” AI verse discussion opens from the small sparkle button on a verse and is limited to that verse plus nearby Quran context. It is described as educational reflection, not a fatwa or authoritative translation. Every AI response can be reported. Comments are filtered before publication, can be reported, and abusive users can be blocked. Account deletion is available in Profile and at https://kurannediyor.com.tr/account-deletion. Privacy: https://kurannediyor.com.tr/privacy. Sources and attributions: https://kurannediyor.com.tr/sources. Support: https://kurannediyor.com.tr/support.

If the backend is protected by staging credentials, include working reviewer credentials and exact navigation steps in the private review-notes field. Never put credentials in public store text.

## Apple privacy answers

Declare based on the production behavior, not marketing intent:

- Contact info: email address and optional name — app functionality/account management; linked to identity; not tracking.
- User content: comments, favorites and collections — app functionality and moderation; linked for registered accounts; not tracking.
- Product interaction: app opens, screens, onboarding/auth stages, AI feature use and reading-progress percentages — analytics; anonymous random install/session IDs for guests and linked user ID when authenticated; not tracking.
- Identifiers: random install/session identifier, account ID and push token — analytics/app functionality; not advertising; not tracking.
- Diagnostics: declare only if the final binary or enabled SDK actually sends crash/performance data. No crash SDK is presently configured.
- AI questions and selected verse context are sent to Google Gemini to provide the requested feature. Chat history is not stored by this backend. When the user reports an AI answer, its ID, verse, reason and an excerpt up to 500 characters are retained for review.
- No precise location, contacts, photos, microphone, health, payment or advertising data is requested by current app code.

The public privacy-policy URL must be placed in App Store Connect, and the same policy is linked from in-app Settings.

## Google Play Data safety

- Mark collection of account email/name, user-generated comments, app interactions, account/user IDs and push token.
- Mark data as encrypted in transit (production must remain HTTPS-only).
- Mark account data and user content as linked to the user; anonymous analytics uses a random app identifier and must not be represented as advertising tracking.
- State purposes: app functionality, account management, analytics, fraud prevention/security and developer communications where applicable.
- Mark that users can request deletion. In-app route: Profile → Delete Account. Web URL: `https://kurannediyor.com.tr/account-deletion`.
- Complete the AI-generated content and UGC declarations truthfully. The app contains text-to-text generative AI and public comments.
- Complete content rating with UGC/online interaction disclosed; do not classify the product as designed for children unless the entire Families policy is intentionally implemented.

## Functional review gate

- Fresh install: all onboarding paths, Skip, guest use, registration and login.
- Core reading in Turkish, English, Arabic (RTL), German, French and Spanish; no missing-key text; source attribution page accessible from Settings.
- AI chat as guest and registered user; follow-up context; off-topic refusal; rate-limit message; unsafe/inaccurate report.
- Comment terms acceptance, submission, pending moderation state, report, block and admin response.
- Account deletion, 14-day reactivation and scheduled permanent deletion.
- Analytics opt-out: no further event posts after disabling.
- Notification denial and later enablement from Settings; core reading must remain usable without permission.
- Airplane mode, backend 401/429/5xx, small phone, tablet, dark mode and Arabic RTL.
- iOS archive/TestFlight on a physical iPhone and iPad; Android AAB internal-track test on a physical API 36 device.
- Verify screenshots contain no personal data, debug UI, test comments or unverifiable religious/medical claims.

## Deployment order

1. Back up the production database.
2. Deploy the backend image and run the Prisma migration once.
3. Verify health, auth, analytics, admin, moderation, deletion and AI endpoints over HTTPS.
4. Deploy the web build and confirm privacy, terms, support and deletion pages in all six languages.
5. Run an internal mobile build against production and complete the functional gate above.
6. Freeze translations and screenshots, then submit the same tested binaries to both stores.
