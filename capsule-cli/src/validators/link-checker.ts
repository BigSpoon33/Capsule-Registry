import { existsSync, readdirSync, statSync } from 'fs';
import { join, basename } from 'path';
import { extractLinks } from '../utils/markdown-parser';
import type { ValidationResult } from '../utils/logger';

/**
 * Check that all wikilinks [[Target]] and transclusions ![[Embed]]
 * in content files resolve to actual files within the capsule.
 */
export function checkLinks(capsuleDir: string): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Build index of all markdown files in capsule (basename without extension)
  const fileIndex = new Map<string, string>(); // lowercase name -> full path
  indexDirectory(capsuleDir, fileIndex);

  // Find all markdown files and check their links
  const mdFiles = findMarkdownFiles(capsuleDir);

  for (const mdFile of mdFiles) {
    const links = extractLinks(mdFile);
    const relativePath = mdFile.replace(capsuleDir + '/', '');

    for (const link of links.wikilinks) {
      if (!resolveWikilink(link, fileIndex)) {
        errors.push(`${relativePath}: Broken wikilink [[${link}]]`);
      }
    }

    for (const link of links.transclusions) {
      if (!resolveWikilink(link, fileIndex)) {
        errors.push(`${relativePath}: Broken transclusion ![[${link}]]`);
      }
    }

    // External links: just warn, don't validate connectivity
    for (const url of links.externalLinks) {
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        warnings.push(`${relativePath}: Non-HTTP external link: ${url}`);
      }
    }
  }

  return { valid: errors.length === 0, errors, warnings };
}

function indexDirectory(dir: string, index: Map<string, string>) {
  try {
    const entries = readdirSync(dir);
    for (const entry of entries) {
      if (entry === 'node_modules' || entry.startsWith('.')) continue;
      const fullPath = join(dir, entry);
      const stat = statSync(fullPath);
      if (stat.isDirectory()) {
        indexDirectory(fullPath, index);
      } else if (entry.endsWith('.md')) {
        const name = basename(entry, '.md').toLowerCase();
        index.set(name, fullPath);
      }
    }
  } catch {
    // Skip unreadable dirs
  }
}

function findMarkdownFiles(dir: string): string[] {
  const files: string[] = [];
  try {
    const entries = readdirSync(dir);
    for (const entry of entries) {
      if (entry === 'node_modules' || entry.startsWith('.')) continue;
      const fullPath = join(dir, entry);
      const stat = statSync(fullPath);
      if (stat.isDirectory()) {
        files.push(...findMarkdownFiles(fullPath));
      } else if (entry.endsWith('.md')) {
        files.push(fullPath);
      }
    }
  } catch {
    // Skip unreadable dirs
  }
  return files;
}

function resolveWikilink(link: string, index: Map<string, string>): boolean {
  return index.has(link.toLowerCase());
}
