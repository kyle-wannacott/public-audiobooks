import { View, StyleSheet, Image, Dimensions, Pressable } from "react-native";

import { ListItem, LinearProgress } from "@rneui/themed";
import React, { useState } from "react";
import Colors from "../constants/Colors";
import useColorScheme from "../hooks/useColorScheme";
import { useNavigation } from "@react-navigation/native";
import { Button } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import { updateIfBookShelvedDB } from "../db/database_functions";

export default function AudiobookCover(props) {
  const {
    item,
    index,
    db,
    resizeCoverImageWidth,
    resizeCoverImageHeight,
    audiobooksProgress,
    setAudiobooksProgress,
    onAfterShelveToggle,
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
      key={item?.audiobook_id}
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
          accessibilityLabel={`${item?.audiobook_title}`}
          style={({ pressed }) => [{ opacity: pressed ? 0.75 : 1.0 }]}
          onPress={() => {
            if (avatarOnPressEnabled) {
              navigation.navigate("Audio", {
                audioBookId: item?.audiobook_id,
                urlRss: item?.audiobook_rss_url,
                coverImage: item?.audiobook_image,
                title: item?.audiobook_title,
                authorFirstName: item?.audiobook_author_first_name,
                authorLastName: item?.audiobook_author_last_name,
                totalTime: item?.audiobook_total_time,
                totalTimeSecs: item?.audiobook_total_time_secs,
                copyrightYear: item?.audiobook_copyright_year,
                genres: JSON.parse(item?.audiobook_genres),
                language: item?.audiobook_language,
                urlReview: item?.audiobook_review_url,
                numSections: item?.audiobook_num_sections,
                urlTextSource: item?.audiobook_ebook_url,
                urlZipFile: item?.audiobook_zip,
                urlProject: item?.audiobook_project_url,
                urlLibrivox: item?.audiobook_librivox_url,
                urlIArchive: item?.audiobook_iarchive_url,
              });
            }
            setAvatarOnPressEnabled(false);
            setTimeout(() => {
              setAvatarOnPressEnabled(true);
            }, 2000);
          }}
        >
          <Image
            source={{ uri: item?.audiobook_image }}
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
              const audiobook_id = item?.audiobook_id;
              if (audiobooksProgress[item?.audiobook_id]) {
                const isShelved =
                  audiobooksProgress[item?.audiobook_id]?.audiobook_shelved;
                updateIfBookShelvedDB(db, audiobook_id, !isShelved);
                setAudiobooksProgress((prev: any) => ({
                  ...prev,
                  [audiobook_id]: {
                    ...prev[audiobook_id],
                    audiobook_shelved: !isShelved,
                  },
                }));
                if (onAfterShelveToggle) onAfterShelveToggle();
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
                audiobooksProgress[item?.audiobook_id]?.audiobook_shelved
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
          value={
            audiobooksProgress[item.audiobook_id]?.listening_progress_percent
          }
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
});
