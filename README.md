# Ancient World Learning Arcade

The homepage for **Mrs. Christmon's Ancient Civilizations Class**, featuring a teacher portrait, ancient-world illustrations, and a clear entry point to the complete Ancient Rivers & Civilizations Challenge. The homepage is at the site root; the existing game is at `rivers/`.

## Ancient Rivers & Civilizations Challenge

A colorful, account-free geography and history game for seventh-grade students. Built with plain HTML, CSS, JavaScript, and SVG; no framework, API keys, database, external fonts, or runtime dependencies.

## Play or develop

Serve the project with Python’s built-in static server:

```sh
cd /workspace/ancient-rivers-game
python3 -m http.server 8000 --bind 0.0.0.0
```

Use the server’s address in your browser. Any static web host (including GitHub Pages at a repository subpath) can serve the site. Keep `index.html`, `arcade.css`, `app.js`, `data.js`, `styles.css`, the `assets/` folder, and the `rivers/` folder together at the site root. All links and assets use relative paths; there is no client-side routing fallback to configure. No build step is needed. All game assets are local, so gameplay works without external network access after loading the page. Optional source links require internet access. Reloading a hosted page while offline is not guaranteed: this app does not install a service worker.

## What students can do

- **Full expedition:** 24 shuffled questions, one per river in each of four skills.
- **River explorer:** locate six rivers using lettered SVG markers or equivalent answer buttons. Regional map views make nearby rivers easier to distinguish.
- **Spelling studio:** type river names, request optional hints, and practice accepted alternative names.
- **Civilization detective:** connect rivers with ancient Egypt, Mesopotamia, the Indus Valley civilization, and early Chinese civilization.
- **Then & now:** identify modern countries using specific ancient sites or river sections, without suggesting cross-border rivers belong to just one country.
- **Field guide:** explore all six rivers, dates, civilizations, modern geography, and explanatory notes before playing.
- **Results:** automatic points, accuracy, per-skill breakdown, best streak, review of missed questions, replay, and printable results.

Correct first submissions earn 10 points; incorrect submissions earn 0. Answers lock after submission, and every question supplies immediate explanatory feedback. No time limits or negative points. Hints do not lower scores. A full expedition has 240 possible points; skill rounds have 60.

Spelling ignores capitalization, repeated whitespace, accents, and punctuation. Accepted forms include Huang He / Yellow River and Yangtze / Chang Jiang. Common “River” variants are accepted where listed in `data.js`. Answers are evaluated locally; this is a learning activity, not a secure assessment system.

## Geographic and historical scope

The six rivers are the **Nile, Euphrates, Tigris, Indus, Huang He (Yellow River), and Yangtze (Chang Jiang)**. SVG coordinates use an equirectangular longitude/latitude projection: `x = (longitude - 18) × 9.2`, `y = (55 - latitude) × 9.2`.

Coastlines and river routes are manually generalized for classroom orientation, not navigation, surveying, or political-boundary study. The atlas includes a coordinate grid, north arrow, country labels, and regional views. Country labels represent approximate locations, not borders. Tributaries and river sources are not exhaustive; the Nile drawing includes generalized White and Blue Nile reaches.

Historical cultures and regions do not match present-day countries. The country questions therefore name specific sites (Giza, Babylon, Baghdad, Mohenjo-daro) or rivers entirely within China. The guide explains the transboundary courses of the Nile, Euphrates, Tigris, and Indus. Dates are approximate. The Yangtze is included to show that early Chinese farming and cultures developed in multiple basins, not only the Huang He basin.

Reference reading, also linked inside the app:

- [Britannica: Nile River](https://www.britannica.com/place/Nile-River)
- [Britannica: Tigris–Euphrates river system](https://www.britannica.com/place/Tigris-Euphrates-river-system)
- [Britannica: Indus River](https://www.britannica.com/place/Indus-River)
- [Britannica: Yellow River](https://www.britannica.com/place/Yellow-River)
- [Britannica: Yangtze River](https://www.britannica.com/place/Yangtze-River)
- [Britannica: Indus civilization](https://www.britannica.com/topic/Indus-civilization)
- [Britannica: Mesopotamia](https://www.britannica.com/place/Mesopotamia-historical-region-Asia)

## Accessibility and privacy

Native controls, keyboard-selectable map markers (Tab, Enter, or Space), equivalent map answer buttons, a skip link, visible focus, live feedback, reduced-motion support, and responsive layouts are included. Correctness uses text and icons as well as color. Spellcheck is disabled only for spelling activities. There is no forced audio.

There are no accounts, analytics, student names, or server submissions. Only the highest completed percentage for each mode is saved in this browser’s local storage. Shared-device users can clear these scores from **How to play**. Storage errors never block gameplay; in-progress rounds reset on reload.

## Validation

JavaScript syntax checks:

```sh
node --check app.js
node --check data.js
```

Browser integration tests use Python Playwright and system Chromium. These are **test-only tools**, not application dependencies. If absent, install Playwright in your development environment (`python3 -m pip install playwright`) and provide Chromium. `CHROMIUM_PATH` can override the test browser executable.

With the local server running in another terminal:

```sh
python3 tests/homepage.py
python3 tests/smoke.py
```

`ARCADE_URL` overrides the homepage-test URL (`http://127.0.0.1:8000`). `GAME_URL` overrides the game-test URL (`http://127.0.0.1:8000/rivers`, without a trailing slash). Homepage checks cover portrait loading, game links, field-guide links, return navigation, and widths from 320 to 1440 pixels. The tests exercise a perfect full expedition, all practice modes with correct and incorrect answers, spelling aliases and whitespace, hints, duplicate-score prevention, missed-answer reviews, map keyboard controls, regional map views, navigation confirmation, local score clearing, mobile layouts, blocked browser storage, and offline gameplay after loading. Screenshots are written outside the checkout under `/tmp/ancient-rivers-*.png`.

## Files

- `index.html`: the new class arcade homepage.
- `arcade.css`: homepage styling, isolated from the game.
- `assets/`: local teacher portrait and ancient-world SVG illustration.
- `rivers/index.html`: preserved game shell, sources and leave-round dialogs, with a return link to the arcade.
- `styles.css`: responsive visual design, SVG map styles, print layout.
- `data.js`: river facts, answer variants, geographic coordinates, coastlines, and country labels.
- `app.js`: question generation, navigation, map interaction, scoring, feedback, guide, and results.
- `tests/smoke.py`: end-to-end Chromium tests.

- `tests/homepage.py`: homepage and navigation integration checks.
