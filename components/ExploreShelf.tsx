import {
  FlatList,
  StyleSheet,
  View,
  ActivityIndicator,
  Dimensions,
  Text,
  InteractionManager,
} from "react-native";
import { Rating } from "react-native-ratings";
import { useFocusEffect } from "@react-navigation/native";
import React, { useState, useEffect, useRef, useCallback } from "react";
import { Audiobook, Review } from "../types.js";

import AudiobookAccordionList from "../components/audiobookAccordionList";
import AudiobookCover from "./AudiobookCover";

import { openDatabase } from "../db/utils";
import {
  createHistoryTableDB,
  createAudioBookDataTable,
  addAudiobookToHistoryDB,
  audiobookProgressTableName,
  initialAudioBookProgressStoreDB,
  updateAudiobookRatingDB,
  createRatingsCacheTable,
  upsertRatingCacheDB,
  loadRatingsCacheDB,
  loadRatingsCacheForIds,
  loadProgressForIds,
} from "../db/database_functions";
import useColorScheme from "../hooks/useColorScheme";
import Colors from "../constants/Colors";
import { Pressable } from "react-native";
const db = openDatabase();

// Memoized item component — only re-renders when its specific book's
// progress, rating, or cover changes, not on every parent state update.
const ExploreBookItem = React.memo(({
  item, index, db, progress, ratingFetched, bookCover, reviewURL,
  resizeCoverImageWidth, resizeCoverImageHeight, windowWidth, windowHeight,
  colorScheme, audiobooksProgress, setAudiobooksProgress,
  addAudiobookToHistory, getAverageAudiobookReview, bookCovers, reviewURLS,
}: any) => (
  <View>
    <AudiobookCover
      item={item}
      index={index}
      db={db}
      audiobooksProgress={audiobooksProgress}
      setAudiobooksProgress={setAudiobooksProgress}
      addAudiobookToHistory={addAudiobookToHistory}
      getAverageAudiobookReview={getAverageAudiobookReview}
      bookCovers={bookCovers}
      reviewURLS={reviewURLS}
      resizeCoverImageWidth={resizeCoverImageWidth}
      resizeCoverImageHeight={resizeCoverImageHeight}
      windowWidth={windowWidth}
      windowHeight={windowHeight}
    />
    {progress?.audiobook_rating > 0 ? (
      <Rating
        showRating={false}
        imageSize={20}
        ratingCount={5}
        startingValue={progress.audiobook_rating}
        readonly={true}
        tintColor={Colors[colorScheme].ratingBackgroundColor}
      />
    ) : ratingFetched ? (
      <Text style={exploreItemStyles.noRatingText}>No rating</Text>
    ) : null}
    <AudiobookAccordionList
      accordionTitle={item?.title}
      audiobookTitle={item?.title}
      audiobookAuthorFirstName={item?.authors[0]?.first_name}
      audiobookAuthorLastName={item?.authors[0]?.last_name}
      audiobookTotalTime={item?.totaltime}
      audiobookCopyrightYear={item?.copyright_year}
      audiobookGenres={JSON.stringify(item?.genres)}
      audiobookLanguage={item?.language}
    />
  </View>
));

const exploreItemStyles = StyleSheet.create({
  noRatingText: {
    textAlign: "center",
    fontSize: 11,
    color: "#999",
    paddingVertical: 2,
  },
});

