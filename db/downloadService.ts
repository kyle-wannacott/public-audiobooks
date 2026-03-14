import * as FileSystem from "expo-file-system/legacy";
import { openDatabase } from "./utils";
import {
  insertDownloadTrack,
  updateDownloadTrackStatus,
  getDownloadedTracksForAudiobook,
  deleteDownloadedAudiobook,
} from "./database_functions";

const db = openDatabase();

const DOWNLOAD_DIR = `${FileSystem.documentDirectory}audiobooks/`;

export interface DownloadProgress {
  trackIndex: number;
  progress: number; // 0–1
  status: "pending" | "downloading" | "complete" | "error";
}

type ProgressCallback = (progress: DownloadProgress[]) => void;

async function ensureDir(dirPath: string) {
  const info = await FileSystem.getInfoAsync(dirPath);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(dirPath, { intermediates: true });
  }
}

export async function downloadAudiobook(
  audiobookId: string,
  trackUrls: string[],
  onProgress: ProgressCallback
): Promise<void> {
  const bookDir = `${DOWNLOAD_DIR}${audiobookId}/`;
  await ensureDir(bookDir);

  const progressArr: DownloadProgress[] = trackUrls.map((_, i) => ({
    trackIndex: i,
    progress: 0,
    status: "pending" as const,
  }));

  // Check already-downloaded tracks
  const existingTracks = await new Promise<any[]>((resolve) => {
    getDownloadedTracksForAudiobook(db, audiobookId, resolve);
  });

  for (const track of existingTracks) {
    if (track.status === "complete") {
      const info = await FileSystem.getInfoAsync(track.file_path);
      if (info.exists) {
        progressArr[track.track_index] = {
          trackIndex: track.track_index,
          progress: 1,
          status: "complete",
        };
      }
    }
  }

  onProgress([...progressArr]);

  // Download remaining tracks sequentially to avoid overwhelming the device
  for (let i = 0; i < trackUrls.length; i++) {
    if (progressArr[i].status === "complete") continue;

    const url = trackUrls[i];
    const ext = url.split(".").pop()?.split("?")[0] || "mp3";
    const filePath = `${bookDir}track_${i}.${ext}`;

    progressArr[i] = { trackIndex: i, progress: 0, status: "downloading" };
    onProgress([...progressArr]);

    insertDownloadTrack(db, audiobookId, i, filePath, "downloading");

    try {
      const downloadResumable = FileSystem.createDownloadResumable(
        url,
        filePath,
        {},
        (downloadProgress) => {
          const prog =
            downloadProgress.totalBytesWritten /
            downloadProgress.totalBytesExpectedToWrite;
          progressArr[i] = {
            trackIndex: i,
            progress: prog,
            status: "downloading",
          };
          onProgress([...progressArr]);
        }
      );

      const result = await downloadResumable.downloadAsync();
      if (result) {
        progressArr[i] = { trackIndex: i, progress: 1, status: "complete" };
        updateDownloadTrackStatus(db, audiobookId, i, "complete");
      } else {
        progressArr[i] = { trackIndex: i, progress: 0, status: "error" };
        updateDownloadTrackStatus(db, audiobookId, i, "error");
      }
    } catch (error) {
      console.log(`Download error track ${i}:`, error);
      progressArr[i] = { trackIndex: i, progress: 0, status: "error" };
      updateDownloadTrackStatus(db, audiobookId, i, "error");
    }

    onProgress([...progressArr]);
  }
}

export async function deleteAudiobookFiles(audiobookId: string): Promise<void> {
  const bookDir = `${DOWNLOAD_DIR}${audiobookId}/`;
  try {
    const info = await FileSystem.getInfoAsync(bookDir);
    if (info.exists) {
      await FileSystem.deleteAsync(bookDir, { idempotent: true });
    }
  } catch (e) {
    console.log("Delete error:", e);
  }
  deleteDownloadedAudiobook(db, audiobookId);
}

export function getLocalTrackPath(
  audiobookId: string,
  trackIndex: number,
  originalUrl: string
): string {
  const ext = originalUrl.split(".").pop()?.split("?")[0] || "mp3";
  return `${DOWNLOAD_DIR}${audiobookId}/track_${trackIndex}.${ext}`;
}
