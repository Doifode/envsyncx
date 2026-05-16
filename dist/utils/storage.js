import fs from "fs-extra";
import path from "path";
// for testing storing profiles in a temp directory
// in this folder only storing profiles, not the .env files
const BASE_DIR = path.join(".envsyncx");
export function getProfilePath(project, profile, uniquePath) {
    return path.join(BASE_DIR, uniquePath, project, `${profile}.json`);
}
export async function saveProfile(project, profile, data, uniquePath) {
    const filePath = getProfilePath(project, profile, uniquePath);
    await fs.ensureDir(path.dirname(filePath));
    await fs.writeJson(filePath, data, {
        spaces: 2,
    });
}
export async function loadProfile(project, profile, uniquePath) {
    const filePath = getProfilePath(project, profile, uniquePath);
    if (!(await fs.pathExists(filePath))) {
        throw new Error(`Profile '${profile}' not found`);
    }
    return fs.readJson(filePath);
}
export const checkFileExistsInProject = (filename) => {
    return fs.existsSync(filename);
};
export const isProjectInitialized = (uniquePath) => {
    return fs.existsSync(path.join(BASE_DIR, uniquePath));
};
