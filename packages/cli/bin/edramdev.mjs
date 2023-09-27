#!/usr/bin/env node

import buildCheckCommand from '../commands/check.mjs';
import { Command } from 'commander';

const program = new Command();

program.addCommand(buildCheckCommand());

program.parse(process.argv);
