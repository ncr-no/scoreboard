import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getCategoryColor(category: string): string {
  // Normalize category name: lowercase and replace spaces/underscores/hyphens with a consistent format
  const normalizeCategory = (cat: string) => {
    let normalized = cat.toLowerCase().replace(/[\s_-]+/g, ' ').trim();
    // Normalize "reverse engineering" variations to "reverse"
    if (normalized.startsWith('reverse') && normalized.includes('engineering')) {
      normalized = 'reverse';
    }
    // Normalize "binary exploitation" and "pwn" variations
    if (normalized.includes('binary') && normalized.includes('exploitation')) {
      normalized = 'pwn';
    }
    if (normalized === 'pwnable' || normalized === 'exploitation') {
      normalized = 'pwn';
    }
    // Normalize "cryptography" to "crypto"
    if (normalized === 'cryptography') {
      normalized = 'crypto';
    }
    // Normalize "steganography" to "stego"
    if (normalized === 'steganography') {
      normalized = 'stego';
    }
    // Normalize "networking" to "network"
    if (normalized === 'networking') {
      normalized = 'network';
    }
    return normalized;
  };
  
  const colors: Record<string, string> = {
    // Custom categories
    'home task': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    'lab task': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    // Standard CTF categories
    'crypto': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
    'web': 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
    'web security': 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
    'reverse': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    'pwn': 'bg-orange-200 text-orange-900 dark:bg-orange-800 dark:text-orange-100',
    'binary': 'bg-orange-200 text-orange-900 dark:bg-orange-800 dark:text-orange-100',
    'forensics': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    'stego': 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200',
    'network': 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200',
    'osint': 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200',
    'mgmt': 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
    'misc': 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
  };
  
  const normalized = normalizeCategory(category);
  return colors[normalized] || colors['misc'];
}

export function getCategoryDotColor(category: string): string {
  // Normalize category name: lowercase and replace spaces/underscores/hyphens with a consistent format
  const normalizeCategory = (cat: string) => {
    let normalized = cat.toLowerCase().replace(/[\s_-]+/g, ' ').trim();
    // Normalize "reverse engineering" variations to "reverse"
    if (normalized.startsWith('reverse') && normalized.includes('engineering')) {
      normalized = 'reverse';
    }
    // Normalize "binary exploitation" and "pwn" variations
    if (normalized.includes('binary') && normalized.includes('exploitation')) {
      normalized = 'pwn';
    }
    if (normalized === 'pwnable' || normalized === 'exploitation') {
      normalized = 'pwn';
    }
    // Normalize "cryptography" to "crypto"
    if (normalized === 'cryptography') {
      normalized = 'crypto';
    }
    // Normalize "steganography" to "stego"
    if (normalized === 'steganography') {
      normalized = 'stego';
    }
    // Normalize "networking" to "network"
    if (normalized === 'networking') {
      normalized = 'network';
    }
    return normalized;
  };
  
  const normalized = normalizeCategory(category);
  
  // Map normalized categories to dot colors
  const dotColors: Record<string, string> = {
    'home task': 'bg-blue-500',
    'lab task': 'bg-green-500',
    'crypto': 'bg-purple-500',
    'web': 'bg-orange-500',
    'web security': 'bg-orange-500',
    'reverse': 'bg-red-500',
    'pwn': 'bg-orange-500',
    'binary': 'bg-orange-500',
    'forensics': 'bg-yellow-500',
    'stego': 'bg-pink-500',
    'network': 'bg-cyan-500',
    'osint': 'bg-indigo-500',
    'mgmt': 'bg-gray-500',
    'misc': 'bg-gray-500',
  };
  
  return dotColors[normalized] || 'bg-gray-500';
}
