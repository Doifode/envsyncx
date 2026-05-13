import fs from "fs";
import chalk from "chalk";
import inquirer from "inquirer";

import {
  readEnvFile,
  writeEnvFile,
} from "../utils/env.js";

import { getProjectName } from "../utils/project.js";

import { saveProfile } from "../utils/storage.js";

export async function saveCommand(profile: string) {
  try {
    let env: Record<string, string> = {};

    // CASE 1 -> .env exists
    if (fs.existsSync(".env")) {
      env = readEnvFile(".env");
    }

    // CASE 2 -> .env missing but .env.example exists
    else if (fs.existsSync(".env.example")) {
      console.log(
        chalk.yellow(
          ".env not found. Creating from .env.example...\n"
        )
      );

      const example = readEnvFile(".env.example");

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

      console.log(
        chalk.green("✔ .env created successfully\n")
      );
    }

    // CASE 3 -> nothing exists
    else {
      console.log(
        chalk.red(
          "❌ No .env or .env.example file found"
        )
      );

      return;
    }

    const project = getProjectName();

    await saveProfile(project, profile, env);

    console.log(
      chalk.green(`✔ Saved profile '${profile}'`)
    );
  } catch (error: any) {
    console.log(chalk.red(error.message));
  }
}