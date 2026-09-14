/* =========================================================================
 * dsl-exotic.js — lightweight syntax tokenizer for DSL roadmap pages whose
 * example languages are NOT included in the global Prism bundle.
 *
 * Special case by design (manual/ARCHITECTURE.md §Syntax highlighting):
 *  - linked per page together with /assets/css/dsl-exotic.css
 *  - only on pages showing grammar-less languages: antlr, racket, lisp,
 *    autolisp, forth, verilog, llvm, prolog, datalog, clingo, minizinc,
 *    matlab, wolfram, stan, fasm
 *  - the global assets/prism.js is NEVER modified for these languages
 *
 * How it works
 *  - Runs after the DOM is ready (deferred script).
 *  - Scans every <pre><code> block; tokenizes only blocks that carry a
 *    class language-<lang> (or a data-scl-lang attribute) whose <lang> is
 *    in the RULES table below.
 *  - Skips Prism-owned blocks (they contain .token spans) so Python, Bash,
 *    EBNF, OCaml, Julia, R, Clojure, SQL, NASM etc. keep full Prism output.
 *  - Walks the block text with one ordered alternation regex per language;
 *    matched runs are wrapped in the SAME span classes content-code.css
 *    already styles (comment, string, keyword, number, operator, directive),
 *    so the palette is not duplicated.
 *  - Idempotent: processed blocks are marked data-scl-highlighted.
 *
 * Node-compatible: module.exports is exposed for automated smoke tests.
 * ========================================================================= */
