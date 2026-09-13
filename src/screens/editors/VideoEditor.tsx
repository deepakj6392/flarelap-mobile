import React, {
  useState,
  useRef,
  useCallback,
  useEffect,
  useMemo,
} from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  PanResponder,
  Text as RNText,
  Image as RNImage,
  TouchableOpacity,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  PermissionsAndroid,
  StatusBar,
  Modal,
  ActivityIndicator,
  TextInput as RNTextInput,
} from 'react-native';
import { Title, Button, Text } from 'react-native-paper';
import Share from 'react-native-share';
import Video from 'react-native-video';
import { launchImageLibrary, launchCamera } from 'react-native-image-picker';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import api from '../../services/api.service';
import { VIDEOS_TEMPLATES } from '../../constants';

import CustomizeVideoIcon from '../../assets/icons/social/thumbnail_customize_video.svg';
import InstagramStoryIcon from '../../assets/icons/social/thumbnail_instagram_story.svg';
import YouTubeIntroIcon from '../../assets/icons/social/thumbnail_youtube_intro.svg';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Template } from '../../../types/template';
import { Camera, useCameraDevice, useVideoOutput, useCameraPermission, useMicrophonePermission } from 'react-native-vision-camera';

// ─── Dimensions ────────────────────────────────────────────────────────────────
const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const PREVIEW_W = screenWidth - 32;
const PREVIEW_H = (PREVIEW_W * 9) / 16;

// ─── Stock / Preset Data ───────────────────────────────────────────────────────
const PRESET_MUSIC = [
  { id: 'upbeat', name: 'Upbeat Pop', duration: '0:32', emoji: '🎵' },
  { id: 'cinematic', name: 'Cinematic', duration: '0:45', emoji: '🎬' },
  { id: 'lofi', name: 'Lo-fi Chill', duration: '0:58', emoji: '🌙' },
  { id: 'energetic', name: 'Energetic Beat', duration: '0:28', emoji: '⚡' },
  { id: 'acoustic', name: 'Acoustic Strum', duration: '0:41', emoji: '🎸' },
  { id: 'ambient', name: 'Soft Ambient', duration: '1:02', emoji: '🌊' },
  { id: 'hiphop', name: 'Hip-Hop Groove', duration: '0:35', emoji: '🎤' },
  { id: 'none', name: 'No Music', duration: '—', emoji: '🔇' },
];

const FILTER_PRESETS = [
  { id: 'none', name: 'Original', color: '#475569' },
  { id: 'vintage', name: 'Vintage', color: '#92400E' },
  { id: 'cinematic', name: 'Cinematic', color: '#1E3A5F' },
  { id: 'warm', name: 'Warm', color: '#B45309' },
  { id: 'cool', name: 'Cool', color: '#1D4ED8' },
  { id: 'noir', name: 'Noir', color: '#1F2937' },
  { id: 'vivid', name: 'Vivid', color: '#7C3AED' },
  { id: 'fade', name: 'Fade', color: '#6B7280' },
];

const PRESET_COLORS = [
  '#FFFFFF', '#000000', '#EF4444', '#F97316',
  '#F59E0B', '#10B981', '#06B6D4', '#3B82F6',
  '#6366F1', '#8B5CF6', '#EC4899', '#F43F5E',
];

const VIDEO_SOCIAL_SUBCATS = [
  { id: 'customize', title: 'Customize Video', icon: <CustomizeVideoIcon width={150} height={150} />, size: '322 x 572' },
  { id: 'instagram_story', title: 'Instagram Story', icon: <InstagramStoryIcon width={150} height={150} />, size: '1080 x 1920' },
  { id: 'facebook_story', title: 'Facebook Story', icon: <InstagramStoryIcon width={150} height={150} />, size: '1080 x 1920' },
  { id: 'youtube_shorts', title: 'YouTube Shorts', icon: <InstagramStoryIcon width={150} height={150} />, size: '1080 x 1920' },
  { id: 'youtube_intro', title: 'YouTube Intro', icon: <YouTubeIntroIcon width={150} height={150} />, size: '1080 x 1080' },
  { id: 'tiktok_video', title: 'TikTok Video', icon: <InstagramStoryIcon width={150} height={150} />, size: '1080 x 1920' },
];

const SPEED_OPTIONS = [
  { label: '0.5×', value: 0.5 },
  { label: '0.75×', value: 0.75 },
  { label: '1×', value: 1.0 },
  { label: '1.5×', value: 1.5 },
  { label: '2×', value: 2.0 },
];

// ─── Types ─────────────────────────────────────────────────────────────────────
type OverlayType = 'text' | 'image' | 'emoji';

const getTwemojiUrl = (emoji: string) => {
  const codePoints = Array.from(emoji)
    .map(char => char.codePointAt(0)!.toString(16))
    .filter(cp => cp !== 'fe0f');
  return `https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/${codePoints.join('-')}.png`;
};

const EMOJI_ST_CATEGORIES = [
  {
    title: 'Smileys & Emotion',
    emojis: ['😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚', '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🥸', '🤩', '🥳', '😏', '😒', '😞', '😔', '😟', '😕', '🙁', '☹️', '😣', '😖', '😫', '😩', '🥺', '😢', '😭', '😤', '😠', '😡', '🤬', '🤯', '😳', '🥵', '🥶', '😱', '😨', '😰', '😥', '😓', '🤗', '🤔', '🫣', '🤭', '🥱', '🤫', '🤥', '😶', '😐', '😑', '😬', '🫨', '🫠', '🙄', '😯', '😦', '😧', '😮', '😲', '😴', '🤤', '😪', '😵', '🤐', '🥴', '🤢', '🤮', '🤧', '😷', '🤒', '🤕']
  },
  {
    title: 'Love & Gestures',
    emojis: ['👋', '🤚', '🖐️', '✋', '🖖', '👌', '🤌', '🤏', '✌️', '🤞', '🫰', '🤟', '🤘', '🤙', '👈', '👉', '👆', '🖕', '👇', '☝️', '👍', '👎', '✊', '👊', '🤛', '🤜', '👏', '🙌', '🫶', '👐', '🤲', '🤝', '🙏', '✍️', '💅', '🤳', '💪', '🦾', '🫵', '❤️', '🩷', '🧡', '💛', '💚', '💙', '🩵', '💜', '🤎', '🖤', '🩶', '🤍', '💔', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟']
  },
  {
    title: 'Premium Stickers',
    emojis: ['🔥', '✨', '🌟', '⭐', '⚡', '💥', '🌈', '☀️', '🌤️', '⛅', '🌥️', '☁️', '🌦️', '🌧️', '⛈️', '🌩️', '❄️', '☃️', '⛄', '🌬️', '💨', '🌪️', '🌫️', '🌊', '💧', '💦', '🫧']
  },
  {
    title: 'Objects & Fun',
    emojis: ['🎉', '🎊', '🎈', '🎁', '🎂', '🎄', '🎆', '🎇', '🧨', '🧿', '🪄', '🔮', '🧸', '🎮', '🕹️', '🎨', '🎬', '🎤', '🎧', '🎼', '🎵', '🎶', '🎺', '🎸', '🎹', '🎻', '🥁', '📱', '💻', '📷', '📹', '📽️', '💡', '🔦', '🕯️', '💵', '💎', '🔑', '🔒', '🍕', '🍔', '🍟', '🌭', '🍿', '🍩', '🍪', '🍫', '🍬', '🍦', '🍨', '🍧', '🍰', '☕', '🥤', '🍺', '🍻', '🍷', '🍹']
  }
];

interface Overlay {
  id: string;
  type: OverlayType;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  // text
  text?: string;
  fontSize?: number;
  color?: string;
  bold?: boolean;
  // image
  uri?: string;
  borderRadius?: number;
  opacity?: number;
  // timing
  startTime: number;
  endTime: number;
}

interface MusicTrack {
  id: string;
  name: string;
  uri: string;
  startTime: number;
  endTime: number;
  volume: number;
  fileObj?: {
    uri: string;
    name: string;
    type: string;
  };
}

interface MergeClip {
  id: string;
  name: string;
  uri: string;
  position: 'start' | 'end';
  order: number;
}

// ─── SVG Icons ─────────────────────────────────────────────────────────────────
const Icon = {
  Close: ({ size = 20, color = '#F8FAFC' }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <Path d="M18 6L6 18M6 6l12 12" />
    </Svg>
  ),
  Back: ({ size = 20, color = '#F8FAFC' }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <Path d="M19 12H5M12 19l-7-7 7-7" />
    </Svg>
  ),
  Check: ({ size = 20, color = '#F8FAFC' }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <Path d="M20 6L9 17l-5-5" />
    </Svg>
  ),
  Undo: ({ size = 20, color = '#F8FAFC' }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <Path d="M3 7v6h6M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13" />
    </Svg>
  ),
  Redo: ({ size = 20, color = '#F8FAFC' }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <Path d="M21 7v6h-6M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3l3 2.7" />
    </Svg>
  ),
  Play: ({ size = 28, color = '#F8FAFC' }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={color} stroke={color} strokeWidth="0">
      <Path d="M5 3l14 9-14 9V3z" />
    </Svg>
  ),
  Pause: ({ size = 28, color = '#F8FAFC' }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={color} stroke={color} strokeWidth="0">
      <Path d="M6 19h4V5H6v14zM14 5v14h4V5h-4z" />
    </Svg>
  ),
  Volume: ({ size = 20, color = '#F8FAFC' }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <Path d="M11 5L6 9H2v6h4l5 4V5zM19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
    </Svg>
  ),
  Mute: ({ size = 20, color = '#F8FAFC' }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <Path d="M11 5L6 9H2v6h4l5 4V5zM23 9l-6 6M17 9l6 6" />
    </Svg>
  ),
  Rotate: ({ size = 16, color = '#F8FAFC' }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <Path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38" />
    </Svg>
  ),
  Video: ({ size = 20, color = '#94A3B8' }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <Path d="M22.54 6.42a2.78 2.78 0 0 0-1.95-1.97C18.88 4 12 4 12 4s-6.88 0-8.59.46a2.78 2.78 0 0 0-1.95 1.97A29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58A2.78 2.78 0 0 0 3.41 19.6C5.12 20 12 20 12 20s6.88 0 8.59-.46a2.78 2.78 0 0 0 1.95-1.96A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58z" />
      <Path d="M9.75 15.02l5.75-3.02-5.75-3.02v6.04z" fill={color} stroke="none" />
    </Svg>
  ),
  Camera: ({ size = 20, color = '#94A3B8' }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <Path d="M23 7l-7 5 7 5V7z" />
      <Rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
    </Svg>
  ),
  Text: ({ size = 20, color = '#94A3B8' }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <Path d="M4 7V4h16v3M9 20h6M12 4v16" />
    </Svg>
  ),
  Image: ({ size = 20, color = '#94A3B8' }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <Rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
      <Circle cx="8.5" cy="8.5" r="1.5" fill={color} stroke="none" />
      <Path d="M21 15l-5-5L5 21" />
    </Svg>
  ),
  Smile: ({ size = 20, color = '#94A3B8' }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <Circle cx="12" cy="12" r="10" />
      <Path d="M8 14s1.5 2 4 2 4-2 4-2" />
      <Path d="M9 9h.01M15 9h.01" />
    </Svg>
  ),
  Music: ({ size = 20, color = '#94A3B8' }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <Path d="M9 18V5l12-2v13" />
      <Circle cx="6" cy="18" r="3" />
      <Circle cx="18" cy="16" r="3" />
    </Svg>
  ),
  Filter: ({ size = 20, color = '#94A3B8' }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <Path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6" />
    </Svg>
  ),
  Export: ({ size = 20, color = '#94A3B8' }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <Path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" />
    </Svg>
  ),
  Speed: ({ size = 20, color = '#94A3B8' }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <Path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
    </Svg>
  ),
  Eye: ({ size = 20, color = '#F8FAFC' }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <Path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <Circle cx="12" cy="12" r="3" />
    </Svg>
  ),
  EyeOff: ({ size = 20, color = '#F8FAFC' }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <Path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
      <Path d="M1 1l22 22" />
    </Svg>
  ),
  Trash: ({ size = 16, color = '#EF4444' }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <Path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </Svg>
  ),
};

// ─── Custom Slider ──────────────────────────────────────────────────────────────
interface SliderProps { value: number; min: number; max: number; step?: number; onChange: (v: number) => void; label: string; suffix?: string; }

function CustomSlider({ value, min, max, step = 1, onChange, label, suffix = '' }: SliderProps) {
  const W = screenWidth - 96;
  const startX = useRef(0);
  const startValRef = useRef(0);

  const pr = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (e, gestureState) => {
        const initialLocationX = e.nativeEvent.locationX;
        let r = initialLocationX / W;
        r = Math.max(0, Math.min(1, r));
        const startVal = min + r * (max - min);
        let steppedVal = Math.round(startVal / step) * step;
        steppedVal = Math.max(min, Math.min(max, steppedVal));

        startX.current = e.nativeEvent.pageX;
        startValRef.current = steppedVal;
        onChange(steppedVal);
      },
      onPanResponderMove: (e, gestureState) => {
        const deltaX = gestureState.dx;
        const deltaValue = (deltaX / W) * (max - min);
        let newValue = startValRef.current + deltaValue;
        let steppedVal = Math.round(newValue / step) * step;
        steppedVal = Math.max(min, Math.min(max, steppedVal));
        onChange(steppedVal);
      },
    })
  ).current;

  const pct = ((value - min) / (max - min)) * 100;

  return (
    <View style={ss.container}>
      <View style={ss.row}>
        <Text style={ss.label}>{label}</Text>
        <Text style={ss.val}>{value.toFixed(step < 1 ? 1 : 0)}{suffix}</Text>
      </View>
      <View style={[ss.track, { width: W }]} {...pr.panHandlers}>
        <View style={ss.bg} />
        <View style={[ss.fill, { width: `${pct}%` }]} pointerEvents="none" />
        <View style={[ss.thumb, { left: `${pct}%`, transform: [{ translateX: -9 }] }]} pointerEvents="none" />
      </View>
    </View>
  );
}

