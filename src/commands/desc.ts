import { select } from "@inquirer/prompts";
import chalk from "chalk";
import { maskValue } from "../utils/env.js";
import { readFilesFromProject } from "../utils/storage.js";

const printProfileValues = (profile: string, reveal: boolean) => {
  try {
    const profileData = readFilesFromProject(`${profile}.json`);
    if (!profileData) {
      console.log(chalk.red(`Profile '${profile}' not found.`));
      return;
    }
    console.log(chalk.green(`\nProfile: ${profile}\n`));
    for (const [key, value] of Object.entries(profileData)) {
      const display = reveal ? String(value) : maskValue(key, String(value));
      console.log(`  ${chalk.cyan(key)}: ${display}`);
    }
    if (!reveal) {
      console.log(chalk.dim("\n  Tip: run with --reveal to show sensitive values."));
    }
  } catch (error) {
    console.error(chalk.red(`Error reading profile '${profile}'.`));
  }
};

export default async function descCommand(options: { reveal?: boolean } = {}) {
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

    const selectedProfile = await select<string>({
      message: "Select a profile to view its details:",
      choices: configData.profiles.map((p: string) => ({
        name: p === configData.activeProfile ? `${p} (active)` : p,
        value: p,
      })),
    });

    printProfileValues(selectedProfile, options.reveal ?? false);
  } catch (error) {
    console.error(chalk.red("Error reading project configuration."));
  }
}
