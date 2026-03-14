import React, { useEffect, useState, useRef } from "react";
import { ActivityIndicator, Dimensions, Image } from "react-native";
import { ListItem, LinearProgress, Card } from "@rneui/themed";
import { Rating } from "react-native-ratings";
import * as rssParser from "react-native-rss-parser";
import { createAudioPlayer, setAudioModeAsync } from "expo-audio";
import { StyleSheet, Text, View, SectionList } from "react-native";
import { MaterialCommunityIcons, MaterialIcons } from "@expo/vector-icons";

import { Button } from "react-native-paper";
import AudioTrackControls from "../components/audioTrackControls";
import AudioTrackSettings from "../components/audioTrackSettings";
import AudiotrackSliderWithCurrentPlaying from "../components/AudiotrackSliderWithCurrentPlaying";
import MakeUserReview from "../components/audioTrackMakeReview";
// import getAverageAudiobookReview from "../screens/Explore";

import { useSafeAreaInsets } from "react-native-safe-area-context";
import { openDatabase, roundNumberTwoDecimal } from "../db/utils";
import { useNavigation } from "@react-navigation/native";
import useColorScheme from "../hooks/useColorScheme";
import Colors from "../constants/Colors";

const db = openDatabase();
import {
  updateAudioTrackPositionsDB,
  updateIfBookShelvedDB,
  initialAudioBookProgressStoreDB,
  updateAudiobookRatingDB,
  updateAudioTrackIndexDB,
  audiobookProgressTableName,
  updateUsersAudiobookReviewDB,
} from "../db/database_functions";

import { getAsyncData, storeAsyncData } from "../db/database_functions";

