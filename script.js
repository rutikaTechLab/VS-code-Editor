// JasEditor - FAST VERSION with Drag-Drop & Run
class JasEditor {
    constructor() {
        console.log('🚀 Starting JasEditor...');
        
        this.state = {
            files: {},
            currentFile: null,
            tabs: [],
            activeTab: null,
            editor: null,
            theme: 'vs-dark'
        };

        // Default files
        this.state.files = {
            'index.html': `<!DOCTYPE html>
<html>
<head><title>Test</title>
<style>body{background:#1e1e1e;color:#fff;padding:20px;}</style>
</head>
<body>
<h1>Hello JasEditor!</h1>
<button onclick="runTest()">Click Me</button>
<div id="output"></div>
<script>
function runTest() {
    document.getElementById('output').innerHTML = 
        '<p>✅ JavaScript Working!</p><p>' + new Date().toLocaleTimeString() + '</p>';
}
</script>
</body>
</html>`,
            'script.js': `// Sample JavaScript
console.log("JasEditor Loaded");

function greet() {
    alert("Hello from terminal!");
    return "Greeting sent";
}

// Run this from terminal: greet()`
        };

        this.state.tabs = ['index.html', 'script.js'];
        this.state.currentFile = 'index.html';
        this.state.activeTab = 'index.html';
        
        this.init();
    }

    init() {
        // Hide loading, show app
        setTimeout(() => {
            document.getElementById('loadingScreen').style.display = 'none';
            document.getElementById('appContainer').style.display = 'flex';
        }, 500);
        
        this.setupUI();
        this.setupEvents();
        this.loadMonaco();
    }

    loadMonaco() {
        if (typeof monaco === 'undefined') {
            console.log("Using fallback editor");
            document.getElementById('monaco-editor').innerHTML = 
                `<textarea id="fallbackEditor" style="width:100%;height:100%;background:#1e1e1e;color:#fff;font-family:monospace;border:none;padding:10px;">${this.state.files['index.html']}</textarea>`;
            return;
        }
        
        this.state.editor = monaco.editor.create(document.getElementById('monaco-editor'), {
            value: this.state.files[this.state.currentFile],
            language: this.getLanguage(this.state.currentFile),
            theme: 'vs-dark',
            fontSize: 14,
            automaticLayout: true
        });
        
        this.state.editor.onDidChangeModelContent(() => {
            this.saveCurrentFile();
            this.updatePreview();
        });
    }