const ss = StyleSheet.create({
  container: { marginVertical: 6, paddingHorizontal: 8 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  label: { fontSize: 12, color: '#94A3B8', fontWeight: '600' },
  val: { fontSize: 12, color: '#F8FAFC', fontWeight: '700' },
  track: { height: 24, justifyContent: 'center', position: 'relative' },
  bg: { height: 5, borderRadius: 3, backgroundColor: '#334155', width: '100%' },
  fill: { height: 5, borderRadius: 3, backgroundColor: '#df103f', position: 'absolute', left: 0 },
  thumb: { position: 'absolute', width: 18, height: 18, borderRadius: 9, backgroundColor: '#df103f', borderWidth: 2.5, borderColor: '#fff', elevation: 4 },
});

// ─── Movable Overlay ────────────────────────────────────────────────────────────
interface MovableProps {
  item: Overlay;
  selected: boolean;
  onSelect: (id: string) => void;
  onUpdate: (id: string, patch: Partial<Overlay>) => void;
  onDelete: (id: string) => void;
  onCommit: () => void;
}

function MovableOverlay({ item, selected, onSelect, onUpdate, onDelete, onCommit }: MovableProps) {
  const startPos = useRef({ x: 0, y: 0 });
  const startSz = useRef({ w: 0, h: 0 });
  const startRot = useRef(0);

  const dragPR = useRef(PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: () => { onSelect(item.id); startPos.current = { x: item.x, y: item.y }; },
    onPanResponderMove: (_, g) => onUpdate(item.id, { x: startPos.current.x + g.dx, y: startPos.current.y + g.dy }),
    onPanResponderRelease: () => onCommit(),
  })).current;

  const resizePR = useRef(PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: (e) => { e.stopPropagation(); onSelect(item.id); startSz.current = { w: item.width, h: item.height }; },
    onPanResponderMove: (e, g) => { e.stopPropagation(); onUpdate(item.id, { width: Math.max(40, startSz.current.w + g.dx), height: Math.max(30, startSz.current.h + g.dy) }); },
    onPanResponderRelease: () => onCommit(),
  })).current;

  const rotatePR = useRef(PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: (e) => { e.stopPropagation(); onSelect(item.id); startRot.current = item.rotation; },
    onPanResponderMove: (e, g) => { e.stopPropagation(); let r = (startRot.current + g.dx * 0.8) % 360; if (r < 0) r += 360; onUpdate(item.id, { rotation: Math.round(r) }); },
    onPanResponderRelease: () => onCommit(),
  })).current;

  return (
    <View style={[ms.wrap, { left: item.x, top: item.y, width: item.width, height: item.height, transform: [{ rotate: `${item.rotation}deg` }], zIndex: selected ? 999 : 10 }]}>
      <View style={ms.inner} {...dragPR.panHandlers}>
        {item.type === 'text' ? (
          <RNText style={{ fontSize: item.fontSize ?? 18, color: item.color ?? '#fff', fontWeight: item.bold ? 'bold' : 'normal', textAlign: 'center', width: '100%', textShadowColor: 'rgba(0,0,0,0.6)', textShadowOffset: { width: 1, height: 1 }, textShadowRadius: 3 }}>
            {item.text}
          </RNText>
        ) : (
          <RNImage source={{ uri: item.uri }} style={{ width: '100%', height: '100%', borderRadius: item.borderRadius ?? 0, opacity: item.opacity ?? 1 }} resizeMode="cover" />
        )}
      </View>
      {selected && (
        <>
          <View style={ms.outline} pointerEvents="none" />
          {/* Rotate handle – top-center */}
          <View style={[ms.handle, ms.rotHandle, { left: item.width / 2 - 13, top: -30 }]} {...rotatePR.panHandlers}>
            <Icon.Rotate size={12} color="#fff" />
          </View>
          {/* Delete handle – top-right */}
          <TouchableOpacity style={[ms.handle, ms.delHandle, { right: -12, top: -12 }]} onPress={() => onDelete(item.id)}>
            <Icon.Close size={10} color="#fff" />
          </TouchableOpacity>
          {/* Resize handle – bottom-right */}
          <View style={[ms.handle, ms.resHandle, { right: -10, bottom: -10 }]} {...resizePR.panHandlers}>
            <View style={ms.resDot} />
          </View>
        </>
      )}
    </View>
  );
}

