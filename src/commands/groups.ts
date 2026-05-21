import { checkbox, input, select } from "@inquirer/prompts";
import chalk from "chalk";
import fs from "fs";
import { readEnvFile, writeEnvFile, maskValue } from "../utils/env.js";
import { getProjectName, getProjectUniquePath } from "../utils/project.js";
import { loadProfile, readFilesFromProject, updateProjectFiles } from "../utils/storage.js";
import { saveToHistory } from "./history.js";

type GroupsData = Record<string, string[]>;

export default async function groupsCommand(action?: string, ...args: string[]) {
  if (!action) {
    await showGroupsHelp();
    return;
  }

  switch (action) {
    case "create":
      await createGroup(args[0]);
      break;
    case "add":
      await addToGroup(args[0], args.slice(1));
      break;
    case "remove":
      await removeFromGroup(args[0], args.slice(1));
      break;
    case "list":
      await listGroups();
      break;
    case "delete":
      await deleteGroup(args[0]);
      break;
    case "apply":
      await applyGroup(args[0], args[1]);
      break;
    default:
      console.log(chalk.red(`Unknown action: ${action}`));
      await showGroupsHelp();
  }
}

async function showGroupsHelp() {
  console.log(chalk.bold("\n📁 Groups Command\n"));
  console.log("Organize and manage environment variables by groups.\n");
  console.log("Usage:");
  console.log("  esync groups create <group-name>");
  console.log("  esync groups add <group-name> <var1> [var2] ...");
  console.log("  esync groups remove <group-name> <var1> [var2] ...");
  console.log("  esync groups list");
  console.log("  esync groups delete <group-name>");
  console.log("  esync groups apply <profile> <group-name>");
}

async function getGroups(): Promise<GroupsData> {
  const configData = readFilesFromProject("config.json");
  return configData?.groups || {};
}

async function saveGroups(groups: GroupsData) {
  const project = getProjectName();
  const uniquePath = getProjectUniquePath();
  
  await updateProjectFiles(project, uniquePath, "config.json", (data) => ({
    ...data,
    groups,
  }));
}

async function createGroup(groupName?: string) {
  try {
    if (!groupName) {
      groupName = await input({
        message: "Enter group name:",
        validate: (val) => val ? true : "Group name is required",
      });
    }

    const groups = await getGroups();

    if (groups[groupName]) {
      console.log(chalk.yellow(`Group '${groupName}' already exists.`));
      return;
    }

    groups[groupName] = [];
    await saveGroups(groups);

    console.log(chalk.green(`✔ Created group '${groupName}'`));
  } catch (error: any) {
    console.log(chalk.red(`Error: ${error.message}`));
  }
}

async function addToGroup(groupName?: string, vars?: string[]) {
  try {
    const groups = await getGroups();

    if (!groupName) {
      if (Object.keys(groups).length === 0) {
        console.log(chalk.yellow("No groups found. Create one first."));
        return;
      }

      groupName = await select({
        message: "Select group:",
        choices: Object.keys(groups).map((g) => ({ name: g, value: g })),
      });
    }

    if (!groups[groupName]) {
      console.log(chalk.red(`Group '${groupName}' not found.`));
      return;
    }

    if (!vars || vars.length === 0) {
      // Interactive: select from .env
      if (!fs.existsSync(".env")) {
        console.log(chalk.red(".env file not found."));
        return;
      }

      const currentEnv = readEnvFile(".env");
      const availableVars = Object.keys(currentEnv).filter(
        (key) => !groups[groupName!].includes(key)
      );

      if (availableVars.length === 0) {
        console.log(chalk.yellow("All variables already in group."));
        return;
      }

      vars = await checkbox({
        message: `Select variables to add to '${groupName}':`,
        choices: availableVars.map((key) => ({
          name: `${chalk.cyan(key)}: ${chalk.dim(maskValue(key, currentEnv[key]))}`,
          value: key,
        })),
        required: true,
      });
    }

    groups[groupName] = [...new Set([...groups[groupName], ...vars])];
    await saveGroups(groups);

    console.log(chalk.green(`✔ Added ${vars.length} variable(s) to group '${groupName}'`));
  } catch (error: any) {
    console.log(chalk.red(`Error: ${error.message}`));
  }
}

