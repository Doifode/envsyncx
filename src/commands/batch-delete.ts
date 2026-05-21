import { checkbox, confirm } from "@inquirer/prompts";
import chalk from "chalk";
import fs from "fs-extra";
import { getProjectName, getProjectUniquePath } from "../utils/project.js";
import { getProfilePath, readFilesFromProject, updateProjectFiles } from "../utils/storage.js";

export default async function batchDeleteCommand() {
  try {
    const configData = readFilesFromProject("config.json");
    if (!configData) {
      console.log(chalk.red("Configuration file not found."));
      return;
    }

    if (configData.profiles.length === 0) {
      console.log(chalk.yellow("No profiles found."));
      return;
    }

    const activeProfile = configData.activeProfile;

    // Show multi-select for profiles
    const selectedProfiles = await checkbox({
      message: "Select profiles to delete:",
      choices: configData.profiles.map((profile: string) => ({
        name: profile === activeProfile 
          ? `${profile} ${chalk.red("(active - will be unset)")}`
          : profile,
        value: profile,
        checked: false,
      })),
      required: true,
    });

    if (selectedProfiles.length === 0) {
      console.log(chalk.yellow("No profiles selected. Operation cancelled."));
      return;
    }

    // Confirm deletion
    const confirmed = await confirm({
      message: `Are you sure you want to delete ${selectedProfiles.length} profile(s)? This cannot be undone.`,
      default: false,
    });

    if (!confirmed) {
      console.log(chalk.yellow("Operation cancelled."));
      return;
    }

    const project = getProjectName();
    const uniquePath = getProjectUniquePath();

    let deletedCount = 0;
    let failedCount = 0;

    // Delete each profile
    for (const profile of selectedProfiles) {
      try {
        const filePath = getProfilePath(project, String(profile), uniquePath);
        
        if (fs.existsSync(filePath)) {
          fs.removeSync(filePath);
          deletedCount++;
        } else {
          console.log(chalk.yellow(`  ⚠ Profile file not found: ${profile}`));
          failedCount++;
        }
      } catch (err) {
        console.log(chalk.red(`  ✗ Failed to delete: ${profile}`));
        failedCount++;
      }
    }

    // Update config to remove deleted profiles
    await updateProjectFiles(project, uniquePath, "config.json", (data) => {
      const newProfiles = data.profiles.filter((p: string) => !selectedProfiles.includes(p));
      const newActiveProfile = selectedProfiles.includes(data.activeProfile) 
        ? undefined 
        : data.activeProfile;
      
      return {
        ...data,
        profiles: newProfiles,
        activeProfile: newActiveProfile,
      };
    });

    console.log(chalk.green(`\n✔ Deleted ${deletedCount} profile(s) successfully.`));
    if (failedCount > 0) {
      console.log(chalk.yellow(`  ⚠ ${failedCount} profile(s) failed to delete.`));
    }
    if (selectedProfiles.includes(activeProfile)) {
      console.log(chalk.yellow("  ℹ Active profile was cleared."));
    }
  } catch (error: any) {
    console.log(chalk.red(`Error: ${error.message}`));
  }
}
