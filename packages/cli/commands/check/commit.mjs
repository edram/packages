import { Command } from 'commander';
import fs from 'fs';

const commitCommand = new Command('commit');
const commitRegex =
  /(feat|fix|docs|UI|refactor|perf|workflow|build|CI|typos|chore|tests|types|wip|release|dep|locale)(\(.+\))?: .{1,50}/;

commitCommand.argument('<path>', 'git commit path');

commitCommand.action((path) => {
  const msg = fs.readFileSync(path, 'utf-8').trim();

  if (!commitRegex.test(msg)) {
    console.error('git commit 不规范');
    process.exit(1);
  }
});

export default commitCommand;
