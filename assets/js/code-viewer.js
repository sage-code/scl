document.addEventListener('DOMContentLoaded', async () => {
    const params = new URLSearchParams(window.location.search);
    const file = params.get('file');

    const display = document.getElementById('code-display');
    const pre = document.querySelector('.editor-wrapper pre');
    const editorWrapper = document.querySelector('.editor-wrapper');

    /* ---- Persisted preferences (zoom + wrap) stored in localStorage ---- */
    const PREFS_KEY = 'sage-code:code-viewer-prefs';

    const loadPrefs = () => {
        try {
            const raw = localStorage.getItem(PREFS_KEY);
            if (!raw) return null;
            const parsed = JSON.parse(raw);
            return (parsed && typeof parsed === 'object') ? parsed : null;
        } catch {
            // JSON parse error or storage unavailable — fall back to defaults
            return null;
        }
    };

    const savePrefs = () => {
        try {
            localStorage.setItem(PREFS_KEY, JSON.stringify({ fontSize, wrap: wrapOn }));
        } catch {
            // storage blocked (private mode / quota) — preferences just won't persist
        }
    };

    /* ---- Zoom controls: [+] / [-] buttons + Ctrl+= / Ctrl+- / Ctrl+0 ---- */
    const MIN_FONT_SIZE = 10;
    const MAX_FONT_SIZE = 26;
    const ZOOM_STEP = 2;
    const DEFAULT_FONT_SIZE = 14;
    let fontSize = DEFAULT_FONT_SIZE;

    const applyFontSize = () => {
        pre.style.fontSize = `${fontSize}px`;
    };

    const zoomIn = () => {
        fontSize = Math.min(MAX_FONT_SIZE, fontSize + ZOOM_STEP);
        applyFontSize();
        savePrefs();
    };

    const zoomOut = () => {
        fontSize = Math.max(MIN_FONT_SIZE, fontSize - ZOOM_STEP);
        applyFontSize();
        savePrefs();
    };

    document.getElementById('zoom-in-btn').addEventListener('click', zoomIn);
    document.getElementById('zoom-out-btn').addEventListener('click', zoomOut);

    // Editor-style keyboard zoom (overrides the native browser shortcut
    // only while this page is focused, like VSCode does).
    document.addEventListener('keydown', (e) => {
        if (!(e.ctrlKey || e.metaKey)) return;
        if (e.key === '=' || e.key === '+') {
            e.preventDefault();
            zoomIn();
        } else if (e.key === '-' || e.key === '_') {
            e.preventDefault();
            zoomOut();
        } else if (e.key === '0') {
            e.preventDefault();
            fontSize = DEFAULT_FONT_SIZE;
            applyFontSize();
            savePrefs();
        }
    });

    /* ---- Wrap toggle: "W" button, OFF by default (current behavior). ---- */
    const wrapBtn = document.getElementById('wrap-btn');
    let wrapOn = false;
    const setWrap = (wrap, persist = true) => {
        wrapOn = wrap;
        wrapBtn.classList.toggle('active', wrap);          // visual "on" state
        editorWrapper.classList.toggle('wrap-on', wrap);   // CSS soft-wrap
        wrapBtn.title = wrap
            ? 'Toggle line wrapping (currently ON)'
            : 'Toggle line wrapping (currently OFF)';
        if (persist) savePrefs();
    };
    wrapBtn.addEventListener('click', () => {
        setWrap(!wrapOn);
    });

    /* ---- Restore saved preferences (zoom + wrap) from the last visit ---- */
    const prefs = loadPrefs();
    if (prefs && Number.isFinite(prefs.fontSize)) {
        fontSize = Math.min(MAX_FONT_SIZE, Math.max(MIN_FONT_SIZE, prefs.fontSize));
    }
    applyFontSize();
    setWrap(prefs && prefs.wrap === true, false); // restore without re-saving

    if (!file) {
        display.textContent = "Error: No file specified.";
        return;
    }

    const ext = file.split('.').pop().toLowerCase();

    // Map extension to Prism language
    const langMap = {
        'py': 'python',
        'js': 'javascript',
        'sh': 'bash',
        'css': 'css',
        'html': 'html',
        'json': 'json',
        'dart': 'dart',
        // Ada — grammar is bundled in assets/prism.js (see its download header)
        'adb': 'ada',
        'ads': 'ada',
        // Swift — the grammar is bundled in assets/prism.js (see its download header)
        'swift': 'swift',
        // Julia — the grammar is bundled in assets/prism.js (see its download header)
        'jl': 'julia',
        // Java — corpus grammar is bundled in assets/prism.js (see its download header)
        'java': 'java',
        'cs': 'csharp',
        'csharp': 'csharp',
        'c': 'c',
        'h': 'c',
        'rs': 'rust',   // Rust — grammar bundled in assets/prism.js
        'zig': 'zig',
        // Nim — grammar bundled in assets/prism.js (see its download header)
        'nim': 'nim',
        'nims': 'nim',   // config.nims and .nims task scripts share the grammar
        // Elixir and Erlang — grammars are bundled in assets/prism.js (see its download header)
        'ex': 'elixir',
        'exs': 'elixir',
        'eex': 'elixir',   // HEEx/EEx templates render as elixir (tags stay plain)
        'heex': 'elixir',
        'erl': 'erlang',
        'hrl': 'erlang',
        // Odin — grammar bundled in assets/prism.js (see its download header)
        'odin': 'odin',
        'cpp': 'cpp',
        'cc': 'cpp',
        'cxx': 'cpp',
        'hpp': 'cpp',
        'hh': 'cpp',
        // Assembly dialects — NASM/GAS x86 use the 'nasm' grammar appended to
        // assets/prism.js; ARM and WebAssembly use the bundled grammars.
        'asm': 'nasm',
        'nasm': 'nasm',
        's': 'nasm',      // GAS source (.s / .S) — extension is lowercased already
        'inc': 'nasm',    // NASM include files with macro definitions
        'arm': 'armasm',
        'aar': 'armasm',
        'wat': 'wasm',
        'wast': 'wasm',
        'wasm': 'wasm',
        // Fortran — grammar is bundled in assets/prism.js (see its download header)
        'f90': 'fortran',
        'f95': 'fortran',
        'f03': 'fortran',
        'f08': 'fortran',
        'f18': 'fortran',
        'f': 'fortran',   // legacy fixed-form Fortran 77
        'for': 'fortran', // legacy fixed-form Fortran 77
        'fpp': 'fortran'  // preprocessor output
    };

    display.className = `language-${langMap[ext] || 'javascript'}`;

    try {
        const response = await fetch(file);
        if (!response.ok) throw new Error("File not found");

        const text = await response.text();
        display.textContent = text;

        // Re-run Prism highlighting
        Prism.highlightAll();

        // Setup download
        const downloadBtn = document.getElementById('download-btn');
        downloadBtn.href = file;
        downloadBtn.download = file.split('/').pop();

    } catch (err) {
        display.textContent = `Error loading file: ${err.message}`;
    }
});
