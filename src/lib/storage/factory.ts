import { StorageAdapter } from "./types";
import { LocalStorageAdapter } from "./adapters/local.adapter";
import { HostingerSftpAdapter } from "./adapters/hostinger-sftp.adapter";

type Driver = "local" | "hostinger";

function getDriver(): Driver {
  const raw = (process.env.STORAGE_DRIVER || "local").toLowerCase();

  if (raw === "local" || raw === "hostinger") {
    return raw;
  }

  throw new Error(
    `Invalid STORAGE_DRIVER="${process.env.STORAGE_DRIVER}". Use "local" or "hostinger".`
  );
}

export function createStorageAdapter(): StorageAdapter {
  const driver = getDriver();

  if (driver === "hostinger") {
    return new HostingerSftpAdapter();
  }

  return new LocalStorageAdapter();
}
