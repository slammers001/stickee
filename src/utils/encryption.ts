// Simple encryption for note content
// This is basic obfuscation, not military-grade encryption
// For production, consider using a proper encryption library

export function encryptContent(content: string): string {
  if (!content) return content;
  
  try {
    // Use TextEncoder for proper Unicode handling
    const encoder = new TextEncoder();
    const data = encoder.encode(content);
    
    // Convert to base64
    const base64 = btoa(String.fromCharCode(...data));
    return base64;
  } catch (error) {
    console.error('Encryption error:', error);
    return content; // Fallback to original content
  }
}

export function decryptContent(encryptedContent: string): string {
  if (!encryptedContent) return encryptedContent;
  
  try {
    // Try old XOR-based decryption first (for backward compatibility)
    const ENCRYPTION_KEY = 'stickee-encryption-key-2024';
    const decoded = atob(encryptedContent);
    
    // Reverse XOR operation
    const xorDecrypted = Array.from(decoded).map((char, index) => {
      const keyChar = ENCRYPTION_KEY[index % ENCRYPTION_KEY.length];
      return String.fromCharCode(char.charCodeAt(0) ^ keyChar.charCodeAt(0));
    }).join('');
    
    // Check if XOR decryption produced readable text
    // If it looks like normal text, return it
    if (xorDecrypted.length > 0 && !xorDecrypted.includes('\u0000') && !xorDecrypted.includes('\uFFFD')) {
      return xorDecrypted;
    }
    
    // If XOR didn't work, try new TextEncoder/TextDecoder method
    try {
      const bytes = new Uint8Array(decoded.length);
      
      for (let i = 0; i < decoded.length; i++) {
        bytes[i] = decoded.charCodeAt(i);
      }
      
      const decoder = new TextDecoder();
      const textDecoded = decoder.decode(bytes);
      
      // Validate that this is readable text
      if (textDecoded.length > 0 && !textDecoded.includes('\u0000') && !textDecoded.includes('\uFFFD')) {
        return textDecoded;
      }
    } catch (e) {
      // If new method fails, return the XOR result
    }
    
    // If neither method worked perfectly, return the XOR result as fallback
    return xorDecrypted;
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
  
  try {
    // Try old XOR-based decryption first (for backward compatibility)
    const ENCRYPTION_KEY = 'stickee-encryption-key-2024';
    const decoded = atob(encryptedTitle);
    
    // Reverse XOR operation
    const xorDecrypted = Array.from(decoded).map((char, index) => {
      const keyChar = ENCRYPTION_KEY[index % ENCRYPTION_KEY.length];
      return String.fromCharCode(char.charCodeAt(0) ^ keyChar.charCodeAt(0));
    }).join('');
    
    // Check if XOR decryption produced readable text (more lenient check for titles)
    if (xorDecrypted.length > 0 && xorDecrypted.length <= 50 && !xorDecrypted.includes('\u0000')) {
      return xorDecrypted;
    }
    
    // If XOR didn't work, try new TextEncoder/TextDecoder method
    try {
      const bytes = new Uint8Array(decoded.length);
      
      for (let i = 0; i < decoded.length; i++) {
        bytes[i] = decoded.charCodeAt(i);
      }
      
      const decoder = new TextDecoder();
      const textDecoded = decoder.decode(bytes);
      
      // Validate that this is readable text (more lenient for titles)
      if (textDecoded.length > 0 && textDecoded.length <= 50 && !textDecoded.includes('\u0000')) {
        return textDecoded;
      }
    } catch (e) {
      // If new method fails, return the XOR result
    }
    
    // If neither method worked perfectly, return the XOR result as fallback
    return xorDecrypted;
  } catch (error) {
    console.error('Title decryption error:', error);
    return encryptedTitle;
  }
}
