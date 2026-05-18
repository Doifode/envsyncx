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