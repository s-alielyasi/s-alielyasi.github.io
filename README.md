# Ali Elyasi's Personal Website

[ali-elyasi.ir](https://ali-elyasi.ir) is my personal website where you can find out about me, my career and my education background.

And In it you can find out ways to get in touch with me.

You can also contact me about designing various websites, testing and implementing the software quality assurance process.


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
```

Only the English resume is published. See [AGENTS.md](AGENTS.md) and [docs/memory.md](docs/memory.md) for development guidance and known issues.

## Contributing

Contributions are always welcome!


## 🔗 Links

[![linkedin](https://img.shields.io/badge/linkedin-0A66C2?style=for-the-badge&logo=linkedin&logoColor=white)](https://www.linkedin.com/in/seyedalielyasi/)
