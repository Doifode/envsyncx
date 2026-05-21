import { checkbox, select, password } from "@inquirer/prompts";
import chalk from "chalk";
import crypto from "crypto";
import fs from "fs";
import { readEnvFile, writeEnvFile } from "../utils/env.js";
import { getProjectName, getProjectUniquePath } from "../utils/project.js";
import { loadProfile, saveProfile, readFilesFromProject } from "../utils/storage.js";

const SENSITIVE_PATTERN = /password|secret|token|key|api|auth|private|credential/i;
const ENCRYPTION_KEY_LENGTH = 32;

type SecretConfig = {
  encryptionKey?: string;
  encryptedVars?: string[];
};

export default async function secretsCommand(action?: string, ...args: string[]) {
  if (!action || action === "scan") {
    await scanSecrets(args[0]);
  } else if (action === "encrypt") {
    await encryptSecrets(args[0]);
  } else if (action === "decrypt") {
    await decryptSecrets(args[0]);
  } else if (action === "generate-key") {
    await generateEncryptionKey();
  } else {
    console.log(chalk.red(`Unknown action: ${action}`));
    console.log(chalk.dim("Usage:"));
    console.log(chalk.dim("  esync secrets scan [profile]"));
    console.log(chalk.dim("  esync secrets encrypt <profile>"));
    console.log(chalk.dim("  esync secrets decrypt <profile>"));
    console.log(chalk.dim("  esync secrets generate-key"));
  }
}

async function scanSecrets(profileName?: string) {
  try {
    const configData = readFilesFromProject("config.json");
    if (!configData) {
      console.log(chalk.red("Configuration file not found."));
      return;
    }

    let profilesToScan: string[] = [];

    if (profileName) {
      if (!configData.profiles.includes(profileName)) {
        console.log(chalk.red(`Profile '${profileName}' not found.`));
        return;
      }
      profilesToScan = [profileName];
    } else {
      if (configData.profiles.length === 0) {
        console.log(chalk.yellow("No profiles found."));
        return;
      }

      profilesToScan = await checkbox({
        message: "Select profiles to scan:",
        choices: configData.profiles.map((p: string) => ({ name: p, value: p })),
        required: true,
      });
    }

    if (profilesToScan.length === 0) {
      console.log(chalk.yellow("No profiles selected."));
      return;
    }

    const project = getProjectName();
    const uniquePath = getProjectUniquePath();

    console.log(chalk.bold("\n🔍 Scanning for Secrets\n"));

    const findings: Record<string, Array<{ key: string; issue: string }>> = {};

    for (const profile of profilesToScan) {
      const profileData = await loadProfile(project, profile, uniquePath);
      findings[profile] = [];

      for (const [key, value] of Object.entries(profileData)) {
        if (SENSITIVE_PATTERN.test(key)) {
          const strValue = String(value);

          // Check for placeholder values
          if (
            strValue.includes("example") ||
            strValue.includes("test") ||
            strValue.includes("placeholder") ||
            strValue.includes("changeme") ||
            strValue === "your-api-key" ||
            strValue === "xxx" ||
            strValue === ""
          ) {
            findings[profile].push({
              key,
              issue: "Placeholder or empty value in sensitive field",
            });
          }

          // Check for suspiciously short values
          if (strValue.length < 8 && strValue !== "") {
            findings[profile].push({
              key,
              issue: "Suspiciously short value for sensitive field",
            });
          }
        }
      }
    }

    // Display findings
    let totalIssues = 0;
    for (const [profile, issues] of Object.entries(findings)) {
      if (issues.length > 0) {
        console.log(chalk.yellow(`⚠️  ${profile}:`));
        issues.forEach(({ key, issue }) => {
          console.log(`  • ${chalk.cyan(key)}: ${chalk.dim(issue)}`);
          totalIssues++;
        });
        console.log();
      } else {
        console.log(chalk.green(`✔ ${profile}: No issues found`));
      }
    }

    if (totalIssues === 0) {
      console.log(chalk.green("\n✔ No security issues found!"));
    } else {
      console.log(chalk.yellow(`\nFound ${totalIssues} potential issue(s)`));
    }
  } catch (error: any) {
    console.log(chalk.red(`Error: ${error.message}`));
  }
}

