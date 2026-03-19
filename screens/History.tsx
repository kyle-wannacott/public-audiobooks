import React from "react";
import { useState } from "react";

import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { openDatabase } from "../db/utils";
import {
  audiobookHistoryTableName,
  audiobookProgressTableName,
} from "../db/database_functions";

import BookShelfAndHistoryShelf from "../components/BookShelfAndHistoryShelf";

const db = openDatabase();

// global scope
let lolcache = {};

function History() {
  const insets = useSafeAreaInsets();
  const [audiobookHistory, setAudiobookHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  function getShelvedBooks(pickerAndQueryStatePassedIn: {
    orderBy: string;
    order: string;
  }) {
    db.transaction((tx) => {
      tx.executeSql(
        `select * from ${audiobookHistoryTableName} inner join ${audiobookProgressTableName} on ${audiobookProgressTableName}.audiobook_id = ${audiobookHistoryTableName}.audiobook_id ${pickerAndQueryStatePassedIn.orderBy} ${pickerAndQueryStatePassedIn.order} limit 100`,
        [],
        (_, { rows }) => {
          let newHistory = [];
          for (let row of rows._array) {
            if (
              Object.prototype.hasOwnProperty.call(lolcache, row.audiobook_id)
            ) {
              newHistory.push(lolcache[row.audiobook_id]);
            } else {
              lolcache[row.audiobook_id] = row;
              newHistory.push(row);
            }
          }
          setAudiobookHistory(newHistory);
          setLoadingHistory(false);
        }
      );
    }, null);
  }
  const asyncDataKeyNameForPickerAndToggle = "pickerAndQueryDataHistory";

  return (
    <View style={{ flex: 1, paddingTop: insets.top }}>
      <BookShelfAndHistoryShelf
        getShelvedBooks={getShelvedBooks}
        audiobookHistory={audiobookHistory}
        loadingHistory={loadingHistory}
        asyncDataKeyName={asyncDataKeyNameForPickerAndToggle}
      />
    </View>
  );
}

export default History;
