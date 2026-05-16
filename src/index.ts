#!/usr/bin/env node

import { Command } from "commander";
import descCommand from "./commands/desc.js";
import { doctorCommand } from "./commands/doctor.js";
import { initCommand } from "./commands/init.js";
import listProfilesCommand from "./commands/list-profiles.js";
import { saveCommand } from "./commands/save.js";
import { switchCommand } from "./commands/switch.js";
import { syncCommand } from "./commands/sync.js";

const program = new Command();

program
  .name("esync")
  .description("Environment profile manager")
  .version("0.0.1");

program.command("init").action(initCommand);

program
  .command("save")
  .argument("<profile>", "profile name")
  .action(saveCommand);

program
  .command("switch")
  .argument("<profile>", "profile name")
  .action(switchCommand);

program.command("doctor").action(doctorCommand);

program
  .command("sync")
  .argument("<profile>", "profile name")
  .action(syncCommand);

program.command("list").action(listProfilesCommand);

program.command("desc").action(descCommand);

program.parse();
