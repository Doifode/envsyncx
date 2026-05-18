import chalk from "chalk";
import inquirer from "inquirer";

import { readEnvFile } from "../utils/env.js";
import { getProjectName, getProjectUniquePath } from "../utils/project.js";
import { loadProfile, updateProjectFiles } from "../utils/storage.js";
import { switchCommand } from "./switch.js";

export async function syncCommand(profile: string) {
  try {
    // get project name and unique path for profile storage
    // get source of truth file name from .envsyncx/profiles/{projectName}_{fullPathOfProject}.json to ensure we are checking against the correct file, in case user has multiple projects with different source of truth files
    const project = getProjectName();
    const fullPathOfProject = getProjectUniquePath();
    const readJson = await loadProfile(project, "config", fullPathOfProject);
    const sourceOfTruthFileName = readJson.sourceOfTruth;
    const example = readEnvFile(sourceOfTruthFileName);

    const savedProfile = await loadProfile(project, profile, fullPathOfProject);

    let updated = false;

    for (const key of Object.keys(example)) {
      if (!(key in savedProfile)) {
        console.log(chalk.yellow(`\nMissing variable detected: ${key}`));

        const answer = await inquirer.prompt([
          {
            type: "input",
            name: "value",
            message: `Enter value for ${key}:`,
          },
        ]);

        savedProfile[key] = answer.value;

        updated = true;
      }
    }

    // remove keys no longer in source-of-truth
    for (const key of Object.keys(savedProfile)) {
      if (!(key in example)) {
        console.log(chalk.yellow(`\nRemoving stale key: ${key}`));
        delete savedProfile[key];
        updated = true;
      }
    }

    if (updated) {
      await updateProjectFiles(
        project,
        fullPathOfProject,
        `${profile}.json`,
        (configData) => ({
          ...configData,
          ...savedProfile,
        }),
      );

      await switchCommand(profile);

      console.log(chalk.green("\n✔ Profile synced successfully"));
    } else {
      console.log(chalk.green("✔ Profile already up-to-date"));
    }
  } catch (error: any) {
    console.log(chalk.red(error.message));
  }
}
