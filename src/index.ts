#!/usr/bin/env node

import { Command } from "commander";
import descCommand from "./commands/desc.js";
import { doctorCommand } from "./commands/doctor.js";
import { initCommand } from "./commands/init.js";
import listProfilesCommand from "./commands/list-profiles.js";
import { saveCommand } from "./commands/save.js";
import { switchCommand } from "./commands/switch.js";
import { syncCommand } from "./commands/sync.js";
import deleteProfile from "./commands/delete-profile.js";
import renameProfile from "./commands/rename-profile.js";
import setSourceOfTruth from "./commands/set-source-of-truth.js";

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

program
  .command("delete", "project profile")
  .argument("<profile>", "profile name")
  .action(deleteProfile);

program
  .command("rename")
  .argument("<oldProfile>", "old profile name")
  .argument("<newProfile>", "new profile name")
  .action(renameProfile);

program
  .command("set-source")
  .argument("<newsourcefile>", "old source of truth")
  .action(setSourceOfTruth);

program.command("help").action(() => {
  console.log(`
  Usage: esync [command] [options]

  Commands:
    init                Initialize a new project
    save <profile>      Save the current environment variables to a profile
    switch <profile>    Switch to a different profile
    doctor              Check the project for issues
    sync <profile>      Sync the environment variables with a profile
    list                List all profiles
    desc                Describe the current profile
    delete <profile>    Delete a profile
    rename <oldProfile> <newProfile>  Rename a profile
    set-source <newsourcefile>  Set a new source of truth file for the project
    help                Display this help message
  `);
});

program.parse();