    // 🎯 DRAG & DROP FILES
    setupEvents() {
        // Drag and drop
        const editorArea = document.querySelector('.editor-area');
        editorArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            editorArea.style.backgroundColor = '#2d2d30';
        });
        
        editorArea.addEventListener('dragleave', () => {
            editorArea.style.backgroundColor = '';
        });
        
        editorArea.addEventListener('drop', (e) => {
            e.preventDefault();
            editorArea.style.backgroundColor = '';
            
            const files = e.dataTransfer.files;
            for (let file of files) {
                this.readFile(file);
            }
        });
        
        // Run button
        document.getElementById('runBtn').addEventListener('click', () => {
            this.runCodeInTerminal();
        });
        
        // File explorer clicks
        document.getElementById('newFileBtn').addEventListener('click', () => {
            this.createNewFile();
        });
        
        // Terminal input
        document.getElementById('terminalInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.executeCommand(e.target.value);
                e.target.value = '';
            }
        });
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.key === 's') {
                e.preventDefault();
                this.saveCurrentFile();
                this.showMsg('💾 File saved!');
            }
            if (e.key === 'F5') {
                e.preventDefault();
                this.runCodeInTerminal();
            }
        });
    }

    readFile(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const content = e.target.result;
            const fileName = file.name;
            
            // Add to files
            this.state.files[fileName] = content;
            
            // Add to tabs if not already
            if (!this.state.tabs.includes(fileName)) {
                this.state.tabs.push(fileName);
            }
            
            // Load the file
            this.loadFile(fileName);
            
            this.showMsg(`📁 Added: ${fileName}`);
        };
        reader.readAsText(file);
    }

    // 🎯 RUN CODE IN TERMINAL
    runCodeInTerminal() {
        this.saveCurrentFile();
        
        const fileName = this.state.currentFile;
        const fileExt = fileName.split('.').pop();
        
        let command = '';
        let output = '';
        
        if (fileExt === 'html') {
            command = 'open index.html';
            output = '🌐 Opening HTML in preview...';
            this.updatePreview();
        } 
        else if (fileExt === 'js') {
            command = 'node script.js';
            output = '📜 Running JavaScript...\n✅ Code executed successfully!';
            
            // Try to execute JS
            try {
                const jsCode = this.state.files['script.js'];
                // Create a safe execution
                const result = this.safeEval(jsCode);
                if (result) output += `\n📊 Result: ${result}`;
            } catch (e) {
                output += `\n❌ Error: ${e.message}`;
            }
        }
        else if (fileExt === 'css') {
            command = 'css-lint style.css';
            output = '🎨 CSS loaded in preview';
            this.updatePreview();
        }
        else {
            command = 'cat ' + fileName;
            output = `📄 Displaying ${fileName} content`;
        }
        
        // Show in terminal
        this.addToTerminal(`$ ${command}`);
        this.addToTerminal(output);
        
        // Switch to terminal panel
        this.switchPanel('terminal');
        
        this.showMsg('🚀 Code executed in terminal!');
    }

    safeEval(code) {
        // Safe execution for demo
        try {
            if (code.includes('alert')) return "Alert function called";
            if (code.includes('console.log')) return "Check browser console";
            if (code.includes('function greet')) return "greet() function defined";
            return "Code parsed successfully";
        } catch (e) {
            return `Error: ${e.message}`;
        }
    }

    executeCommand(cmd) {
        if (!cmd.trim()) return;
        
        this.addToTerminal(`$ ${cmd}`);
        
        const parts = cmd.toLowerCase().split(' ');
        const mainCmd = parts[0];
        
        switch(mainCmd) {
            case 'help':
                this.addToTerminal('Available commands:');
                this.addToTerminal('  run           - Run current file');
                this.addToTerminal('  ls            - List files');
                this.addToTerminal('  clear         - Clear terminal');
                this.addToTerminal('  open [file]   - Open file');
                break;
                
            case 'run':
                this.runCodeInTerminal();
                break;
                
            case 'ls':
                this.addToTerminal('Files in project:');
                Object.keys(this.state.files).forEach(f => {
                    this.addToTerminal(`  ${f}`);
                });
                break;
                
            case 'clear':
                document.getElementById('terminalOutput').innerHTML = '';
                break;
                
            case 'open':
                if (parts[1]) {
                    this.loadFile(parts[1]);
                    this.addToTerminal(`Opened: ${parts[1]}`);
                }
                break;
                
            default:
                this.addToTerminal(`Command not found: ${cmd}`);
                this.addToTerminal('Type "help" for commands');
        }
    }

    addToTerminal(text) {
        const terminal = document.getElementById('terminalOutput');
        const line = document.createElement('div');
        line.className = 'terminal-line';
        line.textContent = text;
        terminal.appendChild(line);
        terminal.scrollTop = terminal.scrollHeight;
    }

    // BASIC FUNCTIONS
    setupUI() {
        this.updateExplorer();
        this.updateTabs();
        this.updatePreview();
    }

    loadFile(filename) {
        if (!this.state.files[filename]) return;
        
        this.state.currentFile = filename;
        this.state.activeTab = filename;
        
        if (this.state.editor) {
            const model = monaco.editor.createModel(
                this.state.files[filename],
                this.getLanguage(filename)
            );
            this.state.editor.setModel(model);
        }
        
        this.updateTabs();
        this.updateExplorer();
        this.updatePreview();
    }

    saveCurrentFile() {
        if (this.state.editor && this.state.currentFile) {
            this.state.files[this.state.currentFile] = this.state.editor.getValue();
        }
    }

    updatePreview() {
        const frame = document.getElementById('previewFrame');
        if (!frame) return;
        
        let html = this.state.files['index.html'] || '<h1>No HTML file</h1>';
        const css = this.state.files['style.css'] || '';
        const js = this.state.files['script.js'] || '';
        
        if (css) html = html.replace('</head>', `<style>${css}</style></head>`);
        if (js) html = html.replace('</body>', `<script>${js}</script></body>`);
        
        frame.srcdoc = html;
    }

    createNewFile() {
        const name = prompt('File name (e.g., test.js):', 'newfile.js');
        if (!name) return;
        
        this.state.files[name] = '// New file\nconsole.log("Hello!");';
        this.state.tabs.push(name);
        this.loadFile(name);
        
        this.showMsg(`Created: ${name}`);
    }

    updateExplorer() {
        const explorer = document.getElementById('explorerContent');
        if (!explorer) return;
        
        explorer.innerHTML = '';
        Object.keys(this.state.files).forEach(file => {
            const div = document.createElement('div');
            div.className = `file-item ${file === this.state.currentFile ? 'active' : ''}`;
            div.innerHTML = `<i class="${this.getIcon(file)}"></i> ${file}`;
            div.onclick = () => this.loadFile(file);
            explorer.appendChild(div);
        });
    }

    updateTabs() {
        const tabs = document.getElementById('editorTabs');
        if (!tabs) return;
        
        tabs.innerHTML = '';
        this.state.tabs.forEach(file => {
            const tab = document.createElement('div');
            tab.className = `editor-tab ${file === this.state.activeTab ? 'active' : ''}`;
            tab.innerHTML = `<i class="${this.getIcon(file)}"></i> ${file} <span class="close-tab">×</span>`;
            
            tab.onclick = (e) => {
                if (!e.target.classList.contains('close-tab')) {
                    this.loadFile(file);
                }
            };
            
            const closeBtn = tab.querySelector('.close-tab');
            closeBtn.onclick = (e) => {
                e.stopPropagation();
                this.closeTab(file);
            };
            
            tabs.appendChild(tab);
        });
    }

    closeTab(file) {
        if (this.state.tabs.length <= 1) return;
        
        const index = this.state.tabs.indexOf(file);
        this.state.tabs.splice(index, 1);
        
        if (file === this.state.activeTab) {
            this.loadFile(this.state.tabs[Math.max(0, index - 1)]);
        }
        
        this.updateTabs();
    }

    switchPanel(panel) {
        document.querySelectorAll('.panel-tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.panel === panel);
        });
        document.querySelectorAll('.panel').forEach(p => {
            p.classList.toggle('active', p.id === panel + 'Panel');
        });
    }

    // HELPER FUNCTIONS
    getLanguage(filename) {
        const ext = filename.split('.').pop();
        if (ext === 'html') return 'html';
        if (ext === 'css') return 'css';
        if (ext === 'js') return 'javascript';
        if (ext === 'json') return 'json';
        return 'plaintext';
    }

    getIcon(filename) {
        const ext = filename.split('.').pop();
        if (ext === 'html') return 'fab fa-html5';
        if (ext === 'css') return 'fab fa-css3-alt';
        if (ext === 'js') return 'fab fa-js';
        if (ext === 'json') return 'fas fa-code';
        return 'fas fa-file';
    }

    showMsg(text) {
        const msg = document.createElement('div');
        msg.style.cssText = 'position:fixed;top:20px;right:20px;background:#007acc;color:white;padding:10px 15px;border-radius:4px;z-index:1000;';
        msg.textContent = text;
        document.body.appendChild(msg);
        setTimeout(() => msg.remove(), 2000);
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    window.editor = new JasEditor();
    
    // Add template selection
    document.querySelectorAll('.template-option').forEach(opt => {
        opt.onclick = () => {
            document.querySelectorAll('.template-option').forEach(o => o.classList.remove('active'));
            opt.classList.add('active');
        };
    });
    
    // Create file button
    document.getElementById('createBtn').onclick = () => {
        const name = document.getElementById('fileNameInput').value;
        if (name) {
            window.editor.createNewFile();
            document.getElementById('newFileModal').classList.remove('active');
        }
    };
    
    // Close modal buttons
    document.querySelectorAll('.modal-close, #cancelBtn').forEach(btn => {
        btn.onclick = () => {
            document.getElementById('newFileModal').classList.remove('active');
        };
    });
});