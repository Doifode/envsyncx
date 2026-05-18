import fs from "fs";
import path from "path";

export function getProjectName(): string {
  const packageJsonPath = path.join(process.cwd(), "package.json");
  const dirName = path.basename(process.cwd());

  if (!fs.existsSync(packageJsonPath)) {
    return dirName;
  }

  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));
  return packageJson.name || dirName;
}

export function getProjectUniquePath(): string {
  return process.cwd().replace(/[\/\\:]/g, "_");
}

/**
 * Returns null if the name is valid, or an error message string if not.
 * Reserved name: 'config'. Cannot contain spaces or filesystem-unsafe characters.
 */
export function validateProfileName(name: string): string | null {
  if (!name || name.trim() === "") return "Profile name cannot be empty.";
  if (/[\/\\:*?"<>| ]/.test(name))
    return 'Profile name cannot contain spaces or special characters (/ \\ : * ? " < > |).';
  if (name.startsWith(".")) return "Profile name cannot start with a dot.";
  if (name === "config") return "'config' is a reserved name and cannot be used as a profile name.";
  return null;
}