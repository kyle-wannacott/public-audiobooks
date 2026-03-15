import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  FlatList,
  Pressable,
  Alert,
  Dimensions,
  ActivityIndicator,
} from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Button } from "react-native-paper";
import { LinearProgress } from "@rneui/themed";
import useColorScheme from "../hooks/useColorScheme";
import Colors from "../constants/Colors";
import { openDatabase } from "../db/utils";
import { getFullyDownloadedAudiobooks } from "../db/database_functions";
import { deleteAudiobookFiles } from "../db/downloadService";
import { useAudio } from "../hooks/AudioContext";
import * as rssParser from "react-native-rss-parser";
import { useTranslation } from "react-i18next";

const db = openDatabase();
const { width: windowWidth } = Dimensions.get("window");

export default function Downloads() {
  const colorScheme = useColorScheme();
  const navigation = useNavigation();
  const audio = useAudio();
  const { t } = useTranslation();
  const [downloadedBooks, setDownloadedBooks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadDownloads = useCallback(() => {
    setLoading(true);
    getFullyDownloadedAudiobooks(db, (books) => {
      setDownloadedBooks(books);
      setLoading(false);
    });
  }, []);

  useFocusEffect(loadDownloads);

  const handleDelete = (item: any) => {
    Alert.alert(
      t('delete_download'),
      `"${item.audiobook_title}" — ${t('confirm_delete_msg')}`,
      [
        { text: t('cancel'), style: "cancel" },
        {
          text: t('delete'),
          style: "destructive",
          onPress: async () => {
            await deleteAudiobookFiles(item.audiobook_id);
            loadDownloads();
          },
        },
      ]
    );
  };

  const handlePlay = async (item: any) => {
    try {
      // Fetch RSS to get track URLs and chapter info
      const response = await fetch(item.audiobook_rss_url);
      const responseData = await response.text();
      const rss = await rssParser.parse(responseData);
      const trackUrls = rss.items.map((i: any) => i.enclosures[0]?.url);

      const chaptersResponse = await fetch(
        `https://librivox.org/api/feed/audiobooks/?id=${item.audiobook_id}&fields={sections}&extended=1&format=json`
      );
      const chaptersJson = await chaptersResponse.json();
      const chapters = chaptersJson?.books?.[0]?.sections || [];

      await audio.loadBook({
        audioBookId: item.audiobook_id,
        urlRss: item.audiobook_rss_url,
        coverImage: item.audiobook_image,
        numSections: item.audiobook_num_sections,
        title: item.audiobook_title,
        authorFirstName: item.audiobook_author_first_name,
        authorLastName: item.audiobook_author_last_name,
        totalTime: item.audiobook_total_time,
        totalTimeSecs: item.audiobook_total_time_secs,
        chapters,
        trackUrls,
      });

      const savedIndex = item.current_audiotrack_index || 0;
      const savedPositions = item.current_audiotrack_positions
        ? JSON.parse(item.current_audiotrack_positions)
        : [];
      await audio.loadTrack(savedIndex, savedPositions[savedIndex] || 0);
    } catch (e) {
      console.log("Error playing downloaded book:", e);
    }
  };

  const renderItem = ({ item }: any) => (
    <View
      style={[
        styles.bookRow,
        { backgroundColor: Colors[colorScheme].audiobookBackgroundColor },
      ]}
    >
      <Pressable
        style={styles.bookPressable}
        onPress={() => {
          (navigation as any).navigate("Audio", {
            audioBookId: item.audiobook_id,
            urlRss: item.audiobook_rss_url,
            coverImage: item.audiobook_image,
            title: item.audiobook_title,
            authorFirstName: item.audiobook_author_first_name,
            authorLastName: item.audiobook_author_last_name,
            totalTime: item.audiobook_total_time,
            totalTimeSecs: item.audiobook_total_time_secs,
            copyrightYear: item.audiobook_copyright_year,
            genres: item.audiobook_genres ? JSON.parse(item.audiobook_genres) : [],
            language: item.audiobook_language,
            urlReview: item.audiobook_review_url,
            numSections: item.audiobook_num_sections,
            urlTextSource: item.audiobook_ebook_url,
            urlZipFile: item.audiobook_zip,
            urlProject: item.audiobook_project_url,
            urlLibrivox: item.audiobook_librivox_url,
            urlIArchive: item.audiobook_iarchive_url,
          });
        }}
      >
        <Image
          source={{ uri: item.audiobook_image }}
          style={styles.coverImage}
        />
        <View style={styles.bookInfo}>
          <Text
            numberOfLines={2}
            style={[styles.titleText, { color: Colors[colorScheme].text }]}
          >
            {item.audiobook_title}
          </Text>
          <Text
            numberOfLines={1}
            style={[styles.authorText, { color: Colors[colorScheme].text }]}
          >
            {item.audiobook_author_first_name} {item.audiobook_author_last_name}
          </Text>
          <LinearProgress
            color={Colors[colorScheme].audiobookProgressColor}
            value={item.listening_progress_percent || 0}
            variant="determinate"
            trackColor={Colors[colorScheme].audiobookProgressTrackColor}
            animation={false}
            style={styles.progressBar}
          />
          <Text style={[styles.durationText, { color: Colors[colorScheme].text }]}>
            {item.audiobook_total_time}
          </Text>
        </View>
      </Pressable>
      <View style={styles.actionButtons}>
        <Button
          mode="text"
          compact
          onPress={() => handlePlay(item)}
          accessibilityLabel={`Play ${item.audiobook_title}`}
        >
          <MaterialCommunityIcons
            name="play-circle"
            size={28}
            color={Colors[colorScheme].activityIndicatorColor}
          />
        </Button>
        <Button
          mode="text"
          compact
          onPress={() => handleDelete(item)}
          accessibilityLabel={`Delete ${item.audiobook_title}`}
        >
          <MaterialCommunityIcons
            name="delete"
            size={28}
            color="#dc322f"
          />
        </Button>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: Colors[colorScheme].audiotracksBGColor }]}>
        <ActivityIndicator
          size="large"
          color={Colors[colorScheme].activityIndicatorColor}
        />
      </View>
    );
  }

  if (downloadedBooks.length === 0) {
    return (
      <View style={[styles.centered, { backgroundColor: Colors[colorScheme].audiotracksBGColor }]}>
        <MaterialCommunityIcons
          name="download-off"
          size={64}
          color={Colors[colorScheme].tabIconDefault}
        />
        <Text style={[styles.emptyText, { color: Colors[colorScheme].text }]}>
          {t('no_downloaded_audiobooks')}
        </Text>
        <Text style={[styles.emptySubtext, { color: Colors[colorScheme].tabIconDefault }]}>
          {t('download_offline_hint')}
        </Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: Colors[colorScheme].audiotracksBGColor }}>
      <FlatList
        data={downloadedBooks}
        renderItem={renderItem}
        keyExtractor={(item) => item.audiobook_id}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    marginTop: 8,
    textAlign: "center",
  },
  listContent: {
    padding: 8,
  },
  bookRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    marginBottom: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(128,128,128,0.2)",
  },
  bookPressable: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  coverImage: {
    width: 60,
    height: 80,
    borderRadius: 4,
    marginRight: 12,
  },
  bookInfo: {
    flex: 1,
  },
  titleText: {
    fontSize: 14,
    fontWeight: "bold",
  },
  authorText: {
    fontSize: 12,
    marginTop: 2,
  },
  progressBar: {
    marginTop: 6,
    borderRadius: 2,
  },
  durationText: {
    fontSize: 11,
    marginTop: 4,
  },
  actionButtons: {
    alignItems: "center",
    justifyContent: "center",
  },
});
