import React, {
  createContext,
  useContext,
  useState,
  useRef,
  useCallback,
  useEffect,
} from "react";
import { Platform, PermissionsAndroid } from "react-native";
import { createAudioPlayer, setAudioModeAsync } from "expo-audio";
import * as FileSystem from "expo-file-system/legacy";
import { openDatabase, roundNumberTwoDecimal } from "../db/utils";
import {
  updateAudioTrackPositionsDB,
  updateAudioTrackIndexDB,
  audiobookProgressTableName,
  initialAudioBookProgressStoreDB,
  getAsyncData,
  storeAsyncData,
  getDownloadedTracksForAudiobook,
} from "../db/database_functions";

const db = openDatabase();

export interface AudiobookMeta {
  audioBookId: string;
  urlRss: string;
  coverImage: string;
  numSections: number;
  title: string;
  authorFirstName: string;
  authorLastName: string;
  totalTime: string;
  totalTimeSecs: number;
  chapters: any[];
  trackUrls: string[];
}

interface AudioContextType {
  // Current audiobook metadata
  currentBook: AudiobookMeta | null;
  // Playback state
  isPlaying: boolean;
  isAudioPaused: boolean;
  isLoading: boolean;
  isLoadedOnce: boolean;
  currentTrackIndex: number;
  currentSliderPosition: number;
  currentTrackInfo: {
    title: string;
    reader: string;
    duration: number;
  };
  // Progress data
  linearProgressBars: number[];
  currentAudiotrackPositionsMs: number[];
  totalListeningProgress: number;
  totalListeningTimeMs: number;
  // Player settings
  audioPlayerSettings: any;
  setAudioPlayerSettings: (settings: any) => void;
  // Control functions
  loadBook: (book: AudiobookMeta) => Promise<void>;
  loadTrack: (index: number, positionMs?: number) => Promise<void>;
  playAudio: () => Promise<void>;
  pauseAudio: () => Promise<void>;
  handleNextTrack: () => Promise<void>;
  handlePrevTrack: () => Promise<void>;
  forwardTenSeconds: () => Promise<void>;
  rewindTenSeconds: () => Promise<void>;
  seekToPosition: (percent: number) => Promise<void>;
  applyPlayerSettings: (settings: any) => void;
  // Mini player visibility
  showMiniPlayer: boolean;
  miniPlayerEnabled: boolean;
  setMiniPlayerEnabled: (enabled: boolean) => void;
  // Display mode: grid (2-col) or list (1-col full-width rows)
  bookDisplayMode: 'grid' | 'list';
  setBookDisplayMode: (mode: 'grid' | 'list') => void;
  // True once AsyncStorage preferences (displayMode, miniPlayer) have been read
  prefsLoaded: boolean;
}

const AudioContext = createContext<AudioContextType | null>(null);

export function useAudio() {
  const ctx = useContext(AudioContext);
  if (!ctx) throw new Error("useAudio must be used within AudioProvider");
  return ctx;
}

