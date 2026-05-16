import { readFilesFromProject, updateProjectFiles } from "../utils/storage.js";
import fs from "fs-extra";
export default async function renameProfile(
  oldProfile: string,
  newProfile: string,
) {
  try {
    const configData = readFilesFromProject("config.json");
    
    if (!configData) {
      console.log(`Configuration file not found.`);
      return;
    }
    
    if (!configData.profiles.includes(oldProfile)) {
      console.log(`Profile '${oldProfile}' not found.`);
      return;
    }

    if (configData.profiles.includes(newProfile)) {
      console.log(`Profile '${newProfile}' already exists.`);
      return;
    }

    // rename the profile file
    const oldFilePath = `${oldProfile}.json`;
    const newFilePath = `${newProfile}.json`;
    await fs.rename(oldFilePath, newFilePath);

    updateProjectFiles(
      configData.project,
      configData.uniquePath,
      "config.json",
      (data) => ({
        profiles: data.profiles.map((profile: string) =>
          profile === oldProfile ? newProfile : profile,
        ),
      }),
    );
    console.log(`Profile '${oldProfile}' renamed to '${newProfile}'.`);
  } catch (error) {
    console.log(`Error renaming profile '${oldProfile}' to '${newProfile}':`);
  }
}
