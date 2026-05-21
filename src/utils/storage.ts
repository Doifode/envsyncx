import fs from "fs-extra";
import os from "os";
import path from "path";
import { getProjectName, getProjectUniquePath } from "./project.js";
import chalk from "chalk";

const LOCAL_BASE_DIR = ".envsyncx";
const META_FILE = path.join(LOCAL_BASE_DIR, ".meta.json");

export function getGlobalBaseDir(): string {
  return path.join(os.homedir(), ".envsyncx");
}

export function getBaseDir(): string {
  try {
    if (fs.existsSync(META_FILE)) {
      const meta = fs.readJsonSync(META_FILE);
      if (meta.storageType === "global") {
        return getGlobalBaseDir();
      }
    }
  } catch {
    // fall through to default
  }
  return LOCAL_BASE_DIR;
}

export async function initStorageMeta(storageType: "local" | "global"): Promise<void> {
  await fs.ensureDir(LOCAL_BASE_DIR);
  await fs.writeJson(META_FILE, { storageType }, { spaces: 2 });
}

export function getProfilePath(
  project: string,
  profile: string,
  uniquePath: string,
) {
  return path.join(getBaseDir(), uniquePath, project, `${profile}.json`);
}

export const readFilesFromProject = (
  jsonfile: string,
): Record<string, any> | null => {
  const uniquePath = getProjectUniquePath();
  const project = getProjectName();

  const profileExists = checkProfileExists(project, uniquePath);
  if (!profileExists) {
    console.log(
      chalk.red(
        `Configuration file not found please run 'envsyncx init' command to initialize the project`,
      ),
    );
    return null;
  }

  const configPath = path.join(getBaseDir(), uniquePath, project, jsonfile);

  return fs.readJsonSync(configPath);
};

const checkProfileExists = (project: string, uniquePath: string): boolean => {
  const configPath = path.join(getBaseDir(), uniquePath, project, "config.json");
  return fs.existsSync(configPath);
};

// update project config file with new profile name when a new profile is created, and if the config file doesn't exist, create it with the new profile name in the profiles array
export const updateProjectFiles = async (
  project: string,
  uniquePath: string,
  fileName: string,
  callback: (data: Record<string, any>) => Record<string, any> | null,
) => {
  const configPath = path.join(getBaseDir(), uniquePath, project, fileName);
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

  await updateProjectFiles(
    project,
    uniquePath,
    "config.json",
    (configData) => ({
      profiles: [
        ...(configData.profiles || []).filter((p: string) => p !== profile),
        profile,
      ],
    }),
  );

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
  const configPath = path.join(getBaseDir(), uniquePath, project, "config.json");
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
  const project = getProjectName();
  return fs.existsSync(path.join(getBaseDir(), uniquePath, project, "config.json"));
};

export function deleteFileFromProject(fileName: string) {
  const checkFileExists = checkFileExistsInProject(fileName);

  if (!checkFileExists) {
    console.log(chalk.red(`File '${fileName}' not found in the project.`));
    return;
  }

  fs.removeSync(fileName);
  console.log(chalk.green(`File '${fileName}' has been deleted successfully.`));
}
