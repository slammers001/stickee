// Simple encryption for note content
// This is basic obfuscation, not military-grade encryption
// For production, consider using a proper encryption library

const ENCRYPTION_KEY = 'stickee-encryption-key-2024'; // In production, use environment variables

export function encryptContent(content: string): string {
  if (!content) return content;
  
  try {
    // Simple XOR-based obfuscation with base64 encoding
    const encrypted = Array.from(content).map((char, index) => {
      const keyChar = ENCRYPTION_KEY[index % ENCRYPTION_KEY.length];
      return String.fromCharCode(char.charCodeAt(0) ^ keyChar.charCodeAt(0));
    }).join('');
    
    return btoa(encrypted); // Base64 encode
  } catch (error) {
    console.error('Encryption error:', error);
    return content; // Fallback to original content
  }
}

export function decryptContent(encryptedContent: string): string {
  if (!encryptedContent) return encryptedContent;
  
  try {
    // Base64 decode
    const decoded = atob(encryptedContent);
    
    // Reverse XOR operation
    return Array.from(decoded).map((char, index) => {
      const keyChar = ENCRYPTION_KEY[index % ENCRYPTION_KEY.length];
      return String.fromCharCode(char.charCodeAt(0) ^ keyChar.charCodeAt(0));
    }).join('');
  } catch (error) {
    console.error('Decryption error:', error);
    return encryptedContent; // Fallback to original content
  }
}

// For titles (same encryption)
export function encryptTitle(title?: string): string | undefined {
  if (!title) return title;
  return encryptContent(title);
}

export function decryptTitle(encryptedTitle?: string): string | undefined {
  if (!encryptedTitle) return encryptedTitle;
  return decryptContent(encryptedTitle);
}
