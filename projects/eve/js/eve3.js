// Create a map of all keywords and their corresponding style functions
const keywordMap = {
    // Global declarations
    'import': 'keyword', 'alias': 'keyword', 'class': 'keyword', 'global': 'keyword',
    'constant': 'keyword', 'return': 'keyword', 'create': 'keyword', 'release': 'keyword',
    'method': 'keyword', 'function': 'keyword',

    // Optional keywords
    'routine': 'keyword', 'driver': 'keyword', 'module': 'keyword', 'aspect': 'keyword',
    'recover': 'keyword', 'finalize': 'keyword', 'process': 'keyword', 'initialize': 'keyword',

    // Mandatory 2 space indentation
    'shell': 'keytab',

    // Keywords in statement
    'session': 'keytab', 'update': 'keytab', 'append': 'keytab', 'commit': 'keytab',
    'from': 'keytab', 'use': 'keytab',

    // Keyword operators
    'in': 'keytab', 'is': 'keytab', 'as': 'keytab', 'or': 'keytab', 'eq': 'keytab',
    'and': 'keytab', 'not': 'keytab',

    // Mandatory two space indentation
    'new': 'keytab', 'let': 'keytab', 'set': 'keytab',

    // Database singular statements
    'scrub': 'keytab', 'delete': 'keytab',

    // Control flow
    'begin': 'control', 'cycle': 'control', 'repeat': 'control', 'when': 'control',
    'job': 'control', 'case': 'control', 'on': 'control', 'loop': 'control',
    'while': 'control', 'for': 'control', 'task': 'control', 'try': 'control',
    'miss': 'control', 'match': 'control', 'if': 'control', 'then': 'control',
    'catch': 'control', 'else': 'control', 'done': 'control',

    // Data types
    'Byte': 'types', 'Short': 'types', 'Integer': 'types', 'Natural': 'types',
    'Real': 'types', 'Float': 'types', 'Rational': 'types', 'String': 'types',
    'Logic': 'types', 'Table': 'types', 'Symbol': 'types', 'Record': 'types',
    'Ordinal': 'types', 'Variant': 'types', 'Date': 'types', 'Time': 'types',
    'Array': 'types', 'List': 'types', 'Object': 'types', 'Class': 'types',
    'Lambda': 'types', 'Function': 'types', 'DataSet': 'types', 'HashMap': 'types',
    'Folder': 'types', 'File': 'types',

    // Reserved types
    'Null': 'types', 'True': 'types', 'False': 'types', 'Type': 'types',

    // Reserved constants
    'any': 'constant', 'other': 'constant', 'all': 'constant', 'one': 'constant',
    'label': 'constant', 'self': 'constant', 'args': 'constant', 'super': 'constant',

    // Interruption statements
    'expect': 'keytab', 'break': 'keytab', 'halt': 'keytab', 'next': 'keytab',
    'alter': 'keytab', 'make': 'keytab', 'store': 'keytab', 'apply': 'keytab',
    'start': 'keytab', 'yield': 'keytab', 'run': 'keytab', 'call': 'keytab',
    'wait': 'keytab', 'exit': 'keytab', 'stop': 'keytab', 'print': 'keytab',
    'write': 'keytab', 'read': 'keytab', 'over': 'keytab', 'panic': 'keytab',
    'pass': 'keytab', 'skip': 'keytab', 'fail': 'keytab', 'raise': 'keytab',
    'retry': 'keytab', 'suspend': 'keytab', 'resume': 'keytab', 'synchronise': 'keytab',
    'rollback': 'keytab'
};

const operatorMap = {
    '::': 'operator', ':=': 'operator', '==': 'operator', '!=': 'operator',
    '=>': 'operator', ':>': 'operator', '<:': 'operator', '<-': 'operator',
    '->': 'operator', '...': 'operator', '..': 'operator', '*=': 'operator',
    '/=': 'operator', '-=': 'operator', '+=': 'operator', '^=': 'operator',
    '%=': 'operator', '<=': 'operator', '>=': 'operator', '<<': 'operator',
    '>>': 'operator', '<+': 'operator', '+>': 'operator', '=': 'operator',
    '>': 'operator', '<': 'operator', '+': 'operator', '-': 'operator',
    '/': 'operator', '*': 'operator', '&': 'operator', '|': 'operator',
    '#': 'operator', '?': 'operator', ':': 'operator', ';': 'operator'
};

function tokenize(input) {
    const tokens = [];
    let current = 0;

    while (current < input.length) {
        let char = input[current];

        // Handle whitespace
        if (/\s/.test(char)) {
            current++;
            continue;
        }

        // Handle keywords and identifiers
        if (/[a-zA-Z]/.test(char)) {
            let value = '';
            while (current < input.length && /[a-zA-Z0-9_]/.test(input[current])) {
                value += input[current++];
            }
            const type = keywordMap[value] || 'identifier';
            tokens.push({ type, value });
            continue;
        }

        // Handle operators
        let opValue = char;
        if (current + 1 < input.length) {
            opValue += input[current + 1];
            if (operatorMap[opValue]) {
                tokens.push({ type: 'operator', value: opValue });
                current += 2;
                continue;
            }
        }
        if (operatorMap[char]) {
            tokens.push({ type: 'operator', value: char });
            current++;
            continue;
        }

        // Handle strings
        if (char === '"' || char === "'") {
            let value = char;
            const quote = char;
            char = input[++current];
            while (char !== quote) {
                if (char === '\\') {
                    value += char + input[++current];
                } else {
                    value += char;
                }
                char = input[++current];
            }
            value += quote;
            tokens.push({ type: 'string', value });
            current++;
            continue;
        }

        // Handle comments
        if (char === '-' && input[current + 1] === '-') {
            let value = '--';
            current += 2;
            while (current < input.length && input[current] !== '\n') {
                value += input[current++];
            }
            tokens.push({ type: 'comment', value });
            continue;
        }

        // Handle unrecognized characters
        tokens.push({ type: 'unknown', value: char });
        current++;
    }

    return tokens;
}

function applyStyle(token) {
    switch (token.type) {
        case 'keyword':
        case 'keytab':
        case 'control':
        case 'types':
        case 'constant':
            return `<span class="${token.type}">${token.value}</span>`;
        case 'operator':
            return `<span class="operator">${token.value}</span>`;
        case 'string':
            return `<span class="string">${token.value}</span>`;
        case 'comment':
            return `<span class="comment">${token.value}</span>`;
        default:
            return token.value;
    }
}

function formatCode(input) {
    const tokens = tokenize(input);
    return tokens.map(applyStyle).join('');
}

function eveRender() {
    const eveCodeElements = document.getElementsByClassName("language-eve");
    for (const element of eveCodeElements) {
        if (element.tagName === "CODE") {
            const lines = element.innerText.split("\n");
            const formattedLines = lines.map(line => {
                if (line.trim().startsWith("#")) {
                    return `<span class="title">${line}</span>`;
                } else if (line.trim().startsWith("**")) {
                    return `<span class="subtitle">${line}</span>`;
                } else {
                    return `<span class="line">${formatCode(line)}</span>`;
                }
            });
            element.innerHTML = formattedLines.join("\n");
        }
    }
}

// Call this function when the page loads
window.addEventListener('load', eveRender);