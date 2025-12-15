import { useEffect, useRef } from "react";
// Utility functions can be added here if needed

type NoteColor = 'yellow' | 'pink' | 'blue' | 'green' | 'purple' | 'orange' | 'teal' | 'lavender' | 'peach' | 'mint';

interface StickyNoteWindowProps {
  isOpen: boolean;
  onClose: (content: string, color: NoteColor) => void;
  initialColor?: NoteColor;
}

const colorMap: Record<NoteColor, string> = {
  yellow: "bg-[hsl(var(--note-yellow))]",
  pink: "bg-[hsl(var(--note-pink))]",
  blue: "bg-[hsl(var(--note-blue))]",
  green: "bg-[hsl(var(--note-green))]",
  purple: "bg-[hsl(var(--note-purple))]",
  orange: "bg-[hsl(var(--note-orange))]",
  teal: "bg-[hsl(var(--note-teal))]",
  lavender: "bg-[hsl(var(--note-lavender))]",
  peach: "bg-[hsl(var(--note-peach))]",
  mint: "bg-[hsl(var(--note-mint))]",
};

export function StickyNoteWindow({ isOpen, onClose, initialColor = 'yellow' }: StickyNoteWindowProps) {
  const windowRef = useRef<Window | null>(null);
  const selectedColor = initialColor;

  useEffect(() => {
    if (isOpen && !windowRef.current) {
      // Check if we're in Electron and adjust window features
      const isElectron = (window as any).electronAPI?.isElectron;
      const windowFeatures = isElectron 
        ? 'width=350,height=450,left=100,top=100,toolbar=no,menubar=no,scrollbars=no,resizable=no,status=no,nodeIntegration=no,contextIsolation=yes'
        : 'width=350,height=450,left=100,top=100,toolbar=no,menubar=no,scrollbars=no,resizable=no,status=no';

      // Open a new small window
      const newWindow = window.open(
        '',
        'quickNote',
        windowFeatures
      );

      if (newWindow) {
        windowRef.current = newWindow as unknown as Window;
        
        // Determine favicon path based on environment
        const faviconPath = isElectron ? "./favicons/stickee.png" : "/favicons/stickee.png";
        
        // Get the current theme and font preference
        const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        const savedFont = localStorage.getItem("stickee-font-family") || "handwriting";
        const fontFamily = savedFont === "serif" ? "Georgia, serif" : "'Indie Flower', cursive";
        
        // Check for next-themes preference
        const theme = localStorage.getItem("theme") || (isDark ? "dark" : "light");
        const isDarkTheme = theme === "dark" || (theme === "system" && isDark);
        
        // Pass theme info to popup window
        const themeData = {
          theme: theme,
          isDark: isDarkTheme,
          systemDark: isDark
        };
        
        // Write the sticky note HTML to the new window
        windowRef.current.document.write(`
          <!DOCTYPE html>
          <html class="${isDarkTheme ? 'dark' : ''}">
          <head>
            <title>Quick Note - Stickee</title>
            <link rel="icon" type="image/png" href="${faviconPath}">
            <style>
              :root {
                /* Note color variables - matching main app */
                --note-yellow: 48 96% 76%;
                --note-pink: 350 100% 88%;
                --note-blue: 199 92% 72%;
                --note-green: 142 76% 73%;
                --note-purple: 270 67% 78%;
                --note-orange: 24 100% 80%;
                --note-teal: 180 70% 75%;
                --note-lavender: 260 60% 82%;
                --note-peach: 20 100% 85%;
                --note-mint: 150 80% 80%;
                
                --background: 0 0% 97%;
                --foreground: 0 0% 15%;
                --border: 214.3 31.8% 91.4%;
                --input: 214.3 31.8% 91.4%;
                --ring: 350 100% 88%;
                --radius: 0.25rem;
              }
              
              .dark {
                --background: 0 0% 12%;
                --foreground: 0 0% 95%;
                --border: 217.2 32.6% 17.5%;
                --input: 217.2 32.6% 17.5%;
                --ring: 350 100% 88%;
              }
              
              * {
                box-sizing: border-box;
              }
              
              body {
                margin: 0;
                padding: 0;
                font-family: ${fontFamily};
                background-color: hsl(var(--background));
                color: hsl(var(--foreground));
                min-height: 100vh;
                display: flex;
                flex-direction: column;
                transition: background-color 0.2s ease, color 0.2s ease;
              }
              
              .app-container {
                display: flex;
                flex-direction: column;
                height: 100vh;
                padding: 1rem;
                gap: 1rem;
                background-color: hsl(var(--background));
                color: hsl(var(--foreground));
              }
              
              .color-picker {
                display: flex;
                gap: 0.5rem;
                padding: 0.5rem;
                background: hsl(var(--background) / 0.8);
                border-radius: var(--radius);
                border: 1px solid hsl(var(--border));
                backdrop-filter: blur(4px);
                flex-wrap: wrap;
                justify-content: center;
              }
              
              .color-option {
                width: 20px;
                height: 20px;
                border-radius: 50%;
                cursor: pointer;
                border: 2px solid hsl(var(--border));
                transition: all 0.2s ease;
                box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
              }
              
              .color-option:hover {
                transform: scale(1.15);
                box-shadow: 0 2px 4px rgba(0, 0, 0, 0.15);
              }
              
              .color-option.selected {
                border-color: hsl(var(--foreground));
                transform: scale(1.2);
                box-shadow: 0 0 0 2px hsl(var(--foreground));
              }
              
              .note-container {
                flex: 1;
                border-radius: var(--radius);
                padding: 1.25rem;
                border: 1px solid hsl(var(--border));
                display: flex;
                flex-direction: column;
                box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
                min-height: 300px;
                position: relative;
                overflow: hidden;
              }
              
              .note-textarea {
                flex: 1;
                width: 100%;
                border: none;
                background: transparent;
                resize: none;
                outline: none;
                font-size: 1.125rem;
                line-height: 1.5;
                color: hsl(var(--foreground));
                font-family: ${fontFamily};
                padding: 0.5rem 0;
              }
              
              .note-textarea::placeholder {
                color: hsl(var(--foreground) / 0.5);
              }
              
              .controls {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-top: 0.5rem;
                font-size: 0.75rem;
                color: hsl(var(--foreground) / 0.7);
              }
              
              .close-hint {
                font-size: 0.7rem;
                opacity: 0.7;
              }
              
              /* Color classes */
              .color-yellow { background-color: hsl(var(--note-yellow)); }
              .color-pink { background-color: hsl(var(--note-pink)); }
              .color-blue { background-color: hsl(var(--note-blue)); }
              .color-green { background-color: hsl(var(--note-green)); }
              .color-purple { background-color: hsl(var(--note-purple)); }
              .color-orange { background-color: hsl(var(--note-orange)); }
              .color-teal { background-color: hsl(var(--note-teal)); }
              .color-lavender { background-color: hsl(var(--note-lavender)); }
              .color-peach { background-color: hsl(var(--note-peach)); }
              .color-mint { background-color: hsl(var(--note-mint)); }
              ${savedFont === "handwriting" ? `
              @font-face {
                font-family: 'Indie Flower';
                font-style: normal;
                font-weight: 400;
                font-display: swap;
                src: url(https://fonts.gstatic.com/s/indieflower/v17/m8JVjfNVeKWVnh3QMuKkFcZVaUuH.woff2) format('woff2');
              }` : ''}
            </style>
          </head>
          <body>
            <div class="app-container">
              <div class="color-picker" id="colorPicker">
                ${Object.entries(colorMap).map(([color]) => 
                  `<div class="color-option color-${color} ${color === '${selectedColor}' ? 'selected' : ''}" data-color="${color}"></div>`
                ).join('')}
              </div>
              <div class="note-container" id="noteContainer">
                <textarea 
                  id="noteContent" 
                  class="note-textarea" 
                  placeholder="Type your note here..."
                  autofocus
                  spellcheck="false"
                ></textarea>
                <div class="controls">
                  <div class="close-hint">Press Esc or Ctrl+Enter to save</div>
                  <div id="charCount">0/1000</div>
                </div>
              </div>
            </div>
            <script>
              let content = '';
              let isClosing = false;
              let selectedColor = '${selectedColor}';
              const textarea = document.getElementById('noteContent');
              const charCount = document.getElementById('charCount');
              const colorOptions = document.querySelectorAll('.color-option');
              const noteContainer = document.getElementById('noteContainer');
              
              // Theme data from parent window
              const themeData = ${JSON.stringify(themeData)};
              
              // Apply initial theme
              function applyTheme(theme) {
                const isDarkTheme = theme === "dark" || (theme === "system" && themeData.systemDark);
                document.documentElement.className = isDarkTheme ? 'dark' : '';
              }
              
              // Apply theme on load
              applyTheme(themeData.theme);
              
              // Update character count
              const updateCharCount = () => {
                const currentLength = textarea.value.length;
                charCount.textContent = currentLength + '/240';
                
                // Limit to 240 characters
                if (currentLength > 240) {
                  textarea.value = textarea.value.substring(0, 240);
                  charCount.textContent = '240/240';
                }
              };
              
              // Handle input events
              const handleInput = (e) => {
                content = e.target.value;
                updateCharCount();
              };
              
              // Handle keydown events to prevent Enter at 10 lines
              const handleKeyDown = (e) => {
                const currentLines = textarea.value.split('\n');
                const maxLines = 10;
                
                // Prevent Enter key if already at 10 lines
                if (e.key === 'Enter' && currentLines.length >= maxLines) {
                  e.preventDefault();
                  return false;
                }
              };
              
              // Handle color selection
              colorOptions.forEach(option => {
                option.addEventListener('click', () => {
                  // Update selected color
                  selectedColor = option.dataset.color;
                  
                  // Update UI
                  colorOptions.forEach(opt => opt.classList.remove('selected'));
                  option.classList.add('selected');
                  
                  // Update container background
                  noteContainer.className = 'note-container';
                  noteContainer.classList.add('color-' + selectedColor);
                });
              });
              
              // Initialize container with selected color
              if (selectedColor) {
                noteContainer.classList.add('color-' + selectedColor);
              }
              
              // Update content on input
              textarea.addEventListener('input', handleInput);
              
              const saveAndClose = () => {
                if (!isClosing) {
                  isClosing = true;
                  window.opener.postMessage({ 
                    type: 'quickNote', 
                    content: content,
                    color: selectedColor
                  }, '*');
                  window.close();
                }
              };
              
              // Handle keyboard shortcuts
              document.addEventListener('keydown', (e) => {
                // Save on Ctrl+Enter or Cmd+Enter
                if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                  e.preventDefault();
                  saveAndClose();
                }
                // Close on Escape
                else if (e.key === 'Escape') {
                  e.preventDefault();
                  saveAndClose();
                }
              });
              
              // Save on window close - only save if user explicitly saves (Ctrl+Enter or Escape)
              // Don't auto-save when window is closed via native X button
              
              // Focus the textarea
              textarea.focus();
              updateCharCount();
            </script>
          </body>
          </html>
        `);
        windowRef.current.document.close();

        // Listen for messages from the popup window
        const handleMessage = (event: MessageEvent) => {
          if (event.data.type === 'quickNote') {
            onClose(event.data.content, event.data.color);
            windowRef.current = null;
          }
        };

        window.addEventListener('message', handleMessage);

        // Cleanup when component unmounts
        return () => {
          window.removeEventListener('message', handleMessage);
          if (windowRef.current && !windowRef.current.closed) {
            windowRef.current.close();
          }
          windowRef.current = null;
        };
      }
    }

    // Close window when component is unmounted or isOpen changes to false
    return () => {
      if (windowRef.current && !windowRef.current.closed) {
        windowRef.current.close();
      }
      windowRef.current = null;
    };
  }, [isOpen, onClose, selectedColor]);

  if (!isOpen) return null;

  return null; // This component doesn't render anything in the main window
}