export default function ExploreShelf(props: any) {
  const colorScheme = useColorScheme();
  const [loadingAudioBooks, setLoadingAudioBooks] = useState(true);
  const [data, setAudiobooks] = useState<any>([]);
  const [bookCovers, setBookCovers] = useState<any[]>([]);
  const [reviewURLS, setReviewsUrlList] = useState<any[]>([]);
  const [audiobooksProgress, setAudiobooksProgress] = useState({});
  const [ratingsFetched, setRatingsFetched] = useState<Set<any>>(new Set());
  const {
    apiSettings,
    requestAudiobookAmount,
    loadingAudiobookAmount,
    setLoadingAudiobookAmount,
    searchBarCurrentText,
    searchBarInputSubmitted,
    searchBy,
    setGettingAverageReview,
  } = props;

  useEffect(() => {
    try {
      createAudioBookDataTable(db);
      createHistoryTableDB(db);
      createRatingsCacheTable(db);
    } catch (err) {
      console.log(err);
    }
  }, []);

  function addAudiobookToHistory(index: number, item: Audiobook): void {
    addAudiobookToHistoryDB(db, {
      audiobook_rss_url: item?.url_rss,
      audiobook_id: item?.id,
      audiobook_image: bookCovers[index],
      audiobook_num_sections: item?.num_sections,
      audiobook_ebook_url: item?.url_text_source,
      audiobook_zip: item?.url_zip_file,
      audiobook_title: item?.title,
      audiobook_author_first_name: item?.authors[0]?.first_name,
      audiobook_author_last_name: item?.authors[0]?.last_name,
      audiobook_total_time: item?.totaltime,
      audiobook_total_time_secs: item?.totaltimesecs,
      audiobook_copyright_year: item?.copyright_year,
      audiobook_genres: JSON.stringify(item?.genres),
      audiobook_review_url: reviewURLS[index],
      audiobook_language: item?.language,
      audiobook_project_url: item?.url_project,
      audiobook_librivox_url: item?.url_librivox,
      audiobook_iarchive_url: item?.url_iarchive,
    });
  }

  function getAverageAudiobookReview(index: number) {
    if (reviewURLS[index]) {
      let initialValue = 0;
      const averageReview = fetch(reviewURLS[index])
        .then((response) => response.json())
        .then((json) => {
          if (json?.result !== undefined) {
            let stars = json?.result
              .map((review: Review) => Number(review?.stars))
              .reduce(
                (accumulator: number, currentValue: number) =>
                  accumulator + currentValue,
                initialValue
              );
            const averageReview = stars / json?.result.length;
            if (!isNaN(averageReview)) {
              return averageReview;
            } else {
              return undefined;
            }
          }
        })
        .catch((err) => console.error(err));
      return averageReview;
    }
  }

  const requestAudiobooksFromAPI = () => {
    let searchQuery;
    if (searchBarInputSubmitted === "defaultTitleSearch") {
      searchQuery = "";
    } else {
      searchQuery = encodeURIComponent(searchBarInputSubmitted);
    }
    const amountOfAudiobooks = encodeURIComponent(requestAudiobookAmount);
    const librivoxAudiobooksAPI = encodeURI(
      "https://librivox.org/api/feed/audiobooks"
    );
    const carot = encodeURIComponent("^");
    // fields removed: sections(adds to loading time), description(not url decoded),translators.
    const fields =
      "id,title,url_text_source,language,copyright_year,num_sections,url_rss,url_zip_file,url_project,url_librivox,url_iarchive,url_other,totaltime,totaltimesecs,authors,genres,coverart_jpg,coverart_thumbnail";
    let apiFetchQuery;
    switch (searchBy) {
      case "recent":
        const oneMonthsAgoInUnixTime =
          // TODO: Add a range slider for period of time; currently is for past month...
          (new Date().getTime() - 30 * 24 * 60 * 60 * 1000) / 1000;
        apiFetchQuery = encodeURI(
          `${librivoxAudiobooksAPI}/?since=${oneMonthsAgoInUnixTime}&fields={${fields}}&extended=1&coverart=1&format=json&limit=${amountOfAudiobooks}`
        );
        break;
      case "title":
        apiFetchQuery = encodeURI(
          `${librivoxAudiobooksAPI}/?title=${carot}${searchQuery}&fields={${fields}}&extended=1&coverart=1&format=json&limit=${amountOfAudiobooks}`
        );
        break;
      case "author":
        apiFetchQuery = encodeURI(
          `${librivoxAudiobooksAPI}/?author=${searchQuery}&fields={${fields}}&extended=1&coverart=1&format=json&limit=${amountOfAudiobooks}`
        );
        break;
      case "genre":
        apiFetchQuery = encodeURI(
          `${librivoxAudiobooksAPI}/?genre=${searchQuery}&fields={${fields}}&extended=1&coverart=1&format=json&limit=${amountOfAudiobooks}`
        );
        break;
      default:
        break;
    }
    if (searchBy) {
      fetch(apiFetchQuery)
        .then((response) => response.json())
        .then((json) => setAudiobooks(json))
        .catch((error) => console.error(error))
        .finally(() => {
          setLoadingAudioBooks(false);
          setLoadingAudiobookAmount(false);
        });
    }
  };

  const timesAudiobookAmountSet = useRef(0);

  useEffect(() => {
    if (timesAudiobookAmountSet.current < 2) {
      timesAudiobookAmountSet.current += 1;
    } else {
      setLoadingAudiobookAmount(true);
      requestAudiobooksFromAPI();
    }
  }, [requestAudiobookAmount]);

  const timesSearchBarSet = useRef(0);
  useEffect(() => {
    switch (searchBy) {
      case "recent":
        setLoadingAudioBooks(true);
        requestAudiobooksFromAPI();
        break;
      case "genre":
      case "author":
      case "title":
        if (timesSearchBarSet.current < 1) {
          timesSearchBarSet.current += 1;
        } else {
          setLoadingAudioBooks(true);
          requestAudiobooksFromAPI();
        }
        break;
    }
  }, [searchBarInputSubmitted]);

  const bookCoverURL: string[] = [];
  const reviewsURL: string[] = [];
  useEffect(() => {
    if (data.books) {
      const dataKeys = Object.values(data.books);
      dataKeys.forEach((book: any) => {
        try {
        // Use the new LibriVox coverart API field if available; fall back to archive.org image service
        let coverUrl: string;
        if (book.coverart_thumbnail) {
          coverUrl = book.coverart_thumbnail;
        } else if (book.coverart_jpg) {
          coverUrl = book.coverart_jpg;
        } else {
          // URL format: https://archive.org/compress/{identifier}/formats=...
          // identifier is always at index 4 after splitting by "/"
          const identifier = (book.url_zip_file || "").split("/")[4] ?? "";
          coverUrl = encodeURI(
            `https://archive.org/services/get-item-image.php?identifier=${identifier}`
          );
        }
        // URL format: https://archive.org/compress/{identifier}/formats=...
        const identifier = (book.url_zip_file || "").split("/")[4] ?? "";
        const reviewUrl = encodeURI(
          `https://archive.org/metadata/${identifier}/reviews/`
        );
        bookCoverURL.push(coverUrl);
        reviewsURL.push(reviewUrl);
        } catch (e) {
          bookCoverURL.push("");
          reviewsURL.push("");
        }
      });
      setBookCovers(bookCoverURL);
      setReviewsUrlList(reviewsURL);
    }
  }, [data.books]);

  // Auto-fetch ratings AND progress: first check DB cache (fast bulk query), only hit network for uncached books.
  // Wrapped in InteractionManager to avoid interfering with tab animations.
  useEffect(() => {
    if (reviewURLS.length === 0 || !data?.books) return;
    const books = Object.values(data.books) as any[];
    const allIds = books.map((b: any) => String(b.id));
    const timeouts: ReturnType<typeof setTimeout>[] = [];
    let cancelled = false;

    const task = InteractionManager.runAfterInteractions(() => {
      // Load listening progress for this batch of books from DB
      loadProgressForIds(db, allIds, (progressRows) => {
        if (cancelled) return;
        if (Object.keys(progressRows).length > 0) {
          setAudiobooksProgress((prev: any) => {
            const updates: any = {};
            Object.entries(progressRows).forEach(([id, row]: any) => {
              // Merge: keep any existing data but update progress fields from DB
              updates[id] = { ...(prev[id] || {}), ...row };
            });
            return { ...prev, ...updates };
          });
        }
      });

      // Single bulk DB query to find which books are already ratings-cached
      loadRatingsCacheForIds(db, allIds, (cached) => {
        if (cancelled) return;

        // Pre-populate state from cache immediately (no network needed)
        if (Object.keys(cached).length > 0) {
          setRatingsFetched((prev) => {
            const next = new Set(prev);
            Object.keys(cached).forEach((id) => next.add(id));
            return next;
          });
          setAudiobooksProgress((prev: any) => {
            const updates: any = {};
            Object.entries(cached).forEach(([id, entry]: any) => {
              if (entry.hasRating && entry.rating > 0 && !prev[id]?.audiobook_rating) {
                updates[id] = { ...(prev[id] || {}), audiobook_id: id, audiobook_rating: entry.rating };
              }
            });
            return Object.keys(updates).length > 0 ? { ...prev, ...updates } : prev;
          });
        }

        // Only fetch from network for books not yet in cache
        let fetchIndex = 0;
        books.forEach((book: any, index: number) => {
          if (!reviewURLS[index] || cached[String(book.id)] !== undefined) return;
          const t = setTimeout(() => {
            if (cancelled) return;
            fetch(reviewURLS[index])
              .then((r) => r.json())
              .then((json) => {
                if (cancelled) return;
                const hasRating = (json?.result?.length ?? 0) > 0;
                const avg = hasRating
                  ? json.result.reduce((s: number, r: any) => s + Number(r.stars), 0) / json.result.length
                  : 0;
                const roundedAvg = isNaN(avg) ? 0 : Math.round(avg * 100) / 100;
                upsertRatingCacheDB(db, String(book.id), roundedAvg, hasRating);
                setRatingsFetched((prev) => new Set([...prev, book.id]));
                if (!isNaN(avg) && avg > 0) {
                  setAudiobooksProgress((prev: any) => {
                    if (prev[book.id]?.audiobook_rating > 0) return prev;
                    const existing = prev[book.id] || {};
                    updateAudiobookRatingDB(db, book.id, roundedAvg);
                    return {
                      ...prev,
                      [book.id]: {
                        ...existing,
                        audiobook_id: book.id,
                        audiobook_rating: avg,
                        audiotrack_progress_bars:
                          existing.audiotrack_progress_bars ??
                          JSON.stringify(new Array(book.num_sections).fill(0)),
                        current_audiotrack_positions:
                          existing.current_audiotrack_positions ??
                          JSON.stringify(new Array(book.num_sections).fill(0)),
                        audiobook_shelved: existing.audiobook_shelved ?? false,
                      },
                    };
                  });
                }
              })
              .catch(() => {
                // Don't cache network errors — will retry next session
                if (!cancelled) setRatingsFetched((prev) => new Set([...prev, book.id]));
              });
          }, fetchIndex * 50);
          timeouts.push(t);
          fetchIndex++;
        });
      });
    });

    return () => {
      cancelled = true;
      task.cancel();
      timeouts.forEach(clearTimeout);
    };
  }, [reviewURLS]);

  // Reload progress & ratings from DB whenever this tab comes into focus —
  // this picks up changes made in Bookshelf (star/unstar) or Audiotracks.
  // useFocusEffect fires reliably for both nested tab switches and
  // returning from parent tabs (e.g. Bookshelf → Explore).
  useFocusEffect(
    useCallback(() => {
      const query = `select * from ${audiobookProgressTableName}`;
      db.transaction((tx) => {
        tx.executeSql(`${query}`, [], (_, { rows }) => {
          const audioProgressData: Record<string, any> = {};
          rows._array.forEach((row) => {
            audioProgressData[row.audiobook_id] = row;
          });
          // Merge in cached community ratings for books not yet in progress table
          loadRatingsCacheDB(db, (cachedRatings) => {
            const fetchedIds = new Set<any>();
            Object.entries(cachedRatings).forEach(([id, entry]: any) => {
              fetchedIds.add(id);
              if (!audioProgressData[id]) {
                audioProgressData[id] = {
                  audiobook_id: id,
                  audiobook_rating: entry.hasRating ? entry.rating : 0,
                };
              } else if (!audioProgressData[id].audiobook_rating && entry.hasRating) {
                audioProgressData[id] = { ...audioProgressData[id], audiobook_rating: entry.rating };
              }
            });
            setRatingsFetched(fetchedIds);
            setAudiobooksProgress(audioProgressData);
          });
        });
      }, undefined);
    }, [])
  );

  const windowWidth = Dimensions.get("window").width;
  const windowHeight = Dimensions.get("window").height;
  const resizeCoverImageHeight = windowHeight / 5;
  const resizeCoverImageWidth = windowWidth / 2 - 42;
  const keyExtractor = useCallback((item: any, index: number) => String(item?.id ?? index), []);

  const renderItem = useCallback(({ item, index }: any) => (
    <ExploreBookItem
      item={item}
      index={index}
      db={db}
      progress={audiobooksProgress[item?.id]}
      ratingFetched={ratingsFetched.has(item?.id)}
      bookCover={bookCovers[index]}
      reviewURL={reviewURLS[index]}
      resizeCoverImageWidth={resizeCoverImageWidth}
      resizeCoverImageHeight={resizeCoverImageHeight}
      windowWidth={windowWidth}
      windowHeight={windowHeight}
      colorScheme={colorScheme}
      audiobooksProgress={audiobooksProgress}
      setAudiobooksProgress={setAudiobooksProgress}
      addAudiobookToHistory={addAudiobookToHistory}
      getAverageAudiobookReview={getAverageAudiobookReview}
      bookCovers={bookCovers}
      reviewURLS={reviewURLS}
    />
  ), [audiobooksProgress, ratingsFetched, bookCovers, reviewURLS, colorScheme,
      resizeCoverImageWidth, resizeCoverImageHeight, windowWidth, windowHeight]);

  if (!loadingAudioBooks) {
    return (
      <View style={styles.audiobookContainer}>
        <FlatList
          data={data.books}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          numColumns={2}
          extraData={audiobooksProgress}
          removeClippedSubviews={true}
          maxToRenderPerBatch={6}
          initialNumToRender={6}
          windowSize={10}
        />
      </View>
    );
  } else {
    return (
      <View>
        <ActivityIndicator
          accessibilityLabel={"loading"}
          size="large"
          color={Colors[colorScheme].activityIndicatorColor}
          style={styles.ActivityIndicatorStyle}
        />
      </View>
    );
  }
}

const windowWidth = Dimensions.get("window").width;
const windowHeight = Dimensions.get("window").height;

const styles = StyleSheet.create({
  ImageContainer: {
    flexDirection: "column",
    width: windowWidth / 2 - 40,
    borderStyle: "solid",
    borderWidth: 1,
    borderRadius: 2,
  },
  audiobookContainer: {
    marginTop: 2,
    borderRadius: 2,
  },
  ActivityIndicatorStyle: {
    top: windowHeight / 2 - 90,
  },
});
