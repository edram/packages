import { Command } from 'commander';
import commitCommand from './check/commit.mjs';

export default function buildCheckCommand() {
  const command = new Command('check');

  command.addCommand(commitCommand);
  return command;
}
