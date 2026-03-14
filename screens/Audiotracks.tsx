import React, { useEffect, useState, useRef, useCallback } from "react";
import { ActivityIndicator, Dimensions, Image } from "react-native";
import { ListItem, LinearProgress, Card } from "@rneui/themed";
import { Rating } from "react-native-ratings";
import * as rssParser from "react-native-rss-parser";
import { StyleSheet, Text, View, SectionList } from "react-native";
import { MaterialCommunityIcons, MaterialIcons } from "@expo/vector-icons";

import { Button } from "react-native-paper";
import AudioTrackControls from "../components/audioTrackControls";
import AudioTrackSettings from "../components/audioTrackSettings";
import AudiotrackSliderWithCurrentPlaying from "../components/AudiotrackSliderWithCurrentPlaying";
import MakeUserReview from "../components/audioTrackMakeReview";

import { useSafeAreaInsets } from "react-native-safe-area-context";
import { openDatabase, roundNumberTwoDecimal } from "../db/utils";
import { useNavigation } from "@react-navigation/native";
import useColorScheme from "../hooks/useColorScheme";
import Colors from "../constants/Colors";
import { useAudio, AudiobookMeta } from "../hooks/AudioContext";
import { downloadAudiobook, DownloadProgress } from "../db/downloadService";
import {
  getDownloadedTracksForAudiobook,
  isAudiobookFullyDownloaded,
} from "../db/database_functions";

const db = openDatabase();
import {
  updateIfBookShelvedDB,
  initialAudioBookProgressStoreDB,
  updateAudiobookRatingDB,
  audiobookProgressTableName,
  updateUsersAudiobookReviewDB,
} from "../db/database_functions";

import { getAsyncData, storeAsyncData } from "../db/database_functions";

