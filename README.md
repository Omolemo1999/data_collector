# Voice Data Collector — Netlify Edition

A temporary volunteer voice-data collection web app designed for Netlify.

## What it does

- Volunteer consent flow
- Browser microphone recording
- Anonymous participant code
- 10 guided recording prompts
- Categories: fear, scream, not_fear, background
- Every upload starts as **pending**
- Password-protected researcher back office
- Reviewer audio playback
- Approve/reject + reviewer notes
- Approved CSV export
- Persistent audio storage using **Netlify Blobs**
- No payment processing

Approval is only the researcher's dataset-quality gate. The application does not send or track payments.

## Deploy to Netlify

### 1. Put this project in a Git repository

Upload the contents of this folder to GitHub/GitLab/Bitbucket.

### 2. Import the repository in Netlify

In Netlify choose **Add new project → Import an existing project**, select the repository, and deploy it.

The included `netlify.toml` uses:

- Build command: `npm run build`
- Node: 22

### 3. Add the environment variable

In Netlify site settings, add:

`ADMIN_PASSWORD` = a strong password you choose.

Do not put your password into source code.

### 4. Netlify Blobs

The app stores audio and metadata in the Netlify Blobs store named `voice-recordings`. No S3 bucket is required.

### 5. URLs

Participant page:

`https://YOUR-SITE.netlify.app/`

Researcher back office:

`https://YOUR-SITE.netlify.app/admin/login`

## Local development

Use Netlify's local runtime so Blob behavior matches deployment:

```bash
npm install
npx netlify dev
```

Then open the URL shown by Netlify CLI.

For a simple Next.js-only local test, `npm run dev` can still start the UI, but Netlify Blob storage is intended to be tested through `netlify dev`.

## Data handling

Recordings may contain a person's voice, which can be personal data. Before collecting real volunteers, make sure your consent wording, retention period, access controls, and research/ethics requirements are appropriate for your project.

The current prompts are acted voice exercises. Volunteers should not be instructed to place themselves in danger.


## Points and voluntary compensation

Each approved recording awards **100 points**. The conversion is linear: 100 points = R10, 200 = R20, 500 = R50, and 1,000 = R100. Rejected recordings earn 0 points. The app does not execute payments; the researcher can use the approved points and payout details to make a separate bank transfer.

Participants may provide account-holder name, bank name, bank account number, account type and branch code. **Do not collect card numbers, CVV/CVC, PINs, online-banking passwords or OTPs.** Bank-account numbers are encrypted with AES-256-GCM and require `PAYOUT_ENCRYPTION_KEY` in Netlify.
