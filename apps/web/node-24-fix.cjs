const fs = require("node:fs");
const fsPromises = require("node:fs/promises");

// Propagate to any child processes spawned by next/webpack/jest-worker
const normalizedPath = __filename.replace(/\\/g, "/");
if (!process.env.NODE_OPTIONS || !process.env.NODE_OPTIONS.includes("node-24-fix.cjs")) {
  process.env.NODE_OPTIONS = `${process.env.NODE_OPTIONS || ""} -r "${normalizedPath}"`.trim();
}

function handleReadlinkError(err, path) {
  if (err && (err.code === "EISDIR" || err.code === "EINVAL")) {
    try {
      const stat = fs.lstatSync(path);
      if (!stat.isSymbolicLink()) {
        const e = new Error(`EINVAL: invalid argument, readlink '${path}'`);
        e.code = "EINVAL";
        return e;
      }
    } catch {
      // ignore
    }
  }
  return err;
}

const origReadlink = fs.readlink;
const origReadlinkSync = fs.readlinkSync;
const origPromisesReadlink = fsPromises.readlink;

fs.readlink = function (path, ...args) {
  const cb = args[args.length - 1];
  if (typeof cb === "function") {
    return origReadlink.call(fs, path, ...args.slice(0, -1), (err, linkString) => {
      const fixedErr = handleReadlinkError(err, path);
      return cb(fixedErr, linkString);
    });
  }
  return origReadlink.apply(fs, [path, ...args]);
};

fs.readlinkSync = function (path, options) {
  try {
    return origReadlinkSync.call(fs, path, options);
  } catch (err) {
    throw handleReadlinkError(err, path);
  }
};

fsPromises.readlink = async function (path, options) {
  try {
    return await origPromisesReadlink.call(fsPromises, path, options);
  } catch (err) {
    throw handleReadlinkError(err, path);
  }
};

if (fs.promises) {
  fs.promises.readlink = fsPromises.readlink;
}
