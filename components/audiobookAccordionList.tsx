import React from "react";
import { StyleSheet, Dimensions, Text, TouchableOpacity } from "react-native";
import { List, Divider } from "react-native-paper";
import { ListItem } from "@rneui/themed";
import MaterialIconCommunity from "react-native-vector-icons/MaterialCommunityIcons.js";
import useColorScheme from "../hooks/useColorScheme";
import Colors from "../constants/Colors";
import { useNavigation } from "@react-navigation/native";
import { storeAsyncData } from "../db/database_functions";

function AudiobookAccordionList(props: any) {
  const colorScheme = useColorScheme();
  const currentColorScheme = Colors[colorScheme];
  const navigation = useNavigation<any>();

  const handleAuthorPress = () => {
    const fullName = `${props.audiobookAuthorFirstName || ''} ${props.audiobookAuthorLastName || ''}`.trim();
    const lastName = (props.audiobookAuthorLastName || '').trim();
    storeAsyncData('userSearchAuthor', fullName);
    storeAsyncData('userInputAuthorSubmitted', lastName);
    navigation.navigate('Author');
  };

  const handleGenrePress = (genreName: string) => {
    storeAsyncData('userSearchGenre', genreName);
    navigation.navigate('Genre');
  };
  return (
    <List.Accordion
      titleStyle={[
        styles.accordionTitleStyle,
        { color: currentColorScheme.listAccordionTextColor },
        { backgroundColor: currentColorScheme.listAccordionTextHighlightColor },
      ]}
      title={props.accordionTitle}
      style={[
        styles.accordionStyle,
        { backgroundColor: currentColorScheme.listAccordionDropdownBGColor },
      ]}
      titleNumberOfLines={1}
      accessibilityLabel={`${props.accordionTitle}`}
      theme={{
        colors: { text: currentColorScheme.listAccordionDropdownIconColor },
      }}
    >
      <List.Section
        style={[
          styles.accordianItemsStyle,
          { color: currentColorScheme.accordionItemsTextColor },
          { backgroundColor: currentColorScheme.accordionItemsBGColor },
        ]}
      >
        <ListItem.Subtitle
          style={[
            styles.accordianItemsStyle,
            { color: currentColorScheme.accordionItemsTextColor },
            { backgroundColor: currentColorScheme.accordionItemsBGColor },
          ]}
        >
          <MaterialIconCommunity
            name="format-title"
            size={20}
          ></MaterialIconCommunity>
          {": "}
          {props.audiobookTitle}
        </ListItem.Subtitle>
        <Divider />

        <TouchableOpacity onPress={handleAuthorPress} activeOpacity={0.7}>
          <ListItem.Subtitle
            style={[
              styles.accordianItemsStyle,
              { color: currentColorScheme.accordionItemsTextColor },
              { backgroundColor: currentColorScheme.accordionItemsBGColor },
            ]}
          >
            <MaterialIconCommunity
              name="feather"
              size={20}
            ></MaterialIconCommunity>
            {": "}
            <Text style={{ textDecorationLine: 'underline' }}>
              {props.audiobookAuthorFirstName} {props.audiobookAuthorLastName}
            </Text>
          </ListItem.Subtitle>
        </TouchableOpacity>
        <Divider />

        <ListItem.Subtitle
          style={[
            styles.accordianItemsStyle,
            { color: currentColorScheme.accordionItemsTextColor },
            { backgroundColor: currentColorScheme.accordionItemsBGColor },
          ]}
        >
          <MaterialIconCommunity
            name="timer-sand"
            size={20}
          ></MaterialIconCommunity>
          {": "}
          {props.audiobookTotalTime}
        </ListItem.Subtitle>
        <Divider />
        <ListItem.Subtitle
          style={[
            styles.accordianItemsStyle,
            { color: currentColorScheme.accordionItemsTextColor },
            { backgroundColor: currentColorScheme.accordionItemsBGColor },
          ]}
        >
          <MaterialIconCommunity
            name="account-voice"
            size={20}
          ></MaterialIconCommunity>
          {": "}
          {props.audiobookLanguage}
        </ListItem.Subtitle>
        <Divider />
        <TouchableOpacity
          onPress={() => {
            const genres = JSON.parse(props?.audiobookGenres);
            if (genres?.length > 0) handleGenrePress(genres[0]?.name || '');
          }}
          activeOpacity={0.7}
        >
          <ListItem.Subtitle
            style={[
              styles.accordianItemsStyle,
              { color: currentColorScheme.accordionItemsTextColor },
              { backgroundColor: currentColorScheme.accordionItemsBGColor },
            ]}
          >
            <MaterialIconCommunity
              name="guy-fawkes-mask"
              size={20}
            ></MaterialIconCommunity>
            {": "}
            <Text style={{ textDecorationLine: 'underline' }}>
              {JSON.parse(props?.audiobookGenres).map((genre: any) => {
                return `${genre?.name} `;
              })}
            </Text>
          </ListItem.Subtitle>
        </TouchableOpacity>
        <Divider />
        <ListItem.Subtitle
          style={[
            styles.accordianItemsStyle,
            { color: currentColorScheme.accordionItemsTextColor },
            { backgroundColor: currentColorScheme.accordionItemsBGColor },
          ]}
        >
          <MaterialIconCommunity
            name="copyright"
            size={20}
          ></MaterialIconCommunity>
          {": "}
          {props.audiobookCopyrightYear}
        </ListItem.Subtitle>
      </List.Section>
    </List.Accordion>
  );
}

export default AudiobookAccordionList;

const windowWidth = Dimensions.get("window").width;
const accordionTitleWidth = windowWidth / 2 - 8 - 60;
const accordionStyleWidth = windowWidth / 2 - 8;

const styles = StyleSheet.create({
  accordionStyle: {
    flex: 1,
    width: accordionStyleWidth,
    justifyContent: "center",
    height: 60,
  },
  accordionTitleStyle: {
    width: accordionTitleWidth,
    flex: 1,
    height: 80,
  },
  accordianItemsStyle: {
    width: windowWidth / 2 - 15,
  },
});
