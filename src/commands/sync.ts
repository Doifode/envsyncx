import chalk from "chalk";
import inquirer from "inquirer";
import { checkbox } from "@inquirer/prompts";

import { readEnvFile, maskValue } from "../utils/env.js";
import { getProjectName, getProjectUniquePath } from "../utils/project.js";
import { loadProfile, updateProjectFiles } from "../utils/storage.js";
import { switchCommand } from "./switch.js";
import { saveToHistory } from "./history.js";

export async function syncCommand(profile: string, options: { interactive?: boolean } = {}) {
  try {
    // get project name and unique path for profile storage
    // get source of truth file name from .envsyncx/profiles/{projectName}_{fullPathOfProject}.json to ensure we are checking against the correct file, in case user has multiple projects with different source of truth files
    const project = getProjectName();
    const fullPathOfProject = getProjectUniquePath();
    const readJson = await loadProfile(project, "config", fullPathOfProject);
    const sourceOfTruthFileName = readJson.sourceOfTruth;
    const example = readEnvFile(sourceOfTruthFileName);

    const savedProfile = await loadProfile(project, profile, fullPathOfProject);

    let updated = false;
    const changes: Array<{
      type: "add" | "remove";
      key: string;
      value?: string;
    }> = [];

    for (const key of Object.keys(example)) {
      if (!(key in savedProfile)) {
        changes.push({ type: "add", key });
      }
    }

    // remove keys no longer in source-of-truth
    for (const key of Object.keys(savedProfile)) {
      if (!(key in example)) {
        changes.push({ type: "remove", key, value: savedProfile[key] });
      }
    }

    if (changes.length === 0) {
      console.log(chalk.green("✔ Profile already up-to-date"));
      return;
    }

    // Interactive mode: show preview and let user select changes
    if (options.interactive) {
      console.log(chalk.bold("\n📋 Sync Preview:\n"));

      const choices = changes.map((change) => {
        if (change.type === "add") {
          return {
            name: `${chalk.green("+")} ${chalk.cyan(change.key)} ${chalk.dim("(will be added)")}`,
            value: change,
            checked: true,
          };
        } else {
          const display = maskValue(change.key, change.value || "");
          return {
            name: `${chalk.red("-")} ${chalk.cyan(change.key)}: ${chalk.dim(display)} ${chalk.dim("(will be removed)")}`,
            value: change,
            checked: true,
          };
        }
      });

      const selectedChanges = await checkbox({
        message: "Select changes to apply:",
        choices,
      });

      if (selectedChanges.length === 0) {
        console.log(chalk.yellow("No changes selected. Operation cancelled."));
        return;
      }

      // Apply selected changes
      for (const change of selectedChanges) {
        if (change.type === "add") {
          console.log(chalk.yellow(`\nMissing variable detected: ${change.key}`));
          const answer = await inquirer.prompt([
            {
              type: "input",
              name: "value",
              message: `Enter value for ${change.key}:`,
            },
          ]);
          savedProfile[change.key] = answer.value;
          updated = true;
        } else {
          console.log(chalk.yellow(`\nRemoving stale key: ${change.key}`));
          delete savedProfile[change.key];
          updated = true;
        }
      }
    } else {
      // Non-interactive mode: apply all changes
      for (const change of changes) {
        if (change.type === "add") {
          console.log(chalk.yellow(`\nMissing variable detected: ${change.key}`));
          const answer = await inquirer.prompt([
            {
              type: "input",
              name: "value",
              message: `Enter value for ${change.key}:`,
            },
          ]);
          savedProfile[change.key] = answer.value;
          updated = true;
        } else {
          console.log(chalk.yellow(`\nRemoving stale key: ${change.key}`));
          delete savedProfile[change.key];
          updated = true;
        }
      }
    }

    if (updated) {
      await updateProjectFiles(
        project,
        fullPathOfProject,
        `${profile}.json`,
        (configData) => ({
          ...configData,
          ...savedProfile,
        }),
      );

      await switchCommand(profile);

      console.log(chalk.green("\n✔ Profile synced successfully"));
    } else {
      console.log(chalk.green("✔ Profile already up-to-date"));
    }
  } catch (error: any) {
    console.log(chalk.red(error.message));
  }
}
