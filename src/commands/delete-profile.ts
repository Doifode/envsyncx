import {
  deleteFileFromProject,
  readFilesFromProject,
} from "../utils/storage.js";

export default async function deleteProfile(profile: string) {
  try {
    const configData = readFilesFromProject("config.json");
    if (!configData) {
      console.log(`Configuration file not found.`);
      return;
    }

    if (!configData.profiles.includes(profile)) {
      console.log(`Profile '${profile}' not found.`);
      return;
    }

    // deleteFileFromProject is a function that deletes a file from the project directory, it takes the file name as an argument and deletes the file from the project directory
    deleteFileFromProject(`${profile}.json`);
  } catch (error) {
    console.log(`Error deleting profile '${profile}':`);
  }
}
