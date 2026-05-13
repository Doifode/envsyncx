import chalk from "chalk";
import inquirer from "inquirer";

import { readEnvFile } from "../utils/env.js";
import { getProjectName } from "../utils/project.js";
import {
  loadProfile,
  saveProfile,
} from "../utils/storage.js";

export async function syncCommand(profile: string) {
  try {
    const project = getProjectName();

    const example = readEnvFile(".env.example");

    const savedProfile = await loadProfile(
      project,
      profile
    );

    let updated = false;

    for (const key of Object.keys(example)) {
      if (!(key in savedProfile)) {
        console.log(
          chalk.yellow(
            `\nMissing variable detected: ${key}`
          )
        );

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

    if (updated) {
      await saveProfile(
        project,
        profile,
        savedProfile
      );

      console.log(
        chalk.green("\n✔ Profile synced successfully")
      );
    } else {
      console.log(
        chalk.green(
          "✔ Profile already up-to-date"
        )
      );
    }
  } catch (error: any) {
    console.log(chalk.red(error.message));
  }
}