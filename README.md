# AgriConnect — download site

The public download page for the AgriConnect Android app. It is a self-contained static
site: plain HTML, CSS and a little JavaScript. No build step, no framework, no dependencies.

The colours, type scale, radii and components are taken from the app's own design system so the
page and the product look like one thing:

| Source | What was reused |
| --- | --- |
| `docs/01-DESIGN-SYSTEM.md` | Colour tokens, Inter type scale, 8dp spacing, radii |
| `android/.../ui/theme/Color.kt`, `Type.kt` | Implemented brand palette and typography |
| `logo.png`, `agri_logo_large.png`, `auth_background.jpg` | Logo, app mark, hero background |
| App screens (`Dashboard`, `Satellite`, `Marketplace`, `Finance`) | Recreated as CSS phone mockups |

## Contents

```
agriconnect-website/
├── index.html                       # the landing / download page
├── privacy.html                     # plain-language privacy notice
├── styles.css                       # all styling (design tokens at the top)
├── script.js                        # progressive enhancement only
├── .nojekyll                        # serve files verbatim on GitHub Pages
├── assets/
│   ├── logo.png                     # 640 × 640 brand logo
│   ├── logo-mark.png                # 192 × 192 app mark / favicon
│   ├── auth-background.jpg          # app auth screen background (hero)
│   ├── og-image.jpg                 # 1200 × 630 social preview card
│   └── agriConnect-1.1.1.apk        # the build people download
└── README.md
```

## Run it locally

Any static file server works. From this folder:

```bash
python -m http.server 8000
# then open http://localhost:8000
```

Or just double-click `index.html`. The page works from `file://` too; only the automatic
"file size" label and the copy-link button behave differently.

## Deploy to GitHub Pages

The site is already a Git repository with one commit. To publish it:

1. Create an empty **public** repository on GitHub, for example `agriconnect-website`.
2. Push this folder to it:

   ```bash
   git remote add origin https://github.com/<your-user>/agriconnect-website.git
   git push -u origin main
   ```

3. In the repository, open **Settings → Pages**.
4. Under **Build and deployment**, choose **Deploy from a branch**, branch `main`, folder `/ (root)`, then **Save**.
5. Wait a minute. The link appears at the top of that page and is usually:

   ```text
   https://<your-user>.github.io/agriconnect-website/
   ```

With the GitHub CLI installed and signed in, steps 1–3 are one command each:

```bash
gh repo create agriconnect-website --public --source=. --remote=origin --push
gh api --method POST /repos/{owner}/agriconnect-website/pages \
  -f 'source[branch]=main' -f 'source[path]=/'
```

The APK is about 24 MB, comfortably under GitHub's 100 MB per-file limit. `.nojekyll` is included
so nothing is filtered by Jekyll.

## Publishing a new APK

1. Build the app (from the app repository):

   ```bash
   cd android
   ./gradlew :app:assembleDebug
   ```

2. Copy the APK over the old one in `assets/` and give it the version in its name:

   ```bash
   cp android/app/build/outputs/apk/debug/app-debug.apk \
      agriconnect-website/assets/agriConnect-<version>.apk
   ```

3. Update the version, file size and SHA-256 in `index.html` (search for `1.1.1`, `data-apk-size`
   and `data-apk-hash`), plus the `href` on every download link.
4. Commit and push. GitHub Pages redeploys automatically.

Get the checksum with:

```bash
# macOS / Linux
shasum -a 256 assets/agriConnect-<version>.apk

# Windows PowerShell
Get-FileHash assets\agriConnect-<version>.apk -Algorithm SHA256
```

## Notes on the current build

- The APK is a **debug-signed** build. There is no release keystore in the project, so Android will
  show the "unsafe app blocked" prompt once on install. The site explains this and offers the
  SHA-256 so the file can be verified.
- Minimum Android version is 7.0 (API 24). Target SDK 35.
- The privacy page is a plain-language summary of `docs/privacy-policy.md`; the full policy is in the
  app under **Profile → Privacy & data**.

## Licence

MIT, matching the AgriConnect project.
