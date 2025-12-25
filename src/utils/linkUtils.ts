// Utility functions for link detection and handling

import { invoke } from '@tauri-apps/api/core';

export const URL_REGEX = /(https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|www\.[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9]+\.[^\s]{2,}|www\.[a-zA-Z0-9]+\.[^\s]{2,})/gi;

export const detectLinks = (text: string): string[] => {
  const matches = text.match(URL_REGEX);
  return matches || [];
};

export const isValidUrl = (url: string): boolean => {
  try {
    const urlWithProtocol = url.startsWith('http') ? url : `https://${url}`;
    new URL(urlWithProtocol);
    return true;
  } catch {
    return false;
  }
};

export const normalizeUrl = (url: string): string => {
  if (url.startsWith('http')) {
    return url;
  }
  return `https://${url}`;
};

export const openLinkInBrowser = async (url: string) => {
  const normalizedUrl = normalizeUrl(url);
  
  try {
    await invoke('open_url', { url: normalizedUrl });
  } catch (error) {
    const newWindow = window.open(normalizedUrl, '_blank', 'noopener,noreferrer');
    
    if (!newWindow) {
      window.location.href = normalizedUrl;
    }
  }
};
