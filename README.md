# Ali Elyasi | Product Manager, Software & Quality

[ali-elyasi.ir](https://ali-elyasi.ir) is Ali Elyasi's personal website, focused on product management, software, and quality. The Persian interface includes an English resume, contact links, and links to service requests and payment.

## Local development

This is a static HTML, CSS, and JavaScript site. No package installation or build step is required.

From the repository root, run:

```bash
python3 -m http.server 8000 --bind 127.0.0.1
```

Open `http://127.0.0.1:8000` in your browser.

The layout supports mobile, tablet, and desktop screens with RTL text, native section links, and a bottom navigation bar. Sections grow with their content, including in landscape orientation and with enlarged text.

## Font

The site uses the official `vazir-font` package, pinned to version `30.1.0`, with locally hosted **Farsi-Digits** WOFF2/WOFF webfonts (`Vazir FD`). The original font license and attribution are included in [assets/fonts/vazir/](assets/fonts/vazir/README.md). No package installation is needed to serve them.

## Project structure

```text
index.html                            # Main page
assets/css/style.css                  # Styles
assets/js/script.js                   # Panel navigation
assets/fonts/vazir/                   # Official Vazir webfonts and license
assets/images/favicon.png            # Site icon
resumes/AliElyasi_Resume_English.pdf   # Public English resume
CNAME                                 # Custom domain
robots.txt                            # Crawler access and sitemap location
sitemap.xml                           # Canonical public page URL
AGENTS.md                             # Contributor and agent guidance
docs/memory.md                        # Architecture and known issues
docs/status.md                        # Completed work and remaining checks
```

Only the English resume is included in the current site. See [AGENTS.md](AGENTS.md) for contributor guidance, [docs/memory.md](docs/memory.md) for the current architecture, and [docs/status.md](docs/status.md) for completed work and remaining checks.

## SEO and hosting

`index.html` contains the English browser title, Persian main heading, the owner's exact description, Open Graph metadata, and JSON-LD. The description is repeated in the description meta tag, Open Graph, and JSON-LD; keep all three copies consistent. The site has one public HTML page; section hashes are navigation targets and are not separate sitemap entries.

The canonical URL is `https://ali-elyasi.ir/`, matching `CNAME`. If the domain changes, update `CNAME`, the canonical and Open Graph URLs, JSON-LD, `robots.txt`, and `sitemap.xml` together.

The repository contains no deployment workflow or build configuration. Confirm the publishing source in GitHub Pages settings before deploying; a local commit does not confirm that the live site has been updated.

## Verification

The implementation was previously checked in Firefox 136 at 11 viewport sizes from 320 to 1440 pixels wide, including landscape layouts, 200% root text size, Enter navigation, and JavaScript-disabled navigation. These checks used temporary scripts outside the repository; there is no committed test suite or CI. Real-device, other-browser, and live-hosting verification remain listed in [docs/status.md](docs/status.md).

## Contributing

Contributions are always welcome!

## 🔗 Links

[![linkedin](https://img.shields.io/badge/linkedin-0A66C2?style=for-the-badge&logo=linkedin&logoColor=white)](https://www.linkedin.com/in/seyedalielyasi/)
