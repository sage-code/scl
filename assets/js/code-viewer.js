document.addEventListener('DOMContentLoaded', async () => {
    const params = new URLSearchParams(window.location.search);
    const file = params.get('file'); 
    
    if (!file) {
        document.getElementById('code-display').textContent = "Error: No file specified.";
        return;
    }

    const display = document.getElementById('code-display');
    const ext = file.split('.').pop().toLowerCase();
    
    // Map extension to Prism language
    const langMap = {
        'py': 'python',
        'js': 'javascript',
        'sh': 'bash',
        'css': 'css',
        'html': 'html',
        'json': 'json',
        'dart': 'dart'
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
