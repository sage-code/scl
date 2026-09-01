const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

// Get folder from CLI argument or default to 'public'
const targetDir = process.argv[2] || 'public';
const absoluteDir = path.resolve(targetDir);

if (!fs.existsSync(absoluteDir)) {
    console.error(`Folder not found: ${absoluteDir}`);
    process.exit(1);
}

// Recursively find HTML files
function getHtmlFiles(dir, fileList = []) {
    const files = fs.readdirSync(dir);
    files.forEach(file => {
        const filePath = path.join(dir, file);
        if (fs.statSync(filePath).isDirectory()) {
            getHtmlFiles(filePath, fileList);
        } else if (file.endsWith('.html')) {
            fileList.push(filePath);
        }
    });
    return fileList;
}

(async () => {
    const browser = await puppeteer.launch();
    const htmlFiles = getHtmlFiles(absoluteDir);
    let totalIssues = 0;

    console.log(`Auditing ${htmlFiles.length} files in ${absoluteDir}...`);

    for (const filePath of htmlFiles) {
        const page = await browser.newPage();
        
        // Listen for console errors
        page.on('console', msg => {
            if (msg.type() === 'error') console.log(`[Browser Console Error] ${msg.text()}`);
        });

        // Listen for request failures
        page.on('requestfailed', request => {
            console.log(`[Resource Load Failed] ${request.url()} - ${request.failure().errorText}`);
        });

        try {
            await page.goto(`file://${filePath}`, { waitUntil: 'networkidle0' });
            
            // Check for potential CSS issues
            const issues = await page.evaluate(() => {
                const domClasses = [...new Set([...document.querySelectorAll('*')].flatMap(el => [...el.classList]))];
                const cssText = [...document.styleSheets].map(sheet => {
                    try { return [...sheet.cssRules].map(rule => rule.selectorText || '').join(' '); } 
                    catch (e) { return ''; }
                }).join(' ');

                return domClasses.filter(cls => !cssText.includes('.' + cls));
            });

            if (issues.length > 0) {
                console.log(`\nIssues in ${path.relative(process.cwd(), filePath)}:`);
                console.log(`Classes without matching CSS: ${issues.join(', ')}`);
                totalIssues += issues.length;
            }
        } catch (e) {
            console.error(`Error auditing ${filePath}: ${e.message}`);
        } finally {
            await page.close();
        }
    }

    await browser.close();
    console.log(`\nAudit complete. Total CSS-related issues found: ${totalIssues}`);
    process.exit(totalIssues > 0 ? 1 : 0);
})();