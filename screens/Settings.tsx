import React, { useState } from "react";
import { StyleSheet, Text, View, Alert, Linking } from "react-native";
import SettingsList from "react-native-settings-list";
import useColorScheme from "../hooks/useColorScheme";
import Colors from "../constants/Colors";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { storeAsyncData, getAsyncData } from "../db/database_functions";

const UserSettings = () => {
  const colorScheme = useColorScheme();
  const currentColorScheme = Colors[colorScheme];
  const insets = useSafeAreaInsets();
  const [audioModeSettings, setAudioModeSettings] = useState({
    interruptionModeAndroid: 1,
    staysActiveInBackground: true,
    shouldDuckAndroid: true,
    playThroughEarpieceAndroid: false,
  });

  React.useEffect(() => {
    getAsyncData("audioModeSettings").then(
      (audioModeSettingsRetrieved: any) => {
        audioModeSettingsRetrieved;
        if (audioModeSettingsRetrieved) {
          return setAudioModeSettings(audioModeSettingsRetrieved);
        }
      }
    );
  }, []);

  const storeAudioModeSettings = (tempApiSettings: object) => {
    storeAsyncData("audioModeSettings", tempApiSettings);
  };

  function staysActiveInBackgroundToggle() {
    setAudioModeSettings({
      ...audioModeSettings,
      staysActiveInBackground: !audioModeSettings.staysActiveInBackground,
    });
    storeAudioModeSettings({
      ...audioModeSettings,
      staysActiveInBackground: !audioModeSettings.staysActiveInBackground,
    });
  }

  function shouldDuckAndroidToggle() {
    setAudioModeSettings({
      ...audioModeSettings,
      shouldDuckAndroid: !audioModeSettings.shouldDuckAndroid,
    });
    storeAudioModeSettings({
      ...audioModeSettings,
      shouldDuckAndroid: !audioModeSettings.shouldDuckAndroid,
    });
  }

  function playThroughEarpieceAndroidToggle() {
    setAudioModeSettings({
      ...audioModeSettings,
      playThroughEarpieceAndroid: !audioModeSettings.playThroughEarpieceAndroid,
    });
    storeAudioModeSettings({
      ...audioModeSettings,
      playThroughEarpieceAndroid: !audioModeSettings.playThroughEarpieceAndroid,
    });
  }

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.settingsStyleBlock,
          { backgroundColor: currentColorScheme.settingsTitleBG },
        ]}
      >
        <Text
          style={[
            styles.settingsTitle,
            { color: currentColorScheme.settingsTitleText, marginTop: insets.top + 10 },
          ]}
        >
          Settings
        </Text>
      </View>
      <View
        style={[
          styles.sectionHeadings,
          { backgroundColor: currentColorScheme.settingsBGColor },
        ]}
      >
        <SettingsList backgroundColor={currentColorScheme.settingsList}>
          <SettingsList.Header
            headerText="Audiobook settings"
            headerStyle={[
              styles.audiobookSettingsSubHeading,
              { color: currentColorScheme.settingsSubSectionTitles },
            ]}
          />
          {/*<SettingsList.Item
            icon={
              <MaterialCommunityIcons
                name="theme-light-dark"
                size={50}
                color={"black"}
              />
            }
            itemWidth={50}
            title="Color scheme"
            hasNavArrow={false}
            hasSwitch={false}
          />*/}
          <SettingsList.Item
            titleStyle={{ color: currentColorScheme.settingsListText }}
            icon={
              <MaterialCommunityIcons
                name="run-fast"
                size={50}
                color={"#FF8C00"}
              />
            }
            hasNavArrow={false}
            title="Stays active in background."
            itemWidth={50}
            switchState={audioModeSettings.staysActiveInBackground}
            switchOnValueChange={staysActiveInBackgroundToggle}
            hasSwitch={true}
            onPress={() =>
              Alert.alert(
                "Stays active in background.",
                "Select if the audio session playback should stay active even when the app goes into the background. Default: On",
                [
                  {
                    text: "Close",
                    style: "cancel",
                  },
                ]
              )
            }
          />
          <SettingsList.Item
            titleStyle={{ color: currentColorScheme.settingsListText }}
            icon={
              <MaterialCommunityIcons
                name="duck"
                size={50}
                color={"#008B8B"}
              />
            }
            hasNavArrow={false}
            title="Duck Audio"
            itemWidth={50}
            switchState={audioModeSettings.shouldDuckAndroid}
            switchOnValueChange={shouldDuckAndroidToggle}
            hasSwitch={true}
            onPress={() =>
              Alert.alert(
                "Duck Audio",
                "Select if your audio should be lowered in volume (duck); when audio from another app interrupts your experience. When off, audio from other apps will pause your audio. Default: On",
                [
                  {
                    text: "Close",
                    style: "cancel",
                  },
                ]
              )
            }
          />
          <SettingsList.Item
            titleStyle={{ color: currentColorScheme.settingsListText }}
            icon={
              <MaterialCommunityIcons
                name="headset"
                size={50}
                color={"#7B68EE"}
              />
            }
            hasNavArrow={false}
            title="Play through earpiece"
            itemWidth={50}
            switchState={audioModeSettings.playThroughEarpieceAndroid}
            switchOnValueChange={playThroughEarpieceAndroidToggle}
            hasSwitch={true}
            onPress={() =>
              Alert.alert(
                "Play through earpiece",
                "Selecting if the audio is routed to earpiece. Default: Off",
                [
                  {
                    text: "Close",
                    style: "cancel",
                  },
                ]
              )
            }
          />

          {/*<SettingsList.Item
            icon={
              <MaterialCommunityIcons name="history" size={50} color={"black"} />
            }
            hasNavArrow={true}
            title="Delete viewing history"
            onPress={() =>
              Alert.alert(
                "Delete history",
                "Are you sure you want to delete audiobook viewing history?",
                [
                  {
                    text: "Cancel",
                    onPress: () => console.log("Cancel Pressed"),
                  },
                  {
                    text: "Delete History",
                    onPress: () => deleteAudiobookHistory(db),
                  },
                ],
                {
                  cancelable: true,
                }
              )
            }
        />*/}

          {/*
          <SettingsList.Item
            icon={
              <MaterialCommunityIcons
                name="history"
                size={50}
                color={"black"}
              />
            }
            hasNavArrow={true}
            title="Delete audiobook progress"
            onPress={() =>
              Alert.alert(
                "Delete audiobook progress",
                "Are you sure you want to delete audiobook progress ?",
                [
                  {
                    text: "Cancel",
                    onPress: () => console.log("Cancel Pressed"),
                  },
                  {
                    text: "Delete audiobook progress",
                    onPress: () => deleteAudiobookProgress(db),
                  },
                ],
                {
                  cancelable: true,
                }
              )
            }
          />*/}
          <SettingsList.Header
            headerText="About"
            headerStyle={[
              styles.audiobookSettingsSubHeading,
              { color: currentColorScheme.settingsSubSectionTitles },
            ]}
          />
          <SettingsList.Item
            titleStyle={{ color: currentColorScheme.settingsListText }}
            icon={
              <MaterialCommunityIcons
                name="information-variant"
                size={50}
                color={"green"}
              />
            }
            titleInfo="3.0.0"
            hasNavArrow={false}
            title="Version: "
          />
          <SettingsList.Item
            hasNavArrow={true}
            titleStyle={{ color: currentColorScheme.settingsListText }}
            icon={
              <MaterialCommunityIcons
                name="github"
                size={50}
                color={"#6e40c9"}
              />
            }
            title="GitHub: kyle-wannacott"
            onPress={() =>
              Alert.alert(
                "GitHub",
                "Checkout the GitHub to open issues, contribute, or request features.",
                [
                  {
                    text: "Cancel",
                    onPress: () => console.log("Cancel Pressed"),
                    style: "cancel",
                  },
                  {
                    text: "github",
                    onPress: () => {
                      Linking.openURL("https://github.com/kyle-wannacott/public-audiobooks");
                    },
                  },
                ]
              )
            }
          />
          <SettingsList.Item
            titleStyle={{ color: currentColorScheme.text }}
            hasNavArrow={true}
            icon={
              <MaterialCommunityIcons
                name="account-tie-voice"
                size={50}
                color={"#1E90FF"}
              />
            }
            title="LibriVox"
            onPress={() =>
              Alert.alert(
                "GitHub",
                "The audiobooks contained in this application are public domain and read by volunteers from LibriVox",
                [
                  {
                    text: "Cancel",
                    onPress: () => console.log("Cancel Pressed"),
                    style: "cancel",
                  },
                  {
                    text: "LibriVox website.",
                    onPress: () => {
                      Linking.openURL("https://librivox.org/");
                    },
                  },
                ]
              )
            }
          />
        </SettingsList>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  sectionHeadings: { flex: 1 },
  settingsTitle: {
    marginBottom: 15,
    marginLeft: 15,
    fontWeight: "bold",
    fontSize: 25,
  },
  audiobookSettingsSubHeading: { marginTop: 20 },
  settingsStyleBlock: {
    borderBottomWidth: 1,
    borderColor: "#dc322f",
  },
});

export default UserSettings;
