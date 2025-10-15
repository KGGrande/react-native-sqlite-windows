import type { TurboModule } from 'react-native';
import { TurboModuleRegistry } from 'react-native';

export type SqlRow = Record<string, string | number | null>;
export type SqlArg = string | number | boolean | null;

export interface Spec extends TurboModule {
  open(dbName: string): Promise<string>;
  close(dbName: string): Promise<string>;
  executeSql(
    dbName: string,
    sql: string,
    args: SqlArg[]
  ): Promise<{
    rows: SqlRow[];
    rowsAffected: number;
    insertId: number;
  }>;
  deleteDatabase(dbName: string): Promise<string>;
}

export default TurboModuleRegistry.getEnforcing<Spec>(
  'ReactNativeSqliteWindows'
);
