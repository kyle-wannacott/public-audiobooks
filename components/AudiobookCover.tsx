import { View, StyleSheet, Image, Dimensions, Pressable, Text, Modal, ScrollView, ActivityIndicator, TouchableOpacity } from "react-native";
import { ListItem, LinearProgress } from "@rneui/themed";
import React, { useState, useEffect } from "react";
import Colors from "../constants/Colors";
import useColorScheme from "../hooks/useColorScheme";
import { useNavigation } from "@react-navigation/native";
import { Button } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Review } from "../types.js";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  initialAudioBookProgressStoreDB,
  updateIfBookShelvedDB,
  isAudiobookFullyDownloaded,
  storeAsyncData,
} from "../db/database_functions";
import { useAudio } from "../hooks/AudioContext";
import * as rssParser from "react-native-rss-parser";
import { Rating } from "react-native-ratings";

export default function AudiobookCover(props) {
  const {
    item,
    index,
    db,
    addAudiobookToHistory,
    getAverageAudiobookReview,
    bookCovers,
    reviewURLS,
    resizeCoverImageWidth,
    resizeCoverImageHeight,
    audiobooksProgress,
    setAudiobooksProgress,
    displayMode = 'grid',
  } = props;
  const colorScheme = useColorScheme();
  const navigation = useNavigation();
  const audio = useAudio();
  const insets = useSafeAreaInsets();

  const [avatarOnPressEnabled, setAvatarOnPressEnabled] = useState(true);
  const [isDownloaded, setIsDownloaded] = useState(false);
  const [reviewsVisible, setReviewsVisible] = useState(false);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [infoVisible, setInfoVisible] = useState(false);
  const [description, setDescription] = useState('');
  const [loadingDescription, setLoadingDescription] = useState(false);

  useEffect(() => {
    if (item?.id && item?.num_sections) {
      isAudiobookFullyDownloaded(db, String(item.id), item.num_sections, (downloaded) => {
        setIsDownloaded(downloaded);
      });
    }
  }, [item?.id]);

  const handleQuickPlay = async () => {
    try {
      addAudiobookToHistory(index, item);
      const response = await fetch(item?.url_rss);
      const responseData = await response.text();
      const rss = await rssParser.parse(responseData);
      const trackUrls = rss.items.map((i: any) => i.enclosures[0]?.url);

      const chaptersResponse = await fetch(
        `https://librivox.org/api/feed/audiobooks/?id=${item?.id}&fields={sections}&extended=1&format=json`
      );
      const chaptersJson = await chaptersResponse.json();
      const chapters = chaptersJson?.books?.[0]?.sections || [];

      if (audio.currentBook?.audioBookId === String(item?.id) && audio.isPlaying) {
        audio.pauseAudio();
        return;
      }

      if (audio.currentBook?.audioBookId !== String(item?.id)) {
        await audio.loadBook({
          audioBookId: String(item?.id),
          urlRss: item?.url_rss,
          coverImage: bookCovers[index],
          numSections: item?.num_sections,
          title: item?.title,
          authorFirstName: item?.authors[0]?.first_name,
          authorLastName: item?.authors[0]?.last_name,
          totalTime: item?.totaltime,
          totalTimeSecs: item?.totaltimesecs,
          chapters,
          trackUrls,
        });
      }

      const savedIdx = audio.currentTrackIndex;
      const savedPos = audio.currentAudiotrackPositionsMs[savedIdx] || 0;
      await audio.loadTrack(savedIdx, savedPos);
    } catch (e) {
      console.log("Quick play error:", e);
    }
  };

  const navigateToAudio = () => {
    if (avatarOnPressEnabled) {
      addAudiobookToHistory(index, item);
      (navigation as any).navigate("Audio", {
        audioBookId: item?.id,
        urlRss: item?.url_rss,
        coverImage: bookCovers[index],
        numSections: item?.num_sections,
        urlTextSource: item?.url_text_source,
        urlZipFile: item?.url_zip_file,
        title: item?.title,
        authorFirstName: item?.authors[0]?.first_name,
        authorLastName: item?.authors[0]?.last_name,
        totalTime: item?.totaltime,
        totalTimeSecs: item?.totaltimesecs,
        copyrightYear: item?.copyright_year,
        genres: item?.genres,
        urlReview: reviewURLS[index],
        language: item?.language,
        urlProject: item?.url_project,
        urlLibrivox: item?.url_librivox,
        urlIArchive: item?.url_iarchive,
      });
    }
    setAvatarOnPressEnabled(false);
    setTimeout(() => setAvatarOnPressEnabled(true), 2000);
  };

  const toggleShelve = () => {
    const audiobook_id = item?.id;
    if (audiobooksProgress[item?.id]) {
      const isShelved = audiobooksProgress[item?.id]?.audiobook_shelved;
      updateIfBookShelvedDB(db, audiobook_id, !isShelved);
      setAudiobooksProgress((prev: any) => ({
        ...prev,
        [audiobook_id]: { ...prev[audiobook_id], audiobook_shelved: !isShelved },
      }));
      addAudiobookToHistory(index, item);
    } else {
      addAudiobookToHistory(index, item);
      let initialAudioBookSections = new Array(item?.num_sections).fill(0);
      const initAudioBookData = {
        audiobook_id: item?.id,
        audiotrack_progress_bars: JSON.stringify(initialAudioBookSections),
        current_audiotrack_positions: JSON.stringify(initialAudioBookSections),
        audiobook_shelved: true,
        audiobook_rating: undefined,
      };
      initialAudioBookProgressStoreDB(db, initAudioBookData);
      setAudiobooksProgress((prev: any) => ({ ...prev, [item?.id]: initAudioBookData }));
      getAverageAudiobookReview(index)
        ?.then((avgReview: any) => {
          if (avgReview) {
            setAudiobooksProgress((prev: any) => ({
              ...prev,
              [item?.id]: { ...(prev[item?.id] || initAudioBookData), audiobook_rating: avgReview },
            }));
          }
        })
        .catch((error: any) => console.error(error));
    }
  };

  const isCurrentBookLoaded = audio.currentBook?.audioBookId === String(item?.id);
  const isCurrentlyPlaying = isCurrentBookLoaded && audio.isPlaying;

  const formatTime = (seconds: number): string => {
    if (!seconds || isNaN(seconds) || seconds <= 0) return '0:00';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    return `${m}:${String(s).padStart(2, '0')}`;
  };

  const progressPercent = audiobooksProgress[item?.id]?.listening_progress_percent || 0;
  const totalSecs = item?.totaltimesecs || 0;
  const currentTimeSecs = progressPercent * totalSecs;
  const rating = audiobooksProgress[item?.id]?.audiobook_rating;

  const openReviews = async () => {
    const url = reviewURLS?.[index];
    if (!url) return;
    setReviewsVisible(true);
    setLoadingReviews(true);
    try {
      const res = await fetch(url);
      const json = await res.json();
      setReviews(json?.result || []);
    } catch (e) {
      setReviews([]);
    }
    setLoadingReviews(false);
  };

  const openInfo = async () => {
    setInfoVisible(true);
    if (description) return;
    setLoadingDescription(true);
    try {
      const res = await fetch(`https://librivox.org/api/feed/audiobooks/?id=${item?.id}&fields={description}&format=json`);
      const json = await res.json();
      const raw = json?.books?.[0]?.description || '';
      setDescription(raw.replace(/<[^>]+>/g, '').trim());
    } catch (e) {
      setDescription('');
    }
    setLoadingDescription(false);
  };

  if (displayMode === 'list') {
    return (
      <>
      <View
        style={[
          styles.listContainer,
          { backgroundColor: Colors[colorScheme].audiobookBackgroundColor },
          isCurrentBookLoaded && { borderTopWidth: 2, borderBottomWidth: 2, borderLeftWidth: 2, borderRightWidth: 2, borderColor: Colors[colorScheme].audiobookProgressColor },
        ]}
      >
        <Pressable style={styles.listPressable} onPress={navigateToAudio}>
          <View style={{ position: 'relative' }}>
            <Image
              source={{ uri: bookCovers[index] }}
              style={styles.listCoverImage}
            />
            <TouchableOpacity
              onPress={openInfo}
              style={{ position: 'absolute', top: 2, left: 2, zIndex: 10 }}
              hitSlop={{ top: 6, left: 6, bottom: 6, right: 6 }}
            >
              <View style={{ backgroundColor: 'rgba(0,0,0,0.55)', borderRadius: 10, width: 20, height: 20, alignItems: 'center', justifyContent: 'center' }}>
                <MaterialCommunityIcons name="information-outline" size={14} color="#fff" />
              </View>
            </TouchableOpacity>
          </View>
          <View style={styles.listInfo}>
            <Text
              numberOfLines={2}
              style={[styles.listTitle, { color: '#F9F6EE' }]}
            >
              {item?.title}
            </Text>
            <TouchableOpacity
              onPress={() => {
                const firstName = item?.authors?.[0]?.first_name?.trim() || '';
                const lastName = item?.authors?.[0]?.last_name?.trim() || '';
                const fullName = `${firstName} ${lastName}`.trim();
                storeAsyncData('userSearchAuthor', fullName);
                storeAsyncData('userInputAuthorSubmitted', lastName);
                navigation.navigate('Author' as never);
              }}
              hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
            >
              <Text
                numberOfLines={1}
                style={[styles.listAuthor, { color: '#F9F6EE', textDecorationLine: 'underline' }]}
              >
                {item?.authors[0]?.first_name} {item?.authors[0]?.last_name}
              </Text>
            </TouchableOpacity>
            <LinearProgress
              color={Colors[colorScheme].audiobookProgressColor}
              value={progressPercent}
              variant="determinate"
              trackColor={Colors[colorScheme].audiobookProgressTrackColor}
              animation={false}
              style={{ marginTop: 4 }}
            />
            <View style={styles.listTimeRow}>
              <Text style={[styles.listTimeText, { color: '#F9F6EE' }]}>
                {formatTime(currentTimeSecs)}
              </Text>
              {rating > 0 ? (
                <TouchableOpacity onPress={openReviews} activeOpacity={0.7}>
                  <View pointerEvents="none">
                    <Rating
                      imageSize={12}
                      ratingCount={5}
                      startingValue={Number(rating)}
                      showRating={false}
                      readonly={true}
                      type="star"
                      tintColor={Colors[colorScheme].audiobookBackgroundColor}
                    />
                  </View>
                </TouchableOpacity>
              ) : (
                <Text style={[styles.listTimeText, { color: '#F9F6EE', opacity: 0.5 }]}>No rating</Text>
              )}
              <Text style={[styles.listTimeText, { color: '#F9F6EE' }]}>
                {item?.totaltime}
              </Text>
            </View>
          </View>
        </Pressable>
        <View style={styles.listActions}>
          <Button mode="text" compact onPress={toggleShelve}>
            <MaterialCommunityIcons
              name={audiobooksProgress[item?.id]?.audiobook_shelved ? "star" : "star-outline"}
              size={24}
              color={Colors[colorScheme].shelveAudiobookIconColor}
            />
          </Button>
          {isDownloaded && (
            <MaterialCommunityIcons
              name="check-circle"
              size={20}
              color={Colors[colorScheme].activityIndicatorColor}
              style={{ alignSelf: 'center', marginHorizontal: 2 }}
            />
          )}
          <Button mode="text" compact onPress={handleQuickPlay}>
            <MaterialCommunityIcons
              name={isCurrentlyPlaying ? "pause-circle" : "play-circle"}
              size={28}
              color={Colors[colorScheme].activityIndicatorColor}
            />
          </Button>
        </View>
      </View>
      {/* Reviews Modal */}
      <Modal visible={reviewsVisible} transparent animationType="slide" onRequestClose={() => setReviewsVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, { backgroundColor: Colors[colorScheme].overlayBackgroundColor, paddingBottom: insets.bottom + 12 }]}>
            <Text style={[styles.modalTitle, { color: Colors[colorScheme].text }]}>Reviews</Text>
            {loadingReviews ? <ActivityIndicator /> : (
              <ScrollView>
                {reviews.length === 0 ? (
                  <Text style={{ color: Colors[colorScheme].text, textAlign: 'center', marginTop: 20 }}>No reviews found.</Text>
                ) : reviews.map((r: any, i: number) => (
                  <View key={i} style={styles.reviewItem}>
                    <Text style={[styles.reviewTitle, { color: Colors[colorScheme].text }]}>{r?.reviewtitle}</Text>
                    <Rating imageSize={16} ratingCount={5} startingValue={Number(r?.stars)} showRating={false} readonly tintColor={Colors[colorScheme].audiobookBackgroundColor} type="star" />
                    <Text style={[styles.reviewBody, { color: Colors[colorScheme].text }]}>{r?.reviewbody}</Text>
                  </View>
                ))}
              </ScrollView>
            )}
            <TouchableOpacity onPress={() => setReviewsVisible(false)} style={styles.modalCloseBtn}>
              <Text style={styles.modalCloseTxt}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      {/* Info Modal */}
      <Modal visible={infoVisible} transparent animationType="slide" onRequestClose={() => setInfoVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, { backgroundColor: Colors[colorScheme].overlayBackgroundColor, paddingBottom: insets.bottom + 12 }]}>
            <Text style={[styles.modalTitle, { color: Colors[colorScheme].text }]}>{item?.title}</Text>
            <Text style={[styles.modalSubtitle, { color: Colors[colorScheme].text }]}>{item?.authors?.[0]?.first_name} {item?.authors?.[0]?.last_name}</Text>
            <Text style={[{ color: Colors[colorScheme].text, opacity: 0.7, fontSize: 12, marginBottom: 6 }]}>{item?.totaltime} · {item?.language}</Text>
            {loadingDescription ? <ActivityIndicator /> : (
              <ScrollView style={{ maxHeight: 300 }}>
                <Text style={{ color: Colors[colorScheme].text, lineHeight: 20 }}>{description || 'No description available.'}</Text>
              </ScrollView>
            )}
            <TouchableOpacity onPress={() => setInfoVisible(false)} style={styles.modalCloseBtn}>
              <Text style={styles.modalCloseTxt}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      </>
    );
  }

  return (
    <>
    <ListItem
      topDivider
      containerStyle={{
        backgroundColor: Colors[colorScheme].colorAroundAudiobookImage,
      }}
      key={item.id}
    >
      <View
        style={[
          styles.ImageContainer,
          { backgroundColor: Colors[colorScheme].audiobookBackgroundColor },
        ]}
      >
        {/* Playing indicator — absolute overlay so it doesn't affect layout */}
        {isCurrentBookLoaded && (
          <View
            pointerEvents="none"
            style={{
              position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
              borderWidth: 2.5,
              borderColor: Colors[colorScheme].audiobookProgressColor,
              borderRadius: 2, zIndex: 5,
            }}
          />
        )}
        <Pressable
          accessibilityLabel={`${item?.title}`}
          style={({ pressed }) => [{ opacity: pressed ? 0.75 : 1.0 }]}
          onPress={navigateToAudio}
        >
          <Image
            source={{ uri: bookCovers[index] }}
            style={{
              width: resizeCoverImageWidth,
              height: resizeCoverImageHeight,
            }}
          />

          <Button
            key={item.id}
            accessibilityLabel={`Shelve audiobook: ${item.title} currently ${
              "shelved" + "not shelved"
            }`}
            mode="text"
            onPress={toggleShelve}
            style={{
              margin: 0,
              position: "absolute",
              top: 0,
              right: 0,
              width: 30,
              height: 60,
            }}
          >
            <MaterialCommunityIcons
              key={item.id}
              name={
                audiobooksProgress[item?.id]?.audiobook_shelved
                  ? "star"
                  : "star-outline"
              }
              size={30}
              color={Colors[colorScheme].shelveAudiobookIconColor}
            />
          </Button>

          {/* Download status icon */}
          {isDownloaded && (
            <View
              style={{
                position: "absolute",
                top: 50,
                right: 0,
                width: 30,
                height: 30,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <MaterialCommunityIcons
                name="check-circle"
                size={22}
                color={Colors[colorScheme].activityIndicatorColor}
              />
            </View>
          )}

          {/* Quick play button */}
          <TouchableOpacity
            onPress={handleQuickPlay}
            accessibilityLabel={isCurrentlyPlaying ? `Pause ${item.title}` : `Play ${item.title}`}
            style={{
              position: "absolute",
              bottom: 10,
              right: 2,
              width: 44,
              height: 44,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'rgba(0,0,0,0.35)',
              borderRadius: 22,
              zIndex: 6,
            }}
          >
            <MaterialCommunityIcons
              name={isCurrentlyPlaying ? "pause-circle" : "play-circle"}
              size={36}
              color={Colors[colorScheme].activityIndicatorColor}
            />
          </TouchableOpacity>

          {/* Info button */}
          <TouchableOpacity
            onPress={openInfo}
            style={{ position: 'absolute', top: 2, left: 2, zIndex: 10 }}
          >
            <View style={{ backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 12, width: 24, height: 24, alignItems: 'center', justifyContent: 'center' }}>
              <MaterialCommunityIcons name="information-outline" size={18} color="#fff" />
            </View>
          </TouchableOpacity>
        </Pressable>
        <LinearProgress
          color={Colors[colorScheme].audiobookProgressColor}
          value={audiobooksProgress[item?.id]?.listening_progress_percent}
          variant="determinate"
          trackColor={Colors[colorScheme].audiobookProgressTrackColor}
          animation={false}
        />
        {/* Tappable rating below progress bar */}
        {rating > 0 ? (
          <TouchableOpacity onPress={openReviews} activeOpacity={0.7} style={{ alignItems: 'center', paddingVertical: 2 }}>
            <View pointerEvents="none">
              <Rating
                imageSize={18}
                ratingCount={5}
                startingValue={Number(rating)}
                showRating={false}
                readonly={true}
                type="star"
                tintColor={Colors[colorScheme].audiobookBackgroundColor}
              />
            </View>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity onPress={openReviews} activeOpacity={0.7} style={{ alignItems: 'center', paddingVertical: 3 }}>
            <Text style={{ fontSize: 11, color: '#999' }}>No rating</Text>
          </TouchableOpacity>
        )}
      </View>
    </ListItem>
    {/* Reviews Modal */}
    <Modal visible={reviewsVisible} transparent animationType="slide" onRequestClose={() => setReviewsVisible(false)}>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContainer, { backgroundColor: Colors[colorScheme].overlayBackgroundColor, paddingBottom: insets.bottom + 12 }]}>
          <Text style={[styles.modalTitle, { color: Colors[colorScheme].text }]}>Reviews</Text>
          {loadingReviews ? <ActivityIndicator /> : (
            <ScrollView>
              {reviews.length === 0 ? (
                <Text style={{ color: Colors[colorScheme].text, textAlign: 'center', marginTop: 20 }}>No reviews found.</Text>
              ) : reviews.map((r: any, i: number) => (
                <View key={i} style={styles.reviewItem}>
                  <Text style={[styles.reviewTitle, { color: Colors[colorScheme].text }]}>{r?.reviewtitle}</Text>
                  <Rating imageSize={16} ratingCount={5} startingValue={Number(r?.stars)} showRating={false} readonly tintColor={Colors[colorScheme].audiobookBackgroundColor} type="star" />
                  <Text style={[styles.reviewBody, { color: Colors[colorScheme].text }]}>{r?.reviewbody}</Text>
                </View>
              ))}
            </ScrollView>
          )}
          <TouchableOpacity onPress={() => setReviewsVisible(false)} style={styles.modalCloseBtn}>
            <Text style={styles.modalCloseTxt}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
    {/* Info Modal */}
    <Modal visible={infoVisible} transparent animationType="slide" onRequestClose={() => setInfoVisible(false)}>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContainer, { backgroundColor: Colors[colorScheme].overlayBackgroundColor, paddingBottom: insets.bottom + 12 }]}>
          <Text style={[styles.modalTitle, { color: Colors[colorScheme].text }]}>{item?.title}</Text>
          <Text style={[styles.modalSubtitle, { color: Colors[colorScheme].text }]}>{item?.authors?.[0]?.first_name} {item?.authors?.[0]?.last_name}</Text>
          <Text style={[{ color: Colors[colorScheme].text, opacity: 0.7, fontSize: 12, marginBottom: 6 }]}>{item?.totaltime} · {item?.language}</Text>
          {loadingDescription ? <ActivityIndicator /> : (
            <ScrollView style={{ maxHeight: 300 }}>
              <Text style={{ color: Colors[colorScheme].text, lineHeight: 20 }}>{description || 'No description available.'}</Text>
            </ScrollView>
          )}
          <TouchableOpacity onPress={() => setInfoVisible(false)} style={styles.modalCloseBtn}>
            <Text style={styles.modalCloseTxt}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
    </>
  );
}

