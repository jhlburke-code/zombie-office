// Zombie Office — Karlsruhe
// v5: stripped input to the most basic possible form.
// Uses window.onkeydown / window.onkeyup directly — works in every browser
// since IE5. No e.code, no capture phase, no focus tricks. Just the key.

(() => {
  'use strict';

  // ============================================================
  // CONSTANTS
  // ============================================================

  const TILE_SIZE = 32;
  const CANVAS_W = 960;
  const CANVAS_H = 640;
  const COLS = CANVAS_W / TILE_SIZE;
  const ROWS = CANVAS_H / TILE_SIZE;

  const PLAYER_SPEED = 2.0;
  const ZOMBIE_PATROL_SPEED = 0.6;
  const ZOMBIE_CHASE_SPEED = 0.9;
  const DETECT_RADIUS = 90;
  const LOSE_SIGHT_RADIUS = 200;
  const CATCH_RADIUS = 14;
  const SPRITE_SCALE = 2;
  const STEP_SOUND_EVERY = 12;

  const P = {
    ' ': null, '0': '#000000', '1': '#1B3A6B', '2': '#142d54', '3': '#CC2229',
    '4': '#F7D14B', '5': '#7AA84D', '6': '#3D6B2A', '7': '#C4A484', '8': '#D6BBA0',
    '9': '#FFFFFF', 'A': '#5C5C5C', 'B': '#8A8A8A', 'C': '#C0C0C0', 'D': '#404040',
    'E': '#C77B40', 'F': '#9C5028', 'G': '#5BC8D5', 'H': '#1a3a7a', 'I': '#3D2914',
    'J': '#A04040', 'K': '#9D7BB0', 'L': '#4040A0', 'M': '#9C6644', 'N': '#CCAA66',
    'O': '#666060', 'P': '#7AA84D', 'Q': '#F0F0F0', 'R': '#222222', 'S': '#3D8B8B',
    'T': '#8B4513', 'U': '#CC2229', 'V': '#5C5C5C', 'W': '#FFFFFF', 'X': '#000000',
  };

  const MAP = [
    '##############################',
    '#X                           #',
    '#  ####        ####          #',
    '#  #DD#        #DD#           #',
    '#  #DD#        #DD#           #',
    '#  ####        ####           #',
    '#                            #',
    '#          P                 #',
    '#                            #',
    '#                            #',
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

  const WALKABLE = new Set(['.', 'X', 'E', 'P', 'C']);

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
  const PLAYER_DOWN_2 = [
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
  const PLAYER_UP_1 = PLAYER_DOWN_1;
  const PLAYER_UP_2 = PLAYER_DOWN_2;
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
  const PLAYER_RIGHT_1 = PLAYER_LEFT_1.map(r => r.split('').reverse().join(''));
  const PLAYER_RIGHT_2 = PLAYER_LEFT_2.map(r => r.split('').reverse().join(''));

  const Z_MARCUS_1 = [
    '.....000000.....',
    '....03333330...',
    '....07777830...',
    '....0AAAAA30...',
    '....07777830...',
    '....0AAAAB30...',
    '....03333330...',
    '....0TTTTTT....',
    '....0TTTTTT....',
    '...0TTT1TTT0...',
    '...0TTT1TTT0...',
    '...0TTT1TTT0...',
    '....0TTT1T0....',
    '...0D0...0D0...',
    '..0D0.....0D0..',
    '..00.......00..',
  ];
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
  const Z_HOLGER_1 = [
    '.....000000.....',
    '....04444440...',
    '....08888840...',
    '....0AGGGG40...',
    '....0GGGGG40...',
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

  const SPRITES = {
    player: { down: [PLAYER_DOWN_1, PLAYER_DOWN_2], up: [PLAYER_UP_1, PLAYER_UP_2], left: [PLAYER_LEFT_1, PLAYER_LEFT_2], right: [PLAYER_RIGHT_1, PLAYER_RIGHT_2] },
    marcus: [Z_MARCUS_1, Z_MARCUS_1],
    brigitte: [Z_BRIGITTE_1, Z_BRIGITTE_1],
    holger: [Z_HOLGER_1, Z_HOLGER_1],
  };

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
    "Review last quarter's review of last quarter's review",
    'Quick alignment on the alignment document',
    'Circle back on the thing we circled back on last time',
    'Status update on the status of status updates',
    "Recap of yesterday's recap",
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

  function pathOf(...pts) {
    return pts.map(([x, y]) => ({ x: x * TILE_SIZE + TILE_SIZE / 2, y: y * TILE_SIZE + TILE_SIZE / 2 }));
  }

  const ZOMBIE_DEFS = [
    { name: 'marcus', sprite: 'marcus', displayName: 'MARCUS · Accounting', path: pathOf([18, 2], [27, 2], [27, 7], [18, 7]) },
    { name: 'brigitte', sprite: 'brigitte', displayName: 'BRIGITTE · HR', path: pathOf([8, 12], [20, 12], [20, 14], [8, 14]) },
    { name: 'holger', sprite: 'holger', displayName: 'HOLGER · IT', path: pathOf([14, 16], [26, 16], [26, 18], [14, 18]) },
  ];

  // ============================================================
  // GAME STATE
  // ============================================================

  const game = {
    state: 'title',
    timeStart: 0,
    player: { x: 48, y: 48, dir: 'down', walkFrame: 0, walkTimer: 0, stepSoundTimer: 0 },
    zombies: [],
    activeDialogue: null,
    meetingsAvoided: 0,
  };

  // Movement intent — single source of truth for "is the player trying to move".
  // Set directly by keyboard handlers, read by updatePlayer.
  const move = { dx: 0, dy: 0 };

  // Big visible flash when a keypress lands. Diagnostic for the user.
  let lastKey = null;
  let lastKeyTime = 0;

  // ============================================================
  // INPUT — the absolute simplest possible.
  // window.onkeydown = fn replaces any previous handler. No event
  // options, no capture, no document/window duplication. Just the
  // property. Works in IE5, works in 2024.
  // ============================================================

  window.onkeydown = function(e) {
    // Log so the user can see in DevTools Console.
    try { console.log('[Pulse] keydown', e.key); } catch (_) {}

    const k = String(e.key || '').toLowerCase();

    if (k === 'w' || k === 'arrowup')    { move.dy = -1; game.player.dir = 'up'; }
    else if (k === 's' || k === 'arrowdown')  { move.dy =  1; game.player.dir = 'down'; }
    else if (k === 'a' || k === 'arrowleft')  { move.dx = -1; game.player.dir = 'left'; }
    else if (k === 'd' || k === 'arrowright') { move.dx =  1; game.player.dir = 'right'; }
    else if (k === ' ' || k === 'spacebar' || k === 'space') { handleActionKey(); }
    else if (k === 'e') { handleInteractKey(); }
    else if (k === 'r') { resetPlayer(); }
    else if (k === 'm') { toggleMute(); }

    if (k === 'w' || k === 'a' || k === 's' || k === 'd') {
      // Prevent page scroll when arrows accidentally fire.
      e.preventDefault();
      // Flash indicator so the user sees their press was detected.
      lastKey = k.toUpperCase();
      lastKeyTime = performance.now();
    }
  };

  window.onkeyup = function(e) {
    const k = String(e.key || '').toLowerCase();
    if (k === 'w' || k === 'arrowup' || k === 's' || k === 'arrowdown') move.dy = 0;
    if (k === 'a' || k === 'arrowleft' || k === 'd' || k === 'arrowright') move.dx = 0;
  };

  // Lose focus reset — but only clear move intent, not the keys object
  // (we don't use a keys object anymore).
  window.onblur = function() {
    move.dx = 0;
    move.dy = 0;
  };

  function toggleMute() {
    audioMuted = !audioMuted;
    const el = document.getElementById('hud-mute');
    if (el) el.textContent = audioMuted ? '🔇 MUTED' : '🔊 SOUND ON';
  }

  function resetPlayer() {
    initGameState();
    if (game.state !== 'playing') game.state = 'playing';
    document.getElementById('overlay-caught').hidden = true;
    document.getElementById('overlay-win').hidden = true;
    document.getElementById('overlay-dialogue').hidden = true;
    hideDialogue();
  }

  function handleActionKey() {
    if (game.state === 'title') { startGame(); return; }
    if (game.state === 'caught') { restartGame(); return; }
    if (game.state === 'won')   { restartGame(); return; }
    if (game.state === 'dialogue') { advanceDialogue(); return; }
    if (game.state === 'playing') { talkToNearestZombie(); }
  }

  function handleInteractKey() {
    if (game.state !== 'playing') return;
    tryExit();
  }

  // ============================================================
  // AUDIO
  // ============================================================

  let audioCtx = null;
  let audioMuted = false;

  function ensureAudio() {
    if (audioCtx) return audioCtx;
    const Ctor = window.AudioContext || window.webkitAudioContext;
    if (!Ctor) return null;
    try { audioCtx = new Ctor(); } catch (e) { return null; }
    return audioCtx;
  }

  function beep(freq, durationMs, type = 'square', volume = 0.06) {
    if (audioMuted) return;
    const ctx = ensureAudio();
    if (!ctx) return;
    if (ctx.state === 'suspended') ctx.resume();
    const now = ctx.currentTime;
    const dur = durationMs / 1000;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    gain.gain.setValueAtTime(volume, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + dur);
    osc.start(now);
    osc.stop(now + dur);
  }

  function sweep(freqStart, freqEnd, durationMs, type = 'sawtooth', volume = 0.08) {
    if (audioMuted) return;
    const ctx = ensureAudio();
    if (!ctx) return;
    if (ctx.state === 'suspended') ctx.resume();
    const now = ctx.currentTime;
    const dur = durationMs / 1000;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = type;
    osc.frequency.setValueAtTime(freqStart, now);
    osc.frequency.exponentialRampToValueAtTime(Math.max(20, freqEnd), now + dur);
    gain.gain.setValueAtTime(volume, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + dur);
    osc.start(now);
    osc.stop(now + dur);
  }

  function sfxStep()  { beep(90, 35, 'square', 0.04); }
  function sfxTalk()  { beep(440, 60, 'square', 0.08); }
  function sfxCatch() { sweep(220, 80, 700, 'sawtooth', 0.10); }
  function sfxWin()   { beep(523, 90, 'square', 0.09);
                       setTimeout(() => beep(659, 90, 'square', 0.09), 90);
                       setTimeout(() => beep(784, 200, 'square', 0.10), 180); }

  // ============================================================
  // GAME FLOW
  // ============================================================

  function startGame() {
    const ov = document.getElementById('overlay-title');
    if (ov) ov.hidden = true;
    initGameState();
    game.state = 'playing';
    game.timeStart = performance.now();
  }

  function initGameState() {
    const start = findTile('X') || { x: 1, y: 1 };
    game.player.x = start.x * TILE_SIZE + TILE_SIZE / 2;
    game.player.y = start.y * TILE_SIZE + TILE_SIZE / 2;
    game.player.dir = 'down';
    game.player.walkFrame = 0;
    game.player.walkTimer = 0;
    game.player.stepSoundTimer = 0;

    game.zombies = ZOMBIE_DEFS.map((def) => {
      const wp0 = def.path[0];
      return {
        ...def,
        x: wp0.x, y: wp0.y,
        dir: 'down',
        walkFrame: 0, walkTimer: 0,
        wpIndex: 0,
        alert: 0, alertTimer: 0,
      };
    });

    game.activeDialogue = null;
    game.meetingsAvoided = 0;
  }

  function restartGame() {
    document.getElementById('overlay-caught').hidden = true;
    document.getElementById('overlay-win').hidden = true;
    document.getElementById('overlay-title').hidden = false;
    game.state = 'title';
    initGameState();
  }

  function caught() {
    sfxCatch();
    game.state = 'caught';
    game.meetingsAvoided += 1;
    showCaughtScreen();
  }

  function win() {
    sfxWin();
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

  function isWalkable(px, py) {
    const col = Math.floor(px / TILE_SIZE);
    const row = Math.floor(py / TILE_SIZE);
    if (col < 0 || col >= COLS || row < 0 || row >= ROWS) return false;
    return WALKABLE.has(MAP[row][col]);
  }

  function tryMove(entity, dx, dy) {
    const nx = entity.x + dx;
    const ny = entity.y + dy;
    // Generous collision buffer so the player never gets permanently pinned
    // against a wall. 4 px of clearance is enough to feel natural without
    // letting the sprite visibly clip into walls.
    const spriteHalf = entity === game.player ? 4 : 12;
    if (isWalkable(nx + Math.sign(dx) * spriteHalf, entity.y)) entity.x = nx;
    if (isWalkable(entity.x, ny + Math.sign(dy) * spriteHalf)) entity.y = ny;
  }

  function updatePlayer() {
    const dx = move.dx;
    const dy = move.dy;
    const moving = dx !== 0 || dy !== 0;
    if (moving) {
      const len = Math.hypot(dx, dy);
      const sx = (dx / len) * PLAYER_SPEED;
      const sy = (dy / len) * PLAYER_SPEED;
      tryMove(game.player, sx, sy);
      game.player.walkTimer += 1;
      game.player.stepSoundTimer += 1;
      if (game.player.walkTimer % 12 === 0) {
        game.player.walkFrame = 1 - game.player.walkFrame;
      }
      if (game.player.stepSoundTimer % STEP_SOUND_EVERY === 0) sfxStep();
    } else {
      game.player.walkFrame = 0;
      game.player.stepSoundTimer = 0;
    }
  }

  function updateZombie(z) {
    const playerDist = Math.hypot(game.player.x - z.x, game.player.y - z.y);
    const seesPlayer = playerDist < DETECT_RADIUS;
    const lostSight = playerDist > LOSE_SIGHT_RADIUS;

    if (seesPlayer) {
      z.alert = Math.min(z.alert + 1, 200);
      z.alertTimer = 60;
    } else if (z.alertTimer > 0) {
      z.alertTimer -= 1;
      if (z.alertTimer === 0) z.alert = 0;
    } else if (lostSight && z.alert > 0) {
      z.alert = 0;
    }

    if (z.alert > 0) {
      const dx = game.player.x - z.x;
      const dy = game.player.y - z.y;
      const len = Math.hypot(dx, dy) || 1;
      tryMove(z, (dx / len) * ZOMBIE_CHASE_SPEED, (dy / len) * ZOMBIE_CHASE_SPEED);
    } else {
      const target = z.path[z.wpIndex];
      const dx = target.x - z.x;
      const dy = target.y - z.y;
      const dist = Math.hypot(dx, dy);
      if (dist < 2) {
        z.wpIndex = (z.wpIndex + 1) % z.path.length;
      } else {
        tryMove(z, (dx / dist) * ZOMBIE_PATROL_SPEED, (dy / dist) * ZOMBIE_PATROL_SPEED);
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
    let nearest = null, bestDist = Infinity;
    for (const z of game.zombies) {
      const d = Math.hypot(game.player.x - z.x, game.player.y - z.y);
      if (d < bestDist) { bestDist = d; nearest = z; }
    }
    if (!nearest || bestDist > TILE_SIZE * 2.2) return;
    startDialogue(nearest);
  }

  function startDialogue(zombie) {
    sfxTalk();
    game.state = 'dialogue';
    game.activeDialogue = { npcName: zombie.displayName, lines: DIALOGUE[zombie.name], idx: 0 };
    showDialogue();
  }

  function advanceDialogue() {
    sfxTalk();
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
    const hours = Math.floor(Math.random() * 6) + 3;
    const mins = Math.floor(Math.random() * 60);
    document.getElementById('meeting-duration').textContent = hours + 'h ' + mins.toString().padStart(2, '0') + 'm';
    const shuffled = [...AGENDA_ITEMS].sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, 10);
    document.getElementById('meeting-list').innerHTML = selected.map((item, i) =>
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

  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;

  function drawMap() {
    for (let row = 0; row < ROWS; row++) {
      for (let col = 0; col < COLS; col++) {
        drawTile(ctx, MAP[row][col], col * TILE_SIZE, row * TILE_SIZE);
      }
    }
  }

  function drawTile(ctx, ch, x, y) {
    if (ch !== '#') {
      ctx.fillStyle = '#5C4A3D';
      ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
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
      case '#':
        ctx.fillStyle = '#3D2914'; ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
        ctx.fillStyle = '#5C3D24'; ctx.fillRect(x, y, TILE_SIZE, 6);
        ctx.fillStyle = '#2D1A0A';
        for (let i = 6; i < TILE_SIZE; i += 8) ctx.fillRect(x, y + i, TILE_SIZE, 1);
        break;
      case 'D':
        ctx.fillStyle = '#9C6644'; ctx.fillRect(x + 2, y + 4, TILE_SIZE - 4, TILE_SIZE - 10);
        ctx.fillStyle = '#7C4F30'; ctx.fillRect(x + 2, y + TILE_SIZE - 8, TILE_SIZE - 4, 2);
        ctx.fillStyle = '#1a3a7a'; ctx.fillRect(x + 8, y + 8, 14, 10);
        ctx.fillStyle = '#5BC8D5'; ctx.fillRect(x + 10, y + 10, 10, 6);
        ctx.fillStyle = '#404040'; ctx.fillRect(x + 4, y + 22, 22, 5);
        ctx.fillStyle = '#5C5C5C';
        ctx.fillRect(x + 5, y + 23, 20, 1); ctx.fillRect(x + 5, y + 25, 20, 1);
        break;
      case 'M':
        ctx.fillStyle = '#7C4F30'; ctx.fillRect(x + 2, y + 4, TILE_SIZE - 4, TILE_SIZE - 8);
        ctx.fillStyle = '#5C3D24';
        ctx.fillRect(x + 2, y + 4, TILE_SIZE - 4, 2);
        ctx.fillRect(x + 2, y + TILE_SIZE - 6, TILE_SIZE - 4, 2);
        ctx.fillStyle = '#CCAA66'; ctx.fillRect(x + 12, y + 14, 8, 4);
        break;
      case 'W':
        ctx.fillStyle = '#8A8A8A'; ctx.fillRect(x + 2, y + 2, TILE_SIZE - 4, TILE_SIZE - 6);
        ctx.fillStyle = '#FFFFFF'; ctx.fillRect(x + 4, y + 4, TILE_SIZE - 8, TILE_SIZE - 10);
        ctx.fillStyle = '#CC2229';
        ctx.fillRect(x + 6, y + 8, 8, 1); ctx.fillRect(x + 16, y + 10, 6, 1);
        ctx.fillStyle = '#1B3A6B'; ctx.fillRect(x + 8, y + 16, 12, 1);
        ctx.fillStyle = '#404040'; ctx.fillRect(x + 6, y + 22, 16, 1);
        break;
      case 'P':
        ctx.fillStyle = '#3D2914'; ctx.fillRect(x + 10, y + 22, 12, 8);
        ctx.fillStyle = '#5C3D24'; ctx.fillRect(x + 10, y + 22, 12, 2);
        ctx.fillStyle = '#3D6B2A';
        ctx.fillRect(x + 8, y + 14, 4, 8); ctx.fillRect(x + 14, y + 8, 6, 12); ctx.fillRect(x + 20, y + 12, 4, 10);
        ctx.fillStyle = '#7AA84D';
        ctx.fillRect(x + 9, y + 15, 2, 6); ctx.fillRect(x + 16, y + 10, 2, 10);
        ctx.fillStyle = '#5A8A3D'; ctx.fillRect(x + 21, y + 13, 2, 6);
        break;
      case 'C':
        ctx.fillStyle = '#404040'; ctx.fillRect(x + 8, y + 4, 16, 24);
        ctx.fillStyle = '#1a1a1a'; ctx.fillRect(x + 8, y + 4, 16, 4);
        ctx.fillStyle = '#5BC8D5'; ctx.fillRect(x + 12, y + 14, 8, 4);
        ctx.fillStyle = '#FFFFFF'; ctx.fillRect(x + 12, y + 18, 8, 6);
        ctx.fillStyle = '#3D2914'; ctx.fillRect(x + 13, y + 19, 6, 3);
        ctx.fillStyle = '#CC2229'; ctx.fillRect(x + 22, y + 6, 2, 2);
        break;
      case 'E':
        ctx.fillStyle = '#9C6644'; ctx.fillRect(x + 2, y + 2, TILE_SIZE - 4, TILE_SIZE - 4);
        ctx.fillStyle = '#7C4F30';
        ctx.fillRect(x + 2, y + 2, TILE_SIZE - 4, 3);
        ctx.fillRect(x + 2, y + TILE_SIZE - 5, TILE_SIZE - 4, 3);
        ctx.fillStyle = '#CC2229'; ctx.fillRect(x + 6, y + 6, TILE_SIZE - 12, 6);
        ctx.fillStyle = '#FFFFFF'; ctx.fillRect(x + 8, y + 8, 2, 2);
        ctx.fillStyle = '#F7D14B'; ctx.fillRect(x + TILE_SIZE - 8, y + TILE_SIZE / 2, 2, 4);
        ctx.fillStyle = '#404040'; ctx.fillRect(x + 22, y + 8, 4, 2);
        break;
    }
  }

  function drawSpriteCentered(c, x, y) {
    ctx.drawImage(c, Math.round(x - c.width / 2), Math.round(y - c.height / 2));
  }

  function render() {
    ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);
    drawMap();
    const drawables = [...game.zombies, { isPlayer: true, x: game.player.x, y: game.player.y, dir: game.player.dir, walkFrame: game.player.walkFrame }];
    drawables.sort((a, b) => a.y - b.y);
    for (const e of drawables) {
      if (e.isPlayer) {
        drawSpriteCentered(getPlayerSprite(e.dir, e.walkFrame), e.x, e.y);
      } else {
        drawSpriteCentered(spriteCanvas(e.name, 0), e.x, e.y);
        if (e.alert > 0) {
          ctx.fillStyle = e.alert > 60 ? '#CC2229' : '#F7D14B';
          ctx.fillRect(Math.round(e.x - 4), Math.round(e.y - 26), 8, 4);
        }
      }
    }
    drawKeyFlash();
    updateHUD();
  }

  function drawKeyFlash() {
    if (!lastKey) return;
    const dt = performance.now() - lastKeyTime;
    if (dt > 700) { lastKey = null; return; }
    const alpha = Math.max(0, 1 - dt / 700);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.font = '48px "Press Start 2P", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
    ctx.fillRect(CANVAS_W / 2 - 220, CANVAS_H / 2 - 60, 440, 100);
    ctx.fillStyle = '#F7D14B';
    ctx.fillText('KEY  ' + lastKey, CANVAS_W / 2 + 2, CANVAS_H / 2 + 2);
    ctx.fillStyle = '#CC2229';
    ctx.fillText('KEY  ' + lastKey, CANVAS_W / 2, CANVAS_H / 2);
    ctx.restore();
  }

  function updateHUD() {
    let nearestName = '—', bestDist = Infinity, nearestAlert = 0;
    for (const z of game.zombies) {
      const d = Math.hypot(game.player.x - z.x, game.player.y - z.y);
      if (d < bestDist) {
        bestDist = d;
        nearestName = z.displayName.split(' · ')[0];
        nearestAlert = z.alert;
      }
    }
    const statusEl = document.getElementById('hud-status');
    if (statusEl) {
      if (bestDist < 60) { statusEl.textContent = 'IN DANGER'; statusEl.style.color = '#CC2229'; }
      else if (nearestAlert > 0) { statusEl.textContent = 'being watched'; statusEl.style.color = '#F7D14B'; }
      else if (bestDist < 200) { statusEl.textContent = 'nervous'; statusEl.style.color = '#FFFFFF'; }
      else { statusEl.textContent = 'alive'; statusEl.style.color = '#FFFFFF'; }
    }
    const nearestEl = document.getElementById('hud-nearest');
    if (nearestEl) {
      nearestEl.textContent = bestDist < 600 ? nearestName + ' (' + Math.round(bestDist) + ')' : '—';
    }
    const muteEl = document.getElementById('hud-mute');
    if (muteEl) muteEl.textContent = audioMuted ? '🔇 MUTED' : '🔊 SOUND ON';
  }

  function loop() {
    if (game.state === 'playing') {
      updatePlayer();
      for (const z of game.zombies) updateZombie(z);
      checkCaught();
    }
    render();
    requestAnimationFrame(loop);
  }

  // Buttons
  document.getElementById('btn-start').addEventListener('click', () => {
    ensureAudio();
    startGame();
  });
  document.getElementById('btn-restart').addEventListener('click', () => {
    ensureAudio();
    restartGame();
  });
  document.getElementById('btn-replay').addEventListener('click', () => {
    ensureAudio();
    restartGame();
  });
  const gameCanvas = document.getElementById('game');
  if (gameCanvas) {
    gameCanvas.addEventListener('click', () => {
      ensureAudio();
      gameCanvas.focus();
      if (game.state === 'playing') talkToNearestZombie();
      else if (game.state === 'dialogue') advanceDialogue();
    });
  }

  initGameState();
  render();
  requestAnimationFrame(loop);
})();