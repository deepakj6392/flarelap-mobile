import React, {
  useState,
  useRef,
  useCallback,
  useEffect,
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
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  Modal,
  ActivityIndicator,
  TextInput as RNTextInput,
} from 'react-native';
import { Title, Button, Text } from 'react-native-paper';
import Video from 'react-native-video';
import { launchImageLibrary, launchCamera } from 'react-native-image-picker';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import api from '../../services/api.service';

import CustomizeVideoIcon from '../../assets/icons/social/thumbnail_customize_video.svg';
import InstagramStoryIcon from '../../assets/icons/social/thumbnail_instagram_story.svg';
import YouTubeIntroIcon from '../../assets/icons/social/thumbnail_youtube_intro.svg';

// ─── Dimensions ────────────────────────────────────────────────────────────────
const { width: screenWidth } = Dimensions.get('window');
const PREVIEW_W = screenWidth - 32;
const PREVIEW_H = (PREVIEW_W * 9) / 16;

// ─── Stock / Preset Data ───────────────────────────────────────────────────────
const PRESET_MUSIC = [
  { id: 'upbeat',    name: 'Upbeat Pop',    duration: '0:32', emoji: '🎵' },
  { id: 'cinematic', name: 'Cinematic',      duration: '0:45', emoji: '🎬' },
  { id: 'lofi',      name: 'Lo-fi Chill',   duration: '0:58', emoji: '🌙' },
  { id: 'energetic', name: 'Energetic Beat', duration: '0:28', emoji: '⚡' },
  { id: 'acoustic',  name: 'Acoustic Strum', duration: '0:41', emoji: '🎸' },
  { id: 'ambient',   name: 'Soft Ambient',   duration: '1:02', emoji: '🌊' },
  { id: 'hiphop',    name: 'Hip-Hop Groove', duration: '0:35', emoji: '🎤' },
  { id: 'none',      name: 'No Music',       duration: '—',    emoji: '🔇' },
];

const FILTER_PRESETS = [
  { id: 'none',      name: 'Original',  color: '#475569' },
  { id: 'vintage',   name: 'Vintage',   color: '#92400E' },
  { id: 'cinematic', name: 'Cinematic', color: '#1E3A5F' },
  { id: 'warm',      name: 'Warm',      color: '#B45309' },
  { id: 'cool',      name: 'Cool',      color: '#1D4ED8' },
  { id: 'noir',      name: 'Noir',      color: '#1F2937' },
  { id: 'vivid',     name: 'Vivid',     color: '#7C3AED' },
  { id: 'fade',      name: 'Fade',      color: '#6B7280' },
];

const PRESET_COLORS = [
  '#FFFFFF', '#000000', '#EF4444', '#F97316',
  '#F59E0B', '#10B981', '#06B6D4', '#3B82F6',
  '#6366F1', '#8B5CF6', '#EC4899', '#F43F5E',
];

const VIDEO_SOCIAL_SUBCATS = [
  { id: 'customize', title: 'Customize Video', icon:<CustomizeVideoIcon width={150} height={150} />, size: '322 x 572' },
  { id: 'instagram_story', title: 'Instagram Story', icon:<InstagramStoryIcon width={150} height={150} />, size: '1080 x 1920' },
  { id: 'facebook_story', title: 'Facebook Story', icon:<InstagramStoryIcon width={150} height={150} />, size: '1080 x 1920' },
  { id: 'youtube_shorts', title: 'YouTube Shorts', icon:<InstagramStoryIcon width={150} height={150} />, size: '1080 x 1920' },
  { id: 'youtube_intro', title: 'YouTube Intro', icon:<YouTubeIntroIcon width={150} height={150} />, size: '1080 x 1080' },
  { id: 'tiktok_video', title: 'TikTok Video', icon:<InstagramStoryIcon width={150} height={150} />, size: '1080 x 1920' },
];

const SPEED_OPTIONS = [
  { label: '0.5×', value: 0.5 },
  { label: '0.75×', value: 0.75 },
  { label: '1×',   value: 1.0 },
  { label: '1.5×', value: 1.5 },
  { label: '2×',   value: 2.0 },
];

