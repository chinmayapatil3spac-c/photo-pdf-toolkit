# Photo PDF Toolkit

Photo PDF Toolkit is a lightweight, privacy-first web app for turning photos into a polished PDF. It is built with HTML5, CSS3, and vanilla JavaScript, and runs entirely in the browser so private images never need to leave the device.

## Features

- Select up to 30 JPG, JPEG, PNG, or WebP images from a phone or computer.
- Preview filenames and thumbnails, remove images, and move pages earlier or later.
- Add more images without losing the current selection.
- Export as A4, Letter, or image-sized pages.
- Choose portrait or landscape orientation, page margins, and Fit, Fill, or Original image behavior.
- Download a single generated PDF with a loading state and helpful errors.
- Responsive, mobile-first UI with keyboard-accessible controls.

## Local development

This is a static site and has no build step or backend:

```bash
git clone https://github.com/chinmayapatil3spac-c/photo-pdf-toolkit.git
cd photo-pdf-toolkit
python3 -m http.server 8080
```

Open `http://localhost:8080` in a browser. A local HTTP server is recommended because it matches GitHub Pages behavior and avoids browser restrictions around local files.

## Project structure

```text
.
├── index.html                 # App markup and accessible UI
├── styles.css                 # Responsive visual system
├── app.js                     # Local image state and jsPDF export
├── vendor-jspdf.umd.min.js    # Vendored jsPDF browser bundle
├── .nojekyll                  # Serve the site without Jekyll processing
└── .github/workflows/pages.yml # GitHub Pages deployment workflow
```

## GitHub Pages deployment

The repository includes a workflow that deploys the repository root to GitHub Pages whenever `main` changes.

1. Add a repository secret named `PAGES_TOKEN` containing a fine-grained token with repository administration and Pages write permissions.
2. Push changes to `main`.
3. Wait for the **Deploy to GitHub Pages** workflow to complete.
4. Visit `https://chinmayapatil3spac-c.github.io/photo-pdf-toolkit/`.

The token is required because GitHub does not allow the default `GITHUB_TOKEN` to enable Pages for a repository that has not been configured yet.

The jsPDF browser bundle is vendored in the repository, so the converter does not need a third-party script request at runtime. Google Fonts are optional; the system fallback keeps the interface usable if they are unavailable.

## Privacy and security

Image files are read with browser APIs and converted locally. There is no backend, analytics, account system, upload endpoint, API key, or tracking script in this project. The only external asset is the jsPDF library (and the optional Google Fonts stylesheet).

## Known limitations

- Browser memory is finite; very large images or many high-resolution photos may take longer or fail on low-memory phones. The 30-image limit helps keep usage reasonable.
- WebP support depends on the browser and the generated PDF uses JPEG or PNG image encoding.
- “Image size” uses each image's native pixel dimensions and does not apply margins.
- jsPDF is loaded from a public CDN; an offline-first bundle can be added later if required.

## Future tools

The interface is intentionally organized around a converter workspace so additional tools can be added as independent modules: PDF to Images, Merge PDF, Compress PDF, Split PDF, Image Resizer, and JPG to PNG.

## License

MIT
