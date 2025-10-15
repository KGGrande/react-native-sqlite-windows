import SqliteWindows from './ReactNativeSqliteWindows';
// import type { SQLiteResult } from './ReactNativeSqliteWindows';

export class SQLiteDatabase {
  private dbName: string;

  constructor(dbName: string) {
    this.dbName = dbName;
  }

  async open(): Promise<void> {
    await SqliteWindows.open(this.dbName);
  }

  async close(): Promise<void> {
    await SqliteWindows.close(this.dbName);
  }

  async executeSql(sql: string, args: any[] = []): Promise<any> {
    return await SqliteWindows.executeSql(this.dbName, sql, args);
  }

  async transaction(
    callback: (tx: Transaction) => Promise<void>
  ): Promise<void> {
    const tx = new Transaction(this.dbName);
    try {
      await this.executeSql('BEGIN TRANSACTION', []);
      await callback(tx);
      await this.executeSql('COMMIT', []);
    } catch (error) {
      await this.executeSql('ROLLBACK', []);
      throw error;
    }
  }

  static async deleteDatabase(dbName: string): Promise<void> {
    await SqliteWindows.deleteDatabase(dbName);
  }
}

export class Transaction {
  private dbName: string;

  constructor(dbName: string) {
    this.dbName = dbName;
  }

  async executeSql(sql: string, args: any[] = []): Promise<any> {
    return await SqliteWindows.executeSql(this.dbName, sql, args);
  }
}

export const openDatabase = (dbName: string): SQLiteDatabase => {
  return new SQLiteDatabase(dbName);
};

// export type { SQLiteResult };