const ms = StyleSheet.create({
  wrap: { position: 'absolute' },
  inner: { width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' },
  outline: { ...StyleSheet.absoluteFillObject, borderWidth: 1.5, borderColor: '#df103f', borderStyle: 'dashed' },
  handle: { position: 'absolute', width: 26, height: 26, borderRadius: 13, justifyContent: 'center', alignItems: 'center', elevation: 4 },
  rotHandle: { backgroundColor: '#3B82F6' },
  delHandle: { backgroundColor: '#EF4444' },
  resHandle: { backgroundColor: '#10B981' },
  resDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#fff' },
});

// ─── Main VideoEditor Component ─────────────────────────────────────────────────
export default function VideoEditor({ route, navigation }: { route?: any; navigation?: any }) {
  const { hasPermission: hasCameraPermission, requestPermission: requestCameraPermission } = useCameraPermission();
  const { hasPermission: hasMicrophonePermission, requestPermission: requestMicrophonePermission } = useMicrophonePermission();

  // Video state
  const videoRef = useRef<any>(null);
  const loadRequestId = useRef(0);
  const initialVideoUri = route?.params?.videoUri ?? null;
  const [videoUri, setVideoUri] = useState<string | null>(initialVideoUri);
  const videoSource = useMemo(() => (videoUri ? { uri: videoUri } : undefined), [videoUri]);
  const [playbackUri, setPlaybackUri] = useState<string | null>(initialVideoUri);
  const [paused, setPaused] = useState(true);
  const [muted, setMuted] = useState(true);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1.0);
  const [volume, setVolume] = useState(1.0);
  const [videoLoading, setVideoLoading] = useState(false);
  const [videoError, setVideoError] = useState<string | null>(null);
  const [useTexture, setUseTexture] = useState<boolean>(Platform.OS === 'android');
  const [videoKeySeed, setVideoKeySeed] = useState<number>(0);

  // Trimming (percentage 0 to 100)
  const [trimStart, setTrimStart] = useState<number>(0);
  const [trimEnd, setTrimEnd] = useState<number>(100);

  // Overlays
  const [overlays, setOverlays] = useState<Overlay[]>([]);
  const [selectedOverlay, setSelectedOverlay] = useState<string | null>(null);
  const [emojiModalVisible, setEmojiModalVisible] = useState(false);
  const nextId = useRef(1);

  // Social modal state (open when incoming category is Social Media)
  const [showSocialModal, setShowSocialModal] = useState(false);
  const [videoSubCategory, setVideoSubCategory] = useState<string | null>(null);
  // Templates modal
  const [templatesModalVisible, setTemplatesModalVisible] = useState(false);

  // Music & Multi-track
  const [musicTracks, setMusicTracks] = useState<MusicTrack[]>([]);
  const [selectedMusicTrack, setSelectedMusicTrack] = useState<string | null>(null);
  const [musicVolume, setMusicVolume] = useState(0.7);
  const [iTunesModalVisible, setITunesModalVisible] = useState(false);
  const [preRecordMusic, setPreRecordMusic] = useState<MusicTrack | null>(null);
  const [musicSelectMode, setMusicSelectMode] = useState<'editor' | 'pre-record'>('editor');
  const preRecordSoundRef = useRef<any>(null);

  // Custom camera recording states
  const [customCameraVisible, setCustomCameraVisible] = useState(false);
  const [cameraPermissionGranted, setCameraPermissionGranted] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordDuration, setRecordDuration] = useState(0);
  const [cameraPosition, setCameraPosition] = useState<'back' | 'front'>('back');
  const [flash, setFlash] = useState<'off' | 'on'>('off');
  const cameraRef = useRef<any>(null);
  const recordingTimerRef = useRef<any>(null);
  const device = useCameraDevice(cameraPosition);
  const videoOutput = useVideoOutput({
    enableAudio: true
  });
  const recorderRef = useRef<any>(null);

  // Slideshow creation state
  const [slideshowModalVisible, setSlideshowModalVisible] = useState(false);
  const [slideshowImages, setSlideshowImages] = useState<Array<{
    id: string;
    uri: string;
    duration: number;
    effect: string;
  }>>([]);
  const [generatingSlideshow, setGeneratingSlideshow] = useState(false);

  // Video Merging
  const [videoMergeClips, setVideoMergeClips] = useState<{ start: MergeClip[]; end: MergeClip[]; }>({ start: [], end: [] });

  // Filter
  const [filterPreset, setFilterPreset] = useState<string>('none');

  // Active bottom tab
  const [activeTab, setActiveTab] = useState<'video' | 'overlays' | 'music' | 'filter' | 'speed' | 'export'>('video');

  // Text-add modal
  const [textModalVisible, setTextModalVisible] = useState(false);
  const [textInput, setTextInput] = useState('');
  const [textColor, setTextColor] = useState('#FFFFFF');
  const [textBold, setTextBold] = useState(false);
  const [fontSize, setFontSize] = useState(22);

  // Export state
  const [exporting, setExporting] = useState(false);

  // Timeline toggle state
  const [showTimeline, setShowTimeline] = useState(true);

  // Undo/Redo
  type HistoryEntry = {
    overlays: Overlay[];
    filter: string;
    musicTracks: MusicTrack[];
    trimStart: number;
    trimEnd: number;
    videoMergeClips: { start: MergeClip[]; end: MergeClip[]; };
  };
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [historyIdx, setHistoryIdx] = useState(-1);
  const [naturalSize, setNaturalSize] = useState<{ width: number; height: number } | null>(null);

  // Timeline Scroll Refs
  const timelineScrollRef = useRef<ScrollView>(null);
  const isDraggingTimeline = useRef(false);

  // ── helpers ──
  const isRemoteVideoUri = (uri: string) => /^https?:\/\//i.test(uri);

  const THUMBNAIL_MAPPING: Record<string, any> = {
    'assets/images/video/v_1.png': require('../../assets/images/video/v_1.png'),
    'assets/images/video/v_2.png': require('../../assets/images/video/v_2.png'),
    'assets/images/video/v_3.png': require('../../assets/images/video/v_3.png'),
    'assets/images/video/v_4.png': require('../../assets/images/video/v_4.png'),
    'assets/images/video/v_5.png': require('../../assets/images/video/v_5.png'),
    'assets/images/video/v_6.png': require('../../assets/images/video/v_6.png'),
    'assets/images/video/v_7.png': require('../../assets/images/video/v_7.png'),
    'assets/images/video/v_8.png': require('../../assets/images/video/v_8.png'),
  };

  const getThumbnailSource = (path?: string) => {
    if (!path) return null;
    if (path.startsWith('http') || path.startsWith('file://')) {
      return { uri: path };
    }
    if (THUMBNAIL_MAPPING[path]) {
      return THUMBNAIL_MAPPING[path];
    }
    if (Platform.OS === 'android') {
      return { uri: `asset:/${path}` };
    }
    return { uri: path };
  };

  const getVideoExtension = (uri: string) => {
    const cleanUri = uri.split('?')[0].toLowerCase();
    if (cleanUri.endsWith('.mov')) return 'mov';
    if (cleanUri.endsWith('.m4v')) return 'm4v';
    if (cleanUri.endsWith('.webm')) return 'webm';
    return 'mp4';
  };

  // Refs to avoid recreating callbacks on state changes (preventing ExoPlayer reloads)
  const currentTimeRef = useRef(0);
  currentTimeRef.current = currentTime;
  const durationRef = useRef(0);
  durationRef.current = duration;
  const trimStartRef = useRef(0);
  trimStartRef.current = trimStart;
  const trimEndRef = useRef(100);
  trimEndRef.current = trimEnd;

  const handleVideoLoad = useCallback((data: any) => {
    console.log('Video onLoad', { duration: data.duration, size: data.naturalSize });
    setDuration(data.duration);
    if (data.naturalSize) {
      setNaturalSize({ width: data.naturalSize.width, height: data.naturalSize.height });
    }
    setVideoLoading(false);

    // Sync pre-recorded music track end time to full duration when loaded
    setMusicTracks(prev => prev.map(t => t.endTime === 10 ? { ...t, endTime: data.duration } : t));

    try {
      setTimeout(() => {
        if (videoRef.current?.seek) {
          const t = Math.max(0, currentTimeRef.current || 0);
          videoRef.current.seek(t + 0.001);
        }
      }, 150);
    } catch (e) { }
  }, []);

  const handleVideoReady = useCallback(() => {
    setVideoLoading(false);
    setVideoError(null);
    if (Platform.OS === 'android') {
      setTimeout(() => {
        try { videoRef.current?.seek(0.001); } catch { }
      }, 100);
    }
  }, []);

  const handleVideoProgress = useCallback((data: any) => {
    const cur = data.currentTime;
    setCurrentTime(cur);
    const dur = durationRef.current;
    const tStart = trimStartRef.current;
    const tEnd = trimEndRef.current;
    const loopStart = (tStart / 100) * dur;
    const loopEnd = (tEnd / 100) * dur;
    if (dur > 0 && (cur >= loopEnd || cur < loopStart - 0.5)) {
      videoRef.current?.seek(loopStart);
      setCurrentTime(loopStart);
    }
  }, []);

  const handleVideoEnd = useCallback(() => {
    const dur = durationRef.current;
    const tStart = trimStartRef.current;
    const loopStart = (tStart / 100) * dur;
    videoRef.current?.seek(loopStart);
    setCurrentTime(loopStart);
  }, []);

  const handleVideoLoadStart = useCallback(() => {
    console.log('Video onLoadStart');
    setVideoLoading(true);
  }, []);

  const handleVideoBuffer = useCallback((b: any) => {
    console.log('Video onBuffer', b);
    setVideoLoading(!!b?.isBuffering);
  }, []);

  const handleVideoError = useCallback((e: any) => {
    console.warn('Video playback error', e);
    setVideoError(e?.error?.localizedDescription || JSON.stringify(e) || 'Playback error');
    setVideoLoading(false);
  }, []);


  const loadVideoSource = useCallback(async (uri: string, options?: { autoplay?: boolean; clearOverlays?: boolean; closeTemplates?: boolean }) => {
    const requestId = ++loadRequestId.current;
    setVideoUri(uri);
    setPlaybackUri(uri);
    setCurrentTime(0);
    setDuration(0);
    setPaused(options?.autoplay ?? true);
    setVideoError(null);
    setVideoLoading(true);
    setTrimStart(0);
    setTrimEnd(100);
    setSelectedOverlay(null);
    setSelectedMusicTrack(null);

    if (options?.clearOverlays) {
      setOverlays([]);
      setMusicTracks([]);
      setVideoMergeClips({ start: [], end: [] });
      setHistory([]);
      setHistoryIdx(-1);
    }
    if (options?.closeTemplates) {
      setTemplatesModalVisible(false);
    }

    setVideoLoading(false);
  }, []);

  const commitHistory = useCallback((patch?: Partial<HistoryEntry>) => {
    const entry: HistoryEntry = {
      overlays: patch?.overlays ?? overlays,
      filter: patch?.filter ?? filterPreset,
      musicTracks: patch?.musicTracks ?? musicTracks,
      trimStart: patch?.trimStart ?? trimStart,
      trimEnd: patch?.trimEnd ?? trimEnd,
      videoMergeClips: patch?.videoMergeClips ?? videoMergeClips,
    };
    setHistory(h => { const next = [...h.slice(0, historyIdx + 1), entry]; setHistoryIdx(next.length - 1); return next; });
  }, [overlays, filterPreset, musicTracks, trimStart, trimEnd, videoMergeClips, historyIdx]);

  const applyHistory = (idx: number) => {
    if (idx < 0 || idx >= history.length) return;
    const e = history[idx];
    setOverlays(e.overlays);
    setFilterPreset(e.filter);
    setMusicTracks(e.musicTracks);
    setTrimStart(e.trimStart);
    setTrimEnd(e.trimEnd);
    setVideoMergeClips(e.videoMergeClips);
    setHistoryIdx(idx);
    setSelectedOverlay(null);
    setSelectedMusicTrack(null);
  };

  useEffect(() => {
    if (route?.params?.videoUri) {
      loadVideoSource(route.params.videoUri, { autoplay: false, clearOverlays: true });
    }
  }, [loadVideoSource, route?.params?.videoUri]);

  // Timeline Scroll Scale and Programmatic Syncer
  const TIMELINE_SCALE = 30; // 30 pixels per second
  const playheadCenter = (screenWidth - 32) / 2;

  useEffect(() => {
    if (!isDraggingTimeline.current && timelineScrollRef.current && duration > 0) {
      const x = currentTime * TIMELINE_SCALE;
      timelineScrollRef.current.scrollTo({ x, animated: false });
    }
  }, [currentTime, duration]);

  const handleTimelineScroll = (event: any) => {
    if (isDraggingTimeline.current && duration > 0) {
      const x = event.nativeEvent.contentOffset.x;
      const newTime = Math.max(0, Math.min(duration, x / TIMELINE_SCALE));
      setCurrentTime(newTime);
      videoRef.current?.seek(newTime);
    }
  };

  // Background audio sync refs & hook
  const audioRefs = useRef<Record<string, any>>({});
  const lastPaused = useRef(true);

  useEffect(() => {
    const isPlayTransition = lastPaused.current && !paused;
    lastPaused.current = paused;

    if (isPlayTransition || isDraggingTimeline.current) {
      musicTracks.forEach(track => {
        const audioRef = audioRefs.current[track.id];
        if (audioRef) {
          const relativeTime = currentTime - track.startTime;
          if (relativeTime >= 0 && relativeTime <= (track.endTime - track.startTime)) {
            audioRef.seek(relativeTime);
          } else {
            audioRef.seek(0);
          }
        }
      });
    }
  }, [currentTime, paused, musicTracks]);

  // ── video picker ──
  const pickVideo = async () => {
    try {
      const res = await launchImageLibrary({ mediaType: 'video', videoQuality: 'high' });
      if (res.didCancel) return;
      if (res.errorCode) { Alert.alert('Picker Error', res.errorMessage || res.errorCode); return; }
      const uri = res.assets?.[0]?.uri;
      if (uri) {
        await loadVideoSource(uri, { autoplay: false, clearOverlays: true });
      }
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Unable to pick video.');
    }
  };

  const openSlideshowModal = () => {
    setSlideshowImages([]);
    setSlideshowModalVisible(true);
  };

  const pickSlideshowImages = async () => {
    try {
      const res = await launchImageLibrary({
        mediaType: 'photo',
        quality: 1,
        selectionLimit: 0,
      });
      if (res.didCancel) return;
      if (res.errorCode) {
        Alert.alert('Picker Error', res.errorMessage || res.errorCode);
        return;
      }
      if (res.assets && res.assets.length > 0) {
        const newImages = res.assets.map((asset, index) => ({
          id: `img_${Date.now()}_${index}_${Math.random().toString(36).substr(2, 5)}`,
          uri: asset.uri || '',
          duration: 3.0, // default 3 seconds
          effect: 'fade', // default effect
        })).filter(img => img.uri !== '');
        
        setSlideshowImages(prev => [...prev, ...newImages]);
      }
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Unable to pick images.');
    }
  };

  const generateSlideshowVideo = async () => {
    if (slideshowImages.length === 0) {
      Alert.alert('No Images', 'Please add at least one image.');
      return;
    }
    setGeneratingSlideshow(true);
    try {
      const formData = new FormData();
      
      // Extract durations and effects list
      const durations = slideshowImages.map(img => img.duration);
      const effects = slideshowImages.map(img => img.effect);
      
      formData.append('durations', JSON.stringify(durations));
      formData.append('effects', JSON.stringify(effects));
      
      // Append images
      for (let i = 0; i < slideshowImages.length; i++) {
        const img = slideshowImages[i];
        const preparedImg = await prepareFileForUpload(img.uri, 'image/png');
        formData.append('images', preparedImg as any);
      }
      
      console.log('Sending create-from-images request to https://ai.flarelap.com/video/create-from-images...');
      const response = await fetch('https://ai.flarelap.com/video/create-from-images', {
        method: 'POST',
        body: formData,
        headers: {
          Accept: 'video/mp4, application/json'
        }
      });
      
      if (!response.ok) {
        const errText = await response.text();
        throw new Error(errText || `Server error HTTP ${response.status}`);
      }
      
      const newVideoUri = await saveBlobResponseAsVideo(response);
      console.log('Slideshow video created:', newVideoUri);
      
      // Load into editor
      await loadVideoSource(newVideoUri, { autoplay: false, clearOverlays: true });
      
      setSlideshowModalVisible(false);
      setSlideshowImages([]);
      Alert.alert('Success', 'Slideshow video generated successfully and loaded into editor!');
    } catch (err: any) {
      console.error('Slideshow Generation Error:', err);
      Alert.alert('Generation Failed', err.message || 'Something went wrong. Please try again.');
    } finally {
      setGeneratingSlideshow(false);
    }
  };

  useEffect(() => {
    setShowSocialModal(true);
  }, []);

  // No sound cleanup needed — pre-record music is handled by a react-native-video
  // audioOnly component inside the camera modal, which self-manages its session.

  const checkCameraPermissions = async () => {
    try {
      if (hasCameraPermission && hasMicrophonePermission) {
        setCameraPermissionGranted(true);
        return true;
      }

      const camGranted = hasCameraPermission ? true : await requestCameraPermission();
      const micGranted = hasMicrophonePermission ? true : await requestMicrophonePermission();

      if (camGranted && micGranted) {
        setCameraPermissionGranted(true);
        return true;
      } else {
        Alert.alert('Permission Denied', 'Camera and microphone permissions are required to record video.');
        return false;
      }
    } catch (err) {
      console.warn('Failed to check camera permissions', err);
      return false;
    }
  };

  const startCameraRecording = async () => {
    if (!cameraRef.current) return;
    try {
      setIsRecording(true);   // ← this also unpauses the hidden audioOnly Video
      setRecordDuration(0);

      // Start recording timer
      recordingTimerRef.current = setInterval(() => {
        setRecordDuration(d => d + 1);
      }, 1000);

      // Music playback is handled by the hidden <Video audioOnly> in the camera
      // modal (paused={!isRecording}). Give it a brief moment to actually start
      // before the camera begins capturing audio, so they're in sync.
      if (preRecordMusic) {
        await new Promise<void>(resolve => setTimeout(resolve, 250));
      }

      const recorder = await videoOutput.createRecorder({});
      recorderRef.current = recorder;

      await recorder.startRecording(
        async (filePath: string) => {
          clearInterval(recordingTimerRef.current);
          setIsRecording(false); // ← pauses the hidden audioOnly Video

          // Load the recorded video into editor
          if (filePath) {
            const videoUri = `file://${filePath}`;
            await loadVideoSource(videoUri, { autoplay: false, clearOverlays: true });

            // Automatically import the music track into the editor
            if (preRecordMusic) {
              const trackToAdd: MusicTrack = {
                ...preRecordMusic,
                startTime: 0,
                endTime: 10,
                volume: 0.8
              };
              const updated = [trackToAdd];
              setMusicTracks(updated);
              setSelectedMusicTrack(trackToAdd.id);
              setVolume(0.1);
              commitHistory({ musicTracks: updated });
            }

            setCustomCameraVisible(false);
          }
        },
        (error: any) => {
          clearInterval(recordingTimerRef.current);
          setIsRecording(false);
          console.error('Camera recording error', error);
          Alert.alert('Recording Error', 'Failed to record video.');
        }
      );
    } catch (err: any) {
      clearInterval(recordingTimerRef.current);
      setIsRecording(false);
      Alert.alert('Error', err.message || 'Could not start recording.');
    }
  };

  const stopCameraRecording = async () => {
    if (!recorderRef.current) return;
    try {
      await recorderRef.current.stopRecording();
    } catch (err: any) {
      console.warn('Stop recording failed', err);
    }
  };

  const handleOpenCustomCamera = async () => {
    const hasPermission = await checkCameraPermissions();
    if (hasPermission) {
      // Always sync the active editor music track → preRecordMusic so the
      // camera plays it automatically when recording starts.
      const activeTrack = musicTracks.find(t => t.id === selectedMusicTrack);
      if (activeTrack) {
        setPreRecordMusic(activeTrack);
      }
      setCustomCameraVisible(true);
    }
  };

  const selectTemplate = async (t: any) => {
    if (!t?.videoURL) return;
    await loadVideoSource(t.videoURL, { autoplay: false, clearOverlays: true, closeTemplates: true });
  };

  // iTunes search states & helpers
  const [iTunesQuery, setITunesQuery] = useState('');
  const [iTunesResults, setITunesResults] = useState<any[]>([]);
  const [searchingITunes, setSearchingITunes] = useState(false);
  const [downloadingTrackId, setDownloadingTrackId] = useState<number | null>(null);
  const [previewTrackUrl, setPreviewTrackUrl] = useState<string | null>(null);
  const [previewPaused, setPreviewPaused] = useState(true);

  const searchITunes = async () => {
    if (!iTunesQuery.trim()) return;
    setSearchingITunes(true);
    try {
      const response = await fetch(
        `https://itunes.apple.com/search?term=${encodeURIComponent(iTunesQuery)}&media=music&entity=song&limit=15`
      );
      const data = await response.json();
      setITunesResults(data.results || []);
    } catch (e) {
      Alert.alert('Search Error', 'Unable to fetch tracks from iTunes.');
    } finally {
      setSearchingITunes(false);
    }
  };

  const downloadAndUseITunesTrack = async (track: any) => {
    setDownloadingTrackId(track.trackId);
    try {
      const RNFS = (() => { try { return require('react-native-fs'); } catch { return null; } })();
      if (!RNFS) {
        throw new Error('FileSystem storage not available.');
      }
      const filename = `itunes_${track.trackId}.m4a`;
      const localPath = `${RNFS.TemporaryDirectoryPath || RNFS.CachesDirectoryPath}/${filename}`;

      const download = RNFS.downloadFile({
        fromUrl: track.previewUrl,
        toFile: localPath,
      });
      const result = await download.promise;
      if (result.statusCode < 200 || result.statusCode >= 300) {
        throw new Error('Download failed');
      }

      const newTrack: MusicTrack = {
        id: `music_${Date.now()}`,
        name: track.trackName,
        uri: `file://${localPath}`,
        startTime: 0,
        endTime: duration || 10,
        volume: 0.8,
        fileObj: {
          uri: `file://${localPath}`,
          name: filename,
          type: 'audio/x-m4a',
        }
      };

      if (musicSelectMode === 'pre-record') {
        setPreRecordMusic(newTrack);
        setITunesModalVisible(false);
      } else {
        const updated = [...musicTracks, newTrack];
        setMusicTracks(updated);
        setSelectedMusicTrack(newTrack.id);
        setITunesModalVisible(false);
        commitHistory({ musicTracks: updated });
      }
    } catch (err: any) {
      Alert.alert('Download Failed', err.message || 'Unable to download track preview.');
    } finally {
      setDownloadingTrackId(null);
    }
  };

  const deleteMusicTrack = (id: string) => {
    const updated = musicTracks.filter(t => t.id !== id);
    setMusicTracks(updated);
    setSelectedMusicTrack(null);
    commitHistory({ musicTracks: updated });
  };

  const updateMusicTrack = (id: string, patch: Partial<MusicTrack>) => {
    const updated = musicTracks.map(t => t.id === id ? { ...t, ...patch } : t);
    setMusicTracks(updated);
    commitHistory({ musicTracks: updated });
  };

  const addMergeClip = async (position: 'start' | 'end') => {
    try {
      const res = await launchImageLibrary({ mediaType: 'video', videoQuality: 'high' });
      if (res.didCancel) return;
      if (res.errorCode) { Alert.alert('Picker Error', res.errorMessage || res.errorCode); return; }
      const uri = res.assets?.[0]?.uri;
      const name = res.assets?.[0]?.fileName || `clip_${Date.now()}.mp4`;
      if (uri) {
        const newClip: MergeClip = {
          id: `merge_${Date.now()}`,
          name,
          uri,
          position,
          order: videoMergeClips[position].length,
        };
        const updated = {
          ...videoMergeClips,
          [position]: [...videoMergeClips[position], newClip],
        };
        setVideoMergeClips(updated);
        commitHistory({ videoMergeClips: updated });
      }
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Unable to pick merge clip.');
    }
  };

  const deleteMergeClip = (position: 'start' | 'end', id: string) => {
    const updatedList = videoMergeClips[position].filter(c => c.id !== id).map((c, idx) => ({ ...c, order: idx }));
    const updated = {
      ...videoMergeClips,
      [position]: updatedList,
    };
    setVideoMergeClips(updated);
    commitHistory({ videoMergeClips: updated });
  };

  // ── image overlay picker ──
  const pickImageOverlay = async () => {
    try {
      const res = await launchImageLibrary({ mediaType: 'photo', quality: 1 });
      if (res.didCancel) return;
      if (res.errorCode) { Alert.alert('Picker Error', res.errorMessage || res.errorCode); return; }
      const uri = res.assets?.[0]?.uri;
      if (uri) {
        const id = `img_${nextId.current++}`;
        const item: Overlay = {
          id, type: 'image',
          x: PREVIEW_W / 2 - 60, y: PREVIEW_H / 2 - 60,
          width: 120, height: 120, rotation: 0,
          uri, borderRadius: 0, opacity: 1,
          startTime: 0,
          endTime: duration || 10,
        };
        const updated = [...overlays, item];
        setOverlays(updated);
        setSelectedOverlay(id);
        commitHistory({ overlays: updated });
      }
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Unable to pick image.');
    }
  };

  // ── text overlay ──
  const addTextOverlay = () => {
    if (!textInput.trim()) return;
    const id = `txt_${nextId.current++}`;
    const item: Overlay = {
      id, type: 'text',
      text: textInput, fontSize, color: textColor, bold: textBold,
      x: PREVIEW_W / 2 - 70, y: PREVIEW_H / 2 - 25,
      width: 140, height: 50, rotation: 0,
      startTime: 0,
      endTime: duration || 10,
    };
    const updated = [...overlays, item];
    setOverlays(updated);
    setSelectedOverlay(id);
    commitHistory({ overlays: updated });
    setTextInput('');
    setTextModalVisible(false);
  };

  // ── emoji sticker overlay ──
  const addEmojiOverlay = (emoji: string) => {
    const id = `emoji_${nextId.current++}`;
    const uri = getTwemojiUrl(emoji);
    const item: Overlay = {
      id,
      type: 'emoji',
      text: emoji,
      x: PREVIEW_W / 2 - 40,
      y: PREVIEW_H / 2 - 40,
      width: 80,
      height: 80,
      rotation: 0,
      uri,
      opacity: 1,
      borderRadius: 0,
      startTime: 0,
      endTime: duration || 10,
    };
    const updated = [...overlays, item];
    setOverlays(updated);
    setSelectedOverlay(id);
    commitHistory({ overlays: updated });
    setEmojiModalVisible(false);
  };

  const updateOverlay = (id: string, patch: Partial<Overlay>) =>
    setOverlays(prev => prev.map(o => o.id === id ? { ...o, ...patch } : o));

  const deleteOverlay = (id: string) => {
    const updated = overlays.filter(o => o.id !== id);
    setOverlays(updated);
    setSelectedOverlay(null);
    commitHistory({ overlays: updated });
  };

  // ── timeline scrubber ──
  const scrubberWidth = PREVIEW_W - 32;
  const scrubPR = useRef(PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: (e) => scrubTo(e.nativeEvent.locationX),
    onPanResponderMove: (e) => scrubTo(e.nativeEvent.locationX),
  })).current;

  const scrubTo = (lx: number) => {
    if (!duration) return;
    const ratio = Math.max(0, Math.min(1, lx / scrubberWidth));
    const t = ratio * duration;
    setCurrentTime(t);
    videoRef.current?.seek(t);
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  const scrubPct = duration > 0 ? (currentTime / duration) * 100 : 0;

  // ── export to backend ──
  const getFilterAdjustments = (preset: string) => {
    switch (preset) {
      case 'vintage': return { brightness: -0.05, contrast: 0.9, saturation: 0.7 };
      case 'cinematic': return { brightness: -0.08, contrast: 1.2, saturation: 0.9 };
      case 'warm': return { brightness: 0.03, contrast: 1.0, saturation: 1.2 };
      case 'cool': return { brightness: 0.02, contrast: 1.0, saturation: 0.8 };
      case 'noir': return { brightness: -0.05, contrast: 1.3, saturation: 0.0 };
      case 'vivid': return { brightness: 0.05, contrast: 1.1, saturation: 1.4 };
      case 'fade': return { brightness: 0.08, contrast: 0.8, saturation: 0.8 };
      default: return { brightness: 0.0, contrast: 1.0, saturation: 1.0 };
    }
  };

  const getUploadType = (uri: string, fallback = 'video/mp4') => {
    const clean = uri.split('?')[0].toLowerCase();
    if (clean.endsWith('.mp4')) return 'video/mp4';
    if (clean.endsWith('.mov')) return 'video/quicktime';
    if (clean.endsWith('.m4v')) return 'video/x-m4v';
    if (clean.endsWith('.mp3')) return 'audio/mpeg';
    if (clean.endsWith('.m4a')) return 'audio/x-m4a';
    if (clean.endsWith('.wav')) return 'audio/x-wav';
    if (clean.endsWith('.png')) return 'image/png';
    if (clean.endsWith('.jpg') || clean.endsWith('.jpeg')) return 'image/jpeg';
    return fallback;
  };

  const getUploadName = (uri: string, type: string) => {
    const parts = uri.split('/');
    let last = parts[parts.length - 1] || 'file';
    if (last.includes('?')) {
      last = last.split('?')[0];
    }
    if (!last.includes('.')) {
      const ext = type.split('/')[1] || 'bin';
      last = `${last}.${ext}`;
    }
    return last;
  };

  const prepareFileForUpload = async (uri: string, fallbackType = 'video/mp4') => {
    if (!uri.startsWith('http')) {
      const type = getUploadType(uri, fallbackType);
      return { uri, type, name: getUploadName(uri, type) };
    }

    const RNFS = (() => { try { return require('react-native-fs'); } catch { return null; } })();
    if (!RNFS) {
      throw new Error('FileSystem storage not available.');
    }

    const type = getUploadType(uri, fallbackType);
    const name = getUploadName(uri, type);
    const tmpDir = RNFS.TemporaryDirectoryPath || RNFS.CachesDirectoryPath;
    const localPath = `${tmpDir}/${Date.now()}_${name}`;
    const download = RNFS.downloadFile({ fromUrl: uri, toFile: localPath });
    const result = await download.promise;
    if (result.statusCode < 200 || result.statusCode >= 300) {
      throw new Error(`Failed to download: ${uri}`);
    }
    return { uri: `file://${localPath}`, type, name };
  };

  const readBlobAsDataUrl = (blob: any) => {
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(String(reader.result));
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  const saveBlobResponseAsVideo = async (response: any) => {
    const blob = await response.blob();
    const dataUrl = await readBlobAsDataUrl(blob);
    const base64 = dataUrl.split(',')[1];
    if (!base64) {
      throw new Error('Video processing returned an invalid file.');
    }

    const RNFS = (() => { try { return require('react-native-fs'); } catch { return null; } })();
    if (!RNFS) {
      throw new Error('FileSystem storage not available.');
    }

    const tmpDir = RNFS.TemporaryDirectoryPath || RNFS.CachesDirectoryPath;
    const filePath = `${tmpDir}/processed_video_${Date.now()}.mp4`;
    await RNFS.writeFile(filePath, base64, 'base64');
    return `file://${filePath}`;
  };

  const saveVideoToDevice = async (
    videoSourcePath: string
  ): Promise<{ success: boolean; path: string; location: string; filename: string }> => {
    const RNFS = (() => {
      try {
        return require('react-native-fs');
      } catch {
        return null;
      }
    })();
    if (!RNFS) {
      throw new Error('FileSystem storage not available.');
    }

    const cleanSrc = videoSourcePath.replace('file://', '');
    const filename = `flarelap_video_${Date.now()}.mp4`;

    if (Platform.OS === 'android') {
      if (Platform.Version < 29) {
        try {
          const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
            {
              title: 'Storage Permission',
              message: 'Flarelap needs storage access to save videos to your Gallery.',
              buttonPositive: 'OK',
            }
          );
          if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
            console.warn('Storage permission not granted on Android <= 9');
          }
        } catch (permErr) {
          console.warn('Permission request error:', permErr);
        }
      }

      let destPath = `${RNFS.DownloadDirectoryPath}/${filename}`;
      let location = 'Downloads / Gallery';

      try {
        await RNFS.copyFile(cleanSrc, destPath);
      } catch (err1) {
        console.warn('Saving to DownloadDirectoryPath failed, trying PicturesDirectoryPath:', err1);
        try {
          destPath = `${RNFS.PicturesDirectoryPath}/${filename}`;
          await RNFS.copyFile(cleanSrc, destPath);
          location = 'Pictures / Gallery';
        } catch (err2) {
          console.warn('Saving to PicturesDirectoryPath failed, falling back to DocumentDirectoryPath:', err2);
          destPath = `${RNFS.DocumentDirectoryPath}/${filename}`;
          await RNFS.copyFile(cleanSrc, destPath);
          location = 'Documents';
        }
      }

      if (RNFS.scanFile) {
        try {
          await RNFS.scanFile(destPath);
        } catch (scanErr) {
          console.warn('MediaScanner scanFile error:', scanErr);
        }
      }

      return { success: true, path: destPath, location, filename };
    } else {
      const destPath = `${RNFS.DocumentDirectoryPath}/${filename}`;
      await RNFS.copyFile(cleanSrc, destPath);
      return { success: true, path: destPath, location: 'Files', filename };
    }
  };

  const handleExport = async () => {
    if (!videoUri) { Alert.alert('No Video', 'Please select or record a video first.'); return; }
    setExporting(true);
    try {
      // 1. Prepare main video file
      const preparedMainVideo = await prepareFileForUpload(videoUri, 'video/mp4');

      // 2. Build form data for process
      const formData = new FormData();
      formData.append('video', preparedMainVideo as any);

      // Calculations for trimming
      const startSec = (trimStart / 100) * duration;
      const durSec = ((trimEnd - trimStart) / 100) * duration;
      formData.append('trimStart', String(startSec));
      if (duration > 0) {
        formData.append('trimDuration', String(durSec));
      }

      // Filter settings (mapped to adjustments)
      const adjustments = getFilterAdjustments(filterPreset);
      formData.append('brightness', String(adjustments.brightness));
      formData.append('contrast', String(adjustments.contrast));
      formData.append('saturation', String(adjustments.saturation));

      // Overlays formatting
      const scaleX = naturalSize ? naturalSize.width / PREVIEW_W : 1.0;
      const scaleY = naturalSize ? naturalSize.height / PREVIEW_H : 1.0;

      // Text overlays
      const textOverlaysPayload = overlays
        .filter(o => o.type === 'text')
        .map(o => ({
          id: o.id,
          text: o.text || '',
          x: (o.x / PREVIEW_W) * 100, // percentage
          y: (o.y / PREVIEW_H) * 100, // percentage
          fontSize: o.fontSize || 24,
          color: o.color || '#FFFFFF',
          bold: !!o.bold,
          startTime: o.startTime,
          endTime: o.endTime
        }));
      formData.append('textOverlays', JSON.stringify(textOverlaysPayload));

      // Logo overlays (includes both user images and emoji stickers)
      const imageOverlays = overlays.filter(o => o.type === 'image' || o.type === 'emoji');
      const logoOverlaysPayload = imageOverlays.map((o, idx) => ({
        id: o.id,
        filename: `logo_${idx}.png`,
        x: (o.x / PREVIEW_W) * 100, // percentage
        y: (o.y / PREVIEW_H) * 100, // percentage
        width: Math.round(o.width * scaleX),
        height: Math.round(o.height * scaleY),
        startTime: o.startTime,
        endTime: o.endTime
      }));
      formData.append('logoOverlays', JSON.stringify(logoOverlaysPayload));

      // Attach logo image files
      for (let i = 0; i < imageOverlays.length; i++) {
        const overlay = imageOverlays[i];
        if (overlay.uri) {
          const preparedLogo = await prepareFileForUpload(overlay.uri, 'image/png');
          formData.append(`logo_${i}`, preparedLogo as any);
        }
      }

      // Music tracks
      if (musicTracks.length > 0) {
        // Attach music track files
        for (let i = 0; i < musicTracks.length; i++) {
          const track = musicTracks[i];
          const preparedMusic = await prepareFileForUpload(track.uri, 'audio/x-m4a');
          formData.append(`music_${i}`, preparedMusic as any);
        }

        // Music tracks JSON
        const musicTracksPayload = musicTracks.map((t, idx) => ({
          id: t.id,
          fileKey: `music_${idx}`,
          startTime: t.startTime,
          endTime: t.endTime,
          volume: t.volume
        }));
        formData.append('musicTracks', JSON.stringify(musicTracksPayload));
      } else {
        formData.append('musicTracks', '[]');
      }

      // Original video volume
      formData.append('sourceAudioVolume', String(volume));

      // Make process request to fastapi backend
      console.log('Sending process request to https://ai.flarelap.com/video/process...');
      const response = await fetch('https://ai.flarelap.com/video/process', {
        method: 'POST',
        body: formData,
        headers: {
          Accept: 'video/mp4, application/json'
        }
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(errText || `Server error HTTP ${response.status}`);
      }

      let processedVideoUri = await saveBlobResponseAsVideo(response);
      console.log('Video processed successfully:', processedVideoUri);

      // If we have merge clips, perform sequential call to /video/merge
      const mergeClipsList = [
        ...videoMergeClips.start.map((c, idx) => ({ ...c, order: idx })),
        ...videoMergeClips.end.map((c, idx) => ({ ...c, order: idx }))
      ];

      if (mergeClipsList.length > 0) {
        console.log('Sending merge request to https://ai.flarelap.com/video/merge...');
        const mergeFormData = new FormData();

        // 1. Processed video file from step 1
        const preparedBase = await prepareFileForUpload(processedVideoUri, 'video/mp4');
        mergeFormData.append('video', preparedBase as any);

        // 2. Merge clips JSON
        const mergeClipsConfig = mergeClipsList.map((clip, index) => ({
          fileKey: `clip_${index}`,
          position: clip.position,
          order: clip.order
        }));
        mergeFormData.append('mergeClips', JSON.stringify(mergeClipsConfig));

        // 3. Attach merge clip files
        for (let i = 0; i < mergeClipsList.length; i++) {
          const clip = mergeClipsList[i];
          const preparedClip = await prepareFileForUpload(clip.uri, 'video/mp4');
          mergeFormData.append(`clip_${i}`, preparedClip as any);
        }

        const mergeResponse = await fetch('https://ai.flarelap.com/video/merge', {
          method: 'POST',
          body: mergeFormData,
          headers: {
            Accept: 'video/mp4, application/json'
          }
        });

        if (!mergeResponse.ok) {
          const errText = await mergeResponse.text();
          throw new Error(`Merge failed: ${errText || mergeResponse.status}`);
        }

        const finalVideoUri = await saveBlobResponseAsVideo(mergeResponse);
        // Clean up step 1 processed file
        try {
          const RNFS = require('react-native-fs');
          await RNFS.unlink(processedVideoUri.replace('file://', ''));
        } catch { }
        processedVideoUri = finalVideoUri;
      }

      // Save final video to device (public storage & MediaScanner on Android)
      const savedResult = await saveVideoToDevice(processedVideoUri);

      const handleShareVideo = async () => {
        try {
          await Share.open({
            url: `file://${savedResult.path}`,
            type: 'video/mp4',
            title: 'Share Video',
          });
        } catch (shareErr: any) {
          console.warn('Share video failed', shareErr);
          const isCancel =
            shareErr?.message?.toLowerCase().includes('cancel') ||
            shareErr?.toString().toLowerCase().includes('cancel');
          if (!isCancel) {
            Alert.alert('Share Failed', 'Could not share the video.');
          }
        }
      };

      Alert.alert(
        'Video Saved',
        `Your video has been saved to your device (${savedResult.location}):\n\n${savedResult.filename}`,
        [
          { text: 'Share Video', onPress: handleShareVideo },
          { text: 'Done', style: 'default' },
        ],
      );
    } catch (err: any) {
      console.error('Export Error:', err);
      Alert.alert('Export Failed', err.message || 'Something went wrong. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  // ─── Render ───────────────────────────────────────────────────────────────────
  const selectedItem = overlays.find(o => o.id === selectedOverlay) ?? null;

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>

        {/* ── Header ── */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation?.goBack()} style={styles.hBtn}>
            <Icon.Back size={20} />
          </TouchableOpacity>
          <Title style={styles.hTitle}>Video Editor</Title>
          <View style={styles.hRight}>
            <TouchableOpacity
              onPress={() => applyHistory(historyIdx - 1)}
              disabled={historyIdx <= 0}
              style={[styles.hBtn, historyIdx <= 0 && styles.disabled]}
            >
              <Icon.Undo size={18} color={historyIdx <= 0 ? '#475569' : '#F8FAFC'} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => applyHistory(historyIdx + 1)}
              disabled={historyIdx >= history.length - 1}
              style={[styles.hBtn, historyIdx >= history.length - 1 && styles.disabled]}
            >
              <Icon.Redo size={18} color={historyIdx >= history.length - 1 ? '#475569' : '#F8FAFC'} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleExport}
              disabled={!videoUri || exporting}
              style={[styles.exportBtn, (!videoUri || exporting) && styles.disabled]}
            >
              {exporting
                ? <ActivityIndicator size="small" color="#fff" />
                : <Icon.Check size={16} />}
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Video Preview Canvas ── */}
        <View style={styles.canvasArea}>
          {/* <Video
            key={`${playbackUri}_${videoKeySeed}`}
            ref={videoRef}
            source={videoSource}
            style={[styles.videoFill, { width: PREVIEW_W, height: PREVIEW_H }]}
            paused={paused}
            muted={muted}
            volume={volume}
            rate={playbackRate}
            useTextureView={Platform.OS === 'android' ? useTexture : undefined}
            resizeMode="cover"
            repeat={false}
            controls={false}
            onLoad={handleVideoLoad}
            onReadyForDisplay={handleVideoReady}
            onProgress={handleVideoProgress}
            onEnd={handleVideoEnd}
            onLoadStart={handleVideoLoadStart}
            onBuffer={handleVideoBuffer}
            onError={handleVideoError}
          /> */}
          {videoUri ? (
            <View style={[ { width: PREVIEW_W, height: PREVIEW_H }]}>
              {/* Native video player */}
              {videoUri && (
                <Video
                  key={`${playbackUri}_${videoKeySeed}`}
                  ref={videoRef}
                  source={videoSource}
                  style={{ width: '100%', height: '100%' }}
                  paused={paused}
                  muted={muted}
                  volume={volume}
                  rate={playbackRate}
                  useTextureView={Platform.OS === 'android' ? useTexture : undefined}
                  resizeMode="cover"
                  repeat={false}
                  controls={false}
                  onLoad={handleVideoLoad}
                  // onReadyForDisplay={handleVideoReady}
                  onProgress={handleVideoProgress}
                  onEnd={handleVideoEnd}
                  onLoadStart={handleVideoLoadStart}
                  onBuffer={handleVideoBuffer}
                  onError={handleVideoError}
                />
              )}

              {/* Synced music preview tracks */}
              {musicTracks.map(track => {
                const isPlaying = !paused && currentTime >= track.startTime && currentTime <= track.endTime;
                return (
                  <Video
                    {...({
                      key: track.id,
                      ref: (r: any) => { if (r) audioRefs.current[track.id] = r; },
                      source: { uri: track.uri },
                      audioOnly: true,
                      paused: !isPlaying,
                      volume: muted ? 0 : track.volume * musicVolume,
                      rate: playbackRate,
                      repeat: false
                    } as any)}
                  />
                );
              })}

              {/* Overlay dim for filter badge */}
              {filterPreset !== 'none' && (
                <View style={[styles.filterBadge]} pointerEvents="none">
                  <Text style={styles.filterBadgeText}>{FILTER_PRESETS.find(f => f.id === filterPreset)?.name}</Text>
                </View>
              )}

              {/* Deselect tap target — only intercept touches when overlays exist, otherwise let touches reach player */}
              {overlays.length > 0 && (
                <TouchableOpacity
                  activeOpacity={1}
                  style={StyleSheet.absoluteFillObject}
                  onPress={() => setSelectedOverlay(null)}
                />
              )}
              {/* Overlays */}
              <View style={StyleSheet.absoluteFillObject} pointerEvents="box-none">
                {overlays
                  .filter(o => currentTime >= o.startTime && currentTime <= o.endTime)
                  .map(o => (
                    <MovableOverlay
                      key={o.id}
                      item={o}
                      selected={selectedOverlay === o.id}
                      onSelect={setSelectedOverlay}
                      onUpdate={updateOverlay}
                      onDelete={deleteOverlay}
                      onCommit={() => commitHistory()}
                    />
                  ))}
              </View>

              {/* Loading/Error */}
              {videoLoading && (
                <View style={styles.videoOverlay}>
                  <ActivityIndicator size="large" color="#df103f" />
                </View>
              )}
              {videoError && (
                <View style={styles.videoOverlay}>
                  <Text style={styles.errorText}>⚠ {videoError}</Text>
                </View>
              )}
              {/* Debug info (temporary) */}
              {/* <View style={styles.debugPanel} pointerEvents="none">
                <Text style={styles.debugText} numberOfLines={2}>URI: {videoUri ?? '—'}</Text>
                <Text style={styles.debugText}>Loading: {videoLoading ? 'yes' : 'no'}  Error: {videoError ? 'yes' : 'no'}</Text>
                <Text style={styles.debugText}>Duration: {duration ? formatTime(duration) : '—'}  Texture: {Platform.OS === 'android' ? (useTexture ? 'ON' : 'OFF') : 'n/a'}</Text>
              </View> */}
            </View>
          ) : (
            /* Empty state */
            <View style={{ width: PREVIEW_W, height: screenHeight * 0.72 }}>
              <ScrollView
                style={{ flex: 1 }}
                contentContainerStyle={[styles.emptyCanvas, { paddingVertical: 16, paddingBottom: 16 }]}
                showsVerticalScrollIndicator={false}
              >
                <Icon.Video size={48} color="#334155" />
                <Title style={styles.emptyTitle}>No Video Selected</Title>
                <Text style={styles.emptySub}>Pick from gallery, record with camera, or use a template to start editing</Text>

                {/* Inline templates grid so users can pick templates without opening modal */}
                <View style={[styles.templatesRow, { alignSelf: 'stretch' }]}>
                  <Text style={styles.templateHeading}>Templates</Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', paddingHorizontal: 6 }}>
                    {VIDEOS_TEMPLATES.map(t => (
                      <TouchableOpacity key={t.id} style={{ width: '48%', marginBottom: 10 }} onPress={() => selectTemplate(t)}>
                        <View style={[styles.templateCard, { width: '100%', marginRight: 0 }]}>
                          <View style={[styles.templateThumb, { width: '100%', height: 100, position: 'relative', overflow: 'hidden' }]}>
                            {t.thumbnail ? (
                              <RNImage
                                source={getThumbnailSource(t.thumbnail)}
                                style={StyleSheet.absoluteFillObject}
                                resizeMode="cover"
                              />
                            ) : null}
                            <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.15)' }}>
                              <Icon.Play size={16} color="#fff" />
                            </View>
                          </View>
                          <Text style={styles.templateTitle} numberOfLines={1}>{t.title}</Text>
                        </View>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </ScrollView>

              {/* Fixed bottom action buttons */}
              <View style={styles.emptyActions}>
                <TouchableOpacity style={styles.emptyBtn} onPress={pickVideo}>
                  <Icon.Video size={18} color="#fff" />
                  <Text style={styles.emptyBtnLabel}>Gallery</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.emptyBtn, { backgroundColor: '#df103f' }]} onPress={handleOpenCustomCamera}>
                  <Icon.Camera size={18} color="#fff" />
                  <Text style={styles.emptyBtnLabel}>Record</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.emptyBtn, { backgroundColor: '#10B981' }]} onPress={openSlideshowModal}>
                  <Icon.Image size={18} color="#fff" />
                  <Text style={styles.emptyBtnLabel}>Slideshow</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>

        {/* ── Playback Controls ── */}
        {videoUri && (
          <View style={styles.playbackBar}>
            {/* Timeline Scrubber */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, marginBottom: 4 }}>
              <RNText style={{ color: '#94A3B8', fontSize: 11 }}>{formatTime(currentTime)}</RNText>
              
              <TouchableOpacity
                onPress={() => setShowTimeline(s => !s)}
                style={{
                  padding: 6,
                  backgroundColor: '#1E293B',
                  borderRadius: 6,
                  borderWidth: 1,
                  borderColor: '#334155',
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                {showTimeline ? <Icon.Eye size={16} /> : <Icon.EyeOff size={16} />}
              </TouchableOpacity>

              <RNText style={{ color: '#94A3B8', fontSize: 11 }}>{formatTime(duration)}</RNText>
            </View>

            {showTimeline && (
              <View style={tl.container}>
                <View style={tl.playhead}>
                  <View style={tl.playheadCap} />
                </View>

                <ScrollView
                  ref={timelineScrollRef}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  scrollEventThrottle={16}
                  onScroll={handleTimelineScroll}
                  onScrollBeginDrag={() => { isDraggingTimeline.current = true; }}
                  onScrollEndDrag={() => { isDraggingTimeline.current = false; }}
                  onMomentumScrollEnd={() => { isDraggingTimeline.current = false; }}
                  contentContainerStyle={{ paddingLeft: playheadCenter, paddingRight: playheadCenter }}
                >
                  <View style={{ width: Math.max(screenWidth - 32, duration * TIMELINE_SCALE), height: 135, position: 'relative' }}>
                    {/* Ruler track */}
                    <View style={tl.ruler}>
                      {Array.from({ length: Math.ceil(duration) + 1 }).map((_, i) => {
                        if (i % 5 !== 0) return null;
                        return (
                          <View key={i} style={[tl.tick, { left: i * TIMELINE_SCALE }]}>
                            <View style={tl.tickLine} />
                            <RNText style={tl.tickText}>{formatTime(i)}</RNText>
                          </View>
                        );
                      })}
                    </View>

                    {/* Video Lane */}
                    <View style={[tl.lane, tl.videoLane]}>
                      <RNText style={tl.laneLabel}>Video</RNText>
                      <View
                        style={[
                          tl.videoTrimmedBg,
                          {
                            left: (trimStart / 100) * duration * TIMELINE_SCALE,
                            width: ((trimEnd - trimStart) / 100) * duration * TIMELINE_SCALE,
                          },
                        ]}
                      />
                    </View>

                    {/* Text Overlays Lane */}
                    <View style={tl.lane}>
                      <RNText style={tl.laneLabel}>Texts</RNText>
                      {overlays
                        .filter(o => o.type === 'text')
                        .map(o => {
                          const isSelected = selectedOverlay === o.id;
                          return (
                            <TouchableOpacity
                              key={o.id}
                              style={[
                                tl.block,
                                tl.textBlock,
                                {
                                  left: o.startTime * TIMELINE_SCALE,
                                  width: Math.max(30, (o.endTime - o.startTime) * TIMELINE_SCALE),
                                },
                                isSelected && tl.selectedBlock,
                              ]}
                              onPress={() => {
                                setSelectedOverlay(o.id);
                                videoRef.current?.seek(o.startTime);
                                setCurrentTime(o.startTime);
                              }}
                            >
                              <RNText numberOfLines={1} style={tl.blockText}>
                                {o.text || 'Text'}
                              </RNText>
                            </TouchableOpacity>
                          );
                        })}
                    </View>

                    {/* Image/Emoji Overlays Lane */}
                    <View style={tl.lane}>
                      <RNText style={tl.laneLabel}>Images & Emojis</RNText>
                      {overlays
                        .filter(o => o.type === 'image' || o.type === 'emoji')
                        .map(o => {
                          const isSelected = selectedOverlay === o.id;
                          return (
                            <TouchableOpacity
                              key={o.id}
                              style={[
                                tl.block,
                                o.type === 'emoji' ? tl.textBlock : tl.imageBlock,
                                {
                                  left: o.startTime * TIMELINE_SCALE,
                                  width: Math.max(30, (o.endTime - o.startTime) * TIMELINE_SCALE),
                                },
                                isSelected && tl.selectedBlock,
                              ]}
                              onPress={() => {
                                setSelectedOverlay(o.id);
                                videoRef.current?.seek(o.startTime);
                                setCurrentTime(o.startTime);
                              }}
                            >
                              <RNText numberOfLines={1} style={tl.blockText}>
                                {o.type === 'emoji' ? `Emoji ${o.text || ''}` : 'Image'}
                              </RNText>
                            </TouchableOpacity>
                          );
                        })}
                    </View>

                    {/* Audio/Music Lane */}
                    <View style={tl.lane}>
                      <RNText style={tl.laneLabel}>Audio</RNText>
                      {musicTracks.map(track => {
                        const isSelected = selectedMusicTrack === track.id;
                        return (
                          <TouchableOpacity
                            key={track.id}
                            style={[
                              tl.block,
                              tl.audioBlock,
                              {
                                left: track.startTime * TIMELINE_SCALE,
                                width: Math.max(30, (track.endTime - track.startTime) * TIMELINE_SCALE),
                              },
                              isSelected && tl.selectedBlock,
                            ]}
                            onPress={() => {
                              setSelectedMusicTrack(track.id);
                              videoRef.current?.seek(track.startTime);
                              setCurrentTime(track.startTime);
                            }}
                          >
                            <RNText numberOfLines={1} style={tl.blockText}>
                              {track.name} ({(track.volume * 100).toFixed(0)}%)
                            </RNText>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>
                </ScrollView>
              </View>
            )}

            {/* Controls row */}
            <View style={styles.ctrlRow}>
              <TouchableOpacity onPress={() => setMuted(m => !m)} style={styles.ctrlBtn}>
                {muted ? <Icon.Mute size={20} color="#94A3B8" /> : <Icon.Volume size={20} color="#F8FAFC" />}
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => { const t = Math.max(0, currentTime - 10); setCurrentTime(t); videoRef.current?.seek(t); }}
                style={styles.ctrlBtn}
              >
                <Text style={styles.ctrlLabel}>-10s</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.playBtn}
                onPress={() => {
                  setPaused(p => {
                    const next = !p;
                    // if we are about to play, nudge a tiny seek after unpause
                    if (!next) {
                      setTimeout(() => { try { videoRef.current?.seek((currentTime || 0) + 0.001); } catch { } }, 80);
                    }
                    return next;
                  });
                }}
              >
                {paused ? <Icon.Play size={26} /> : <Icon.Pause size={26} />}
              </TouchableOpacity>

              {/* Toggle rendering mode (helps diagnose Android blank frame issues) */}
              {Platform.OS === 'android' && (
                <TouchableOpacity style={styles.ctrlBtn} onPress={() => setUseTexture(u => !u)}>
                  <Text style={{ color: useTexture ? '#df103f' : '#94A3B8', fontSize: 11, fontWeight: '700' }}>{useTexture ? 'Texture ON' : 'Texture OFF'}</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                onPress={() => { const t = Math.min(duration, currentTime + 10); setCurrentTime(t); videoRef.current?.seek(t); }}
                style={styles.ctrlBtn}
              >
                <Text style={styles.ctrlLabel}>+10s</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => { setCurrentTime(0); setPaused(true); videoRef.current?.seek(0); }}
                style={styles.ctrlBtn}
              >
                <Text style={styles.ctrlLabel}>↺</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* ── Bottom Editing Deck ── */}
        {videoUri && (
          <View style={styles.deck}>
            <ScrollView style={styles.panelBody} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

              {/* ── VIDEO TAB ── */}
              {activeTab === 'video' && (
                <View style={styles.panel}>
                  <Text style={styles.panelTitle}>Source Video</Text>
                  <View style={styles.rowBtns}>
                    <TouchableOpacity style={styles.srcBtn} onPress={pickVideo}>
                      <Icon.Video size={18} color="#fff" />
                      <Text style={styles.srcBtnLabel}>Change Video</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.srcBtn, { backgroundColor: '#1E293B', borderColor: '#334155', borderWidth: 1 }]} onPress={handleOpenCustomCamera}>
                      <Icon.Camera size={18} color="#F8FAFC" />
                      <Text style={[styles.srcBtnLabel, { color: '#F8FAFC' }]}>Record</Text>
                    </TouchableOpacity>
                  </View>
                  <View style={{ marginTop: 10 }}>
                    <TouchableOpacity style={[styles.srcBtn, { backgroundColor: '#0F172A' }]} onPress={() => setTemplatesModalVisible(true)}>
                      <Icon.Video size={18} color="#fff" />
                      <Text style={styles.srcBtnLabel}>Use Template</Text>
                    </TouchableOpacity>
                  </View>
                  <CustomSlider label="Trim Start" min={0} max={Math.min(99, trimEnd - 1)} step={1} value={trimStart} onChange={(val) => { setTrimStart(val); commitHistory({ trimStart: val }); }} suffix="%" />
                  <CustomSlider label="Trim End" min={Math.max(1, trimStart + 1)} max={100} step={1} value={trimEnd} onChange={(val) => { setTrimEnd(val); commitHistory({ trimEnd: val }); }} suffix="%" />
                  <CustomSlider label="Volume" min={0} max={1} step={0.05} value={volume} onChange={setVolume} suffix="%" />

                  <Text style={[styles.subTitle, { marginTop: 16 }]}>Merge Intro/Outro Videos</Text>
                  <View style={[styles.rowBtns, { marginBottom: 8 }]}>
                    <TouchableOpacity style={[styles.srcBtn, { backgroundColor: '#1E293B' }]} onPress={() => addMergeClip('start')}>
                      <Icon.Video size={16} color="#fff" />
                      <Text style={styles.srcBtnLabel}>Add Intro Clip</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.srcBtn, { backgroundColor: '#1E293B' }]} onPress={() => addMergeClip('end')}>
                      <Icon.Video size={16} color="#fff" />
                      <Text style={styles.srcBtnLabel}>Add Outro Clip</Text>
                    </TouchableOpacity>
                  </View>

                  {/* Start Clips List */}
                  {videoMergeClips.start.length > 0 && (
                    <View style={{ marginVertical: 6 }}>
                      <Text style={{ fontSize: 11, color: '#94A3B8', fontWeight: 'bold' }}>Intro Clips:</Text>
                      {videoMergeClips.start.map((clip) => (
                        <View key={clip.id} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 4 }}>
                          <RNText numberOfLines={1} style={{ color: '#F8FAFC', fontSize: 12, flex: 1 }}>
                            ⏮ {clip.name}
                          </RNText>
                          <TouchableOpacity onPress={() => deleteMergeClip('start', clip.id)} style={{ paddingHorizontal: 8 }}>
                            <RNText style={{ color: '#EF4444', fontSize: 12 }}>Remove</RNText>
                          </TouchableOpacity>
                        </View>
                      ))}
                    </View>
                  )}

                  {/* End Clips List */}
                  {videoMergeClips.end.length > 0 && (
                    <View style={{ marginVertical: 6 }}>
                      <Text style={{ fontSize: 11, color: '#94A3B8', fontWeight: 'bold' }}>Outro Clips:</Text>
                      {videoMergeClips.end.map((clip) => (
                        <View key={clip.id} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 4 }}>
                          <RNText numberOfLines={1} style={{ color: '#F8FAFC', fontSize: 12, flex: 1 }}>
                            ⏭ {clip.name}
                          </RNText>
                          <TouchableOpacity onPress={() => deleteMergeClip('end', clip.id)} style={{ paddingHorizontal: 8 }}>
                            <RNText style={{ color: '#EF4444', fontSize: 12 }}>Remove</RNText>
                          </TouchableOpacity>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              )}

              {/* ── OVERLAYS TAB ── */}
              {activeTab === 'overlays' && (
                <View style={styles.panel}>
                  <Text style={styles.panelTitle}>Add Overlays</Text>
                  <View style={styles.rowBtns}>
                    <TouchableOpacity style={[styles.srcBtn, { paddingVertical: 8 }]} onPress={() => setTextModalVisible(true)}>
                      <Icon.Text size={16} color="#fff" />
                      <Text style={[styles.srcBtnLabel, { fontSize: 13 }]}>Add Text</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.srcBtn, { backgroundColor: '#1E293B', borderColor: '#334155', borderWidth: 1, paddingVertical: 8 }]} onPress={pickImageOverlay}>
                      <Icon.Image size={16} color="#F8FAFC" />
                      <Text style={[styles.srcBtnLabel, { color: '#F8FAFC', fontSize: 13 }]}>Add Image</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.srcBtn, { backgroundColor: '#1E293B', borderColor: '#334155', borderWidth: 1, paddingVertical: 8 }]} onPress={() => setEmojiModalVisible(true)}>
                      <Icon.Smile size={16} color="#F8FAFC" />
                      <Text style={[styles.srcBtnLabel, { color: '#F8FAFC', fontSize: 13 }]}>Add Emoji</Text>
                    </TouchableOpacity>
                  </View>

                  {/* Selected text overlay editor */}
                  {selectedItem?.type === 'text' && (
                    <View style={styles.overlayEditor}>
                      <Text style={styles.subTitle}>Edit Text Overlay</Text>
                      <RNTextInput
                        value={selectedItem.text}
                        onChangeText={t => updateOverlay(selectedItem.id, { text: t })}
                        style={styles.inlineTextInput}
                        placeholderTextColor="#475569"
                        placeholder="Overlay text..."
                      />
                      <CustomSlider label="Font Size" min={10} max={72} step={1} value={selectedItem.fontSize ?? 18} onChange={v => updateOverlay(selectedItem.id, { fontSize: v })} />
                      <View style={styles.rowBtns}>
                        <TouchableOpacity
                          style={[styles.toggleBtn, selectedItem.bold && styles.toggleActive]}
                          onPress={() => updateOverlay(selectedItem.id, { bold: !selectedItem.bold })}
                        >
                          <Text style={[styles.toggleLabel, selectedItem.bold && styles.toggleActiveLabel]}>B Bold</Text>
                        </TouchableOpacity>
                      </View>
                      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.colorRow}>
                        {PRESET_COLORS.map(c => (
                          <TouchableOpacity key={c} onPress={() => updateOverlay(selectedItem.id, { color: c })}
                            style={[styles.colorDot, { backgroundColor: c }, selectedItem.color === c && styles.colorDotActive]} />
                        ))}
                      </ScrollView>
                      <CustomSlider label="Start Time (Video Offset)" min={0} max={Math.max(0, (selectedItem.endTime || 10) - 0.5)} step={0.1} value={selectedItem.startTime ?? 0} onChange={v => updateOverlay(selectedItem.id, { startTime: v })} suffix="s" />
                      <CustomSlider label="End Time (Video Offset)" min={(selectedItem.startTime ?? 0) + 0.5} max={duration || 10} step={0.1} value={selectedItem.endTime ?? (duration || 10)} onChange={v => updateOverlay(selectedItem.id, { endTime: v })} suffix="s" />
                      <TouchableOpacity style={styles.deleteBtn} onPress={() => deleteOverlay(selectedItem.id)}>
                        <Icon.Trash size={14} color="#fff" />
                        <Text style={styles.deleteBtnLabel}>Remove Overlay</Text>
                      </TouchableOpacity>
                    </View>
                  )}

                  {/* Selected image/emoji overlay editor */}
                  {(selectedItem?.type === 'image' || selectedItem?.type === 'emoji') && (
                    <View style={styles.overlayEditor}>
                      <Text style={styles.subTitle}>
                        {selectedItem.type === 'emoji' ? 'Edit Emoji Sticker' : 'Edit Image Overlay'}
                      </Text>
                      <CustomSlider label="Opacity" min={0.1} max={1} step={0.05} value={selectedItem.opacity ?? 1} onChange={v => updateOverlay(selectedItem.id, { opacity: v })} />
                      {selectedItem.type === 'image' && (
                        <CustomSlider label="Corner Radius" min={0} max={60} step={1} value={selectedItem.borderRadius ?? 0} onChange={v => updateOverlay(selectedItem.id, { borderRadius: v })} />
                      )}
                      <CustomSlider label="Start Time (Video Offset)" min={0} max={Math.max(0, (selectedItem.endTime || 10) - 0.5)} step={0.1} value={selectedItem.startTime ?? 0} onChange={v => updateOverlay(selectedItem.id, { startTime: v })} suffix="s" />
                      <CustomSlider label="End Time (Video Offset)" min={(selectedItem.startTime ?? 0) + 0.5} max={duration || 10} step={0.1} value={selectedItem.endTime ?? (duration || 10)} onChange={v => updateOverlay(selectedItem.id, { endTime: v })} suffix="s" />
                      <TouchableOpacity style={styles.deleteBtn} onPress={() => deleteOverlay(selectedItem.id)}>
                        <Icon.Trash size={14} color="#fff" />
                        <Text style={styles.deleteBtnLabel}>Remove Overlay</Text>
                      </TouchableOpacity>
                    </View>
                  )}

                  {overlays.length === 0 && (
                    <View style={styles.emptyPanel}>
                      <Text style={styles.emptyPanelText}>No overlays added yet. Tap "Add Text" or "Add Image" above.</Text>
                    </View>
                  )}
                </View>
              )}

              {/* ── MUSIC TAB ── */}
              {activeTab === 'music' && (
                <View style={styles.panel}>
                  <Text style={styles.panelTitle}>Background Music</Text>

                  <TouchableOpacity
                    style={[styles.srcBtn, { marginBottom: 12 }]}
                    onPress={() => {
                      setMusicSelectMode('editor');
                      setITunesModalVisible(true);
                    }}
                  >
                    <Icon.Music size={18} color="#fff" />
                    <Text style={styles.srcBtnLabel}>Search & Add iTunes Music</Text>
                  </TouchableOpacity>

                  {musicTracks.length > 0 && (
                    <View style={{ marginBottom: 16 }}>
                      <Text style={styles.subTitle}>Tracks List</Text>
                      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingVertical: 4 }}>
                        {musicTracks.map(t => {
                          const isSelected = selectedMusicTrack === t.id;
                          return (
                            <TouchableOpacity
                              key={t.id}
                              style={[styles.musicCard, isSelected && styles.musicCardActive, { width: 120, height: 70 }]}
                              onPress={() => setSelectedMusicTrack(t.id)}
                            >
                              <Text style={[styles.musicName, isSelected && styles.musicNameActive]} numberOfLines={1}>
                                {t.name}
                              </Text>
                              <Text style={styles.musicDur}>
                                {t.startTime.toFixed(1)}s - {t.endTime.toFixed(1)}s
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </ScrollView>
                    </View>
                  )}

                  {/* Selected Track Editor */}
                  {(() => {
                    const track = musicTracks.find(t => t.id === selectedMusicTrack);
                    if (!track) return null;
                    return (
                      <View style={styles.overlayEditor}>
                        <Text style={styles.subTitle}>Edit Music Track: {track.name}</Text>

                        <CustomSlider
                          label="Volume"
                          min={0}
                          max={1}
                          step={0.05}
                          value={track.volume}
                          onChange={v => updateMusicTrack(track.id, { volume: v })}
                          suffix="%"
                        />

                        <CustomSlider
                          label="Start Time (Video Offset)"
                          min={0}
                          max={Math.max(0, track.endTime - 0.5)}
                          step={0.1}
                          value={track.startTime}
                          onChange={v => updateMusicTrack(track.id, { startTime: v })}
                          suffix="s"
                        />

                        <CustomSlider
                          label="End Time (Video Offset)"
                          min={track.startTime + 0.5}
                          max={duration || 10}
                          step={0.1}
                          value={track.endTime}
                          onChange={v => updateMusicTrack(track.id, { endTime: v })}
                          suffix="s"
                        />

                        <TouchableOpacity
                          style={styles.deleteBtn}
                          onPress={() => deleteMusicTrack(track.id)}
                        >
                          <Icon.Trash size={14} color="#fff" />
                          <Text style={styles.deleteBtnLabel}>Remove Music Track</Text>
                        </TouchableOpacity>
                      </View>
                    );
                  })()}

                  {musicTracks.length === 0 && (
                    <View style={styles.emptyPanel}>
                      <Text style={styles.emptyPanelText}>No background music tracks added yet.</Text>
                    </View>
                  )}
                </View>
              )}

              {/* ── FILTER TAB ── */}
              {activeTab === 'filter' && (
                <View style={styles.panel}>
                  <Text style={styles.panelTitle}>Color Filters</Text>
                  <Text style={styles.filterNote}>Filters are applied server-side via FFmpeg during export.</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
                    {FILTER_PRESETS.map(f => (
                      <TouchableOpacity
                        key={f.id}
                        style={[styles.filterCard, filterPreset === f.id && styles.filterCardActive]}
                        onPress={() => { setFilterPreset(f.id); commitHistory({ filter: f.id }); }}
                      >
                        <View style={[styles.filterSwatch, { backgroundColor: f.color }]} />
                        <Text style={[styles.filterName, filterPreset === f.id && styles.filterNameActive]}>{f.name}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}

              {/* ── SPEED TAB ── */}
              {activeTab === 'speed' && (
                <View style={styles.panel}>
                  <Text style={styles.panelTitle}>Playback Speed</Text>
                  <View style={styles.speedRow}>
                    {SPEED_OPTIONS.map(s => (
                      <TouchableOpacity
                        key={s.value}
                        style={[styles.speedBtn, playbackRate === s.value && styles.speedBtnActive]}
                        onPress={() => setPlaybackRate(s.value)}
                      >
                        <Text style={[styles.speedLabel, playbackRate === s.value && styles.speedLabelActive]}>{s.label}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                  <Text style={styles.filterNote}>Speed is sent to the backend for FFmpeg time-scaling during export.</Text>
                </View>
              )}

              {/* ── EXPORT TAB ── */}
              {activeTab === 'export' && (
                <View style={styles.panel}>
                  <Text style={styles.panelTitle}>Export Settings</Text>

                  {/* Summary */}
                  <View style={styles.summaryCard}>
                    <SummaryRow label="Filter" value={FILTER_PRESETS.find(f => f.id === filterPreset)?.name ?? 'None'} />
                    <SummaryRow label="Music" value={musicTracks.length > 0 ? `${musicTracks.length} track(s)` : 'None'} />
                    <SummaryRow label="Speed" value={`${playbackRate}×`} />
                    <SummaryRow label="Overlays" value={`${overlays.length} element(s)`} />
                  </View>

                  <Button
                    mode="contained"
                    buttonColor="#df103f"
                    textColor="#fff"
                    style={styles.exportFullBtn}
                    loading={exporting}
                    disabled={exporting}
                    onPress={handleExport}
                    icon={() => <Icon.Export size={16} color="#fff" />}
                  >
                    {exporting ? 'Processing with FFmpeg…' : 'Export & Render Video'}
                  </Button>

                  <Text style={styles.exportNote}>
                    Your video + all overlays and effects are sent to the Flarelap backend for high-quality FFmpeg rendering. Processing may take 30–90 seconds.
                  </Text>
                </View>
              )}

            </ScrollView>

            {/* ── Tab Strip ── */}
            <View style={styles.tabStrip}>
              {([
                { id: 'video', Icon: Icon.Video, label: 'Video' },
                { id: 'overlays', Icon: Icon.Text, label: 'Overlays' },
                { id: 'music', Icon: Icon.Music, label: 'Music' },
                { id: 'filter', Icon: Icon.Filter, label: 'Filter' },
                { id: 'speed', Icon: Icon.Speed, label: 'Speed' },
                { id: 'export', Icon: Icon.Export, label: 'Export' },
              ] as const).map(tab => {
                const active = activeTab === tab.id;
                return (
                  <TouchableOpacity key={tab.id} style={styles.tabItem} onPress={() => setActiveTab(tab.id)}>
                    <tab.Icon size={20} color={active ? '#df103f' : '#475569'} />
                    <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>{tab.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

      </KeyboardAvoidingView>

      {/* ── Slideshow Generator Modal ── */}
      <Modal visible={slideshowModalVisible} animationType="slide" transparent onRequestClose={() => { if (!generatingSlideshow) setSlideshowModalVisible(false); }}>
        <View style={styles.modalBg}>
          <View style={[styles.modalCard, { height: '80%', display: 'flex', flexDirection: 'column' }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <Title style={styles.modalTitle}>Create Video from Images</Title>
              <TouchableOpacity disabled={generatingSlideshow} onPress={() => setSlideshowModalVisible(false)} style={{ padding: 4 }}>
                <Icon.Close size={20} color="#94A3B8" />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 20 }} showsVerticalScrollIndicator={false}>
              <TouchableOpacity disabled={generatingSlideshow} style={[styles.srcBtn, { backgroundColor: '#10B981', marginVertical: 10 }]} onPress={pickSlideshowImages}>
                <Icon.Image size={18} color="#fff" />
                <Text style={styles.srcBtnLabel}>+ Add Images</Text>
              </TouchableOpacity>

              {slideshowImages.length === 0 ? (
                <View style={{ alignItems: 'center', marginVertical: 40 }}>
                  <Text style={{ color: '#64748B', fontSize: 14 }}>No images added yet.</Text>
                </View>
              ) : (
                slideshowImages.map((img, index) => (
                  <View key={img.id} style={{ backgroundColor: '#1E293B', borderRadius: 10, padding: 12, marginBottom: 12, borderWidth: 1, borderColor: '#334155' }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                      <RNImage source={{ uri: img.uri }} style={{ width: 60, height: 60, borderRadius: 6, backgroundColor: '#000' }} resizeMode="cover" />
                      
                      <View style={{ flex: 1, marginLeft: 12 }}>
                        <Text style={{ color: '#F8FAFC', fontSize: 13, fontWeight: '700', marginBottom: 4 }}>Image #{index + 1}</Text>
                        
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                          <Text style={{ color: '#94A3B8', fontSize: 12, marginRight: 8 }}>Duration:</Text>
                          <TouchableOpacity disabled={generatingSlideshow} style={{ padding: 4, backgroundColor: '#0F172A', borderRadius: 4 }} onPress={() => {
                            setSlideshowImages(prev => prev.map(item => item.id === img.id ? { ...item, duration: Math.max(0.5, item.duration - 0.5) } : item));
                          }}>
                            <Text style={{ color: '#F8FAFC', fontWeight: 'bold', fontSize: 12 }}> - </Text>
                          </TouchableOpacity>
                          <Text style={{ color: '#F8FAFC', fontSize: 12, marginHorizontal: 8, fontWeight: '700' }}>{img.duration}s</Text>
                          <TouchableOpacity disabled={generatingSlideshow} style={{ padding: 4, backgroundColor: '#0F172A', borderRadius: 4 }} onPress={() => {
                            setSlideshowImages(prev => prev.map(item => item.id === img.id ? { ...item, duration: item.duration + 0.5 } : item));
                          }}>
                            <Text style={{ color: '#F8FAFC', fontWeight: 'bold', fontSize: 12 }}> + </Text>
                          </TouchableOpacity>
                        </View>
                      </View>

                      <TouchableOpacity disabled={generatingSlideshow} style={{ padding: 6 }} onPress={() => {
                        setSlideshowImages(prev => prev.filter(item => item.id !== img.id));
                      }}>
                        <Icon.Trash size={18} color="#EF4444" />
                      </TouchableOpacity>
                    </View>

                    <View style={{ marginTop: 8 }}>
                      <Text style={{ color: '#94A3B8', fontSize: 11, marginBottom: 4 }}>Animation / Effect:</Text>
                      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
                        {['fade', 'zoom_in', 'zoom_out', 'spin', 'rotate_swing', 'pan_right', 'pan_left', 'none'].map((effectName) => {
                          const active = img.effect === effectName;
                          return (
                            <TouchableOpacity
                              key={effectName}
                              disabled={generatingSlideshow}
                              style={{
                                paddingHorizontal: 10,
                                paddingVertical: 4,
                                borderRadius: 12,
                                backgroundColor: active ? '#df103f' : '#0F172A',
                                borderWidth: 1,
                                borderColor: active ? '#df103f' : '#334155',
                              }}
                              onPress={() => {
                                setSlideshowImages(prev => prev.map(item => item.id === img.id ? { ...item, effect: effectName } : item));
                              }}
                            >
                              <Text style={{ color: active ? '#fff' : '#94A3B8', fontSize: 11, fontWeight: '600' }}>
                                {effectName.replace('_', ' ')}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </ScrollView>
                    </View>
                  </View>
                ))
              )}
            </ScrollView>

            <View style={[styles.modalActions, { marginTop: 12, borderTopWidth: 1, borderColor: '#1E293B', paddingTop: 12 }]}>
              <Button mode="outlined" textColor="#94A3B8" style={{ borderColor: '#334155' }} disabled={generatingSlideshow} onPress={() => { setSlideshowImages([]); setSlideshowModalVisible(false); }}>
                Cancel
              </Button>
              <Button mode="contained" buttonColor="#df103f" disabled={generatingSlideshow || slideshowImages.length === 0} loading={generatingSlideshow} onPress={generateSlideshowVideo}>
                {generatingSlideshow ? 'Generating...' : 'Generate Video'}
              </Button>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── Social Subcategory Modal (opens when route param category === 'Social Media') ── */}
      <Modal visible={showSocialModal} animationType="slide" transparent onRequestClose={() => setShowSocialModal(false)}>
        <View style={styles.modalBg}>
          <View style={styles.modalCard}>
            <Title style={styles.modalTitle}>Choose a social template</Title>
            <ScrollView contentContainerStyle={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 10 }}>
              {VIDEO_SOCIAL_SUBCATS.map((s) => (
                <TouchableOpacity key={s.id} style={{ width: '48%', marginBottom: 12 }} onPress={() => { setVideoSubCategory(s.id); setShowSocialModal(false); }}>
                  <View style={[styles.musicCard, { backgroundColor: '#fff', borderWidth: 1, borderColor: '#e6e9ef', height: 150, width: 150, justifyContent: 'center' }]}>
                    {s.icon}
                    <Text style={{ fontSize: 13, fontWeight: '700', color: '#0f172a' }}>{s.title}</Text>
                    <Text style={{ fontSize: 11, color: '#64748b', marginTop: 6 }}>{s.size}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <View style={styles.modalActions}>
              <Button mode="contained" buttonColor="#df103f" onPress={() => setShowSocialModal(false)} style={styles.modalBtn}>Close</Button>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── Templates Modal ── */}
      <Modal visible={templatesModalVisible} animationType="slide" transparent onRequestClose={() => setTemplatesModalVisible(false)}>
        <View style={styles.modalBg}>
          <View style={styles.modalCard}>
            <Title style={styles.modalTitle}>Choose a video template</Title>
            <ScrollView contentContainerStyle={styles.templatesGrid}>
              {VIDEOS_TEMPLATES.map(t => (
                <TouchableOpacity key={t.id} style={styles.templateGridItem} onPress={() => selectTemplate(t)}>
                  <View style={styles.templateGridCard}>
                    <View style={[styles.templateGridThumb, { position: 'relative', overflow: 'hidden' }]}>
                      {t.thumbnail ? (
                        <RNImage
                          source={getThumbnailSource(t.thumbnail)}
                          style={StyleSheet.absoluteFillObject}
                          resizeMode="cover"
                        />
                      ) : null}
                      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.35)' }}>
                        <Icon.Play size={20} color="#fff" />
                      </View>
                    </View>
                    <Text style={styles.templateGridTitle} numberOfLines={2}>{t.title}</Text>
                    <Text style={styles.templateGridMeta}>{t.width} × {t.height}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <View style={styles.modalActions}>
              <Button mode="contained" buttonColor="#df103f" onPress={() => setTemplatesModalVisible(false)} style={styles.modalBtn}>Close</Button>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── Add Text Modal ── */}
      <Modal visible={textModalVisible} animationType="slide" transparent onRequestClose={() => setTextModalVisible(false)}>
        <View style={styles.modalBg}>
          <View style={styles.modalCard}>
            <Title style={styles.modalTitle}>Add Text Overlay</Title>

            <RNTextInput
              value={textInput}
              onChangeText={setTextInput}
              placeholder="Type your text here..."
              placeholderTextColor="#94A3B8"
              style={styles.modalInput}
              autoFocus
              multiline
            />

            <CustomSlider label="Font Size" min={12} max={72} step={1} value={fontSize} onChange={setFontSize} />

            <View style={styles.rowBtns}>
              <TouchableOpacity
                style={[styles.toggleBtn, textBold && styles.toggleActive]}
                onPress={() => setTextBold(b => !b)}
              >
                <Text style={[styles.toggleLabel, textBold && styles.toggleActiveLabel]}>B  Bold</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.subTitle}>Text Color</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.colorRow}>
              {PRESET_COLORS.map(c => (
                <TouchableOpacity key={c} onPress={() => setTextColor(c)}
                  style={[styles.colorDot, { backgroundColor: c }, textColor === c && styles.colorDotActive]} />
              ))}
            </ScrollView>

            {/* Preview */}
            <View style={styles.textPreviewBox}>
              <RNText style={{ fontSize, color: textColor, fontWeight: textBold ? 'bold' : 'normal', textAlign: 'center' }}>
                {textInput || 'Preview'}
              </RNText>
            </View>

            <View style={styles.modalActions}>
              <Button mode="outlined" textColor="#64748B" style={styles.modalBtn} onPress={() => { setTextModalVisible(false); setTextInput(''); }}>Cancel</Button>
              <Button mode="contained" buttonColor="#df103f" textColor="#fff" style={styles.modalBtn} onPress={addTextOverlay}>Add to Video</Button>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── iTunes Music Search Modal ── */}
      <Modal visible={iTunesModalVisible} animationType="slide" transparent onRequestClose={() => setITunesModalVisible(false)}>
        <View style={styles.modalBg}>
          <View style={[styles.modalCard, { height: '80%' }]}>
            <Title style={styles.modalTitle}>Search & Add Music</Title>

            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
              <RNTextInput
                value={iTunesQuery}
                onChangeText={setITunesQuery}
                placeholder="Search songs, artists, genres..."
                placeholderTextColor="#94A3B8"
                style={[styles.modalInput, { flex: 1, marginBottom: 0 }]}
                onSubmitEditing={searchITunes}
              />
              <Button mode="contained" buttonColor="#df103f" textColor="#fff" style={{ height: 46 }} onPress={searchITunes} loading={searchingITunes}>
                Search
              </Button>
            </View>

            <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
              {searchingITunes && <ActivityIndicator size="large" color="#df103f" style={{ marginVertical: 20 }} />}
              {!searchingITunes && iTunesResults.length === 0 && (
                <RNText style={{ color: '#64748B', textAlign: 'center', marginVertical: 40 }}>
                  No tracks found. Type a query and search.
                </RNText>
              )}
              {iTunesResults.map((track) => {
                const isDownloading = downloadingTrackId === track.trackId;
                const isPlayingPreview = previewTrackUrl === track.previewUrl && !previewPaused;

                return (
                  <View key={track.trackId} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#1E293B' }}>
                    <RNImage source={{ uri: track.artworkUrl60 || track.artworkUrl100 }} style={{ width: 44, height: 44, borderRadius: 6, backgroundColor: '#1E293B' }} />
                    <View style={{ flex: 1, marginHorizontal: 12 }}>
                      <RNText numberOfLines={1} style={{ color: '#F8FAFC', fontSize: 13, fontWeight: '700' }}>{track.trackName}</RNText>
                      <RNText numberOfLines={1} style={{ color: '#94A3B8', fontSize: 11 }}>{track.artistName}</RNText>
                    </View>

                    <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
                      <TouchableOpacity
                        onPress={() => {
                          if (previewTrackUrl === track.previewUrl) {
                            setPreviewPaused(p => !p);
                          } else {
                            setPreviewTrackUrl(track.previewUrl);
                            setPreviewPaused(false);
                          }
                        }}
                        style={{ padding: 8, backgroundColor: '#1E293B', borderRadius: 20 }}
                      >
                        <RNText style={{ fontSize: 12, color: '#FFF' }}>{isPlayingPreview ? '⏸' : '▶'}</RNText>
                      </TouchableOpacity>

                      <Button
                        mode="contained"
                        compact
                        buttonColor="#df103f"
                        textColor="#fff"
                        loading={isDownloading}
                        disabled={isDownloading}
                        onPress={() => downloadAndUseITunesTrack(track)}
                      >
                        Use
                      </Button>
                    </View>
                  </View>
                );
              })}
            </ScrollView>

            {/* Hidden Video element for playing the active iTunes preview track inside the modal */}
            {previewTrackUrl && (
              <Video
                source={{ uri: previewTrackUrl }}
                paused={previewPaused}
                // audioOnly={true}
                onEnd={() => setPreviewPaused(true)}
                onError={() => Alert.alert('Preview Error', 'Could not play audio preview.')}
              />
            )}

            <View style={styles.modalActions}>
              <Button mode="outlined" textColor="#64748B" style={styles.modalBtn} onPress={() => { setITunesModalVisible(false); setPreviewTrackUrl(null); setPreviewPaused(true); }}>
                Close
              </Button>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── Add Emoji Modal ── */}
      <Modal visible={emojiModalVisible} animationType="slide" transparent onRequestClose={() => setEmojiModalVisible(false)}>
        <View style={styles.modalBg}>
          <View style={[styles.modalCard, { height: '65%' }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <Title style={styles.modalTitle}>Add Emoji Sticker</Title>
              <TouchableOpacity onPress={() => setEmojiModalVisible(false)} style={{ padding: 4 }}>
                <Icon.Close size={20} color="#94A3B8" />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
              {EMOJI_ST_CATEGORIES.map(category => (
                <View key={category.title} style={{ marginBottom: 16 }}>
                  <Text style={{ color: '#64748B', fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8 }}>
                    {category.title}
                  </Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
                    {category.emojis.map(emoji => (
                      <TouchableOpacity
                        key={emoji}
                        onPress={() => addEmojiOverlay(emoji)}
                        style={{
                          width: 44,
                          height: 44,
                          borderRadius: 8,
                          backgroundColor: '#1E293B',
                          justifyContent: 'center',
                          alignItems: 'center',
                          borderWidth: 1,
                          borderColor: '#334155',
                        }}
                      >
                        <RNText style={{ fontSize: 24 }}>{emoji}</RNText>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              ))}
            </ScrollView>

            <View style={styles.modalActions}>
              <Button mode="outlined" textColor="#64748B" style={styles.modalBtn} onPress={() => setEmojiModalVisible(false)}>
                Close
              </Button>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── Custom In-App Camera Modal ── */}
      <Modal visible={customCameraVisible} animationType="slide" transparent={false} onRequestClose={() => { if (!isRecording) setCustomCameraVisible(false); }}>
        <View style={{ flex: 1, backgroundColor: '#000' }}>
          {!device ? (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
              <ActivityIndicator size="large" color="#df103f" />
              <RNText style={{ color: '#fff', marginTop: 12 }}>Loading Camera hardware...</RNText>
              <TouchableOpacity onPress={() => setCustomCameraVisible(false)} style={{ marginTop: 24, paddingHorizontal: 20, paddingVertical: 10, backgroundColor: '#1E293B', borderRadius: 8 }}>
                <RNText style={{ color: '#fff' }}>Cancel</RNText>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={StyleSheet.absoluteFillObject}>
              <Camera
                ref={cameraRef}
                style={StyleSheet.absoluteFill}
                device={device}
                isActive={customCameraVisible}
                outputs={[videoOutput]}
              />

              {/* Hidden audio-only player for pre-record background music.
                  Uses react-native-video (same as editor tracks) so it properly
                  shares the AVAudioSession with the camera — no earpiece routing
                  issues and no mic interference. Starts/stops with isRecording. */}
              {preRecordMusic && (
                <Video
                  {...({
                    key: `prerecord_${preRecordMusic.id}`,
                    source: { uri: preRecordMusic.uri },
                    audioOnly: true,
                    paused: !isRecording,
                    volume: 1.0,
                    repeat: true,
                    mixWithOthers: true,
                  } as any)}
                />
              )}

              {/* HUD Header */}
              <SafeAreaView style={{ position: 'absolute', top: 0, left: 0, right: 0, paddingHorizontal: 16, paddingTop: 10, flexDirection: 'row', justifyContent: 'space-between', zIndex: 10 }}>
                <TouchableOpacity
                  disabled={isRecording}
                  onPress={() => setCustomCameraVisible(false)}
                  style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' }}
                >
                  <Icon.Close size={20} color="#fff" />
                </TouchableOpacity>

                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <TouchableOpacity
                    onPress={() => setFlash(f => f === 'off' ? 'on' : 'off')}
                    style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' }}
                  >
                    <Icon.Speed size={18} color={flash === 'on' ? '#f59e0b' : '#94a3b8'} />
                  </TouchableOpacity>

                  <TouchableOpacity
                    disabled={isRecording}
                    onPress={() => setCameraPosition(p => p === 'back' ? 'front' : 'back')}
                    style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' }}
                  >
                    <Icon.Rotate size={18} color="#fff" />
                  </TouchableOpacity>
                </View>
              </SafeAreaView>

              {/* HUD Footer Controls */}
              <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, paddingBottom: 40, paddingHorizontal: 20, alignItems: 'center', zIndex: 10 }}>
                {/* Timer Display */}
                {isRecording && (
                  <View style={{ backgroundColor: '#EF4444', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 4, marginBottom: 16 }}>
                    <RNText style={{ color: '#fff', fontSize: 14, fontWeight: 'bold' }}>
                      {Math.floor(recordDuration / 60)}:{(recordDuration % 60).toString().padStart(2, '0')}
                    </RNText>
                  </View>
                )}

                {/* Music Banner */}
                <View style={{ width: '100%', marginBottom: 20, alignItems: 'center', gap: 10 }}>
                  {preRecordMusic ? (
                    <View style={{ alignItems: 'center', gap: 6, width: '100%' }}>
                      {/* Selected track pill */}
                      <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.7)', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8, gap: 8, borderWidth: 1, borderColor: isRecording ? '#10B981' : 'rgba(255,255,255,0.1)' }}>
                        {isRecording ? <Icon.Play size={14} color="#10B981" /> : <Icon.Music size={14} color="#fff" />}
                        <RNText numberOfLines={1} style={{ color: isRecording ? '#10B981' : '#fff', fontSize: 12, fontWeight: '700', maxWidth: 180 }}>
                          {preRecordMusic.name}
                        </RNText>
                        {isRecording ? (
                          <RNText style={{ color: '#10B981', fontSize: 11, fontWeight: '600' }}>Playing</RNText>
                        ) : (
                          <TouchableOpacity onPress={() => setPreRecordMusic(null)}>
                            <RNText style={{ color: '#EF4444', fontSize: 14, fontWeight: 'bold' }}>×</RNText>
                          </TouchableOpacity>
                        )}
                      </View>
                      {/* Quick-switch: editor tracks */}
                      {!isRecording && musicTracks.length > 0 && (
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, paddingHorizontal: 4 }}>
                          {musicTracks.map(t => (
                            <TouchableOpacity
                              key={t.id}
                              onPress={() => setPreRecordMusic(t)}
                              style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: preRecordMusic?.id === t.id ? '#df103f' : 'rgba(30,41,59,0.85)', borderRadius: 14, paddingHorizontal: 12, paddingVertical: 5, borderWidth: 1, borderColor: preRecordMusic?.id === t.id ? '#df103f' : 'rgba(255,255,255,0.15)' }}
                            >
                              <Icon.Music size={12} color="#fff" />
                              <RNText numberOfLines={1} style={{ color: '#fff', fontSize: 11, fontWeight: '600', maxWidth: 120 }}>{t.name}</RNText>
                            </TouchableOpacity>
                          ))}
                        </ScrollView>
                      )}
                    </View>
                  ) : (
                    <View style={{ alignItems: 'center', gap: 8 }}>
                      {/* Quick-pick from editor tracks */}
                      {musicTracks.length > 0 && (
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, paddingHorizontal: 4 }}>
                          {musicTracks.map(t => (
                            <TouchableOpacity
                              key={t.id}
                              onPress={() => setPreRecordMusic(t)}
                              style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(30,41,59,0.85)', borderRadius: 14, paddingHorizontal: 12, paddingVertical: 5, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' }}
                            >
                              <Icon.Music size={12} color="#fff" />
                              <RNText numberOfLines={1} style={{ color: '#fff', fontSize: 11, fontWeight: '600', maxWidth: 120 }}>{t.name}</RNText>
                            </TouchableOpacity>
                          ))}
                        </ScrollView>
                      )}
                      <TouchableOpacity
                        disabled={isRecording}
                        onPress={() => {
                          setMusicSelectMode('pre-record');
                          setITunesModalVisible(true);
                        }}
                        style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8, gap: 6, borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)' }}
                      >
                        <Icon.Music size={12} color="#fff" />
                        <RNText style={{ color: '#fff', fontSize: 12, fontWeight: '700' }}>Choose Song to Dance & Record</RNText>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>

                {/* Record Button */}
                <TouchableOpacity
                  onPress={isRecording ? stopCameraRecording : startCameraRecording}
                  style={{
                    width: 80,
                    height: 80,
                    borderRadius: 40,
                    borderWidth: 4,
                    borderColor: '#fff',
                    justifyContent: 'center',
                    alignItems: 'center',
                    backgroundColor: 'rgba(0,0,0,0.1)',
                  }}
                >
                  <View
                    style={{
                      width: isRecording ? 36 : 60,
                      height: isRecording ? 36 : 60,
                      borderRadius: isRecording ? 8 : 30,
                      backgroundColor: '#EF4444',
                    }}
                  />
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// ─── Summary Row Helper ─────────────────────────────────────────────────────────
function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.summaryRow}>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={styles.summaryValue}>{value}</Text>
    </View>
  );
}

// ─── Styles ─────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#060A12' },
  flex: { flex: 1 },

  // Header
  header: { height: 54, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, borderBottomWidth: 1, borderBottomColor: '#1E293B' },
  hBtn: { padding: 8 },
  hTitle: { fontSize: 18, color: '#F8FAFC', fontWeight: '800' },
  hRight: { flexDirection: 'row', alignItems: 'center' },
  disabled: { opacity: 0.3 },
  exportBtn: { backgroundColor: '#df103f', width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginLeft: 10 },

  // Canvas
  canvasArea: { alignItems: 'center', justifyContent: 'center', paddingVertical: 10, paddingHorizontal: 16 },
  videoWrapper: { backgroundColor: 'transparent', borderRadius: 10, overflow: 'hidden', position: 'relative' },
  videoFill: { position: 'absolute', top: 0, left: 0, bottom: 0, right: 0 },
  videoOverlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.45)' },
  errorText: { color: '#EF4444', fontSize: 14, textAlign: 'center' },
  filterBadge: { position: 'absolute', top: 8, right: 8, backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  filterBadgeText: { color: '#F8FAFC', fontSize: 11, fontWeight: '700' },

  // Empty state
  emptyCanvas: { backgroundColor: '#0F172A', borderRadius: 10, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#1E293B', borderStyle: 'dashed' },
  emptyTitle: { color: '#475569', fontSize: 16, marginTop: 10 },
  emptySub: { color: '#334155', fontSize: 12, textAlign: 'center', paddingHorizontal: 20, marginTop: 4 },
  emptyActions: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#0F172A',
    borderTopWidth: 1,
    borderTopColor: '#1E293B',
  },
  emptyBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#1E3A5F', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10, gap: 6 },
  emptyBtnLabel: { color: '#fff', fontWeight: '700', fontSize: 14 },

  // Playback
  playbackBar: { paddingHorizontal: 16, paddingVertical: 6, borderTopWidth: 1, borderTopColor: '#1E293B' },
  scrubRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  timeLabel: { fontSize: 11, color: '#94A3B8', width: 36, textAlign: 'center' },
  scrubTrack: { height: 20, justifyContent: 'center', position: 'relative', flex: 1 },
  scrubBg: { height: 4, borderRadius: 2, backgroundColor: '#334155', width: '100%' },
  scrubFill: { height: 4, borderRadius: 2, backgroundColor: '#df103f', position: 'absolute', left: 0 },
  scrubThumb: { position: 'absolute', width: 14, height: 14, borderRadius: 7, backgroundColor: '#df103f', borderWidth: 2, borderColor: '#fff', elevation: 4 },
  ctrlRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  ctrlBtn: { padding: 6, alignItems: 'center', justifyContent: 'center', minWidth: 36 },
  ctrlLabel: { color: '#94A3B8', fontSize: 13, fontWeight: '700' },
  playBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#df103f', justifyContent: 'center', alignItems: 'center', elevation: 4 },

  // Deck
  deck: { flex: 1, borderTopWidth: 1, borderTopColor: '#1E293B', backgroundColor: '#080C14' },
  panelBody: { flex: 1 },
  panel: { padding: 14 },
  panelTitle: { color: '#64748B', fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10 },
  subTitle: { color: '#64748B', fontSize: 11, fontWeight: '700', textTransform: 'uppercase', marginTop: 10, marginBottom: 6 },
  rowBtns: { flexDirection: 'row', gap: 10, marginBottom: 8 },
  srcBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#df103f', paddingVertical: 10, borderRadius: 10, gap: 6 },
  srcBtnLabel: { color: '#fff', fontWeight: '700', fontSize: 14 },

  // Overlay editor
  overlayEditor: { backgroundColor: '#0F172A', borderRadius: 10, padding: 12, marginTop: 12, borderWidth: 1, borderColor: '#1E293B' },
  inlineTextInput: { backgroundColor: '#1E293B', color: '#F8FAFC', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, fontSize: 15, marginBottom: 8 },
  toggleBtn: { paddingHorizontal: 14, paddingVertical: 6, backgroundColor: '#1E293B', borderRadius: 8, borderWidth: 1, borderColor: '#334155' },
  toggleActive: { backgroundColor: '#3B82F6', borderColor: '#3B82F6' },
  toggleLabel: { color: '#94A3B8', fontSize: 13, fontWeight: '700' },
  toggleActiveLabel: { color: '#fff' },
  colorRow: { paddingVertical: 6, gap: 8 },
  colorDot: { width: 28, height: 28, borderRadius: 14, borderWidth: 2, borderColor: 'transparent' },
  colorDotActive: { borderColor: '#fff', transform: [{ scale: 1.15 }] },
  deleteBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#7F1D1D', borderRadius: 8, paddingVertical: 8, marginTop: 10, gap: 6 },
  deleteBtnLabel: { color: '#FCA5A5', fontWeight: '700', fontSize: 13 },
  emptyPanel: { paddingVertical: 16, alignItems: 'center' },
  emptyPanelText: { color: '#475569', fontSize: 13, textAlign: 'center' },

  // Music
  musicScroll: { paddingVertical: 4, paddingHorizontal: 2, gap: 10 },
  musicCard: { width: 80, alignItems: 'center', backgroundColor: '#0F172A', borderRadius: 12, padding: 10, borderWidth: 1, borderColor: '#1E293B' },
  musicCardActive: { borderColor: '#df103f', backgroundColor: '#1A0A0E' },
  musicEmoji: { fontSize: 24, marginBottom: 4 },
  musicName: { color: '#64748B', fontSize: 11, fontWeight: '600', textAlign: 'center' },
  musicNameActive: { color: '#df103f' },
  musicDur: { color: '#334155', fontSize: 10, marginTop: 4 },

  // Filter
  filterNote: { color: '#475569', fontSize: 11, marginBottom: 10, lineHeight: 16 },
  filterScroll: { paddingVertical: 4, gap: 10 },
  filterCard: { alignItems: 'center', backgroundColor: '#0F172A', borderRadius: 10, padding: 10, borderWidth: 1, borderColor: '#1E293B', minWidth: 76 },
  filterCardActive: { borderColor: '#df103f' },
  filterSwatch: { width: 40, height: 40, borderRadius: 8, marginBottom: 6 },
  filterName: { color: '#64748B', fontSize: 11, fontWeight: '600' },
  filterNameActive: { color: '#df103f' },

  // Speed
  speedRow: { flexDirection: 'row', gap: 8, marginBottom: 12, flexWrap: 'wrap' },
  speedBtn: { paddingHorizontal: 16, paddingVertical: 8, backgroundColor: '#0F172A', borderRadius: 8, borderWidth: 1, borderColor: '#1E293B' },
  speedBtnActive: { backgroundColor: '#df103f', borderColor: '#df103f' },
  speedLabel: { color: '#94A3B8', fontWeight: '700', fontSize: 14 },
  speedLabelActive: { color: '#fff' },

  // Export
  summaryCard: { backgroundColor: '#0F172A', borderRadius: 10, padding: 12, marginBottom: 14, borderWidth: 1, borderColor: '#1E293B' },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: '#1E293B' },
  summaryLabel: { color: '#64748B', fontSize: 13 },
  summaryValue: { color: '#F8FAFC', fontSize: 13, fontWeight: '600' },
  exportFullBtn: { borderRadius: 10, marginBottom: 10 },
  exportNote: { color: '#475569', fontSize: 12, lineHeight: 18, textAlign: 'center' },

  // Tab strip
  tabStrip: { height: 60, flexDirection: 'row', borderTopWidth: 1, borderTopColor: '#1E293B', backgroundColor: '#060A12', paddingBottom: Platform.OS === 'ios' ? 10 : 0 },
  tabItem: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  tabLabel: { fontSize: 9, color: '#475569', marginTop: 3, fontWeight: '600' },
  tabLabelActive: { color: '#df103f' },

  // Text modal
  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: '#0F172A', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, borderTopWidth: 1, borderColor: '#1E293B' },
  modalTitle: { color: '#F8FAFC', fontSize: 18, fontWeight: '800', marginBottom: 12 },
  modalInput: { backgroundColor: '#1E293B', color: '#F8FAFC', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, fontSize: 16, marginBottom: 10, minHeight: 60, textAlignVertical: 'top' },
  textPreviewBox: { backgroundColor: '#000', borderRadius: 8, padding: 12, alignItems: 'center', justifyContent: 'center', marginVertical: 8, minHeight: 50 },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 10, gap: 10 },
  modalBtn: { minWidth: 100 },
  socialGridRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 12 },
  socialCardWrap: { width: '48%', marginBottom: 12 },
  socialCardInner: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#e6e9ef', height: 120, justifyContent: 'center', alignItems: 'center', borderRadius: 10 },
  socialCardTitle: { fontSize: 13, fontWeight: '700', color: '#0f172a' },
  socialCardSize: { fontSize: 11, color: '#64748b', marginTop: 6 },
  // Debug / templates
  debugPanel: { position: 'absolute', left: 8, bottom: 8, backgroundColor: 'rgba(0,0,0,0.45)', padding: 8, borderRadius: 8 },
  debugText: { color: '#94A3B8', fontSize: 11 },
  templatesRow: { width: '100%', marginTop: 12 },
  templateHeading: { color: '#64748B', fontSize: 11, fontWeight: '700', marginBottom: 6, marginHorizontal: 8 },
  templateCard: { width: 100, marginRight: 8, alignItems: 'center' },
  templateThumb: { width: 92, height: 80, borderRadius: 8, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center', marginBottom: 6 },
  templateTitle: { color: '#F8FAFC', fontSize: 12, fontWeight: '700', width: 88, textAlign: 'center' },
  // Templates modal grid
  templatesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, paddingBottom: 12 },
  templateGridItem: { width: '48%', padding: 6 },
  templateGridCard: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#e6e9ef', borderRadius: 10, padding: 10, alignItems: 'center' },
  templateGridThumb: { width: '100%', height: 110, backgroundColor: '#000', borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  templateGridTitle: { fontSize: 14, fontWeight: '700', color: '#0f172a', textAlign: 'center' },
  templateGridMeta: { fontSize: 12, color: '#64748b', marginTop: 6 },
});

const tl = StyleSheet.create({
  container: {
    height: 160,
    backgroundColor: '#0F172A',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#1E293B',
    position: 'relative',
    marginVertical: 10,
  },
  playhead: {
    position: 'absolute',
    left: (screenWidth - 32) / 2 + 16,
    top: 0,
    bottom: 0,
    width: 2,
    backgroundColor: '#EF4444',
    zIndex: 100,
    pointerEvents: 'none',
  },
  playheadCap: {
    position: 'absolute',
    top: 0,
    left: -5,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#EF4444',
  },
  scrollContent: {
    paddingVertical: 8,
  },
  tracksArea: {
    position: 'relative',
    height: 120,
  },
  ruler: {
    height: 20,
    position: 'relative',
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  tick: {
    position: 'absolute',
    bottom: 0,
    alignItems: 'center',
    width: 40,
    marginLeft: -20,
  },
  tickLine: {
    width: 1,
    height: 6,
    backgroundColor: '#475569',
  },
  tickText: {
    fontSize: 9,
    color: '#64748B',
    marginTop: 2,
  },
  lane: {
    height: 26,
    position: 'relative',
    marginVertical: 2,
    justifyContent: 'center',
    backgroundColor: 'rgba(30, 41, 59, 0.3)',
    borderRadius: 4,
  },
  videoLane: {
    height: 32,
    backgroundColor: '#1E293B',
    borderRadius: 6,
    overflow: 'hidden',
  },
  videoTrimmedBg: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    backgroundColor: 'rgba(239, 68, 68, 0.25)',
    borderLeftWidth: 2,
    borderRightWidth: 2,
    borderColor: '#EF4444',
  },
  block: {
    position: 'absolute',
    height: 20,
    borderRadius: 4,
    justifyContent: 'center',
    paddingHorizontal: 6,
    borderWidth: 1,
  },
  selectedBlock: {
    borderWidth: 1.5,
    borderColor: '#FFF',
    shadowColor: '#FFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 2,
    elevation: 3,
  },
  textBlock: {
    backgroundColor: 'rgba(225, 48, 108, 0.35)',
    borderColor: 'rgba(225, 48, 108, 0.7)',
  },
  imageBlock: {
    backgroundColor: 'rgba(16, 185, 129, 0.35)',
    borderColor: 'rgba(16, 185, 129, 0.7)',
  },
  audioBlock: {
    backgroundColor: 'rgba(139, 92, 246, 0.35)',
    borderColor: 'rgba(139, 92, 246, 0.7)',
  },
  blockText: {
    fontSize: 10,
    color: '#FFF',
    fontWeight: '600',
    textAlign: 'center',
  },
  laneLabel: {
    position: 'absolute',
    left: 8,
    color: '#94A3B8',
    fontSize: 8,
    fontWeight: '800',
    textTransform: 'uppercase',
    zIndex: 10,
  },
});
