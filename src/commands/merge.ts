import { checkbox } from "@inquirer/prompts";
import chalk from "chalk";
import fs from "fs";
import { readEnvFile, writeEnvFile, maskValue } from "../utils/env.js";
import { getProjectName, getProjectUniquePath } from "../utils/project.js";
import { loadProfile, readFilesFromProject } from "../utils/storage.js";
import { saveToHistory } from "./history.js";

export default async function mergeCommand(...profiles: string[]) {
  try {
    if (profiles.length === 0) {
      console.log(chalk.red("Please specify at least one profile to merge."));
      console.log(chalk.dim("Usage: esync merge <profile1> [profile2] [profile3] ..."));
      return;
    }

    const configData = readFilesFromProject("config.json");
    if (!configData) {
      console.log(chalk.red("Configuration file not found."));
      return;
    }

    // Validate all profiles exist
    for (const profile of profiles) {
      if (!configData.profiles.includes(profile)) {
        console.log(chalk.red(`Profile '${profile}' not found.`));
        return;
      }
    }

    const project = getProjectName();
    const uniquePath = getProjectUniquePath();

    // Load all profile data
    const allVars: Record<string, { value: string; source: string }> = {};
    
    for (const profile of profiles) {
      const profileData = await loadProfile(project, profile, uniquePath);
      for (const [key, value] of Object.entries(profileData)) {
        allVars[key] = { value: String(value), source: profile };
      }
    }

    if (Object.keys(allVars).length === 0) {
      console.log(chalk.red("❌ All profiles are empty"));
      return;
    }

    // Show multi-select with source info
    const selectedVars = await checkbox({
      message: `Select variables to merge from ${profiles.join(", ")} into .env:`,
      choices: Object.entries(allVars).map(([key, { value, source }]) => ({
        name: `${chalk.cyan(key)}: ${chalk.dim(maskValue(key, value))} ${chalk.gray(`[from ${source}]`)}`,
        value: key,
        checked: false,
      })),
      required: true,
    });

    if (selectedVars.length === 0) {
      console.log(chalk.yellow("No variables selected. Operation cancelled."));
      return;
    }

    // Read current .env
    let currentEnv: Record<string, string> = {};
    if (fs.existsSync(".env")) {
      currentEnv = readEnvFile(".env");
    }

    // Merge selected variables
    let updatedCount = 0;
    let newCount = 0;
    selectedVars.forEach((key) => {
      if (currentEnv[key] !== undefined) {
        updatedCount++;
      } else {
        newCount++;
      }
      currentEnv[key] = allVars[key].value;
    });

    writeEnvFile(".env", currentEnv);

    // Save to history
    await saveToHistory(`Merged ${selectedVars.length} variable(s) from ${profiles.join(", ")}`, currentEnv);

    console.log(chalk.green(`\n✔ Merged ${selectedVars.length} variable(s) into .env:`));
    if (newCount > 0) {
      console.log(chalk.green(`  • Added: ${newCount}`));
    }
    if (updatedCount > 0) {
      console.log(chalk.green(`  • Updated: ${updatedCount}`));
    }
    console.log(chalk.dim(`\nFrom profiles: ${profiles.join(", ")}`));
  } catch (error: any) {
    console.log(chalk.red(`Error: ${error.message}`));
  }
}
