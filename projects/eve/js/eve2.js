const keywordMap = {
    // ... (keep the same keyword mappings as before)
};

const operatorMap = {
    // ... (keep the same operator mappings as before)
};

function tokenize(input) {
    const tokens = [];
    let current = 0;

    while (current < input.length) {
        let char = input[current];

        // Handle whitespace
        if (/\s/.test(char)) {
            let value = '';
            while (current < input.length && /\s/.test(input[current])) {
                value += input[current++];
            }
            tokens.push({ type: 'whitespace', value });
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
            while (char !== quote && current < input.length) {
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
        case 'whitespace':
            return token.value;
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