export function AudioProvider({ children }: { children: React.ReactNode }) {
  const sound = useRef(createAudioPlayer(null, { updateInterval: 1000 }));
  const statusSubscription = useRef<any>(null);

  const [currentBook, setCurrentBook] = useState<AudiobookMeta | null>(null);
  const currentBookRef = useRef<AudiobookMeta | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isAudioPaused, setIsAudioPaused] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadedOnce, setIsLoadedOnce] = useState(false);

  const trackIndexRef = useRef(0);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [currentSliderPosition, setCurrentSliderPosition] = useState(0);
  const [currentTrackInfo, setCurrentTrackInfo] = useState({
    title: "",
    reader: "",
    duration: 0,
  });

  const [linearProgressBars, setLinearProgressBars] = useState<number[]>([]);
  const linearProgressBarsRef = useRef<number[]>([]);
  const [currentAudiotrackPositionsMs, setCurrentAudiotrackPositionsMs] =
    useState<number[]>([]);
  const audiotrackPositionsMsRef = useRef<number[]>([]);
  const [totalListeningProgress, setTotalListeningProgress] = useState(0);
  const [totalListeningTimeMs, setTotalListeningTimeMs] = useState(0);

  const [audioPlayerSettings, setAudioPlayerSettings] = useState({
    rate: 1.0,
    shouldCorrectPitch: true,
    volume: 1.0,
    isMuted: false,
    isLooping: false,
    shouldPlay: false,
  });

  const [showMiniPlayer, setShowMiniPlayer] = useState(false);
  const [miniPlayerEnabled, setMiniPlayerEnabledState] = useState(true);

  const setMiniPlayerEnabled = useCallback((enabled: boolean) => {
    setMiniPlayerEnabledState(enabled);
    storeAsyncData("miniPlayerEnabled", enabled);
  }, []);

  const [bookDisplayMode, setBookDisplayModeState] = useState<'grid' | 'list'>('grid');
  const [prefsLoaded, setPrefsLoaded] = useState(false);

  const setBookDisplayMode = useCallback((mode: 'grid' | 'list') => {
    setBookDisplayModeState(mode);
    storeAsyncData("bookDisplayMode", mode);
  }, []);

  // Load saved audio settings on mount
  useEffect(() => {
    // Request notification permission on Android 13+ for media controls
    if (Platform.OS === 'android' && Platform.Version >= 33) {
      PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
      ).catch(console.log);
    }
    // Wait for the two display-critical prefs before showing the shelf
    Promise.all([
      getAsyncData("miniPlayerEnabled"),
      getAsyncData("bookDisplayMode"),
    ]).then(([miniSaved, displaySaved]: any[]) => {
      if (miniSaved !== null && miniSaved !== undefined) setMiniPlayerEnabledState(miniSaved);
      if (displaySaved === 'grid' || displaySaved === 'list') setBookDisplayModeState(displaySaved);
      setPrefsLoaded(true);
    });
    getAsyncData("audioTrackSettingsTest").then((saved: any) => {
      if (saved) setAudioPlayerSettings(saved);
    });
    getAsyncData("audioModeSettings").then((saved: any) => {
      if (saved) {
        setAudioModeAsync({
          playsInSilentMode: true,
          shouldPlayInBackground: saved.staysActiveInBackground ?? true,
          interruptionMode: saved.shouldDuckAndroid ? "duckOthers" : "doNotMix",
          shouldRouteThroughEarpiece:
            saved.playThroughEarpieceAndroid ?? false,
          allowsRecording: false,
        }).catch(console.log);
      } else {
        setAudioModeAsync({
          playsInSilentMode: true,
          shouldPlayInBackground: true,
          interruptionMode: "duckOthers",
          shouldRouteThroughEarpiece: false,
          allowsRecording: false,
        }).catch(console.log);
      }
    });
  }, []);

  // Persist settings when changed
  useEffect(() => {
    storeAsyncData("audioTrackSettingsTest", audioPlayerSettings);
  }, [audioPlayerSettings]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (statusSubscription.current) {
        statusSubscription.current.remove();
      }
      sound.current.clearLockScreenControls();
      sound.current.release();
    };
  }, []);

  const saveProgressToDB = useCallback(() => {
    const book = currentBookRef.current;
    if (!book) return;
    try {
      const positions = audiotrackPositionsMsRef.current;
      const progressBars = linearProgressBarsRef.current;
      const initialValue = 0;
      const currentListeningTime = positions.reduce(
        (prev: number, cur: number) => prev + Number(cur),
        initialValue
      );
      const listeningProgressPercent =
        currentListeningTime / 1000 / book.totalTimeSecs;
      updateAudioTrackPositionsDB(db, {
        audiotrack_progress_bars: JSON.stringify(progressBars),
        listening_progress_percent: listeningProgressPercent,
        current_listening_time: currentListeningTime,
        current_audiotrack_positions: JSON.stringify(positions),
        audiobook_id: book.audioBookId,
      });
    } catch (err) {
      console.log(err);
    }
  }, []);

  const getTrackUri = useCallback(
    async (bookId: string, trackIndex: number, streamUrl: string) => {
      try {
        const downloads = await new Promise<any[]>((resolve) => {
          getDownloadedTracksForAudiobook(db, bookId, (tracks: any[]) =>
            resolve(tracks)
          );
        });
        const downloaded = downloads.find(
          (d: any) => d.track_index === trackIndex && d.status === "complete"
        );
        if (downloaded) {
          const info = await FileSystem.getInfoAsync(downloaded.file_path);
          if (info.exists) {
            return downloaded.file_path;
          }
        }
      } catch (e) {
        // Fall through to stream
      }
      return streamUrl;
    },
    []
  );

  const updateStatus = useCallback(
    async (data: any) => {
      try {
        const book = currentBookRef.current;
        if (!book) return;
        const positionMillis = data.currentTime * 1000;
        const durationMillis = data.duration * 1000;

        if (data.didJustFinish) {
          // Update progress for finished track
          const idx = trackIndexRef.current;
          const newPositions = [...audiotrackPositionsMsRef.current];
          newPositions[idx] = positionMillis;
          audiotrackPositionsMsRef.current = newPositions;
          setCurrentAudiotrackPositionsMs(newPositions);

          const newBars = [...linearProgressBarsRef.current];
          newBars[idx] = durationMillis > 0 ? positionMillis / durationMillis : 0;
          linearProgressBarsRef.current = newBars;
          setLinearProgressBars(newBars);
          saveProgressToDB();

          if (idx >= book.trackUrls.length - 1) {
            setIsPlaying(false);
            setIsAudioPaused(true);
          } else {
            // Auto-advance to next track
            const nextIdx = idx + 1;
            trackIndexRef.current = nextIdx;
            setCurrentTrackIndex(nextIdx);
            updateAudioTrackIndexDB(db, nextIdx, book.audioBookId);

            const uri = await getTrackUri(
              book.audioBookId,
              nextIdx,
              book.trackUrls[nextIdx]
            );

            if (statusSubscription.current) {
              statusSubscription.current.remove();
            }
            sound.current.replace({ uri });
            sound.current.setPlaybackRate(audioPlayerSettings.rate);
            sound.current.volume = audioPlayerSettings.volume;
            sound.current.muted = audioPlayerSettings.isMuted;
            sound.current.shouldCorrectPitch =
              audioPlayerSettings.shouldCorrectPitch;

            const savedPos =
              audiotrackPositionsMsRef.current[nextIdx] || 0;
            if (savedPos > 0) {
              await sound.current.seekTo(savedPos / 1000);
            }

            statusSubscription.current = sound.current.addListener(
              "playbackStatusUpdate",
              updateStatus
            );

            setCurrentTrackInfo({
              title:
                book.chapters[nextIdx]?.section_number +
                ". " +
                book.chapters[nextIdx]?.title,
              reader: book.chapters[nextIdx]?.readers?.[0]?.display_name || "",
              duration: sound.current.duration * 1000,
            });

            sound.current.updateLockScreenMetadata({
              title:
                book.chapters[nextIdx]?.section_number +
                ". " +
                book.chapters[nextIdx]?.title,
              artist: `${book.authorFirstName} ${book.authorLastName}`,
              albumTitle: book.title,
              artworkUrl: book.coverImage,
            });

            sound.current.play();
            setIsPlaying(true);
            setIsAudioPaused(false);
            setCurrentSliderPosition(0);
          }
        } else if (positionMillis > 0 && durationMillis > 0) {
          const idx = trackIndexRef.current;
          const progress = positionMillis / durationMillis;

          const newPositions = [...audiotrackPositionsMsRef.current];
          newPositions[idx] = positionMillis;
          audiotrackPositionsMsRef.current = newPositions;
          setCurrentAudiotrackPositionsMs(newPositions);

          const newBars = [...linearProgressBarsRef.current];
          newBars[idx] = progress;
          linearProgressBarsRef.current = newBars;
          setLinearProgressBars(newBars);

          setCurrentSliderPosition(progress * 100);

          // Update total listening
          const totalMs = newPositions.reduce(
            (a: number, b: number) => a + Number(b),
            0
          );
          setTotalListeningTimeMs(totalMs);
          setTotalListeningProgress(totalMs / 1000 / book.totalTimeSecs);

          saveProgressToDB();

          setCurrentTrackInfo((prev) => {
            if (prev.duration !== durationMillis) {
              return { ...prev, duration: durationMillis };
            }
            return prev;
          });
        }
      } catch (error) {
        console.log("UpdateStatus error:", error);
      }
    },
    [audioPlayerSettings, saveProgressToDB, getTrackUri]
  );

  const loadBook = useCallback(
    async (book: AudiobookMeta) => {
      currentBookRef.current = book;
      setCurrentBook(book);
      setShowMiniPlayer(true);

      // Initialize progress arrays
      const sections = book.numSections;
      let progressBars = new Array(sections).fill(0);
      let positions = new Array(sections).fill(0);
      let savedIndex = 0;

      // Try to load saved progress from DB
      try {
        await new Promise<void>((resolve) => {
          db.transaction((tx: any) => {
            tx.executeSql(
              `select * from ${audiobookProgressTableName} where audiobook_id=?`,
              [book.audioBookId],
              (_: any, { rows }: any) => {
                if (rows._array.length > 0) {
                  const row = rows._array[0];
                  if (row.audiotrack_progress_bars) {
                    progressBars = JSON.parse(row.audiotrack_progress_bars);
                  }
                  if (row.current_audiotrack_positions) {
                    positions = JSON.parse(row.current_audiotrack_positions);
                  }
                  if (row.current_audiotrack_index != null) {
                    savedIndex = row.current_audiotrack_index;
                  }
                }
                resolve();
              }
            );
          });
        });
      } catch (e) {
        console.log(e);
      }

      // Ensure DB row exists
      try {
        initialAudioBookProgressStoreDB(db, {
          audiobook_id: book.audioBookId,
          audiotrack_progress_bars: JSON.stringify(progressBars),
          current_audiotrack_positions: JSON.stringify(positions),
          audiobook_shelved: 0,
          audiobook_rating: undefined,
        });
      } catch (e) {
        // Row already exists, which is fine
      }

      linearProgressBarsRef.current = progressBars;
      audiotrackPositionsMsRef.current = positions;
      setLinearProgressBars(progressBars);
      setCurrentAudiotrackPositionsMs(positions);

      const totalMs = positions.reduce(
        (a: number, b: number) => a + Number(b),
        0
      );
      setTotalListeningTimeMs(totalMs);
      setTotalListeningProgress(totalMs / 1000 / book.totalTimeSecs);

      trackIndexRef.current = savedIndex;
      setCurrentTrackIndex(savedIndex);
    },
    []
  );

  const loadTrack = useCallback(
    async (index: number, positionMs = 0) => {
      const book = currentBookRef.current;
      if (!book || !book.trackUrls[index]) return;

      trackIndexRef.current = index;
      setCurrentTrackIndex(index);
      updateAudioTrackIndexDB(db, index, book.audioBookId);
      setIsLoading(true);

      try {
        if (statusSubscription.current) {
          statusSubscription.current.remove();
        }

        const uri = await getTrackUri(
          book.audioBookId,
          index,
          book.trackUrls[index]
        );
        sound.current.replace({ uri });

        // Apply settings
        sound.current.setPlaybackRate(audioPlayerSettings.rate);
        sound.current.loop = audioPlayerSettings.isLooping;
        sound.current.muted = audioPlayerSettings.isMuted;
        sound.current.volume = audioPlayerSettings.volume;
        sound.current.shouldCorrectPitch =
          audioPlayerSettings.shouldCorrectPitch;

        if (positionMs > 0) {
          await sound.current.seekTo(positionMs / 1000);
        }

        statusSubscription.current = sound.current.addListener(
          "playbackStatusUpdate",
          updateStatus
        );

        const chapterTitle =
          book.chapters[index]?.section_number +
          ". " +
          book.chapters[index]?.title;
        const readerName =
          book.chapters[index]?.readers?.[0]?.display_name || "";

        setCurrentTrackInfo({
          title: chapterTitle,
          reader: readerName,
          duration: sound.current.duration * 1000,
        });

        setIsLoading(false);
        setIsLoadedOnce(true);
        setShowMiniPlayer(true);

        // Start playing first so MediaSession sees an active player
        sound.current.play();
        setIsPlaying(true);
        setIsAudioPaused(false);

        // Lock screen / notification — call after play() so the MediaSession
        // sees the player in a playing state and shows controls
        try {
          sound.current.setActiveForLockScreen(true, {
            title: chapterTitle,
            artist: `${book.authorFirstName} ${book.authorLastName}`,
            albumTitle: book.title,
            artworkUrl: book.coverImage,
          }, {
            showSeekForward: true,
            showSeekBackward: true,
          });
        } catch (lockErr) {
          console.log("LockScreen setup error:", lockErr);
        }
      } catch (error) {
        setIsLoading(false);
        console.log("LoadTrack error:", error);
      }
    },
    [audioPlayerSettings, updateStatus, getTrackUri]
  );

  const playAudio = useCallback(async () => {
    try {
      if (!sound.current.playing) {
        sound.current.play();
        setIsPlaying(true);
        setIsAudioPaused(false);
      }
    } catch (error) {
      console.log("PlayAudio error:", error);
    }
  }, []);

  const pauseAudio = useCallback(async () => {
    try {
      if (sound.current.playing) {
        sound.current.pause();
        setIsPlaying(false);
        setIsAudioPaused(true);
        saveProgressToDB();
      }
    } catch (error) {
      console.log("PauseAudio error:", error);
    }
  }, [saveProgressToDB]);

  const handleNextTrack = useCallback(async () => {
    const book = currentBookRef.current;
    if (!book) return;
    try {
      const nextIdx = trackIndexRef.current + 1;
      if (nextIdx < book.trackUrls.length) {
        setCurrentSliderPosition(0);
        await loadTrack(
          nextIdx,
          audiotrackPositionsMsRef.current[nextIdx] || 0
        );
      } else {
        // Wrap to beginning
        setCurrentSliderPosition(0);
        await loadTrack(
          0,
          audiotrackPositionsMsRef.current[0] || 0
        );
      }
    } catch (err) {
      console.log(err);
    }
  }, [loadTrack]);

  const handlePrevTrack = useCallback(async () => {
    const book = currentBookRef.current;
    if (!book) return;
    try {
      const prevIdx = trackIndexRef.current - 1;
      if (prevIdx >= 0) {
        setCurrentSliderPosition(0);
        await loadTrack(
          prevIdx,
          audiotrackPositionsMsRef.current[prevIdx] || 0
        );
      }
    } catch (err) {
      console.log(err);
    }
  }, [loadTrack]);

  const forwardTenSeconds = useCallback(async () => {
    try {
      if (sound.current.isLoaded) {
        const currentPosition =
          audiotrackPositionsMsRef.current[trackIndexRef.current] || 0;
        await sound.current.seekTo((currentPosition + 10000) / 1000);
      }
    } catch (error) {
      console.log(error);
    }
  }, []);

  const rewindTenSeconds = useCallback(async () => {
    try {
      if (sound.current.isLoaded) {
        const currentPosition =
          audiotrackPositionsMsRef.current[trackIndexRef.current] || 0;
        await sound.current.seekTo(
          Math.max(0, currentPosition - 10000) / 1000
        );
      }
    } catch (error) {
      console.log(error);
    }
  }, []);

  const seekToPosition = useCallback(async (percent: number) => {
    try {
      if (sound.current.isLoaded) {
        const durationMs = sound.current.duration * 1000;
        const currentPosition = (percent / 100) * durationMs;
        await sound.current.seekTo(currentPosition / 1000);
      }
    } catch (error) {
      console.log(error);
    }
  }, []);

  const applyPlayerSettings = useCallback((settings: any) => {
    try {
      sound.current.setPlaybackRate(settings.rate);
      sound.current.volume = settings.volume;
      sound.current.muted = settings.isMuted;
      sound.current.shouldCorrectPitch = settings.shouldCorrectPitch;
      sound.current.loop = settings.isLooping;
    } catch (e) {
      console.log("applyPlayerSettings error:", e);
    }
  }, []);

  return (
    <AudioContext.Provider
      value={{
        currentBook,
        isPlaying,
        isAudioPaused,
        isLoading,
        isLoadedOnce,
        currentTrackIndex,
        currentSliderPosition,
        currentTrackInfo,
        linearProgressBars,
        currentAudiotrackPositionsMs,
        totalListeningProgress,
        totalListeningTimeMs,
        audioPlayerSettings,
        setAudioPlayerSettings,
        loadBook,
        loadTrack,
        playAudio,
        pauseAudio,
        handleNextTrack,
        handlePrevTrack,
        forwardTenSeconds,
        rewindTenSeconds,
        seekToPosition,
        applyPlayerSettings,
        showMiniPlayer,
        miniPlayerEnabled,
        setMiniPlayerEnabled,
        bookDisplayMode,
        setBookDisplayMode,
        prefsLoaded,
      }}
    >
      {children}
    </AudioContext.Provider>
  );
}
