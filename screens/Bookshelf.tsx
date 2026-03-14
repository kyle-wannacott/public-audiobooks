import React from "react";
import { useState } from "react";

import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { openDatabase } from "../db/utils";

import BookShelfAndHistoryShelf from "../components/BookShelfAndHistoryShelf";

const db = openDatabase();

// global scope
let lolcache = {};

function Bookshelf(props:any) {
  const insets = useSafeAreaInsets();
  const sqlQuery = props.route.params.sqlQuery
  const [audiobookHistory, setAudiobookHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  function getShelvedBooks(pickerAndQueryStatePassedIn: {
    orderBy: string;
    order: string;
  }) {
    db.transaction((tx) => {
      tx.executeSql(
        `${sqlQuery} ${pickerAndQueryStatePassedIn.orderBy} ${pickerAndQueryStatePassedIn.order}`,
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
  const asyncDataKeyNameForPickerAndToggle = "pickerAndQueryDataBookshelf";

  return (
    <View style={{ paddingTop: insets.top }}>
      <BookShelfAndHistoryShelf
        getShelvedBooks={getShelvedBooks}
        audiobookHistory={audiobookHistory}
        loadingHistory={loadingHistory}
        asyncDataKeyName={asyncDataKeyNameForPickerAndToggle}
        shelfHeightOffset={200}
      />
    </View>
  );
}

export default Bookshelf;
