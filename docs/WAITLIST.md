# SanLaro waitlist – setup

The site is static (GitHub Pages). Signups are POSTed as JSON (`Content-Type: text/plain` to avoid a CORS preflight) to `WAITLIST_ENDPOINT` in `/config.js`. While it is empty the form validates but shows a "Preview lang ito… walang na-save" message and saves nothing.

## Turn it on (Bert, from the Google account that should own the data)
1. Create a new Google Sheet, e.g. **SanLaro Waitlist**. Share it with whoever should read it (e.g. Social Bot's account) as Viewer.
2. In the Sheet: **Extensions → Apps Script**. Replace `Code.gs` with the contents of `docs/waitlist-apps-script.gs`. Save.
3. **Deploy → New deployment → Web app**. Execute as: **Me**. Who has access: **Anyone**. Deploy, approve the permissions (Sheets + send email), copy the **Web app URL** (ends in `/exec`).
4. Paste it into `config.js`: `window.WAITLIST_ENDPOINT = "https://script.google.com/macros/s/…/exec";` and commit to main (or send it to Dev bot).
5. Test: open `https://sanlaro.com/?src=test`, submit once, check the `Waitlist` tab and the hello@sanlaro.com email. Delete the test row.

If you edit the script later: **Deploy → Manage deployments → Edit → New version** (keeps the same URL).

## Data stored
`timestamp, name, city, sports, role, contact, heard_from, src`. No IP or user agent. Honeypot hits are silently dropped. Emails use MailApp (free quota ~100/day on consumer accounts; rows still save if exceeded).

## Channel links
`https://sanlaro.com/?src=fbgroup`, `?src=page`, `?src=ig`, `?src=tiktok` (any `[a-z0-9_-]`, max 32 chars).

## Privacy policy
Consent line in `index.html` has a `PRIVACY POLICY PLACEHOLDER` comment; add the link there once the policy is final.
