import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  Dimensions,
  FlatList,
  TouchableOpacity,
  StatusBar,
  Animated,
  ViewToken,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width, height } = Dimensions.get('window');

export const ONBOARDING_KEY = 'flarelap_onboarding_done';

const SLIDES = [
  {
    id: '1',
    image: require('../../assets/onboarding_1.png'),
    badge: '✨ Next Gen Editor',
    title: 'Smart Visual Suite',
    titleAccent: 'Concept to Completion',
    description:
      'One clean workspace to edit photos, generate visuals, customize templates, and create scroll-stopping graphics in minutes.',
    gradientColors: ['#D9007A', '#FF1744', '#FF6A00'] as const,
    pills: ['Photo Enhancer', 'AI Generator', 'Magic Eraser'],
  },
  {
    id: '2',
    image: require('../../assets/onboarding_2.png'),
    badge: '🚀 Innovate & Grow',
    title: 'Software & App',
    titleAccent: 'Development Services',
    description:
      'Custom software, responsive web apps, mobile development, UI/UX design, e-commerce, and digital marketing — all under one roof.',
    gradientColors: ['#1a237e', '#283593', '#00897B'] as const,
    pills: ['Web Dev', 'Mobile Apps', 'SEO & Marketing'],
  },
  {
    id: '3',
    image: require('../../assets/onboarding_3.png'),
    badge: '🏆 Ready to Build?',
    title: 'Your Next Digital',
    titleAccent: 'Solution Awaits',
    description:
      'Get in touch with our expert developers and consultants for a free project assessment. 99.9% uptime, 50+ projects delivered, 24/7 support.',
    gradientColors: ['#E65100', '#F57C00', '#FFC107'] as const,
    pills: ['99.9% Uptime', '50+ Projects', '24/7 Support'],
  },
];

type Slide = (typeof SLIDES)[number];

function OnboardingScreen({ navigation }: any) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList<Slide>>(null);
  const scrollX = useRef(new Animated.Value(0)).current;

  const viewabilityConfig = useRef({ viewAreaCoveragePercentThreshold: 50 });

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0) {
        setCurrentIndex(viewableItems[0].index ?? 0);
      }
    },
  );

  const handleFinish = async () => {
    await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
    navigation.replace('Login');
  };

  const handleNext = () => {
    if (currentIndex < SLIDES.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1, animated: true });
    } else {
      handleFinish();
    }
  };

  const handleSkip = () => {
    handleFinish();
  };

  const renderItem = ({ item }: { item: Slide }) => (
    <View style={styles.slide}>
      {/* Gradient background */}
      <LinearGradient
        colors={[...item.gradientColors]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Subtle dark overlay */}
      <View style={styles.overlayPattern} />

      {/* Illustration */}
      <View style={styles.imageContainer}>
        <Image source={item.image} style={styles.illustration} resizeMode="cover" />
        <LinearGradient
          colors={['transparent', item.gradientColors[2] + 'CC']}
          style={styles.imageBottomFade}
        />
      </View>

      {/* Content card */}
      <View style={styles.contentCard}>
        {/* Badge */}
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{item.badge}</Text>
        </View>

        {/* Title */}
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.titleAccent}>{item.titleAccent}</Text>

        {/* Description */}
        <Text style={styles.description}>{item.description}</Text>

        {/* Feature Pills */}
        <View style={styles.pillsRow}>
          {item.pills.map((pill) => (
            <View key={pill} style={styles.pill}>
              <Text style={styles.pillText}>{pill}</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar hidden />

      <Animated.FlatList
        ref={flatListRef}
        data={SLIDES}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: false },
        )}
        scrollEventThrottle={16}
        onViewableItemsChanged={onViewableItemsChanged.current}
        viewabilityConfig={viewabilityConfig.current}
      />

      {/* Bottom Controls */}
      <View style={styles.controls}>
        {/* Skip button (hidden on last slide) */}
        <TouchableOpacity onPress={handleSkip} style={styles.skipBtn}>
          {currentIndex < SLIDES.length - 1 ? (
            <Text style={styles.skipText}>Skip</Text>
          ) : (
            <View style={styles.skipBtn} />
          )}
        </TouchableOpacity>

        {/* Animated Dot Indicators */}
        <View style={styles.dots}>
          {SLIDES.map((_, idx) => {
            const inputRange = [
              (idx - 1) * width,
              idx * width,
              (idx + 1) * width,
            ];
            const dotWidth = scrollX.interpolate({
              inputRange,
              outputRange: [8, 24, 8],
              extrapolate: 'clamp',
            });
            const dotOpacity = scrollX.interpolate({
              inputRange,
              outputRange: [0.4, 1, 0.4],
              extrapolate: 'clamp',
            });
            return (
              <Animated.View
                key={idx}
                style={[styles.dot, { width: dotWidth, opacity: dotOpacity }]}
              />
            );
          })}
        </View>

        {/* Next / Get Started button */}
        <TouchableOpacity onPress={handleNext} activeOpacity={0.85}>
          <LinearGradient
            colors={['#D9007A', '#FF1744', '#FF6A00']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.nextBtn}
          >
            <Text style={styles.nextBtnText}>
              {currentIndex === SLIDES.length - 1 ? 'Get Started 🚀' : 'Next →'}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  slide: {
    width,
    height,
    flex: 1,
  },
  overlayPattern: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.08)',
  },
  imageContainer: {
    width,
    height: height * 0.52,
    overflow: 'hidden',
  },
  illustration: {
    width: '100%',
    height: '100%',
  },
  imageBottomFade: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 80,
  },
  contentCard: {
    position: 'absolute',
    bottom: 110,
    left: 0,
    right: 0,
    paddingHorizontal: 28,
    paddingTop: 24,
    paddingBottom: 10,
  },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 100,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
    paddingHorizontal: 14,
    paddingVertical: 5,
    marginBottom: 14,
  },
  badgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  title: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 30,
    fontWeight: '800',
    lineHeight: 36,
    letterSpacing: -0.5,
  },
  titleAccent: {
    color: '#fff',
    fontSize: 30,
    fontWeight: '900',
    lineHeight: 36,
    letterSpacing: -0.5,
    marginBottom: 14,
  },
  description: {
    color: 'rgba(255,255,255,0.82)',
    fontSize: 13.5,
    lineHeight: 21,
    fontWeight: '400',
    marginBottom: 18,
  },
  pillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  pill: {
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: 100,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    paddingHorizontal: 13,
    paddingVertical: 5,
  },
  pillText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
  controls: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingBottom: 36,
    paddingTop: 12,
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
  skipBtn: {
    width: 60,
    alignItems: 'flex-start',
  },
  skipText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    fontWeight: '600',
  },
  dots: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    height: 8,
    borderRadius: 4,
    backgroundColor: '#fff',
  },
  nextBtn: {
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 100,
    shadowColor: '#D9007A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45,
    shadowRadius: 10,
    elevation: 8,
  },
  nextBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
});

export default OnboardingScreen;
