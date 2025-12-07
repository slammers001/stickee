import { useEffect, useRef } from "react";

interface StickyNoteWindowProps {
  isOpen: boolean;
  onClose: (content: string) => void;
}

export function StickyNoteWindow({ isOpen, onClose }: StickyNoteWindowProps) {
  const windowRef = useRef<Window | null>(null);

  useEffect(() => {
    if (isOpen && !windowRef.current) {
      // Check if we're in Electron and adjust window features
      const isElectron = (window as any).electronAPI?.isElectron;
      const windowFeatures = isElectron 
        ? 'width=300,height=400,left=100,top=100,toolbar=no,menubar=no,scrollbars=no,resizable=no,status=no,nodeIntegration=no,contextIsolation=yes'
        : 'width=300,height=400,left=100,top=100,toolbar=no,menubar=no,scrollbars=no,resizable=no,status=no';

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
        
        // Write the sticky note HTML to the new window
        windowRef.current.document.write(`
          <!DOCTYPE html>
          <html>
          <head>
            <title>Quick Note - Stickee</title>
            <link rel="icon" type="image/png" href="${faviconPath}">
            <style>
              body {
                margin: 0;
                padding: 20px;
                font-family: 'Indie Flower', cursive, Georgia, serif;
                background: #fef3c7;
                min-height: 100vh;
                box-sizing: border-box;
              }
              .note-container {
                background: #fef3c7;
                border: 1px solid #fbbf24;
                border-radius: 8px;
                padding: 20px;
                min-height: 300px;
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                position: relative;
              }
              .note-textarea {
                width: 100%;
                height: 250px;
                border: none;
                background: transparent;
                resize: none;
                outline: none;
                font-family: 'Indie Flower', cursive, Georgia, serif;
                font-size: 18px;
                line-height: 1.5;
                color: #1f2937;
              }
              .note-textarea::placeholder {
                color: #9ca3af;
              }
              .close-hint {
                position: absolute;
                bottom: 10px;
                right: 15px;
                font-size: 11px;
                color: #9ca3af;
                font-family: system-ui, -apple-system, sans-serif;
              }
              /* Dark mode support */
              @media (prefers-color-scheme: dark) {
                body {
                  background: #854d0e;
                }
                .note-container {
                  background: #854d0e;
                  border-color: #fbbf24;
                }
                .note-textarea {
                  color: #fef3c7;
                }
                .note-textarea::placeholder {
                  color: #fbbf24;
                }
              }
              @import url('https://fonts.googleapis.com/css2?family=Indie+Flower&display=swap');
            </style>
          </head>
          <body>
            <div class="note-container">
              <textarea 
                id="noteContent" 
                class="note-textarea" 
                placeholder="Type your note here..."
                autofocus
              ></textarea>
              <div class="close-hint">Press Esc or Ctrl+Enter to save</div>
            </div>
            <script>
              let content = '';
              let isClosing = false;
              const textarea = document.getElementById('noteContent');
              
              textarea.addEventListener('input', (e) => {
                content = e.target.value;
              });
              
              const saveAndClose = () => {
                if (!isClosing) {
                  isClosing = true;
                  window.opener.postMessage({ type: 'quickNote', content: content }, '*');
                  window.close();
                }
              };
              
              document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' || (e.key === 'Enter' && (e.ctrlKey || e.metaKey))) {
                  e.preventDefault();
                  saveAndClose();
                }
              });
              
              window.addEventListener('beforeunload', () => {
                if (!isClosing) {
                  saveAndClose();
                }
              });
              
              textarea.focus();
            </script>
          </body>
          </html>
        `);
        windowRef.current.document.close();

        // Listen for messages from the popup window
        const handleMessage = (event: MessageEvent) => {
          if (event.data.type === 'quickNote') {
            onClose(event.data.content);
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
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return null; // This component doesn't render anything in the main window
}
