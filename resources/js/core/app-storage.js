const APP_DIRECTORY_NAME = 'calculo-rescisao';

function stripTrailingSlashes(path) {
  return path.replace(/[\\/]+$/, '');
}

export function buildAppStorageDirectoryPath(baseDirectory) {
  return `${stripTrailingSlashes(baseDirectory)}/${APP_DIRECTORY_NAME}`;
}

async function directoryExists(filesystem, directoryPath) {
  try {
    const stats = await filesystem.getStats(directoryPath);
    return stats?.isDirectory === true;
  } catch {
    return false;
  }
}

export async function ensureAppStorageDirectory({ filesystem, appDataPath }) {
  const directoryPath = buildAppStorageDirectoryPath(appDataPath);
  if (await directoryExists(filesystem, directoryPath)) {
    return directoryPath;
  }

  await filesystem.createDirectory(directoryPath);
  return directoryPath;
}
