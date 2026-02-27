#!/usr/bin/env bun
import { Command } from 'commander';
import { validate } from './commands/validate';
import { init } from './commands/init';
import { buildManifest } from './commands/build-manifest';

const program = new Command();

program
  .name('capsule')
  .description('CLI for managing learning capsules')
  .version('0.1.0');

program
  .command('validate <path>')
  .description('Validate a learning capsule directory')
  .action(validate);

program
  .command('init <name>')
  .description('Scaffold a new learning capsule')
  .option('-d, --dir <directory>', 'Parent directory', '.')
  .action(init);

program
  .command('build-manifest <registry-dir>')
  .description('Build manifest.json from a registry directory')
  .option('-o, --output <path>', 'Output file path')
  .action(buildManifest);

program.parse();
