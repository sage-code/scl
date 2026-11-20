To improve the security of your DMARC record, you need to move from passive monitoring (`p=none`) to active enforcement (`p=quarantine` and then `p=reject`) while tightening alignment rules.

### 1. Recommended Target Record

Once you verify in your incoming `rua` reports that Resend and any other legitimate services consistently pass authentication, update your `_dmarc` TXT record to:

```text
v=DMARC1; p=reject; sp=reject; adkim=s; aspf=s; rua=mailto:report@mail.sagecode.org;

```

### 2. What Each Security Upgrade Does

* **`p=reject` (Maximum Enforcement):** Replaces `p=none`. Instructs receiving mail servers to outright block and bounce any email claiming to come from `sagecode.org` that fails DMARC authentication, stopping spoofing completely.
* **`sp=reject` (Subdomain Protection):** Explicitly enforces `reject` across all subdomains (like `mail.sagecode.org` or any unused subdomain), preventing attackers from spoofing non-existent or unconfigured subdomains.
* **`adkim=s` (Strict DKIM Alignment):** Requires the DKIM signature domain (`d=`) to match the exact sending domain in the `From:` header rather than allowing organizational subdomain mismatches. (Note: Keep `adkim=r` if you send from `@sagecode.org` while signing with `d=mail.sagecode.org`.)
* **`aspf=s` (Strict SPF Alignment):** Requires the `Return-Path` domain to match the exact `From:` domain. **Important for Resend:** Because Resend uses `send.sagecode.org` (or `send.mail.sagecode.org`) as its default `Return-Path`, keep **`aspf=r`** (Relaxed) so Resend's subdomain aligns with your `From:` address—unless you disable Resend's custom return-path or match the exact subdomain.

### 3. Safe Rollout Sequence (Avoid Blocking Legitimate Mail)

Never jump directly from `p=none` to `p=reject` without verifying your reports first, or legitimate emails will bounce.

1. **Audit Incoming RUA Reports Under p=none:** Current Stage (1–2 Weeks).
Review the XML reports arriving at `report@mail.sagecode.org` (or upload them to a parser like `checkdmarc.email`). Confirm that every legitimate sender—including Resend and any personal email providers—passes both DKIM and SPF alignment.
*Verification:* Zero legitimate sending IPs show `fail` in the `<policy_evaluated>` block of your reports.


2. **Step Up to Quarantine:** Intermediate Stage (1 Week).
Update your TXT record to route failures to the recipient's spam folder instead of blocking them outright:
`v=DMARC1; p=quarantine; sp=quarantine; pct=100; adkim=r; aspf=r; rua=mailto:report@mail.sagecode.org;`
*Verification:* Send test emails from all active services (Resend transactional emails, webmail) to external accounts (Gmail, Outlook) and confirm they land in the primary Inbox, not Spam.


3. **Lock Down with p=reject:** Final Stage.
Once `quarantine` runs cleanly with zero false positives, switch `p=quarantine` and `sp=quarantine` to `reject` (and tighten `adkim=s` if your DKIM `d=` domain matches your exact `From:` domain):
`v=DMARC1; p=reject; sp=reject; adkim=s; aspf=r; rua=mailto:report@mail.sagecode.org;`
*Verification:* Query `_dmarc.sagecode.org` using `dig TXT _dmarc.sagecode.org` to confirm `p=reject` is live, and verify in subsequent `rua` reports that unauthorized spoofing attempts are marked as `reject`.