import chalk from "chalk";
import { readFilesFromProject } from "../utils/storage.js";

export default function listProfilesCommand() {
  try {
    const configData = readFilesFromProject("config.json");
    if (!configData) {
      console.log(chalk.red(`Configuration file not found.`));
      return;
    }

    if (configData.profiles.length === 0) {
      console.log("No profiles found.");
    } else {
      const active: string | undefined = configData.activeProfile;
      console.log("Profiles:");
      configData.profiles.forEach((profile: string) => {
        if (profile === active) {
          console.log(chalk.green(`* ${profile}`) + chalk.dim(" (active)"));
        } else {
          console.log(chalk.blue(`  ${profile}`));
        }
      });
    }
  } catch (error) {
    console.error("Error reading project configuration:");
  }
}
