# OneBuckQR v2 release test plan

Do not merge to production until all items pass on a preview deployment.

## Purchase flows
- $1 purchase creates one credit, uses one for the current QR, leaves 0.
- $4 purchase creates five credits, uses one for the current QR, leaves 4.
- $7 purchase creates ten credits, uses one for the current QR, leaves 9.
- Repeat checkout verification does not double-add purchased credits.

## Wallet and recovery
- Remaining credit count survives browser refresh.
- A returning customer can make another QR using one stored credit.
- Each use reduces the balance by exactly one.
- Recovery email restores the correct wallet on a second browser/device.
- Recovery link expires after 30 minutes.
- Unknown email does not disclose whether a customer exists.

## QR output
- Classic, Rounded, Dots, and Bold scan correctly.
- PNG scans correctly.
- SVG scans correctly.
- Custom filename is respected for both formats.
- Blank or unsafe filename falls back to a safe name.
- Destination shown in preview exactly matches encoded URL.

## UX
- PNG is selected by default with plain-language explanation.
- SVG explanation clearly mentions print and large-format use.
- Bundle purchase requires email for 5 and 10 packs.
- Mobile layout works on common phone widths.
- Help and credit recovery are fully self-service.

## Production safety
- Existing onebuckqr.com remains unchanged during testing.
- Stripe live/test mode is confirmed intentionally before release.
- Required environment variables are present: STRIPE_SECRET_KEY, SITE_URL, RESEND_API_KEY, RECOVERY_FROM_EMAIL (and optional WALLET_SIGNING_SECRET).
