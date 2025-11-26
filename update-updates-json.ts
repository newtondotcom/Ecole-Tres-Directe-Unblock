type GeckoSettings = {
  id?: string;
  update_url?: string;
};

type FirefoxManifest = {
  browser_specific_settings?: {
    gecko?: GeckoSettings;
  };
};

type UpdateEntry = {
  version: string;
  update_link: string;
  update_hash?: string;
  update_info_url?: string;
  applications?: unknown;
};

type UpdatesManifest = {
  addons: {
    [addonId: string]: {
      updates: UpdateEntry[];
    };
  };
};

async function readJSON<T = unknown>(filePath: string): Promise<T> {
  const file = Bun.file(filePath);
  if (!(await file.exists())) {
    throw new Error(`File not found: ${filePath}`);
  }
  const content = await file.text();
  return JSON.parse(content) as T;
}

async function fileExists(filePath: string): Promise<boolean> {
  try {
    const file = Bun.file(filePath);
    return await file.exists();
  } catch {
    return false;
  }
}

async function main() {
  const rootDir = Bun.cwd;

  const manifestCommonPath = `${rootDir}/manifest.common.json`;
  const manifestFirefoxPath = `${rootDir}/manifest.firefox.json`;
  const updatesPath = `${rootDir}/updates.json`;

  if (!(await fileExists(manifestCommonPath))) {
    throw new Error(`manifest.common.json not found at ${manifestCommonPath}`);
  }

  if (!(await fileExists(manifestFirefoxPath))) {
    throw new Error(`manifest.firefox.json not found at ${manifestFirefoxPath}`);
  }

  const manifestCommon = await readJSON<{ version?: string }>(manifestCommonPath);
  const manifestFirefox = await readJSON<FirefoxManifest>(manifestFirefoxPath);

  const version = manifestCommon.version;
  if (!version) {
    throw new Error("Version not found in manifest.common.json");
  }

  const gecko = manifestFirefox.browser_specific_settings?.gecko;
  if (!gecko?.id || !gecko?.update_url) {
    throw new Error("browser_specific_settings.gecko.id or update_url missing in manifest.firefox.json");
  }

  const addonId = `{${gecko.id}}`;
  console.log(`Addon ID: ${addonId}`);

  const updateLink = `https://github.com/newtondotcom/Ecole-Tres-Directe-Unblock/releases/download/v${version}/ecole-tres-directe-unblock-firefox-v${version}.xpi`;

  let updates: UpdatesManifest;

  if (await fileExists(updatesPath)) {
    updates = await readJSON<UpdatesManifest>(updatesPath);
  } else {
    updates = { addons: {} };
  }

  if (!updates.addons[addonId]) {
    updates.addons[addonId] = { updates: [] };
  }

  const updatesArray = updates.addons[addonId].updates;

  const alreadyPresent = updatesArray.some((entry) => entry.version === version);
  if (alreadyPresent) {
    console.log(`Version ${version} already present in updates.json. Nothing to do.`);
  } else {
    updatesArray.push({
      version,
      update_link: updateLink,
    });
    console.log(`Added version ${version} to updates.json with link ${updateLink} in ${JSON.stringify(updates, null, 2)}`);
  }

  await Bun.write(updatesPath, JSON.stringify(updates, null, 2) + "\n");
}

await main();