function Audiotracks(props: any) {
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

  const currentAudioTrackIndex = useRef(0);
  const [isLoadingAudiobookData, setIsLoadingAudioBookData] = useState(true);
  const [isLoadingAudiotrackUrls, setIsLoadingAudiotrackUrls] =
    useState(true);
  const [audiotrackLoadingStatuses, setAudiotrackLoadingStatuses] = useState({
    loadedCurrentAudiotrack: false,
    loadingCurrentAudiotrack: false,
  });
  const [isAudioPaused, setIsAudioPaused] = useState(false);
  const [isPlaying, SetIsPlaying] = useState(false);
  const [currentAudiotrackPlaying, setCurrentAudiotrackPlaying] = useState({
    audioTrackChapterPlayingTitle: "",
    audioTrackReader: "",
    duration: 0,
  });

  const [currentSliderPosition, setCurrentSliderPosition] = useState(0.0);
  const [isVisible, setIsVisible] = useState(false);
  const [makeReviewOptions, setMakeReviewOptions] = useState(false);
  const [audioPlayerSettings, setAudioPlayerSettings] = useState({
    rate: 1.0,
    shouldCorrectPitch: true,
    volume: 1.0,
    isMuted: false,
    isLooping: false,
    shouldPlay: false,
  });
  const [audiotracksData, setAudiotracksData] = useState<any>({
    linearProgessBars: [],
    currentAudiotrackPositionsMs: [],
    shelveIconToggle: 0,
    audiobookRating: 0,
    totalAudioBookListeningProgress: 0,
    totalAudioBookListeningTimeMS: 0,
  });
  const [audioModeSettings, setAudioModeSettings] = useState<any>({
    staysActiveInBackground: true,
    shouldDuckAndroid: true,
    playThroughEarpieceAndroid: false,
  });

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
  // console.log(props.route.params)

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

  React.useEffect(() => {
    try {
      getAsyncData("audioModeSettings").then((audioModeSettingsRetrieved) => {
        audioModeSettingsRetrieved;
        if (audioModeSettingsRetrieved) {
          return setAudioModeSettings(audioModeSettingsRetrieved);
        }
      });
      getAsyncData("audioTrackSettingsTest").then(
        (audioTrackSettingsRetrieved) => {
          if (audioTrackSettingsRetrieved) {
            return setAudioPlayerSettings(audioTrackSettingsRetrieved);
          }
        }
      );
    } catch (err) {
      console.log(err);
    }
  }, []);

  const storeAudioTrackSettings = async (settings: object) => {
    await storeAsyncData("audioTrackSettingsTest", settings);
  };

  const updateAudioBookPosition = async (
    audiobook_id: any,
    audiotrack_progress_bars: any,
    current_audiotrack_positions: any
  ) => {
    try {
      const initialValue = 0;
      const current_listening_time = current_audiotrack_positions.reduce(
        (previousValue: any, currentValue: any) =>
          previousValue + Number(currentValue),
        initialValue
      );
      const listening_progress_percent =
        current_listening_time / 1000 / totalTimeSecs;
      updateAudioTrackPositionsDB(db, {
        audiotrack_progress_bars: JSON.stringify(audiotrack_progress_bars),
        listening_progress_percent,
        current_listening_time,
        current_audiotrack_positions: JSON.stringify(
          current_audiotrack_positions
        ),
        audiobook_id,
      });
    } catch (err) {
      console.log(err);
    }
  };

  const initialLoadOfAudiotracksDB = (audiobook_id: number) => {
    db.transaction((tx) => {
      try {
        tx.executeSql(
          `select * from ${audiobookProgressTableName}`,
          [],
          (_, { rows }) => {
            rows["_array"].forEach((row) => {
              if (audiobook_id === row.audiobook_id) {
                if (row?.current_audiotrack_index) {
                  currentAudioTrackIndex.current =
                    row?.current_audiotrack_index;
                }
                const TotalListenTimeAndProgress = updateCoverBookProgress(
                  row?.current_audiotrack_positions
                );
                setAudiotracksData({
                  ...audiotracksData,
                  linearProgessBars: JSON.parse(row?.audiotrack_progress_bars),
                  currentAudiotrackPositionsMs: JSON.parse(
                    row?.current_audiotrack_positions
                  ),
                  shelveIconToggle: row?.audiobook_shelved,
                  audiobookRating: row?.audiobook_rating,
                  totalAudioBookListeningTimeMS: TotalListenTimeAndProgress[0],
                  totalAudioBookListeningProgress:
                    TotalListenTimeAndProgress[1],
                });
                if (row?.users_audiobook_review !== undefined) {
                  setReviewInformation(JSON.parse(row?.users_audiobook_review));
                }
              }
            });
          }
        );
      } catch (err) {
        console.log(err);
      }
    }, undefined);
  };

  useEffect(() => {
    async function setAudioMode() {
      try {
        await setAudioModeAsync({
          playsInSilentMode: true,
          shouldPlayInBackground: audioModeSettings.staysActiveInBackground,
          interruptionMode: audioModeSettings.shouldDuckAndroid ? 'duckOthers' : 'doNotMix',
          shouldRouteThroughEarpiece: audioModeSettings.playThroughEarpieceAndroid,
          allowsRecording: false,
        });
      } catch (e) {
        console.log(e);
      }
    }
    setAudioMode();
  }, [audioModeSettings]);
  const sound = React.useRef(createAudioPlayer(null, { updateInterval: 1000 }));
  const statusSubscription = useRef<any>(null);

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
        setAudiotracksData({
          ...audiotracksData,
          audiobookRating: averageAudiobookRating,
        });
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

  useEffect(() => {
    try {
      let initialAudioBookSections = new Array(numSections).fill(0);
      setAudiotracksData({
        ...audiotracksData,
        linearProgessBars: initialAudioBookSections,
        currentAudiotrackPositionsMs: initialAudioBookSections,
      });
      // will only happen if no row in db already.

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

  useEffect(() => {
    return () => {
      try {
        if (statusSubscription.current) {
          statusSubscription.current.remove();
        }
        sound.current.release();
      } catch (err) {
        console.log(err);
      }
    };
  }, []);

  function sliderPositionCalculation(progress: number) {
    let sliderPositionCalculate = progress * 100;
    return sliderPositionCalculate;
  }
  async function updateLinearProgressBars(progress: number) {
    let updatedLinearProgessBarPositions = [
      ...audiotracksData.linearProgessBars,
    ];
    updatedLinearProgessBarPositions[currentAudioTrackIndex.current] =
      audiotracksData.linearProgessBars[currentAudioTrackIndex.current] =
        progress;
  }
  async function updateAudiotrackPositions(dataPosition: number) {
    let updatedCurrentAudiotrackPositions = [
      ...audiotracksData.currentAudiotrackPositionsMs,
    ];
    updatedCurrentAudiotrackPositions[currentAudioTrackIndex.current] =
      audiotracksData.currentAudiotrackPositionsMs[
        currentAudioTrackIndex.current
      ] = dataPosition;
  }

  async function updateAndStoreAudiobookPositions(data: any) {
    try {
      const currentAudiotrackProgress =
        data.positionMillis / data.durationMillis;
      updateLinearProgressBars(currentAudiotrackProgress);
      updateAudiotrackPositions(data.positionMillis);
      const sliderPositionCalculated = sliderPositionCalculation(
        currentAudiotrackProgress
      );

      setCurrentSliderPosition(sliderPositionCalculated);
      updateAudioBookPosition(
        audioBookId,
        audiotracksData.linearProgessBars,
        audiotracksData.currentAudiotrackPositionsMs
      );
    } catch (err) {
      console.log(err);
    }
  }

  const UpdateStatus = async (data: any) => {
    try {
      const positionMillis = data.currentTime * 1000;
      const durationMillis = data.duration * 1000;
      if (data.didJustFinish) {
        updateAndStoreAudiobookPositions({ positionMillis, durationMillis });
        if (
          currentAudioTrackIndex.current >=
          URLSToPlayAudiotracks.length - 1
        ) {
          SetIsPlaying(false);
          setIsAudioPaused(true);
        } else {
          return HandleNextTrack();
        }
      } else if (positionMillis > 0 && durationMillis > 0) {
        updateAndStoreAudiobookPositions({ positionMillis, durationMillis });
        // expo-audio duration becomes available asynchronously after replace();
        // keep currentAudiotrackPlaying.duration in sync
        setCurrentAudiotrackPlaying((prev) => {
          if (prev.duration !== durationMillis) {
            return { ...prev, duration: durationMillis };
          }
          return prev;
        });
      }
    } catch (error) {
      console.log("Error: ", error);
    }
  };

  const updateAudiotrackSlider = async (data: any) => {
    try {
      if (sound.current.isLoaded) {
        const durationMs = sound.current.duration * 1000;
        const currentPosition = (data / 100) * durationMs;
        await sound.current.seekTo(currentPosition / 1000);
      }
    } catch (error) {
      console.log("Error: ", error);
    }
  };

  const forwardTenSeconds = async () => {
    try {
      if (sound.current.isLoaded) {
        const currentPosition =
          audiotracksData.currentAudiotrackPositionsMs[
            currentAudioTrackIndex.current
          ];
        await sound.current.seekTo((currentPosition + 10000) / 1000);
      }
    } catch (error) {
      console.log("Error: ", error);
    }
  };

  const rewindTenSeconds = async () => {
    try {
      if (sound.current.isLoaded) {
        const currentPosition =
          audiotracksData.currentAudiotrackPositionsMs[
            currentAudioTrackIndex.current
          ];
        await sound.current.seekTo(Math.max(0, currentPosition - 10000) / 1000);
      }
    } catch (error) {
      console.log("Error: ", error);
    }
  };

  const ResetPlayer = async () => {
    try {
      if (sound.current.isLoaded) {
        SetIsPlaying(false);
        await sound.current.seekTo(0);
        sound.current.pause();
      }
    } catch (error) {
      console.log("Error: ", error);
    }
  };

  const LoadAudio = async (index: number, audiotrackPositions = 0) => {
    currentAudioTrackIndex.current = index;
    updateAudioTrackIndexDB(db, currentAudioTrackIndex.current, audioBookId);
    setAudiotrackLoadingStatuses({
      ...audiotrackLoadingStatuses,
      loadingCurrentAudiotrack: true,
    });
    try {
      // Remove old listener before replacing source
      if (statusSubscription.current) {
        statusSubscription.current.remove();
      }
      // Replace the audio source (stops and clears any current audio)
      sound.current.replace({ uri: URLSToPlayAudiotracks[index] });

      // Apply playback settings
      sound.current.setPlaybackRate(audioPlayerSettings.rate);
      sound.current.loop = audioPlayerSettings.isLooping;
      sound.current.muted = audioPlayerSettings.isMuted;
      sound.current.volume = audioPlayerSettings.volume;
      sound.current.shouldCorrectPitch = audioPlayerSettings.shouldCorrectPitch;

      // Seek to the saved position for this track
      if (audiotrackPositions > 0) {
        await sound.current.seekTo(audiotrackPositions / 1000);
      }

      // Set up the status listener for this track
      statusSubscription.current = sound.current.addListener(
        'playbackStatusUpdate',
        UpdateStatus
      );

      setCurrentAudiotrackPlaying({
        ...currentAudiotrackPlaying,
        audioTrackReader: chapters[index]?.readers[0]?.display_name,
        audioTrackChapterPlayingTitle:
          chapters[index]?.section_number + ". " + chapters[index]?.title,
        duration: sound.current.duration * 1000,
      });
      setAudiotrackLoadingStatuses({
        ...audiotrackLoadingStatuses,
        loadingCurrentAudiotrack: false,
        loadedCurrentAudiotrack: true,
      });
      await PlayAudio();
    } catch (error) {
      setAudiotrackLoadingStatuses({
        ...audiotrackLoadingStatuses,
        loadingCurrentAudiotrack: false,
        loadedCurrentAudiotrack: false,
      });
      console.log("Error: ", error);
    }
  };

  const PlayAudio = async () => {
    try {
      if (!sound.current.playing) {
        sound.current.play();
        SetIsPlaying(true);
      }
    } catch (error) {
      console.log("Error: ", error);
    }
  };

  const PauseAudio = async () => {
    try {
      setIsAudioPaused(false);
      if (sound.current.playing) {
        sound.current.pause();
        setIsAudioPaused(true);
        SetIsPlaying(false);
      }
    } catch (error) {
      console.log("Error: ", error);
    }
  };

  const HandleNextTrack = async () => {
    try {
      if (currentAudioTrackIndex.current < URLSToPlayAudiotracks.length - 1) {
        currentAudioTrackIndex.current += 1;
        setCurrentSliderPosition(0.0);
        await LoadAudio(
          currentAudioTrackIndex.current,
          audiotracksData.currentAudiotrackPositionsMs[
            currentAudioTrackIndex.current
          ]
        );
      } else if (
        currentAudioTrackIndex.current >=
        URLSToPlayAudiotracks.length - 1
      ) {
        currentAudioTrackIndex.current = 0;
        setCurrentSliderPosition(0.0);
        await ResetPlayer();
        await LoadAudio(
          currentAudioTrackIndex.current,
          audiotracksData.currentAudiotrackPositionsMs[
            currentAudioTrackIndex.current
          ]
        );
      }
    } catch (err) {
      console.log(err);
    }
  };

  const HandlePrevTrack = async () => {
    try {
      if (currentAudioTrackIndex.current - 1 >= 0) {
        currentAudioTrackIndex.current -= 1;
        await LoadAudio(
          currentAudioTrackIndex.current,
          audiotracksData.currentAudiotrackPositionsMs[
            currentAudioTrackIndex.current
          ]
        );
      }
    } catch (err) {
      console.log(err);
    }
  };

  function msToTime(duration: number) {
    let seconds = Math.floor((duration / 1000) % 60),
      minutes = Math.floor((duration / (1000 * 60)) % 60),
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
      setCurrentSliderPosition(0.0);
      await LoadAudio(
        index,
        audiotracksData.currentAudiotrackPositionsMs[index]
      );
    } catch (e) {
      console.log(e);
    }
  };

  const PlayFromStartOfTrack = async (index: number) => {
    try {
      setCurrentSliderPosition(0.0);
      await LoadAudio(index, 0);
    } catch (e) {
      console.log(e);
    }
  };

  const renderAudiotracks = ({ item, index }: any) => (
    <ListItem
      bottomDivider
      containerStyle={{
        backgroundColor: Colors[colorScheme].audiotracksContainerColor,
      }}
    >
      <Button
        accessibilityLabel={`Play from start of Audiotrack ${item?.section_number}: ${item?.title}`}
        onPress={() => PlayFromStartOfTrack(index)}
        style={{ margin: 0, padding: 0 }}
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
              audiotracksData.currentAudiotrackPositionsMs[index]
            )}
          </Text>
          <Text style={{ color: Colors[colorScheme].text }}>{" | "}</Text>
          <Text style={{ color: Colors[colorScheme].text }}>
            {FormatChapterDurations(chapters[index]?.playtime)}
          </Text>
        </View>

        <LinearProgress
          color={Colors[colorScheme].audiobookProgressColor}
          value={audiotracksData.linearProgessBars[index]}
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
        mode={Colors[colorScheme].buttonMode}
        style={{
          backgroundColor: Colors[colorScheme].buttonBackgroundColor,
        }}
        accessibilityLabel={`Resume playing ${item?.section_number}: ${
          item?.title
        } ${GetDurationFormat(
          audiotracksData.currentAudiotrackPositionsMs[index]
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
              value={audiotracksData?.totalAudioBookListeningProgress}
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
                {msToTime(audiotracksData.totalAudioBookListeningTimeMS)}
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

            <Rating
              showRating
              ratingCount={5}
              startingValue={audiotracksData?.audiobookRating}
              fractions={1}
              readonly={true}
              style={{
                paddingVertical: 10,
              }}
              tintColor={Colors[colorScheme].reviewsRatingTintColor}
              type="custom"
              ratingBackgroundColor={Colors[colorScheme].reviewsRatingBGColor}
            />
            <View style={styles.shelveButtons}></View>
          </Card>
        </View>
      );
    };

    const makeReviewIcon = () => {
      return (
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
          audioPlayerSettings={audioPlayerSettings}
          storeAudioTrackSettings={storeAudioTrackSettings}
          setAudioPlayerSettings={setAudioPlayerSettings}
          sound={sound}
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
              sections={AudioTracksScreenData}
              keyExtractor={(item: any, index: number) =>
                String(item?.id ?? item?.createdate ?? index)
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
            currentSliderPosition={currentSliderPosition}
            SeekUpdate={updateAudiotrackSlider}
            GetDurationFormat={GetDurationFormat}
            Duration={currentAudiotrackPlaying.duration}
            coverImage={coverImage}
            audioTrackChapterPlayingTitle={
              currentAudiotrackPlaying.audioTrackChapterPlayingTitle
            }
            audioTrackReader={currentAudiotrackPlaying.audioTrackReader}
          />

          <AudioTrackControls
            HandlePrevTrack={HandlePrevTrack}
            HandleNextTrack={HandleNextTrack}
            LoadAudio={LoadAudio}
            PlayAudio={PlayAudio}
            isPlaying={isPlaying}
            PauseAudio={PauseAudio}
            isAudioPaused={isAudioPaused}
            loadingCurrentAudiotrack={
              audiotrackLoadingStatuses.loadingCurrentAudiotrack
            }
            loadedCurrentAudiotrack={
              audiotrackLoadingStatuses.loadedCurrentAudiotrack
            }
            currentAudioTrackIndex={currentAudioTrackIndex}
            forwardTenSeconds={forwardTenSeconds}
            rewindTenSeconds={rewindTenSeconds}
            trackPositions={audiotracksData}
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
