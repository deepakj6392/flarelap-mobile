import React, { useState, useEffect, useRef, useMemo } from 'react';
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
  Share,
  Modal,
  PermissionsAndroid,
} from 'react-native';
import { Title, Button, TextInput, Text } from 'react-native-paper';
import Svg, {
  Defs,
  Filter,
  FeColorMatrix,
  FeGaussianBlur,
  Image as SvgImage,
  Path,
  Circle,
} from 'react-native-svg';
import { launchImageLibrary, launchCamera } from 'react-native-image-picker';
import ViewShot, { captureRef } from 'react-native-view-shot';
import { SafeAreaView } from 'react-native-safe-area-context';

// Screen Dimensions
const { width: screenWidth } = Dimensions.get('window');
const CANVAS_SIZE = Math.min(screenWidth - 32, 400);

// Pre-defined Stock Photos
const STOCK_PHOTOS = [
  { name: 'Warm Sunset', url: 'https://images.unsplash.com/photo-1475924156734-496f6cac6ec1?w=800' },
  { name: 'Pine Mountains', url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800' },
  { name: 'Neon Street', url: 'https://images.unsplash.com/photo-1519501025264-65ba15a82390?w=800' },
  { name: 'Moody Woods', url: 'https://images.unsplash.com/photo-1448375240586-882707db888b?w=800' },
  { name: 'Urban Portrait', url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800' },
  { name: 'Pastel Abstract', url: 'https://images.unsplash.com/photo-1541701494587-cb58502866ab?w=800' },
];

// Emojis for stickers
const PRESET_EMOJIS = ['😀', '😎', '🔥', '✨', '❤️', '🎉', '🌟', '📷', '💡', '🌈', '🎨', '🚀', '👑', '💯', '🌸', '🍕'];

// Color Swatches
const PRESET_COLORS = [
  '#FFFFFF', '#000000', '#EF4444', '#F97316', '#F59E0B', '#10B981',
  '#06B6D4', '#3B82F6', '#6366F1', '#8B5CF6', '#EC4899', '#F43F5E'
];

// --- Custom SVG Icons ---
const CloseIcon = ({ size = 20, color = '#334155' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M18 6L6 18M6 6l12 12" />
  </Svg>
);

const CheckIcon = ({ size = 20, color = '#334155' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M20 6L9 17l-5-5" />
  </Svg>
);

const UndoIcon = ({ size = 20, color = '#334155' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M3 7v6h6M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13" />
  </Svg>
);

const RedoIcon = ({ size = 20, color = '#334155' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M21 7v6h-6M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3l3 2.7" />
  </Svg>
);

const RotateIcon = ({ size = 20, color = '#334155' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
  </Svg>
);

const TrashIcon = ({ size = 20, color = '#ef4444' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M10 11v6M14 11v6" />
  </Svg>
);

const FlipIcon = ({ size = 20, color = '#334155', horizontal = true }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    {horizontal ? (
      <>
        <Path d="M12 2v20M2 12h8M14 12h8M6 8l-4 4 4 4M18 8l4 4-4 4" />
      </>
    ) : (
      <>
        <Path d="M2 12h20M12 2v8M12 14v8M8 6l4-4 4 4M8 18l4 4 4-4" />
      </>
    )}
  </Svg>
);

const TextIcon = ({ size = 20, color = '#334155' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M4 7V4h16v3M9 20h6M12 4v16" />
  </Svg>
);

const ImageIcon = ({ size = 20, color = '#334155' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7" />
    <Circle cx="16" cy="5" r="3" />
    <Path d="M21 15l-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
  </Svg>
);

const CameraIcon = ({ size = 20, color = '#334155' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
    <Circle cx="12" cy="13" r="4" />
  </Svg>
);

const CropIcon = ({ size = 20, color = '#334155' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M6 2v16h16M2 6h16v16" />
  </Svg>
);

const SlidersIcon = ({ size = 20, color = '#334155' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6" />
  </Svg>
);

const BrushIcon = ({ size = 20, color = '#334155' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
    <Path d="M7.5 10.5c.828 0 1.5-.672 1.5-1.5s-.672-1.5-1.5-1.5-1.5.672-1.5 1.5.672 1.5 1.5 1.5zM11.5 7.5c.828 0 1.5-.672 1.5-1.5S12.328 4.5 11.5 4.5s-1.5.672-1.5 1.5.672 1.5 1.5 1.5zM16.5 9.5c.828 0 1.5-.672 1.5-1.5s-.672-1.5-1.5-1.5-1.5.672-1.5 1.5.672 1.5 1.5 1.5zM16.5 14.5c.828 0 1.5-.672 1.5-1.5s-.672-1.5-1.5-1.5-1.5.672-1.5 1.5.672 1.5 1.5 1.5zM6 15c0-3 3-5 6-5s6 2 6 5-4 5-6 5-6-2-6-5z" />
  </Svg>
);

const MagicIcon = ({ size = 20, color = '#334155' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M15 4V2M15 16v-2M8 9H6M20 9h-2M17.8 6.2l1.4-1.4M10.8 13.2l-1.4 1.4M10.8 4.8 9.4 3.4M17.8 11.8l1.4 1.4M14 9l-9 9 1 1 9-9-1-1z" />
  </Svg>
);

// Types
interface OverlayItem {
  id: string;
  type: 'text' | 'sticker';
  text?: string;
  sticker?: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  color?: string;
  fontSize?: number;
}

interface HistoryState {
  brightness: number;
  contrast: number;
  saturation: number;
  blur: number;
  filterPreset: string;
  rotation: number;
  flipH: boolean;
  flipV: boolean;
  aspectRatio: number | 'free';
  strokes: string[];
  overlays: OverlayItem[];
}

// --- Custom Slider ---
interface CustomSliderProps {
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (val: number) => void;
  label: string;
  suffix?: string;
}

function CustomSlider({ value, min, max, step = 1, onChange, label, suffix = '' }: CustomSliderProps) {
  const sliderWidth = screenWidth - 100;
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (e) => handleTouch(e.nativeEvent.locationX),
      onPanResponderMove: (e) => handleTouch(e.nativeEvent.locationX),
    })
  ).current;

  const handleTouch = (locationX: number) => {
    let ratio = locationX / sliderWidth;
    if (ratio < 0) ratio = 0;
    if (ratio > 1) ratio = 1;
    const rawVal = min + ratio * (max - min);
    let steppedVal = Math.round(rawVal / step) * step;
    if (steppedVal < min) steppedVal = min;
    if (steppedVal > max) steppedVal = max;
    onChange(steppedVal);
  };

  const percentage = ((value - min) / (max - min)) * 100;

  return (
    <View style={sliderStyles.container}>
      <View style={sliderStyles.labelRow}>
        <Text style={sliderStyles.label}>{label}</Text>
        <Text style={sliderStyles.value}>{value.toFixed(0)}{suffix}</Text>
      </View>
      <View style={[sliderStyles.trackContainer, { width: sliderWidth }]} {...panResponder.panHandlers}>
        <View style={sliderStyles.track} />
        <View style={[sliderStyles.activeTrack, { width: `${percentage}%` }]} />
        <View style={[sliderStyles.thumb, { left: `${percentage}%`, transform: [{ translateX: -8 }] }]} />
      </View>
    </View>
  );
}

const sliderStyles = StyleSheet.create({
  container: { marginVertical: 6, paddingHorizontal: 12 },
  labelRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 2 },
  label: { fontSize: 13, color: '#94A3B8', fontWeight: '600' },
  value: { fontSize: 13, color: '#F8FAFC', fontWeight: '700' },
  trackContainer: { height: 24, justifyContent: 'center', position: 'relative' },
  track: { height: 6, borderRadius: 3, backgroundColor: '#334155', width: '100%' },
  activeTrack: { height: 6, borderRadius: 3, backgroundColor: '#df103f', position: 'absolute', left: 0 },
  thumb: {
    position: 'absolute',
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#df103f',
    borderWidth: 2,
    borderColor: '#FFF',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1.5 },
    shadowOpacity: 0.25,
    shadowRadius: 2,
  },
});

// --- Movable Overlay Component ---
interface MovableProps {
  item: OverlayItem;
  selected: boolean;
  onSelect: (id: string) => void;
  onUpdate: (id: string, patch: Partial<OverlayItem>) => void;
  onCommitHistory: () => void;
  onDelete: (id: string) => void;
}

function Movable({ item, selected, onSelect, onUpdate, onCommitHistory, onDelete }: MovableProps) {
  const startPosition = useRef({ x: 0, y: 0 });
  const startSize = useRef({ width: 0, height: 0 });
  const startRotation = useRef(0);

  const dragPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        onSelect(item.id);
        startPosition.current = { x: item.x, y: item.y };
      },
      onPanResponderMove: (_, gestureState) => {
        onUpdate(item.id, {
          x: startPosition.current.x + gestureState.dx,
          y: startPosition.current.y + gestureState.dy,
        });
      },
      onPanResponderRelease: () => {
        onCommitHistory();
      },
    })
  ).current;

  const resizePanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (e) => {
        e.stopPropagation();
        onSelect(item.id);
        startSize.current = { width: item.width, height: item.height };
      },
      onPanResponderMove: (e, gestureState) => {
        e.stopPropagation();
        onUpdate(item.id, {
          width: Math.max(40, startSize.current.width + gestureState.dx),
          height: Math.max(40, startSize.current.height + gestureState.dy),
        });
      },
      onPanResponderRelease: () => {
        onCommitHistory();
      },
    })
  ).current;

  const rotatePanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (e) => {
        e.stopPropagation();
        onSelect(item.id);
        startRotation.current = item.rotation;
      },
      onPanResponderMove: (e, gestureState) => {
        e.stopPropagation();
        const angleDelta = gestureState.dx * 0.8;
        let newRot = (startRotation.current + angleDelta) % 360;
        if (newRot < 0) newRot += 360;
        onUpdate(item.id, { rotation: Math.round(newRot) });
      },
      onPanResponderRelease: () => {
        onCommitHistory();
      },
    })
  ).current;

  return (
    <View
      style={[
        styles.movable,
        {
          left: item.x,
          top: item.y,
          width: item.width,
          height: item.height,
          transform: [{ rotate: `${item.rotation}deg` }],
          zIndex: selected ? 999 : 10,
        },
      ]}
    >
      <View style={styles.contentContainer} {...dragPanResponder.panHandlers}>
        {item.type === 'text' ? (
          <RNText
            style={{
              fontSize: item.fontSize ?? 20,
              color: item.color ?? '#FFFFFF',
              fontWeight: 'bold',
              textAlign: 'center',
              width: '100%',
              height: '100%',
            }}
          >
            {item.text}
          </RNText>
        ) : (
          <RNText style={{ fontSize: Math.min(item.width, item.height) * 0.8, textAlign: 'center' }}>
            {item.sticker}
          </RNText>
        )}
      </View>

      {selected && (
        <>
          <View style={styles.selectionOutline} pointerEvents="none" />
          <View style={[styles.handle, styles.rotateHandle, { left: item.width / 2 - 12, top: -32 }]} {...rotatePanResponder.panHandlers}>
            <RotateIcon size={12} color="#fff" />
          </View>
          <TouchableOpacity style={[styles.handle, styles.deleteHandle, { right: -12, top: -12 }]} onPress={() => onDelete(item.id)}>
            <CloseIcon size={10} color="#fff" />
          </TouchableOpacity>
          <View style={[styles.handle, styles.resizeHandle, { right: -10, bottom: -10 }]} {...resizePanResponder.panHandlers}>
            <View style={styles.resizeDot} />
          </View>
        </>
      )}
    </View>
  );
}

