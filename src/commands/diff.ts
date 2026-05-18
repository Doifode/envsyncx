import chalk from "chalk";
import { readEnvFile } from "../utils/env.js";
import { getProjectName, getProjectUniquePath } from "../utils/project.js";
import { loadProfile, readFilesFromProject } from "../utils/storage.js";

export default async function diffCommand(
  profile1: string,
  profile2?: string,
) {
  try {
    const project = getProjectName();
    const uniquePath = getProjectUniquePath();

    const configData = readFilesFromProject("config.json");
    if (!configData) {
      console.log(chalk.red("Configuration file not found."));
      return;
    }

    if (!configData.profiles.includes(profile1)) {
      console.log(chalk.red(`Profile '${profile1}' not found.`));
      return;
    }

    const a = await loadProfile(project, profile1, uniquePath);
    const labelA = `profile:${profile1}`;

    let b: Record<string, string>;
    let labelB: string;

    if (profile2) {
      if (!configData.profiles.includes(profile2)) {
        console.log(chalk.red(`Profile '${profile2}' not found.`));
        return;
      }
      b = await loadProfile(project, profile2, uniquePath);
      labelB = `profile:${profile2}`;
    } else {
      b = readEnvFile(".env");
      labelB = ".env";
    }

    const allKeys = new Set([...Object.keys(a), ...Object.keys(b)]);
    let hasDiff = false;

    console.log(
      chalk.bold(`\nDiff: ${chalk.cyan(labelA)} vs ${chalk.cyan(labelB)}\n`),
    );

    for (const key of allKeys) {
      const valA = a[key];
      const valB = b[key];

      if (valA === valB) continue;
      hasDiff = true;

      if (valA === undefined) {
        console.log(chalk.green(`+ ${key}=${valB}  [only in ${labelB}]`));
      } else if (valB === undefined) {
        console.log(chalk.red(`- ${key}=${valA}  [only in ${labelA}]`));
      } else {
        console.log(chalk.red(`- ${key}=${valA}  [${labelA}]`));
        console.log(chalk.green(`+ ${key}=${valB}  [${labelB}]`));
      }
    }

    if (!hasDiff) {
      console.log(chalk.green("✔ No differences found."));
    }
  } catch (error: any) {
    console.log(chalk.red(error.message));
  }
}
