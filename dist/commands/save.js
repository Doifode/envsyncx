import fs from "fs";
import chalk from "chalk";
import inquirer from "inquirer";
import { readEnvFile, writeEnvFile } from "../utils/env.js";
import { getProjectName, getProjectUniquePath } from "../utils/project.js";
import { isProjectInitialized, saveProfile } from "../utils/storage.js";
export async function saveCommand(profile) {
    try {
        const isInitialized = isProjectInitialized(getProjectUniquePath());
        if (!isInitialized) {
            console.log(chalk.red("❌ Project not initialized"));
            return;
        }
        // read json file from .envsyncx/profiles/{projectName}_{fullPathOfProject}.json if exists, otherwise read from .env or .env.example and create the file
        const fullPathOfProject = getProjectUniquePath();
        const project = getProjectName();
        const readJson = fs.readFileSync(`.envsyncx/${fullPathOfProject}/${project}/config.json`, "utf-8");
        const config = JSON.parse(readJson);
        const sourceOfTruthFileName = config.sourceOfTruth;
        let env = {};
        // CASE 1 -> .env exists
        if (fs.existsSync(".env")) {
            env = readEnvFile(".env");
        }
        // CASE 2 -> .env missing but .env.example exists
        else if (fs.existsSync(sourceOfTruthFileName)) {
            console.log(chalk.yellow(".env not found. Creating from .env.example...\n"));
            const example = readEnvFile(sourceOfTruthFileName);
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
            console.log(chalk.green("✔ .env created successfully\n"));
        }
        // CASE 3 -> nothing exists
        else {
            console.log(chalk.red("❌ No .env or .env.example file found"));
            return;
        }
        await saveProfile(project, profile, env, fullPathOfProject);
        console.log(chalk.green(`✔ Saved profile '${profile}'`));
    }
    catch (error) {
        console.log(chalk.red(error.message));
    }
}
