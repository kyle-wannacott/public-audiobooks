/**
 * If you are not familiar with React Navigation, refer to the "Fundamentals" guide:
 * https://reactnavigation.org/docs/getting-started
 *
 */
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import {
  NavigationContainer,
  DefaultTheme,
  DarkTheme,
} from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import * as React from "react";
import { ColorSchemeName } from "react-native";
import Colors from "../constants/Colors";
import useColorScheme from "../hooks/useColorScheme";
import { RootStackParamList, RootTabParamList } from "../types";
import LinkingConfiguration from "./LinkingConfiguration";
import { StatusBar } from "expo-status-bar";
import Audiotracks from "../screens/Audiotracks";
import History from "../screens/History";
import Bookshelf from "../screens/Bookshelf";
import Settings from "../screens/Settings";
import Explore from "../screens/Explore";
import * as NavigationBar from "expo-navigation-bar";
import { isEdgeToEdge } from "react-native-is-edge-to-edge";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { createMaterialTopTabNavigator } from "@react-navigation/material-top-tabs";
import {
  audiobookHistoryTableName,
  audiobookProgressTableName,
} from "../db/database_functions";
import authorsListJson from "../assets/resources/audiobookAuthorsList.json";
import { genreList } from "../assets/resources/audiobookGenreList";

export default function Navigation({
  colorScheme,
}: {
  colorScheme: ColorSchemeName;
}) {
  if (!isEdgeToEdge()) {
    NavigationBar.setBackgroundColorAsync(
      Colors[colorScheme ?? "dark"].statusBarBackground
    ).catch(() => {});
  }
  return (
    <NavigationContainer
      linking={LinkingConfiguration}
      theme={colorScheme === "dark" ? DarkTheme : DefaultTheme}
    >
      <RootNavigator />
      <StatusBar
        style={"auto"}
        backgroundColor={Colors[colorScheme].statusBarBackground}
        translucent={false}
      />
    </NavigationContainer>
  );
}

/**
 * A root stack navigator is often used for displaying modals on top of all other content.
 * https://reactnavigation.org/docs/modal
 */
const Stack = createNativeStackNavigator<RootStackParamList>();

function RootNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen
        name="BottomTabs"
        component={BottomTabNavigator}
        options={{
          headerShown: false,
          // statusBarHidden: true,
        }}
      />
      <Stack.Screen
        name="Audio"
        options={{
          headerShown: true,
        }}
        component={Audiotracks}
      />
    </Stack.Navigator>
  );
}

/**
 * A bottom tab navigator displays tab buttons on the bottom of the display to switch screens.
 * https://reactnavigation.org/docs/bottom-tab-navigator
 */
const BottomTab = createBottomTabNavigator<RootTabParamList>();

const ExploreTopTab = createMaterialTopTabNavigator();

function SearchTopTabs() {
  const insets = useSafeAreaInsets();
  return (
    <>
      <ExploreTopTab.Navigator
        screenOptions={{
          swipeEnabled: false,
          animationEnabled: false,
          lazy: false,
          tabBarStyle: { paddingTop: insets.top },
          tabBarIndicatorStyle: { height: 3 },
          tabBarPressOpacity: 1,
        }}
      >
        <ExploreTopTab.Screen
          initialParams={{
            searchBy: "title",
            isSearchDisabled: false,
          }}
          name="Title"
          component={Explore}
        />
        <ExploreTopTab.Screen
          initialParams={{
            searchBy: "recent",
            isSearchDisabled: true,
          }}
          name="New"
          component={Explore}
        />
        <ExploreTopTab.Screen
          initialParams={{
            searchBy: "genre",
            isSearchDisabled: false,
            genreList: genreList,
          }}
          name="Genre"
          component={Explore}
        />
        <ExploreTopTab.Screen
          initialParams={{
            searchBy: "author",
            isSearchDisabled: false,
            authorsListJSON: authorsListJson,
          }}
          name="Author"
          component={Explore}
        />
      </ExploreTopTab.Navigator>
    </>
  );
}

const BookshelfTab = createMaterialTopTabNavigator();

function BookshelfTabs() {
  const insets = useSafeAreaInsets();
  const starredQuery = `select * from ${audiobookHistoryTableName} inner join ${audiobookProgressTableName} on ${audiobookProgressTableName}.audiobook_id = ${audiobookHistoryTableName}.audiobook_id where ${audiobookProgressTableName}.audiobook_shelved=1`;

  const inProgressQuery = `select * from ${audiobookHistoryTableName} inner join ${audiobookProgressTableName} on ${audiobookProgressTableName}.audiobook_id = ${audiobookHistoryTableName}.audiobook_id where ${audiobookProgressTableName}.listening_progress_percent > 0.001 and ${audiobookProgressTableName}.listening_progress_percent <= 0.99`;

  const finishedQuery = `select * from ${audiobookHistoryTableName} inner join ${audiobookProgressTableName} on ${audiobookProgressTableName}.audiobook_id = ${audiobookHistoryTableName}.audiobook_id where ${audiobookProgressTableName}.listening_progress_percent > 0.99`;

  return (
    <BookshelfTab.Navigator screenOptions={{ swipeEnabled: false, animationEnabled: false, tabBarStyle: { paddingTop: insets.top } }}>
      <BookshelfTab.Screen
        initialParams={{ sqlQuery: starredQuery }}
        name="Starred"
        component={Bookshelf}
      />
      <BookshelfTab.Screen
        initialParams={{ sqlQuery: inProgressQuery }}
        name="In progress"
        component={Bookshelf}
      />
      <BookshelfTab.Screen
        initialParams={{ sqlQuery: finishedQuery }}
        name="Finished"
        component={Bookshelf}
      />
    </BookshelfTab.Navigator>
  );
}

function BottomTabNavigator() {
  const colorScheme = useColorScheme();

  return (
    <BottomTab.Navigator
      initialRouteName="Explore"
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          height: 110,
          backgroundColor: Colors[colorScheme].tabBackgroundColor,
        },
        tabBarItemStyle: { paddingVertical: 8 },
        tabBarIconStyle: { flex: 1 },
        tabBarLabelStyle: { fontSize: 12, marginBottom: 4 },
        tabBarIcon: ({ focused, color, size }) => {
          size = 32;
          let iconName;
          switch (route.name) {
            case "Explore":
              iconName = focused ? "book-search" : "book-search";
              break;
            case "Bookshelf":
              iconName = focused ? "bookshelf" : "bookshelf";
              break;
            case "History":
              iconName = focused ? "history" : "history";
              break;
            case "Settings":
              iconName = focused ? "account-cog" : "account-cog";
              break;
          }
          return (
            <MaterialCommunityIcons name={iconName} size={size} color={color} />
          );
        },
        tabBarActiveTintColor: Colors[colorScheme].tabIconSelected,
        tabBarInactiveTintColor: Colors[colorScheme].tabIconDefault,
      })}
    >
      <BottomTab.Screen
        name="Explore"
        component={SearchTopTabs}
        options={{
          tabBarLabel: "Explore",
        }}
      />
      <BottomTab.Screen
        name="Bookshelf"
        component={BookshelfTabs}
        options={{
          tabBarLabel: "Bookshelf",
          unmountOnBlur: false,
        }}
      />
      <BottomTab.Screen
        name="History"
        component={History}
        options={{
          tabBarLabel: "History",
          unmountOnBlur: false,
        }}
      />
      <BottomTab.Screen
        name="Settings"
        component={Settings}
        options={{
          tabBarLabel: "Settings",
        }}
      />
    </BottomTab.Navigator>
  );
}
