#!/usr/bin/env node

import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
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
import copyProfile from "./commands/copy.js";
import diffCommand from "./commands/diff.js";
import exportCommand from "./commands/export.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const pkg = JSON.parse(readFileSync(join(__dirname, "../package.json"), "utf-8"));

const program = new Command();

program
  .name("esync")
  .description("Environment profile manager")
  .version(pkg.version);

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

program.command("desc")
  .option("--reveal", "show actual values instead of masking sensitive fields")
  .action((opts) => descCommand(opts));

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

program
  .command("copy")
  .argument("<sourceProfile>", "source profile name")
  .argument("<newProfile>", "new profile name")
  .action(copyProfile);

program
  .command("diff")
  .argument("<profile1>", "profile to compare")
  .argument("[profile2]", "second profile (defaults to current .env)")
  .option("--reveal", "show actual values instead of masking sensitive fields")
  .action((profile1, profile2, opts) => diffCommand(profile1, profile2, opts));

program
  .command("export")
  .argument("<profile>", "profile to export")
  .argument("<filepath>", "destination file path (e.g. .env.production)")
  .action(exportCommand);

program.command("help").action(() => {
  console.log(`
  Usage: esync [command] [options]

  Commands:
    init                Initialize a new project
    save <profile>      Save the current environment variables to a profile
    switch <profile>    Switch to a different profile
    doctor              Check the project for issues (and fix interactively)
    sync <profile>      Sync the environment variables with a profile
    list                List all profiles (marks the active one)
    desc                Describe the current profile
    delete <profile>    Delete a profile
    rename <oldProfile> <newProfile>  Rename a profile
    set-source <file>   Set a new source of truth file for the project
    copy <src> <dest>   Copy a profile to a new name
    diff <p1> [p2]      Diff two profiles, or a profile vs .env (--reveal for actual values)
    export <profile> <filepath>  Export a profile to a .env file at a given path
    help                Display this help message
  `);
});

program.parse();
