# Zombie Office — Karlsruhe

A tongue-in-cheek top-down 2D office escape game. You arrive at the Karlsruhe office for a workshop. The team has been in back-to-back meetings for three weeks. They are no longer fully alive.

Get to the exit before one of them pulls you into a standup.

**Live:** https://jhlburke-code.github.io/zombie-office/

## Controls

- **WASD / Arrow keys** — move
- **Space / Click** — talk to the nearest colleague (when in range)
- **E** — interact with the exit door (when in range)

## Stack

- Single page: `index.html` + `style.css` + `game.js`
- HTML5 Canvas for rendering
- EGA-inspired pixel art (character-grid sprites rendered to offscreen canvases, scaled with `image-rendering: pixelated`)
- Press Start 2P for UI typography, Urbanist for body
- AIINOD brand chrome: navy + red, 8px left bar, slogan
- Zero build step, zero dependencies, zero backend

## Cast

- **MARCUS · Accounting** — gray suit, briefcase, perpetually checking the Q3 forecast
- **BRIGITTE · HR** — maroon blazer, clipboard, owns every 1:1 about your 1:1
- **HOLGER · IT** — glasses, blue shirt, 17 unread Confluence pages and counting

## Karlsruhe touch

The exit door is right next to the tram stop to the Schloss. If you make it.

## Local

```sh
# Just open index.html — or:
python3 -m http.server 8000
# http://localhost:8000
```

No build. No deps. Pure vanilla.

## Files

- `index.html` — page structure, overlays (title, dialogue, caught, win), HUD
- `style.css` — AIINOD chrome, pixel-art typography, overlays
- `game.js` — canvas rendering, sprites, map, zombie AI, dialogue, game loop