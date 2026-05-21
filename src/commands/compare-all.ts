import { checkbox } from "@inquirer/prompts";
import chalk from "chalk";
import fs from "fs";
import { readEnvFile, writeEnvFile, maskValue } from "../utils/env.js";
import { getProjectName, getProjectUniquePath } from "../utils/project.js";
import { loadProfile, readFilesFromProject } from "../utils/storage.js";
import { saveToHistory } from "./history.js";

export default async function compareAllCommand(options: { reveal?: boolean } = {}) {
  try {
    const configData = readFilesFromProject("config.json");
    if (!configData) {
      console.log(chalk.red("Configuration file not found."));
      return;
    }

    if (configData.profiles.length === 0) {
      console.log(chalk.yellow("No profiles found."));
      return;
    }

    const project = getProjectName();
    const uniquePath = getProjectUniquePath();

    // Load all profiles
    const profilesData: Record<string, Record<string, string>> = {};
    for (const profile of configData.profiles) {
      profilesData[profile] = await loadProfile(project, profile, uniquePath);
    }

    // Get all unique keys across all profiles
    const allKeys = new Set<string>();
    Object.values(profilesData).forEach((data) => {
      Object.keys(data).forEach((key) => allKeys.add(key));
    });

    if (allKeys.size === 0) {
      console.log(chalk.yellow("All profiles are empty."));
      return;
    }

    // Display comparison table
    console.log(chalk.bold("\n📊 Variable Comparison Matrix\n"));
    
    const profiles = configData.profiles;
    const colWidth = 20;
    
    // Header
    const header = chalk.cyan("Variable".padEnd(colWidth)) + 
      profiles.map((p: string) => chalk.cyan(p.padEnd(colWidth))).join("");
    console.log(header);
    console.log("=".repeat(colWidth + profiles.length * colWidth));

    // Build choices for multi-select
    const choices = Array.from(allKeys).map((key) => {
      const values = profiles.map((profile: string) => {
        const val = profilesData[profile][key];
        if (val === undefined) return chalk.gray("-");
        const display = options.reveal ? val : maskValue(key, val);
        return display.padEnd(colWidth).substring(0, colWidth);
      });
      
      const row = chalk.cyan(key.padEnd(colWidth)) + values.join("");
      console.log(row);
      
      return {
        name: `${chalk.cyan(key)} (across ${profiles.length} profiles)`,
        value: { key, profiles: profilesData },
        checked: false,
      };
    });

    console.log("\n");

    // Ask user to select variables to apply to .env
    const selected = await checkbox({
      message: "Select variables to copy to .env (you'll choose which profile next):",
      choices,
    });

    if (selected.length === 0) {
      console.log(chalk.yellow("No variables selected."));
      return;
    }

    // For each selected variable, show which profiles have it
    const toApply: Record<string, string> = {};
    
    for (const { key, profiles: allProfilesData } of selected) {
      const availableProfiles = configData.profiles.filter((p: string) => 
        allProfilesData[p][key] !== undefined
      );

      if (availableProfiles.length === 1) {
        toApply[key] = allProfilesData[availableProfiles[0]][key];
      } else {
        // Multiple profiles have this var, let user pick
        const profileChoices = availableProfiles.map((profile: string) => {
          const val = allProfilesData[profile][key];
          const display = options.reveal ? val : maskValue(key, val);
          return {
            name: `${profile}: ${display}`,
            value: val,
          };
        });

        const { select } = await import("@inquirer/prompts");
        const chosenValue = await select({
          message: `Choose value for ${chalk.cyan(key)}:`,
          choices: profileChoices,
        });

        toApply[key] = String(chosenValue);
      }
    }

    // Read current .env and apply
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
    await saveToHistory(`Applied ${Object.keys(toApply).length} variable(s) from matrix comparison`, currentEnv);

    console.log(chalk.green(`\n✔ Applied ${Object.keys(toApply).length} variable(s) to .env:`));
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
