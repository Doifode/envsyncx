import { execSync } from "child_process";
import inquirer from "inquirer";
import { getProjectName, getProjectUniquePath } from "../utils/project.js";
import {
  checkFileExistsInProject,
  createConfigFile,
  saveProfile,
} from "../utils/storage.js";

const configureEnvsyncx = async () => {
  const value = await inquirer.prompt([
    {
      type: "input",
      name: "continue",
      message: "Press Enter Y to continue, and N to cancel.",
    },
  ]);
  if (value.continue.toLowerCase() === "y") {
    const sourceOfTruthFileName = await inquirer.prompt([
      {
        type: "input",
        name: "filename",
        message:
          "Enter the source of truth .env file name (default: .env.example):",
      },
    ]);
    const fileExists = checkFileExistsInProject(sourceOfTruthFileName.filename);
    if (!fileExists) {
      console.log(
        "File not found. Please make sure you are in the correct project directory and the file exists.",
      );
      return;
    }
    const projectName = getProjectName();
    console.log(`Project name detected: ${projectName}`);
    console.log("Creating .envsyncx directory and saving initial profile...");

    const projectNamePrompt = await inquirer.prompt([
      {
        type: "input",
        name: "project",
        message:
          "Enter a name for your project (default: current directory name):",
        default: projectName,
      },
    ]);

    const profileNamePrompt = await inquirer.prompt([
      {
        type: "input",
        name: "profile",
        message:
          "Enter a name for your initial profile (default: 'development'):",
        default: "development",
      },
    ]);
    // consider full path to be unique identifier for project instead of just name, to avoid conflicts when multiple projects have same name but different paths
    const fullPathOfProject = getProjectUniquePath();
    console.log(`Full path of project: ${fullPathOfProject}`);

    const profileData = {
      sourceOfTruth: sourceOfTruthFileName.filename,
      project: projectNamePrompt.project,
      fullPath: fullPathOfProject,
    };

    await createConfigFile(profileData.project, fullPathOfProject, profileData);
    // run save command to create the first profile with the data from .env file, and if .env file doesn't exist, then use .env.example file, and if neither exists, then prompt user to enter values for the keys in .env.example file
    // how to run save command programmatically without calling the command in terminal? we can directly call the function that handles the save command and pass the necessary arguments to it, instead of executing it as a separate process. this way we can reuse the logic in the save command without duplicating code or relying on terminal commands. we just need to make sure to import the function from the save command file and call it with the appropriate parameters, such as the profile name and project name, along with any other required data.
    execSync(`esync save ${[profileNamePrompt.profile]}`, { stdio: "inherit" });

    console.log(
      "Initialization complete! Your first profile has been created.",
    );
  }
};

export async function initCommand() {
  try {
    console.log("Initializing .envsyncx...");

    console.log(
      "This will create a .envsyncx directory to store your profiles.",
    );
    await configureEnvsyncx();
  } catch (error) {
    console.error("An error occurred during initialization:", error);
  }
}