function Audiotracks(props: any) {
  const audio = useAudio();

  const [reviewInformation, setReviewInformation] = useState({
    reviewTitle: "",
    reviewText: "",
    reviewRating: 0,
  });
  const [userChangedReview, setUserChangedReview] = useState(false);
  const [chapters, setChapters] = useState([]);
  const [dataRSS, setDataRSS] = useState<any[]>([]);
  const [URLSToPlayAudiotracks, setURLSToPlayAudiotracks] = useState<any[]>([]);
  const [reviews, setAudiobookReviews] = useState([]);
  const [AudioBookDescription, setAudioBookDescription] = useState("");
  const [isAudiobookDescriptionExpanded, setIsAudiobookDescriptionExpanded] =
    useState<boolean>(false);

  const [isLoadingAudiobookData, setIsLoadingAudioBookData] = useState(true);
  const [isLoadingAudiotrackUrls, setIsLoadingAudiotrackUrls] =
    useState(true);

  const [isVisible, setIsVisible] = useState(false);
  const [makeReviewOptions, setMakeReviewOptions] = useState(false);

  const [audiotracksData, setAudiotracksData] = useState<any>({
    shelveIconToggle: 0,
    audiobookRating: 0,
  });

  // Download state
  const [isDownloading, setIsDownloading] = useState(false);
  const [isFullyDownloaded, setIsFullyDownloaded] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState<DownloadProgress[]>([]);

  const {
    urlRss,
    audioBookId,
    coverImage,
    numSections,
    urlTextSource,
    urlZipFile,
    title,
    authorFirstName,
    authorLastName,
    totalTime,
    totalTimeSecs,
    copyrightYear,
    genres,
    urlReview,
    language,
    urlProject,
    urlLibrivox,
    urlIArchive,
  } = props.route.params;

  const navigation = useNavigation();
  const colorScheme = useColorScheme();
  const insets = useSafeAreaInsets();

  React.useLayoutEffect(() => {
    try {
      navigation.setOptions({
        headerStyle: {
          backgroundColor: Colors[colorScheme].audiotrackHeaderBGColor,
        },
        headerTitleStyle: { fontWeight: "bold" },
        headerTintColor: Colors[colorScheme].text,
        headerTitle: title,
        headerRight: () => (
          <Button
            accessibilityLabel="Audiotack player settings"
            accessibilityHint="Contains options such as changing speed of audiotrack."
            mode={Colors[colorScheme].buttonMode}
            onPress={() => toggleSettingsOverlay()}
            style={{
              backgroundColor: Colors[colorScheme].buttonBackgroundColor,
            }}
          >
            <MaterialCommunityIcons
              name="cog"
              size={30}
              color={Colors[colorScheme].buttonIconColor}
            />
          </Button>
        ),
      });
    } catch (err) {
      console.log(err);
    }
  }, [title]);

  const storeAudioTrackSettings = async (settings: object) => {
    await storeAsyncData("audioTrackSettingsTest", settings);
  };

  const initialLoadOfAudiotracksDB = (audiobook_id: number) => {
    db.transaction((tx) => {
      try {
        tx.executeSql(
          `select * from ${audiobookProgressTableName} where audiobook_id=?`,
          [audiobook_id],
          (_, { rows }) => {
            rows["_array"].forEach((row) => {
              setAudiotracksData((prev: any) => ({
                ...prev,
                shelveIconToggle: row?.audiobook_shelved,
                audiobookRating: row?.audiobook_rating,
              }));
              if (row?.users_audiobook_review != null) {
                try {
                  setReviewInformation(JSON.parse(row?.users_audiobook_review));
                } catch (e) {}
              }
            });
          }
        );
      } catch (err) {
        console.log(err);
      }
    }, undefined);
  };

  // Check download status
  useEffect(() => {
    isAudiobookFullyDownloaded(db, audioBookId, numSections, (downloaded) => {
      setIsFullyDownloaded(downloaded);
    });
  }, [audioBookId, numSections]);

  useEffect(() => {
    fetch(urlRss)
      .then((response) => response.text())
      .then((responseData) => rssParser.parse(responseData))
      .then((rss) => {
        if (rss?.description !== undefined) {
          setAudioBookDescription(rss?.description);
        }
        if (rss?.items !== undefined) {
          setDataRSS(rss?.items);
        }
      })
      .catch((error) => console.log("Error: ", error))
      .finally(() => {
        setIsLoadingAudiotrackUrls(false);
      });
  }, []);

  useEffect(() => {
    fetch(
      `https://librivox.org/api/feed/audiobooks/?id=${audioBookId}&fields={sections}&extended=1&format=json`
    )
      .then((response) => response.json())
      .then((json) => {
        return setChapters(json?.books?.[0]?.sections);
      })
      .catch((error) => console.log("Error: ", error))
      .finally(() => setIsLoadingAudioBookData(false));
  }, []);

  useEffect(() => {
    fetch(urlReview)
      .then((response) => response.json())
      .then((json) => {
        if (json?.result !== undefined) {
          setAudiobookReviews(json.result);
        }
      })
      .catch((error) => console.log("Error: ", error));
  }, [urlReview, userChangedReview]);

  function updateCoverBookProgress(current_audiotrack_positions: any) {
    const initialValue = 0;
    const currentTimeReadInBook = JSON.parse(
      current_audiotrack_positions
    ).reduce(
      (previousValue: any, currentValue: any) =>
        previousValue + Number(currentValue),
      initialValue
    );
    const currentListeningProgress =
      currentTimeReadInBook / 1000 / totalTimeSecs;
    return [currentTimeReadInBook, currentListeningProgress];
  }

  useEffect(() => {
    try {
      if (reviews.length > 0 && reviews) {
        const initialValue = 0;
        let starsFromReviews = reviews?.map((review: any) =>
          Number(review?.stars)
        );
        const sumOfStarsFromReviews = starsFromReviews?.reduce(
          (previousValue, currentValue) => previousValue + currentValue,
          initialValue
        );
        let averageAudiobookRating = 0;
        if (reviews.length == 1) {
          averageAudiobookRating = sumOfStarsFromReviews;
        } else {
          averageAudiobookRating =
            sumOfStarsFromReviews / starsFromReviews.length;
        }
        setAudiotracksData((prev: any) => ({
          ...prev,
          audiobookRating: averageAudiobookRating,
        }));
        updateAudiobookRatingDB(
          db,
          audioBookId,
          roundNumberTwoDecimal(averageAudiobookRating)
        );
      }
    } catch (e) {
      console.log(e);
    }
  }, [reviews]);

  // Initialize DB row + load saved shelve/rating
  useEffect(() => {
    try {
      let initialAudioBookSections = new Array(numSections).fill(0);
      initialAudioBookProgressStoreDB(db, {
        audiobook_id: audioBookId,
        audiotrack_progress_bars: JSON.stringify(initialAudioBookSections),
        current_audiotrack_positions: JSON.stringify(initialAudioBookSections),
        audiobook_shelved: audiotracksData.shelveIconToggle,
        audiotrack_rating: audiotracksData.audiobookRating,
      });
      initialLoadOfAudiotracksDB(audioBookId);
    } catch (err) {
      console.log(err);
    }
  }, []);

  // Load book into global audio context when chapters + URLs are ready
  const bookLoadedRef = useRef(false);
  const sectionListRef = useRef<any>(null);

  const scrollToReviews = () => {
    try {
      sectionListRef.current?.scrollToLocation({ sectionIndex: 1, itemIndex: 0, viewOffset: 0, animated: true });
    } catch (_) {}
  };

  const scrollToTop = () => {
    try {
      sectionListRef.current?.scrollToLocation({ sectionIndex: 0, itemIndex: 0, viewOffset: 0, animated: true });
    } catch (_) {}
  };
  useEffect(() => {
    if (
      chapters &&
      chapters.length > 0 &&
      URLSToPlayAudiotracks.length > 0 &&
      !bookLoadedRef.current
    ) {
      bookLoadedRef.current = true;
      audio.loadBook({
        audioBookId,
        urlRss,
        coverImage,
        numSections,
        title,
        authorFirstName,
        authorLastName,
        totalTime,
        totalTimeSecs,
        chapters,
        trackUrls: URLSToPlayAudiotracks,
      });
    }
  }, [chapters, URLSToPlayAudiotracks]);

  function msToTime(duration: number) {
    let seconds: any = Math.floor((duration / 1000) % 60),
      minutes: any = Math.floor((duration / (1000 * 60)) % 60),
      hours = Math.floor((duration / (1000 * 60 * 60)) % 24);
    minutes = minutes < 10 ? "0" + minutes : minutes;
    seconds = seconds < 10 ? "0" + seconds : seconds;
    return hours + ":" + minutes + ":" + seconds;
  }

  const GetDurationFormat = (currentDuration: number) => {
    try {
      if (typeof currentDuration === "number") {
        const time = currentDuration / 1000;
        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time - minutes * 60);
        const secondsFormatted = seconds > 9 ? seconds : `0${seconds}`;
        return `${minutes}:${secondsFormatted}`;
      } else {
        return `00:00`;
      }
    } catch (err) {
      console.log(err);
    }
  };

  const FormatChapterDurations = (chapterTimeInSeconds: number) => {
    try {
      if (chapterTimeInSeconds !== undefined) {
        if (chapterTimeInSeconds < 3600) {
          return new Date(chapterTimeInSeconds * 1000)
            .toISOString()
            .substr(14, 5);
        } else {
          return new Date(chapterTimeInSeconds * 1000)
            .toISOString()
            .substr(11, 8);
        }
      }
    } catch (err) {
      console.log(err);
    }
  };

  const PlayFromListenButton = async (index: number) => {
    try {
      await audio.loadTrack(
        index,
        audio.currentAudiotrackPositionsMs[index] || 0
      );
    } catch (e) {
      console.log(e);
    }
  };

  const PlayFromStartOfTrack = async (index: number) => {
    try {
      await audio.loadTrack(index, 0);
    } catch (e) {
      console.log(e);
    }
  };

  const handleDownload = async () => {
    if (isDownloading || isFullyDownloaded || URLSToPlayAudiotracks.length === 0) return;
    setIsDownloading(true);
    await downloadAudiobook(
      audioBookId,
      URLSToPlayAudiotracks,
      (progress) => {
        setDownloadProgress(progress);
        const allDone = progress.every((p) => p.status === "complete");
        if (allDone) {
          setIsFullyDownloaded(true);
          setIsDownloading(false);
        }
      }
    );
  };

  const renderAudiotracks = ({ item, index }: any) => (
    <ListItem
      bottomDivider
      containerStyle={{
        backgroundColor: Colors[colorScheme].audiotracksContainerColor,
      }}
    >
      <Button
        mode={Colors[colorScheme].buttonMode}
        style={{
          backgroundColor: Colors[colorScheme].buttonBackgroundColor,
        }}
        accessibilityLabel={`Resume playing ${item?.section_number}: ${
          item?.title
        } ${GetDurationFormat(
          audio.currentAudiotrackPositionsMs[index]
        )} out of ${FormatChapterDurations(chapters[index]?.playtime)}`}
        onPress={() => {
          PlayFromListenButton(index);
        }}
      >
        <MaterialCommunityIcons
          name="book-play"
          size={30}
          color={Colors[colorScheme].buttonIconColor}
        />
      </Button>
      <ListItem.Content
        style={{
          alignItems: "stretch",
          flex: 1,
          backgroundColor: Colors[colorScheme].audiotracksTextContainerColor,
          color: "white",
        }}
      >
        <ListItem.Title
          numberOfLines={1}
          ellipsizeMode="tail"
          style={{ color: Colors[colorScheme].text }}
        >
          {item?.section_number}: {item?.title}
        </ListItem.Title>

        <View
          style={{
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
          }}
        >
          <MaterialCommunityIcons
            name="timer"
            size={15}
            color={Colors[colorScheme].buttonIconColor}
          />
          <Text style={{ color: Colors[colorScheme].text }}>
            {": "}
            {GetDurationFormat(
              audio.currentAudiotrackPositionsMs[index]
            )}
          </Text>
          <Text style={{ color: Colors[colorScheme].text }}>{" | "}</Text>
          <Text style={{ color: Colors[colorScheme].text }}>
            {FormatChapterDurations(chapters[index]?.playtime)}
          </Text>
        </View>

        <LinearProgress
          color={Colors[colorScheme].audiobookProgressColor}
          value={audio.linearProgressBars[index]}
          variant="determinate"
          trackColor={Colors[colorScheme].audiobookProgressTrackColor}
          animation={false}
        />

        <View
          style={{
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
          }}
        >
          <MaterialCommunityIcons
            name="account-tie-voice"
            size={15}
            color={Colors[colorScheme].buttonIconColor}
          />
          <Text>{": "}</Text>
          <ListItem.Subtitle
            numberOfLines={1}
            ellipsizeMode="clip"
            style={{ color: Colors[colorScheme].text }}
          >
            {item?.readers[0]?.display_name}
          </ListItem.Subtitle>
        </View>
      </ListItem.Content>
      <Button
        accessibilityLabel={`Play from start of Audiotrack ${item?.section_number}: ${item?.title}`}
        onPress={() => PlayFromStartOfTrack(index)}
        mode={Colors[colorScheme].buttonMode}
        style={{
          backgroundColor: Colors[colorScheme].buttonBackgroundColor,
        }}
      >
        <MaterialCommunityIcons
          name="book-arrow-left"
          size={30}
          color={Colors[colorScheme].buttonIconColor}
        />
      </Button>
    </ListItem>
  );

  const renderReviews = ({ item, index }: any) => (
    <Card
      containerStyle={{
        backgroundColor: Colors[colorScheme].reviewsContainerColor,
      }}
      wrapperStyle={{
        backgroundColor: Colors[colorScheme].reviewsWrapperColor,
      }}
    >
      <ListItem.Title
        style={{
          backgroundColor: Colors[colorScheme].reviewsTitleBGColor,
          color: Colors[colorScheme].text,
          padding: 5,
          paddingLeft: 10,
        }}
      >
        {item?.reviewtitle}
      </ListItem.Title>
      <Card.Divider />
      <Rating
        imageSize={20}
        ratingCount={5}
        startingValue={item?.stars}
        showRating={false}
        readonly={true}
        tintColor={Colors[colorScheme].reviewsRatingTintColor}
        type="custom"
        ratingBackgroundColor={Colors[colorScheme].reviewsRatingBGColor}
      />
      <ListItem
        containerStyle={{
          backgroundColor: Colors[colorScheme].reviewsBodyBGColor,
        }}
      >
        <ListItem.Subtitle
          style={{
            backgroundColor: Colors[colorScheme].reviewsBodyHighlightColor,
            color: Colors[colorScheme].text,
          }}
        >
          {item?.reviewbody}
        </ListItem.Subtitle>
      </ListItem>

      <View style={styles.reviewFooter}>
        <ListItem
          containerStyle={{
            backgroundColor: Colors[colorScheme].reviewsFooterBGColor,
          }}
        >
          <ListItem.Subtitle
            style={{
              backgroundColor: Colors[colorScheme].reviewsFooterHighlightColor,
              color: Colors[colorScheme].text,
            }}
          >
            By: {item?.reviewer}
          </ListItem.Subtitle>
        </ListItem>
        <ListItem
          containerStyle={{
            backgroundColor: Colors[colorScheme].reviewsDateBGColor,
          }}
        >
          <ListItem.Subtitle
            style={{
              backgroundColor: Colors[colorScheme].reviewsDateHighlightColor,
              color: Colors[colorScheme].text,
            }}
          >
            {item?.reviewdate}
          </ListItem.Subtitle>
        </ListItem>
      </View>
    </Card>
  );

  useEffect(() => {
    if (dataRSS.length > 0) {
      const RSSDict = Object.entries(dataRSS);
      const RSSURLS = RSSDict.map(([key, value]) => {
        return value?.enclosures[0]?.url;
      });
      setURLSToPlayAudiotracks(RSSURLS);
    }
  }, [dataRSS]);

  function pressedToShelveBook(audiobook_id: any) {
    switch (audiotracksData.shelveIconToggle) {
      case 0:
        setAudiotracksData({ ...audiotracksData, shelveIconToggle: 1 });
        updateIfBookShelvedDB(
          db,
          audiobook_id,
          !audiotracksData.shelveIconToggle
        );
        break;
      case 1:
        setAudiotracksData({ ...audiotracksData, shelveIconToggle: 0 });
        updateIfBookShelvedDB(
          db,
          audiobook_id,
          !audiotracksData.shelveIconToggle
        );
        break;
    }
  }

  const toggleSettingsOverlay = () => {
    setIsVisible(!isVisible);
  };
  const toggleWriteReviewOverlay = () => {
    setMakeReviewOptions(!makeReviewOptions);
  };

  if (!isLoadingAudiotrackUrls && !isLoadingAudiobookData) {
    const getHeader = () => {
      return (
        <View style={styles.bookHeader}>
          <Card
            containerStyle={{
              backgroundColor: Colors[colorScheme].bookCoverContainerBGColor,
            }}
            wrapperStyle={{
              backgroundColor: Colors[colorScheme].bookCoverWrapperColor,
            }}
          >
            <Card.Title
              style={[styles.bookTitle, { color: Colors[colorScheme].text }]}
            >
              {title}
            </Card.Title>
            <Card.Divider />

            <View
              style={{
                width: 200,
                height: 200,
                marginLeft: 35,
              }}
            >
              <Image
                accessibilityLabel={`Audiobook image With button to shelve in top right corner`}
                resizeMode="cover"
                source={{ uri: coverImage }}
                style={{ flex: 1, borderRadius: 5 }}
              />
              <Button
                accessibilityLabel={`Shelve audiobook: ${title} currently ${
                  audiotracksData.shelveIconToggle ? "shelved" : "not shelved"
                }`}
                mode="text"
                onPress={() => {
                  pressedToShelveBook(audioBookId);
                }}
                style={{
                  margin: 5,
                  position: "absolute",
                  top: 0,
                  right: 0,
                  width: 25,
                  height: 55,
                }}
              >
                <MaterialCommunityIcons
                  name={
                    audiotracksData.shelveIconToggle ? "star" : "star-outline"
                  }
                  size={30}
                  color={Colors[colorScheme].shelveAudiobookIconColor}
                />
              </Button>
            </View>

            <LinearProgress
              color={Colors[colorScheme].audiobookProgressColor}
              value={audio.totalListeningProgress}
              variant="determinate"
              trackColor={Colors[colorScheme].audiobookProgressTrackColor}
              animation={false}
              style={{
                width: 200,
                marginLeft: 35,
              }}
            />
            <View style={styles.coverImageTimeListened}>
              <Text style={{ color: Colors[colorScheme].text }}>
                {msToTime(audio.totalListeningTimeMs)}
              </Text>
              <Text style={{ color: Colors[colorScheme].text }}>
                {totalTime}
              </Text>
            </View>

            <Text
              style={[styles.bookAuthor, { color: Colors[colorScheme].text }]}
            >
              {" "}
              Author: {authorFirstName} {authorLastName}
            </Text>
            <Text
              numberOfLines={isAudiobookDescriptionExpanded ? undefined : 6}
              style={[
                styles.bookDescription,
                { color: Colors[colorScheme].text },
              ]}
            >
              {AudioBookDescription}
            </Text>

            <Button
              accessibilityLabel={`${
                isAudiobookDescriptionExpanded ? "compress ↑" : "expand ↓"
              } audiobook description`}
              mode="text"
              onPress={() => {
                setIsAudiobookDescriptionExpanded(
                  !isAudiobookDescriptionExpanded
                );
              }}
            >
              <Text style={{ color: "#268bd2" }}>
                {isAudiobookDescriptionExpanded ? "compress ↑" : "expand ↓"}
              </Text>
            </Button>

            {audiotracksData?.audiobookRating > 0 ? (
              <Rating
                showRating
                ratingCount={5}
                startingValue={audiotracksData.audiobookRating}
                fractions={1}
                readonly={true}
                style={{
                  paddingVertical: 10,
                }}
                tintColor={Colors[colorScheme].reviewsRatingTintColor}
                type="custom"
                ratingBackgroundColor={Colors[colorScheme].reviewsRatingBGColor}
              />
            ) : (
              <Text
                style={{
                  textAlign: "center",
                  paddingVertical: 10,
                  color: Colors[colorScheme].text,
                  fontSize: 14,
                }}
              >
                No rating
              </Text>
            )}
            <View style={styles.shelveButtons}>
              <Button
                accessibilityLabel={
                  isFullyDownloaded
                    ? "Audiobook downloaded"
                    : isDownloading
                    ? "Downloading audiobook..."
                    : "Download audiobook for offline listening"
                }
                mode={Colors[colorScheme].buttonMode}
                onPress={handleDownload}
                disabled={isDownloading || isFullyDownloaded}
                style={{
                  backgroundColor: Colors[colorScheme].buttonBackgroundColor,
                }}
              >
                <MaterialCommunityIcons
                  name={
                    isFullyDownloaded
                      ? "check-circle"
                      : isDownloading
                      ? "progress-download"
                      : "download"
                  }
                  size={24}
                  color={
                    isFullyDownloaded
                      ? Colors[colorScheme].activityIndicatorColor
                      : Colors[colorScheme].buttonIconColor
                  }
                />
              </Button>
              <Button
                accessibilityLabel="Scroll to reviews"
                mode={Colors[colorScheme].buttonMode}
                onPress={scrollToReviews}
                style={{ backgroundColor: Colors[colorScheme].buttonBackgroundColor, marginLeft: 6 }}
              >
                <MaterialCommunityIcons name="comment-text-outline" size={24} color={Colors[colorScheme].buttonIconColor} />
              </Button>
              <Button
                accessibilityLabel="Write a review"
                mode={Colors[colorScheme].buttonMode}
                onPress={() => toggleWriteReviewOverlay()}
                style={{ backgroundColor: Colors[colorScheme].buttonBackgroundColor, marginLeft: 6 }}
              >
                <MaterialIcons name="rate-review" size={24} color={Colors[colorScheme].buttonIconColor} />
              </Button>
              {isDownloading && (
                <Text style={{ color: Colors[colorScheme].text, marginLeft: 8, alignSelf: "center" }}>
                  {downloadProgress.filter((p) => p.status === "complete").length}/
                  {downloadProgress.length} tracks
                </Text>
              )}
            </View>
          </Card>
        </View>
      );
    };

    const makeReviewIcon = () => {
      return (
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Button
            accessibilityLabel="Opens overlay for writing a review on the audiobook."
            mode={Colors[colorScheme].buttonMode}
            onPress={() => toggleWriteReviewOverlay()}
            style={{
              backgroundColor: Colors[colorScheme].buttonBackgroundColor,
              height: 45,
            }}
          >
            <MaterialIcons
              name="rate-review"
              size={30}
              color={Colors[colorScheme].buttonIconColor}
            />
          </Button>
          <Button
            accessibilityLabel="Scroll back to top of audiobook"
            mode={Colors[colorScheme].buttonMode}
            onPress={scrollToTop}
            style={{
              backgroundColor: Colors[colorScheme].buttonBackgroundColor,
              height: 45,
              marginLeft: 6,
            }}
          >
            <MaterialCommunityIcons
              name="arrow-up-circle-outline"
              size={30}
              color={Colors[colorScheme].buttonIconColor}
            />
          </Button>
        </View>
      );
    };

    function sendReviewToAPI() {
      // https://archive.org/services/docs/api/reviews.html
      // https://archive.org/account/s3.php
      try {
        // url_iarchive is often empty; derive identifier from url_zip_file
        // URL format: https://archive.org/compress/{identifier}/formats=...
        const audiobookIdentifier = urlZipFile.split("/")[4];
        fetch(
          `https://archive.org/services/reviews.php?identifier=${audiobookIdentifier}`,
          {
            method: "POST",
            headers: new Headers({
              Authorization: "LOW lgBAqvb3gHMagWyz:ibWdQdBtBeJM4wj0",
              Accept: "application/json",
              "Content-Type": "application/json",
            }),
            body: JSON.stringify({
              title: reviewInformation.reviewTitle,
              body: reviewInformation.reviewText,
              stars: reviewInformation.reviewRating,
            }),
          }
        )
          .then((response) => response.json())
          .then((data) => {
            /*console.log(data)*/
          })
          .finally(() => {
            setUserChangedReview(!userChangedReview);
            const reviewInformationStringified =
              JSON.stringify(reviewInformation);
            updateUsersAudiobookReviewDB(
              db,
              reviewInformationStringified,
              audioBookId
            );
          });
      } catch (err) {
        console.log(err);
      }
    }

    const audiotracksKeyExtractor = (item: any) => {
      return item?.id;
    };
    const reviewsKeyExtractor = (item: any) => {
      return item?.createdate;
    };

    const AudioTracksScreenData = [
      {
        title: "No. Audiotracks: " + numSections,
        renderItem: renderAudiotracks,
        data: chapters,
        keyExtractor: audiotracksKeyExtractor,
      },
      {
        title:
          "Average of reviews: " +
          roundNumberTwoDecimal(audiotracksData?.audiobookRating),
        reviewIcon: makeReviewIcon(),
        renderItem: renderReviews,
        data: reviews,
        keyExtractor: reviewsKeyExtractor,
      },
    ];

    return (
      <View
        style={[
          styles.container,
          { backgroundColor: Colors[colorScheme].audiotracksBGColor },
        ]}
      >
        <AudioTrackSettings
          isVisible={isVisible}
          toggleOverlay={toggleSettingsOverlay}
          audioPlayerSettings={audio.audioPlayerSettings}
          storeAudioTrackSettings={storeAudioTrackSettings}
          setAudioPlayerSettings={audio.setAudioPlayerSettings}
        />

        <MakeUserReview
          reviewInformation={reviewInformation}
          sendReviewToAPI={sendReviewToAPI}
          setReviewInformation={setReviewInformation}
          urlIArchive={urlIArchive}
          makeReviewOptions={makeReviewOptions}
          toggleWriteReviewOverlay={toggleWriteReviewOverlay}
          title={title}
        />

        <View style={styles.AudioTracksStyle}>
          <View
            style={[
              styles.sectionListContainer,
              { backgroundColor: Colors[colorScheme].audiotracksBGColor },
            ]}
          >
            <SectionList
              ref={sectionListRef}
              sections={AudioTracksScreenData}
              keyExtractor={(item: any, index: number) =>
                `${index}_${String(item?.id ?? item?.createdate ?? index)}`
              }
              initialNumToRender={25}
              maxToRenderPerBatch={50}
              updateCellsBatchingPeriod={50}
              renderItem={({ item, index, section }: any) =>
                section.renderItem({ item, index })
              }
              ListHeaderComponent={getHeader()}
              renderSectionHeader={({
                section: { title },
                section: { reviewIcon },
              }) => (
                <View style={styles.sectionTitles}>
                  <Text
                    View
                    style={[
                      styles.sectionStyle,
                      { color: Colors[colorScheme].sectionsTitleColor },
                    ]}
                  >
                    {title}
                    {"   "}
                  </Text>
                  <View style={{ alignSelf: "center" }}>{reviewIcon}</View>
                </View>
              )}
            />
          </View>
        </View>

        <View style={{ paddingBottom: insets.bottom }}>
          <AudiotrackSliderWithCurrentPlaying
            currentSliderPosition={audio.currentSliderPosition}
            SeekUpdate={audio.seekToPosition}
            GetDurationFormat={GetDurationFormat}
            Duration={audio.currentTrackInfo.duration}
            coverImage={coverImage}
            audioTrackChapterPlayingTitle={
              audio.currentTrackInfo.title
            }
            audioTrackReader={audio.currentTrackInfo.reader}
          />

          <AudioTrackControls
            HandlePrevTrack={audio.handlePrevTrack}
            HandleNextTrack={audio.handleNextTrack}
            LoadAudio={audio.loadTrack}
            PlayAudio={audio.playAudio}
            isPlaying={audio.isPlaying}
            PauseAudio={audio.pauseAudio}
            isAudioPaused={audio.isAudioPaused}
            loadingCurrentAudiotrack={audio.isLoading}
            loadedCurrentAudiotrack={audio.isLoadedOnce}
            currentAudioTrackIndex={{ current: audio.currentTrackIndex }}
            forwardTenSeconds={audio.forwardTenSeconds}
            rewindTenSeconds={audio.rewindTenSeconds}
            trackPositions={{
              currentAudiotrackPositionsMs: audio.currentAudiotrackPositionsMs,
            }}
          ></AudioTrackControls>
        </View>
      </View>
    );
  } else {
    return (
      <View
        style={{
          backgroundColor:
            Colors[colorScheme].audioActivityIndicatorContainerBG,
          flex: 1,
        }}
      >
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
  container: {
    flex: 1,
    padding: 10,
    paddingTop: 2,
  },
  AudioTracksStyle: {
    flex: 7,
    paddingBottom: 2,
  },
  sectionListContainer: {
    fontSize: 20,
  },
  ActivityIndicatorStyle: {
    top: windowHeight / 2.5,
  },
  bookTitle: {
    fontSize: 30,
  },
  bookAuthor: {
    fontWeight: "bold",
  },
  bookDescription: {
    fontSize: 16,
    padding: 2,
  },
  bookHeader: {
    display: "flex",
    paddingBottom: 0,
    padding: 2,
  },
  shelveButtons: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "flex-start",
  },
  reviewFooter: {
    display: "flex",
    flexDirection: "row",
    flexWrap: "wrap",
  },
  sectionTitles: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "center",
    height: 70,
  },
  sectionStyle: {
    alignSelf: "center",
    fontSize: 16,
  },
  coverImageTimeListened: {
    width: 200,
    marginBottom: 10,
    marginLeft: 35,
    flexDirection: "row",
    justifyContent: "space-between",
  },
});

export default Audiotracks;