const windowWidth = Dimensions.get("window").width;
const windowHeight = Dimensions.get("window").height;

const styles = StyleSheet.create({
  ImageContainer: {
    flexDirection: "column",
    width: windowWidth / 2 - 40,
    borderStyle: "solid",
    borderWidth: 1,
    borderRadius: 2,
  },
  audiobookContainer: {
    marginTop: 2,
    borderRadius: 2,
  },
  ActivityIndicatorStyle: {
    top: windowHeight / 2 - 90,
  },
  listContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(128,128,128,0.5)",
  },
  listPressable: {
    flexDirection: "row",
    flex: 1,
    alignItems: "center",
  },
  listCoverImage: {
    width: 64,
    height: 64,
    borderRadius: 4,
    marginRight: 10,
  },
  listInfo: {
    flex: 1,
  },
  listTitle: {
    fontSize: 13,
    fontWeight: "bold",
    marginBottom: 2,
  },
  listAuthor: {
    fontSize: 11,
    marginBottom: 2,
  },
  listDuration: {
    fontSize: 10,
    opacity: 0.7,
    marginTop: 2,
  },
  listTimeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 2,
  },
  listTimeText: {
    fontSize: 10,
    opacity: 0.8,
  },
  listRatingText: {
    fontSize: 10,
    opacity: 0.9,
  },
  listActions: {
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    paddingLeft: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 16,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 14,
    opacity: 0.8,
    marginBottom: 4,
  },
  reviewItem: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(128,128,128,0.3)',
  },
  reviewTitle: {
    fontWeight: 'bold',
    fontSize: 13,
    marginBottom: 4,
  },
  reviewBody: {
    fontSize: 12,
    lineHeight: 18,
    marginTop: 6,
    opacity: 0.85,
  },
  modalCloseBtn: {
    marginTop: 14,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: 'rgba(128,128,128,0.2)',
    borderRadius: 8,
  },
  modalCloseTxt: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
  },
});