async function removeFromGroup(groupName?: string, vars?: string[]) {
  try {
    const groups = await getGroups();

    if (!groupName) {
      if (Object.keys(groups).length === 0) {
        console.log(chalk.yellow("No groups found."));
        return;
      }

      groupName = await select({
        message: "Select group:",
        choices: Object.keys(groups).map((g) => ({ name: g, value: g })),
      });
    }

    if (!groups[groupName]) {
      console.log(chalk.red(`Group '${groupName}' not found.`));
      return;
    }

    if (!vars || vars.length === 0) {
      // Interactive
      if (groups[groupName].length === 0) {
        console.log(chalk.yellow("Group is empty."));
        return;
      }

      vars = await checkbox({
        message: `Select variables to remove from '${groupName}':`,
        choices: groups[groupName].map((key) => ({ name: key, value: key })),
        required: true,
      });
    }

    groups[groupName] = groups[groupName].filter((v) => !vars!.includes(v));
    await saveGroups(groups);

    console.log(chalk.green(`✔ Removed ${vars.length} variable(s) from group '${groupName}'`));
  } catch (error: any) {
    console.log(chalk.red(`Error: ${error.message}`));
  }
}

async function listGroups() {
  try {
    const groups = await getGroups();

    if (Object.keys(groups).length === 0) {
      console.log(chalk.yellow("No groups found."));
      return;
    }

    console.log(chalk.bold("\n📁 Variable Groups:\n"));

    for (const [groupName, vars] of Object.entries(groups)) {
      console.log(chalk.cyan(`${groupName}:`));
      if (vars.length === 0) {
        console.log(chalk.dim("  (empty)"));
      } else {
        vars.forEach((v) => console.log(`  • ${v}`));
      }
      console.log();
    }
  } catch (error: any) {
    console.log(chalk.red(`Error: ${error.message}`));
  }
}

async function deleteGroup(groupName?: string) {
  try {
    const groups = await getGroups();

    if (!groupName) {
      if (Object.keys(groups).length === 0) {
        console.log(chalk.yellow("No groups found."));
        return;
      }

      groupName = await select({
        message: "Select group to delete:",
        choices: Object.keys(groups).map((g) => ({ name: g, value: g })),
      });
    }

    if (!groups[groupName]) {
      console.log(chalk.red(`Group '${groupName}' not found.`));
      return;
    }

    delete groups[groupName];
    await saveGroups(groups);

    console.log(chalk.green(`✔ Deleted group '${groupName}'`));
  } catch (error: any) {
    console.log(chalk.red(`Error: ${error.message}`));
  }
}

async function applyGroup(profile?: string, groupName?: string) {
  try {
    const configData = readFilesFromProject("config.json");
    if (!configData) {
      console.log(chalk.red("Configuration file not found."));
      return;
    }

    const groups = await getGroups();

    if (Object.keys(groups).length === 0) {
      console.log(chalk.yellow("No groups found. Create one first."));
      return;
    }

    if (!profile) {
      profile = await select({
        message: "Select profile:",
        choices: configData.profiles.map((p: string) => ({ name: p, value: p })),
      });
    }

    if (!groupName) {
      groupName = await select({
        message: "Select group to apply:",
        choices: Object.keys(groups).map((g) => ({ name: g, value: g })),
      });
    }

    if (!groups[groupName]) {
      console.log(chalk.red(`Group '${groupName}' not found.`));
      return;
    }

    if (groups[groupName].length === 0) {
      console.log(chalk.yellow("Group is empty."));
      return;
    }

    const project = getProjectName();
    const uniquePath = getProjectUniquePath();

    const profileData = await loadProfile(project, profile!, uniquePath);

    // Filter only variables in the group
    const toApply: Record<string, string> = {};
    const missing: string[] = [];

    groups[groupName].forEach((key) => {
      if (profileData[key] !== undefined) {
        toApply[key] = profileData[key];
      } else {
        missing.push(key);
      }
    });

    if (Object.keys(toApply).length === 0) {
      console.log(chalk.red("No matching variables found in profile."));
      if (missing.length > 0) {
        console.log(chalk.yellow(`Missing in profile: ${missing.join(", ")}`));
      }
      return;
    }

    // Read and update .env
    let currentEnv: Record<string, string> = {};
    if (fs.existsSync(".env")) {
      currentEnv = readEnvFile(".env");
    }

    let addedCount = 0;
    let updatedCount = 0;

    Object.entries(toApply).forEach(([key, value]) => {
      if (currentEnv[key] === undefined) {
        addedCount++;
      } else {
        updatedCount++;
      }
      currentEnv[key] = value;
    });

    writeEnvFile(".env", currentEnv);
    // Save to history
    await saveToHistory(`Applied group '${groupName}' from profile '${profile!}'`, currentEnv, profile!);
    console.log(chalk.green(`\n✔ Applied group '${groupName}' from profile '${profile}':`));
    if (addedCount > 0) {
      console.log(chalk.green(`  • Added: ${addedCount}`));
    }
    if (updatedCount > 0) {
      console.log(chalk.green(`  • Updated: ${updatedCount}`));
    }
    if (missing.length > 0) {
      console.log(chalk.yellow(`  • Not in profile: ${missing.join(", ")}`));
    }
  } catch (error: any) {
    console.log(chalk.red(`Error: ${error.message}`));
  }
}
