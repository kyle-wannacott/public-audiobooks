import { ActivityIndicator, StyleSheet, View, Dimensions } from "react-native";
import { MaterialIcons, MaterialCommunityIcons } from "@expo/vector-icons";
import { Button } from "react-native-paper";
import useColorScheme from "../hooks/useColorScheme";
import Colors from "../constants/Colors";

const { height: windowHeight } = Dimensions.get("window");

function AudioTrackControls(props: any) {
  const colorScheme = useColorScheme();
  const controlPanelButtonSize = 30;
  const {
    loadingCurrentAudiotrack,
    rewindTenSeconds,
    HandlePrevTrack,
    HandleNextTrack,
    PlayAudio,
    isPlaying,
    forwardTenSeconds,
    currentAudioTrackIndex,
    trackPositions,
  } = props;

  return (
    <View style={styles.controlsVert}>
      <View
        style={[
          styles.controls,
          {
            backgroundColor: Colors[colorScheme].audiotrackControlsBGColor,
          },
        ]}
      >
        <Button
          style={{
            backgroundColor: Colors[colorScheme].buttonBackgroundColor,
          }}
          mode={Colors[colorScheme].buttonMode}
          onPress={() => HandlePrevTrack()}
          accessibilityLabel="Previous chapter."
        >
          <MaterialIcons
            name="skip-previous"
            size={controlPanelButtonSize}
            color={Colors[colorScheme].buttonIconColor}
          />
        </Button>
        <Button
          style={{
            backgroundColor: Colors[colorScheme].buttonBackgroundColor,
          }}
          mode={Colors[colorScheme].buttonMode}
          onPress={() => rewindTenSeconds()}
          accessibilityLabel="Rewind 10 seconds."
        >
          <MaterialCommunityIcons
            name="rewind-10"
            size={controlPanelButtonSize}
            color={Colors[colorScheme].buttonIconColor}
          />
        </Button>
        {loadingCurrentAudiotrack ? (
          <View style={styles.ActivityIndicatorContainer}>
            <ActivityIndicator
              size={"large"}
              color={Colors[colorScheme].activityIndicatorColor}
              accessibilityLabel="loading"
            />
          </View>
        ) : props.loadedCurrentAudiotrack === false ? (
          <Button
            style={{
              backgroundColor: Colors[colorScheme].buttonBackgroundColor,
            }}
            mode={Colors[colorScheme].buttonMode}
            accessibilityLabel="Resume play from last played audiotrack"
            onPress={() =>
              props.LoadAudio(
                currentAudioTrackIndex.current,
                trackPositions.currentAudiotrackPositionsMs[
                  currentAudioTrackIndex.current
                ]
              )
            }
          >
            <MaterialIcons
              name="not-started"
              size={controlPanelButtonSize}
              color={Colors[colorScheme].buttonIconColor}
            />
          </Button>
        ) : isPlaying ? (
          <Button
            style={{
              backgroundColor: Colors[colorScheme].buttonBackgroundColor,
            }}
            mode={Colors[colorScheme].buttonMode}
            onPress={() => props.PauseAudio()}
            accessibilityLabel="Pause audio"
          >
            <MaterialIcons
              name="pause"
              size={controlPanelButtonSize}
              color={Colors[colorScheme].buttonIconColor}
            />
          </Button>
        ) : props.audioPaused === false ? (
          <View style={styles.ActivityIndicatorContainer}>
            <ActivityIndicator
              size={"large"}
              color={Colors[colorScheme].activityIndicatorColor}
              accessibilityLabel={"loading"}
            />
          </View>
        ) : (
          <Button
            style={{
              backgroundColor: Colors[colorScheme].buttonBackgroundColor,
            }}
            mode={Colors[colorScheme].buttonMode}
            onPress={() => PlayAudio()}
            accessibilityLabel="Play audio"
          >
            <MaterialIcons
              name="play-arrow"
              size={controlPanelButtonSize}
              color={Colors[colorScheme].buttonIconColor}
            />
          </Button>
        )}
        <Button
          style={{
            backgroundColor: Colors[colorScheme].buttonBackgroundColor,
          }}
          mode={Colors[colorScheme].buttonMode}
          onPress={() => forwardTenSeconds()}
          accessibilityLabel="Forward 10 seconds."
        >
          <MaterialCommunityIcons
            name="fast-forward-10"
            size={controlPanelButtonSize}
            color={Colors[colorScheme].buttonIconColor}
          />
        </Button>
        <Button
          style={{
            backgroundColor: Colors[colorScheme].buttonBackgroundColor,
          }}
          mode={Colors[colorScheme].buttonMode}
          onPress={() => HandleNextTrack()}
          accessibilityLabel="Next chapter."
        >
          <MaterialIcons
            name="skip-next"
            size={controlPanelButtonSize}
            color={Colors[colorScheme].buttonIconColor}
          />
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  controls: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
  },
  controlsVert: {
    height: Math.max(56, windowHeight * 0.075),
  },
  ActivityIndicatorContainer: {
    width: 64,
  },
});

export default AudioTrackControls;
