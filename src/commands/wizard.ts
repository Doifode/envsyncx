import { select, checkbox, input, confirm } from "@inquirer/prompts";
import chalk from "chalk";
import inquirer from "inquirer";
import { maskValue } from "../utils/env.js";
import { getProjectName, getProjectUniquePath, validateProfileName } from "../utils/project.js";
import { loadProfile, saveProfile, readFilesFromProject } from "../utils/storage.js";

export default async function wizardCommand() {
  try {
    console.log(chalk.bold("\n🧙 Profile Creation Wizard\n"));

    const configData = readFilesFromProject("config.json");
    if (!configData) {
      console.log(chalk.red("Configuration file not found."));
      return;
    }

    // Step 1: Profile name
    const profileName = await input({
      message: "Enter new profile name:",
      validate: (value) => {
        if (!value) return "Profile name is required";
        const error = validateProfileName(value);
        if (error) return error;
        if (configData.profiles.includes(value)) {
          return `Profile '${value}' already exists`;
        }
        return true;
      },
    });

    // Step 2: Choose base profile
    let baseData: Record<string, string> = {};

    if (configData.profiles.length > 0) {
      const useBase = await confirm({
        message: "Start from an existing profile?",
        default: true,
      });

      if (useBase) {
        const baseProfile = await select({
          message: "Select base profile:",
          choices: [
            { name: chalk.dim("(None - start empty)"), value: null },
            ...configData.profiles.map((p: string) => ({ name: p, value: p })),
          ],
        });

        if (baseProfile) {
          const project = getProjectName();
          const uniquePath = getProjectUniquePath();
          baseData = await loadProfile(project, baseProfile, uniquePath);

          // Step 3: Select variables to inherit
          if (Object.keys(baseData).length > 0) {
            const selectedVars = await checkbox({
              message: "Select variables to inherit:",
              choices: Object.keys(baseData).map((key) => ({
                name: `${chalk.cyan(key)}: ${chalk.dim(maskValue(key, baseData[key]))}`,
                value: key,
                checked: true, // Pre-select all
              })),
            });

            // Filter base data to only include selected
            const filtered: Record<string, string> = {};
            selectedVars.forEach((key) => {
              filtered[key] = baseData[key];
            });
            baseData = filtered;
          }
        }
      }
    }

    // Step 4: Add/modify variables
    const finalData = { ...baseData };

    console.log(chalk.bold("\n📝 Configure Variables\n"));

    const continueAdding = async (): Promise<void> => {
      const action = await select({
        message: "What would you like to do?",
        choices: [
          { name: "Add new variable", value: "add" },
          { name: "Modify existing variable", value: "modify" },
          { name: "Remove variable", value: "remove" },
          { name: "Review and save", value: "done" },
        ],
      });

      if (action === "add") {
        const { key, value } = await inquirer.prompt([
          {
            type: "input",
            name: "key",
            message: "Variable name:",
            validate: (val: string) => (val ? true : "Name is required"),
          },
          {
            type: "input",
            name: "value",
            message: "Variable value:",
          },
        ]);

        finalData[key] = value;
        console.log(chalk.green(`✔ Added ${key}`));
        return continueAdding();
      } else if (action === "modify") {
        if (Object.keys(finalData).length === 0) {
          console.log(chalk.yellow("No variables to modify."));
          return continueAdding();
        }

        const keyToModify = await select({
          message: "Select variable to modify:",
          choices: Object.keys(finalData).map((k) => ({ name: k, value: k })),
        });

        const { newValue } = await inquirer.prompt([
          {
            type: "input",
            name: "newValue",
            message: `New value for ${keyToModify}:`,
            default: finalData[keyToModify],
          },
        ]);

        finalData[keyToModify] = newValue;
        console.log(chalk.green(`✔ Updated ${keyToModify}`));
        return continueAdding();
      } else if (action === "remove") {
        if (Object.keys(finalData).length === 0) {
          console.log(chalk.yellow("No variables to remove."));
          return continueAdding();
        }

        const toRemove = await checkbox({
          message: "Select variables to remove:",
          choices: Object.keys(finalData).map((k) => ({ name: k, value: k })),
          required: true,
        });

        toRemove.forEach((key) => delete finalData[key]);
        console.log(chalk.green(`✔ Removed ${toRemove.length} variable(s)`));
        return continueAdding();
      }
    };

    await continueAdding();

    // Step 5: Review and confirm
    console.log(chalk.bold("\n📋 Review Profile\n"));
    console.log(chalk.cyan(`Name: ${profileName}`));
    console.log(chalk.cyan(`Variables: ${Object.keys(finalData).length}\n`));

    for (const [key, value] of Object.entries(finalData)) {
      console.log(`  ${chalk.cyan(key)}: ${maskValue(key, value)}`);
    }

    const confirmed = await confirm({
      message: "\nSave this profile?",
      default: true,
    });

    if (!confirmed) {
      console.log(chalk.yellow("Profile creation cancelled."));
      return;
    }

    // Save profile
    const project = getProjectName();
    const uniquePath = getProjectUniquePath();

    await saveProfile(project, profileName, finalData, uniquePath);

    console.log(chalk.green(`\n✔ Profile '${profileName}' created successfully!`));
  } catch (error: any) {
    console.log(chalk.red(`Error: ${error.message}`));
  }
}
