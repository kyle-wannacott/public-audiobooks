import Slider from "@react-native-community/slider";
import { StyleSheet, Text, View, Image } from "react-native";
import React from "react";
import { Dimensions } from "react-native";
import useColorScheme from "../hooks/useColorScheme";
import Colors from "../constants/Colors";

function AudiotrackSliderWithCurrentPlaying(props: any) {
  const colorScheme = useColorScheme();
  const currentColorScheme = Colors[colorScheme];
  return (
    <View style={{ backgroundColor: currentColorScheme.sliderBGColor }}>
      <Slider
        value={props.currentSliderPosition}
        disabled={false}
        minimumValue={0.0}
        maximumValue={100.0}
        minimumTrackTintColor={currentColorScheme.sliderTrackColor}
        maximumTrackTintColor={currentColorScheme.sliderMaxTrackColor}
        thumbTintColor={currentColorScheme.sliderThumbColor}
        onSlidingComplete={(data) => props.SeekUpdate(data)}
      />
      <View
        style={[
          styles.AudiobookTime,
          { backgroundColor: Colors[colorScheme].audiobookControlsTimeBGColor },
        ]}
      >
        <Text style={{ marginLeft: 10, color:currentColorScheme.text }}>
          {" "}
          {props.GetDurationFormat(
            (props.currentSliderPosition * props.Duration) / 100
          )}{" "}
        </Text>
        <Text style={{ marginRight: 10 ,color:currentColorScheme.text }}>
          {" "}
          {props.GetDurationFormat(props.Duration)}
        </Text>
      </View>
      <View
        style={[
          styles.audiobookImageAndCurrentlyPlayingInfo,
          {
            backgroundColor:
              currentColorScheme.imageAndCurrentlyPlayingInfoBGColor,
          },
        ]}
      >
        <Image
          source={{ uri: props.coverImage }}
          style={{
            width: 50,
            height: 50,
            marginRight: 5,
          }}
        />
        <View>
          <Text numberOfLines={2} ellipsizeMode="tail" style={{color:currentColorScheme.text }}>
            {" "}
            {props.audioTrackChapterPlayingTitle}{" "}
          </Text>
          <Text numberOfLines={1} ellipsizeMode="tail" style={{color:currentColorScheme.text }}>
            {" "}
            {props.audioTrackReader}{" "}
          </Text>
        </View>
      </View>
    </View>
  );
}

export default AudiotrackSliderWithCurrentPlaying;

const windowWidth = Dimensions.get("window").width;
const windowHeight = Dimensions.get("window").height;
const styles = StyleSheet.create({
  AudiobookTime: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    minHeight: 20,
  },
  audiobookImageAndCurrentlyPlayingInfo: {
    flexDirection: "row",
    paddingLeft: 5,
    maxWidth: windowWidth - 70,
  },
});
