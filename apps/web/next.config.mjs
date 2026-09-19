import fs from "node:fs";
import fsPromises from "node:fs/promises";

// Node.js 24 + Windows libuv compatibility fix:
// On Node 24 on Windows, fs.promises.readlink, fs.readlink, and fs.readlinkSync
// throw EISDIR instead of EINVAL/UNKNOWN when called on regular files.
// Next.js build-traces expects non-symlinks to throw EINVAL, or returns null.
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

// Also patch fs.promises on default fs export
if (fs.promises) {
  fs.promises.readlink = fsPromises.readlink;
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@campus-major-tutoring-mvp/ui"],
  // 브라우저에는 NEXT_PUBLIC_ 접두사가 붙은 값만 노출된다. 서버 전용 비밀값은
  // 여기 설정을 거치지 않고 apps/api에서만 다룬다(웹서비스 아키텍처 §10).
};

export default nextConfig;
