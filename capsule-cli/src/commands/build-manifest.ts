import { readdirSync, existsSync, statSync } from 'fs';
import { join, resolve } from 'path';
import { log } from '../utils/logger';
import { loadCapsuleYaml } from '../utils/yaml-loader';

interface ManifestEntry {
  class_id: string;
  version: string;
  title: string;
  description: string;
  author: { name: string; github?: string };
  difficulty: string;
  tags: string[];
  estimated_hours?: number;
  icon?: string;
  path: string;
  published_at: string;
}

export async function buildManifest(registryDir: string, options: { output?: string }) {
  const dir = resolve(registryDir);
  const outputPath = resolve(options.output || join(dir, 'manifest.json'));

  log.heading(`Building manifest from: ${dir}`);

  const entries: ManifestEntry[] = [];

  // Recursively find all directories containing a capsule.yaml
  function findCapsules(searchDir: string, relativeBase: string) {
    const names = readdirSync(searchDir).filter(n => !n.startsWith('.') && n !== 'node_modules');
    for (const name of names) {
      const fullPath = join(searchDir, name);
      if (!statSync(fullPath).isDirectory()) continue;
      const relativePath = relativeBase ? `${relativeBase}/${name}` : name;
      if (existsSync(join(fullPath, 'capsule.yaml'))) {
        // This is a capsule — add it, don't recurse deeper
        try {
          const data = loadCapsuleYaml(join(fullPath, 'capsule.yaml'));
          const stat = statSync(join(fullPath, 'capsule.yaml'));
          entries.push({
            class_id: data.class_id as string,
            version: data.version as string,
            title: data.title as string,
            description: data.description as string,
            author: data.author as { name: string; github?: string },
            difficulty: data.difficulty as string,
            tags: (data.tags || []) as string[],
            estimated_hours: data.estimated_hours as number | undefined,
            icon: data.icon as string | undefined,
            path: relativePath,
            published_at: stat.mtime.toISOString(),
          });
          log.success(`Found: ${data.title} (${relativePath})`);
        } catch (err: any) {
          log.warn(`Skipping ${relativePath}: ${err.message}`);
        }
      } else {
        // Not a capsule — recurse into it (category directory)
        findCapsules(fullPath, relativePath);
      }
    }
  }

  findCapsules(dir, '');

  const manifest = {
    version: '1.0.0',
    generated_at: new Date().toISOString(),
    capsules: entries.sort((a, b) => a.title.localeCompare(b.title)),
  };

  await Bun.write(outputPath, JSON.stringify(manifest, null, 2));
  log.success(`Manifest written: ${outputPath} (${entries.length} capsules)`);
}
