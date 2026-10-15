# Ali Elyasi | Product Manager, Software & Quality

[ali-elyasi.ir](https://ali-elyasi.ir) is Ali Elyasi's personal website, focused on product management, software, and quality. The Persian interface includes professional highlights from the English resume, a writing-profile link, contact links, and links to service requests and payment.

## Local development

This is a static HTML, CSS, and JavaScript site. Viewing the source requires no package installation or application build. From the repository root, run:

```bash
python3 -m http.server 8000 --bind 127.0.0.1
```

Open `http://127.0.0.1:8000`. The layout supports RTL text, mobile and tablet sizes, landscape orientation, native section links, keyboard focus, and enlarged text.

## Repeatable checks

Development tools require Node.js 22.12 or later on a [Playwright-supported OS](https://playwright.dev/docs/intro#system-requirements). They are not runtime dependencies of the website.

```bash
npm ci
npx playwright install --with-deps chromium firefox webkit
npm run check
npm run test:release
npm test
```

Playwright tests cover Chromium, Firefox, WebKit, Android/iPhone emulation, and iPad emulation. They check layout, keyboard navigation, focus visibility, large text, JavaScript-disabled links, metadata, assets, and automated WCAG rules with axe. Emulation and automated accessibility checks do not replace real-device or manual screen-reader testing.

`test:release` uses Node's test runner and OpenSSL to serve local HTTPS fixtures. It verifies that live-release checks accept matching files and reject stale HTML, metadata, assets, and plain HTTP.

If the bundled Chrome download is unavailable in your location, an already installed Google Chrome can run the Chromium projects:

```bash
npx playwright install --with-deps firefox webkit
PW_CHROME_CHANNEL=chrome npm test
```

```bash
npm run test:report
npm run test:links -- docs/link-checks.json
```

External-link checks make public GET requests only. Network failures and access restrictions are recorded separately from confirmed missing pages. External availability does not block pull-request checks.

## Release artifact and Pages

```bash
npm run build
node scripts/serve.mjs
```

Preview the release artifact at `http://127.0.0.1:4173`. Packaging copies the public site files and licenses into ignored `dist/`; it does not compile or bundle the application. Development documents, tests, dependencies, and Git metadata are excluded.

[The GitHub Actions workflow](.github/workflows/site.yml) runs checks on pull requests to `master` and pushes to `master` or `feat/**`. Deployment runs only from `master`, after checks pass. It uploads `dist/` to GitHub Pages and verifies the live title, metadata, assets, font, and resume over HTTPS.

The owner creates and merges pull requests and manages Actions runs and Pages settings through GitHub. Development changes are delivered on a separate branch; remote operations require an explicit request. The workflow, tests, and release scripts support the owner's checks and releases.

Pages must use **GitHub Actions** as its publishing source. See [docs/deployment.md](docs/deployment.md) for the owner's release steps and [docs/status.md](docs/status.md) for verified PR, CI, and live-site status.

## Font

The site uses the official `vazir-font` package, pinned to `30.1.0`, with locally hosted **Farsi-Digits** WOFF2/WOFF webfonts (`Vazir FD`). Original license, attribution, source, and integrity are in [assets/fonts/vazir/](assets/fonts/vazir/README.md). Serving the fonts needs no npm or CDN.

## Project structure

```text
index.html                            # Page, content, SEO metadata
assets/css/style.css                  # Responsive styles
assets/js/script.js                   # Active section navigation
assets/fonts/vazir/                   # Official Farsi-Digits webfonts and OFL
assets/images/favicon.png            # Site icon and Open Graph image
resumes/AliElyasi_Resume_English.pdf   # Public English resume
CNAME                                 # Custom domain
robots.txt                            # Crawler access and sitemap location
sitemap.xml                           # Canonical public page URL
LICENSE                               # MIT for code and development docs
package.json                          # Development and release commands
package-lock.json                     # Exact development dependency versions
playwright.config.js                  # Browser and device-emulation projects
scripts/                              # Validation, packaging, preview and live checks
tests/                                # Browser, accessibility and release-verification tests
.github/workflows/site.yml            # PR checks and gated Pages deployment
AGENTS.md                             # Contributor and agent guidance
docs/memory.md                        # Current architecture
docs/status.md                        # Verified project status and remaining checks
docs/deployment.md                    # Hosting and verification guide
docs/link-checks.json                 # Dated external-link check results
```

Only the English resume is included. See [AGENTS.md](AGENTS.md), [docs/memory.md](docs/memory.md), and [docs/status.md](docs/status.md) before making changes.

## SEO

`index.html` contains the English browser title, Persian main heading, the owner's exact description, Open Graph metadata, and JSON-LD. Keep the description meta tag, Open Graph description, and JSON-LD description consistent.

The canonical URL is `https://ali-elyasi.ir/`, matching `CNAME`. Domain changes must update `CNAME`, canonical/Open Graph URLs, JSON-LD, `robots.txt`, and `sitemap.xml` together. Section hashes are navigation targets, not separate sitemap pages.

## Contributing and license

Contributions are welcome. The code and development documentation use the [MIT License](LICENSE). Fonts retain their [SIL Open Font License](assets/fonts/vazir/OFL.txt). The resume, personal biographical content, and AE branding are outside the code license.

## Links

[LinkedIn](https://www.linkedin.com/in/seyedalielyasi/)
