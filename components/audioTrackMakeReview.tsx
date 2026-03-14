import { StyleSheet, Dimensions, TextInput, Text, View, KeyboardAvoidingView, ScrollView, Platform, Keyboard } from "react-native";
import { Overlay } from "@rneui/themed";
import { Button } from "react-native-paper";
import { Rating } from "react-native-ratings";
import { MaterialCommunityIcons, MaterialIcons } from "@expo/vector-icons";
import useColorScheme from "../hooks/useColorScheme";
import Colors from "../constants/Colors";

function MakeUserReview(props: any) {
  const colorScheme = useColorScheme();
  const currentColorScheme = Colors[colorScheme];
  const {
    reviewInformation,
    setReviewInformation,
    makeReviewOptions,
    sendReviewToAPI,
    toggleWriteReviewOverlay,
    title,
  } = props;
  return (
    <View>
      <Overlay
        isVisible={makeReviewOptions}
        onBackdropPress={toggleWriteReviewOverlay}
        fullScreen={false}
        overlayStyle={{
          backgroundColor: Colors[colorScheme].overlayBackgroundColor,
          width: windowWidth - 20,
        }}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={Platform.OS === "ios" ? 60 : 20}
        >
          <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <Text
          style={{
            marginBottom: 5,
            fontSize: 18,
            color: currentColorScheme.text,
          }}
        >
          Title: {title}
        </Text>
        <Rating
          accessibilityLabel="Tap to give audiobook a rating out of 5"
          imageSize={40}
          ratingCount={5}
          startingValue={reviewInformation?.reviewRating}
          showRating={false}
          fractions={false}
          tintColor={Colors[colorScheme].reviewsRatingTintColor}
          type="custom"
          style={{ marginBottom: 5 }}
          ratingBackgroundColor={Colors[colorScheme].reviewsRatingBGColor}
          onFinishRating={(userRating: number) => {
            setReviewInformation({
              ...reviewInformation,
              reviewRating: userRating,
            });
          }}
        />
        <Text style={{ fontSize: 18, color: currentColorScheme.text }}>
          Review Title:
        </Text>
        <TextInput
          accessibilityLabel="Write your reviews title inside this text input"
          style={[
            styles.reviewerTitleStyle,
            {
              backgroundColor: Colors[colorScheme].makeReviewTitleBG,
              borderColor: Colors[colorScheme].makeReviewTitleBorderColor,
              color: Colors[colorScheme].text,
            },
          ]}
          fontSize={18}
          ref={(reviewTitleRef) => {
            reviewTitleRef;
          }}
          value={reviewInformation?.reviewTitle}
          onChangeText={(reviewTitleRef) => {
            setReviewInformation({
              ...reviewInformation,
              reviewTitle: reviewTitleRef,
            });
          }}
          returnKeyType="next"
          blurOnSubmit={false}
        ></TextInput>
        <Text style={{ fontSize: 18, color: currentColorScheme.text }}>
          Review Text:
        </Text>

        <TextInput
          accessibilityLabel="Write your review inside this text input."
          style={[
            styles.reviewTextBodyStyle,
            {
              backgroundColor: Colors[colorScheme].makeReviewTextBodyBG,
              borderColor: Colors[colorScheme].makeReviewTextBorderColor,
              color: Colors[colorScheme].text,
            },
          ]}
          ref={(reviewTextRef) => {
            reviewTextRef;
          }}
          value={reviewInformation?.reviewText}
          multiline={true}
          textAlignVertical={"top"}
          fontSize={18}
          onChangeText={(reviewTextRef) => {
            setReviewInformation({
              ...reviewInformation,
              reviewText: reviewTextRef,
            });
          }}
          returnKeyType="done"
          blurOnSubmit={true}
          onSubmitEditing={() => Keyboard.dismiss()}
        ></TextInput>
        <View
          style={{
            display: "flex",
            flexDirection: "row",
            justifyContent: "flex-end",
            alignItems: "center",
          }}
        >
          <Text style={{ fontSize: 18, color: currentColorScheme.text }}>
            Post review:{" "}
          </Text>
          <Button
            accessibilityLabel="Posts users review for the audiobook."
            mode={Colors[colorScheme].buttonMode}
            theme={{
              colors: {
                primary: Colors[colorScheme].buttonBackgroundColor,
              },
            }}
            onPress={() => sendReviewToAPI()}
          >
            <MaterialIcons
              name="send"
              size={30}
              color={Colors[colorScheme].buttonIconColor}
            />
          </Button>
        </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </Overlay>
    </View>
  );
}

export default MakeUserReview;

const windowWidth = Dimensions.get("window").width;
const windowHeight = Dimensions.get("window").height;
const styles = StyleSheet.create({
  reviewTextBodyStyle: {
    borderWidth: 1,
    height: windowHeight / 3,
    width: windowWidth - 40,
    padding: 5,
    marginBottom: 10,
  },
  reviewerTitleStyle: {
    padding: 5,
    borderWidth: 1,
    marginBottom: 5,
    width: windowWidth - 40,
  },
});