// ─── Types ─────────────────────────────────────────────────────────────────────
type OverlayType = 'text' | 'image';

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
}

// ─── SVG Icons ─────────────────────────────────────────────────────────────────
const Icon = {
  Close: ({ size = 20, color = '#F8FAFC' }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <Path d="M18 6L6 18M6 6l12 12" />
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
  const pr = useRef(PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: (e) => handle(e.nativeEvent.locationX),
    onPanResponderMove: (e) => handle(e.nativeEvent.locationX),
  })).current;

  const handle = (lx: number) => {
    let r = lx / W;
    r = Math.max(0, Math.min(1, r));
    let v = min + r * (max - min);
    v = Math.round(v / step) * step;
    v = Math.max(min, Math.min(max, v));
    onChange(v);
  };

  const pct = ((value - min) / (max - min)) * 100;

  return (
    <View style={ss.container}>
      <View style={ss.row}>
        <Text style={ss.label}>{label}</Text>
        <Text style={ss.val}>{value.toFixed(step < 1 ? 1 : 0)}{suffix}</Text>
      </View>
      <View style={[ss.track, { width: W }]} {...pr.panHandlers}>
        <View style={ss.bg} />
        <View style={[ss.fill, { width: `${pct}%` }]} />
        <View style={[ss.thumb, { left: `${pct}%`, transform: [{ translateX: -9 }] }]} />
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
  const startSz  = useRef({ w: 0, h: 0 });
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
  resDot:    { width: 7, height: 7, borderRadius: 4, backgroundColor: '#fff' },
});

