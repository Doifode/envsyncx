import chalk from "chalk";
import fs from "fs";
import path from "path";
import inquirer from "inquirer";
import { getProjectName, getProjectUniquePath, validateProfileName } from "../utils/project.js";
import {
  checkFileExistsInProject,
  createConfigFile,
  isProjectInitialized,
} from "../utils/storage.js";
import { saveCommand } from "./save.js";

const configureEnvsyncx = async () => {
  const uniquePath = getProjectUniquePath();

  if (isProjectInitialized(uniquePath)) {
    const { overwrite } = await inquirer.prompt([{
      type: "confirm",
      name: "overwrite",
      message: chalk.yellow("This project is already initialized. Re-initializing will reset config. Continue?"),
      default: false,
    }]);
    if (!overwrite) {
      console.log(chalk.yellow("Aborted."));
      return;
    }
  }

  const { proceed } = await inquirer.prompt([{
    type: "confirm",
    name: "proceed",
    message: "This will create a .envsyncx directory to store your profiles. Continue?",
    default: true,
  }]);
  if (!proceed) {
    console.log(chalk.yellow("Aborted."));
    return;
  }

  const { filename } = await inquirer.prompt([{
    type: "input",
    name: "filename",
    message: "Enter the source of truth .env file name:",
    default: ".env.example",
  }]);
  const fileExists = checkFileExistsInProject(filename);
  if (!fileExists) {
    console.log(chalk.red(
      "File not found. Please make sure you are in the correct project directory and the file exists.",
    ));
    return;
  }

  const projectName = getProjectName();
  console.log(chalk.dim(`Project name detected: ${projectName}`));

  const { project } = await inquirer.prompt([{
    type: "input",
    name: "project",
    message: "Enter a name for your project:",
    default: projectName,
  }]);

  const { profile } = await inquirer.prompt([{
    type: "input",
    name: "profile",
    message: "Enter a name for your initial profile:",
    default: "development",
    validate: (input: string) => validateProfileName(input) ?? true,
  }]);

  const fullPathOfProject = getProjectUniquePath();
  const profileData = {
    sourceOfTruth: filename,
    project,
    fullPath: fullPathOfProject,
  };

  await createConfigFile(project, fullPathOfProject, profileData);
  await saveCommand(profile);

  // ensure .env and .envsyncx are in .gitignore
  const gitignorePath = path.join(process.cwd(), ".gitignore");
  const entriesToIgnore = [".env", ".envsyncx"];
  if (fs.existsSync(gitignorePath)) {
    const lines = fs.readFileSync(gitignorePath, "utf-8").split("\n").map((l) => l.trim());
    const toAdd = entriesToIgnore.filter((e) => !lines.includes(e));
    if (toAdd.length > 0) {
      fs.appendFileSync(gitignorePath, `\n${toAdd.join("\n")}\n`);
      console.log(chalk.dim(`Added ${toAdd.join(", ")} to .gitignore`));
    }
  } else {
    fs.writeFileSync(gitignorePath, `${entriesToIgnore.join("\n")}\n`);
    console.log(chalk.dim(`Created .gitignore with ${entriesToIgnore.join(", ")}`));
  }

  console.log(chalk.green("\n\u2714 Initialization complete! Your first profile has been created."));
};

export async function initCommand() {
  try {
    console.log(chalk.bold("Initializing .envsyncx..."));
    await configureEnvsyncx();
  } catch (error: any) {
    console.error(chalk.red(`An error occurred during initialization: ${error.message}`));
  }
}
