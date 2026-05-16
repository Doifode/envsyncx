import fs from "fs";
import path from "path";
export function getProjectName() {
    const packageJsonPath = path.join(process.cwd(), "package.json");
    if (!fs.existsSync(packageJsonPath)) {
        throw new Error("package.json not found");
    }
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));
    return packageJson.name || "unknown-project";
}
export function getProjectUniquePath() {
    return process.cwd().replace(/[\/\\:]/g, "_");
}
