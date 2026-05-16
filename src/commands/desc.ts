import { select } from "@inquirer/prompts";
import chalk from "chalk";
import { readFilesFromProject } from "../utils/storage.js";

const printProfileValues = (profile: string) => {
  try {
    const profileData = readFilesFromProject(`${profile}.json`);
    console.log(chalk.green(`\nProfile: ${profile}\n`));
    for (const [key, value] of Object.entries(profileData)) {
      console.log(chalk.blue(`${key}: ${value}`));
    }
  } catch (error) {
    console.error(chalk.red(`Error reading profile '${profile}':`));
  }
};

export default async function descCommand() {
  try {
    const configData = readFilesFromProject("config.json");

    if (configData.profiles.length === 0) {
      console.log(chalk.yellow("No profiles found."));
      return;
    }

    console.log(chalk.green("Available profiles:"));
    configData.profiles.forEach((profile: string) => {
      console.log(chalk.blue(`- ${profile}`));
    });

    const selectedProfile = await select<string>({
      message: "Select a profile to view its details:",
      choices: configData.profiles.map((p: string) => ({ name: p, value: p })),
    });

    printProfileValues(selectedProfile);
  } catch (error) {
    console.error(chalk.red("Error reading project configuration:"));
  }
}
