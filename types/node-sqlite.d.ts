declare module "node:sqlite" {
  export class DatabaseSync {
    constructor(location: string);
    exec(sql: string): void;
    prepare(sql: string): {
      get(...args: unknown[]): Record<string, unknown> | undefined;
      all(...args: unknown[]): Record<string, unknown>[];
      run(...args: unknown[]): { changes: number; lastInsertRowid: number | bigint };
    };
  }
}
