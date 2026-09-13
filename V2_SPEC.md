# OneBuckQR v2

## Product promise
- $1 for 1 QR credit
- $4 for 5 QR credits
- $7 for 10 QR credits
- Unused purchased credits never expire
- Generated QR codes are static and do not depend on OneBuckQR remaining online
- No subscriptions
- Self-service by design

## UX
- Paste and visibly confirm destination URL
- Four QR styles: Classic, Rounded, Dots, Bold
- Customer chooses a friendly filename before download
- PNG is default: best for websites, social media, email, and everyday use
- SVG: best for printing or making the QR large, including posters, signs, and business cards
- Bundle customers provide email for future credit recovery
- Credit balance is displayed after purchase and on return

## Support philosophy
Cheap on purpose. Simple on purpose. No sales team, account managers, subscriptions, or upsells. Common recovery and troubleshooting flows should be automated so individual support is rarely required.

## Implementation
The `v2-bundles` branch is a non-production work branch. Stripe Customer metadata stores persistent credit balances. Signed wallet tokens let a returning browser use its balance without passwords. Cross-device email recovery is the next integration step and should be automated before production launch.
