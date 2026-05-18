import chalk from "chalk";
import { writeEnvFile } from "../utils/env.js";
import { getProjectName, getProjectUniquePath } from "../utils/project.js";
import { loadProfile, readFilesFromProject } from "../utils/storage.js";

export default async function exportCommand(profile: string, filepath: string) {
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
    const data = await loadProfile(project, profile, uniquePath);

    writeEnvFile(filepath, data);
    console.log(chalk.green(`✔ Profile '${profile}' exported to '${filepath}'.`));
  } catch (error: any) {
    console.log(chalk.red(error.message));
  }
}
