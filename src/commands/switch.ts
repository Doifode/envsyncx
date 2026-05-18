import chalk from "chalk";
import fs from "fs";

import { writeEnvFile } from "../utils/env.js";

import { getProjectName, getProjectUniquePath } from "../utils/project.js";

import { loadProfile, updateProjectFiles } from "../utils/storage.js";

export async function switchCommand(profile: string) {
  try {
    const project = getProjectName();

    const fullPathOfProject = getProjectUniquePath();

    const env = await loadProfile(project, profile, fullPathOfProject);

    if (!env || Object.keys(env).length === 0) {
      console.log(chalk.red("❌ Profile is empty"));

      return;
    }

    // recreate .env
    writeEnvFile(".env", env);

    // verify file exists
    if (fs.existsSync(".env")) {
      console.log(chalk.green(`✔ Restored .env from profile '${profile}'`));
    } else {
      console.log(chalk.red("❌ Failed to create .env"));
      return;
    }

    // track the active profile in config
    await updateProjectFiles(project, fullPathOfProject, "config.json", (data) => ({
      ...data,
      activeProfile: profile,
    }));
  } catch (error: any) {
    console.log(chalk.red(error.message));
  }
}
