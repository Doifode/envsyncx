import { checkbox } from "@inquirer/prompts";
import chalk from "chalk";
import fs from "fs";
import { readEnvFile, writeEnvFile, maskValue } from "../utils/env.js";
import { getProjectName, getProjectUniquePath } from "../utils/project.js";
import { loadProfile, readFilesFromProject } from "../utils/storage.js";
import { saveToHistory } from "./history.js";

export default async function pickCommand(profile: string, options: { reveal?: boolean } = {}) {
  try {
    const configData = readFilesFromProject("config.json");
    if (!configData) {
      console.log(chalk.red("Configuration file not found."));
      return;
    }

    if (!configData.profiles.includes(profile)) {
      console.log(chalk.red(`Profile '${profile}' not found.`));
      return;
    }

    if (!fs.existsSync(".env")) {
      console.log(chalk.red(".env file not found."));
      return;
    }

    const project = getProjectName();
    const uniquePath = getProjectUniquePath();

    const currentEnv = readEnvFile(".env");
    const profileData = await loadProfile(project, profile, uniquePath);

    // Find all unique keys
    const allKeys = new Set([...Object.keys(currentEnv), ...Object.keys(profileData)]);
    
    const choices = Array.from(allKeys).map((key) => {
      const currentVal = currentEnv[key];
      const profileVal = profileData[key];
      
      let name: string;
      let status: string;
      
      if (currentVal === undefined) {
        // Only in profile
        const display = options.reveal ? profileVal : maskValue(key, profileVal);
        name = `${chalk.cyan(key)}: ${chalk.green("+")} ${display} ${chalk.dim(`[new from ${profile}]`)}`;
        status = "new";
      } else if (profileVal === undefined) {
        // Only in .env
        const display = options.reveal ? currentVal : maskValue(key, currentVal);
        name = `${chalk.cyan(key)}: ${chalk.gray(display)} ${chalk.dim("[keep current]")}`;
        status = "keep";
      } else if (currentVal === profileVal) {
        // Same value
        const display = options.reveal ? currentVal : maskValue(key, currentVal);
        name = `${chalk.cyan(key)}: ${chalk.gray(display)} ${chalk.dim("[unchanged]")}`;
        status = "same";
      } else {
        // Different values
        const dispCurrent = options.reveal ? currentVal : maskValue(key, currentVal);
        const dispProfile = options.reveal ? profileVal : maskValue(key, profileVal);
        name = `${chalk.cyan(key)}: ${chalk.yellow("~")} current: ${chalk.dim(dispCurrent)} → ${profile}: ${dispProfile}`;
        status = "conflict";
      }
      
      return {
        name,
        value: { key, action: status === "keep" ? "skip" : "update", profileVal },
        checked: status === "new" || status === "conflict", // Auto-select new and conflicts
      };
    });

    const selected = await checkbox({
      message: `Pick variables to update in .env from '${profile}':`,
      choices,
    });

    if (selected.length === 0) {
      console.log(chalk.yellow("No variables selected. Operation cancelled."));
      return;
    }

    // Apply selected changes
    let addedCount = 0;
    let updatedCount = 0;
    
    selected.forEach(({ key, profileVal }) => {
      if (currentEnv[key] === undefined) {
        addedCount++;
      } else {
        updatedCount++;
      }
      currentEnv[key] = profileVal;
    });

    writeEnvFile(".env", currentEnv);

    // Save to history
    await saveToHistory(`Picked ${selected.length} variable(s) from '${profile}'`, currentEnv, profile);

    console.log(chalk.green(`\n✔ Applied ${selected.length} change(s) to .env:`));
    if (addedCount > 0) {
      console.log(chalk.green(`  • Added: ${addedCount}`));
    }
    if (updatedCount > 0) {
      console.log(chalk.green(`  • Updated: ${updatedCount}`));
    }
  } catch (error: any) {
    console.log(chalk.red(`Error: ${error.message}`));
  }
}
