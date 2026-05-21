import fs from "fs";
import chalk from "chalk";
import inquirer from "inquirer";

import { readEnvFile, writeEnvFile } from "../utils/env.js";

import { getProjectName, getProjectUniquePath, validateProfileName } from "../utils/project.js";

import {
  isProjectInitialized,
  readFilesFromProject,
  saveProfile,
} from "../utils/storage.js";
import { saveToHistory } from "./history.js";

export async function saveCommand(profile: string) {
  try {
    const validationError = validateProfileName(profile);
    if (validationError) {
      console.log(chalk.red(`\u274c Invalid profile name: ${validationError}`));
      return;
    }

    const isInitialized = isProjectInitialized(getProjectUniquePath());
    if (!isInitialized) {
      console.log(chalk.red("❌ Project not initialized"));
      return;
    }

    // read json file from .envsyncx/profiles/{projectName}_{fullPathOfProject}.json if exists, otherwise read from .env or .env.example and create the file

    const fullPathOfProject = getProjectUniquePath();
    const project = getProjectName();
    const readJson = fs.readFileSync(
      `.envsyncx/${fullPathOfProject}/${project}/config.json`,
      "utf-8",
    );

    const config = JSON.parse(readJson);
    const sourceOfTruthFileName = config.sourceOfTruth;
    let env: Record<string, string> = {};

    // CASE 1 -> .env exists
    if (fs.existsSync(".env")) {
      env = readEnvFile(".env");
    }

    // CASE 2 -> .env missing but .env.example exists
    else if (fs.existsSync(sourceOfTruthFileName)) {
      console.log(
        chalk.yellow(".env not found. Creating from .env.example...\n"),
      );

      const example = readEnvFile(sourceOfTruthFileName);

      for (const key of Object.keys(example)) {
        const answer = await inquirer.prompt([
          {
            type: "input",
            name: "value",
            message: `Enter value for ${key}:`,
          },
        ]);

        env[key] = answer.value;
      }

      // create .env automatically
      writeEnvFile(".env", env);

      console.log(chalk.green("✔ .env created successfully\n"));
    }

    // CASE 3 -> nothing exists
    else {
      console.log(chalk.red("❌ No .env or .env.example file found"));

      return;
    }

    const configData = readFilesFromProject("config.json"); // already loaded above as `config`
    if (!configData) {
      console.log(chalk.red(`Configuration file not found.`));
      return;
    }
    if (configData.profiles?.includes(profile)) {
      const { confirm } = await inquirer.prompt([
        {
          type: "confirm",
          name: "confirm",
          message: `Profile '${profile}' already exists. Overwrite?`,
          default: false,
        },
      ]);
      if (!confirm) {
        console.log(chalk.yellow("Aborted."));
        return;
      }
    }
    await saveProfile(project, profile, env, fullPathOfProject);

    // Save to history
    await saveToHistory(`Saved current .env to profile '${profile}'`, env, profile);

    console.log(chalk.green(`✔ Saved profile '${profile}'`));
  } catch (error: any) {
    console.log(chalk.red(error.message));
  }
}