(function (global) {
  'use strict';

  // Token kind -> span class (styled by content-code.css / dsl-exotic.css).
  var CLASS = {
    c: 'comment', s: 'string', k: 'keyword', n: 'number',
    o: 'operator', d: 'directive'
  };

  // Shared regex fragments (sources, compiled per language below).
  var C_LINE = '//[^\\n]*';                      // C-style line comment
  var C_BLOCK = '/\\*[\\s\\S]*?\\*/';            // C-style block comment
  var S_DQ = '"(?:\\\\.|[^"\\\\\\r\\n])*"';      // double-quoted string
  var S_SQ = "'(?:\\\\.|[^'\\\\\\r\\n])*'";      // single-quoted string / char
  var NUM = '\\b\\d+(?:\\.\\d+)?\\b';            // plain decimal number

  // Per-language ordered rule tables: ['kind', regex-source], highest
  // priority first (comments before strings, strings before keywords...).
  var RULES = {
    'antlr': [
      ['c', C_LINE + '|' + C_BLOCK],
      ['s', S_SQ],   // .g4 literal terminals are single-quoted: '+' | 'INT'
      ['k', '\\b(?:grammar|lexer|parser|fragment|tokens|options|import|returns|locals|throws|catch|finally|mode|channel)\\b'],
      ['n', NUM]
    ],
    'racket': [
      ['c', ';[^\\n]*|#\\|[\\s\\S]*?\\|#'],
      ['s', S_DQ],
      ['k', '#lang|\\b(?:define|define-syntax|define-syntax-rule|lambda|let|let\\*|letrec|letrec-values|if|cond|else|begin|match|require|provide|module|define-type|struct|quote|quasiquote|unquote|and|or|not|when|unless)\\b'],
      ['n', NUM]
    ],
    'lisp': [
      ['c', ';[^\\n]*|#\\|[\\s\\S]*?\\|#'],
      ['s', S_DQ],
      ['k', '\\b(?:defun|defmacro|defvar|defparameter|defconstant|let|let\\*|if|when|unless|progn|lambda|loop|setq|quote|function|return-from|block|dolist|dotimes)\\b'],
      ['n', NUM]
    ],
    'autolisp': [
      ['c', ';[^\\n]*'],
      ['s', S_DQ],
      ['k', '\\b(?:defun|defun-q|setq|set|command|princ|prin1|print|getpoint|getreal|getint|alert|if|progn|while|cond|repeat|exit|quit|vl-load-com|lambda|entget|entmod|regapp)\\b'],
      ['n', NUM]
    ],
    'forth': [
      // '\' line comment and '( ... )' inline comment (the classic idiom).
      ['c', '\\\\[^\\n]*|\\([^\\n]*\\)'],
      // ." ... " and s" ... " printing/string words.
      ['s', '\\.[\\"]{1}[^\\"]*[\\"]{1}|s[\\"]{1}[^\\"]*[\\"]{1}'],
      ['k', '\\b(?:variable|constant|create|does>|dup|drop|swap|over|rot|@|!|emit|cr|if|else|then|begin|while|repeat|until|do|loop|bye)\\b'],
      ['n', '\\b\\d+(?:\\.\\d+)?\\b|(?:[$%#]|0x)[0-9a-fA-F]+']
    ],
    'verilog': [
      ['c', C_LINE + '|' + C_BLOCK],
      ['s', S_DQ],
      ['k', '\\b(?:module|endmodule|input|output|inout|wire|reg|logic|assign|always|always_ff|always_comb|begin|end|if|else|case|endcase|casez|casex|posedge|negedge|initial|parameter|localparam|generate|endgenerate|for|while|function|endfunction|task|endtask|integer|genvar|default)\\b'],
      ['n', "\\b\\d+'[bhod][0-9a-fA-FxXzZ_]+\\b|" + NUM]
    ],
    'llvm': [
      ['c', ';[^\\n]*'],
      ['s', S_DQ],
      ['k', '\\b(?:define|declare|global|constant|internal|private|external|add|sub|mul|sdiv|udiv|fadd|fsub|fmul|srem|srem|and|or|xor|shl|lshr|ashr|icmp|fcmp|eq|ne|slt|sgt|sle|sge|ult|ugt|br|switch|indirectbr|ret|call|load|store|alloca|getelementptr|ptrtoint|inttoptr|bitcast|phi|select|extractvalue|insertvalue|void|i1|i8|i16|i32|i64|i128)\\b'],
      ['n', NUM]
    ],
    'prolog': [
      ['c', '%[^\\n]*|/\\*[\\s\\S]*?\\*/'],
      ['s', S_SQ],   // atoms are single-quoted in Prolog
      ['k', '\\b(?:is|mod|rem|abs|not|catch|throw|fail|true|halt|consult|use_module|op|assert|retract|findall|bagof|setof|maplist|member|append|length|nl)\\b'],
      ['n', NUM]
    ],
    'datalog': [
      // Soufflé-style Datalog: directives start with a dot and line comments
      // are // (/* */ block comments are accepted too).
      ['c', C_LINE + '|' + C_BLOCK],
      ['s', S_DQ],
      ['d', '\\.(?:decl|input|output|type|functor|pragma|printsize|limit|init|mc)\\b'],
      ['k', '\\b(?:number|symbol|unsigned|float|string|if|then|else|true|false)\\b'],
      ['n', NUM]
    ],
    'clingo': [
      ['c', '%[^\\n]*|%\\*[\\s\\S]*?\\*%'],
      ['s', S_DQ],
      ['d', '#(?:const|show|include|external|maximize|minimize|heuristic|script|end)\\b'],
      ['k', '\\b(?:not|and|or|true|false)\\b'],
      ['n', NUM]
    ],
    'minizinc': [
      ['c', '%[^\\n]*|/\\*[\\s\\S]*?\\*/'],
      ['s', S_DQ],
      ['k', '\\b(?:constraint|solve|satisfy|minimize|maximize|int|float|bool|string|enum|var|array|of|set|in|forall|exists|if|then|else|endif|let|include|function|predicate|output|show|par)\\b'],
      ['n', NUM]
    ],
    'matlab': [
      ['c', '%[^\\n]*|%\\{[\\s\\S]*?%\\}'],
      ['s', S_SQ],
      ['k', '\\b(?:if|elseif|else|end|for|while|switch|case|otherwise|function|return|global|persistent|try|catch|break|continue|parfor|spmd|true|false|NaN|Inf)\\b'],
      ['n', NUM]
    ],
    'wolfram': [
      ['c', '\\(\\*[\\s\\S]*?\\*\\)'],
      ['s', S_DQ],
      ['k', '\\b(?:Module|Block|With|If|For|While|Do|Table|Function|Map|Apply|Rule|Set|SetDelayed|Clear|Plot|ListPlot|Print|Export|Import|True|False|Null|Nest|Fold|Total|Length|Mean|Range|Part|DeleteCases|Select)\\b'],
      ['n', NUM]
    ],
    'stan': [
      ['c', C_LINE + '|' + C_BLOCK],
      ['s', S_DQ],
      ['k', '\\b(?:functions|data|parameters|model|generated|quantities|transformed|int|real|vector|matrix|array|simplex|ordered|positive_ordered|cholesky_factor_cov|for|in|if|else|while|return|print|reject|increment_log_prob|target|bernoulli|bernoulli_logit|bernoulli_\\w+|normal|beta|binomial)\\b'],
      ['n', NUM]
    ],
    'fasm': [
      // Flat assembler: ';' line comments, 'format'/'include'/'section'
      // directives, x86 mnemonics and registers as keywords.
      ['c', ';[^\\n]*'],
      ['s', S_SQ],
      ['d', '(?:^|\\s)(?:format|include|section|segment|use16|use32|use64|org|bits)\\b'],
      ['k', '\\b(?:db|dw|dd|dq|equ|macro|end\\s+macro|mov|add|sub|mul|div|imul|call|jmp|je|jne|jg|jl|jge|jle|ja|jb|push|pop|ret|int|lea|inc|dec|cmp|xor|and|or|test|loop|rep|movzx|movsx|fld|fstp|eax|ebx|ecx|edx|esi|edi|ebp|esp)\\b'],
      ['n', '\\b(?:0x[0-9a-fA-F]+|\\d+)\\b']
    ]
  };

  var EXOTIC = Object.keys(RULES);
  var ESC_RE = /[&<>]/g;
  var ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;' };

  function escapeHtml(s) {
    // Code blocks may contain < > & (comparisons, templates, generators);
    // escape everything we re-emit so the DOM is never reinterpreted.
    return s.replace(ESC_RE, function (ch) { return ESC[ch]; });
  }

  /**
   * tokenize(text, lang) -> HTML string.
   * Walks the whole source with ONE alternation regex per language and
   * wraps every match in a span whose class is already styled by
   * content-code.css / dsl-exotic.css. Deterministic: no state, no Math.
   */
  function tokenize(text, lang) {
    var rules = RULES[lang];
    if (!rules) return escapeHtml(text);
    var alt = [];
    for (var i = 0; i < rules.length; i++) {
      alt.push('(?<' + rules[i][0] + '>' + rules[i][1] + ')');
    }
    var re = new RegExp(alt.join('|'), 'g');
    var out = '';
    var last = 0;
    var m;
    while ((m = re.exec(text)) !== null) {
      out += escapeHtml(text.slice(last, m.index));
      var kind = null;
      for (var j = 0; j < rules.length; j++) {
        // Named capture groups: exactly one alternative matched.
        if (m.groups && m.groups[rules[j][0]] !== undefined) {
          kind = rules[j][0];
          break;
        }
      }
      out += kind
        ? '<span class="' + CLASS[kind] + '">' + escapeHtml(m[0]) + '</span>'
        : escapeHtml(m[0]);
      last = m.index + m[0].length;
      if (m[0].length === 0) {
        re.lastIndex = m.index + 1; // safety; rules always match >= 1 char
      }
    }
    out += escapeHtml(text.slice(last));
    return out;
  }

  function langOf(code) {
    var m = /(?:^|\s)language-([\w-]+)/.exec(code.className || '');
    if (m && EXOTIC.indexOf(m[1]) !== -1) return m[1];
    var d = code.getAttribute('data-scl-lang');
    if (d && EXOTIC.indexOf(d) !== -1) return d;
    return null; // Prism-owned language or no marker: leave the block alone.
  }

  function highlightPage() {
    if (!global.document || !global.document.querySelectorAll) return;
    var blocks = global.document.querySelectorAll('pre code');
    for (var i = 0; i < blocks.length; i++) {
      var code = blocks[i];
      if (code.getAttribute('data-scl-highlighted')) continue; // idempotent
      var lang = langOf(code);
      if (!lang) continue;
      if (code.querySelector('.token')) continue; // Prism already colored it
      code.innerHTML = tokenize(code.textContent || '', lang);
      code.setAttribute('data-scl-lang', lang);
      code.setAttribute('data-scl-highlighted', '1');
    }
  }

  if (global.document) {
    if (global.document.readyState === 'loading') {
      global.document.addEventListener('DOMContentLoaded', highlightPage);
    } else {
      highlightPage();
    }
  }

  // Node-compatible export for automated smoke tests (npm run test cycles).
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { tokenize: tokenize, RULES: RULES, CLASS: CLASS };
  }
})(typeof window !== 'undefined' ? window : (typeof globalThis !== 'undefined' ? globalThis : this));
