import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Overlay } from "@rneui/themed";
import { Button } from "react-native-paper";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons.js";
import Slider from "@react-native-community/slider";
import useColorScheme from "../hooks/useColorScheme";
import Colors from "../constants/Colors";
import { useAudio } from "../hooks/AudioContext";

function AudioTrackSettings(props: any) {
  const {
    isVisible,
    toggleOverlay,
    audioPlayerSettings,
    setAudioPlayerSettings,
    storeAudioTrackSettings,
  } = props;

  const colorScheme = useColorScheme();
  const currentColorScheme = Colors[colorScheme];
  const audio = useAudio();

  async function updateAudtiotrackSpeed(updateRate: number) {
    try {
      const newSettings = {
        ...audioPlayerSettings,
        rate: updateRate,
      };
      setAudioPlayerSettings(newSettings);
      audio.applyPlayerSettings(newSettings);
      await storeAudioTrackSettings(newSettings);
    } catch (e) {
      console.log(e);
    }
  }

  async function updateAudiotrackVolume(newVolumeLevel: number) {
    try {
      const newSettings = {
        ...audioPlayerSettings,
        volume: newVolumeLevel,
      };
      setAudioPlayerSettings(newSettings);
      audio.applyPlayerSettings(newSettings);
      await storeAudioTrackSettings(newSettings);
    } catch (e) {
      console.log(e);
    }
  }

  return (
    <Overlay
      isVisible={isVisible}
      onBackdropPress={toggleOverlay}
      fullScreen={false}
      overlayStyle={{
        backgroundColor: currentColorScheme.overlayBackgroundColor,
      }}
    >
      <Text style={{ marginBottom: 10, color: currentColorScheme.text}}>
        Volume of Audiotrack: {audioPlayerSettings.volume}
      </Text>
      <View style={styles.sliderWithIconsOnSides}>
        <Button
          accessibilityLabel="Decrease Volume"
          accessibilityHint={`Current volume level: ${audioPlayerSettings.volume} `}
          onPress={() => {
            audioPlayerSettings.volume >= 0.25
              ? updateAudiotrackVolume(audioPlayerSettings.volume - 0.25)
              : undefined;
          }}
          mode={Colors[colorScheme].buttonMode}
          style={{
            backgroundColor: currentColorScheme.buttonBackgroundColor,
          }}
        >
          <MaterialCommunityIcons
            name="volume-minus"
            size={30}
            color={currentColorScheme.buttonIconColor}
          />
        </Button>
        <Slider
          value={audioPlayerSettings.volume}
          style={{ width: 200, height: 40 }}
          minimumValue={0.0}
          maximumValue={1.0}
          minimumTrackTintColor={currentColorScheme.sliderTrackColor}
          thumbTintColor={currentColorScheme.sliderThumbColor}
          step={0.25}
          onValueChange={async (volumeLevel: number) => {
            updateAudiotrackVolume(volumeLevel);
          }}
        />
        <Button
          accessibilityLabel="Decrease Volume"
          accessibilityHint={`Current volume level: ${audioPlayerSettings.volume} `}
          onPress={() => {
            audioPlayerSettings.volume <= 0.75
              ? updateAudiotrackVolume(audioPlayerSettings.volume + 0.25)
              : undefined;
          }}
          style={{
            backgroundColor: currentColorScheme.buttonBackgroundColor,
          }}
          mode={Colors[colorScheme].buttonMode}
        >
          <MaterialCommunityIcons
            name="volume-plus"
            size={30}
            color={currentColorScheme.buttonIconColor}
          />
        </Button>
      </View>
      {/*<Text
        style={{
          marginBottom: 10,
          marginTop: 10,
          color: currentColorScheme.text,
        }}
      >
        Pitch Correction: {audioPlayerSettings.shouldCorrectPitch}
      </Text>
      <Switch
        accessibilityLabel={`pitch switch: currently: ${audioPlayerSettings.shouldCorrectPitch}`}
        value={audioPlayerSettings.shouldCorrectPitch}
        onValueChange={onTogglePitchSwitch}
      />
        */}
      {/*
      <Text style={{ marginBottom: 10, color: currentColorScheme.text }}>
        Mute : {audioPlayerSettings.isMuted}
      </Text>
      <Switch
        accessibilityLabel={`mute switch: currently ${audioPlayerSettings.isMuted}`}
        value={audioPlayerSettings.isMuted}
        onValueChange={onToggleMuteSwitch}
      />
      /*}
      {/*
      <Text>looping: {audioPlayerSettings.isLooping}</Text>
      <Switch
        value={audioPlayerSettings.isLooping}
        onValueChange={onToggleLoopSwitch}
      />
      */}
      <Text style={{ marginBottom: 10, color: currentColorScheme.text }}>
        Speed of Audiotrack: {audioPlayerSettings.rate}X
      </Text>
      <View style={styles.sliderWithIconsOnSides}>
        <Button
          accessibilityLabel="Decrease speed of audiotrack"
          accessibilityHint={`Current speed: ${audioPlayerSettings.rate}X `}
          onPress={() => {
            audioPlayerSettings.rate >= 0.5
              ? updateAudtiotrackSpeed(audioPlayerSettings.rate - 0.25)
              : undefined;
          }}
          style={{
            backgroundColor: currentColorScheme.buttonBackgroundColor,
          }}
          mode={currentColorScheme.buttonMode}
        >
          <MaterialCommunityIcons
            name="tortoise"
            size={30}
            color={currentColorScheme.buttonIconColor}
          />
        </Button>
        <Slider
          value={audioPlayerSettings.rate}
          style={{ width: 200, height: 40 }}
          minimumValue={0.25}
          maximumValue={2.0}
          minimumTrackTintColor={currentColorScheme.sliderTrackColor}
          thumbTintColor={currentColorScheme.sliderThumbColor}
          step={0.25}
          onValueChange={async (speed: number) => {
            updateAudtiotrackSpeed(speed);
          }}
        />
        <Button
          accessibilityLabel="Decrease speed of audiotrack"
          accessibilityHint={`Current speed: ${audioPlayerSettings.rate}x `}
          onPress={() => {
            audioPlayerSettings.rate <= 1.75
              ? updateAudtiotrackSpeed(audioPlayerSettings.rate + 0.25)
              : undefined;
          }}
          style={{ backgroundColor: currentColorScheme.buttonBackgroundColor }}
          mode={currentColorScheme.buttonMode}
        >
          <MaterialCommunityIcons
            name="rabbit"
            size={30}
            color={currentColorScheme.buttonIconColor}
          />
        </Button>
      </View>
    </Overlay>
  );
}

export default AudioTrackSettings;

const styles = StyleSheet.create({
  sliderWithIconsOnSides: {
    display: "flex",
    flexDirection: "row",
  },
});
