import React from "react";
import { useState } from "react";
import { useNavigation } from "@react-navigation/native";
import { ListItem, LinearProgress } from "@rneui/themed";
import { Rating } from "react-native-ratings";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import useColorScheme from "../hooks/useColorScheme";
import Colors from "../constants/Colors";
import { Button } from "react-native-paper";

import {
  FlatList,
  Dimensions,
  Image,
  Pressable,
  StyleSheet,
  View,
} from "react-native";
import AudiobookAccordionList from "../components/audiobookAccordionList";
import PickerForHistoryAndBookShelf from "../components/PickerForHistoryAndBookShelf";

import { openDatabase, roundNumberTwoDecimal } from "../db/utils";
import {
  audiobookProgressTableName,
  getAsyncData,
  storeAsyncData,
  updateIfBookShelvedDB,
} from "../db/database_functions";
import AudiobookCover from "./AudiobookCoverHistoryAndBookshelf";

const db = openDatabase();

export default function BookShelfAndHistoryShelf(props: any) {
  const colorScheme = useColorScheme();
  const [audiobooksProgress, setAudiobooksProgress] = useState({});
  const [avatarOnPressEnabled, setAvatarOnPressEnabled] = useState(true);

  const [pickerAndQueryState, setPickerAndQueryState] = useState<any>({
    toggle: 0,
    order: "ASC",
    orderBy: "order by id",
    icon: "sort-ascending",
    pickerIndex: 0,
  });

  function toggleAscOrDescSort() {
    if (pickerAndQueryState.toggle == 0) {
      setPickerAndQueryState({
        ...pickerAndQueryState,
        toggle: 1,
        order: "DESC",
        icon: "sort-descending",
      });
      props.getShelvedBooks({
        ...pickerAndQueryState,
        toggle: 1,
        order: "DESC",
        icon: "sort-descending",
      });
      storeAsyncData(props.asyncDataKeyName, {
        ...pickerAndQueryState,
        toggle: 1,
        order: "DESC",
        icon: "sort-descending",
      });
    } else {
      setPickerAndQueryState({
        ...pickerAndQueryState,
        toggle: 0,
        order: "ASC",
        icon: "sort-ascending",
      });
      props.getShelvedBooks({
        ...pickerAndQueryState,
        toggle: 0,
        order: "ASC",
        icon: "sort-ascending",
      });
      storeAsyncData(props.asyncDataKeyName, {
        ...pickerAndQueryState,
        toggle: 0,
        order: "ASC",
        icon: "sort-ascending",
      });
    }
  }

  const keyExtractor = (item, index) => item.audiobook_id.toString();
  const windowWidth = Dimensions.get("window").width;
  const windowHeight = Dimensions.get("window").height;
  const navigation = useNavigation();
  const resizeCoverImageHeight = windowHeight / 5;
  const resizeCoverImageWidth = windowWidth / 2 - 42;

  function selectAccordionPickerTitle(pickerIndex, item) {
    switch (pickerIndex) {
      case 0:
        return item?.id + ". " + item?.audiobook_title;
      case 1:
        return item?.audiobook_title;
      case 2:
        return audiobooksProgress[item?.audiobook_id]?.audiobook_rating;
      case 3:
        return (
          roundNumberTwoDecimal(
            audiobooksProgress[item?.audiobook_id]?.listening_progress_percent *
              100
          ) + "%"
        );
      case 4:
        return item?.audiobook_author_first_name;
      case 5:
        return item?.audiobook_author_last_name;
      case 6:
        return item?.audiobook_total_time;
      case 7:
        return item?.audiobook_language;
      case 8:
        return JSON.parse(item?.audiobook_genres)[0]?.name;
      case 9:
        return item?.audiobook_copyright_year;
    }
  }

  const renderItem = ({ item, index }: any) => (
    <View>
      <AudiobookCover
        item={item}
        index={index}
        db={db}
        audiobooksProgress={audiobooksProgress}
        setAudiobooksProgress={setAudiobooksProgress}
        resizeCoverImageWidth={resizeCoverImageWidth}
        resizeCoverImageHeight={resizeCoverImageHeight}
        windowWidth={windowWidth}
        windowHeight={windowHeight}
      />
      {audiobooksProgress[item.audiobook_id]?.audiobook_id ==
        item.audiobook_id &&
      audiobooksProgress[item.audiobook_id]?.audiobook_rating > 0 ? (
        <Rating
          showRating={false}
          imageSize={20}
          ratingCount={5}
          startingValue={
            audiobooksProgress[item.audiobook_id]?.audiobook_rating
          }
          readonly={true}
          tintColor={Colors[colorScheme].ratingBackgroundColor}
        />
      ) : undefined}
      <AudiobookAccordionList
        accordionTitle={selectAccordionPickerTitle(
          pickerAndQueryState.pickerIndex,
          item
        )}
        audiobookTitle={item?.audiobook_title}
        audiobookAuthorFirstName={item?.audiobook_author_first_name}
        audiobookAuthorLastName={item?.audiobook_author_last_name}
        audiobookTotalTime={item?.audiobook_total_time}
        audiobookCopyrightYear={item?.audiobook_copyright_year}
        audiobookGenres={item?.audiobook_genres}
        audiobookLanguage={item?.audiobook_language}
      />
    </View>
  );

  React.useEffect(() => {
    const unsubscribe = navigation.addListener("focus", () => {
      try {
        db.transaction((tx) => {
          tx.executeSql(
            `select * from ${audiobookProgressTableName}`,
            [],
            (_, { rows }) => {
              const audioProgressData = {};
              rows._array.forEach((row) => {
                return (audioProgressData[row.audiobook_id] = row);
              });
              // console.log(audioProgressData);
              setAudiobooksProgress(audioProgressData);
            }
          );
        }, null);

        getAsyncData(props.asyncDataKeyName).then(
          (pickerAndQueryDataRetrieved) => {
            if (pickerAndQueryDataRetrieved) {
              props.getShelvedBooks(pickerAndQueryDataRetrieved);
              return setPickerAndQueryState(pickerAndQueryDataRetrieved);
            } else {
              props.getShelvedBooks(pickerAndQueryState);
            }
          }
        );
      } catch (err) {
        console.log(err);
      }
    });

    // Return the function to unsubscribe from the event so it gets removed on unmount
    return unsubscribe;
  }, [navigation]);

  if (!props.loadingHistory) {
    return (
      <View>
        <PickerForHistoryAndBookShelf
          pickerAndQueryState={pickerAndQueryState}
          setPickerAndQueryState={setPickerAndQueryState}
          getShelvedBooks={props.getShelvedBooks}
          toggleAscOrDescSort={toggleAscOrDescSort}
          storeAsyncData={storeAsyncData}
          asyncDataKeyName={props.asyncDataKeyName}
        />
        <View
          style={[
            styles.flatListStyle,
            {
              backgroundColor: Colors[colorScheme].background,
              height: windowHeight - props.shelfHeightOffset,
            },
          ]}
        >
          <FlatList
            data={props.audiobookHistory}
            keyExtractor={keyExtractor}
            renderItem={renderItem}
            numColumns={2}
            removeClippedSubviews={true}
            maxToRenderPerBatch={6}
            initialNumToRender={6}
            windowSize={10}
          />
        </View>
      </View>
    );
  } else {
    return (
      <View>
        <PickerForHistoryAndBookShelf
          pickerAndQueryState={pickerAndQueryState}
          setPickerAndQueryState={setPickerAndQueryState}
          getShelvedBooks={props.getShelvedBooks}
          toggleAscOrDescSort={toggleAscOrDescSort}
          storeAsyncData={storeAsyncData}
          asyncDataKeyName={props.asyncDataKeyName}
        />
      </View>
    );
  }
}

const windowWidth = Dimensions.get("window").width;
const windowHeight = Dimensions.get("window").height;
// const flatlistHeight = windowHeight - 200;
const ImageContainerWidth = windowWidth / 2 - 40;

const styles = StyleSheet.create({
  ImageContainer: {
    flexDirection: "column",
    width: ImageContainerWidth,
    borderStyle: "solid",
    borderWidth: 1,
    borderRadius: 2,
  },
  flatListStyle: {
    padding: 10,
    paddingTop: 2,
    paddingBottom: 0,
  },
  ActivityIndicatorStyle: {
    top: windowHeight / 3,
  },
});