// ─── Main VideoEditor Component ─────────────────────────────────────────────────
export default function VideoEditor({ route, navigation }: { route?: any; navigation?: any }) {
  // Video state
  const videoRef       = useRef<any>(null);
  const [videoUri, setVideoUri]         = useState<string | null>(route?.params?.videoUri ?? null);
  const [paused, setPaused]             = useState(true);
  const [muted, setMuted]               = useState(false);
  const [duration, setDuration]         = useState(0);
  const [currentTime, setCurrentTime]   = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1.0);
  const [volume, setVolume]             = useState(1.0);
  const [videoLoading, setVideoLoading] = useState(false);
  const [videoError, setVideoError]     = useState<string | null>(null);

  // Overlays
  const [overlays, setOverlays]           = useState<Overlay[]>([]);
  const [selectedOverlay, setSelectedOverlay] = useState<string | null>(null);
  const nextId = useRef(1);

  // Social modal state (open when incoming category is Social Media)
  const [showSocialModal, setShowSocialModal] = useState(false);
  const [videoSubCategory, setVideoSubCategory] = useState<string | null>(null);

  // Music
  const [selectedMusic, setSelectedMusic] = useState<string>('none');
  const [musicVolume, setMusicVolume]     = useState(0.7);

  // Filter
  const [filterPreset, setFilterPreset] = useState<string>('none');

  // Active bottom tab
  const [activeTab, setActiveTab] = useState<'video' | 'overlays' | 'music' | 'filter' | 'speed' | 'export'>('video');

  // Text-add modal
  const [textModalVisible, setTextModalVisible] = useState(false);
  const [textInput, setTextInput]               = useState('');
  const [textColor, setTextColor]               = useState('#FFFFFF');
  const [textBold, setTextBold]                 = useState(false);
  const [fontSize, setFontSize]                 = useState(22);

  // Export state
  const [exporting, setExporting] = useState(false);

  // Undo/Redo
  type HistoryEntry = { overlays: Overlay[]; filter: string; music: string; musicVol: number; };
  const [history, setHistory]       = useState<HistoryEntry[]>([]);
  const [historyIdx, setHistoryIdx] = useState(-1);

  // ── helpers ──
  const commitHistory = useCallback((patch?: Partial<HistoryEntry>) => {
    const entry: HistoryEntry = {
      overlays:  patch?.overlays  ?? overlays,
      filter:    patch?.filter    ?? filterPreset,
      music:     patch?.music     ?? selectedMusic,
      musicVol:  patch?.musicVol  ?? musicVolume,
    };
    setHistory(h => { const next = [...h.slice(0, historyIdx + 1), entry]; setHistoryIdx(next.length - 1); return next; });
  }, [overlays, filterPreset, selectedMusic, musicVolume, historyIdx]);

  const applyHistory = (idx: number) => {
    if (idx < 0 || idx >= history.length) return;
    const e = history[idx];
    setOverlays(e.overlays);
    setFilterPreset(e.filter);
    setSelectedMusic(e.music);
    setMusicVolume(e.musicVol);
    setHistoryIdx(idx);
    setSelectedOverlay(null);
  };

  // ── video picker ──
  const pickVideo = async () => {
    const res = await launchImageLibrary({ mediaType: 'video', videoQuality: 'high' });
    if (res.assets?.[0]?.uri) {
      setVideoUri(res.assets[0].uri);
      setCurrentTime(0);
      setPaused(true);
      setVideoError(null);
      setOverlays([]);
      setHistory([]);
      setHistoryIdx(-1);
    }
  };

  useEffect(() => {
     setShowSocialModal(true);
  }, []);

  const recordVideo = async () => {
    const res = await launchCamera({ mediaType: 'video', videoQuality: 'high', durationLimit: 300 });
    if (res.assets?.[0]?.uri) {
      setVideoUri(res.assets[0].uri);
      setCurrentTime(0);
      setPaused(true);
      setVideoError(null);
      setOverlays([]);
      setHistory([]);
      setHistoryIdx(-1);
    }
  };

  // ── image overlay picker ──
  const pickImageOverlay = async () => {
    const res = await launchImageLibrary({ mediaType: 'photo', quality: 1 });
    if (res.assets?.[0]?.uri) {
      const id = `img_${nextId.current++}`;
      const item: Overlay = {
        id, type: 'image',
        x: PREVIEW_W / 2 - 60, y: PREVIEW_H / 2 - 60,
        width: 120, height: 120, rotation: 0,
        uri: res.assets[0].uri, borderRadius: 0, opacity: 1,
      };
      const updated = [...overlays, item];
      setOverlays(updated);
      setSelectedOverlay(id);
      commitHistory({ overlays: updated });
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
    };
    const updated = [...overlays, item];
    setOverlays(updated);
    setSelectedOverlay(id);
    commitHistory({ overlays: updated });
    setTextInput('');
    setTextModalVisible(false);
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
  const handleExport = async () => {
    if (!videoUri) { Alert.alert('No Video', 'Please select or record a video first.'); return; }
    setExporting(true);
    try {
      const payload = {
        videoUri,
        filter: filterPreset,
        music: selectedMusic !== 'none' ? selectedMusic : null,
        musicVolume,
        playbackRate,
        overlays: overlays.map(o => ({
          type: o.type,
          x: o.x / PREVIEW_W,       // normalised 0-1
          y: o.y / PREVIEW_H,
          width: o.width / PREVIEW_W,
          height: o.height / PREVIEW_H,
          rotation: o.rotation,
          ...(o.type === 'text' ? { text: o.text, fontSize: o.fontSize, color: o.color, bold: o.bold } : {}),
          ...(o.type === 'image' ? { uri: o.uri, borderRadius: o.borderRadius, opacity: o.opacity } : {}),
        })),
      };

      // POST to backend FFmpeg export API
      const response = await api.post('/video/export', payload, {
        timeout: 120_000, // 2-min timeout for video processing
      });

      Alert.alert(
        'Export Successful! 🎉',
        `Your video is ready.\n${response.data?.downloadUrl ? `Download: ${response.data.downloadUrl}` : 'Check your exports.'}`,
        [{ text: 'OK' }],
      );
    } catch (err: any) {
      Alert.alert(
        'Export Failed',
        err?.response?.data?.message || err?.message || 'Something went wrong. Please try again.',
      );
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
            <Icon.Close size={20} />
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
          {videoUri ? (
            <View style={[styles.videoWrapper, { width: PREVIEW_W, height: PREVIEW_H }]}>
              {/* Native video player */}
              <Video
                ref={videoRef}
                source={{ uri: videoUri }}
                style={styles.videoFill}
                paused={paused}
                muted={muted}
                volume={volume}
                rate={playbackRate}
                resizeMode="contain"
                repeat={false}
                onLoad={(data: any) => { setDuration(data.duration); setVideoLoading(false); }}
                onProgress={(data: any) => setCurrentTime(data.currentTime)}
                onEnd={() => { setPaused(true); setCurrentTime(0); }}
                onLoadStart={() => setVideoLoading(true)}
                onError={(e: any) => { setVideoError(e?.error?.localizedDescription || 'Playback error'); setVideoLoading(false); }}
              />

              {/* Overlay dim for filter badge */}
              {filterPreset !== 'none' && (
                <View style={[styles.filterBadge]} pointerEvents="none">
                  <Text style={styles.filterBadgeText}>{FILTER_PRESETS.find(f => f.id === filterPreset)?.name}</Text>
                </View>
              )}

              {/* Deselect tap target */}
              <TouchableOpacity
                activeOpacity={1}
                style={StyleSheet.absoluteFillObject}
                onPress={() => setSelectedOverlay(null)}
              />
              {/* Overlays */}
              <View style={StyleSheet.absoluteFillObject} pointerEvents="box-none">
                {overlays.map(o => (
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
            </View>
          ) : (
            /* Empty state */
            <View style={[styles.emptyCanvas, { width: PREVIEW_W, height: PREVIEW_H }]}>
              <Icon.Video size={48} color="#334155" />
              <Title style={styles.emptyTitle}>No Video Selected</Title>
              <Text style={styles.emptySub}>Pick from gallery or record with camera to start editing</Text>
              <View style={styles.emptyActions}>
                <TouchableOpacity style={styles.emptyBtn} onPress={pickVideo}>
                  <Icon.Video size={18} color="#fff" />
                  <Text style={styles.emptyBtnLabel}>Gallery</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.emptyBtn, { backgroundColor: '#df103f' }]} onPress={recordVideo}>
                  <Icon.Camera size={18} color="#fff" />
                  <Text style={styles.emptyBtnLabel}>Record</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>

        {/* ── Playback Controls ── */}
        {videoUri && (
          <View style={styles.playbackBar}>
            {/* Scrubber */}
            <View style={styles.scrubRow}>
              <Text style={styles.timeLabel}>{formatTime(currentTime)}</Text>
              <View style={[styles.scrubTrack, { width: scrubberWidth }]} {...scrubPR.panHandlers}>
                <View style={styles.scrubBg} />
                <View style={[styles.scrubFill, { width: `${scrubPct}%` }]} />
                <View style={[styles.scrubThumb, { left: `${scrubPct}%`, transform: [{ translateX: -7 }] }]} />
              </View>
              <Text style={styles.timeLabel}>{formatTime(duration)}</Text>
            </View>

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
                onPress={() => setPaused(p => !p)}
              >
                {paused ? <Icon.Play size={26} /> : <Icon.Pause size={26} />}
              </TouchableOpacity>

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
                    <TouchableOpacity style={[styles.srcBtn, { backgroundColor: '#1E293B', borderColor: '#334155', borderWidth: 1 }]} onPress={recordVideo}>
                      <Icon.Camera size={18} color="#F8FAFC" />
                      <Text style={[styles.srcBtnLabel, { color: '#F8FAFC' }]}>Record</Text>
                    </TouchableOpacity>
                  </View>
                  <CustomSlider label="Volume" min={0} max={1} step={0.05} value={volume} onChange={setVolume} suffix="%" />
                </View>
              )}

              {/* ── OVERLAYS TAB ── */}
              {activeTab === 'overlays' && (
                <View style={styles.panel}>
                  <Text style={styles.panelTitle}>Add Overlays</Text>
                  <View style={styles.rowBtns}>
                    <TouchableOpacity style={styles.srcBtn} onPress={() => setTextModalVisible(true)}>
                      <Icon.Text size={18} color="#fff" />
                      <Text style={styles.srcBtnLabel}>Add Text</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.srcBtn, { backgroundColor: '#1E293B', borderColor: '#334155', borderWidth: 1 }]} onPress={pickImageOverlay}>
                      <Icon.Image size={18} color="#F8FAFC" />
                      <Text style={[styles.srcBtnLabel, { color: '#F8FAFC' }]}>Add Image</Text>
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
                      <TouchableOpacity style={styles.deleteBtn} onPress={() => deleteOverlay(selectedItem.id)}>
                        <Icon.Trash size={14} color="#fff" />
                        <Text style={styles.deleteBtnLabel}>Remove Overlay</Text>
                      </TouchableOpacity>
                    </View>
                  )}

                  {/* Selected image overlay editor */}
                  {selectedItem?.type === 'image' && (
                    <View style={styles.overlayEditor}>
                      <Text style={styles.subTitle}>Edit Image Overlay</Text>
                      <CustomSlider label="Opacity" min={0.1} max={1} step={0.05} value={selectedItem.opacity ?? 1} onChange={v => updateOverlay(selectedItem.id, { opacity: v })} />
                      <CustomSlider label="Corner Radius" min={0} max={60} step={1} value={selectedItem.borderRadius ?? 0} onChange={v => updateOverlay(selectedItem.id, { borderRadius: v })} />
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
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.musicScroll}>
                    {PRESET_MUSIC.map(m => (
                      <TouchableOpacity
                        key={m.id}
                        style={[styles.musicCard, selectedMusic === m.id && styles.musicCardActive]}
                        onPress={() => { setSelectedMusic(m.id); commitHistory({ music: m.id }); }}
                      >
                        <Text style={styles.musicEmoji}>{m.emoji}</Text>
                        <Text style={[styles.musicName, selectedMusic === m.id && styles.musicNameActive]} numberOfLines={2}>{m.name}</Text>
                        <Text style={styles.musicDur}>{m.duration}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                  {selectedMusic !== 'none' && (
                    <CustomSlider label="Music Volume" min={0} max={1} step={0.05} value={musicVolume} onChange={v => { setMusicVolume(v); commitHistory({ musicVol: v }); }} />
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
                    <SummaryRow label="Filter"  value={FILTER_PRESETS.find(f => f.id === filterPreset)?.name ?? 'None'} />
                    <SummaryRow label="Music"   value={PRESET_MUSIC.find(m => m.id === selectedMusic)?.name ?? 'None'} />
                    <SummaryRow label="Speed"   value={`${playbackRate}×`} />
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
                { id: 'video',    Icon: Icon.Video,  label: 'Video'   },
                { id: 'overlays', Icon: Icon.Text,   label: 'Overlays' },
                { id: 'music',    Icon: Icon.Music,  label: 'Music'   },
                { id: 'filter',   Icon: Icon.Filter, label: 'Filter'  },
                { id: 'speed',    Icon: Icon.Speed,  label: 'Speed'   },
                { id: 'export',   Icon: Icon.Export, label: 'Export'  },
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

      {/* ── Social Subcategory Modal (opens when route param category === 'Social Media') ── */}
      <Modal visible={showSocialModal} animationType="slide" transparent onRequestClose={() => setShowSocialModal(false)}>
        <View style={styles.modalBg}>
          <View style={styles.modalCard}>
            <Title style={styles.modalTitle}>Choose a social template</Title>
            <ScrollView contentContainerStyle={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom:10 }}>
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
  videoWrapper: { backgroundColor: '#000', borderRadius: 10, overflow: 'hidden', position: 'relative' },
  videoFill: { width: '100%', height: '100%' },
  videoOverlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.45)' },
  errorText: { color: '#EF4444', fontSize: 14, textAlign: 'center' },
  filterBadge: { position: 'absolute', top: 8, right: 8, backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  filterBadgeText: { color: '#F8FAFC', fontSize: 11, fontWeight: '700' },

  // Empty state
  emptyCanvas: { backgroundColor: '#0F172A', borderRadius: 10, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#1E293B', borderStyle: 'dashed' },
  emptyTitle: { color: '#475569', fontSize: 16, marginTop: 10 },
  emptySub: { color: '#334155', fontSize: 12, textAlign: 'center', paddingHorizontal: 20, marginTop: 4 },
  emptyActions: { flexDirection: 'row', marginTop: 16, gap: 12 },
  emptyBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1E3A5F', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10, gap: 6 },
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
});
