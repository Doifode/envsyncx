import { select, confirm } from "@inquirer/prompts";
import chalk from "chalk";
import fs from "fs-extra";
import path from "path";
import { getProjectName, getProjectUniquePath } from "../utils/project.js";
import { writeEnvFile } from "../utils/env.js";

type HistoryEntry = {
  timestamp: number;
  date: string;
  action: string;
  profile?: string;
  snapshot: Record<string, string>;
};

const HISTORY_DIR = ".envsyncx";
const MAX_HISTORY = 20;

export default async function historyCommand(action?: string) {
  if (!action || action === "list") {
    await listHistory();
  } else if (action === "rollback") {
    await rollbackHistory();
  } else if (action === "clear") {
    await clearHistory();
  } else {
    console.log(chalk.red(`Unknown action: ${action}`));
    console.log(chalk.dim("Usage: esync history [list|rollback|clear]"));
  }
}

export async function saveToHistory(action: string, envData: Record<string, string>, profile?: string) {
  try {
    const project = getProjectName();
    const uniquePath = getProjectUniquePath();
    const historyPath = path.join(HISTORY_DIR, uniquePath, project, "history.json");

    await fs.ensureDir(path.dirname(historyPath));

    let history: HistoryEntry[] = [];
    if (await fs.pathExists(historyPath)) {
      history = await fs.readJson(historyPath);
    }

    const entry: HistoryEntry = {
      timestamp: Date.now(),
      date: new Date().toISOString(),
      action,
      profile,
      snapshot: envData,
    };

    history.unshift(entry); // Add to beginning

    // Keep only last MAX_HISTORY entries
    if (history.length > MAX_HISTORY) {
      history = history.slice(0, MAX_HISTORY);
    }

    await fs.writeJson(historyPath, history, { spaces: 2 });
  } catch (error) {
    // Silently fail - history is optional
    console.log(chalk.dim("Note: Could not save to history"));
  }
}

async function listHistory() {
  try {
    const project = getProjectName();
    const uniquePath = getProjectUniquePath();
    const historyPath = path.join(HISTORY_DIR, uniquePath, project, "history.json");

    if (!(await fs.pathExists(historyPath))) {
      console.log(chalk.yellow("No history found."));
      return;
    }

    const history: HistoryEntry[] = await fs.readJson(historyPath);

    if (history.length === 0) {
      console.log(chalk.yellow("No history found."));
      return;
    }

    console.log(chalk.bold("\n📜 Change History\n"));

    history.forEach((entry, index) => {
      const date = new Date(entry.timestamp);
      const relativeTime = getRelativeTime(entry.timestamp);

      let actionText = entry.action;
      if (entry.profile) {
        actionText += chalk.dim(` (${entry.profile})`);
      }

      console.log(
        `${chalk.cyan(`[${index}]`)} ${relativeTime} - ${actionText}`
      );
      console.log(chalk.dim(`    ${date.toLocaleString()}`));
      console.log(chalk.dim(`    ${Object.keys(entry.snapshot).length} variables\n`));
    });
  } catch (error: any) {
    console.log(chalk.red(`Error: ${error.message}`));
  }
}

async function rollbackHistory() {
  try {
    const project = getProjectName();
    const uniquePath = getProjectUniquePath();
    const historyPath = path.join(HISTORY_DIR, uniquePath, project, "history.json");

    if (!(await fs.pathExists(historyPath))) {
      console.log(chalk.yellow("No history found."));
      return;
    }

    const history: HistoryEntry[] = await fs.readJson(historyPath);

    if (history.length === 0) {
      console.log(chalk.yellow("No history found."));
      return;
    }

    const choices = history.map((entry, index) => {
      const relativeTime = getRelativeTime(entry.timestamp);
      let label = `${relativeTime} - ${entry.action}`;
      if (entry.profile) {
        label += ` (${entry.profile})`;
      }
      label += ` - ${Object.keys(entry.snapshot).length} vars`;

      return {
        name: label,
        value: index,
      };
    });

    const selectedIndex = await select({
      message: "Select snapshot to restore:",
      choices,
    });

    const selectedEntry = history[selectedIndex];

    console.log(chalk.bold("\n📸 Snapshot Preview:\n"));
    console.log(chalk.cyan(`Action: ${selectedEntry.action}`));
    console.log(chalk.cyan(`Date: ${new Date(selectedEntry.timestamp).toLocaleString()}`));
    console.log(chalk.cyan(`Variables: ${Object.keys(selectedEntry.snapshot).length}\n`));

    const confirmed = await confirm({
      message: "Restore this snapshot to .env?",
      default: false,
    });

    if (!confirmed) {
      console.log(chalk.yellow("Rollback cancelled."));
      return;
    }

    writeEnvFile(".env", selectedEntry.snapshot);

    console.log(chalk.green("\n✔ Successfully restored .env from snapshot"));
    console.log(chalk.dim(`Restored ${Object.keys(selectedEntry.snapshot).length} variables`));
  } catch (error: any) {
    console.log(chalk.red(`Error: ${error.message}`));
  }
}

async function clearHistory() {
  try {
    const confirmed = await confirm({
      message: "Clear all history? This cannot be undone.",
      default: false,
    });

    if (!confirmed) {
      console.log(chalk.yellow("Operation cancelled."));
      return;
    }

    const project = getProjectName();
    const uniquePath = getProjectUniquePath();
    const historyPath = path.join(HISTORY_DIR, uniquePath, project, "history.json");

    if (await fs.pathExists(historyPath)) {
      await fs.remove(historyPath);
      console.log(chalk.green("✔ History cleared"));
    } else {
      console.log(chalk.yellow("No history to clear."));
    }
  } catch (error: any) {
    console.log(chalk.red(`Error: ${error.message}`));
  }
}

function getRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return "just now";
  if (minutes < 60) return `${minutes} minute${minutes > 1 ? "s" : ""} ago`;
  if (hours < 24) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
  if (days < 30) return `${days} day${days > 1 ? "s" : ""} ago`;

  return `${Math.floor(days / 30)} month${Math.floor(days / 30) > 1 ? "s" : ""} ago`;
}
