import { checkbox, input } from "@inquirer/prompts";
import chalk from "chalk";
import fs from "fs";
import { readEnvFile, maskValue } from "../utils/env.js";
import { getProjectName, getProjectUniquePath, validateProfileName } from "../utils/project.js";
import { saveProfile, readFilesFromProject } from "../utils/storage.js";
import { saveToHistory } from "./history.js";

export default async function extractCommand() {
  try {
    const configData = readFilesFromProject("config.json");
    if (!configData) {
      console.log(chalk.red("Configuration file not found."));
      return;
    }

    if (!fs.existsSync(".env")) {
      console.log(chalk.red(".env file not found."));
      return;
    }

    const currentEnv = readEnvFile(".env");
    const envKeys = Object.keys(currentEnv);

    if (envKeys.length === 0) {
      console.log(chalk.yellow(".env file is empty."));
      return;
    }

    // Select variables to extract
    const selectedVars = await checkbox({
      message: "Select variables to extract from .env:",
      choices: envKeys.map((key) => ({
        name: `${chalk.cyan(key)}: ${chalk.dim(maskValue(key, currentEnv[key]))}`,
        value: key,
        checked: false,
      })),
      required: true,
    });

    if (selectedVars.length === 0) {
      console.log(chalk.yellow("No variables selected. Operation cancelled."));
      return;
    }

    // Ask for new profile name
    const newProfile = await input({
      message: "Enter new profile name:",
      validate: (value) => {
        if (!value) return "Profile name is required";
        const error = validateProfileName(value);
        if (error) return error;
        if (configData.profiles.includes(value)) {
          return `Profile '${value}' already exists`;
        }
        return true;
      },
    });

    // Create extracted profile data
    const extractedData: Record<string, string> = {};
    selectedVars.forEach((key) => {
      extractedData[key] = currentEnv[key];
    });

    const project = getProjectName();
    const uniquePath = getProjectUniquePath();

    await saveProfile(project, newProfile, extractedData, uniquePath);

    // Save to history
    await saveToHistory(`Extracted ${selectedVars.length} variable(s) to profile '${newProfile}'`, extractedData, newProfile);

    console.log(chalk.green(`\n✔ Extracted ${selectedVars.length} variable(s) to profile '${newProfile}'`));
    console.log(chalk.dim(`Variables: ${selectedVars.join(", ")}`));
  } catch (error: any) {
    console.log(chalk.red(`Error: ${error.message}`));
  }
}
