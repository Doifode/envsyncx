import chalk from "chalk";
import { readEnvFile, writeEnvFile } from "../utils/env.js";
import { readFilesFromProject, updateProjectFiles } from "../utils/storage.js";
import inquirer from "inquirer";

export async function doctorCommand() {
  try {
    const configData = readFilesFromProject("config.json");
    if (!configData) {
      console.log(chalk.red(`Configuration file not found.`));
      return;
    }
    const sourceOfTruthFileName = configData.sourceOfTruth;
    const env = readEnvFile(".env");
    const example = readEnvFile(sourceOfTruthFileName);

    const missing: string[] = [];

    for (const key of Object.keys(example)) {
      if (!env[key]) {
        missing.push(key);
      }
    }
    const stale: string[] = [];
    for (const key of Object.keys(env)) {
      if (!(key in example)) {
        stale.push(key);
      }
    }

    if (stale.length > 0) {
      console.log(
        chalk.red(`\nStale variables (not in ${sourceOfTruthFileName}):\n`),
      );
      stale.forEach((key) => console.log(chalk.yellow(`- ${key}`)));
      // ask user if they want to remove the stale variables from .env
      const { removeStale } = await inquirer.prompt([
        {
          type: "confirm",
          name: "removeStale",
          message:
            "Do you want to remove the stale variables from .env? enter 'y' to remove, 'n' to keep",
        },
      ]);
      if (removeStale) {
        for (const key of stale) {
          delete env[key];
        }
      }
    }
    writeEnvFile(".env", env);

    if (missing.length === 0) {
      console.log(
        chalk.green(
          "✔ No missing variables in .env compared to source of truth file.",
        ),
      );
      return;
    }

    console.log(
      chalk.red(
        `Missing variables or variable values (in ${sourceOfTruthFileName} but not in .env):\n`,
      ),
    );

    missing.forEach((key) => {
      console.log(chalk.yellow(`- ${key}`));
    });
  } catch (error: any) {
    console.log(chalk.red(error.message));
  }
}
