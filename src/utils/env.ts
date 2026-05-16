import fs from "fs";
import dotenv from "dotenv";

export function readEnvFile(filePath: string) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`${filePath} not found`);
  }

  const content = fs.readFileSync(filePath, "utf-8");

  return dotenv.parse(content);
}

export function writeEnvFile(filePath: string, vars: Record<string, string>) {
  const content = Object.entries(vars)
    .map(([key, value]) => {
      const needsQuotes = /[\s"'`#]/.test(value);
      return `${key}=${needsQuotes ? `"${value.replace(/"/g, '\\"')}"` : value}`;
    })
    .join("\n");

  fs.writeFileSync(filePath, content, "utf-8");
}
