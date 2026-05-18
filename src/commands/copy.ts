import chalk from "chalk";
import { getProjectName, getProjectUniquePath } from "../utils/project.js";
import {
  loadProfile,
  readFilesFromProject,
  saveProfile,
} from "../utils/storage.js";

export default async function copyProfile(
  sourceProfile: string,
  newProfile: string,
) {
  try {
    const configData = readFilesFromProject("config.json");
    if (!configData) {
      console.log(chalk.red("Configuration file not found."));
      return;
    }

    if (!configData.profiles.includes(sourceProfile)) {
      console.log(chalk.red(`Profile '${sourceProfile}' not found.`));
      return;
    }

    if (configData.profiles.includes(newProfile)) {
      console.log(chalk.red(`Profile '${newProfile}' already exists.`));
      return;
    }

    const project = getProjectName();
    const uniquePath = getProjectUniquePath();
    const data = await loadProfile(project, sourceProfile, uniquePath);

    await saveProfile(project, newProfile, data, uniquePath);

    console.log(
      chalk.green(`✔ Profile '${sourceProfile}' copied to '${newProfile}'.`),
    );
  } catch (error: any) {
    console.log(chalk.red(error.message));
  }
}
