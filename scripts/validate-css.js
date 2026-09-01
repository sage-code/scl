const fs = require('fs');
const path = require('path');

const CSS_DIR = path.join(__dirname, '../assets/css');
const PUBLIC_DIR = path.join(__dirname, '../public');

// Patterns for classes to ignore (Bootstrap, Icons, Prism, etc.)
const IGNORED_PATTERNS = [
    /^bi-/,             // Bootstrap Icons
    /^language-/,       // Prism JS
    /^lang-/,           // Prism JS
    /^hljs-/,           // Highlight.js
    /^ng-/,             // Angular
    /^col-/,            // Bootstrap Grid
    /^row-cols-/,       // Bootstrap Grid
    /^g-/,              // Bootstrap Gaps
    /^p[xytb]?-/,       // Bootstrap Padding
    /^m[xytb]?-/,       // Bootstrap Margins
    /^text-/,           // Bootstrap Text Utilities
    /^bg-/,             // Bootstrap Background
    /^btn-/,            // Bootstrap Buttons
    /^shadow/,          // Bootstrap Shadows
    /^rounded/,         // Bootstrap Borders
    /^align-/,          // Bootstrap Alignment
    /^justify-/,        // Bootstrap Justify
    /^d-/,              // Bootstrap Display
    /^w-/,              // Bootstrap Width
    /^h-/,              // Bootstrap Heights/Headings
    /^fs-/,             // Bootstrap Font Size
    /^border/,          // Bootstrap Borders
    /^list-/,           // Bootstrap Lists
    /^table-/,          // Bootstrap Tables
    /^order-/,          // Bootstrap Order
    /^alert-/,          // Bootstrap Alerts
    /^me-/,             // Bootstrap Margin End
    /^ms-/,             // Bootstrap Margin Start
    /^gap-/,            // Bootstrap Gap
    /^flex-/,           // Bootstrap Flex
    /^tracking-/,       // Tailwind/Custom Text
    /^lg:text-/,        // Tailwind/Custom Media
    /^md:text-/,        // Tailwind/Custom Media
    /^sm:text-/,        // Tailwind/Custom Media
    /^(active|disabled|show|collapsed|fixed-top|sticky-top|nav-item|nav-link|navbar|container|row|col|well|panel|panel-body|img-fluid|form-label|form-select|form-select-sm|card|card-img-top|card-text|ratio|ratio-16x9|display-6|uppercase|button|input)$/
];

function isIgnored(cls) {
    return IGNORED_PATTERNS.some(pattern => pattern.test(cls));
}

// 1. Extract all CSS classes from all .css files in assets/css
function getDefinedClasses() {
    const definedClasses = new Set();
    const cssFiles = fs.readdirSync(CSS_DIR).filter(file => file.endsWith('.css') && file !== 'sage.old.css');

    cssFiles.forEach(file => {
        const content = fs.readFileSync(path.join(CSS_DIR, file), 'utf8');
        const regex = /\.([a-zA-Z0-9_-]+)/g;
        let match;
        while ((match = regex.exec(content)) !== null) {
            definedClasses.add(match[1]);
        }
    });
    return definedClasses;
}

// 2. Extract all class names used in HTML files in public/
function getUsedClasses(dir, fileList = []) {
    const files = fs.readdirSync(dir);
    files.forEach(file => {
        const filePath = path.join(dir, file);
        if (fs.statSync(filePath).isDirectory()) {
            getUsedClasses(filePath, fileList);
        } else if (file.endsWith('.html')) {
            const content = fs.readFileSync(filePath, 'utf8');
            const classAttrRegex = /class="([^"]+)"/g;
            let match;
            while ((match = classAttrRegex.exec(content)) !== null) {
                const classes = match[1].split(/\s+/);
                classes.forEach(cls => {
                    if (cls && !isIgnored(cls)) fileList.push({ cls, file: filePath });
                });
            }
        }
    });
    return fileList;
}

// 3. Validation
function validate() {
    console.log('Validating custom CSS classes (ignoring Bootstrap/utility patterns)...');
    const definedClasses = getDefinedClasses();
    const usedClasses = getUsedClasses(PUBLIC_DIR);
    const missing = [];

    usedClasses.forEach(({ cls, file }) => {
        if (!definedClasses.has(cls)) {
            missing.push({ cls, file });
        }
    });

    if (missing.length > 0) {
        console.error(`\nFound ${missing.length} potentially missing custom CSS classes:`);
        const uniqueMissing = [...new Set(missing.map(m => m.cls))].sort();
        uniqueMissing.forEach(cls => {
            const usage = missing.find(m => m.cls === cls);
            console.error(`- Class "${cls}" (e.g., in ${path.relative(process.cwd(), usage.file)})`);
        });
        process.exit(1);
    } else {
        console.log('All custom classes are valid!');
    }
}

validate();


