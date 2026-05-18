import chalk from "chalk";
import {
  checkFileExistsInProject,
  readFilesFromProject,
  updateProjectFiles,
} from "../utils/storage.js";
import { doctorCommand } from "./doctor.js";

export default async function setSourceOfTruth(source: string) {
  try {
    const checkFileExists = checkFileExistsInProject(source);
    if (!checkFileExists) {
      console.log(chalk.red(`Source of truth file '${source}' not found in project.`));
      return;
    }

    const configData = readFilesFromProject("config.json");
    if (!configData) {
      console.log(chalk.red("Configuration file not found."));
      return;
    }

    if (configData.sourceOfTruth === source) {
      console.log(chalk.yellow(`Source of truth is already set to '${source}'.`));
      return;
    }
    await updateProjectFiles(
      configData.project,
      configData.fullPath,
      "config.json",    
      (data) => ({
        ...data,
        sourceOfTruth: source,
      }),
    );
    console.log(chalk.green(`\u2714 Source of truth set to '${source}' successfully.`));
    await doctorCommand();
  } catch (error: any) {
    console.log(chalk.red(`Error setting source of truth: ${error.message}`));
  }
}
