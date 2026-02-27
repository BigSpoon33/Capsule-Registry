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
  const capsuleDirs = readdirSync(dir).filter(name => {
    const fullPath = join(dir, name);
    return statSync(fullPath).isDirectory()
      && !name.startsWith('.')
      && name !== 'node_modules'
      && existsSync(join(fullPath, 'capsule.yaml'));
  });

  for (const capsuleName of capsuleDirs) {
    const capsuleDir = join(dir, capsuleName);
    try {
      const data = loadCapsuleYaml(join(capsuleDir, 'capsule.yaml'));
      const stat = statSync(join(capsuleDir, 'capsule.yaml'));

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
        path: capsuleName,
        published_at: stat.mtime.toISOString(),
      });

      log.success(`Found: ${data.title} (${data.version})`);
    } catch (err: any) {
      log.warn(`Skipping ${capsuleName}: ${err.message}`);
    }
  }

  const manifest = {
    version: '1.0.0',
    generated_at: new Date().toISOString(),
    capsules: entries.sort((a, b) => a.title.localeCompare(b.title)),
  };

  await Bun.write(outputPath, JSON.stringify(manifest, null, 2));
  log.success(`Manifest written: ${outputPath} (${entries.length} capsules)`);
}
