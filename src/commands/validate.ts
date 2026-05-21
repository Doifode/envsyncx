import { checkbox } from "@inquirer/prompts";
import chalk from "chalk";
import fs from "fs";
import { readEnvFile, writeEnvFile } from "../utils/env.js";
import { readFilesFromProject } from "../utils/storage.js";
import inquirer from "inquirer";

const SENSITIVE_PATTERN = /password|secret|token|key|api|auth|private|credential/i;

export default async function validateCommand() {
  try {
    const configData = readFilesFromProject("config.json");
    if (!configData) {
      console.log(chalk.red("Configuration file not found."));
      return;
    }

    if (!fs.existsSync(".env")) {
      console.log(chalk.red(".env file not found."));
      return;
    }

    const currentEnv = readEnvFile(".env");
    const sourceOfTruth = configData.sourceOfTruth || ".env.example";

    const issues: Array<{
      type: "missing" | "empty" | "suspicious";
      key: string;
      message: string;
      fix: () => void;
    }> = [];

    // Check for missing variables from source of truth
    if (fs.existsSync(sourceOfTruth)) {
      const sourceEnv = readEnvFile(sourceOfTruth);
      for (const key of Object.keys(sourceEnv)) {
        if (!(key in currentEnv)) {
          issues.push({
            type: "missing",
            key,
            message: `Missing required variable from ${sourceOfTruth}`,
            fix: () => {
              currentEnv[key] = sourceEnv[key];
            },
          });
        }
      }
    }

    // Check for empty values
    for (const [key, value] of Object.entries(currentEnv)) {
      if (value === "" || value === null || value === undefined) {
        issues.push({
          type: "empty",
          key,
          message: "Empty value",
          fix: async () => {
            const { newValue } = await inquirer.prompt([
              {
                type: "input",
                name: "newValue",
                message: `Enter value for ${key}:`,
              },
            ]);
            currentEnv[key] = newValue;
          },
        });
      }
    }

    // Check for suspicious patterns (potential exposed secrets)
    for (const [key, value] of Object.entries(currentEnv)) {
      if (SENSITIVE_PATTERN.test(key)) {
        // Check if it looks like a placeholder or test value
        if (
          value.includes("example") ||
          value.includes("test") ||
          value.includes("placeholder") ||
          value.includes("changeme") ||
          value === "your-api-key" ||
          value === "xxx"
        ) {
          issues.push({
            type: "suspicious",
            key,
            message: "Suspicious placeholder value in sensitive field",
            fix: async () => {
              const { newValue } = await inquirer.prompt([
                {
                  type: "password",
                  name: "newValue",
                  message: `Enter actual value for ${key}:`,
                },
              ]);
              currentEnv[key] = newValue;
            },
          });
        }
      }
    }

    if (issues.length === 0) {
      console.log(chalk.green("✔ No issues found! Your .env file looks good."));
      return;
    }

    console.log(chalk.yellow(`\n⚠️  Found ${issues.length} issue(s):\n`));

    // Group by type
    const byType: Record<string, typeof issues> = {
      missing: [],
      empty: [],
      suspicious: [],
    };

    issues.forEach((issue) => {
      byType[issue.type].push(issue);
      
      const icon = 
        issue.type === "missing" ? "➕" :
        issue.type === "empty" ? "📭" : "⚠️";
      
      console.log(`  ${icon} ${chalk.cyan(issue.key)}: ${chalk.dim(issue.message)}`);
    });

    console.log("\n");

    // Multi-select issues to fix
    const selected = await checkbox({
      message: "Select issues to fix:",
      choices: issues.map((issue) => ({
        name: `${issue.key} - ${issue.message}`,
        value: issue,
        checked: issue.type === "missing", // Auto-select missing vars
      })),
    });

    if (selected.length === 0) {
      console.log(chalk.yellow("No issues selected. Operation cancelled."));
      return;
    }

    // Fix selected issues
    for (const issue of selected) {
      await issue.fix();
    }

    writeEnvFile(".env", currentEnv);

    console.log(chalk.green(`\n✔ Fixed ${selected.length} issue(s) in .env`));
  } catch (error: any) {
    console.log(chalk.red(`Error: ${error.message}`));
  }
}
