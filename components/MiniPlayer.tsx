import React from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  Pressable,
  Dimensions,
} from "react-native";
import Slider from "@react-native-community/slider";
import { MaterialIcons, MaterialCommunityIcons } from "@expo/vector-icons";
import { Button } from "react-native-paper";
import { useNavigation } from "@react-navigation/native";
import useColorScheme from "../hooks/useColorScheme";
import Colors from "../constants/Colors";
import { useAudio } from "../hooks/AudioContext";

const { width: windowWidth } = Dimensions.get("window");

export default function MiniPlayer() {
  const colorScheme = useColorScheme();
  const navigation = useNavigation();
  const audio = useAudio();

  if (!audio.showMiniPlayer || !audio.currentBook || !audio.miniPlayerEnabled) {
    return null;
  }

  const colors = Colors[colorScheme];
  const controlSize = 24;

  const GetDurationFormat = (ms: number) => {
    if (typeof ms !== "number" || isNaN(ms)) return "0:00";
    const time = ms / 1000;
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time - minutes * 60);
    return `${minutes}:${seconds > 9 ? seconds : `0${seconds}`}`;
  };

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.audiotrackControlsBGColor,
        },
      ]}
    >
      <Pressable
        style={styles.infoRow}
        onPress={() => {
          const book = audio.currentBook;
          if (book) {
            (navigation as any).navigate("Audio", {
              audioBookId: book.audioBookId,
              urlRss: book.urlRss,
              coverImage: book.coverImage,
              numSections: book.numSections,
              title: book.title,
              authorFirstName: book.authorFirstName,
              authorLastName: book.authorLastName,
              totalTime: book.totalTime,
              totalTimeSecs: book.totalTimeSecs,
            });
          }
        }}
      >
        <Image
          source={{ uri: audio.currentBook.coverImage }}
          style={styles.coverImage}
        />
        <View style={styles.trackInfo}>
          <Text
            numberOfLines={1}
            ellipsizeMode="tail"
            style={[styles.titleText, { color: colors.text }]}
          >
            {audio.currentBook.title}
          </Text>
          <Text
            numberOfLines={1}
            ellipsizeMode="tail"
            style={[styles.subtitleText, { color: colors.text }]}
          >
            {audio.currentTrackInfo.title}
          </Text>
        </View>
      </Pressable>

      {/* Slider */}
      <View style={styles.sliderRow}>
        <Slider
          value={audio.currentSliderPosition}
          minimumValue={0}
          maximumValue={100}
          minimumTrackTintColor={colors.sliderTrackColor}
          thumbTintColor={colors.sliderThumbColor}
          onSlidingComplete={(val) => audio.seekToPosition(val)}
          style={styles.slider}
        />
        <View style={styles.timeRow}>
          <Text style={[styles.timeText, { color: colors.text }]}>
            {GetDurationFormat(
              (audio.currentSliderPosition * audio.currentTrackInfo.duration) / 100
            )}
          </Text>
          <Text style={[styles.timeText, { color: colors.text }]}>
            {GetDurationFormat(audio.currentTrackInfo.duration)}
          </Text>
        </View>
      </View>

      {/* Controls */}
      <View style={styles.controlsRow}>
        <Button
          mode="text"
          compact
          onPress={() => audio.handlePrevTrack()}
          accessibilityLabel="Previous chapter"
        >
          <MaterialIcons
            name="skip-previous"
            size={controlSize}
            color={colors.buttonIconColor}
          />
        </Button>
        <Button
          mode="text"
          compact
          onPress={() => audio.rewindTenSeconds()}
          accessibilityLabel="Rewind 10 seconds"
        >
          <MaterialCommunityIcons
            name="rewind-10"
            size={controlSize}
            color={colors.buttonIconColor}
          />
        </Button>
        {audio.isLoading ? null : (
          <Button
            mode="text"
            compact
            onPress={() =>
              audio.isPlaying
                ? audio.pauseAudio()
                : audio.isLoadedOnce
                ? audio.playAudio()
                : audio.loadTrack(
                    audio.currentTrackIndex,
                    audio.currentAudiotrackPositionsMs[audio.currentTrackIndex] || 0
                  )
            }
            accessibilityLabel={audio.isPlaying ? "Pause" : "Play"}
          >
            <MaterialIcons
              name={audio.isPlaying ? "pause" : "play-arrow"}
              size={controlSize + 4}
              color={colors.buttonIconColor}
            />
          </Button>
        )}
        <Button
          mode="text"
          compact
          onPress={() => audio.forwardTenSeconds()}
          accessibilityLabel="Forward 10 seconds"
        >
          <MaterialCommunityIcons
            name="fast-forward-10"
            size={controlSize}
            color={colors.buttonIconColor}
          />
        </Button>
        <Button
          mode="text"
          compact
          onPress={() => audio.handleNextTrack()}
          accessibilityLabel="Next chapter"
        >
          <MaterialIcons
            name="skip-next"
            size={controlSize}
            color={colors.buttonIconColor}
          />
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 8,
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: "rgba(128,128,128,0.3)",
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 2,
  },
  coverImage: {
    width: 40,
    height: 40,
    borderRadius: 4,
    marginRight: 8,
  },
  trackInfo: {
    flex: 1,
  },
  titleText: {
    fontSize: 13,
    fontWeight: "bold",
  },
  subtitleText: {
    fontSize: 11,
  },
  sliderRow: {
    marginBottom: 0,
  },
  slider: {
    width: "100%",
    height: 20,
  },
  timeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 4,
  },
  timeText: {
    fontSize: 10,
  },
  controlsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    height: 36,
  },
});
