declare module 'better-sqlite3' {
  interface RunResult {
    changes: number;
    lastInsertRowid: number | bigint;
  }

  interface Statement {
    run(...params: unknown[]): RunResult;
    get(...params: unknown[]): Record<string, unknown> | undefined;
    all(...params: unknown[]): Record<string, unknown>[];
  }

  class Database {
    constructor(filename: string, options?: Record<string, unknown>);
    name: string;
    open: boolean;
    exec(sql: string): Database;
    prepare(sql: string): Statement;
    transaction<R, A extends unknown[]>(fn: (...args: A) => R): (...args: A) => R;
    pragma(pragma: string, options?: { simple?: boolean }): unknown;
    close(): Database;
  }

  export default Database;
}
