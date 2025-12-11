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
    // Decode from base64
    const binaryString = atob(encryptedContent);
    const bytes = new Uint8Array(binaryString.length);
    
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    
    // Use TextDecoder for proper Unicode handling
    const decoder = new TextDecoder();
    return decoder.decode(bytes);
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
