import fs from "fs";
import path from "path";

type SupportedBrowser = "chromium" | "firefox";

const supportedBrowsers: SupportedBrowser[] = ["chromium", "firefox"];

function mergeManifest(browser: SupportedBrowser): void {
	let browserManifestFileName: string;

	switch (browser) {
		case "chromium":
			browserManifestFileName = "manifest.chromium.json";
			break;
		case "firefox":
			browserManifestFileName = "manifest.firefox.json";
			break;
		default:
			console.error(`Specified browser unsupported | Supported: ${supportedBrowsers.join(", ")}`);
			process.exit(1);
	}

	// Load common and browser specific manifest
	const commonManifest = JSON.parse(fs.readFileSync("manifest.common.json", "utf8"));
	const browserManifest = JSON.parse(fs.readFileSync(browserManifestFileName, "utf8"));

	// Merge both manifest, giving priority to the browser specific manifest
	const mergedManifest = { ...commonManifest, ...browserManifest };

	// `dist/${browser}/manifest.${browser}.output.json`
	fs.writeFileSync(`dist/${browser}/manifest.json`, JSON.stringify(mergedManifest, null, 2));

	console.log(`${browser} manifest successfully created`);
}


function copyDir(src: string, dest: string, browser: SupportedBrowser): void {
	function shouldCopyFile(fileName: string, browser: SupportedBrowser): boolean {
		const blacklist = ["build.js", "build.ts", "README.md", "package.json", "updates.json", "update-updates-json.ts"];
		for (let supportedBrowser of supportedBrowsers) {
			if (supportedBrowser !== browser) {
				if (fileName.split(".").includes(supportedBrowser) || fileName.includes("manifest") || blacklist.includes(fileName)) {
					return false;
				}
			}
		}

		return true;
	}

	function isDangerousSubdirectory(src: string, dest: string): boolean {
		const normalizedSrcPath = src.replace(/\\/g, '/');
		const normalizedDestPath = dest.replace(/\\/g, '/');
		const directoryOccurencies = normalizedDestPath.split("/").filter(directory => normalizedSrcPath.split("/")[0].includes(directory)).length;
		// console.log("src:", src)
		// console.log("dest:", dest)
		// console.log("isDangerousSubdirectory ~ directoryOccurencies:", directoryOccurencies)
		return directoryOccurencies > 1;
	}

	if (isDangerousSubdirectory(src, dest)) {
		console.log(`Prevent recursive bomb by ignoring: ${src} -> ${dest}`);
		return;
	}

	fs.mkdir(dest, { recursive: true }, (err) => {
		if (err) {
			console.error(`Error while creating the folder ${dest}:`, err);
			return;
		}

		fs.readdir(src, { withFileTypes: true }, (err, entries) => {
			if (err) {
				console.error(`Error while reading the folder ${src}:`, err);
				return;
			}

			entries.forEach((entry) => {
				const srcPath = path.join(src, entry.name);
				const destPath = path.join(dest, entry.name);

				if (entry.isDirectory() && entry.name.startsWith('.')) {
					console.log(`Ignored hidden folder: ${entry.name}`);
					return;
				}

				if (entry.isFile() && entry.name.startsWith('.')) {
					console.log(`Ignored hidden file: ${entry.name}`);
					return;
				}

				if (entry.isFile() && !shouldCopyFile(entry.name, browser)) {
					console.log(`Ignored browser specific file: ${entry.name}`);
					return;
				}

				if (entry.isDirectory()) {
					copyDir(srcPath, destPath, browser);
				} else {
					fs.copyFile(srcPath, destPath, (err) => {
						if (err) {
							console.error(`Error while copying the file ${srcPath}:`, err);
						} else {
							console.log(`File copied: ${srcPath} -> ${destPath}`);
						}
					});
				}
			});
		});
	});
}


// check the target browser
if (process.argv.length < 3) {
	console.error("Usage: bun build.ts <browser>");
	process.exit(1);
}

const browser = process.argv[2].toLowerCase() as SupportedBrowser;

if (!supportedBrowsers.includes(browser)) {
	console.error(`Unsupported browser: ${browser}. Supported: ${supportedBrowsers.join(", ")}`);
	process.exit(1);
}

async function build(browser: SupportedBrowser): Promise<void> {
	// ensure the folders are created
	await fs.promises.mkdir("dist", { recursive: true });
	for (let supportedBrowser of supportedBrowsers) {
		await fs.promises.mkdir(`dist/${supportedBrowser}`, { recursive: true });
	}

	mergeManifest(browser);
	copyDir(".", `dist/${browser}`, browser);
	setTimeout(() => console.log(`${browser} extension successfully built`), 100); // currently broken
}

build(browser);

