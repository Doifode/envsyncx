import fs from "fs-extra";
import path from "path";
import { getProjectName, getProjectUniquePath } from "./project.js";
import chalk from "chalk";

const BASE_DIR = path.join(".envsyncx");

export function getProfilePath(
  project: string,
  profile: string,
  uniquePath: string,
) {
  return path.join(BASE_DIR, uniquePath, project, `${profile}.json`);
}

export const readFilesFromProject = (jsonfile: string): Record<string, any> => {
  const uniquePath = getProjectUniquePath();
  const project = getProjectName();

  const profileExists = checkProfileExists(project, uniquePath);
  if (!profileExists) {
    console.log(
      chalk.red(
        `Configuration file not found please run 'envsyncx init' command to initialize the project`,
      ),
    );
  }

  const configPath = path.join(BASE_DIR, uniquePath, project, jsonfile);

  return fs.readJsonSync(configPath);
};

const checkProfileExists = (project: string, uniquePath: string): boolean => {
  const configPath = path.join(BASE_DIR, uniquePath, project, "config.json");
  return fs.existsSync(configPath);
};

// update project config file with new profile name when a new profile is created, and if the config file doesn't exist, create it with the new profile name in the profiles array
export const updateProjectFiles = async (
  project: string,
  uniquePath: string,
  fileName: string,
  callback: (data: Record<string, any>) => void,
) => {
  const configPath = path.join(BASE_DIR, uniquePath, project, fileName);
  const newValues = callback ? callback(await fs.readJson(configPath)) : {};

  const readConfig = readFilesFromProject(fileName);

  const newConfigData = { ...readConfig, ...newValues };

  await fs.ensureDir(path.dirname(configPath));
  await fs.writeJson(configPath, newConfigData, {
    spaces: 2,
  });
};

export async function saveProfile(
  project: string,
  profile: string,
  data: Record<string, any>,
  uniquePath: string,
) {
  const filePath = getProfilePath(project, profile, uniquePath);

  updateProjectFiles(project, uniquePath, "config.json", (configData) => ({
    profiles: [...(configData.profiles || []), profile],
  }));

  await fs.ensureDir(path.dirname(filePath));

  await fs.writeJson(filePath, data, {
    spaces: 2,
  });
}

export async function createConfigFile(
  project: string,
  uniquePath: string,
  data: Record<string, any>,
) {
  const configPath = path.join(".envsyncx", uniquePath, project, "config.json");
  await fs.ensureDir(path.dirname(configPath));
  await fs.writeJson(configPath, data, { spaces: 2 });
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
