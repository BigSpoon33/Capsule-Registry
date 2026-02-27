import { readFileSync, existsSync } from 'fs';
import { parse as parseYaml } from 'yaml';

export interface CapsuleData {
  [key: string]: unknown;
}

/**
 * Load and parse a capsule.yaml file.
 * Supports both pure YAML and YAML frontmatter (---delimited).
 */
export function loadCapsuleYaml(filePath: string): CapsuleData {
  if (!existsSync(filePath)) {
    throw new Error(`capsule.yaml not found at: ${filePath}`);
  }

  const raw = readFileSync(filePath, 'utf-8');

  // Handle YAML frontmatter (--- delimited)
  const frontmatterMatch = raw.match(/^---\n([\s\S]*?)\n---/);
  const yamlContent = frontmatterMatch ? frontmatterMatch[1] : raw;

  const data = parseYaml(yamlContent);
  if (!data || typeof data !== 'object') {
    throw new Error(`Invalid YAML in: ${filePath}`);
  }

  return data as CapsuleData;
}
