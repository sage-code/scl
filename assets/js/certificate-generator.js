// Client-side Certificate SVG & JPEG Generator with built-in QR Code encoder (ISO/IEC 18004, byte mode, EC Level M, no dino).
(function () {
  "use strict";

  var TEMPLATE_URL = "/community/certificate/template.svg";
  var GREAT_VIBES_FONT_URL = "/assets/fonts/GreatVibes-Regular.woff2";
  var SACRAMENTO_FONT_URL = "/assets/fonts/Sacramento-Regular.woff2";
  var cachedTemplateSvg = null;
  var cachedFontDataUri = null;
  var fontsReadyPromise = null;

  // Legacy certificate metadata by member slug / certificate filename so each legacy
  // member renders their exact historical course, badge code, and signers while using
  // the new canonical profile QR code URL: https://sagecode.org/community/profile/?user_id=<id>
  var LEGACY_CERT_PRESETS = {
    gmoise: {
      recipient_name: "Georgiana Moise",
      track: "cse",
      left_signer_name: "Claudiu Moise",
      left_signer_role: "SPONSOR",
      right_signer_name: "Elucian Moise",
      right_signer_role: "INSTRUCTOR"
    },
    ineva: {
      recipient_name: "Regina Ganser",
      track: "cse",
      left_signer_name: "Laura Moise",
      left_signer_role: "CEO",
      right_signer_name: "Elucian Moise",
      right_signer_role: "INSTRUCTOR"
    },
    cmoise: {
      recipient_name: "Claudiu Moise",
      track: "cse",
      left_signer_name: "Laura Moise",
      left_signer_role: "CEO",
      right_signer_name: "Elucian Moise",
      right_signer_role: "INSTRUCTOR"
    },
    elucian: {
      recipient_name: "Elucian Moise",
      track: "cse",
      left_signer_name: "Claudiu Nicolae",
      left_signer_role: "SPONSOR",
      right_signer_name: "Laura Moise",
      right_signer_role: "INSTRUCTOR"
    },
    laura: {
      recipient_name: "Marina Moise",
      track: "cse",
      left_signer_name: "Claudiu Nicolae",
      left_signer_role: "SPONSOR",
      right_signer_name: "Elucian Simeon",
      right_signer_role: "INSTRUCTOR"
    },
    george: {
      recipient_name: "George C Antohi",
      track: "go",
      left_signer_name: "Claudiu Moise",
      left_signer_role: "SPONSOR",
      right_signer_name: "Elucian Moise",
      right_signer_role: "INSTRUCTOR"
    },
    liviu: {
      recipient_name: "Liviu Ditoiu",
      track: "dart",
      left_signer_name: "Claudiu Moise",
      left_signer_role: "SPONSOR",
      right_signer_name: "Elucian Moise",
      right_signer_role: "INSTRUCTOR"
    }
  };

  // Map legacy certificate filenames or display names to canonical database user_id (public_id)
  var NAME_TO_USER_ID = {
    "georgiana moise": "gmoise",
    "regina ganser": "ineva",
    "claudiu moise": "cmoise",
    "elucian moise": "elucian",
    "marina moise": "laura",
    "laura moise": "laura",
    "george antohy": "george",
    "george antohi": "george",
    "george c antohi": "george",
    "george cristi antohi": "george",
    "liviu ditoiu": "liviu"
  };

  var FILE_TO_USER_ID = {
    "cse-07-gmoise": "gmoise",
    "cse-07-regina": "ineva",
    "cse-cnmoise": "cmoise",
    "cse-elucian": "elucian",
    "cse-laura": "laura",
    "csp-01-george": "george",
    "csp-liviu": "liviu"
  };

  // Real roadmap titles matching each roadmap track index page
  var ROADMAP_TITLES = {
    ada: "Ada Roadmap",
    assembly: "Assembly Tutorial",
    bash: "Bash Scripting",
    c: "C Tutorial",
    cpp: "C++ Tutorial",
    cse: "Software Engineering Roadmap",
    csharp: "C# Tutorial",
    css: "CSS Roadmap",
    dart: "Dart Roadmap",
    dba: "DBA Roadmap",
    dsa: "DSA Roadmap",
    dsl: "DSL Roadmap",
    elixir: "Elixir Roadmap",
    flutter: "Flutter Roadmap",
    fortran: "Fortran Tutorial",
    go: "Go Programming Tutorial",
    hpc: "Computer Hardware",
    html: "HTML Roadmap",
    java: "Java Programming",
    javascript: "JavaScript Roadmap",
    julia: "Julia Tutorial",
    kotlin: "Kotlin Roadmap",
    nim: "Nim Tutorial",
    node: "Node.js Roadmap",
    odin: "Odin Tutorial",
    osd: "Open Source Development Roadmap",
    pgp: "Programming Paradigms Roadmap",
    php: "PHP Roadmap",
    plsql: "SQL & PL/SQL Tutorial",
    python: "Python Roadmap",
    react: "React Roadmap",
    ruby: "Ruby Roadmap",
    rust: "Rust Tutorial",
    scala: "Scala Tutorial",
    sml: "SML Roadmap",
    svelte: "Svelte Roadmap",
    swift: "Swift Tutorial",
    tek: "TechOps Roadmap",
    tscript: "TypeScript for JavaScript Developers",
    vue: "Vue Roadmap",
    wasm: "WASM Roadmap",
    zig: "Zig Tutorial"
  };

  // Badge codes: 3-letter uppercase code for Engineering courses;
  // language-specific file extension for Programming courses.
  var TRACK_BADGE_CODES = {
    // Engineering (3 letters)
    cse: "CSE",
    dsa: "DSA",
    pgp: "PGP",
    tek: "TEK",
    dba: "DBA",
    sml: "SML",
    hpc: "HPC",
    osd: "OSD",
    dsl: "DSL",
    // Programming (file extension specific to language)
    ada: "adb",
    assembly: "asm",
    bash: "sh",
    c: "c",
    cpp: "cpp",
    csharp: "cs",
    css: "css",
    dart: "dart",
    elixir: "ex",
    flutter: "dart",
    fortran: "f90",
    go: "go",
    html: "html",
    java: "java",
    javascript: "js",
    julia: "jl",
    kotlin: "kt",
    nim: "nim",
    node: "mjs",
    odin: "odin",
    php: "php",
    plsql: "sql",
    python: "Py",
    react: "jsx",
    ruby: "rb",
    rust: "rs",
    scala: "scala",
    svelte: "svelte",
    swift: "swift",
    tscript: "ts",
    vue: "vue",
    wasm: "wasm",
    zig: "zig"
  };

  function resolveBadgeCode(track, explicitCode) {
    if (explicitCode) return String(explicitCode).trim();
    var key = String(track || "cse").trim().toLowerCase();
    return TRACK_BADGE_CODES[key] || key.toUpperCase();
  }

  function formatRoadmapCourseTitle(track) {
    var key = String(track || "cse").trim().toLowerCase();
    return ROADMAP_TITLES[key] || (key.toUpperCase() + " Roadmap");
  }

  function escapeXml(str) {
    return String(str == null ? "" : str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&apos;");
  }

  // ---------------------------------------------------------------------------
  // Pure JS QR Code Encoder (Byte Mode, Error Correction Level M, Versions 1..10)
  // ---------------------------------------------------------------------------
  // Total codewords, EC codewords per block, and block counts for EC Level M (versions 1..10)
  var QR_VERSION_M = [
    null,
    { total: 26, ecPerBlock: 10, blocks1: 1, data1: 16, blocks2: 0, data2: 0, align: [] },
    { total: 44, ecPerBlock: 16, blocks1: 1, data1: 28, blocks2: 0, data2: 0, align: [6, 18] },
    { total: 70, ecPerBlock: 26, blocks1: 1, data1: 44, blocks2: 0, data2: 0, align: [6, 22] },
    { total: 100, ecPerBlock: 18, blocks1: 2, data1: 32, blocks2: 0, data2: 0, align: [6, 26] },
    { total: 134, ecPerBlock: 24, blocks1: 2, data1: 43, blocks2: 0, data2: 0, align: [6, 30] },
    { total: 172, ecPerBlock: 16, blocks1: 4, data1: 27, blocks2: 0, data2: 0, align: [6, 34] },
    { total: 196, ecPerBlock: 18, blocks1: 4, data1: 31, blocks2: 0, data2: 0, align: [6, 22, 38] },
    { total: 242, ecPerBlock: 22, blocks1: 2, data1: 38, blocks2: 2, data2: 39, align: [6, 24, 42] },
    { total: 292, ecPerBlock: 22, blocks1: 3, data1: 36, blocks2: 2, data2: 37, align: [6, 26, 46] },
    { total: 346, ecPerBlock: 26, blocks1: 4, data1: 43, blocks2: 1, data2: 44, align: [6, 28, 50] }
  ];

  var GF_EXP = new Uint8Array(512);
  var GF_LOG = new Uint8Array(256);
  (function initGf() {
    var x = 1;
    for (var i = 0; i < 255; i++) {
      GF_EXP[i] = x;
      GF_LOG[x] = i;
      x <<= 1;
      if (x & 0x100) x ^= 0x11d;
    }
    for (var j = 255; j < 512; j++) {
      GF_EXP[j] = GF_EXP[j - 255];
    }
  })();

  function gfMul(a, b) {
    if (a === 0 || b === 0) return 0;
    return GF_EXP[GF_LOG[a] + GF_LOG[b]];
  }

  function rsGeneratorPoly(degree) {
    var poly = new Uint8Array([1]);
    for (var i = 0; i < degree; i++) {
      var next = new Uint8Array(poly.length + 1);
      var root = GF_EXP[i];
      for (var j = 0; j < poly.length; j++) {
        next[j] ^= poly[j];
        next[j + 1] ^= gfMul(poly[j], root);
      }
      poly = next;
    }
    return poly;
  }

  function rsEncode(data, ecLen) {
    var gen = rsGeneratorPoly(ecLen);
    var rem = new Uint8Array(ecLen);
    for (var i = 0; i < data.length; i++) {
      var factor = data[i] ^ rem[0];
      for (var k = 0; k < ecLen - 1; k++) {
        rem[k] = rem[k + 1] ^ gfMul(gen[k + 1], factor);
      }
      rem[ecLen - 1] = gfMul(gen[ecLen], factor);
    }
    return rem;
  }

  function utf8Bytes(str) {
    if (typeof TextEncoder !== "undefined") {
      return Array.from(new TextEncoder().encode(str));
    }
    var out = [];
    for (var i = 0; i < str.length; i++) {
      var c = str.charCodeAt(i);
      if (c < 0x80) out.push(c);
      else if (c < 0x800) {
        out.push(0xc0 | (c >> 6), 0x80 | (c & 0x3f));
      } else {
        out.push(0xe0 | (c >> 12), 0x80 | ((c >> 6) & 0x3f), 0x80 | (c & 0x3f));
      }
    }
    return out;
  }

  function pickQrVersion(byteLen) {
    for (var v = 1; v <= 10; v++) {
      var spec = QR_VERSION_M[v];
      var dataCap = spec.blocks1 * spec.data1 + spec.blocks2 * spec.data2;
      var lenBits = v <= 9 ? 8 : 16;
      var neededBytes = Math.ceil((4 + lenBits + byteLen * 8) / 8);
      if (neededBytes <= dataCap) return v;
    }
    throw new Error("QR payload too long.");
  }

  function buildCodewords(bytes, version) {
    var spec = QR_VERSION_M[version];
    var dataCap = spec.blocks1 * spec.data1 + spec.blocks2 * spec.data2;
    var bits = [];
    function pushBits(val, count) {
      for (var i = count - 1; i >= 0; i--) {
        bits.push((val >> i) & 1);
      }
    }
    // Mode indicator: Byte mode = 0100
    pushBits(0x4, 4);
    pushBits(bytes.length, version <= 9 ? 8 : 16);
    for (var i = 0; i < bytes.length; i++) {
      pushBits(bytes[i], 8);
    }
    var maxBits = dataCap * 8;
    var term = Math.min(4, maxBits - bits.length);
    pushBits(0, term);
    while (bits.length % 8 !== 0) bits.push(0);

    var dataBytes = new Uint8Array(dataCap);
    var byteIdx = 0;
    for (var b = 0; b < bits.length; b += 8) {
      var v = 0;
      for (var k = 0; k < 8; k++) v = (v << 1) | bits[b + k];
      dataBytes[byteIdx++] = v;
    }
    var pads = [0xec, 0x11];
    var p = 0;
    while (byteIdx < dataCap) {
      dataBytes[byteIdx++] = pads[p & 1];
      p++;
    }

    var blocks = [];
    var ecBlocks = [];
    var offset = 0;
    for (var b1 = 0; b1 < spec.blocks1; b1++) {
      var slice1 = dataBytes.subarray(offset, offset + spec.data1);
      offset += spec.data1;
      blocks.push(slice1);
      ecBlocks.push(rsEncode(slice1, spec.ecPerBlock));
    }
    for (var b2 = 0; b2 < spec.blocks2; b2++) {
      var slice2 = dataBytes.subarray(offset, offset + spec.data2);
      offset += spec.data2;
      blocks.push(slice2);
      ecBlocks.push(rsEncode(slice2, spec.ecPerBlock));
    }

    var interleaved = [];
    var maxDataLen = Math.max(spec.data1, spec.data2);
    for (var col = 0; col < maxDataLen; col++) {
      for (var blk = 0; blk < blocks.length; blk++) {
        if (col < blocks[blk].length) interleaved.push(blocks[blk][col]);
      }
    }
    for (var ecol = 0; ecol < spec.ecPerBlock; ecol++) {
      for (var eblk = 0; eblk < ecBlocks.length; eblk++) {
        interleaved.push(ecBlocks[eblk][ecol]);
      }
    }
    return interleaved;
  }

  function placeFinder(grid, reserved, r0, c0) {
    for (var dr = -1; dr <= 7; dr++) {
      for (var dc = -1; dc <= 7; dc++) {
        var r = r0 + dr;
        var c = c0 + dc;
        if (r < 0 || c < 0 || r >= grid.length || c >= grid.length) continue;
        var dark =
          dr >= 0 &&
          dr <= 6 &&
          dc >= 0 &&
          dc <= 6 &&
          (dr === 0 || dr === 6 || dc === 0 || dc === 6 || (dr >= 2 && dr <= 4 && dc >= 2 && dc <= 4));
        grid[r][c] = dark ? 1 : 0;
        reserved[r][c] = true;
      }
    }
  }

  function placeAlignment(grid, reserved, rCenter, cCenter) {
    for (var dr = -2; dr <= 2; dr++) {
      for (var dc = -2; dc <= 2; dc++) {
        var r = rCenter + dr;
        var c = cCenter + dc;
        var dark = Math.max(Math.abs(dr), Math.abs(dc)) !== 1;
        grid[r][c] = dark ? 1 : 0;
        reserved[r][c] = true;
      }
    }
  }

  function computeFormatBits(ecLevelBits, mask) {
    var data = (ecLevelBits << 3) | mask;
    var rem = data << 10;
    for (var i = 14; i >= 10; i--) {
      if ((rem >> i) & 1) rem ^= 0x537 << (i - 10);
    }
    return ((data << 10) | rem) ^ 0x5412;
  }

  function applyFormatInfo(grid, reserved, mask, markOnly) {
    // EC Level M = 00 in QR format specification
    var bits = computeFormatBits(0, mask);
    var size = grid.length;
    for (var i = 0; i < 15; i++) {
      var bit = (bits >> i) & 1;
      // Top-left
      var r1 = i < 6 ? i : i < 8 ? i + 1 : i === 8 ? 8 : 14 - i;
      var c1 = i < 8 ? 8 : i === 8 ? 7 : 8;
      if (i < 8) {
        r1 = 8;
        c1 = i < 6 ? i : i + 1;
      } else if (i === 8) {
        r1 = 8;
        c1 = 7;
      } else {
        r1 = 14 - i;
        c1 = 8;
      }
      if (!markOnly) grid[r1][c1] = bit;
      reserved[r1][c1] = true;

      // Top-right and bottom-left
      var r2, c2;
      if (i < 8) {
        r2 = 8;
        c2 = size - 1 - i;
      } else {
        r2 = size - 15 + i;
        c2 = 8;
      }
      if (!markOnly) grid[r2][c2] = bit;
      reserved[r2][c2] = true;
    }
    grid[size - 8][8] = 1;
    reserved[size - 8][8] = true;
  }

  function maskFn(mask, r, c) {
    switch (mask) {
      case 0: return (r + c) % 2 === 0;
      case 1: return r % 2 === 0;
      case 2: return c % 3 === 0;
      case 3: return (r + c) % 3 === 0;
      case 4: return (Math.floor(r / 2) + Math.floor(c / 3)) % 2 === 0;
      case 5: return ((r * c) % 2) + ((r * c) % 3) === 0;
      case 6: return (((r * c) % 2) + ((r * c) % 3)) % 2 === 0;
      case 7: return (((r + c) % 2) + ((r * c) % 3)) % 2 === 0;
      default: return false;
    }
  }

  function penaltyScore(grid) {
    var size = grid.length;
    var score = 0;
    for (var r = 0; r < size; r++) {
      var runLen = 1;
      for (var c = 1; c < size; c++) {
        if (grid[r][c] === grid[r][c - 1]) {
          runLen++;
          if (runLen === 5) score += 3;
          else if (runLen > 5) score += 1;
        } else {
          runLen = 1;
        }
      }
    }
    for (var c2 = 0; c2 < size; c2++) {
      var runLen2 = 1;
      for (var r2 = 1; r2 < size; r2++) {
        if (grid[r2][c2] === grid[r2 - 1][c2]) {
          runLen2++;
          if (runLen2 === 5) score += 3;
          else if (runLen2 > 5) score += 1;
        } else {
          runLen2 = 1;
        }
      }
    }
    for (var br = 0; br < size - 1; br++) {
      for (var bc = 0; bc < size - 1; bc++) {
        var v = grid[br][bc];
        if (v === grid[br][bc + 1] && v === grid[br + 1][bc] && v === grid[br + 1][bc + 1]) {
          score += 3;
        }
      }
    }
    return score;
  }

  function encodeQrMatrix(text) {
    var bytes = utf8Bytes(text);
    var version = pickQrVersion(bytes.length);
    var spec = QR_VERSION_M[version];
    var size = 17 + version * 4;
    var grid = Array.from({ length: size }, function () { return new Uint8Array(size); });
    var reserved = Array.from({ length: size }, function () { return new Array(size).fill(false); });

    placeFinder(grid, reserved, 0, 0);
    placeFinder(grid, reserved, 0, size - 7);
    placeFinder(grid, reserved, size - 7, 0);

    var align = spec.align;
    for (var i = 0; i < align.length; i++) {
      for (var j = 0; j < align.length; j++) {
        var ar = align[i];
        var ac = align[j];
        if (reserved[ar][ac]) continue;
        placeAlignment(grid, reserved, ar, ac);
      }
    }

    for (var t = 8; t < size - 8; t++) {
      if (!reserved[6][t]) {
        grid[6][t] = t % 2 === 0 ? 1 : 0;
        reserved[6][t] = true;
      }
      if (!reserved[t][6]) {
        grid[t][6] = t % 2 === 0 ? 1 : 0;
        reserved[t][6] = true;
      }
    }

    applyFormatInfo(grid, reserved, 0, true);

    var codewords = buildCodewords(bytes, version);
    var bitIdx = 0;
    var totalBits = codewords.length * 8;
    var upward = true;

    for (var right = size - 1; right >= 1; right -= 2) {
      if (right === 6) right = 5;
      for (var vert = 0; vert < size; vert++) {
        var row = upward ? size - 1 - vert : vert;
        for (var dx = 0; dx < 2; dx++) {
          var col = right - dx;
          if (reserved[row][col]) continue;
          var bit = 0;
          if (bitIdx < totalBits) {
            bit = (codewords[bitIdx >> 3] >> (7 - (bitIdx & 7))) & 1;
            bitIdx++;
          }
          grid[row][col] = bit;
        }
      }
      upward = !upward;
    }

    var bestMask = 0;
    var bestScore = Infinity;
    var bestGrid = null;

    for (var m = 0; m < 8; m++) {
      var candidate = grid.map(function (r) { return new Uint8Array(r); });
      for (var rr = 0; rr < size; rr++) {
        for (var cc = 0; cc < size; cc++) {
          if (!reserved[rr][cc] && maskFn(m, rr, cc)) {
            candidate[rr][cc] ^= 1;
          }
        }
      }
      applyFormatInfo(candidate, reserved, m, false);
      var s = penaltyScore(candidate);
      if (s < bestScore) {
        bestScore = s;
        bestMask = m;
        bestGrid = candidate;
      }
    }
    return bestGrid;
  }

  function renderQrSvgMarkup(url, boxSize) {
    var targetSize = boxSize || 250;
    var matrix = encodeQrMatrix(url);
    var count = matrix.length;
    var cell = targetSize / count;
    var parts = [
      '<rect x="-10" y="-10" width="' + (targetSize + 20) + '" height="' + (targetSize + 20) + '" fill="#ffffff" rx="6" />'
    ];

    function isFinderZone(r, c) {
      return (r < 7 && c < 7) || (r < 7 && c >= count - 7) || (r >= count - 7 && c < 7);
    }

    function renderFinderCorner(r0, c0) {
      var x = (c0 * cell).toFixed(2);
      var y = (r0 * cell).toFixed(2);
      var outer = (7 * cell).toFixed(2);
      var innerOffset = (1 * cell).toFixed(2);
      var innerSize = (5 * cell).toFixed(2);
      var coreOffset = (2 * cell).toFixed(2);
      var coreSize = (3 * cell).toFixed(2);
      parts.push(
        '<rect x="' + x + '" y="' + y + '" width="' + outer + '" height="' + outer + '" rx="' + (cell * 0.8).toFixed(2) + '" fill="#111111" />',
        '<rect x="' + (c0 * cell + 1 * cell).toFixed(2) + '" y="' + (r0 * cell + 1 * cell).toFixed(2) + '" width="' + innerSize + '" height="' + innerSize + '" rx="' + (cell * 0.45).toFixed(2) + '" fill="#ffffff" />',
        '<rect x="' + (c0 * cell + 2 * cell).toFixed(2) + '" y="' + (r0 * cell + 2 * cell).toFixed(2) + '" width="' + coreSize + '" height="' + coreSize + '" rx="' + (cell * 0.35).toFixed(2) + '" fill="#111111" />'
      );
    }

    renderFinderCorner(0, 0);
    renderFinderCorner(0, count - 7);
    renderFinderCorner(count - 7, 0);

    var d = [];
    for (var r = 0; r < count; r++) {
      for (var c = 0; c < count; c++) {
        if (isFinderZone(r, c) || !matrix[r][c]) continue;
        var x = (c * cell).toFixed(2);
        var y = (r * cell).toFixed(2);
        var w = (cell + 0.15).toFixed(2);
        d.push("M" + x + "," + y + "h" + w + "v" + w + "h-" + w + "z");
      }
    }
    parts.push('<path fill="#111111" d="' + d.join("") + '" />');
    return parts.join("\n");
  }

  // ---------------------------------------------------------------------------
  // User ID & Certificate Metadata Resolution
  // ---------------------------------------------------------------------------
  function resolveUserId(profile, cert) {
    if (profile && typeof profile.public_id === "string" && profile.public_id.trim()) {
      var pid = profile.public_id.trim();
      var lowerName = String(profile.display_name || "").trim().toLowerCase();
      if (NAME_TO_USER_ID[lowerName] && !LEGACY_CERT_PRESETS[pid]) {
        return NAME_TO_USER_ID[lowerName];
      }
      return pid;
    }
    if (cert && typeof cert.user_id === "string" && cert.user_id.trim()) {
      return cert.user_id.trim();
    }
    if (cert && typeof cert.url === "string") {
      var m = cert.url.match(/\/([a-z0-9_-]+)\.(?:jpe?g|png|webp|svg)$/i);
      if (m && FILE_TO_USER_ID[m[1].toLowerCase()]) {
        return FILE_TO_USER_ID[m[1].toLowerCase()];
      }
      var mLegacy = cert.url.match(/\/legacy\/([a-z0-9_-]+)\//i);
      if (mLegacy) {
        return mLegacy[1].toLowerCase();
      }
    }
    var nameKey = String((profile && profile.display_name) || (cert && cert.recipient_name) || "").trim().toLowerCase();
    if (NAME_TO_USER_ID[nameKey]) {
      return NAME_TO_USER_ID[nameKey];
    }
    return "elucian";
  }

  function buildProfileQrUrl(userId) {
    return "https://sagecode.org/community/profile/?user_id=" + encodeURIComponent(userId);
  }

  function extractFirstName(fullName) {
    var trimmed = String(fullName || "").trim();
    if (!trimmed) return "";
    return trimmed.split(/\s+/)[0];
  }

  function resolveCertificateFields(profile, cert) {
    var userId = resolveUserId(profile, cert);
    var preset = LEGACY_CERT_PRESETS[userId] || null;
    var track = String((cert && cert.track) || (preset && preset.track) || (profile && profile.qualified_track) || "cse").trim().toLowerCase();

    var recipientName =
      (profile && profile.display_name) ||
      (preset && preset.recipient_name) ||
      "Sage-Code Member";

    var badgeCode = resolveBadgeCode(track, cert && cert.badge_code);
    var courseTitle = (cert && cert.course_title) || formatRoadmapCourseTitle(track);

    var leftSignerName = (cert && cert.left_signer_name) || (preset && preset.left_signer_name) || "Claudiu Moise";
    var leftSignerRole = (cert && cert.left_signer_role) || (preset && preset.left_signer_role) || "SPONSOR";
    var rightSignerName = (cert && cert.right_signer_name) || (preset && preset.right_signer_name) || "Elucian Moise";
    var rightSignerRole = (cert && cert.right_signer_role) || (preset && preset.right_signer_role) || "INSTRUCTOR";

    var leftSig = extractFirstName(leftSignerName);
    var rightSig = extractFirstName(rightSignerName);

    var qrUrl = buildProfileQrUrl(userId);

    return {
      user_id: userId,
      track: track,
      qr_url: qrUrl,
      recipient_name: recipientName,
      course_title: courseTitle,
      badge_code: badgeCode,
      left_sig: leftSig,
      left_signer_name: leftSignerName,
      left_signer_role: leftSignerRole,
      right_sig: rightSig,
      right_signer_name: rightSignerName,
      right_signer_role: rightSignerRole
    };
  }

  function arrayBufferToBase64(buffer) {
    var bytes = new Uint8Array(buffer);
    var binary = "";
    var chunkSize = 0x8000;
    for (var i = 0; i < bytes.length; i += chunkSize) {
      binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunkSize));
    }
    return window.btoa(binary);
  }

  async function loadFontFaceIntoDocument(family, url) {
    try {
      var res = await fetch(url, { cache: "force-cache" });
      if (!res.ok) return "";
      var buf = await res.arrayBuffer();
      if (typeof FontFace !== "undefined" && document.fonts && document.fonts.add) {
        var face = new FontFace(family, buf, { style: "normal", weight: "400" });
        await face.load();
        document.fonts.add(face);
      }
      return "data:font/woff2;base64," + arrayBufferToBase64(buf);
    } catch (_err) {
      return "";
    }
  }

  async function loadGreatVibesFontDataUri() {
    if (cachedFontDataUri) return cachedFontDataUri;
    var results = await Promise.all([
      loadFontFaceIntoDocument("Great Vibes", GREAT_VIBES_FONT_URL),
      loadFontFaceIntoDocument("Sacramento", SACRAMENTO_FONT_URL)
    ]);
    cachedFontDataUri = results[0];
    return cachedFontDataUri;
  }

  async function loadTemplateSvg() {
    if (cachedTemplateSvg) return cachedTemplateSvg;
    var res = await fetch(TEMPLATE_URL, { cache: "no-cache" });
    if (!res.ok) {
      throw new Error("Could not load certificate SVG template.");
    }
    cachedTemplateSvg = await res.text();
    return cachedTemplateSvg;
  }

  function ensureCertificateFonts() {
    if (fontsReadyPromise) return fontsReadyPromise;
    fontsReadyPromise = (async function () {
      await loadGreatVibesFontDataUri();
      if (typeof document !== "undefined" && document.fonts && document.fonts.load) {
        try {
          await Promise.all([
            document.fonts.load("117px 'Great Vibes'"),
            document.fonts.load("61px 'Sacramento'")
          ]);
        } catch (_err) {
          // Proceed with fallback fonts if offline
        }
      }
    })();
    return fontsReadyPromise;
  }

  async function buildCertificateSvg(profile, cert) {
    var template = await loadTemplateSvg();
    await ensureCertificateFonts();
    var fields = resolveCertificateFields(profile, cert);
    var qrMarkup = renderQrSvgMarkup(fields.qr_url, 250);
    var badgeCode = fields.badge_code || "CSE";
    var isLongBadge = badgeCode.length > 3;

    var svg = template
      .replace(/\[NAME\]|\{\{?RECIPIENT_NAME\}?\}/g, escapeXml(fields.recipient_name))
      .replace(/\[COURSE\]|\{\{?COURSE_TITLE\}?\}/g, escapeXml(fields.course_title));

    if (isLongBadge) {
      var pillWidth = Math.max(150, Math.min(200, 96 + badgeCode.length * 16));
      var pillX = (1000 - pillWidth / 2).toFixed(1);
      var innerWidth = (pillWidth - 14).toFixed(1);
      var innerX = (1000 - (pillWidth - 14) / 2).toFixed(1);
      var pillMarkup = [
        '<g id="cert-badge-shape">',
        '  <rect x="' + pillX + '" y="1154" width="' + pillWidth + '" height="88" rx="44" ry="44" fill="#f4c014" stroke="#e0b014" stroke-width="6" />',
        '  <rect x="' + innerX + '" y="1161" width="' + innerWidth + '" height="74" rx="37" ry="37" fill="#dce3ec" stroke="#b88430" stroke-width="2.5" />',
        '</g>'
      ].join("\n    ");
      svg = svg.replace(/<g id="cert-badge-shape">[\s\S]*?<\/g>/, pillMarkup);
      var fontSize = badgeCode.length >= 6 ? "30px" : "34px";
      var textY = badgeCode.length >= 6 ? "1209" : "1210";
      svg = svg.replace(
        'id="cert-badge-code" x="1000" y="1212" text-anchor="middle" class="cert-badge-text">[CODE]',
        'id="cert-badge-code" x="1000" y="' + textY + '" text-anchor="middle" style="font-size:' + fontSize + '" class="cert-badge-text">' + escapeXml(badgeCode)
      );
    }

    svg = svg
      .replace(/\[CODE\]|\{\{?BADGE_CODE\}?\}/g, escapeXml(badgeCode))
      .replace(/\[LEFT_SIG\]|\{\{?LEFT_SIG\}?\}/g, escapeXml(fields.left_sig))
      .replace(/\[LEFT_SIGNER\]|\{\{?LEFT_SIGNER_NAME\}?\}/g, escapeXml(fields.left_signer_name))
      .replace(/\[LEFT_ROLE\]|\{\{?LEFT_SIGNER_ROLE\}?\}/g, escapeXml(fields.left_signer_role))
      .replace(/\[RIGHT_SIG\]|\{\{?RIGHT_SIG\}?\}/g, escapeXml(fields.right_sig))
      .replace(/\[RIGHT_SIGNER\]|\{\{?RIGHT_SIGNER_NAME\}?\}/g, escapeXml(fields.right_signer_name))
      .replace(/\[RIGHT_ROLE\]|\{\{?RIGHT_SIGNER_ROLE\}?\}/g, escapeXml(fields.right_signer_role))
      .replace(/\[QR_CODE\]|\{\{?QR_CODE_SVG\}?\}/g, qrMarkup);

    return { svg: svg, fields: fields };
  }

  async function renderSvgToJpegDataUrl(svgString, quality) {
    await ensureCertificateFonts();
    return new Promise(function (resolve, reject) {
      var blob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
      var url = URL.createObjectURL(blob);
      var img = new Image();
      img.decoding = "async";
      img.onload = function () {
        try {
          var canvas = document.createElement("canvas");
          canvas.width = 2000;
          canvas.height = 1545;
          var ctx = canvas.getContext("2d");
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          URL.revokeObjectURL(url);
          resolve(canvas.toDataURL("image/jpeg", quality || 0.94));
        } catch (err) {
          URL.revokeObjectURL(url);
          reject(err);
        }
      };
      img.onerror = function () {
        URL.revokeObjectURL(url);
        reject(new Error("Failed to rasterize certificate SVG."));
      };
      img.src = url;
    });
  }

  function buildDownloadFileName(fields) {
    var badge = String(fields.badge_code || "cert").toLowerCase().replace(/[^a-z0-9]+/g, "-");
    var user = String(fields.user_id || "member").toLowerCase().replace(/[^a-z0-9_-]+/g, "-");
    return "certificate-" + badge + "-" + user + ".jpg";
  }

  window.sclCertificate = {
    resolveCertificateFields: resolveCertificateFields,
    buildProfileQrUrl: buildProfileQrUrl,
    renderQrSvgMarkup: renderQrSvgMarkup,
    buildCertificateSvg: buildCertificateSvg,
    renderSvgToJpegDataUrl: renderSvgToJpegDataUrl,
    buildDownloadFileName: buildDownloadFileName
  };
})();
