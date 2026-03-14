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

const { width: windowWidth, height: windowHeight } = Dimensions.get("window");
// Extra bottom padding so controls clear the phone nav bar on all screen sizes
const BOTTOM_PADDING = Math.round(windowHeight * 0.015) + 5;

export default function MiniPlayer() {
  const colorScheme = useColorScheme();
  const navigation = useNavigation();
  const audio = useAudio();

  if (!audio.showMiniPlayer || !audio.currentBook || !audio.miniPlayerEnabled) {
    return null;
  }

  const colors = Colors[colorScheme];
  const controlSize = Math.round(windowWidth * 0.065);

  const fmt = (ms: number) => {
    if (!ms || isNaN(ms) || ms <= 0) return "0:00";
    const t = ms / 1000;
    const m = Math.floor(t / 60);
    const s = Math.floor(t % 60);
    return `${m}:${s > 9 ? s : `0${s}`}`;
  };

  const currentMs = (audio.currentSliderPosition * audio.currentTrackInfo.duration) / 100;
  const totalMs = audio.currentTrackInfo.duration;

  const navigateToPlayer = () => {
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
  };

  return (
    <View
      style={[styles.container, { backgroundColor: colors.audiotrackControlsBGColor }]}
    >
      {/* Row 1: cover image + title · chapter + controls */}
      <View style={styles.topRow}>
        <Pressable onPress={navigateToPlayer} style={styles.coverWrap}>
          <Image source={{ uri: audio.currentBook.coverImage }} style={styles.coverImage} />
        </Pressable>

        {/* Middle: title + chapter */}
        <Pressable style={styles.titleWrap} onPress={navigateToPlayer}>
          <Text numberOfLines={1} ellipsizeMode="tail" style={[styles.titleText, { color: colors.text }]}>
            {audio.currentBook.title}
          </Text>
          <Text numberOfLines={1} ellipsizeMode="tail" style={[styles.chapterText, { color: colors.text, opacity: 0.75 }]}>
            {audio.currentTrackInfo.title}
          </Text>
        </Pressable>

        {/* Controls on the right */}
        <View style={styles.controlsRow}>
          <View style={{ borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)', borderRadius: 6, marginHorizontal: 3 }}>
            <Button mode="text" compact onPress={() => audio.handlePrevTrack()} style={styles.ctrlBtn}>
              <MaterialIcons name="skip-previous" size={controlSize + 4} color={colors.buttonIconColor} />
            </Button>
          </View>
          {audio.isLoading ? null : (
            <View style={{ borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)', borderRadius: 6, marginHorizontal: 3 }}>
              <Button
                mode="text"
                compact
                style={styles.ctrlBtn}
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
              >
                <MaterialIcons
                  name={audio.isPlaying ? "pause" : "play-arrow"}
                  size={controlSize + 4}
                  color={colors.buttonIconColor}
                />
              </Button>
            </View>
          )}
          <View style={{ borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)', borderRadius: 6, marginHorizontal: 3 }}>
            <Button mode="text" compact onPress={() => audio.handleNextTrack()} style={styles.ctrlBtn}>
              <MaterialIcons name="skip-next" size={controlSize + 4} color={colors.buttonIconColor} />
            </Button>
          </View>
        </View>
      </View>

      {/* Row 2: slider with time labels */}
      <View style={styles.sliderWrap}>
        <Text style={[styles.timeText, { color: colors.text }]}>{fmt(currentMs)}</Text>
        <Slider
          value={audio.currentSliderPosition}
          minimumValue={0}
          maximumValue={100}
          minimumTrackTintColor={colors.sliderTrackColor}
          thumbTintColor={colors.sliderThumbColor}
          onSlidingComplete={(val) => audio.seekToPosition(val)}
          style={styles.slider}
        />
        <Text style={[styles.timeText, { color: colors.text }]}>{fmt(totalMs)}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 8,
    paddingTop: 6,
    paddingBottom: BOTTOM_PADDING,
    borderTopWidth: 1,
    borderTopColor: "rgba(128,128,128,0.3)",
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  coverWrap: {
    marginRight: 8,
  },
  coverImage: {
    width: Math.round(windowWidth * 0.1),
    height: Math.round(windowWidth * 0.1),
    borderRadius: 4,
  },
  titleWrap: {
    flex: 1,
    marginRight: 4,
  },
  titleText: {
    fontSize: Math.round(windowWidth * 0.032),
    fontWeight: "bold",
  },
  chapterText: {
    fontSize: Math.round(windowWidth * 0.028),
    fontWeight: "normal",
    opacity: 0.75,
  },
  controlsRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  ctrlBtn: {
    minWidth: 0,
    marginHorizontal: 0,
  },
  sliderWrap: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 2,
  },
  slider: {
    flex: 1,
    height: 20,
    marginHorizontal: 4,
  },
  timeText: {
    fontSize: Math.round(windowWidth * 0.028),
    minWidth: 36,
    textAlign: "center",
  },
});


