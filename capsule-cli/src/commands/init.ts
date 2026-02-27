import { mkdirSync, writeFileSync, existsSync } from 'fs';
import { join, resolve } from 'path';
import { stringify as yamlStringify } from 'yaml';
import { log } from '../utils/logger';
import { randomUUID } from 'crypto';

export async function init(name: string, options: { dir?: string }) {
  const targetDir = resolve(options.dir || '.', name);

  if (existsSync(targetDir)) {
    log.error(`Directory already exists: ${targetDir}`);
    process.exit(1);
  }

  log.heading(`Scaffolding new capsule: ${name}`);

  // Create directory structure
  const dirs = ['lessons', 'labs', 'quizzes'];
  mkdirSync(targetDir, { recursive: true });
  for (const dir of dirs) {
    mkdirSync(join(targetDir, dir), { recursive: true });
  }

  // Generate capsule.yaml
  const capsuleData = {
    class_id: randomUUID(),
    version: '0.1.0',
    title: name.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
    description: `A learning capsule about ${name.replace(/-/g, ' ')}`,
    author: {
      name: 'Your Name',
      github: 'your-username',
    },
    difficulty: 'beginner',
    estimated_hours: 2,
    language: 'en',
    tags: [],
    icon: '',
    tutor_persona: {
      name: 'Tutor',
      style: 'socratic',
    },
    pass_criteria: {
      min_score: 70,
      required_labs: [],
      required_quizzes: [],
    },
    content_modules: [
      {
        id: 'lesson-01',
        type: 'lesson',
        title: 'Introduction',
        path: 'lessons/01-introduction.md',
        order: 0,
        duration_minutes: 15,
      },
      {
        id: 'quiz-01',
        type: 'quiz',
        title: 'Knowledge Check',
        path: 'quizzes/quiz-01.md',
        order: 1,
        duration_minutes: 10,
        prerequisites: ['lesson-01'],
      },
    ],
  };

  writeFileSync(join(targetDir, 'capsule.yaml'), yamlStringify(capsuleData));

  // Create README
  writeFileSync(join(targetDir, 'README.md'), `# ${capsuleData.title}\n\n${capsuleData.description}\n`);

  // Create starter lesson
  writeFileSync(join(targetDir, 'lessons', '01-introduction.md'), `# Introduction\n\nWelcome to this course.\n\n## Learning Objectives\n\n- Objective 1\n- Objective 2\n\n## Content\n\nYour lesson content here.\n`);

  // Create starter quiz
  writeFileSync(join(targetDir, 'quizzes', 'quiz-01.md'), `# Knowledge Check\n\n## Q1: Sample question?\n- [ ] Wrong answer\n- [x] Correct answer\n- [ ] Another wrong answer\n\n## Q2: Another question?\n- [x] Correct\n- [ ] Incorrect\n- [ ] Also incorrect\n\n## Q3: Third question?\n- [ ] No\n- [x] Yes\n- [ ] Maybe\n`);

  log.success(`Capsule scaffolded at: ${targetDir}`);
  log.dim(`  capsule.yaml    — Course metadata`);
  log.dim(`  lessons/         — Lesson content`);
  log.dim(`  labs/            — Hands-on exercises`);
  log.dim(`  quizzes/         — Assessments`);
  log.info(`Run: capsule validate ${targetDir}`);
}