// --- Main Photo Editor Component ---
export default function PhotoEditor({ route, navigation }: { route?: any; navigation?: any }) {
  const viewShotRef = useRef<any>(null);

  // Core Canvas State
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'select' | 'filters' | 'adjust' | 'transform' | 'draw' | 'overlays'>('select');
  const [isRemovingBg, setIsRemovingBg] = useState(false);

  // Adjustments States
  const [brightness, setBrightness] = useState(1.0);
  const [contrast, setContrast] = useState(1.0);
  const [saturation, setSaturation] = useState(1.0);
  const [blur, setBlur] = useState(0);
  const [filterPreset, setFilterPreset] = useState('normal');

  // Transform States
  const [rotation, setRotation] = useState(0); // 0, 90, 180, 270
  const [flipH, setFlipH] = useState(false);
  const [flipV, setFlipV] = useState(false);
  const [aspectRatio, setAspectRatio] = useState<number | 'free'>('free');

  // Doodling States
  const [drawingMode, setDrawingMode] = useState(false);
  const [drawColor, setDrawColor] = useState('#EF4444');
  const [brushSize, setBrushSize] = useState(6);
  const [strokes, setStrokes] = useState<string[]>([]);
  const [currentStroke, setCurrentStroke] = useState<string | null>(null);

  // Overlay States
  const [overlays, setOverlays] = useState<OverlayItem[]>([]);
  const [selectedOverlay, setSelectedOverlay] = useState<string | null>(null);
  const [textInputVisible, setTextInputVisible] = useState(false);
  const [newText, setNewText] = useState('');

  // Undo/Redo History
  const [history, setHistory] = useState<HistoryState[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  const nextId = useRef(1);

  // Pre-load route photo if supplied
  useEffect(() => {
    if (route?.params?.imageUri) {
      setImageUri(route.params.imageUri);
    }
  }, [route?.params?.imageUri]);

  // Keep history updated
  const commitHistory = (currentState?: Partial<HistoryState>) => {
    const activeState: HistoryState = {
      brightness: currentState?.brightness ?? brightness,
      contrast: currentState?.contrast ?? contrast,
      saturation: currentState?.saturation ?? saturation,
      blur: currentState?.blur ?? blur,
      filterPreset: currentState?.filterPreset ?? filterPreset,
      rotation: currentState?.rotation ?? rotation,
      flipH: currentState?.flipH ?? flipH,
      flipV: currentState?.flipV ?? flipV,
      aspectRatio: currentState?.aspectRatio ?? aspectRatio,
      strokes: currentState?.strokes ?? strokes,
      overlays: currentState?.overlays ?? overlays,
    };

    const updatedHistory = history.slice(0, historyIndex + 1);
    updatedHistory.push(activeState);
    setHistory(updatedHistory);
    setHistoryIndex(updatedHistory.length - 1);
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      const prevIndex = historyIndex - 1;
      const state = history[prevIndex];
      setBrightness(state.brightness);
      setContrast(state.contrast);
      setSaturation(state.saturation);
      setBlur(state.blur);
      setFilterPreset(state.filterPreset);
      setRotation(state.rotation);
      setFlipH(state.flipH);
      setFlipV(state.flipV);
      setAspectRatio(state.aspectRatio);
      setStrokes(state.strokes);
      setOverlays(state.overlays);
      setHistoryIndex(prevIndex);
      setSelectedOverlay(null);
    } else if (historyIndex === 0) {
      // Revert to initial state
      setBrightness(1.0);
      setContrast(1.0);
      setSaturation(1.0);
      setBlur(0);
      setFilterPreset('normal');
      setRotation(0);
      setFlipH(false);
      setFlipV(false);
      setAspectRatio('free');
      setStrokes([]);
      setOverlays([]);
      setHistoryIndex(-1);
      setSelectedOverlay(null);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const nextIndex = historyIndex + 1;
      const state = history[nextIndex];
      setBrightness(state.brightness);
      setContrast(state.contrast);
      setSaturation(state.saturation);
      setBlur(state.blur);
      setFilterPreset(state.filterPreset);
      setRotation(state.rotation);
      setFlipH(state.flipH);
      setFlipV(state.flipV);
      setAspectRatio(state.aspectRatio);
      setStrokes(state.strokes);
      setOverlays(state.overlays);
      setHistoryIndex(nextIndex);
      setSelectedOverlay(null);
    }
  };

  // --- Image Pickers ---
  const handleSelectGallery = async () => {
    const response = await launchImageLibrary({
      mediaType: 'photo',
      quality: 1,
    });
    if (response.assets && response.assets.length > 0 && response.assets[0].uri) {
      setImageUri(response.assets[0].uri);
      resetEditor();
    }
  };

  const handleSelectCamera = async () => {
    if (Platform.OS === 'android') {
      try {
        const hasPermission = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.CAMERA);
        if (!hasPermission) {
          const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.CAMERA,
            {
              title: 'Camera Permission',
              message: 'Flarelap needs access to your camera to take photos.',
              buttonNeutral: 'Ask Me Later',
              buttonNegative: 'Cancel',
              buttonPositive: 'OK',
            }
          );
          if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
            Alert.alert('Permission Denied', 'Camera permission is required to take photos.');
            return;
          }
        }
      } catch (err) {
        console.warn(err);
        return;
      }
    }

    try {
      const response = await launchCamera({
        mediaType: 'photo',
        quality: 1,
      });

      if (response.didCancel) {
        return;
      }

      if (response.errorCode) {
        Alert.alert('Camera Error', response.errorMessage || 'Failed to open camera');
        return;
      }

      if (response.assets && response.assets.length > 0 && response.assets[0].uri) {
        setImageUri(response.assets[0].uri);
        resetEditor();
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'An error occurred while launching camera');
    }
  };

  const resetEditor = () => {
    setBrightness(1.0);
    setContrast(1.0);
    setSaturation(1.0);
    setBlur(0);
    setFilterPreset('normal');
    setRotation(0);
    setFlipH(false);
    setFlipV(false);
    setAspectRatio('free');
    setStrokes([]);
    setOverlays([]);
    setHistory([]);
    setHistoryIndex(-1);
    setSelectedOverlay(null);
  };

  const getUploadType = (uri: string) => {
    const cleanUri = uri.split('?')[0].toLowerCase();
    if (cleanUri.endsWith('.png')) return 'image/png';
    if (cleanUri.endsWith('.webp')) return 'image/webp';
    if (cleanUri.endsWith('.heic')) return 'image/heic';
    if (cleanUri.endsWith('.heif')) return 'image/heif';
    return 'image/jpeg';
  };

  const getUploadName = (uri: string, type: string) => {
    const cleanUri = uri.split('?')[0];
    const name = cleanUri.split('/').pop();
    if (name && name.includes('.')) return name;
    const extension = type.split('/')[1] || 'jpg';
    return `flarelap-photo.${extension === 'jpeg' ? 'jpg' : extension}`;
  };

  const prepareImageForUpload = async (uri: string) => {
    if (!uri.startsWith('http')) {
      const type = getUploadType(uri);
      return { uri, type, name: getUploadName(uri, type) };
    }

    const RNFS = (() => { try { return require('react-native-fs'); } catch { return null; } })();
    if (!RNFS) {
      throw new Error('Cannot prepare remote image for upload.');
    }

    const type = getUploadType(uri);
    const name = getUploadName(uri, type);
    const tmpDir = RNFS.TemporaryDirectoryPath || RNFS.CachesDirectoryPath || RNFS.DocumentDirectoryPath;
    const localPath = `${tmpDir}/${Date.now()}_${name}`;
    const download = RNFS.downloadFile({ fromUrl: uri, toFile: localPath });
    const result = await download.promise;
    if (result.statusCode < 200 || result.statusCode >= 300) {
      throw new Error('Failed to download selected image before upload.');
    }
    return { uri: `file://${localPath}`, type, name };
  };

  const findImageUrlInResponse = (payload: any): string | null => {
    if (!payload) return null;
    if (typeof payload === 'string') return payload;
    const candidates = [
      payload.url,
      payload.image_url,
      payload.imageUrl,
      payload.output_url,
      payload.outputUrl,
      payload.output,
      payload.result,
      payload.image,
      payload.file,
      payload.base64,
      payload.b64,
      payload.data,
      payload.data?.url,
      payload.data?.image_url,
      payload.data?.imageUrl,
      payload.data?.output_url,
      payload.data?.outputUrl,
      payload.data?.output,
      payload.data?.result,
      payload.data?.image,
      payload.data?.file,
      payload.data?.base64,
      payload.data?.b64,
    ];
    return candidates.find((value) => typeof value === 'string' && value.trim().length > 0) || null;
  };

  const normalizeResultImageUri = async (value: string) => {
    if (value.startsWith('/')) {
      return `https://ai.flarelap.com${value}`;
    }

    if (value.startsWith('http') || value.startsWith('file://') || value.startsWith('content://') || value.startsWith('data:')) {
      return value;
    }

    const base64Pattern = /^[A-Za-z0-9+/]+={0,2}$/;
    if (value.length > 100 && base64Pattern.test(value.replace(/\s/g, ''))) {
      const RNFS = (() => { try { return require('react-native-fs'); } catch { return null; } })();
      if (!RNFS) return `data:image/png;base64,${value}`;
      const tmpDir = RNFS.TemporaryDirectoryPath || RNFS.CachesDirectoryPath || RNFS.DocumentDirectoryPath;
      const filePath = `${tmpDir}/flarelap_removed_bg_${Date.now()}.png`;
      await RNFS.writeFile(filePath, value, 'base64');
      return `file://${filePath}`;
    }

    return value;
  };

  const readBlobAsDataUrl = (blob: Blob) => {
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(String(reader.result));
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  const getImageExtensionFromType = (type: string) => {
    if (type.includes('jpeg') || type.includes('jpg')) return 'jpg';
    if (type.includes('webp')) return 'webp';
    if (type.includes('heic')) return 'heic';
    if (type.includes('heif')) return 'heif';
    return 'png';
  };

  const saveBlobResponseAsImage = async (response: Response, contentType: string) => {
    const blob = await response.blob();
    const dataUrl = await readBlobAsDataUrl(blob);
    const [meta, base64] = dataUrl.split(',');
    if (!base64) {
      throw new Error('Background removal returned an invalid image file.');
    }

    const imageType = (contentType || meta.match(/data:(.*);base64/)?.[1] || blob.type || 'image/png').split(';')[0];
    const RNFS = (() => { try { return require('react-native-fs'); } catch { return null; } })();
    if (!RNFS) {
      return `data:${imageType};base64,${base64}`;
    }

    const tmpDir = RNFS.TemporaryDirectoryPath || RNFS.CachesDirectoryPath || RNFS.DocumentDirectoryPath;
    const filePath = `${tmpDir}/flarelap_removed_bg_${Date.now()}.${getImageExtensionFromType(imageType)}`;
    await RNFS.writeFile(filePath, base64, 'base64');
    return `file://${filePath}`;
  };

  const handleRemoveBackground = async () => {
    if (!imageUri || isRemovingBg) return;

    setIsRemovingBg(true);
    try {
      const uploadFile = await prepareImageForUpload(imageUri);
      const formData = new FormData();
      formData.append('file', uploadFile as any);

      const response = await fetch('https://ai.flarelap.com/remove-bg', {
        method: 'POST',
        headers: {
          Accept: 'image/png, image/*, application/octet-stream, application/json',
        },
        body: formData,
      });

      const contentType = response.headers.get('content-type') || '';
      let nextImageUri: string | null = null;

      if (contentType.includes('application/json')) {
        const payload = await response.json();
        if (!response.ok) {
          throw new Error(payload.message || payload.error || 'Background removal failed.');
        }

        const resultUri = findImageUrlInResponse(payload);
        if (!resultUri) {
          throw new Error('Background removed, but the response did not include an image URL.');
        }
        nextImageUri = await normalizeResultImageUri(resultUri);
      } else if (contentType.startsWith('text/')) {
        const payload = await response.text();
        if (!response.ok) {
          throw new Error(payload || 'Background removal failed.');
        }
        nextImageUri = await normalizeResultImageUri(payload);
      } else {
        if (!response.ok) {
          throw new Error('Background removal failed.');
        }
        nextImageUri = await saveBlobResponseAsImage(response, contentType);
      }

      setImageUri(nextImageUri);
      Alert.alert('Background Removed', 'Your photo background has been removed.');
    } catch (err: any) {
      console.warn('remove background failed', err);
      Alert.alert('Remove Background Failed', err.message || 'Could not remove the background. Please try again.');
    } finally {
      setIsRemovingBg(false);
    }
  };

  // --- Crop Aspect Ratios ---
  const cropBoxDimensions = useMemo(() => {
    if (aspectRatio === 'free') {
      return { width: CANVAS_SIZE, height: CANVAS_SIZE };
    }
    if (aspectRatio >= 1) {
      return { width: CANVAS_SIZE, height: CANVAS_SIZE / aspectRatio };
    } else {
      return { width: CANVAS_SIZE * aspectRatio, height: CANVAS_SIZE };
    }
  }, [aspectRatio]);

  // --- Doodling Handlers ---
  const drawingPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => drawingMode,
      onMoveShouldSetPanResponder: () => drawingMode,
      onPanResponderGrant: (e) => {
        if (!drawingMode) return;
        const { locationX, locationY } = e.nativeEvent;
        // Scale to 400x400 SVG viewbox
        const x = (locationX / cropBoxDimensions.width) * 400;
        const y = (locationY / cropBoxDimensions.height) * 400;
        setCurrentStroke(`M ${x.toFixed(1)} ${y.toFixed(1)}`);
      },
      onPanResponderMove: (e) => {
        if (!drawingMode) return;
        const { locationX, locationY } = e.nativeEvent;
        const x = (locationX / cropBoxDimensions.width) * 400;
        const y = (locationY / cropBoxDimensions.height) * 400;
        setCurrentStroke((prev) => `${prev} L ${x.toFixed(1)} ${y.toFixed(1)}`);
      },
      onPanResponderRelease: () => {
        if (!drawingMode || !currentStroke) return;
        const finalStroke = `${currentStroke}@@color:${drawColor}@@size:${brushSize}`;
        const updatedStrokes = [...strokes, finalStroke];
        setStrokes(updatedStrokes);
        setCurrentStroke(null);
        commitHistory({ strokes: updatedStrokes });
      },
    })
  ).current;

  // Render individual strokes
  const renderStrokes = () => {
    return (
      <>
        {strokes.map((strokeStr, index) => {
          const parts = strokeStr.split('@@');
          const pathD = parts[0];
          let color = '#EF4444';
          let size = 6;
          parts.forEach((p) => {
            if (p.startsWith('color:')) color = p.replace('color:', '');
            if (p.startsWith('size:')) size = parseInt(p.replace('size:', ''), 10);
          });
          return (
            <Path
              key={`stroke_${index}`}
              d={pathD}
              fill="none"
              stroke={color}
              strokeWidth={size}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          );
        })}
        {currentStroke && (
          <Path
            d={currentStroke}
            fill="none"
            stroke={drawColor}
            strokeWidth={brushSize}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}
      </>
    );
  };

  // --- Overlay Handlers ---
  const addTextOverlay = () => {
    if (!newText.trim()) return;
    const id = `text_${nextId.current++}`;
    const newItem: OverlayItem = {
      id,
      type: 'text',
      text: newText,
      x: cropBoxDimensions.width / 2 - 60,
      y: cropBoxDimensions.height / 2 - 25,
      width: 120,
      height: 50,
      rotation: 0,
      color: '#FFFFFF',
      fontSize: 20,
    };
    const updated = [...overlays, newItem];
    setOverlays(updated);
    setSelectedOverlay(id);
    setNewText('');
    setTextInputVisible(false);
    commitHistory({ overlays: updated });
  };

  const addStickerOverlay = (emoji: string) => {
    const id = `sticker_${nextId.current++}`;
    const newItem: OverlayItem = {
      id,
      type: 'sticker',
      sticker: emoji,
      x: cropBoxDimensions.width / 2 - 40,
      y: cropBoxDimensions.height / 2 - 40,
      width: 80,
      height: 80,
      rotation: 0,
    };
    const updated = [...overlays, newItem];
    setOverlays(updated);
    setSelectedOverlay(id);
    commitHistory({ overlays: updated });
  };

  const updateOverlayItem = (id: string, patch: Partial<OverlayItem>) => {
    setOverlays((prev) => prev.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  };

  const deleteOverlayItem = (id: string) => {
    const updated = overlays.filter((item) => item.id !== id);
    setOverlays(updated);
    setSelectedOverlay(null);
    commitHistory({ overlays: updated });
  };

  // --- Helpers: save and share image file ---
  const saveImageToDevice = async (localUri: string) => {
    try {
      const RNFS = (() => { try { return require('react-native-fs'); } catch { return null; } })();
      if (!RNFS) throw new Error('RNFS not available');
      const ts = Date.now();
      const filename = `flarelap_photo_${ts}.jpg`;
      let destPath = '';
      if (Platform.OS === 'android') {
        destPath = `${RNFS.DownloadDirectoryPath}/${filename}`;
      } else {
        destPath = `${RNFS.DocumentDirectoryPath}/${filename}`;
      }

      if (localUri.startsWith('file://')) {
        const src = localUri.replace('file://', '');
        await RNFS.copyFile(src, destPath);
      } else if (localUri.startsWith('data:')) {
        const base64 = localUri.split(',')[1];
        await RNFS.writeFile(destPath, base64, 'base64');
      } else {
        // fallback: try copying by path (may fail for content://)
        try { await RNFS.copyFile(localUri, destPath); } catch (e) { throw e; }
      }

      try { if (Platform.OS === 'android' && RNFS.scanFile) { await RNFS.scanFile(destPath); } } catch (e) {}
      Alert.alert('Saved', `Image saved to ${Platform.OS === 'android' ? 'Downloads' : 'Files'} (${filename})`);
      return true;
    } catch (err) {
      console.warn('saveImageToDevice failed', err);
      // fallback to share
      try {
        await Share.share(Platform.OS === 'ios' ? { url: localUri } : { message: 'Check out my edited photo', url: localUri });
      } catch (e) {
        Alert.alert('Save failed', 'Could not save or share the image.');
      }
      return false;
    }
  };

  const shareImageFile = async (localUri: string) => {
    try {
      const RNFS = (() => { try { return require('react-native-fs'); } catch { return null; } })();
      let shareUrl = localUri;

      if (localUri.startsWith('data:')) {
        if (RNFS) {
          const ts = Date.now();
          const tmp = RNFS.TemporaryDirectoryPath || RNFS.CachesDirectoryPath || RNFS.DocumentDirectoryPath;
          const filePath = `${tmp}/flarelap_share_${ts}.jpg`;
          const base64 = localUri.split(',')[1];
          await RNFS.writeFile(filePath, base64, 'base64');
          shareUrl = `file://${filePath}`;
        }
      }

      await Share.share(Platform.OS === 'ios' ? { url: shareUrl } : { message: 'Check out my edited photo', url: shareUrl });
    } catch (err) {
      console.warn('shareImageFile failed', err);
      Alert.alert('Share Failed', 'Failed to share the image.');
    }
  };

  // --- Export and Save ---
  const handleExportPhoto = async () => {
    if (!imageUri) {
      Alert.alert('No Photo selected', 'Please select a photo to edit first.');
      return;
    }
    // Deselect any active overlays for snapshot clean output
    setSelectedOverlay(null);

    // Give state updates a brief millisecond to settle
    setTimeout(async () => {
      try {
        const uri = await captureRef(viewShotRef, {
          format: 'jpg',
          quality: 0.95,
        });

        Alert.alert(
          'Photo Export Ready!',
          'Your edited photo is compiled natively. What would you like to do?',
          [
            { text: 'Download', onPress: async () => { await saveImageToDevice(uri); } },
            { text: 'Share', onPress: async () => { await shareImageFile(uri); } },
            { text: 'Cancel', style: 'cancel' },
          ]
        );
      } catch (err: any) {
        Alert.alert('Export Failed', err.message || 'Failed to capture screen.');
      }
    }, 100);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.container}>
        {/* Header Bar */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation?.goBack()} style={styles.headerBtn}>
            <CloseIcon size={20} color="#F8FAFC" />
          </TouchableOpacity>
          <Title style={styles.headerTitle}>Photo Editor</Title>
          <View style={styles.headerRight}>
            <TouchableOpacity
              onPress={handleUndo}
              disabled={historyIndex < 0 && history.length === 0}
              style={[styles.actionIconBtn, historyIndex < 0 && styles.disabledBtn]}
            >
              <UndoIcon size={18} color={historyIndex < 0 ? '#475569' : '#F8FAFC'} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleRedo}
              disabled={historyIndex >= history.length - 1}
              style={[styles.actionIconBtn, (historyIndex >= history.length - 1 || history.length === 0) && styles.disabledBtn]}
            >
              <RedoIcon size={18} color={(historyIndex >= history.length - 1 || history.length === 0) ? '#475569' : '#F8FAFC'} />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleExportPhoto} style={styles.exportBtn} disabled={!imageUri}>
              <CheckIcon size={16} color="#ffffff" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Interactive Editing Canvas */}
        <View style={styles.canvasContainer}>
          {imageUri ? (
            <ViewShot
              ref={viewShotRef}
              options={{ format: 'jpg', quality: 0.95 }}
              style={[
                styles.canvasWrapper,
                {
                  width: cropBoxDimensions.width,
                  height: cropBoxDimensions.height,
                  overflow: 'hidden',
                },
              ]}
            >
              {/* Checkerboard transparent representation background */}
              <View style={styles.checkerboard} />

              {/* Native Image view modified via SVG filter primitives */}
              <TouchableOpacity
                activeOpacity={1}
                onPress={() => setSelectedOverlay(null)}
                style={[
                  styles.imageViewport,
                  {
                    transform: [
                      { rotate: `${rotation}deg` },
                      { scaleX: flipH ? -1 : 1 },
                      { scaleY: flipV ? -1 : 1 },
                    ],
                  },
                ]}
                {...drawingPanResponder.panHandlers}
              >
                <Svg
                  width="100%"
                  height="100%"
                  viewBox="0 0 400 400"
                  pointerEvents="none"
                >
                  <Defs>
                    <Filter id="editorFilters">
                      {/* Brightness */}
                      <FeColorMatrix
                        type="matrix"
                        values={`${brightness} 0 0 0 0
                                0 ${brightness} 0 0 0
                                0 0 ${brightness} 0 0
                                0 0 0 1 0`}
                        result="bright"
                      />
                      {/* Contrast */}
                      <FeColorMatrix
                        type="matrix"
                        values={`${contrast} 0 0 0 ${0.5 * (1 - contrast)}
                                0 ${contrast} 0 0 ${0.5 * (1 - contrast)}
                                0 0 ${contrast} 0 ${0.5 * (1 - contrast)}
                                0 0 0 1 0`}
                        in="bright"
                        result="cont"
                      />
                      {/* Saturation */}
                      <FeColorMatrix
                        type="matrix"
                        values={`${0.213 + 0.787 * saturation} ${0.715 - 0.715 * saturation} ${0.072 - 0.072 * saturation} 0 0
                                ${0.213 - 0.213 * saturation} ${0.715 + 0.285 * saturation} ${0.072 - 0.072 * saturation} 0 0
                                ${0.213 - 0.213 * saturation} ${0.715 - 0.715 * saturation} ${0.072 + 0.928 * saturation} 0 0
                                0 0 0 1 0`}
                        in="cont"
                        result="sat"
                      />
                      {/* Preset filters */}
                      {filterPreset === 'vintage' && (
                        <FeColorMatrix
                          type="matrix"
                          values="0.9 0.3 0.1 0 0
                                  0.3 0.8 0.1 0 0
                                  0.1 0.2 0.7 0 0
                                  0   0   0   1 0"
                          in="sat"
                          result="preset"
                        />
                      )}
                      {filterPreset === 'retro' && (
                        <FeColorMatrix
                          type="matrix"
                          values="0.75 0.25 0.1 0 0.05
                                  0.1 0.8 0.1 0 0.05
                                  0.05 0.1 0.65 0 0.05
                                  0 0 0 1 0"
                          in="sat"
                          result="preset"
                        />
                      )}
                      {filterPreset === 'warm' && (
                        <FeColorMatrix
                          type="matrix"
                          values="1.1 0 0 0 0.05
                                  0 1.05 0 0 0.03
                                  0 0 0.9 0 -0.05
                                  0 0 0 1 0"
                          in="sat"
                          result="preset"
                        />
                      )}
                      {filterPreset === 'cool' && (
                        <FeColorMatrix
                          type="matrix"
                          values="0.9 0 0 0 -0.05
                                  0 1.0 0 0 0.02
                                  0 0 1.15 0 0.05
                                  0 0 0 1 0"
                          in="sat"
                          result="preset"
                        />
                      )}
                      {filterPreset === 'noir' && (
                        <FeColorMatrix
                          type="matrix"
                          values="0.3 0.59 0.11 0 -0.05
                                  0.3 0.59 0.11 0 -0.05
                                  0.3 0.59 0.11 0 -0.05
                                  0 0 0 1 0"
                          in="sat"
                          result="preset"
                        />
                      )}
                      {filterPreset === 'sepia' && (
                        <FeColorMatrix
                          type="matrix"
                          values="0.393 0.769 0.189 0 0
                                  0.349 0.686 0.168 0 0
                                  0.272 0.534 0.131 0 0
                                  0 0 0 1 0"
                          in="sat"
                          result="preset"
                        />
                      )}
                      {filterPreset === 'grayscale' && (
                        <FeColorMatrix
                          type="matrix"
                          values="0.2126 0.7152 0.0722 0 0
                                  0.2126 0.7152 0.0722 0 0
                                  0.2126 0.7152 0.0722 0 0
                                  0      0      0      1 0"
                          in="sat"
                          result="preset"
                        />
                      )}
                      {filterPreset === 'invert' && (
                        <FeColorMatrix
                          type="matrix"
                          values="-1 0 0 0 1
                                  0 -1 0 0 1
                                  0 0 -1 0 1
                                  0 0 0 1 0"
                          in="sat"
                          result="preset"
                        />
                      )}

                      {/* Gaussian Blur */}
                      {blur > 0 ? (
                        <FeGaussianBlur
                          stdDeviation={blur}
                          in={filterPreset !== 'normal' ? 'preset' : 'sat'}
                        />
                      ) : null}
                    </Filter>
                  </Defs>

                  {/* Backing Image element */}
                  <SvgImage
                    x="0"
                    y="0"
                    width="400"
                    height="400"
                    preserveAspectRatio="xMidYMid slice"
                    href={imageUri}
                    filter="url(#editorFilters)"
                  />

                  {/* Draw layer inside vector canvas */}
                  {renderStrokes()}
                </Svg>
              </TouchableOpacity>

              {/* Movable Overlays (Text / Stickers) */}
              <View style={StyleSheet.absoluteFillObject} pointerEvents="box-none">
                {overlays.map((it) => (
                  <Movable
                    key={it.id}
                    item={it}
                    selected={selectedOverlay === it.id}
                    onSelect={setSelectedOverlay}
                    onUpdate={updateOverlayItem}
                    onCommitHistory={() => commitHistory({ overlays })}
                    onDelete={deleteOverlayItem}
                  />
                ))}
              </View>
            </ViewShot>
          ) : (
            /* Choose Photo Placeholder Screen */
            <View style={styles.selectPromptWrapper}>
              <Title style={styles.promptTitle}>Start Editing a Photo</Title>
              <Text style={styles.promptSubtitle}>Upload an image from your library, capture from camera, or customize a pre-selected preset.</Text>

              <View style={styles.promptActions}>
                <TouchableOpacity style={styles.selectBigBtn} onPress={handleSelectGallery}>
                  <ImageIcon size={28} color="#ffffff" />
                  <Text style={styles.selectBigLabel}>Gallery</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.selectBigBtn} onPress={handleSelectCamera}>
                  <CameraIcon size={28} color="#ffffff" />
                  <Text style={styles.selectBigLabel}>Camera</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.presetsWrapper}>
                <Text style={styles.presetsHeader}>Preset Stock Photos</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.presetsScroll}>
                  {STOCK_PHOTOS.map((stock) => (
                    <TouchableOpacity
                      key={stock.name}
                      style={styles.presetCard}
                      onPress={() => {
                        setImageUri(stock.url);
                        resetEditor();
                      }}
                    >
                      <RNImage source={{ uri: stock.url }} style={styles.presetThumb} />
                      <Text style={styles.presetName} numberOfLines={1}>{stock.name}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </View>
          )}
        </View>

        {/* Bottom Editing Control Deck */}
        {imageUri && (
          <View style={styles.deck}>
            {/* Dynamic Controls based on Active Tab */}
            <View style={styles.deckPanel}>
              {/* --- 1. SELECT TAB --- */}
              {activeTab === 'select' && (
                <View style={styles.panelContent}>
                  <Text style={styles.panelTitle}>Image Settings</Text>
                  <View style={styles.rowActions}>
                    <Button
                      mode="contained"
                      buttonColor="#df103f"
                      textColor="#ffffff"
                      icon={() => <ImageIcon size={16} color="#fff" />}
                      style={styles.actionButton}
                      onPress={handleSelectGallery}
                    >
                      Gallery
                    </Button>
                    <Button
                      mode="contained"
                      buttonColor="#1E293B"
                      textColor="#ffffff"
                      icon={() => <CameraIcon size={16} color="#fff" />}
                      style={styles.actionButtonCamera}
                      onPress={handleSelectCamera}
                    >
                      Camera
                    </Button>
                    <Button
                      mode="outlined"
                      textColor="#F8FAFC"
                      style={styles.actionButtonReset}
                      onPress={resetEditor}
                    >
                      Reset All
                    </Button>
                  </View>
                  <Button
                    mode="contained"
                    buttonColor="#10B981"
                    textColor="#ffffff"
                    icon={() => <MagicIcon size={16} color="#fff" />}
                    style={styles.removeBgButton}
                    loading={isRemovingBg}
                    disabled={isRemovingBg}
                    onPress={handleRemoveBackground}
                  >
                    {isRemovingBg ? 'Removing Background...' : 'Remove Background'}
                  </Button>
                </View>
              )}

              {/* --- 2. FILTERS TAB --- */}
              {activeTab === 'filters' && (
                <View style={styles.panelContent}>
                  <Text style={styles.panelTitle}>Filter Presets</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filtersScroll}>
                    {[
                      { id: 'normal', name: 'Normal' },
                      { id: 'vintage', name: 'Vintage' },
                      { id: 'retro', name: 'Retro' },
                      { id: 'warm', name: 'Warm' },
                      { id: 'cool', name: 'Cool' },
                      { id: 'noir', name: 'Noir' },
                      { id: 'sepia', name: 'Sepia' },
                      { id: 'invert', name: 'Invert' },
                      { id: 'grayscale', name: 'Grayscale' },
                    ].map((filt) => (
                      <TouchableOpacity
                        key={filt.id}
                        style={[styles.filterBtn, filterPreset === filt.id && styles.filterBtnActive]}
                        onPress={() => {
                          setFilterPreset(filt.id);
                          commitHistory({ filterPreset: filt.id });
                        }}
                      >
                        <Text style={[styles.filterBtnLabel, filterPreset === filt.id && styles.filterBtnLabelActive]}>
                          {filt.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}

              {/* --- 3. ADJUST TAB --- */}
              {activeTab === 'adjust' && (
                <View style={styles.panelContent}>
                  <CustomSlider
                    label="Brightness"
                    min={0.5}
                    max={2.0}
                    step={0.05}
                    value={brightness}
                    onChange={(v) => {
                      setBrightness(v);
                      commitHistory({ brightness: v });
                    }}
                  />
                  <CustomSlider
                    label="Contrast"
                    min={0.5}
                    max={2.0}
                    step={0.05}
                    value={contrast}
                    onChange={(v) => {
                      setContrast(v);
                      commitHistory({ contrast: v });
                    }}
                  />
                  <CustomSlider
                    label="Saturation"
                    min={0.0}
                    max={2.5}
                    step={0.05}
                    value={saturation}
                    onChange={(v) => {
                      setSaturation(v);
                      commitHistory({ saturation: v });
                    }}
                  />
                  <CustomSlider
                    label="Blur Effect"
                    min={0}
                    max={12}
                    step={0.5}
                    value={blur}
                    onChange={(v) => {
                      setBlur(v);
                      commitHistory({ blur: v });
                    }}
                  />
                </View>
              )}

              {/* --- 4. TRANSFORM TAB --- */}
              {activeTab === 'transform' && (
                <View style={styles.panelContent}>
                  <Text style={styles.panelTitle}>Transform & Rotate</Text>
                  <View style={styles.transformRow}>
                    <TouchableOpacity
                      style={styles.transformActionBtn}
                      onPress={() => {
                        const nextRot = (rotation + 90) % 360;
                        setRotation(nextRot);
                        commitHistory({ rotation: nextRot });
                      }}
                    >
                      <RotateIcon size={18} color="#fff" />
                      <Text style={styles.transformBtnLabel}>Rotate 90°</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.transformActionBtn}
                      onPress={() => {
                        setFlipH(!flipH);
                        commitHistory({ flipH: !flipH });
                      }}
                    >
                      <FlipIcon size={18} color="#fff" horizontal={true} />
                      <Text style={styles.transformBtnLabel}>Flip H</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.transformActionBtn}
                      onPress={() => {
                        setFlipV(!flipV);
                        commitHistory({ flipV: !flipV });
                      }}
                    >
                      <FlipIcon size={18} color="#fff" horizontal={false} />
                      <Text style={styles.transformBtnLabel}>Flip V</Text>
                    </TouchableOpacity>
                  </View>

                  <Text style={[styles.panelTitle, { marginTop: 12 }]}>Aspect Crop Boundaries</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.ratiosScroll}>
                    {[
                      { value: 'free', label: 'Free' },
                      { value: 1.0, label: '1:1 Square' },
                      { value: 4 / 3, label: '4:3 Standard' },
                      { value: 16 / 9, label: '16:9 Cinema' },
                      { value: 9 / 16, label: '9:16 Portrait' },
                    ].map((ratio) => (
                      <TouchableOpacity
                        key={ratio.label}
                        style={[
                          styles.ratioBtn,
                          aspectRatio === ratio.value && styles.ratioBtnActive,
                        ]}
                        onPress={() => {
                          setAspectRatio(ratio.value as any);
                          commitHistory({ aspectRatio: ratio.value as any });
                        }}
                      >
                        <Text style={[styles.ratioBtnLabel, aspectRatio === ratio.value && styles.ratioBtnLabelActive]}>
                          {ratio.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}

              {/* --- 5. DRAW TAB --- */}
              {activeTab === 'draw' && (
                <View style={styles.panelContent}>
                  <View style={styles.drawHeader}>
                    <Text style={styles.panelTitle}>Doodle & Draw</Text>
                    <TouchableOpacity
                      style={[styles.drawModeToggle, drawingMode && styles.drawModeToggleActive]}
                      onPress={() => setDrawingMode(!drawingMode)}
                    >
                      <Text style={[styles.drawModeToggleLabel, drawingMode && styles.drawModeToggleLabelActive]}>
                        {drawingMode ? 'Brush: ON' : 'Brush: OFF'}
                      </Text>
                    </TouchableOpacity>
                  </View>

                  <CustomSlider
                    label="Brush Size"
                    min={2}
                    max={20}
                    step={1}
                    value={brushSize}
                    onChange={setBrushSize}
                  />

                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.drawColorsScroll}>
                    {PRESET_COLORS.map((c) => (
                      <TouchableOpacity
                        key={c}
                        style={[
                          styles.colorBubble,
                          { backgroundColor: c },
                          drawColor === c && styles.activeColorBubble,
                        ]}
                        onPress={() => setDrawColor(c)}
                      />
                    ))}
                  </ScrollView>

                  <View style={styles.drawRow}>
                    <Button
                      mode="outlined"
                      textColor="#F8FAFC"
                      style={[styles.drawBtn, { borderColor: '#475569' }]}
                      onPress={() => {
                        setStrokes([]);
                        commitHistory({ strokes: [] });
                      }}
                    >
                      Clear Drawing
                    </Button>
                  </View>
                </View>
              )}

              {/* --- 6. OVERLAYS TAB --- */}
              {activeTab === 'overlays' && (
                <View style={styles.panelContent}>
                  <Text style={styles.panelTitle}>Add Text & Stickers</Text>
                  <View style={styles.overlayButtons}>
                    <Button
                      mode="contained"
                      buttonColor="#df103f"
                      textColor="#ffffff"
                      icon={() => <TextIcon size={16} color="#fff" />}
                      style={styles.overlayActionBtn}
                      onPress={() => setTextInputVisible(true)}
                    >
                      Add Text
                    </Button>
                  </View>

                  <Text style={[styles.panelTitle, { marginTop: 10, marginBottom: 4 }]}>Tap to Add Sticker</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.emojisScroll}>
                    {PRESET_EMOJIS.map((emoji) => (
                      <TouchableOpacity
                        key={emoji}
                        style={styles.emojiCard}
                        onPress={() => addStickerOverlay(emoji)}
                      >
                        <Text style={styles.emojiText}>{emoji}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}
            </View>

            {/* Bottom Primary Tab Strip */}
            <View style={styles.tabStrip}>
              <TouchableOpacity
                style={[styles.tabItem, activeTab === 'select' && styles.tabItemActive]}
                onPress={() => {
                  setDrawingMode(false);
                  setActiveTab('select');
                }}
              >
                <ImageIcon size={18} color={activeTab === 'select' ? '#df103f' : '#94A3B8'} />
                <Text style={[styles.tabLabel, activeTab === 'select' && styles.tabLabelActive]}>Image</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.tabItem, activeTab === 'filters' && styles.tabItemActive]}
                onPress={() => {
                  setDrawingMode(false);
                  setActiveTab('filters');
                }}
              >
                <SlidersIcon size={18} color={activeTab === 'filters' ? '#df103f' : '#94A3B8'} />
                <Text style={[styles.tabLabel, activeTab === 'filters' && styles.tabLabelActive]}>Filters</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.tabItem, activeTab === 'adjust' && styles.tabItemActive]}
                onPress={() => {
                  setDrawingMode(false);
                  setActiveTab('adjust');
                }}
              >
                <SlidersIcon size={18} color={activeTab === 'adjust' ? '#df103f' : '#94A3B8'} />
                <Text style={[styles.tabLabel, activeTab === 'adjust' && styles.tabLabelActive]}>Adjust</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.tabItem, activeTab === 'transform' && styles.tabItemActive]}
                onPress={() => {
                  setDrawingMode(false);
                  setActiveTab('transform');
                }}
              >
                <CropIcon size={18} color={activeTab === 'transform' ? '#df103f' : '#94A3B8'} />
                <Text style={[styles.tabLabel, activeTab === 'transform' && styles.tabLabelActive]}>Crop</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.tabItem, activeTab === 'draw' && styles.tabItemActive]}
                onPress={() => {
                  setDrawingMode(true);
                  setActiveTab('draw');
                }}
              >
                <BrushIcon size={18} color={activeTab === 'draw' ? '#df103f' : '#94A3B8'} />
                <Text style={[styles.tabLabel, activeTab === 'draw' && styles.tabLabelActive]}>Draw</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.tabItem, activeTab === 'overlays' && styles.tabItemActive]}
                onPress={() => {
                  setDrawingMode(false);
                  setActiveTab('overlays');
                }}
              >
                <TextIcon size={18} color={activeTab === 'overlays' ? '#df103f' : '#94A3B8'} />
                <Text style={[styles.tabLabel, activeTab === 'overlays' && styles.tabLabelActive]}>Overlays</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Modal for Text Input */}
        <Modal
          visible={textInputVisible}
          animationType="fade"
          transparent={true}
          onRequestClose={() => setTextInputVisible(false)}
        >
          <View style={styles.modalBg}>
            <View style={styles.modalCard}>
              <Title style={styles.modalTitle}>Add Text Overlay</Title>
              <TextInput
                mode="outlined"
                label="Overlay Text"
                textColor="#000"
                value={newText}
                onChangeText={setNewText}
                style={styles.modalTextInput}
                autoFocus={true}
              />
              <View style={styles.modalActions}>
                <Button
                  mode="outlined"
                  textColor="#475569"
                  style={styles.modalBtn}
                  onPress={() => {
                    setTextInputVisible(false);
                    setNewText('');
                  }}
                >
                  Cancel
                </Button>
                <Button
                  mode="contained"
                  buttonColor="#df103f"
                  textColor="#fff"
                  style={styles.modalBtn}
                  onPress={addTextOverlay}
                >
                  Add
                </Button>
              </View>
            </View>
          </View>
        </Modal>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#090D16' },
  container: { flex: 1 },
  header: {
    height: 54,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  headerBtn: { padding: 8 },
  headerTitle: { fontSize: 18, color: '#F8FAFC', fontWeight: '800' },
  headerRight: { flexDirection: 'row', alignItems: 'center' },
  actionIconBtn: { padding: 8, marginLeft: 4 },
  disabledBtn: { opacity: 0.35 },
  exportBtn: {
    backgroundColor: '#df103f',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },

  canvasContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  canvasWrapper: {
    backgroundColor: '#0F172A',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 10,
    elevation: 10,
    position: 'relative',
  },
  checkerboard: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#1E293B',
    opacity: 0.15,
  },
  imageViewport: {
    width: '100%',
    height: '100%',
  },

  // Choose photo layout
  selectPromptWrapper: {
    alignItems: 'center',
    paddingHorizontal: 24,
    width: '100%',
  },
  promptTitle: { fontSize: 22, fontWeight: '800', color: '#F8FAFC', textAlign: 'center' },
  promptSubtitle: { fontSize: 13, color: '#94A3B8', textAlign: 'center', marginTop: 8, lineHeight: 18 },
  promptActions: {
    flexDirection: 'row',
    marginTop: 24,
    justifyContent: 'center',
    width: '100%',
  },
  selectBigBtn: {
    backgroundColor: '#1E293B',
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 14,
    marginHorizontal: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
    flexDirection: 'row',
  },
  selectBigLabel: { color: '#F8FAFC', fontSize: 15, fontWeight: '700', marginLeft: 8 },
  presetsWrapper: { marginTop: 40, width: '100%' },
  presetsHeader: { color: '#94A3B8', fontSize: 13, fontWeight: '800', marginBottom: 12, paddingLeft: 4 },
  presetsScroll: { flexDirection: 'row' },
  presetCard: { marginRight: 12, width: 90, alignItems: 'center' },
  presetThumb: { width: 90, height: 90, borderRadius: 10, backgroundColor: '#1E293B' },
  presetName: { fontSize: 11, color: '#64748B', marginTop: 4, textAlign: 'center' },

  // Movables elements style
  movable: { position: 'absolute' },
  contentContainer: { width: '100%', height: '100%' },
  selectionOutline: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: 1.5,
    borderColor: '#df103f',
    borderStyle: 'dashed',
  },
  handle: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.25,
    shadowRadius: 1,
    elevation: 2,
  },
  deleteHandle: { backgroundColor: '#ef4444' },
  rotateHandle: { backgroundColor: '#3b82f6' },
  resizeHandle: { backgroundColor: '#10b981', justifyContent: 'center', alignItems: 'center' },
  resizeDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#ffffff' },

  // Deck Control panels
  deck: {
    borderTopWidth: 1,
    borderTopColor: '#1E293B',
    backgroundColor: '#0F172A',
  },
  deckPanel: {
    padding: 12,
    minHeight: 125,
    justifyContent: 'center',
  },
  panelContent: { width: '100%' },
  panelTitle: { color: '#94A3B8', fontSize: 12, fontWeight: '800', textTransform: 'uppercase', marginBottom: 8, paddingHorizontal: 6 },
  rowActions: { flexDirection: 'row', justifyContent: 'center', paddingVertical: 4 },
  actionButton: { marginHorizontal: 6, flex: 1 },
  actionButtonCamera: { marginHorizontal: 6, flex: 1, borderWidth: 1, borderColor: '#334155' },
  actionButtonReset: { marginHorizontal: 6, flex: 1, borderColor: '#475569' },
  removeBgButton: { marginHorizontal: 6, marginTop: 10 },

  // Filters scroll
  filtersScroll: { paddingVertical: 4 },
  filterBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#1E293B',
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  filterBtnActive: { backgroundColor: '#df103f', borderColor: '#df103f' },
  filterBtnLabel: { color: '#94A3B8', fontSize: 13, fontWeight: '600' },
  filterBtnLabelActive: { color: '#ffffff', fontWeight: '700' },

  // Transform Deck style
  transformRow: { flexDirection: 'row', justifyContent: 'space-around', marginVertical: 4 },
  transformActionBtn: {
    alignItems: 'center',
    backgroundColor: '#1E293B',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#334155',
    flex: 1,
    marginHorizontal: 4,
  },
  transformBtnLabel: { color: '#94A3B8', fontSize: 11, marginTop: 4, fontWeight: '600' },
  ratiosScroll: { paddingVertical: 4 },
  ratioBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    backgroundColor: '#1E293B',
    borderRadius: 6,
    marginRight: 6,
    borderWidth: 1,
    borderColor: '#334155',
  },
  ratioBtnActive: { backgroundColor: '#df103f', borderColor: '#df103f' },
  ratioBtnLabel: { color: '#94A3B8', fontSize: 12, fontWeight: '600' },
  ratioBtnLabelActive: { color: '#ffffff', fontWeight: '700' },

  // Drawing Deck styles
  drawHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  drawModeToggle: {
    backgroundColor: '#1E293B',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  drawModeToggleActive: { backgroundColor: '#10B981', borderColor: '#10B981' },
  drawModeToggleLabel: { color: '#94A3B8', fontSize: 11, fontWeight: '700' },
  drawModeToggleLabelActive: { color: '#fff' },
  drawColorsScroll: { paddingVertical: 6, paddingHorizontal: 6 },
  colorBubble: {
    width: 28,
    height: 28,
    borderRadius: 14,
    marginRight: 10,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  activeColorBubble: { borderColor: '#ffffff' },
  drawRow: { paddingHorizontal: 6, marginTop: 8 },
  drawBtn: { width: '100%' },

  // Overlays Tab
  overlayButtons: { paddingHorizontal: 6, marginBottom: 8 },
  overlayActionBtn: { width: '100%' },
  emojisScroll: { paddingVertical: 4, paddingHorizontal: 6 },
  emojiCard: {
    width: 44,
    height: 44,
    backgroundColor: '#1E293B',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  emojiText: { fontSize: 22 },

  // Tab Strip
  tabStrip: {
    height: 60,
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#1E293B',
    backgroundColor: '#090D16',
    paddingBottom: Platform.OS === 'ios' ? 12 : 0,
  },
  tabItem: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabItemActive: {},
  tabLabel: { fontSize: 10, color: '#94A3B8', marginTop: 4, fontWeight: '600' },
  tabLabelActive: { color: '#df103f', fontWeight: '800' },

  // Text Modal Style
  modalBg: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCard: {
    width: screenWidth - 48,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  modalTitle: { fontSize: 18, color: '#0F172A', fontWeight: '800', marginBottom: 12 },
  modalTextInput: { width: '100%', marginBottom: 16 },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end' },
  modalBtn: { marginLeft: 8 },
});
