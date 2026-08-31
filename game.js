// Zombie Office — Karlsruhe
// Top-down 2D office escape. Avoid zombie colleagues; reach the exit.
// EGA-inspired pixel art via canvas + character-grid sprites.

(() => {
  'use strict';

  // ============================================================
  // CONSTANTS
  // ============================================================

  const TILE_SIZE = 32;
  const CANVAS_W = 960;
  const CANVAS_H = 640;
  const COLS = CANVAS_W / TILE_SIZE;     // 30
  const ROWS = CANVAS_H / TILE_SIZE;     // 20

  const PLAYER_SPEED = 1.8;        // px/frame
  const ZOMBIE_PATROL_SPEED = 0.9; // px/frame
  const ZOMBIE_CHASE_SPEED = 1.4;   // px/frame
  const DETECT_RADIUS = 110;        // px — when zombies start chasing
  const LOSE_SIGHT_RADIUS = 160;    // px — when chasing zombies give up
  const CATCH_RADIUS = 14;          // px — distance for "got caught"
  const SPRITE_SCALE = 2;           // 16×16 sprite rendered at 32×32

  // EGA-ish palette + AIINOD accents. Single char key → CSS color.
  const P = {
    ' ': null,           // transparent
    '0': '#000000',      // black
    '1': '#1B3A6B',      // navy (brand)
    '2': '#142d54',      // navy deep
    '3': '#CC2229',      // red (brand)
    '4': '#F7D14B',      // gold / yellow
    '5': '#7AA84D',      // plant green
    '6': '#3D6B2A',      // dark green
    '7': '#C4A484',      // skin
    '8': '#D6BBA0',      // skin light
    '9': '#FFFFFF',      // white
    'A': '#5C5C5C',      // dark gray
    'B': '#8A8A8A',      // mid gray
    'C': '#C0C0C0',      // light gray
    'D': '#404040',      // very dark (desk legs)
    'E': '#C77B40',      // orange (desk wood)
    'F': '#9C5028',      // dark wood
    'G': '#5BC8D5',      // cyan (eyes / monitor)
    'H': '#1a3a7a',      // monitor frame
    'I': '#3D2914',      // dark brown (pot)
    'J': '#A04040',      // maroon (Brigitte's blazer)
    'K': '#9D7BB0',      // purple (Holger's shirt)
    'L': '#4040A0',      // dark blue (IT shirt)
    'M': '#9C6644',      // leather brown (briefcase)
    'N': '#CCAA66',      // mustard (notebook)
    'O': '#666060',      // wall cubicle
    'P': '#7AA84D',      // plant green alt
    'Q': '#F0F0F0',      // very light
    'R': '#222222',      // near black
    'S': '#3D8B8B',      // teal
    'T': '#8B4513',      // brown wood alt
    'U': '#CC2229',      // red accent
    'V': '#5C5C5C',      // gray
    'W': '#FFFFFF',      // white
    'X': '#000000',      // pure black
  };

  // ============================================================
  // MAP — 30 cols × 20 rows
  // # = wall, . = floor, D = desk, M = meeting table, P = plant,
  // W = whiteboard, C = coffee machine, S = server rack,
  // p = printer, F = filing cabinet, X = player start, E = exit
  // ============================================================

  const MAP = [
    '##############################',
    '#                            #',
    '#  ####        ####          #',
    '#  #DD#        #DD#           #',
    '#  #DD#        #DD#           #',
    '#  ####        ####           #',
    '#                            #',
    '#          P                 #',
    '#                            #',
    '#  X                          #',
    '#                            #',
    '#     ####        ####        #',
    '#     #MM#        #WW#         #',
    '#     ####        ####        #',
    '#                            #',
    '#           P                 #',
    '#                            #',
    '#         C                   #',
    '#                            #',
    '######E######################',
  ];

  // Walkable tiles
  const WALKABLE = new Set(['.', 'X', 'E', 'P', 'C']);

  // ============================================================
  // SPRITES — 16x16 character grids. ' ' = transparent.
  // ============================================================

  // Player facing down (default). Body = cyan shirt, navy pants.
  const PLAYER_DOWN_1 = [
    '.....000000.....',
    '....01111110....',
    '....17777810....',
    '....17777810....',
    '....17777810....',
    '....18888880....',
    '....01111110....',
    '.....0GGG0......',
    '....0GGGG0.....',
    '...0HLLLH0.....',
    '...0HLLLH0.....',
    '...01111110....',
    '....011110.....',
    '...0D0000D0....',
    '..0D0...0D0....',
    '..00.....00....',
  ];
  const PLAYER_DOWN_2 = [ // walking frame
    '.....000000.....',
    '....01111110....',
    '....17777810....',
    '....17777810....',
    '....17777810....',
    '....18888880....',
    '....01111110....',
    '.....0GGG0......',
    '....0GGGG0.....',
    '...0HLLLH0.....',
    '...0HLLLH0.....',
    '...01111110....',
    '....011100.....',
    '...0D000D0.....',
    '..0D0..0D0......',
    '..00....00......',
  ];
  // Player facing up
  const PLAYER_UP_1 = [
    '.....000000.....',
    '....01111110....',
    '....17777810....',
    '....17777810....',
    '....17777810....',
    '....18888880....',
    '....01111110....',
    '.....0GGG0......',
    '....0GGGG0.....',
    '...0HLLLH0.....',
    '...0HLLLH0.....',
    '...01111110....',
    '....011110.....',
    '...0D0000D0....',
    '..0D0...0D0....',
    '..00.....00....',
  ];
  const PLAYER_UP_2 = [
    '.....000000.....',
    '....01111110....',
    '....17777810....',
    '....17777810....',
    '....17777810....',
    '....18888880....',
    '....01111110....',
    '.....0GGG0......',
    '....0GGGG0.....',
    '...0HLLLH0.....',
    '...0HLLLH0.....',
    '...01111110....',
    '....011100.....',
    '...0D000D0.....',
    '..0D0..0D0......',
    '..00....00......',
  ];
  // Player facing left
  const PLAYER_LEFT_1 = [
    '.....000000.....',
    '....0111110.....',
    '....1777810.....',
    '....1777810.....',
    '....1777810.....',
    '....1888880.....',
    '....0111110.....',
    '.....0GG00.....',
    '....0GGG0......',
    '....0HLLH0.....',
    '....0HLLH0.....',
    '....011110.....',
    '.....01110.....',
    '....0D000D0....',
    '....0D..0D0....',
    '....00...00....',
  ];
  const PLAYER_LEFT_2 = [
    '.....000000.....',
    '....0111110.....',
    '....1777810.....',
    '....1777810.....',
    '....1777810.....',
    '....1888880.....',
    '....0111110.....',
    '.....0GG00.....',
    '....0GGG0......',
    '....0HLLH0.....',
    '....0HLLH0.....',
    '....011110.....',
    '.....01100.....',
    '....0D00D0.....',
    '....0D.0D0.....',
    '....00..00.....',
  ];
  // Player facing right (mirror of left)
  const PLAYER_RIGHT_1 = PLAYER_LEFT_1.map(row =>
    row.split('').reverse().join('')
  );
  const PLAYER_RIGHT_2 = PLAYER_LEFT_2.map(row =>
    row.split('').reverse().join('')
  );

  // Marcus — accounting zombie, gray suit, pale skin, briefcase
  const Z_MARCUS_1 = [
    '.....000000.....',
    '....03333330...',
    '....07777830...',
    '....0AAAAA30...',   // dead gray eyes / pale face
    '....07777830...',
    '....0AAAAB30...',
    '....03333330...',
    '....0TTTTTT....',   // suit shoulders
    '....0TTTTTT....',
    '...0TTT1TTT0...',   // briefcase in hand
    '...0TTT1TTT0...',
    '...0TTT1TTT0...',
    '....0TTT1T0....',
    '...0D0...0D0...',
    '..0D0.....0D0..',
    '..00.......00..',
  ];
  const Z_MARCUS_2 = Z_MARCUS_1;

  // Brigitte — HR zombie, maroon blazer, clipboard
  const Z_BRIGITTE_1 = [
    '.....000000.....',
    '....04444440...',
    '....08888840...',
    '....0AAAAA40...',
    '....08888840...',
    '....0AAAAB40...',
    '....04444440...',
    '....0JJJJJJ0...',
    '....0JJJJJJ0...',
    '...0JJ0JJJJ0...',
    '...0JJ0JJJJ0...',
    '...0JJJ0JJ0...',
    '....0JJJ00....',
    '...0D0...0D0...',
    '..0D0.....0D0..',
    '..00.......00..',
  ];

  // Holger — IT zombie, blue shirt, glasses, server cables
  const Z_HOLGER_1 = [
    '.....000000.....',
    '....04444440...',
    '....08888840...',
    '....0AGGGG40...',   // glasses
    '....0GGGGG40...',   // glasses
    '....08888840...',
    '....04444440...',
    '....0LLLLLL0...',
    '....0LLLLLL0...',
    '...0LL0LLLL0...',
    '...0LL0LLLL0...',
    '...0LLLL0L0...',
    '....0LLLL00...',
    '...0D0...0D0...',
    '..0D0.....0D0..',
    '..00.......00..',
  ];

  // Map sprite name → array of frames
  const SPRITES = {
    player:        { down: [PLAYER_DOWN_1, PLAYER_DOWN_2], up: [PLAYER_UP_1, PLAYER_UP_2], left: [PLAYER_LEFT_1, PLAYER_LEFT_2], right: [PLAYER_RIGHT_1, PLAYER_RIGHT_2] },
    marcus:        [Z_MARCUS_1, Z_MARCUS_2],
    brigitte:      [Z_BRIGITTE_1, Z_BRIGITTE_1],
    holger:        [Z_HOLGER_1, Z_HOLGER_1],
  };

  // ============================================================
  // SPRITE PRERENDER — char grids → offscreen canvases
  // ============================================================

  const SPRITE_CACHE = {};

  function prerenderSprite(grid, scale) {
    const h = grid.length;
    const w = grid[0].length;
    const c = document.createElement('canvas');
    c.width = w * scale;
    c.height = h * scale;
    const cx = c.getContext('2d');
    cx.imageSmoothingEnabled = false;
    for (let y = 0; y < h; y++) {
      const row = grid[y];
      for (let x = 0; x < w; x++) {
        const ch = row[x];
        const color = P[ch];
        if (!color) continue;
        cx.fillStyle = color;
        cx.fillRect(x * scale, y * scale, scale, scale);
      }
    }
    return c;
  }

  function spriteCanvas(name, frame) {
    const key = name + ':' + frame;
    if (!SPRITE_CACHE[key]) {
      const frames = SPRITES[name];
      const grid = frames[frame] || frames[0];
      SPRITE_CACHE[key] = prerenderSprite(grid, SPRITE_SCALE);
    }
    return SPRITE_CACHE[key];
  }

  function getPlayerSprite(dir, frame) {
    const key = 'player:' + dir + ':' + frame;
    if (!SPRITE_CACHE[key]) {
      const grid = SPRITES.player[dir][frame] || SPRITES.player[dir][0];
      SPRITE_CACHE[key] = prerenderSprite(grid, SPRITE_SCALE);
    }
    return SPRITE_CACHE[key];
  }

  // ============================================================
  // DIALOGUE — snarky meeting-themed lines per NPC
  // ============================================================

  const DIALOGUE = {
    marcus: [
      "Hsssss... have you signed off on the Q3 forecast yet?",
      "No? Then I'm afraid you can't leave. HR will be notified.",
      "Join me in the quarterly review. It's only three hours.",
      "We can circle back on this later. After the meeting. After the retrospective.",
      "My last budget cycle took twelve weeks. I haven't slept since.",
    ],
    brigitte: [
      "Brrraaaaains... and quarterly OKRs.",
      "Quick sync? Just fifteen minutes. It's been three days.",
      "We need to align on alignment. Can you hear that sound? It's my calendar.",
      "I'd love to chat but I have a 1:1 about my 1:1 about my 1:1.",
      "Have you completed yourself? Self-evaluations are due.",
    ],
    holger: [
      "Grrooooaaan... the server is on fire. The tickets are piling up.",
      "Don't go anywhere. I need to talk to you about the thing.",
      "There are seventeen unread Confluence pages and counting.",
      "JIRA has updated JIRA which has updated JIRA.",
      "Have you tried turning the project off and on again? Same.",
    ],
  };

  const AGENDA_ITEMS = [
    'Review last quarter\'s review of last quarter\'s review',
    'Quick alignment on the alignment document',
    'Circle back on the thing we circled back on last time',
    'Status update on the status of status updates',
    'Recap of yesterday\'s recap',
    'Sync about the syncing tool',
    'Pre-read the pre-read for the pre-pre-read',
    'Open issues: all of them',
    'Parking lot: full',
    'Action items: none actionable',
    'Decide who decides who decides',
    'Discuss the discussion framework',
    'Retro on the retro',
    'Forward-looking backward glance',
    'Synergize the synergies',
    'Touch base, then touch base about touching base',
    'Decommission the decommission committee',
  ];

  // ============================================================
  // ZOMBIE PATROL PATHS — list of {x, y} pixel waypoints
  // ============================================================

  function pathOf(...pts) {
    return pts.map(([x, y]) => ({ x: x * TILE_SIZE + TILE_SIZE / 2, y: y * TILE_SIZE + TILE_SIZE / 2 }));
  }

  const ZOMBIE_DEFS = [
    {
      name: 'marcus', sprite: 'marcus', displayName: 'MARCUS · Accounting',
      path: pathOf([3, 3], [13, 3], [13, 6], [3, 6]),
    },
    {
      name: 'brigitte', sprite: 'brigitte', displayName: 'BRIGITTE · HR',
      path: pathOf([8, 12], [20, 12], [20, 14], [8, 14]),
    },
    {
      name: 'holger', sprite: 'holger', displayName: 'HOLGER · IT',
      path: pathOf([6, 9], [25, 9], [25, 17], [6, 17]),
    },
  ];

  // ============================================================
  // GAME STATE
  // ============================================================

  const game = {
    state: 'title',          // title | playing | dialogue | caught | won
    timeStart: 0,
    player: {
      x: 0, y: 0,            // pixel coords (center of sprite)
      dir: 'down',
      walkFrame: 0,
      walkTimer: 0,
    },
    zombies: [],
    activeDialogue: null,    // { npcName, lines, idx }
    meetingsAvoided: 0,
    circlebackCount: 0,
    pendingRestart: false,
  };

  // ============================================================
  // INPUT
  // ============================================================

  const keys = {};

  window.addEventListener('keydown', (e) => {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
      e.preventDefault();
    }
    keys[e.key.toLowerCase()] = true;
    keys[e.key] = true;

    if (e.key === ' ') {
      handleActionKey();
    } else if (e.key === 'e' || e.key === 'E') {
      handleInteractKey();
    }
  });
  window.addEventListener('keyup', (e) => {
    keys[e.key.toLowerCase()] = false;
    keys[e.key] = false;
  });

  function handleActionKey() {
    if (game.state === 'title') { startGame(); return; }
    if (game.state === 'caught') { restartGame(); return; }
    if (game.state === 'won')  { restartGame(); return; }
    if (game.state === 'dialogue') {
      advanceDialogue();
      return;
    }
    if (game.state === 'playing') {
      talkToNearestZombie();
    }
  }

  function handleInteractKey() {
    if (game.state !== 'playing') return;
    tryExit();
  }

  // Click handlers for overlays
  document.getElementById('btn-start').addEventListener('click', startGame);
  document.getElementById('btn-restart').addEventListener('click', restartGame);
  document.getElementById('btn-replay').addEventListener('click', restartGame);

  // Click on canvas — talk or advance dialogue
  const canvas = document.getElementById('game');
  canvas.addEventListener('click', () => {
    if (game.state === 'playing') talkToNearestZombie();
    else if (game.state === 'dialogue') advanceDialogue();
  });

  // ============================================================
  // GAME FLOW
  // ============================================================

  function startGame() {
    document.getElementById('overlay-title').hidden = true;
    initGameState();
    game.state = 'playing';
    game.timeStart = performance.now();
  }

  function initGameState() {
    // Place player at X marker
    const start = findTile('X') || { x: 2, y: 9 };
    game.player.x = start.x * TILE_SIZE + TILE_SIZE / 2;
    game.player.y = start.y * TILE_SIZE + TILE_SIZE / 2;
    game.player.dir = 'down';
    game.player.walkFrame = 0;
    game.player.walkTimer = 0;

    game.zombies = ZOMBIE_DEFS.map((def) => {
      const wp0 = def.path[0];
      return {
        ...def,
        x: wp0.x,
        y: wp0.y,
        dir: 'down',
        walkFrame: 0,
        walkTimer: 0,
        wpIndex: 0,
        alert: 0,           // 0 = patrol, 1+ = alerted / chasing
        alertTimer: 0,      // ticks down when player out of sight
      };
    });

    game.activeDialogue = null;
    game.meetingsAvoided = 0;
    game.circlebackCount = 0;
    game.pendingRestart = false;
  }

  function restartGame() {
    document.getElementById('overlay-caught').hidden = true;
    document.getElementById('overlay-win').hidden = true;
    document.getElementById('overlay-title').hidden = false;
    game.state = 'title';
    initGameState();
  }

  function caught() {
    game.state = 'caught';
    game.meetingsAvoided += 1;
    showCaughtScreen();
  }

  function win() {
    game.state = 'won';
    showWinScreen();
  }

  function findTile(ch) {
    for (let y = 0; y < ROWS; y++) {
      for (let x = 0; x < COLS; x++) {
        if (MAP[y][x] === ch) return { x, y };
      }
    }
    return null;
  }

  // ============================================================
  // MOVEMENT + COLLISION
  // ============================================================

  function isWalkable(px, py) {
    const col = Math.floor(px / TILE_SIZE);
    const row = Math.floor(py / TILE_SIZE);
    if (col < 0 || col >= COLS || row < 0 || row >= ROWS) return false;
    return WALKABLE.has(MAP[row][col]);
  }

  function tryMove(entity, dx, dy) {
    // Try X then Y separately for sliding along walls
    const nx = entity.x + dx;
    const ny = entity.y + dy;
    const spriteHalf = 12;
    // X
    const tryX = isWalkable(nx + Math.sign(dx) * spriteHalf, entity.y);
    if (tryX) entity.x = nx;
    // Y
    const tryY = isWalkable(entity.x, ny + Math.sign(dy) * spriteHalf);
    if (tryY) entity.y = ny;
  }

  function updatePlayer() {
    let dx = 0, dy = 0;
    if (keys['w'] || keys['arrowup'])    { dy -= 1; game.player.dir = 'up'; }
    if (keys['s'] || keys['arrowdown'])  { dy += 1; game.player.dir = 'down'; }
    if (keys['a'] || keys['arrowleft'])  { dx -= 1; game.player.dir = 'left'; }
    if (keys['d'] || keys['arrowright']) { dx += 1; game.player.dir = 'right'; }

    const moving = dx !== 0 || dy !== 0;
    if (moving) {
      const len = Math.hypot(dx, dy);
      dx = (dx / len) * PLAYER_SPEED;
      dy = (dy / len) * PLAYER_SPEED;
      tryMove(game.player, dx, dy);
      game.player.walkTimer += 1;
      if (game.player.walkTimer % 12 === 0) {
        game.player.walkFrame = 1 - game.player.walkFrame;
      }
    } else {
      game.player.walkFrame = 0;
    }
  }

  function updateZombie(z) {
    const playerDist = Math.hypot(game.player.x - z.x, game.player.y - z.y);
    const seesPlayer = playerDist < DETECT_RADIUS;
    const lostSight = playerDist > LOSE_SIGHT_RADIUS;

    if (seesPlayer) {
      z.alert = Math.min(z.alert + 1, 200);
      z.alertTimer = 60; // 1 second at 60fps before giving up
    } else if (z.alertTimer > 0) {
      z.alertTimer -= 1;
      if (z.alertTimer === 0) z.alert = 0;
    } else if (lostSight && z.alert > 0) {
      z.alert = 0;
    }

    if (z.alert > 0) {
      // Chase player
      const dx = game.player.x - z.x;
      const dy = game.player.y - z.y;
      const len = Math.hypot(dx, dy) || 1;
      const speed = ZOMBIE_CHASE_SPEED;
      tryMove(z, (dx / len) * speed, (dy / len) * speed);
    } else {
      // Patrol along path
      const target = z.path[z.wpIndex];
      const dx = target.x - z.x;
      const dy = target.y - z.y;
      const dist = Math.hypot(dx, dy);
      if (dist < 2) {
        z.wpIndex = (z.wpIndex + 1) % z.path.length;
      } else {
        const speed = ZOMBIE_PATROL_SPEED;
        tryMove(z, (dx / dist) * speed, (dy / dist) * speed);
      }
    }
  }

  function checkCaught() {
    for (const z of game.zombies) {
      if (Math.hypot(game.player.x - z.x, game.player.y - z.y) < CATCH_RADIUS) {
        caught();
        return;
      }
    }
  }

  function tryExit() {
    const exit = findTile('E');
    if (!exit) return;
    const ex = exit.x * TILE_SIZE + TILE_SIZE / 2;
    const ey = exit.y * TILE_SIZE + TILE_SIZE / 2;
    if (Math.hypot(game.player.x - ex, game.player.y - ey) < TILE_SIZE * 1.2) {
      win();
    }
  }

  function talkToNearestZombie() {
    let nearest = null;
    let bestDist = Infinity;
    for (const z of game.zombies) {
      const d = Math.hypot(game.player.x - z.x, game.player.y - z.y);
      if (d < bestDist) { bestDist = d; nearest = z; }
    }
    if (!nearest) return;
    if (bestDist > TILE_SIZE * 2.2) return; // out of conversation range
    startDialogue(nearest);
  }

  function startDialogue(zombie) {
    game.state = 'dialogue';
    game.activeDialogue = {
      npcName: zombie.displayName,
      lines: DIALOGUE[zombie.name],
      idx: 0,
    };
    game.meetingsAvoided += 1;  // every conversation is a meeting narrowly avoided
    showDialogue();
  }

  function advanceDialogue() {
    const d = game.activeDialogue;
    if (!d) return;
    d.idx += 1;
    if (d.idx >= d.lines.length) {
      game.state = 'playing';
      game.activeDialogue = null;
      hideDialogue();
    } else {
      showDialogue();
    }
  }

  function showDialogue() {
    const d = game.activeDialogue;
    if (!d) return;
    document.getElementById('dialogue-name').textContent = d.npcName;
    document.getElementById('dialogue-text').textContent = d.lines[d.idx];
    document.getElementById('overlay-dialogue').hidden = false;
  }

  function hideDialogue() {
    document.getElementById('overlay-dialogue').hidden = true;
  }

  function showCaughtScreen() {
    // Pick meeting duration and agenda items
    const hours = Math.floor(Math.random() * 6) + 3;
    const mins = Math.floor(Math.random() * 60);
    document.getElementById('meeting-duration').textContent =
      hours + 'h ' + mins.toString().padStart(2, '0') + 'm';

    const shuffled = [...AGENDA_ITEMS].sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, 10);
    const ul = document.getElementById('meeting-list');
    ul.innerHTML = selected.map((item, i) =>
      i < 3 ? `<li class="done">${item}</li>` : `<li>${item}</li>`
    ).join('');
    document.getElementById('overlay-caught').hidden = false;
  }

  function showWinScreen() {
    const elapsed = performance.now() - game.timeStart;
    const sec = Math.round(elapsed / 1000);
    const mm = Math.floor(sec / 60).toString().padStart(2, '0');
    const ss = (sec % 60).toString().padStart(2, '0');
    document.getElementById('win-time').textContent = `${mm}:${ss}`;
    document.getElementById('win-meetings').textContent = game.meetingsAvoided.toString();
    document.getElementById('win-circlebacks').textContent = '∞';
    document.getElementById('overlay-win').hidden = false;
  }

  // ============================================================
  // RENDERING
  // ============================================================

  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;

  function drawMap() {
    for (let row = 0; row < ROWS; row++) {
      for (let col = 0; col < COLS; col++) {
        const ch = MAP[row][col];
        const x = col * TILE_SIZE;
        const y = row * TILE_SIZE;
        drawTile(ctx, ch, x, y);
      }
    }
  }

  function drawTile(ctx, ch, x, y) {
    // Floor / carpet background for every walkable cell
    if (ch !== '#') {
      // Base carpet
      ctx.fillStyle = '#5C4A3D';
      ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
      // Subtle carpet pattern (alternating lighter dots)
      ctx.fillStyle = '#4D3D31';
      const dot = ((x >> 4) + (y >> 4)) & 1;
      if (dot) {
        ctx.fillRect(x + 4, y + 4, 2, 2);
        ctx.fillRect(x + 18, y + 12, 2, 2);
        ctx.fillRect(x + 8, y + 22, 2, 2);
        ctx.fillRect(x + 24, y + 26, 2, 2);
      }
    }

    switch (ch) {
      case '#': // wall
        ctx.fillStyle = '#3D2914';
        ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
        // Wall top edge (lighter, like wood trim)
        ctx.fillStyle = '#5C3D24';
        ctx.fillRect(x, y, TILE_SIZE, 6);
        // Cubicle fabric texture lines
        ctx.fillStyle = '#2D1A0A';
        for (let i = 6; i < TILE_SIZE; i += 8) {
          ctx.fillRect(x, y + i, TILE_SIZE, 1);
        }
        break;

      case 'D': // desk
        // Wood desk top
        ctx.fillStyle = '#9C6644';
        ctx.fillRect(x + 2, y + 4, TILE_SIZE - 4, TILE_SIZE - 10);
        ctx.fillStyle = '#7C4F30';
        ctx.fillRect(x + 2, y + TILE_SIZE - 8, TILE_SIZE - 4, 2);
        // Monitor
        ctx.fillStyle = '#1a3a7a';
        ctx.fillRect(x + 8, y + 8, 14, 10);
        ctx.fillStyle = '#5BC8D5';
        ctx.fillRect(x + 10, y + 10, 10, 6);
        // Keyboard
        ctx.fillStyle = '#404040';
        ctx.fillRect(x + 4, y + 22, 22, 5);
        ctx.fillStyle = '#5C5C5C';
        ctx.fillRect(x + 5, y + 23, 20, 1);
        ctx.fillRect(x + 5, y + 25, 20, 1);
        break;

      case 'M': // meeting table (round-ish)
        ctx.fillStyle = '#7C4F30';
        ctx.fillRect(x + 2, y + 4, TILE_SIZE - 4, TILE_SIZE - 8);
        ctx.fillStyle = '#5C3D24';
        ctx.fillRect(x + 2, y + 4, TILE_SIZE - 4, 2);
        ctx.fillRect(x + 2, y + TILE_SIZE - 6, TILE_SIZE - 4, 2);
        // Tablet/notebook in middle
        ctx.fillStyle = '#CCAA66';
        ctx.fillRect(x + 12, y + 14, 8, 4);
        break;

      case 'W': // whiteboard
        // Frame
        ctx.fillStyle = '#8A8A8A';
        ctx.fillRect(x + 2, y + 2, TILE_SIZE - 4, TILE_SIZE - 6);
        // White surface
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(x + 4, y + 4, TILE_SIZE - 8, TILE_SIZE - 10);
        // Squiggles (synergy diagram)
        ctx.fillStyle = '#CC2229';
        ctx.fillRect(x + 6, y + 8, 8, 1);
        ctx.fillRect(x + 16, y + 10, 6, 1);
        ctx.fillStyle = '#1B3A6B';
        ctx.fillRect(x + 8, y + 16, 12, 1);
        ctx.fillStyle = '#404040';
        ctx.fillRect(x + 6, y + 22, 16, 1);
        break;

      case 'P': // plant
        // Pot
        ctx.fillStyle = '#3D2914';
        ctx.fillRect(x + 10, y + 22, 12, 8);
        ctx.fillStyle = '#5C3D24';
        ctx.fillRect(x + 10, y + 22, 12, 2);
        // Leaves
        ctx.fillStyle = '#3D6B2A';
        ctx.fillRect(x + 8, y + 14, 4, 8);
        ctx.fillRect(x + 14, y + 8, 6, 12);
        ctx.fillRect(x + 20, y + 12, 4, 10);
        ctx.fillStyle = '#7AA84D';
        ctx.fillRect(x + 9, y + 15, 2, 6);
        ctx.fillRect(x + 16, y + 10, 2, 10);
        ctx.fillStyle = '#5A8A3D';
        ctx.fillRect(x + 21, y + 13, 2, 6);
        break;

      case 'C': // coffee machine
        ctx.fillStyle = '#404040';
        ctx.fillRect(x + 8, y + 4, 16, 24);
        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(x + 8, y + 4, 16, 4);
        // Coffee spout
        ctx.fillStyle = '#5BC8D5';
        ctx.fillRect(x + 12, y + 14, 8, 4);
        // Cup
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(x + 12, y + 18, 8, 6);
        ctx.fillStyle = '#3D2914';
        ctx.fillRect(x + 13, y + 19, 6, 3);
        // Status light
        ctx.fillStyle = '#CC2229';
        ctx.fillRect(x + 22, y + 6, 2, 2);
        break;

      case 'E': // exit door
        // Door frame
        ctx.fillStyle = '#9C6644';
        ctx.fillRect(x + 2, y + 2, TILE_SIZE - 4, TILE_SIZE - 4);
        ctx.fillStyle = '#7C4F30';
        ctx.fillRect(x + 2, y + 2, TILE_SIZE - 4, 3);
        ctx.fillRect(x + 2, y + TILE_SIZE - 5, TILE_SIZE - 4, 3);
        // EXIT sign
        ctx.fillStyle = '#CC2229';
        ctx.fillRect(x + 6, y + 6, TILE_SIZE - 12, 6);
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(x + 8, y + 8, 2, 2);
        // Door handle
        ctx.fillStyle = '#F7D14B';
        ctx.fillRect(x + TILE_SIZE - 8, y + TILE_SIZE / 2, 2, 4);
        // "EXIT" tile pattern underneath
        ctx.fillStyle = '#404040';
        ctx.fillRect(x + 22, y + 8, 4, 2);
        break;

      case 'X': // player start (marker, will be overwritten by floor)
        // No extra decoration, just floor
        break;
    }
  }

  function drawSpriteCentered(canvas, x, y) {
    const w = canvas.width;
    const h = canvas.height;
    ctx.drawImage(canvas, Math.round(x - w / 2), Math.round(y - h / 2));
  }

  function render() {
    ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);
    drawMap();

    // Zombies — sort by y so closer (lower) ones draw in front
    const drawables = [...game.zombies, { isPlayer: true, x: game.player.x, y: game.player.y, dir: game.player.dir, walkFrame: game.player.walkFrame, name: 'player', sprite: 'player' }];
    drawables.sort((a, b) => a.y - b.y);

    for (const e of drawables) {
      if (e.isPlayer) {
        const sprite = getPlayerSprite(e.dir, e.walkFrame);
        drawSpriteCentered(sprite, e.x, e.y);
      } else {
        const sprite = spriteCanvas(e.name, 0);
        drawSpriteCentered(sprite, e.x, e.y);
        // Alert indicator above head
        if (e.alert > 0) {
          ctx.fillStyle = e.alert > 60 ? '#CC2229' : '#F7D14B';
          ctx.fillRect(Math.round(e.x - 4), Math.round(e.y - 26), 8, 4);
          ctx.fillStyle = '#000000';
          ctx.fillRect(Math.round(e.x - 4), Math.round(e.y - 26), 8, 1);
        }
      }
    }

    // HUD updates
    updateHUD();
  }

  function updateHUD() {
    // Status: alert level of nearest zombie determines mood
    let nearestAlert = 0;
    let nearestName = '—';
    let bestDist = Infinity;
    for (const z of game.zombies) {
      const d = Math.hypot(game.player.x - z.x, game.player.y - z.y);
      if (d < bestDist) {
        bestDist = d;
        nearestName = z.displayName.split(' · ')[0];
        nearestAlert = z.alert;
      }
    }
    if (bestDist < 60) {
      document.getElementById('hud-status').textContent = 'IN DANGER';
      document.getElementById('hud-status').style.color = '#CC2229';
    } else if (nearestAlert > 0) {
      document.getElementById('hud-status').textContent = 'being watched';
      document.getElementById('hud-status').style.color = '#F7D14B';
    } else if (bestDist < 200) {
      document.getElementById('hud-status').textContent = 'nervous';
      document.getElementById('hud-status').style.color = '#FFFFFF';
    } else {
      document.getElementById('hud-status').textContent = 'alive';
      document.getElementById('hud-status').style.color = '#FFFFFF';
    }
    document.getElementById('hud-nearest').textContent =
      bestDist < 600 ? nearestName + ' (' + Math.round(bestDist) + ')' : '—';
  }

  // ============================================================
  // MAIN LOOP
  // ============================================================

  function loop() {
    if (game.state === 'playing') {
      updatePlayer();
      for (const z of game.zombies) updateZombie(z);
      checkCaught();
    }
    render();
    requestAnimationFrame(loop);
  }

  // ============================================================
  // BOOT
  // ============================================================

  initGameState();
  render();
  requestAnimationFrame(loop);
})();