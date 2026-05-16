import {
  checkFileExistsInProject,
  readFilesFromProject,
  updateProjectFiles,
} from "../utils/storage.js";
import { execSync } from "child_process";

export default async function setSourceOfTruth(source: string) {
  try {
    const checkFileExists = checkFileExistsInProject(source);
    if (!checkFileExists) {
      console.log(`Source of truth file '${source}' not found in project.`);
      return;
    }

    const configData = readFilesFromProject("config.json");

    if (!configData) {
      console.log(`Configuration file not found.`);
      return;
    }

    if (configData.sourceOfTruth === source) {
      console.log(`Same source of truth '${source}' is already set.`);
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
    console.log(`Source of truth set to '${source}' successfully.`);
    execSync(`envsyncx doctor`, { stdio: "inherit" });
  } catch (error) {
    console.log(`Error setting source of truth to '${source}':`);
  }
}
