import chalk from "chalk";
import fs from "fs-extra";
import { getProjectName, getProjectUniquePath } from "../utils/project.js";
import {
  getProfilePath,
  readFilesFromProject,
  updateProjectFiles,
} from "../utils/storage.js";

export default async function deleteProfile(profile: string) {
  try {
    const configData = readFilesFromProject("config.json");
    if (!configData) {
      console.log(chalk.red(`Configuration file not found.`));
      return;
    }

    if (!configData.profiles.includes(profile)) {
      console.log(chalk.red(`Profile '${profile}' not found.`));
      return;
    }

    const project = getProjectName();
    const uniquePath = getProjectUniquePath();
    const filePath = getProfilePath(project, profile, uniquePath);

    if (!fs.existsSync(filePath)) {
      console.log(chalk.red(`Profile file not found at '${filePath}'.`));
      return;
    }

    fs.removeSync(filePath);

    await updateProjectFiles(project, uniquePath, "config.json", (data) => ({
      ...data,
      profiles: data.profiles.filter((p: string) => p !== profile),
    }));

    console.log(chalk.green(`✔ Profile '${profile}' deleted successfully.`));
  } catch (error) {
    console.log(chalk.red(`Error deleting profile '${profile}'.`));
  }
}
