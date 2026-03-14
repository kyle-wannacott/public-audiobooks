import * as SQLite from "expo-sqlite";
import { Platform } from "react-native";

export function openDatabase() {
  if (Platform.OS === "web") {
    return {
      transaction: (_cb: any) => {},
    };
  }

  const db = SQLite.openDatabaseSync("public_audiobooks.db");

  // Compatibility shim: wraps new expo-sqlite sync API to match the old
  // WebSQL-style transaction/executeSql pattern used throughout the app.
  return {
    transaction: (
      callback: (tx: any) => void,
      errorCallback?: (e: any) => void,
      successCallback?: () => void
    ) => {
      try {
        db.withTransactionSync(() => {
          const tx = {
            executeSql: (
              sql: string,
              params: any[] = [],
              success?: (tx: any, result: any) => void,
              error?: (tx: any, err: any) => void
            ) => {
              try {
                const rows = db.getAllSync<any>(sql, params);
                if (success) {
                  success(tx, {
                    rows: {
                      _array: rows,
                      length: rows.length,
                      item: (i: number) => rows[i],
                    },
                    insertId: undefined,
                    rowsAffected: rows.length,
                  });
                }
              } catch (e) {
                if (error) error(tx, e);
              }
            },
          };
          callback(tx);
        });
        if (successCallback) successCallback();
      } catch (e) {
        if (errorCallback) errorCallback(e);
      }
    },
  };
}

export function roundNumberTwoDecimal(num: number) {
  return Math.round((num + Number.EPSILON) * 100) / 100;
}
