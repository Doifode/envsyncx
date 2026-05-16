import chalk from "chalk";
import { readFilesFromProject } from "../utils/storage.js";

export default function listProfilesCommand() {
  try {
    const configData = readFilesFromProject("config.json");

    if (configData.profiles.length === 0) {
      console.log("No profiles found.");
    } else {
      console.log("Profiles:");
      configData.profiles.forEach((profile: string) => {
        console.log(chalk.green(`- ${profile}`));
      });
    }
  } catch (error) {
    console.error("Error reading project configuration:");
  }
}
