import fs from "fs-extra";
import path from "path";

const BASE_DIR = path.join(".envsyncx");

export function getProfilePath(
  project: string,
  profile: string,
  uniquePath: string,
) {
  return path.join(BASE_DIR, uniquePath, project, `${profile}.json`);
}

export async function saveProfile(
  project: string,
  profile: string,
  data: Record<string, string>,
  uniquePath: string,
) {
  const filePath = getProfilePath(project, profile, uniquePath);

  await fs.ensureDir(path.dirname(filePath));

  await fs.writeJson(filePath, data, {
    spaces: 2,
  });
}

export async function loadProfile(
  project: string,
  profile: string,
  uniquePath: string,
) {
  const filePath = getProfilePath(project, profile, uniquePath);

  if (!(await fs.pathExists(filePath))) {
    throw new Error(`Profile '${profile}' not found`);
  }

  return fs.readJson(filePath);
}

export const checkFileExistsInProject = (filename: string): boolean => {
  return fs.existsSync(filename);
};

export const isProjectInitialized = (uniquePath: string): boolean => {
  return fs.existsSync(path.join(BASE_DIR, uniquePath));
};
