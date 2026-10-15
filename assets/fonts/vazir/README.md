# Vazir webfonts

Unmodified **Farsi-Digits** webfonts from the official **vazir-font 30.1.0** package by Saber Rastikerdar and contributors.

- [Upstream README at v30.1.0](https://github.com/rastikerdar/vazirmatn/blob/v30.1.0/README.md) (the upstream repository was renamed from `vazir-font` to `vazirmatn`).
- [Original npm package](https://www.npmjs.com/package/vazir-font/v/30.1.0).
- [Source archive](https://registry.npmjs.org/vazir-font/-/vazir-font-30.1.0.tgz).
- License: [SIL Open Font License 1.1](OFL.txt); original [authors](AUTHORS.txt) included.

The archive's SHA-512 integrity was checked against npm's release metadata before extracting these files:

```text
sha512-XN2Uprw/Q3QhAAApITykf+v0l4p4FpqvIh0h2XDSJRjwUiYeDpwQxECQF/93ZOCDO2t8haBi6BZZqO8sifYNRg==
```

This directory includes the Thin (100), Light (300), Regular (400), Medium (500), Bold (700), and Black (900) faces from the package's `dist/Farsi-Digits/` folder as WOFF2 and WOFF. It omits other formats, sources, and unused variants. Font and license files are copied unchanged. The local `font-face.css` declares them as `Vazir FD` with `font-display: swap` and WOFF fallback.

The Farsi-Digits variant renders digits with Persian glyphs, including ASCII digits in displayed text. The decorative section numbers also use Persian Unicode digits. URLs, element IDs, JavaScript numbers, and machine-readable metadata retain their original encodings and values.

The site serves the fonts locally; visitors do not need a CDN or npm. To update them, verify a specific official package version, replace the webfonts and original license/authors together, and update this record.
