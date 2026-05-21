import { checkbox } from "@inquirer/prompts";
import chalk from "chalk";
import fs from "fs";
import { maskValue, readEnvFile, writeEnvFile } from "../utils/env.js";
import { getProjectName, getProjectUniquePath } from "../utils/project.js";
import { loadProfile, readFilesFromProject } from "../utils/storage.js";
import { saveToHistory } from "./history.js";

export default async function applyCommand(profile: string) {
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

    const project = getProjectName();
    const uniquePath = getProjectUniquePath();

    // Load profile data
    const profileData = await loadProfile(project, profile, uniquePath);

    if (!profileData || Object.keys(profileData).length === 0) {
      console.log(chalk.red("❌ Profile is empty"));
      return;
    }

    // Show multi-select checkbox for variables
    const selectedVars = await checkbox({
      message: `Select variables to copy from '${profile}' to .env:`,
      choices: Object.keys(profileData).map((key) => ({
        name: `${chalk.cyan(key)}: ${chalk.dim(maskValue(key, profileData[key]))}`,
        value: key,
        checked: false,
      })),
      required: true,
    });

    if (selectedVars.length === 0) {
      console.log(chalk.yellow("No variables selected. Operation cancelled."));
      return;
    }

    // Read current .env (or create empty object if it doesn't exist)
    let currentEnv: Record<string, string> = {};
    if (fs.existsSync(".env")) {
      currentEnv = readEnvFile(".env");
    }

    // Update only selected variables
    let updatedCount = 0;
    let newCount = 0;
    selectedVars.forEach((key) => {
      if (currentEnv[key] !== undefined) {
        updatedCount++;
      } else {
        newCount++;
      }
      currentEnv[key] = profileData[key];
    });

    // Write back to .env
    writeEnvFile(".env", currentEnv);

    // Save to history
    await saveToHistory(`Applied ${selectedVars.length} variable(s) from '${profile}'`, currentEnv, profile);

    console.log(
      chalk.green(`\n✔ Applied ${selectedVars.length} variable(s) to .env:`),
    );
    if (newCount > 0) {
      console.log(chalk.green(`  • Added: ${newCount}`));
    }
    if (updatedCount > 0) {
      console.log(chalk.green(`  • Updated: ${updatedCount}`));
    }
    console.log(chalk.dim(`\nFrom profile: ${profile}`));
    console.log(chalk.dim(`Variables: ${selectedVars.join(", ")}`));
  } catch (error: any) {
    console.log(chalk.red(`Error: ${error.message}`));
  }
}
