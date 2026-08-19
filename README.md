# Absolute

**Your Cinema. Quantified.**

Absolute is a local-first, private cinematic observatory. It imports your viewing history from Letterboxd, matches it against TMDB natively on your device, and builds a comprehensive, beautiful analytic profile of your taste.

* No accounts. No subscriptions.
* Built with Next.js, Tailwind CSS, Rust, and Tauri 2.
* Your data never leaves your device unless you export it.

## Architecture
- **Frontend**: Next.js (Static Export), React, Tailwind v4
- **Backend/Desktop Native Core**: Tauri v2, Rust (Tokio, sqlx)
- **Database**: Local SQLite

## Development

Prerequisites:
- [Node.js](https://nodejs.org/) (v18+)
- [Rust](https://rustup.rs/) (Stable)
- Tauri dependencies for your OS (e.g. WebView2 on Windows)

### Running Locally

To run the desktop application in development mode with hot-reloading:

```bash
npm install
npm run tauri:dev
```

*(This command will automatically start the Next.js dev server on port 3000, wait for it to be ready, and then compile and launch the Rust/Tauri desktop window).*

### Building for Production

To compile a final release executable for your platform:

```bash
npm run tauri:build
```

The output installers/executables will be located in `src-tauri/target/release/bundle/`.

## License
MIT
