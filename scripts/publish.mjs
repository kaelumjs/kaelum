// Publishes the package in the current directory to npm.
// Prereleases (2.0.0-alpha.1) go to the `next` dist-tag so `latest` keeps
// pointing at the newest stable version.
import { execFileSync } from "node:child_process";
import fs from "node:fs";

const { name, version } = JSON.parse(fs.readFileSync("package.json", "utf8"));
const tag = version.includes("-") ? "next" : "latest";

console.log(`Publishing ${name}@${version} with dist-tag "${tag}"`);
execFileSync("npm", ["publish", "--access", "public", "--tag", tag], {
  stdio: "inherit",
  shell: process.platform === "win32",
});
