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
import applyCommand from "./commands/apply.js";
import mergeCommand from "./commands/merge.js";
import pickCommand from "./commands/pick.js";
import batchDeleteCommand from "./commands/batch-delete.js";
import extractCommand from "./commands/extract.js";
import compareAllCommand from "./commands/compare-all.js";
import searchCommand from "./commands/search.js";
import validateCommand from "./commands/validate.js";
import groupsCommand from "./commands/groups.js";
import wizardCommand from "./commands/wizard.js";
import historyCommand from "./commands/history.js";
import secretsCommand from "./commands/secrets.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const pkg = JSON.parse(
  readFileSync(join(__dirname, "../package.json"), "utf-8"),
);

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
  .option("--interactive", "preview changes before syncing")
  .action((profile, opts) => syncCommand(profile, opts));

program.command("list").action(listProfilesCommand);

program
  .command("desc")
  .option("--reveal", "show actual values instead of masking sensitive fields")
  .action((opts) => descCommand(opts));

program
  .command("delete")
  .argument("<profile>", "profile name")
  .description("Delete a profile")
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

program
  .command("apply")
  .argument("<profile>", "profile name")
  .description("Select and apply specific variables from a profile to .env")
  .action(applyCommand);

program
  .command("merge")
  .argument("<profiles...>", "profiles to merge")
  .description("Merge variables from multiple profiles into .env (multi-select)")
  .action((...args) => {
    const profiles = args.slice(0, -1);
    mergeCommand(...profiles);
  });

program
  .command("pick")
  .argument("<profile>", "profile name")
  .option("--reveal", "show actual values instead of masking sensitive fields")
  .description("Cherry-pick variables interactively from profile to .env")
  .action((profile, opts) => pickCommand(profile, opts));

program
  .command("batch-delete")
  .description("Delete multiple profiles at once (multi-select)")
  .action(batchDeleteCommand);

program
  .command("extract")
  .description("Extract selected variables from .env to a new profile")
  .action(extractCommand);

program
  .command("compare-all")
  .option("--reveal", "show actual values instead of masking sensitive fields")
  .description("Compare variables across all profiles in a matrix view")
  .action((opts) => compareAllCommand(opts));

program
  .command("search")
  .argument("<keyword>", "search keyword")
  .option("--reveal", "show actual values instead of masking sensitive fields")
  .description("Search for variables across all profiles")
  .action((keyword, opts) => searchCommand(keyword, opts));

program
  .command("validate")
  .description("Validate .env and interactively fix issues")
  .action(validateCommand);

program
  .command("groups")
  .argument("[action]", "action: create, add, remove, list, delete, apply")
  .argument("[args...]", "additional arguments")
  .description("Manage variable groups")
  .action((action, args) => groupsCommand(action, ...args));

program
  .command("wizard")
  .description("Interactive profile creation wizard")
  .action(wizardCommand);

program
  .command("history")
  .argument("[action]", "action: list, rollback, clear")
  .description("View and manage .env change history")
  .action((action) => historyCommand(action));

program
  .command("secrets")
  .argument("[action]", "action: scan, encrypt, decrypt, generate-key")
  .argument("[args...]", "additional arguments")
  .description("Scan and manage secrets in profiles")
  .action((action, args) => secretsCommand(action, ...args));

program.command("help").action(() => {
  console.log(`
  Usage: esync [command] [options]

  Commands:
    init                Initialize a new project
    save <profile>      Save the current environment variables to a profile
    switch <profile>    Switch to a different profile
    doctor              Check the project for issues (and fix interactively)
    sync <profile>      Sync the environment variables with a profile (--interactive for preview)
    list                List all profiles (marks the active one)
    desc                Describe the current profile
    delete <profile>    Delete a profile
    rename <oldProfile> <newProfile>  Rename a profile
    set-source <file>   Set a new source of truth file for the project
    copy <src> <dest>   Copy a profile to a new name
    diff <p1> [p2]      Diff two profiles, or a profile vs .env (--reveal for actual values)
    export <profile> <filepath>  Export a profile to a .env file at a given path

  🎯 Multi-Select Features:
    apply <profile>     Select specific variables from a profile to apply to .env
    merge <p1> <p2>...  Merge variables from multiple profiles (multi-select)
    pick <profile>      Cherry-pick variables interactively (shows diffs)
    batch-delete        Delete multiple profiles at once
    extract             Extract selected variables from .env to new profile
    compare-all         Compare all profiles in matrix view and select to apply
    search <keyword>    Search variables across all profiles
    validate            Validate .env and fix issues interactively

  🔧 Advanced Features:
    groups [action]     Manage variable groups (create, add, remove, list, delete, apply)
    wizard              Interactive profile creation wizard
    history [action]    View/rollback .env change history (list, rollback, clear)
    secrets [action]    Scan and manage secrets (scan, encrypt, decrypt, generate-key)

    help                Display this help message

  Options:
    --reveal            Show actual values instead of masking sensitive fields (for desc, diff, pick, etc.)
  `);
});

program.parse();
