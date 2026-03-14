import AsyncStorage from "@react-native-async-storage/async-storage";

export const audiobookProgressTableName = "users_audiobooks_progress";
const audiobookId = "audiobook_id";
const audiotrackProgressBars = "audiotrack_progress_bars";
const currentAudiotrackPositions = "current_audiotrack_positions";
const audiobookShelved = "audiobook_shelved";
const audiobookRating = "audiobook_rating";
const listeningProgressPercent = "listening_progress_percent";
const currentListeningTime = "current_listening_time";
const currentAudiotrackIndex = "current_audiotrack_index";
const audiobookDownloaded = "audiobook_downloaded";
const audiobookFinished = "audiobook_finished";
const usersAudiobookReview = "users_audiobook_review";

export function createAudioBookDataTable(db: any) {
  db.transaction((tx: any) => {
    tx.executeSql(
      `create table if not exists ${audiobookProgressTableName} (id integer primary key not null, ${audiobookId} text not null unique, ${audiotrackProgressBars} text, ${currentAudiotrackPositions} text, ${audiobookShelved} int, ${audiobookRating} real, ${listeningProgressPercent} real, ${currentListeningTime} int, ${currentAudiotrackIndex} int, ${audiobookDownloaded} int, ${audiobookFinished} int, ${usersAudiobookReview} text);`
    );
  });
}

export const audiobookHistoryTableName = "librivox_audiobooks_cache";
const rssUrl = "audiobook_rss_url";
const image = "audiobook_image";
const title = "audiobook_title";
const authorFirstName = "audiobook_author_first_name";
const authorLastName = "audiobook_author_last_name";
const totalTime = "audiobook_total_time";
const totalTimeSecs = "audiobook_total_time_secs";
const copyrightYear = "audiobook_copyright_year";
const genres = "audiobook_genres";
const reviewUrl = "audiobook_review_url";
const numSections = "audiobook_num_sections";
const ebookUrl = "audiobook_ebook_url";
const zip = "audiobook_zip";
const language = "audiobook_language";
const projectUrl = "audiobook_project_url";
const librivoxUrl = "audiobook_librivox_url";
const iarchiveUrl = "audiobook_iarchive_url";

export function createHistoryTableDB(db: any) {
  db.transaction((tx: any) => {
    tx.executeSql(
      `create table if not exists ${audiobookHistoryTableName} (id integer primary key not null, ${rssUrl} text not null unique, ${audiobookId} text not null unique, ${image} text, ${title} text, ${authorFirstName} text, ${authorLastName} text, ${totalTime} text, ${totalTimeSecs} int, ${copyrightYear} int, ${genres} text, ${reviewUrl} text, ${numSections} int, ${ebookUrl} text, ${zip} text, ${language} text, ${projectUrl} text, ${librivoxUrl} text, ${iarchiveUrl} text);`
    );
  });
}

