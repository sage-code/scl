/* Eve syntax highlighter.
 *
 * Renders every <code class="language-eve"> block once, scanning each line in a
 * single pass with one sticky regular expression (no cascaded string replaces).
 * Every source line is wrapped in <span class="line">; line numbers are drawn by
 * CSS counters (assets/css/content-code.css) for blocks inside
 * <pre class="line-numbers">, so copied code never contains the numbers.
 * An optional data-start="N" on the <pre> sets the first line number.
 */
(function () {
    "use strict";

    // word -> css class
    const WORDS = new Map();
    const define = (cls, words) => words.trim().split(/\s+/).forEach(w => WORDS.set(w, cls));

    define("keyword", `
        object method shell return
        session update insert commit from use
        new let set def scrub delete
        expect break halt next alter make store start yield call wait exit stop
        print write read over panic pass fail raise retry resume abort suspend
        apply to synchronise rollback`);
    define("operator", "in is as or eq and not xor");
    define("control", `
        job do cycle when case on loop while for match if then else done
        parallel fork join`);
    define("type", `
        Byte Short Integer Natural Real Float Rational String Logic Table Symbol
        Record Ordinal Variant Date Time Array List Object Class Lambda Function
        DataSet HashMap Folder File Null True False Type`);
    define("constant", "any other all one label self args super");

    // declaration keywords are highlighted only when they open a line
    const DECLARATIONS = new Set(`
        class driver module aspect process initialize
        recover finalize trait constructor destructor function end`.trim().split(/\s+/));

    const TOKEN = new RegExp([
        /(\(\*\*.*?(?:\*\*\)|$)|\*\*.*)/,           // 1: (** expression **) or ** end-of-line comment
        /(""")/,                                    // 2: triple-quoted string
        /("(?:[^"\\]|\\.)*"?)/,                     // 3: double-quoted string
        /('(?:[^'\\]|\\.)*')/,                      // 4: single-quoted literal
        /(\$?[A-Za-z_]\w*)/,                        // 5: word or $system variable
        /(\.\.\.?|\.[&|+]\.|::|:=|==|<>|=>|:>|<:|<-|->|<\+|\+>|<=|>=|<<|>>|&&|\|\||[-+*\/^%&]=|[=<>+\-*\/%^&|:;?#@$!])/, // 6: operator
        /(\s+|\d+(?:\.\d+)?|.)/                     // 7: anything else
    ].map(r => r.source).join("|"), "y");

    const BLOCK_END = /\*\//;
    const EXPR_END = /\*\*\)/;
    const ESCAPES = { "&": "&amp;", "<": "&lt;", ">": "&gt;" };
    const escape = s => s.replace(/[&<>]/g, c => ESCAPES[c]);
    const wrap = (cls, s) => `<span class="${cls}">${escape(s)}</span>`;

    const PLAIN = 0, BLOCK_COMMENT = 1, TRIPLE_STRING = 2, EXPR_COMMENT = 3;

    // highlight Eve source text; returns one "<span class="line">" HTML string per line
    function highlightLines(source) {
        const lines = source.replace(/\r\n?/g, "\n").split("\n");
        if (lines.length > 1 && lines[0].trim() === "") lines.shift();
        if (lines.length > 1 && lines[lines.length - 1].trim() === "") lines.pop();

        let state = PLAIN;

        function tokens(line, pos) {
            let html = "";
            let first = pos === 0; // no code seen yet on this line
            TOKEN.lastIndex = pos;
            while (TOKEN.lastIndex < line.length) {
                const m = TOKEN.exec(line);
                const text = m[0];
                if (m[1]) {
                    html += wrap("comment", text);
                    if (text.startsWith("(**") && !EXPR_END.test(text.slice(3))) {
                        state = EXPR_COMMENT; // expression comment spans lines
                        break;
                    }
                    if (text.startsWith("(**")) continue;
                    break;
                } else if (m[2]) {
                    const end = line.indexOf('"""', TOKEN.lastIndex);
                    if (end < 0) {
                        html += wrap("string", line.slice(m.index));
                        state = TRIPLE_STRING;
                        break;
                    }
                    html += wrap("string", line.slice(m.index, end + 3));
                    TOKEN.lastIndex = end + 3;
                } else if (m[3] || m[4]) {
                    html += wrap("string", text);
                } else if (m[5]) {
                    const cls = text[0] === "$" ? "builtin"
                              : line[m.index - 1] === "." ? null // member: $error.job
                              : first && DECLARATIONS.has(text) ? "keyword"
                              : text === "_" ? "operator"
                              : WORDS.get(text);
                    html += cls ? `<span class="${cls}">${text}</span>` : text;
                } else if (m[6]) {
                    html += wrap("operator", text);
                } else {
                    html += escape(text);
                    if (!/^\s/.test(text)) first = false;
                    continue;
                }
                first = false;
            }
            return html;
        }

        function renderLine(line) {
            if (state === BLOCK_COMMENT) {
                if (BLOCK_END.test(line)) state = PLAIN;
                return wrap("comment", line);
            }
            if (state === EXPR_COMMENT) {
                const end = line.search(EXPR_END);
                if (end < 0) return wrap("comment", line);
                state = PLAIN;
                return wrap("comment", line.slice(0, end + 3)) + tokens(line, end + 3);
            }
            if (state === TRIPLE_STRING) {
                const end = line.indexOf('"""');
                if (end < 0) return wrap("string", line);
                state = PLAIN;
                return wrap("string", line.slice(0, end + 3)) + tokens(line, end + 3);
            }
            const lead = line.trimStart();
            if (lead.startsWith("#")) return wrap("title", line);
            if (lead.startsWith("**")) return wrap("subtitle", line);
            if (lead.startsWith("/*")) {
                if (!BLOCK_END.test(lead.slice(2))) state = BLOCK_COMMENT;
                return wrap("comment", line);
            }
            return tokens(line, 0);
        }

        return lines.map(line => `<span class="line">${renderLine(line)}</span>`);
    }

    const highlight = source => highlightLines(source).join("\n");

    // Prism would overwrite Eve blocks with plain text, so keep it away from them
    let prismShielded = false;
    function shieldFromPrism() {
        if (prismShielded || !window.Prism || !window.Prism.hooks) return;
        prismShielded = true;
        window.Prism.hooks.add("before-all-elements-highlight", env => {
            env.elements = env.elements.filter(el => !el.closest(".language-eve"));
        });
    }

    // render all Eve code blocks under root (default: whole document)
    function eve_render(root) {
        shieldFromPrism();
        for (const code of (root || document).querySelectorAll("code.language-eve")) {
            if (code.hasAttribute("data-eve-rendered")) continue;
            const lines = highlightLines(code.textContent);
            const pre = code.parentElement;
            const start = parseInt(pre && pre.getAttribute("data-start"), 10);
            const first = Number.isNaN(start) ? 1 : start;
            if (first !== 1) code.style.setProperty("--eve-start", first - 1);
            code.style.setProperty("--eve-digits", String(first + lines.length - 1).length);
            code.innerHTML = lines.join("\n");
            code.setAttribute("data-eve-rendered", "");
        }
    }

    window.eve_highlight = highlight;
    window.eve_render = eve_render;

    shieldFromPrism();
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", () => eve_render());
    } else {
        eve_render();
    }
})();
