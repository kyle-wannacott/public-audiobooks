import { View, StyleSheet, Image, Dimensions, Pressable, Text } from "react-native";
import { ListItem, LinearProgress } from "@rneui/themed";
import React, { useState, useEffect } from "react";
import Colors from "../constants/Colors";
import useColorScheme from "../hooks/useColorScheme";
import { useNavigation } from "@react-navigation/native";
import { Button } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Review } from "../types.js";

import {
  initialAudioBookProgressStoreDB,
  updateIfBookShelvedDB,
  isAudiobookFullyDownloaded,
} from "../db/database_functions";
import { useAudio } from "../hooks/AudioContext";
import * as rssParser from "react-native-rss-parser";

export default function AudiobookCover(props) {
  const {
    item,
    index,
    db,
    addAudiobookToHistory,
    getAverageAudiobookReview,
    bookCovers,
    reviewURLS,
    resizeCoverImageWidth,
    resizeCoverImageHeight,
    audiobooksProgress,
    setAudiobooksProgress,
    displayMode = 'grid',
  } = props;
  const colorScheme = useColorScheme();
  const navigation = useNavigation();
  const audio = useAudio();

  const [avatarOnPressEnabled, setAvatarOnPressEnabled] = useState(true);
  const [isDownloaded, setIsDownloaded] = useState(false);

  useEffect(() => {
    if (item?.id && item?.num_sections) {
      isAudiobookFullyDownloaded(db, String(item.id), item.num_sections, (downloaded) => {
        setIsDownloaded(downloaded);
      });
    }
  }, [item?.id]);

  const handleQuickPlay = async () => {
    try {
      addAudiobookToHistory(index, item);
      const response = await fetch(item?.url_rss);
      const responseData = await response.text();
      const rss = await rssParser.parse(responseData);
      const trackUrls = rss.items.map((i: any) => i.enclosures[0]?.url);

      const chaptersResponse = await fetch(
        `https://librivox.org/api/feed/audiobooks/?id=${item?.id}&fields={sections}&extended=1&format=json`
      );
      const chaptersJson = await chaptersResponse.json();
      const chapters = chaptersJson?.books?.[0]?.sections || [];

      if (audio.currentBook?.audioBookId === String(item?.id) && audio.isPlaying) {
        audio.pauseAudio();
        return;
      }

      if (audio.currentBook?.audioBookId !== String(item?.id)) {
        await audio.loadBook({
          audioBookId: String(item?.id),
          urlRss: item?.url_rss,
          coverImage: bookCovers[index],
          numSections: item?.num_sections,
          title: item?.title,
          authorFirstName: item?.authors[0]?.first_name,
          authorLastName: item?.authors[0]?.last_name,
          totalTime: item?.totaltime,
          totalTimeSecs: item?.totaltimesecs,
          chapters,
          trackUrls,
        });
      }

      const savedIdx = audio.currentTrackIndex;
      const savedPos = audio.currentAudiotrackPositionsMs[savedIdx] || 0;
      await audio.loadTrack(savedIdx, savedPos);
    } catch (e) {
      console.log("Quick play error:", e);
    }
  };

  const navigateToAudio = () => {
    if (avatarOnPressEnabled) {
      addAudiobookToHistory(index, item);
      (navigation as any).navigate("Audio", {
        audioBookId: item?.id,
        urlRss: item?.url_rss,
        coverImage: bookCovers[index],
        numSections: item?.num_sections,
        urlTextSource: item?.url_text_source,
        urlZipFile: item?.url_zip_file,
        title: item?.title,
        authorFirstName: item?.authors[0]?.first_name,
        authorLastName: item?.authors[0]?.last_name,
        totalTime: item?.totaltime,
        totalTimeSecs: item?.totaltimesecs,
        copyrightYear: item?.copyright_year,
        genres: item?.genres,
        urlReview: reviewURLS[index],
        language: item?.language,
        urlProject: item?.url_project,
        urlLibrivox: item?.url_librivox,
        urlIArchive: item?.url_iarchive,
      });
    }
    setAvatarOnPressEnabled(false);
    setTimeout(() => setAvatarOnPressEnabled(true), 2000);
  };

  const toggleShelve = () => {
    const audiobook_id = item?.id;
    if (audiobooksProgress[item?.id]) {
      const isShelved = audiobooksProgress[item?.id]?.audiobook_shelved;
      updateIfBookShelvedDB(db, audiobook_id, !isShelved);
      setAudiobooksProgress((prev: any) => ({
        ...prev,
        [audiobook_id]: { ...prev[audiobook_id], audiobook_shelved: !isShelved },
      }));
      addAudiobookToHistory(index, item);
    } else {
      addAudiobookToHistory(index, item);
      let initialAudioBookSections = new Array(item?.num_sections).fill(0);
      const initAudioBookData = {
        audiobook_id: item?.id,
        audiotrack_progress_bars: JSON.stringify(initialAudioBookSections),
        current_audiotrack_positions: JSON.stringify(initialAudioBookSections),
        audiobook_shelved: true,
        audiobook_rating: undefined,
      };
      initialAudioBookProgressStoreDB(db, initAudioBookData);
      setAudiobooksProgress((prev: any) => ({ ...prev, [item?.id]: initAudioBookData }));
      getAverageAudiobookReview(index)
        ?.then((avgReview: any) => {
          if (avgReview) {
            setAudiobooksProgress((prev: any) => ({
              ...prev,
              [item?.id]: { ...(prev[item?.id] || initAudioBookData), audiobook_rating: avgReview },
            }));
          }
        })
        .catch((error: any) => console.error(error));
    }
  };

  const isCurrentlyPlaying =
    audio.currentBook?.audioBookId === String(item?.id) && audio.isPlaying;

  const formatTime = (seconds: number): string => {
    if (!seconds || isNaN(seconds) || seconds <= 0) return '0:00';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    return `${m}:${String(s).padStart(2, '0')}`;
  };

  const progressPercent = audiobooksProgress[item?.id]?.listening_progress_percent || 0;
  const totalSecs = item?.totaltimesecs || 0;
  const currentTimeSecs = progressPercent * totalSecs;
  const rating = audiobooksProgress[item?.id]?.audiobook_rating;

  if (displayMode === 'list') {
    return (
      <View
        style={[
          styles.listContainer,
          { backgroundColor: Colors[colorScheme].audiobookBackgroundColor },
        ]}
      >
        <Pressable style={styles.listPressable} onPress={navigateToAudio}>
          <Image
            source={{ uri: bookCovers[index] }}
            style={styles.listCoverImage}
          />
          <View style={styles.listInfo}>
            <Text
              numberOfLines={2}
              style={[styles.listTitle, { color: Colors[colorScheme].text }]}
            >
              {item?.title}
            </Text>
            <Text
              numberOfLines={1}
              style={[styles.listAuthor, { color: Colors[colorScheme].text }]}
            >
              {item?.authors[0]?.first_name} {item?.authors[0]?.last_name}
            </Text>
            <LinearProgress
              color={Colors[colorScheme].audiobookProgressColor}
              value={progressPercent}
              variant="determinate"
              trackColor={Colors[colorScheme].audiobookProgressTrackColor}
              animation={false}
              style={{ marginTop: 4 }}
            />
            <View style={styles.listTimeRow}>
              <Text style={[styles.listTimeText, { color: Colors[colorScheme].text }]}>
                {formatTime(currentTimeSecs)}
              </Text>
              {rating > 0 && (
                <Text style={[styles.listRatingText, { color: Colors[colorScheme].text }]}>
                  ★ {Number(rating).toFixed(1)}
                </Text>
              )}
              <Text style={[styles.listTimeText, { color: Colors[colorScheme].text }]}>
                {item?.totaltime}
              </Text>
            </View>
          </View>
        </Pressable>
        <View style={styles.listActions}>
          <Button mode="text" compact onPress={toggleShelve}>
            <MaterialCommunityIcons
              name={audiobooksProgress[item?.id]?.audiobook_shelved ? "star" : "star-outline"}
              size={24}
              color={Colors[colorScheme].shelveAudiobookIconColor}
            />
          </Button>
          {isDownloaded && (
            <MaterialCommunityIcons
              name="check-circle"
              size={20}
              color={Colors[colorScheme].activityIndicatorColor}
              style={{ alignSelf: 'center', marginHorizontal: 2 }}
            />
          )}
          <Button mode="text" compact onPress={handleQuickPlay}>
            <MaterialCommunityIcons
              name={isCurrentlyPlaying ? "pause-circle" : "play-circle"}
              size={28}
              color={Colors[colorScheme].activityIndicatorColor}
            />
          </Button>
        </View>
      </View>
    );
  }

  return (
    <ListItem
      topDivider
      containerStyle={{
        backgroundColor: Colors[colorScheme].colorAroundAudiobookImage,
      }}
      key={item.id}
    >
      <View
        style={[
          styles.ImageContainer,
          {
            backgroundColor: Colors[colorScheme].audiobookBackgroundColor,
          },
        ]}
      >
        <Pressable
          accessibilityLabel={`${item?.title}`}
          style={({ pressed }) => [{ opacity: pressed ? 0.75 : 1.0 }]}
          onPress={navigateToAudio}
        >
          <Image
            source={{ uri: bookCovers[index] }}
            style={{
              width: resizeCoverImageWidth,
              height: resizeCoverImageHeight,
            }}
          />

          <Button
            key={item.id}
            accessibilityLabel={`Shelve audiobook: ${item.title} currently ${
              "shelved" + "not shelved"
            }`}
            mode="text"
            onPress={toggleShelve}
            style={{
              margin: 0,
              position: "absolute",
              top: 0,
              right: 0,
              width: 30,
              height: 60,
            }}
          >
            <MaterialCommunityIcons
              key={item.id}
              name={
                audiobooksProgress[item?.id]?.audiobook_shelved
                  ? "star"
                  : "star-outline"
              }
              size={30}
              color={Colors[colorScheme].shelveAudiobookIconColor}
            />
          </Button>

          {/* Download status icon */}
          {isDownloaded && (
            <View
              style={{
                position: "absolute",
                top: 50,
                right: 0,
                width: 30,
                height: 30,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <MaterialCommunityIcons
                name="check-circle"
                size={22}
                color={Colors[colorScheme].activityIndicatorColor}
              />
            </View>
          )}

          {/* Quick play button */}
          <Button
            mode="text"
            onPress={handleQuickPlay}
            accessibilityLabel={
              isCurrentlyPlaying ? `Pause ${item.title}` : `Play ${item.title}`
            }
            style={{
              position: "absolute",
              bottom: 0,
              right: 0,
              width: 30,
              height: 40,
              margin: 0,
            }}
          >
            <MaterialCommunityIcons
              name={isCurrentlyPlaying ? "pause-circle" : "play-circle"}
              size={26}
              color={Colors[colorScheme].activityIndicatorColor}
            />
          </Button>
        </Pressable>
        <LinearProgress
          color={Colors[colorScheme].audiobookProgressColor}
          value={audiobooksProgress[item?.id]?.listening_progress_percent}
          variant="determinate"
          trackColor={Colors[colorScheme].audiobookProgressTrackColor}
          animation={false}
        />
      </View>
    </ListItem>
  );
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
  listContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(128,128,128,0.2)",
  },
  listPressable: {
    flexDirection: "row",
    flex: 1,
    alignItems: "center",
  },
  listCoverImage: {
    width: 64,
    height: 64,
    borderRadius: 4,
    marginRight: 10,
  },
  listInfo: {
    flex: 1,
  },
  listTitle: {
    fontSize: 13,
    fontWeight: "bold",
    marginBottom: 2,
  },
  listAuthor: {
    fontSize: 11,
    marginBottom: 2,
  },
  listDuration: {
    fontSize: 10,
    opacity: 0.7,
    marginTop: 2,
  },
  listTimeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 2,
  },
  listTimeText: {
    fontSize: 10,
    opacity: 0.8,
  },
  listRatingText: {
    fontSize: 10,
    opacity: 0.9,
  },
  listActions: {
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    paddingLeft: 4,
  },
});
