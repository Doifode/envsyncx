import chalk from "chalk";
import fs from "fs-extra";
import { getProjectName, getProjectUniquePath, validateProfileName } from "../utils/project.js";
import {
  getProfilePath,
  readFilesFromProject,
  updateProjectFiles,
} from "../utils/storage.js";
export default async function renameProfile(
  oldProfile: string,
  newProfile: string,
) {
  try {
    const configData = readFilesFromProject("config.json");

    if (!configData) {
      console.log(`Configuration file not found.`);
      return;
    }

    if (!configData.profiles.includes(oldProfile)) {
      console.log(`Profile '${oldProfile}' not found.`);
      return;
    }
    const nameError = validateProfileName(newProfile);
    if (nameError) {
      console.log(chalk.red(`\u274c Invalid profile name: ${nameError}`));
      return;
    }
    if (configData.profiles.includes(newProfile)) {
      console.log(`Profile '${newProfile}' already exists.`);
      return;
    }

    const project = getProjectName();
    const uniquePath = getProjectUniquePath();
    const oldFilePath = getProfilePath(project, oldProfile, uniquePath);
    const newFilePath = getProfilePath(project, newProfile, uniquePath);

    await fs.rename(oldFilePath, newFilePath);

    await updateProjectFiles(project, uniquePath, "config.json", (data) => ({
      ...data,
      profiles: data.profiles.map((p: string) =>
        p === oldProfile ? newProfile : p,
      ),
    }));

    console.log(chalk.green(`✔ Profile '${oldProfile}' renamed to '${newProfile}'.`));
  } catch (error) {
    console.log(chalk.red(`Error renaming profile '${oldProfile}' to '${newProfile}'.`));
  }
}
