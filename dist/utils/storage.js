import fs from "fs-extra";
import path from "path";
import os from "os";
const BASE_DIR = path.join(os.homedir(), ".envsyncx");
export function getProfilePath(project, profile) {
    return path.join(BASE_DIR, project, `${profile}.json`);
}
export async function saveProfile(project, profile, data) {
    const filePath = getProfilePath(project, profile);
    await fs.ensureDir(path.dirname(filePath));
    await fs.writeJson(filePath, data, {
        spaces: 2,
    });
}
export async function loadProfile(project, profile) {
    const filePath = getProfilePath(project, profile);
    if (!(await fs.pathExists(filePath))) {
        throw new Error(`Profile '${profile}' not found`);
    }
    return fs.readJson(filePath);
}
