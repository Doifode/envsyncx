import { checkbox } from "@inquirer/prompts";
import chalk from "chalk";
import { maskValue } from "../utils/env.js";
import { getProjectName, getProjectUniquePath } from "../utils/project.js";
import { loadProfile, readFilesFromProject } from "../utils/storage.js";

export default async function searchCommand(keyword: string, options: { reveal?: boolean } = {}) {
  try {
    if (!keyword) {
      console.log(chalk.red("Please provide a search keyword."));
      console.log(chalk.dim("Usage: esync search <keyword> [--reveal]"));
      return;
    }

    const configData = readFilesFromProject("config.json");
    if (!configData) {
      console.log(chalk.red("Configuration file not found."));
      return;
    }

    if (configData.profiles.length === 0) {
      console.log(chalk.yellow("No profiles found."));
      return;
    }

    const project = getProjectName();
    const uniquePath = getProjectUniquePath();

    // Search across all profiles
    const results: Array<{
      profile: string;
      key: string;
      value: string;
    }> = [];

    const searchLower = keyword.toLowerCase();

    for (const profile of configData.profiles) {
      const profileData = await loadProfile(project, profile, uniquePath);
      
      for (const [key, value] of Object.entries(profileData)) {
        if (
          key.toLowerCase().includes(searchLower) ||
          String(value).toLowerCase().includes(searchLower)
        ) {
          results.push({ profile, key, value: String(value) });
        }
      }
    }

    if (results.length === 0) {
      console.log(chalk.yellow(`No variables found matching "${keyword}"`));
      return;
    }

    console.log(chalk.green(`\n🔍 Found ${results.length} match(es) for "${keyword}":\n`));

    // Group by profile
    const byProfile: Record<string, typeof results> = {};
    results.forEach((result) => {
      if (!byProfile[result.profile]) {
        byProfile[result.profile] = [];
      }
      byProfile[result.profile].push(result);
    });

    // Display grouped results
    for (const [profile, matches] of Object.entries(byProfile)) {
      console.log(chalk.bold(`\n${profile}:`));
      matches.forEach(({ key, value }) => {
        const display = options.reveal ? value : maskValue(key, value);
        console.log(`  ${chalk.cyan(key)}: ${display}`);
      });
    }

    // Multi-select to view or apply
    const choices = results.map(({ profile, key, value }) => {
      const display = options.reveal ? value : maskValue(key, value);
      return {
        name: `${chalk.cyan(key)} = ${display} ${chalk.gray(`[${profile}]`)}`,
        value: { key, value, profile },
        checked: false,
      };
    });

    console.log("\n");

    const selected = await checkbox({
      message: "Select variables to view details (or press Enter to skip):",
      choices,
    });

    if (selected.length > 0) {
      console.log(chalk.green("\n✔ Selected variables:"));
      selected.forEach(({ key, value, profile }) => {
        console.log(`  ${chalk.cyan(key)} = ${value} ${chalk.dim(`from ${profile}`)}`);
      });
    }
  } catch (error: any) {
    console.log(chalk.red(`Error: ${error.message}`));
  }
}
