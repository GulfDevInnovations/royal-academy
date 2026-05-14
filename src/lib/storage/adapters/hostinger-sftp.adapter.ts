import { StorageAdapter, PutInput, PutResult } from "../types";

export class HostingerSftpAdapter implements StorageAdapter {
  async put(input: PutInput): Promise<PutResult> {
    void input;
    throw new Error("HostingerSftpAdapter is not implemented yet.");
  }

  async remove(key: string): Promise<void> {
    void key;
    throw new Error("HostingerSftpAdapter is not implemented yet.");
  }

  getPublicUrl(key: string): string {
    void key;
    throw new Error("HostingerSftpAdapter is not implemented yet.");
  }
}
