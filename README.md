# Times Tables

Offline-first multiplication practice in a browser. Pick tables 1–12, practice multiply or divide, go timed or untimed, and get a score. Nothing is sent to a server.

The original [Grok share](https://grok.com/share/bGVnYWN5LWNvcHk_bd3e770d-4d57-432c-a779-97664f7053e1) is sign-in gated, so this app follows that conversation’s title and last visible prompt (“add division option”) plus a simple kid-ready practice flow.

## Open it locally

Double-click `index.html`, or serve the folder:

```bash
python3 -m http.server 8080
```

Then open [http://localhost:8080](http://localhost:8080).

## GitHub Pages

This is a static site at the repo root. In **Settings → Pages**, set Source to **Deploy from a branch**, branch **main**, folder **/ (root)**. The app will be at:

https://bryanralston.github.io/times-tables/

## Practice

- Tables 1–12
- Multiply, divide, or mix
- Untimed rounds of 10, 20, or 30 questions
- Optional 30 / 60 / 90 second timer
- Immediate right/wrong, score, streak, restart
- Last settings stay on this device