async function encryptSecrets(profileName?: string) {
  try {
    const configData = readFilesFromProject("config.json");
    if (!configData) {
      console.log(chalk.red("Configuration file not found."));
      return;
    }

    if (!profileName) {
      profileName = await select({
        message: "Select profile to encrypt:",
        choices: configData.profiles.map((p: string) => ({ name: p, value: p })),
      });
    }

    if (!configData.profiles.includes(profileName)) {
      console.log(chalk.red(`Profile '${profileName}' not found.`));
      return;
    }

    const project = getProjectName();
    const uniquePath = getProjectUniquePath();
    const profileData = await loadProfile(project, profileName!, uniquePath);

    // Select variables to encrypt
    const sensitiveVars = Object.keys(profileData).filter((key) =>
      SENSITIVE_PATTERN.test(key)
    );

    if (sensitiveVars.length === 0) {
      console.log(chalk.yellow("No sensitive variables detected."));
      return;
    }

    const toEncrypt = await checkbox({
      message: "Select variables to encrypt:",
      choices: sensitiveVars.map((key) => ({ name: key, value: key, checked: true })),
      required: true,
    });

    if (toEncrypt.length === 0) {
      console.log(chalk.yellow("No variables selected."));
      return;
    }

    // Get encryption key
    const encryptionKey = await password({
      message: "Enter encryption key (min 32 chars):",
      validate: (val) =>
        val.length >= ENCRYPTION_KEY_LENGTH
          ? true
          : `Key must be at least ${ENCRYPTION_KEY_LENGTH} characters`,
    });

    // Encrypt selected variables
    const encrypted = { ...profileData };
    toEncrypt.forEach((key) => {
      encrypted[key] = encryptValue(profileData[key], encryptionKey);
    });

    await saveProfile(project, profileName!, encrypted, uniquePath);

    console.log(chalk.green(`\n✔ Encrypted ${toEncrypt.length} variable(s) in profile '${profileName}'`));
    console.log(chalk.yellow("\n⚠️  Keep your encryption key safe! You'll need it to decrypt."));
  } catch (error: any) {
    console.log(chalk.red(`Error: ${error.message}`));
  }
}

async function decryptSecrets(profileName?: string) {
  try {
    const configData = readFilesFromProject("config.json");
    if (!configData) {
      console.log(chalk.red("Configuration file not found."));
      return;
    }

    if (!profileName) {
      profileName = await select({
        message: "Select profile to decrypt:",
        choices: configData.profiles.map((p: string) => ({ name: p, value: p })),
      });
    }

    if (!configData.profiles.includes(profileName)) {
      console.log(chalk.red(`Profile '${profileName}' not found.`));
      return;
    }

    const project = getProjectName();
    const uniquePath = getProjectUniquePath();
    const profileData = await loadProfile(project, profileName!, uniquePath);

    // Detect encrypted values (they have the format: enc:iv:data)
    const encryptedVars = Object.keys(profileData).filter((key) =>
      String(profileData[key]).startsWith("enc:")
    );

    if (encryptedVars.length === 0) {
      console.log(chalk.yellow("No encrypted variables found."));
      return;
    }

    const toDecrypt = await checkbox({
      message: "Select variables to decrypt:",
      choices: encryptedVars.map((key) => ({ name: key, value: key, checked: true })),
      required: true,
    });

    if (toDecrypt.length === 0) {
      console.log(chalk.yellow("No variables selected."));
      return;
    }

    const encryptionKey = await password({
      message: "Enter encryption key:",
    });

    // Decrypt selected variables
    const decrypted = { ...profileData };
    let successCount = 0;
    let failCount = 0;

    toDecrypt.forEach((key) => {
      try {
        decrypted[key] = decryptValue(profileData[key], encryptionKey);
        successCount++;
      } catch (err) {
        console.log(chalk.red(`Failed to decrypt ${key} (wrong key?)`));
        failCount++;
      }
    });

    if (successCount > 0) {
      await saveProfile(project, profileName!, decrypted, uniquePath);
      console.log(chalk.green(`\n✔ Decrypted ${successCount} variable(s) in profile '${profileName}'`));
    }

    if (failCount > 0) {
      console.log(chalk.yellow(`⚠️  ${failCount} variable(s) failed to decrypt`));
    }
  } catch (error: any) {
    console.log(chalk.red(`Error: ${error.message}`));
  }
}

async function generateEncryptionKey() {
  const key = crypto.randomBytes(ENCRYPTION_KEY_LENGTH).toString("hex");
  console.log(chalk.bold("\n🔑 Generated Encryption Key:\n"));
  console.log(chalk.cyan(key));
  console.log(chalk.yellow("\n⚠️  Store this key securely! You'll need it to decrypt your secrets."));
  console.log(chalk.dim("Consider using a password manager or environment variable."));
}

function encryptValue(value: string, key: string): string {
  const iv = crypto.randomBytes(16);
  const keyHash = crypto.createHash("sha256").update(key).digest();
  const cipher = crypto.createCipheriv("aes-256-cbc", keyHash, iv);

  let encrypted = cipher.update(String(value), "utf8", "hex");
  encrypted += cipher.final("hex");

  return `enc:${iv.toString("hex")}:${encrypted}`;
}

function decryptValue(encrypted: string, key: string): string {
  const parts = String(encrypted).split(":");
  if (parts.length !== 3 || parts[0] !== "enc") {
    throw new Error("Invalid encrypted format");
  }

  const iv = Buffer.from(parts[1], "hex");
  const encryptedData = parts[2];

  const keyHash = crypto.createHash("sha256").update(key).digest();
  const decipher = crypto.createDecipheriv("aes-256-cbc", keyHash, iv);

  let decrypted = decipher.update(encryptedData, "hex", "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
}
