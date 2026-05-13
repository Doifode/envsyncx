import chalk from "chalk";
import { readEnvFile } from "../utils/env.js";
export async function doctorCommand() {
    try {
        const env = readEnvFile(".env");
        const example = readEnvFile(".env.example");
        const missing = [];
        for (const key of Object.keys(example)) {
            if (!env[key]) {
                missing.push(key);
            }
        }
        if (missing.length === 0) {
            console.log(chalk.green("✔ All env variables present"));
            return;
        }
        console.log(chalk.red("Missing variables:\n"));
        missing.forEach((key) => {
            console.log(chalk.yellow(`- ${key}`));
        });
    }
    catch (error) {
        console.log(chalk.red(error.message));
    }
}
