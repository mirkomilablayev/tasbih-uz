# tasbih.uz — launch guide

Do the steps in order. Each one takes about 5–15 minutes.

---

## 0. Before you deploy

1. Leave the **`.claude`** folder out when you upload. It's only for local preview.

Files that must be uploaded:

```
index.html  style.css  app.js  404.html
icon.svg  icon-192.png  icon-512.png  apple-touch-icon.png  favicon-32.png
og-image.png  manifest.webmanifest  robots.txt  sitemap.xml  netlify.toml
```

---

## 1. Deploy to Netlify

**Easiest (drag and drop):**
1. Sign in at https://app.netlify.com
2. Open **Add new site → Deploy manually** (or go to https://app.netlify.com/drop).
3. Drag the folder (without `.claude`) onto the page. You get a URL like `random-name-123.netlify.app`.
4. Go to **Site configuration → Change site name** and set it to **`tasbih-uz`**.
   (`netlify.toml` redirects `tasbih-uz.netlify.app` → `tasbih.uz` so Google doesn't see two copies of the site.
   If you pick a different name, change that line in `netlify.toml` to match.)

**Better long-term (auto deploy):** push the folder to a GitHub repo, then choose **Add new site → Import from Git**.
Every `git push` redeploys the site automatically.

To update later with drag and drop: open the site → **Deploys** tab → drag the folder again.

---

## 2. Connect the tasbih.uz domain

1. In Netlify: **Domain management → Add a domain** → type `tasbih.uz` → confirm you own it.
2. Log in to the panel of the company where you bought the .uz domain (ahost.uz, webspace.uz, etc.) and open **DNS settings**.
   Pick ONE option:

   **Option A — keep your registrar's DNS (simple):**

   | Type  | Name / Host | Value                      |
   |-------|-------------|----------------------------|
   | A     | `@`         | `75.2.60.5`                |
   | CNAME | `www`       | `tasbih-uz.netlify.app`    |

   Delete any other A records for `@` (for example, the registrar's parking page).

   **Option B — use Netlify DNS:** in Netlify choose "Set up Netlify DNS". It gives you 4 nameservers
   (`dns1.p0X.nsone.net` …). Replace the domain's nameservers with those in your registrar panel.

3. Wait for DNS to update (usually 15 min – a few hours; for .uz it can take up to 24 h).
4. In Netlify **Domain management → HTTPS**, click **Verify DNS configuration**, then **Provision certificate**.
   HTTPS is free (Let's Encrypt). Set `tasbih.uz` (without www) as the **primary domain**.

Check it: open https://tasbih.uz and https://www.tasbih.uz. The second one should redirect to the first.

---

## 3. Google Analytics 4 (visitor statistics)

1. Go to https://analytics.google.com → **Start measuring** (or **Admin → Create → Account**).
2. Account name: `Tasbih.uz`. Property name: `tasbih.uz`. Time zone: **Uzbekistan (GMT+05:00)**. Currency: **UZS**.
3. Choose platform **Web** → Website URL `https://tasbih.uz` → Stream name `tasbih.uz` → **Create stream**.
4. Copy the **Measurement ID**. It looks like `G-AB12CD34EF`.
5. Open `index.html`, find this line (about line 68):
   ```js
   window.GA_ID = "G-XXXXXXXXXX";
   ```
   Replace `G-XXXXXXXXXX` with your ID. Save and redeploy (step 1).
6. Open https://tasbih.uz on your phone, then check **Reports → Realtime** in GA. You should appear within about 1 minute.

The site already sends these custom events (under **Reports → Engagement → Events**):
- `dhikr_round_complete`: someone finished 33/99/100 (includes which dhikr)
- `about_open`: someone opened the "i" info window

GA doesn't load on `localhost`, so your own testing on your computer doesn't pollute the stats.

---

## 4. Google Search Console (appear in Google search)

1. Go to https://search.google.com/search-console → **Add property**.
2. Choose **Domain** → enter `tasbih.uz` → Google shows a **TXT record** like `google-site-verification=abc123...`
3. Add it in your DNS panel (the registrar, or Netlify DNS if you chose Option B):

   | Type | Name | Value                               |
   |------|------|-------------------------------------|
   | TXT  | `@`  | `google-site-verification=abc123...` |

4. Go back to Search Console → **Verify**. If it fails, wait an hour and try again.

   *Alternative if DNS is hard:* choose **URL prefix** → `https://tasbih.uz/` → method **HTML tag**.
   Copy the `content="..."` code into the commented line in `index.html` (about line 15), uncomment it, redeploy, then click Verify.

5. After verifying:
   - **Sitemaps** (left menu) → enter `sitemap.xml` → **Submit**.
   - **URL inspection** (search bar at top) → `https://tasbih.uz/` → **Request indexing**.
6. Link it to Analytics: in GA **Admin → Product links → Search Console links → Link**.

It usually takes a few days to 2 weeks before the site shows up in Google. Check **Performance** in Search Console to see what people search to find you.

---

## 5. Yandex Webmaster (recommended for Uzbekistan)

Many people in Uzbekistan use Yandex, so register there too:
1. https://webmaster.yandex.com → **Add site** → `https://tasbih.uz`
2. Verify with the **meta tag**: paste Yandex's `<meta name="yandex-verification" ...>` into `<head>` of `index.html` next to the Google one, then redeploy.
3. **Indexing → Sitemap files** → add `https://tasbih.uz/sitemap.xml`.
4. **Indexing → Reindex pages** → add `https://tasbih.uz/`.

Optional: **Bing Webmaster Tools** (https://www.bing.com/webmasters). Choose "Import from Google Search Console". It takes 1 minute.

---

## 6. Check that everything works

| What                   | Tool                                                       |
|------------------------|------------------------------------------------------------|
| Speed & SEO score      | https://pagespeed.web.dev → enter `https://tasbih.uz`       |
| Structured data        | https://search.google.com/test/rich-results                 |
| Link preview image     | https://www.opengraph.xyz                                  |
| Telegram preview       | Send the link to **@WebpageBot** on Telegram (it also refreshes Telegram's cached preview) |

---

## 7. Getting visitors (what actually moves SEO)

- Share `https://tasbih.uz` in Telegram channels and groups, especially around Ramadan and Fridays. Links from other sites and channels are what raise you in Google.
- Ask friends to "Add to Home Screen" on their phones. The site installs like an app (icon included).
- When you change the site, update `<lastmod>` in `sitemap.xml` to the new date.

---

## Quick reference: placeholders to fill in

| File         | What                                    | Line (approx.) |
|--------------|-----------------------------------------|----------------|
| `index.html` | `G-XXXXXXXXXX` → your GA4 Measurement ID | 68             |
| `index.html` | Google verification meta (only if using HTML-tag method) | 15 |
| `netlify.toml` | `tasbih-uz.netlify.app` → your Netlify site name, if different | 13 |

Contact: Mirkomil Ablayev — https://telegram.me/mirkomil_ablayev
