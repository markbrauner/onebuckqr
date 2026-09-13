# OneBuckQR updated source

This bundle contains the updated functional source recovered from the current Vercel deployment:

- `public/index.html` — updated with four QR styles (Classic, Rounded, Dots, Bold) and duplicated-URL repair.
- `api/checkout.js` — existing Stripe Checkout endpoint.
- `api/verify.js` — existing Stripe payment verification endpoint.
- `package.json` — recovered package definition.

Before replacing the current production deployment, also copy the existing `public/privacy.html`
and `public/terms.html` from the current Vercel Source view into this bundle so the legal-page content
remains exactly unchanged.

Required Vercel environment variables:
- STRIPE_SECRET_KEY
- SITE_URL (recommended: https://onebuckqr.com)

Do not put Stripe secret keys into source control.