export function addAudiobookToHistoryDB(db: any, audiobook: any) {
  db.transaction((tx: any) => {
    tx.executeSql(
      `insert into ${audiobookHistoryTableName} (${rssUrl}, ${audiobookId}, ${image}, ${title}, ${authorFirstName}, ${authorLastName}, ${totalTime}, ${totalTimeSecs}, ${copyrightYear}, ${genres}, ${reviewUrl}, ${numSections}, ${ebookUrl}, ${zip}, ${language}, ${projectUrl}, ${librivoxUrl}, ${iarchiveUrl}) values (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        audiobook.audiobook_rss_url,
        audiobook.audiobook_id,
        audiobook.audiobook_image,
        audiobook.audiobook_title,
        audiobook.audiobook_author_first_name,
        audiobook.audiobook_author_last_name,
        audiobook.audiobook_total_time,
        audiobook.audiobook_total_time_secs,
        audiobook.audiobook_copyright_year,
        audiobook.audiobook_genres,
        audiobook.audiobook_review_url,
        audiobook.audiobook_num_sections,
        audiobook.audiobook_ebook_url,
        audiobook.audiobook_zip,
        audiobook.audiobook_language,
        audiobook.audiobook_project_url,
        audiobook.audiobook_librivox_url,
        audiobook.audiobook_iarchive_url,
      ]
    );
  }, null);
}

// export function deleteAudiobookHistoryDB(db: any) {
// db.transaction((tx: any) => {
// tx.executeSql(`drop table ${audiobookHistoryTableName}`);
// }, null);
// }
//
// export function deleteAudiobookProgressDB(db: any) {
// db.transaction((tx: any) => {
// tx.executeSql(`drop table ${audiobookProgressTableName}`);
// }, null);
// }

{
  /*export function dropTableAudiobookProgressDB(db: any) {
  db.transaction((tx: any) => {
    tx.executeSql(`drop table ${audiobookProgressTableName}`);
  }, null);
}
  */
}

export function updateAudioTrackPositionsDB(db: any, audiobookProgress: any) {
  db.transaction((tx: any) => {
    tx.executeSql(
      `update ${audiobookProgressTableName} set ${audiotrackProgressBars}=?,${currentAudiotrackPositions}=?,${listeningProgressPercent}=?,${currentListeningTime}=? where ${audiobookId}=?;`,
      [
        audiobookProgress.audiotrack_progress_bars,
        audiobookProgress.current_audiotrack_positions,
        audiobookProgress.listening_progress_percent,
        audiobookProgress.current_listening_time,
        audiobookProgress.audiobook_id,
      ]
    );
  });
}

export function updateAudioTrackIndexDB(
  db: any,
  audioTrackIndex: any,
  audiobook_id: any
) {
  db.transaction((tx: any) => {
    tx.executeSql(
      `update ${audiobookProgressTableName} set ${currentAudiotrackIndex}=? where ${audiobookId}=?;`,
      [audioTrackIndex, audiobook_id]
    );
  });
}

export function updateUsersAudiobookReviewDB(
  db: any,
  reviewInformation: any,
  audiobook_id: any
) {
  console.log("test", reviewInformation, audiobook_id);
  db.transaction((tx: any) => {
    tx.executeSql(
      `update ${audiobookProgressTableName} set ${usersAudiobookReview}=? where ${audiobookId}=?;`,
      [reviewInformation, audiobook_id]
    );
  });
}

export function updateIfBookShelvedDB(
  db: any,
  audiobook_id: any,
  audiobook_shelved: any
) {
  db.transaction((tx: any) => {
    tx.executeSql(
      `update ${audiobookProgressTableName} set ${audiobookShelved}=? where ${audiobookId}=?;`,
      [audiobook_shelved, audiobook_id]
    );
  });
}

export function updateListeningProgressDB(
  db: any,
  listening_progress_percent: any,
  current_listening_time: any,
  audiobook_id: any
) {
  db.transaction((tx: any) => {
    tx.executeSql(
      `update ${audiobookProgressTableName} set ${listeningProgressPercent}=?,${currentListeningTime}=? where ${audiobookId}=?;`,
      [listening_progress_percent, current_listening_time, audiobook_id]
    );
  });
}

export function updateAudiobookRatingDB(
  db: any,
  audiobook_id: any,
  audiobook_rating: any
) {
  db.transaction((tx: any) => {
    tx.executeSql(
      `update ${audiobookProgressTableName} set ${audiobookRating}=? where ${audiobookId}=?;`,
      [audiobook_rating, audiobook_id]
    );
  });
}

export function initialAudioBookProgressStoreDB(db: any, initialAudiobook: any) {
  db.transaction((tx: any) => {
    tx.executeSql(
      `insert into ${audiobookProgressTableName}(${audiobookId}, ${audiotrackProgressBars}, ${currentAudiotrackPositions}, ${audiobookShelved}, ${audiobookRating}) values(?,?,?,?,?)`,
      [
        initialAudiobook.audiobook_id,
        initialAudiobook.audiotrack_progress_bars,
        initialAudiobook.current_audiotrack_positions,
        initialAudiobook.audiobook_shelved,
        initialAudiobook.audiobook_rating,
      ]
    );
  });
}

// ─── Ratings cache ──────────────────────────────────────────────────────────
// Lightweight table to persist community ratings fetched from archive.org so
// they survive tab switches and app restarts without re-hitting the API.

export const audiobookRatingsCacheTableName = "audiobook_ratings_cache";

export interface RatingCacheEntry {
  rating: number;
  hasRating: boolean;
}

export function createRatingsCacheTable(db: any) {
  db.transaction((tx: any) => {
    tx.executeSql(
      `CREATE TABLE IF NOT EXISTS ${audiobookRatingsCacheTableName} ` +
        `(audiobook_id TEXT PRIMARY KEY, audiobook_rating REAL, has_rating INTEGER NOT NULL DEFAULT 1, fetched_at INTEGER);`
    );
    // Migrate existing tables that don't have the has_rating column yet
    tx.executeSql(
      `ALTER TABLE ${audiobookRatingsCacheTableName} ADD COLUMN has_rating INTEGER NOT NULL DEFAULT 1;`,
      [],
      undefined,
      () => {} // ignore error if column already exists
    );
  });
}

export function upsertRatingCacheDB(
  db: any,
  audiobook_id: string,
  rating: number,
  hasRating: boolean = true
) {
  db.transaction((tx: any) => {
    tx.executeSql(
      `INSERT OR REPLACE INTO ${audiobookRatingsCacheTableName} ` +
        `(audiobook_id, audiobook_rating, has_rating, fetched_at) VALUES (?, ?, ?, ?);`,
      [audiobook_id, rating, hasRating ? 1 : 0, Date.now()]
    );
  });
}

export function loadRatingsCacheDB(
  db: any,
  callback: (ratings: Record<string, RatingCacheEntry>) => void
) {
  db.transaction((tx: any) => {
    tx.executeSql(
      `SELECT audiobook_id, audiobook_rating, has_rating FROM ${audiobookRatingsCacheTableName};`,
      [],
      (_: any, { rows }: any) => {
        const ratings: Record<string, RatingCacheEntry> = {};
        rows._array.forEach((row: any) => {
          ratings[row.audiobook_id] = {
            rating: row.audiobook_rating ?? 0,
            hasRating: row.has_rating === 1,
          };
        });
        callback(ratings);
      }
    );
  });
}

// Bulk query: load cache entries only for a specific set of IDs.
// Much faster than loading the full table when only checking a page of books.
export function loadRatingsCacheForIds(
  db: any,
  ids: string[],
  callback: (ratings: Record<string, RatingCacheEntry>) => void
) {
  if (ids.length === 0) {
    callback({});
    return;
  }
  const placeholders = ids.map(() => "?").join(",");
  db.transaction((tx: any) => {
    tx.executeSql(
      `SELECT audiobook_id, audiobook_rating, has_rating FROM ${audiobookRatingsCacheTableName} WHERE audiobook_id IN (${placeholders});`,
      ids,
      (_: any, { rows }: any) => {
        const ratings: Record<string, RatingCacheEntry> = {};
        rows._array.forEach((row: any) => {
          ratings[row.audiobook_id] = {
            rating: row.audiobook_rating ?? 0,
            hasRating: row.has_rating === 1,
          };
        });
        callback(ratings);
      }
    );
  });
}

// ─── AsyncStorage helpers ────────────────────────────────────────────────────

export const storeAsyncData = async (key: any, value: any) => {
  try {
    const jsonValue = JSON.stringify(value);
    await AsyncStorage.setItem(key, jsonValue);
  } catch (e) {
    console.log(e);
  }
};

export const getAsyncData = async (key: any) => {
  try {
    const jsonValue = await AsyncStorage.getItem(key);
    return jsonValue != null ? JSON.parse(jsonValue) : null;
  } catch (e) {
    // error reading value
    console.log(e);
  }
};
