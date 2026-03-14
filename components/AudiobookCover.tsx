import { View, StyleSheet, Image, Dimensions, Pressable } from "react-native";
import { ListItem, LinearProgress } from "@rneui/themed";
import React, { useState } from "react";
import Colors from "../constants/Colors";
import useColorScheme from "../hooks/useColorScheme";
import { useNavigation } from "@react-navigation/native";
import { Button } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Review } from "../types.js";

import {
  initialAudioBookProgressStoreDB,
  updateIfBookShelvedDB,
} from "../db/database_functions";

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
  } = props;
  const colorScheme = useColorScheme();
  const navigation = useNavigation();

  const [avatarOnPressEnabled, setAvatarOnPressEnabled] = useState(true);

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
          onPress={() => {
            if (avatarOnPressEnabled) {
              addAudiobookToHistory(index, item);
              navigation.navigate("Audio", {
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
            setTimeout(() => {
              setAvatarOnPressEnabled(true);
            }, 2000);
          }}
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
            onPress={() => {
              const audiobook_id = item?.id;
              if (audiobooksProgress[item?.id]) {
                const isShelved =
                  audiobooksProgress[item?.id]?.audiobook_shelved;
                updateIfBookShelvedDB(db, audiobook_id, !isShelved);
                setAudiobooksProgress((prev: any) => ({
                  ...prev,
                  [audiobook_id]: {
                    ...prev[audiobook_id],
                    audiobook_shelved: !isShelved,
                  },
                }));
                addAudiobookToHistory(index, item);
              } else {
                addAudiobookToHistory(index, item);
                let initialAudioBookSections = new Array(
                  item?.num_sections
                ).fill(0);
                const initAudioBookData = {
                  audiobook_id: item?.id,
                  audiotrack_progress_bars: JSON.stringify(
                    initialAudioBookSections
                  ),
                  current_audiotrack_positions: JSON.stringify(
                    initialAudioBookSections
                  ),
                  audiobook_shelved: true,
                  audiobook_rating: undefined,
                };
                // Store immediately so the star updates right away
                initialAudioBookProgressStoreDB(db, initAudioBookData);
                setAudiobooksProgress((prev: any) => ({
                  ...prev,
                  [item?.id]: initAudioBookData,
                }));
                // Then update rating in background when fetch resolves
                getAverageAudiobookReview(index)
                  ?.then((avgReview: any) => {
                    if (avgReview) {
                      setAudiobooksProgress((prev: any) => ({
                        ...prev,
                        [item?.id]: {
                          ...(prev[item?.id] || initAudioBookData),
                          audiobook_rating: avgReview,
                        },
                      }));
                    }
                  })
                  .catch((error: any) => console.error(error));
              }
            }}
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
});
