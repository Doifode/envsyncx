import fs from "fs";
import dotenv from "dotenv";

const SENSITIVE_PATTERN = /password|secret|token|key|api|auth|private|credential/i;

/** Masks a value if its key name looks sensitive. Returns the value unchanged otherwise. */
export function maskValue(key: string, value: string): string {
  return SENSITIVE_PATTERN.test(key) ? "****" : value;
}

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
