import chalk from "chalk";
import { maskValue, readEnvFile } from "../utils/env.js";
import { getProjectName, getProjectUniquePath } from "../utils/project.js";
import { loadProfile, readFilesFromProject } from "../utils/storage.js";

export default async function diffCommand(
  profile1: string,
  profile2: string | undefined,
  options: { reveal?: boolean } = {},
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

    console.log(chalk.bold(`\nDiff: ${chalk.cyan(labelA)} vs ${chalk.cyan(labelB)}\n`));

    for (const key of allKeys) {
      const valA = a[key];
      const valB = b[key];

      if (valA === valB) continue;
      hasDiff = true;

      if (valA === undefined) {
        const display = options.reveal ? valB : maskValue(key, valB);
        console.log(chalk.green(`+ ${key}=${display}  [only in ${labelB}]`));
      } else if (valB === undefined) {
        const display = options.reveal ? valA : maskValue(key, valA);
        console.log(chalk.red(`- ${key}=${display}  [only in ${labelA}]`));
      } else {
        const dispA = options.reveal ? valA : maskValue(key, valA);
        const dispB = options.reveal ? valB : maskValue(key, valB);
        console.log(chalk.red(`- ${key}=${dispA}  [${labelA}]`));
        console.log(chalk.green(`+ ${key}=${dispB}  [${labelB}]`));
      }
    }

    if (!hasDiff) {
      console.log(chalk.green("\u2714 No differences found."));
    } else if (!options.reveal) {
      console.log(chalk.dim("\n  Tip: run with --reveal to show actual values."));
    }
  } catch (error: any) {
    console.log(chalk.red(error.message));
  }
}
