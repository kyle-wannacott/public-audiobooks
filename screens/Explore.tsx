import React, { useState, useRef, useEffect } from "react";

import { SearchBar, Overlay } from "@rneui/themed";
import Slider from "@react-native-community/slider";
import ExploreShelf from "../components/ExploreShelf";
import { View, Dimensions, Text, Switch, ScrollView, FlatList } from "react-native";
import { StyleSheet } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { getAsyncData, storeAsyncData } from "../db/database_functions";
import { Divider, Button } from "react-native-paper";
import useColorScheme from "../hooks/useColorScheme";
import Colors from "../constants/Colors";
import * as NavigationBar from "expo-navigation-bar";
import { useNavigation } from "@react-navigation/native";
import { Suggestion } from "../types";
import { LinearProgress } from "@rneui/themed";
import { FlashList } from "@shopify/flash-list";
import Fuse from "fuse.js";
import { useAudio } from "../hooks/AudioContext";

export default function Explore(props: any) {
  const colorScheme = useColorScheme();
  const currentColorScheme = Colors[colorScheme];
  const [search, setSearch] = useState("");
  const [userInputEntered, setUserInputEntered] = useState("");
  const [visible, setVisible] = useState(false);
  let amountOfAudiobooks = 64;
  const [audiobookAmountRequested, setAudiobooksAmountRequested] =
    useState(amountOfAudiobooks);
  const [infiniteBooks, setInfiniteBooksState] = useState(false);
  const [loadingAudiobookAmount, setLoadingAudiobookAmount] = useState(false);
  const [gettingAverageReview, setGettingAverageReview] = useState(false);
  const [genreFuse, setGenreFuse] = useState<Fuse>("");
  const [authorFuse, setAuthorFuse] = useState<Fuse>("");
  const [suggestions, setSuggestions] = useState("");
  const [suggestionVisible, setSuggestionsVisible] = useState<boolean>(false);
  const [selectedSuggestionID, setSelelectedSuggestionID] = useState<any>();
  const refToSearchbar = useRef(null);
  const searchBy = props.route.params.searchBy;
  const navigation = useNavigation();
  const audio = useAudio();
  const { bookDisplayMode, setBookDisplayMode } = audio;

  const updateVolume = (volume: number) => {
    const s = { ...audio.audioPlayerSettings, volume };
    audio.setAudioPlayerSettings(s);
    audio.applyPlayerSettings(s);
    storeAsyncData("audioTrackSettingsTest", s);
  };

  const updateSpeed = (rate: number) => {
    const s = { ...audio.audioPlayerSettings, rate };
    audio.setAudioPlayerSettings(s);
    audio.applyPlayerSettings(s);
    storeAsyncData("audioTrackSettingsTest", s);
  };

  React.useEffect(() => {
    const unsubscribe = navigation.addListener("focus", () => {
      getAsyncData("audiobookAmountRequested").then(
        (audiobookAmountRequestedRetrieved) => {
          audiobookAmountRequestedRetrieved
            ? setAudiobooksAmountRequested(audiobookAmountRequestedRetrieved)
            : setAudiobooksAmountRequested(amountOfAudiobooks);
        }
      );
      getAsyncData("infiniteBooks").then((val) => {
        if (val !== null && val !== undefined) setInfiniteBooksState(val);
      });
      switch (searchBy) {
        case "title":
          getAsyncData("userSearchTitle").then((userSearchTitleRetrieved) => {
            userSearchTitleRetrieved
              ? (setSearch(userSearchTitleRetrieved),
                setUserInputEntered(userSearchTitleRetrieved))
              : (setSearch(""), setUserInputEntered("defaultTitleSearch"));
          });
          break;
        case "genre":
          getAsyncData("userSearchGenre").then((userSearchGenreRetrieved) => {
            userSearchGenreRetrieved
              ? (setSearch(userSearchGenreRetrieved),
                setUserInputEntered(userSearchGenreRetrieved))
              : (setSearch("*Non-fiction"),
                setUserInputEntered("*Non-fiction"));
          });
          break;
        case "author":
          getAsyncData("userSearchAuthor").then((userSearchAuthorRetrieved) => {
            userSearchAuthorRetrieved
              ? setSearch(userSearchAuthorRetrieved)
              : setSearch("Fyodor Dostoyevsky");
          });
          getAsyncData("userInputAuthorSubmitted").then(
            (userInputAuthorRetrieved) => {
              userInputAuthorRetrieved
                ? setUserInputEntered(userInputAuthorRetrieved)
                : setUserInputEntered("Dostoyevsky");
            }
          );
          break;
      }
    });
    return unsubscribe;
  }, [navigation]);

  function setAndStoreAudiobookAmountRequested(amount: number) {
    setAudiobooksAmountRequested(amount);
    storeAsyncData("audiobookAmountRequested", amount);
  }

  function toggleInfiniteBooks(val: boolean) {
    setInfiniteBooksState(val);
    storeAsyncData("infiniteBooks", val);
  }

  const storeSearchText = (searchType: string, userInput: string) => {
    storeAsyncData(searchType, userInput);
  };
  const storeSearchBarSubmitted = (searchType: string, userInput: string) => {
    storeAsyncData(searchType, userInput);
  };

  const toggleSearchOptionsOverlay = () => {
    NavigationBar.setBackgroundColorAsync(
      Colors[colorScheme].statusBarBackground
    );
    setVisible(!visible);
  };

  function searchBarPlaceholder() {
    switch (searchBy) {
      case "recent":
        return "New Releases";
      case "title":
        return "Search by Title:";
      case "author":
        return `Search by Author:`;
      case "genre":
        return `Search by Genre:`;
    }
  }

  useEffect(() => {
    const genreOptions = {
      includeScore: true,
    };
    const authorOptions = {
      includeScore: true,
      keys: ["last_name", "first_name"],
    };
    function makeFuse() {
      switch (searchBy) {
        case "genre":
          return setGenreFuse(
            new Fuse(props.route.params.genreList, genreOptions)
          );
        case "author":
          return setAuthorFuse(
            new Fuse(
              props.route.params.authorsListJSON["authors"],
              authorOptions
            )
          );
        default:
      }
    }
    makeFuse();
  }, []);

  const updateSearch = (search: string) => {
    if (searchBy !== "title" || searchBy === "author") {
      setSuggestionsVisible(true);
    }
    setSearch(search);

    function generateFuse() {
      switch (searchBy) {
        case "genre":
          const resultGenreFuse = genreFuse.search(search);
          return setSuggestions(resultGenreFuse);
        case "author":
          const resultAuthorFuse = authorFuse.search(search);
          return setSuggestions(resultAuthorFuse);
        default:
      }
    }
    generateFuse();
  };

  function submitUserInput(item: Suggestion) {
    switch (searchBy) {
      case "genre":
        setSearch(item?.item);
        setUserInputEntered(item?.item);
        storeSearchText("userSearchGenre", item?.item);
        break;
      case "author":
        setSearch(item?.item?.first_name + " " + item?.item?.last_name);
        storeSearchText(
          "userSearchAuthor",
          item?.item?.first_name + " " + item?.item?.last_name
        );
        storeSearchBarSubmitted(
          "userInputAuthorSubmitted",
          item?.item?.last_name
        );
        setUserInputEntered(item?.item?.last_name);
        break;
    }
  }

  function suggestionTimeout() {
    setSuggestionsVisible(false), setSelelectedSuggestionID(null);
  }

  const renderSuggestions = ({ item, index }: Suggestion) => {
    const isSelected = selectedSuggestionID === index;
    return (
      <>
        <Text
          style={{
            color: isSelected ? Colors[colorScheme].suggestionsBGColor : Colors[colorScheme].suggestionsText,
            backgroundColor: isSelected ? Colors[colorScheme].suggestionsText : Colors[colorScheme].suggestionsBGColor,
            fontSize: 20,
            paddingLeft: 5,
            paddingVertical: 4,
            fontWeight: isSelected ? "bold" : "normal",
            borderLeftWidth: isSelected ? 4 : 0,
            borderLeftColor: "#2aa198",
          }}
          onPress={() => {
            setSelelectedSuggestionID(index);
            submitUserInput(item);
            setTimeout(() => {
              suggestionTimeout();
            }, 500);
          }}
        >
          {searchBy === "author"
            ? item.item.first_name + " " + item.item.last_name
            : item.item}
        </Text>
        <Divider style={{ backgroundColor: "#2aa198" }} />
      </>
    );
  };

  return (
    <View
      style={{
        display: "flex",
        backgroundColor: Colors[colorScheme].background,
      }}
    >
      <View
        style={{
          display: "flex",
          flexDirection: "column",
          // justifyContent: "center",
          // alignItems: "center",
          backgroundColor: Colors[colorScheme].searchBarBackground,
          width: windowWidth,
          paddingRight: 8,
        }}
      >
        <View style={styles.searchStyle}>
          <SearchBar
            ref={(searchbar) => (refToSearchbar.current = searchbar)}
            placeholder={searchBarPlaceholder()}
            disabled={props.route.params.isSearchDisabled}
            lightTheme={false}
            onChangeText={(val: string) => {
              updateSearch(val);
            }}
            onSubmitEditing={() => {
              setUserInputEntered(search), setSuggestionsVisible(false);
              if (searchBy === "title") {
                storeSearchText("userSearchTitle", search);
                storeSearchBarSubmitted("userInputTitleSubmitted", search);
              }
            }}
            value={search}
            inputContainerStyle={{
              backgroundColor: Colors[colorScheme].searchBarInputContainerStyle,
              borderWidth: 1,
              borderBottomWidth: 1,
              width: windowWidth - 90,
              borderColor: Colors[colorScheme].bookshelfPickerBorderColor,
              height: 55,
            }}
            inputStyle={{
              backgroundColor: Colors[colorScheme].searchBarInputStyle,
              color: Colors[colorScheme].searchBarTextColor,
              height: 55,
            }}
            searchIcon={{ color: Colors[colorScheme].searchBarSearchIcon }}
            clearIcon={{
              color: Colors[colorScheme].searchBarClearIcon,
              size: 25,
            }}
            placeholderTextColor={Colors[colorScheme].searchBarClearIcon}
            onClear={() => setSuggestionsVisible(false)}
            containerStyle={{
              backgroundColor: Colors[colorScheme].searchBarContainerStyle,
              borderTopWidth: 0,
              borderBottomWidth: 0,
            }}
          />
          <View
            style={{
              display: "flex",
              justifyContent: "center",
            }}
          >
            <Button
              accessibilityLabel="Search options"
              accessibilityHint="Opens options for searching by Title, Author, Genre and changing amount of audiobooks requested per search."
              onPress={toggleSearchOptionsOverlay}
              mode={Colors[colorScheme].buttonMode}
              style={{
                backgroundColor: currentColorScheme.buttonBackgroundColor,
                height: 55,
              }}
            >
              <MaterialCommunityIcons
                name="cog"
                size={35}
                color={Colors[colorScheme].buttonIconColor}
              />
            </Button>
          </View>
        </View>
        {loadingAudiobookAmount || gettingAverageReview ? (
          <LinearProgress
            color={Colors[colorScheme].linearLoadingBarColor}
            value={100}
            style={{ width: windowWidth, marginBottom: 2 }}
            variant="indeterminate"
            trackColor={Colors[colorScheme].audiobookProgressTrackColor}
            animation={true}
          />
        ) : (
          <LinearProgress
            color={Colors[colorScheme].linearLoadingBarColor}
            value={0}
            style={{ width: windowWidth, marginBottom: 2 }}
            variant="indeterminate"
            trackColor={Colors[colorScheme].searchBarBackground}
            animation={false}
          />
        )}

        <Overlay
          isVisible={visible}
          onBackdropPress={toggleSearchOptionsOverlay}
          fullScreen={false}
          overlayStyle={{
            backgroundColor: Colors[colorScheme].overlayBackgroundColor,
            maxHeight: windowHeight * 0.75,
            paddingBottom: 12,
          }}
        >
          <ScrollView showsVerticalScrollIndicator={false}>
          {/* Infinite books toggle */}
          <View style={[styles.checkboxRow, { justifyContent: 'space-between', marginBottom: 8 }]}>
            <Text style={{ fontSize: 15, color: currentColorScheme.text }}>
              Infinite audiobooks per search
            </Text>
            <Switch
              value={infiniteBooks}
              onValueChange={toggleInfiniteBooks}
              trackColor={{ false: currentColorScheme.sliderTrackColor, true: currentColorScheme.audiobookProgressColor }}
              thumbColor={currentColorScheme.sliderThumbColor}
            />
          </View>

          {/* Per-search amount (disabled when infinite) */}
          <View style={[styles.checkboxRow, { opacity: infiniteBooks ? 0.4 : 1 }]}>
            <Text style={{ fontSize: 15, color: currentColorScheme.text }}>
              Audiobooks per search: {infiniteBooks ? '∞' : audiobookAmountRequested}
            </Text>
          </View>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              opacity: infiniteBooks ? 0.4 : 1,
            }}
            pointerEvents={infiniteBooks ? 'none' : 'auto'}
          >
            <Button
              accessibilityLabel="Decrease audiobooks requested per search."
              onPress={() =>
                audiobookAmountRequested >= 6
                  ? setAndStoreAudiobookAmountRequested(audiobookAmountRequested - 5)
                  : undefined
              }
              mode={Colors[colorScheme].buttonMode}
              style={{ backgroundColor: Colors[colorScheme].buttonBackgroundColor }}
            >
              <MaterialCommunityIcons name="minus" size={30} color={Colors[colorScheme].buttonIconColor} />
            </Button>
            <Slider
              value={audiobookAmountRequested}
              maximumValue={420}
              minimumValue={1}
              onValueChange={setAndStoreAudiobookAmountRequested}
              step={1}
              style={{ width: 180, height: 40, margin: 10 }}
              trackStyle={{ height: 10, backgroundColor: Colors[colorScheme].sliderTrackColor }}
              thumbStyle={{ height: 12, width: 12, backgroundColor: Colors[colorScheme].sliderThumbColor }}
            />
            <Button
              accessibilityLabel="Increase audiobooks requested per search."
              onPress={() =>
                audiobookAmountRequested <= 415
                  ? setAndStoreAudiobookAmountRequested(audiobookAmountRequested + 5)
                  : undefined
              }
              mode={Colors[colorScheme].buttonMode}
              style={{ backgroundColor: Colors[colorScheme].buttonBackgroundColor }}
            >
              <MaterialCommunityIcons name="plus" size={30} color={Colors[colorScheme].buttonIconColor} />
            </Button>
          </View>

          {/* Display mode toggle */}
          <View style={[styles.checkboxRow, { marginTop: 8 }]}>
            <Text style={{ fontSize: 15, color: currentColorScheme.text, marginRight: 8 }}>
              Display:
            </Text>
            <Button
              mode={bookDisplayMode === 'grid' ? 'contained' : 'outlined'}
              onPress={() => setBookDisplayMode('grid')}
              style={{ marginRight: 8 }}
              contentStyle={{ height: 36 }}
              textColor={bookDisplayMode === 'grid' ? '#fff' : '#4CAF50'}
            >
              <MaterialCommunityIcons
                name="view-grid"
                size={18}
                color={bookDisplayMode === 'grid' ? '#fff' : '#4CAF50'}
              />
              {"  Grid"}
            </Button>
            <Button
              mode={bookDisplayMode === 'list' ? 'contained' : 'outlined'}
              onPress={() => setBookDisplayMode('list')}
              contentStyle={{ height: 36 }}
              textColor={bookDisplayMode === 'list' ? '#fff' : '#4CAF50'}
            >
              <MaterialCommunityIcons
                name="view-list"
                size={18}
                color={bookDisplayMode === 'list' ? '#fff' : '#4CAF50'}
              />
              {"  List"}
            </Button>
          </View>

          {/* Volume */}
          <View style={[styles.checkboxRow, { marginTop: 10 }]}>
            <Text style={{ fontSize: 15, color: currentColorScheme.text }}>
              Volume: {audio.audioPlayerSettings.volume.toFixed(2)}
            </Text>
          </View>
          <View style={styles.sliderControlRow}>
            <Button
              compact
              mode={Colors[colorScheme].buttonMode}
              style={{ backgroundColor: currentColorScheme.buttonBackgroundColor, minWidth: 0 }}
              onPress={() => audio.audioPlayerSettings.volume >= 0.25 && updateVolume(Math.round((audio.audioPlayerSettings.volume - 0.25) * 100) / 100)}
            >
              <MaterialCommunityIcons name="volume-minus" size={26} color={currentColorScheme.buttonIconColor} />
            </Button>
            <Slider
              value={audio.audioPlayerSettings.volume}
              minimumValue={0}
              maximumValue={1}
              step={0.05}
              onValueChange={(v) => updateVolume(Math.round(v * 100) / 100)}
              style={{ flex: 1, height: 36, marginHorizontal: 6 }}
              trackStyle={{ height: 8, backgroundColor: currentColorScheme.sliderTrackColor }}
              thumbStyle={{ height: 12, width: 12, backgroundColor: currentColorScheme.sliderThumbColor }}
            />
            <Button
              compact
              mode={Colors[colorScheme].buttonMode}
              style={{ backgroundColor: currentColorScheme.buttonBackgroundColor, minWidth: 0 }}
              onPress={() => audio.audioPlayerSettings.volume <= 0.95 && updateVolume(Math.round((audio.audioPlayerSettings.volume + 0.25) * 100) / 100)}
            >
              <MaterialCommunityIcons name="volume-plus" size={26} color={currentColorScheme.buttonIconColor} />
            </Button>
          </View>

          {/* Speed */}
          <View style={[styles.checkboxRow, { marginTop: 6 }]}>
            <Text style={{ fontSize: 15, color: currentColorScheme.text }}>
              Speed: {audio.audioPlayerSettings.rate}x
            </Text>
          </View>
          <View style={styles.sliderControlRow}>
            <Button
              compact
              mode={Colors[colorScheme].buttonMode}
              style={{ backgroundColor: currentColorScheme.buttonBackgroundColor, minWidth: 0 }}
              onPress={() => audio.audioPlayerSettings.rate > 0.25 && updateSpeed(Math.round((audio.audioPlayerSettings.rate - 0.25) * 100) / 100)}
            >
              <MaterialCommunityIcons name="tortoise" size={26} color={currentColorScheme.buttonIconColor} />
            </Button>
            <Slider
              value={audio.audioPlayerSettings.rate}
              minimumValue={0.25}
              maximumValue={2.0}
              step={0.25}
              onValueChange={(v) => updateSpeed(Math.round(v * 100) / 100)}
              style={{ flex: 1, height: 36, marginHorizontal: 6 }}
              trackStyle={{ height: 8, backgroundColor: currentColorScheme.sliderTrackColor }}
              thumbStyle={{ height: 12, width: 12, backgroundColor: currentColorScheme.sliderThumbColor }}
            />
            <Button
              compact
              mode={Colors[colorScheme].buttonMode}
              style={{ backgroundColor: currentColorScheme.buttonBackgroundColor, minWidth: 0 }}
              onPress={() => audio.audioPlayerSettings.rate < 2.0 && updateSpeed(Math.round((audio.audioPlayerSettings.rate + 0.25) * 100) / 100)}
            >
              <MaterialCommunityIcons name="rabbit" size={26} color={currentColorScheme.buttonIconColor} />
            </Button>
          </View>
          </ScrollView>
          <Button
            mode="contained"
            onPress={toggleSearchOptionsOverlay}
            style={{ marginTop: 12 }}
          >
            Close
          </Button>
        </Overlay>
      </View>
      {suggestionVisible ? (
        <View
          style={{
            ...styles.suggestionStyle,
            backgroundColor: Colors[colorScheme].suggestionsBGColor,
          }}
        >
          <FlashList
            data={suggestions}
            renderItem={renderSuggestions}
            estimatedItemSize={27}
            keyExtractor={(item) => String(item.refIndex)}
            extraData={[suggestions, selectedSuggestionID]}
          />
        </View>
      ) : undefined}
      <View style={styles.scrollStyle}>
        <ExploreShelf
          searchBy={searchBy}
          setGettingAverageReview={setGettingAverageReview}
          setLoadingAudiobookAmount={setLoadingAudiobookAmount}
          searchBarInputSubmitted={userInputEntered}
          searchBarCurrentText={search}
          requestAudiobookAmount={infiniteBooks ? 0 : audiobookAmountRequested}
        />
      </View>
    </View>
  );
}

const windowWidth = Dimensions.get("window").width;
const windowHeight = Dimensions.get("window").height;

const styles = StyleSheet.create({
  searchStyle: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-evenly",
  },
  checkboxRow: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
  },
  sliderControlRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  suggestionStyle: {
    position: "absolute",
    top: 80,
    left: 10,
    zIndex: 1000,
    height: windowHeight - 480,
    width: windowWidth - 90,
  },
  titleOrAuthorStringFlexbox: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
  },
  scrollStyle: {
    left: 8,
    height: 525,
  },
});
