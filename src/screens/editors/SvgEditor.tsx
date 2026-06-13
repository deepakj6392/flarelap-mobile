import React, { useEffect, useMemo, useRef, useState } from 'react';
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
  Image,
  FlatList,
} from 'react-native';
import { Title, Button, TextInput, Text, ActivityIndicator, Portal, Modal } from 'react-native-paper';
import Svg, { SvgXml, Rect, Circle, Polygon, Line, Path } from 'react-native-svg';
import { Template } from '../../../types/template';
import { getAllTemplates } from '../../services/template.service';

// Custom inline SVG icons for dependency-free rendering
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

const PlusIcon = ({ size = 20, color = '#334155' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M12 5v14M5 12h14" />
  </Svg>
);

const TextIcon = ({ size = 20, color = '#334155' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M4 7V4h16v3M9 20h6M12 4v16" />
  </Svg>
);

const ShapeIcon = ({ size = 20, color = '#334155' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M12 2L2 22h20L12 2z" />
  </Svg>
);

const ImageIcon = ({ size = 20, color = '#334155' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7" />
    <Circle cx="16" cy="5" r="3" />
    <Path d="M21 15l-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
  </Svg>
);

const LayersIcon = ({ size = 20, color = '#334155' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
  </Svg>
);

const CanvasIcon = ({ size = 20, color = '#334155' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M3 3h18v18H3V3zm18 6H3M9 21V3" />
  </Svg>
);

const TemplateIcon = ({ size = 20, color = '#334155' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M4 3h16a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z" />
    <Path d="M3 9h18M9 21V9" />
  </Svg>
);

const ChevronUpIcon = ({ size = 20, color = '#334155' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M18 15l-6-6-6 6" />
  </Svg>
);

const ChevronDownIcon = ({ size = 20, color = '#334155' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M6 9l6 6 6-6" />
  </Svg>
);

const CloseIcon = ({ size = 20, color = '#334155' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M18 6L6 18M6 6l12 12" />
  </Svg>
);

const DownloadIcon = ({ size = 20, color = '#334155' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />
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

const BoldIcon = ({ size = 18, color = '#334155' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M6 4h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6zM6 12h9a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z" />
  </Svg>
);

const ItalicIcon = ({ size = 18, color = '#334155' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M19 4h-9M14 20H5M15 4L9 20" />
  </Svg>
);

// Get Responsive Canvas dimensions
const { width: screenWidth } = Dimensions.get('window');
const CANVAS_SIZE = Math.min(screenWidth - 32, 400);

const STOCK_IMAGES = [
  { name: 'Gradient Pink', url: 'https://images.unsplash.com/photo-1557683316-973673baf926?w=400' },
  { name: 'Nebula Space', url: 'https://images.unsplash.com/photo-1506318137071-a8e063b4bec0?w=400' },
  { name: 'Abstract Blue', url: 'https://images.unsplash.com/photo-1541701494587-cb58502866ab?w=400' },
  { name: 'Sunset Mountain', url: 'https://images.unsplash.com/photo-1475924156734-496f6cac6ec1?w=400' },
  { name: 'Minimal Leaf', url: 'https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=400' },
];

const PRESET_COLORS = [
  '#000000', '#FFFFFF', '#64748B', '#EF4444',
  '#F97316', '#F59E0B', '#10B981', '#06B6D4',
  '#3B82F6', '#6366F1', '#8B5CF6', '#EC4899',
  '#F43F5E', '#14B8A6', '#84CC16', '#FFD700',
];
import InstagramPostIcon from '../../assets/icons/social/thumbnail_instagram_post.svg';
import FacebookCoverIcon from '../../assets/icons/social/thumbnail_facebook_cover_landscape.svg';
import FacebookPostIcon from '../../assets/icons/social/thumbnail_facebook_post.svg';
import XCoverIcon from '../../assets/icons/social/thumbnail_x_post_landscape_16_9.svg';
import YouTubeThumbIcon from '../../assets/icons/social/thumbnail_youtube_intro.svg';
import LinkedInBannerIcon from '../../assets/icons/social/thumbnail_linkedin_banner_landscape.svg';
import PinterestPinIcon from '../../assets/icons/social/thumbnail_pinterest_pin_portrait.svg';

const SOCIAL_SUBCATS = [
  { id: 'instagram_post', title: 'Instagram Post', icon:<InstagramPostIcon width={150} height={150} />, size: '1080 x 1080' },
  { id: 'facebook_cover', title: 'Facebook Cover', icon:<FacebookCoverIcon width={150} height={150} />, size: '851 x 315' },
  { id: 'facebook_post', title: 'Facebook Post', icon:<FacebookPostIcon width={150} height={150} />, size: '1200 x 630' },
  { id: 'x_cover', title: 'X Cover', icon:<XCoverIcon width={150} height={150} />, size: '900 x 300' },
  { id: 'youtube_thumb', title: 'YouTube Thumbnail', icon:<YouTubeThumbIcon width={150} height={150} />, size: '1280 x 720' },
  { id: 'linkedin_banner', title: 'LinkedIn Banner', icon:<LinkedInBannerIcon width={150} height={150} />, size: '1584 x 396' },
  { id: 'pinterest_pin', title: 'Pinterest Pin', icon:<PinterestPinIcon width={150} height={150} />, size: '1000 x 1500' },
];

// Types
type Item = {
  id: string;
  type: 'text' | 'image' | 'shape';
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  text?: string;
  fontSize?: number;
  color?: string; // Fill Color
  fontWeight?: 'normal' | 'bold';
  fontStyle?: 'normal' | 'italic';
  shapeType?: 'rect' | 'circle' | 'triangle' | 'star' | 'line' | 'path';
  strokeColor?: string;
  strokeWidth?: number;
  borderRadius?: number;
  uri?: string;
  opacity?: number;
  pathD?: string;
  pathViewBox?: string;
  strokeDasharray?: string;
};

// Custom Slider Component
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
      onPanResponderGrant: (e) => {
        handleTouch(e.nativeEvent.locationX);
      },
      onPanResponderMove: (e) => {
        handleTouch(e.nativeEvent.locationX);
      },
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
  container: { marginVertical: 8, paddingHorizontal: 12 },
  labelRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  label: { fontSize: 13, color: '#64748B', fontWeight: '600' },
  value: { fontSize: 13, color: '#0F172A', fontWeight: '700' },
  trackContainer: { height: 24, justifyContent: 'center', position: 'relative' },
  track: { height: 6, borderRadius: 3, backgroundColor: '#E2E8F0', width: '100%' },
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

// Movable Interactive Component
interface MovableProps {
  item: Item;
  selected: boolean;
  onSelect: (id: string) => void;
  onUpdate: (id: string, patch: Partial<Item>) => void;
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
          width: Math.max(30, startSize.current.width + gestureState.dx),
          height: Math.max(30, startSize.current.height + gestureState.dy),
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

  const calculateStarPoints = (w: number, h: number, sw: number) => {
    const cx = w / 2;
    const cy = h / 2;
    const spikes = 5;
    const outerRadius = Math.min(w, h) / 2 - sw;
    const innerRadius = outerRadius * 0.4;
    let rot = (Math.PI / 2) * 3;
    let x = cx;
    let y = cy;
    const step = Math.PI / spikes;
    const points = [];

    for (let i = 0; i < spikes; i++) {
      x = cx + Math.cos(rot) * outerRadius;
      y = cy + Math.sin(rot) * outerRadius;
      points.push(`${x},${y}`);
      rot += step;

      x = cx + Math.cos(rot) * innerRadius;
      y = cy + Math.sin(rot) * innerRadius;
      points.push(`${x},${y}`);
      rot += step;
    }
    return points.join(' ');
  };

  const renderShape = () => {
    const w = item.width;
    const h = item.height;
    const sw = item.strokeWidth ?? 0;
    const sc = item.strokeColor ?? '#000000';
    const fc = item.color ?? '#df103f';
    const rx = item.borderRadius ?? 0;

    switch (item.shapeType) {
      case 'rect':
        return (
          <Svg width={w} height={h}>
            <Rect x={sw / 2} y={sw / 2} width={w - sw} height={h - sw} fill={fc} stroke={sc} strokeWidth={sw} rx={rx} />
          </Svg>
        );
      case 'circle': {
        const r = Math.min(w, h) / 2 - sw / 2;
        return (
          <Svg width={w} height={h}>
            <Circle cx={w / 2} cy={h / 2} r={r > 0 ? r : 1} fill={fc} stroke={sc} strokeWidth={sw} />
          </Svg>
        );
      }
      case 'triangle':
        return (
          <Svg width={w} height={h}>
            <Polygon points={`${w / 2},${sw} ${w - sw},${h - sw} ${sw},${h - sw}`} fill={fc} stroke={sc} strokeWidth={sw} />
          </Svg>
        );
      case 'star': {
        const points = calculateStarPoints(w, h, sw);
        return (
          <Svg width={w} height={h}>
            <Polygon points={points} fill={fc} stroke={sc} strokeWidth={sw} />
          </Svg>
        );
      }
      case 'line':
        return (
          <Svg width={w} height={h}>
            <Line x1={sw} y1={h / 2} x2={w - sw} y2={h / 2} stroke={fc} strokeWidth={sw || 4} />
          </Svg>
        );
      case 'path':
        return (
          <Svg width={w} height={h} viewBox={item.pathViewBox || `0 0 ${w} ${h}`}>
            <Path d={item.pathD} fill={fc} stroke={sc} strokeWidth={sw} strokeDasharray={item.strokeDasharray} />
          </Svg>
        );
      default:
        return null;
    }
  };

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
          zIndex: selected ? 999 : 1,
        },
      ]}
    >
      <View style={styles.contentContainer} {...dragPanResponder.panHandlers}>
        {item.type === 'text' && (
          <RNText
            style={{
              fontSize: item.fontSize ?? 16,
              color: item.color ?? '#000000',
              fontWeight: item.fontWeight ?? 'normal',
              fontStyle: item.fontStyle ?? 'normal',
              width: '100%',
              height: '100%',
              textAlign: 'center',
            }}
            numberOfLines={0}
          >
            {item.text}
          </RNText>
        )}
        {item.type === 'shape' && renderShape()}
        {item.type === 'image' && (
          <RNImage
            source={{ uri: item.uri || 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=400' }}
            style={{
              width: '100%',
              height: '100%',
              borderRadius: item.borderRadius ?? 0,
              opacity: item.opacity ?? 1,
            }}
            resizeMode="cover"
          />
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

// Main Canvas Editor Component
export default function SvgEditor({ route, navigation, category }: { route?: any; navigation?: any; category?: any }) {
  const svgUrl: string | undefined = route?.params?.svgUrl;
  const initialSvgText: string | undefined = route?.params?.svgText;

  // Background and items states
  const [svgText, setSvgText] = useState<string | null>(initialSvgText ?? null);
  const [activeTemplateId, setActiveTemplateId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [bgColor, setBgColor] = useState('#FFFFFF');
  const [templates, setTemplates] = useState<Template[]>([]);
  const [subCategory, setSubCategory] = useState<string | null>(null);
  const [showSocialModal, setShowSocialModal] = useState(false);
  // Toolbar & Panels state
  const [activeTab, setActiveTab] = useState<'templates' | 'add' | 'styles' | 'layers' | 'canvas'>('templates');

  // Undo/Redo History
  const [history, setHistory] = useState<Item[][]>([[]]);
  const [historyIndex, setHistoryIndex] = useState(0);

  const nextId = useRef(1);
  const itemsRef = useRef<Item[]>([]);

  // Keep items ref in sync
  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  
  // derive incoming category from prop or route param
  const incomingCategory = category ?? route?.params?.category;

  useEffect(() => {
    const fetchTemplates = async () => {
      const data = await getAllTemplates(incomingCategory, subCategory);
      console.log(data);
      setTemplates(data?.templates || []);
    };
    fetchTemplates();
  }, [incomingCategory, subCategory]);

  // Auto-open social subcategory modal when incoming category is 'Social Media'
  useEffect(() => {
    if (incomingCategory === 'Social Media') {
      setShowSocialModal(true);
    }
  }, [incomingCategory]);

  // Load initial URL SVG if provided
  useEffect(() => {
    let mounted = true;
    async function load() {
      if (svgText) return;
      if (!svgUrl) return;
      setLoading(true);
      try {
        const res = await fetch(svgUrl);
        const text = await res.text();
        if (!mounted) return;
        setSvgText(text);
      } catch (e: any) {
        setError(e?.message || 'Failed to load SVG template');
      } finally {
        setLoading(false);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, [svgUrl, svgText]);

  // Selected item object lookup
  const selectedItem = useMemo(() => {
    return items.find((it) => it.id === selected) || null;
  }, [items, selected]);

  // History Commit
  const commitHistory = () => {
    const current = itemsRef.current;
    if (historyIndex >= 0 && JSON.stringify(history[historyIndex]) === JSON.stringify(current)) {
      return;
    }
    const nextHist = history.slice(0, historyIndex + 1);
    nextHist.push(current.length === 0 ? [] : [...current]);
    setHistory(nextHist);
    setHistoryIndex(nextHist.length - 1);
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      const idx = historyIndex - 1;
      setHistoryIndex(idx);
      setItems(history[idx]);
      setSelected(null);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const idx = historyIndex + 1;
      setHistoryIndex(idx);
      setItems(history[idx]);
      setSelected(null);
    }
  };

  // Add Item actions
  const addText = (preset: 'head' | 'sub' | 'body') => {
    const id = `text_${nextId.current++}`;
    let config: Partial<Item> = { text: 'Heading', fontSize: 26, fontWeight: 'bold' };
    if (preset === 'sub') {
      config = { text: 'Subheading', fontSize: 18, fontWeight: 'bold' };
    } else if (preset === 'body') {
      config = { text: 'Paragraph body text details.', fontSize: 14, fontWeight: 'normal' };
    }

    const newItem: Item = {
      id,
      type: 'text',
      x: (CANVAS_SIZE - 200) / 2,
      y: (CANVAS_SIZE - 60) / 2,
      width: 200,
      height: 60,
      rotation: 0,
      color: '#000000',
      ...config,
    };

    const nextItems = [...items, newItem];
    setItems(nextItems);
    setSelected(id);
    setActiveTab('styles');

    // Force commit
    setTimeout(() => {
      const currentHist = history.slice(0, historyIndex + 1);
      currentHist.push(nextItems);
      setHistory(currentHist);
      setHistoryIndex(currentHist.length - 1);
    }, 50);
  };

  const addShape = (shapeType: 'rect' | 'circle' | 'triangle' | 'star' | 'line') => {
    const id = `shape_${nextId.current++}`;
    const newItem: Item = {
      id,
      type: 'shape',
      shapeType,
      x: (CANVAS_SIZE - 100) / 2,
      y: (CANVAS_SIZE - 100) / 2,
      width: 100,
      height: shapeType === 'line' ? 20 : 100,
      rotation: 0,
      color: '#df103f',
      strokeColor: '#000000',
      strokeWidth: 0,
      borderRadius: 0,
      opacity: 1,
    };

    const nextItems = [...items, newItem];
    setItems(nextItems);
    setSelected(id);
    setActiveTab('styles');

    setTimeout(() => {
      const currentHist = history.slice(0, historyIndex + 1);
      currentHist.push(nextItems);
      setHistory(currentHist);
      setHistoryIndex(currentHist.length - 1);
    }, 50);
  };

  const addImage = (url?: string) => {
    const id = `img_${nextId.current++}`;
    const newItem: Item = {
      id,
      type: 'image',
      x: (CANVAS_SIZE - 120) / 2,
      y: (CANVAS_SIZE - 120) / 2,
      width: 120,
      height: 120,
      rotation: 0,
      uri: url || STOCK_IMAGES[0].url,
      opacity: 1,
      borderRadius: 0,
    };

    const nextItems = [...items, newItem];
    setItems(nextItems);
    setSelected(id);
    setActiveTab('styles');

    setTimeout(() => {
      const currentHist = history.slice(0, historyIndex + 1);
      currentHist.push(nextItems);
      setHistory(currentHist);
      setHistoryIndex(currentHist.length - 1);
    }, 50);
  };

  // Update item patch
  const handleUpdateItem = (id: string, patch: Partial<Item>) => {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, ...patch } : it)));
  };

  // Delete Item
  const handleDeleteItem = (id: string) => {
    const nextItems = items.filter((it) => it.id !== id);
    setItems(nextItems);
    if (selected === id) setSelected(null);

    const currentHist = history.slice(0, historyIndex + 1);
    currentHist.push(nextItems);
    setHistory(currentHist);
    setHistoryIndex(currentHist.length - 1);
  };

  // Layer Ordering Operations
  const moveLayerUp = (idx: number) => {
    if (idx >= items.length - 1) return;
    const nextItems = [...items];
    const temp = nextItems[idx];
    nextItems[idx] = nextItems[idx + 1];
    nextItems[idx + 1] = temp;
    setItems(nextItems);

    const currentHist = history.slice(0, historyIndex + 1);
    currentHist.push(nextItems);
    setHistory(currentHist);
    setHistoryIndex(currentHist.length - 1);
  };

  const moveLayerDown = (idx: number) => {
    if (idx <= 0) return;
    const nextItems = [...items];
    const temp = nextItems[idx];
    nextItems[idx] = nextItems[idx - 1];
    nextItems[idx - 1] = temp;
    setItems(nextItems);

    const currentHist = history.slice(0, historyIndex + 1);
    currentHist.push(nextItems);
    setHistory(currentHist);
    setHistoryIndex(currentHist.length - 1);
  };

  const bringToFront = (id: string) => {
    const target = items.find((x) => x.id === id);
    if (!target) return;
    const nextItems = items.filter((x) => x.id !== id);
    nextItems.push(target);
    setItems(nextItems);

    const currentHist = history.slice(0, historyIndex + 1);
    currentHist.push(nextItems);
    setHistory(currentHist);
    setHistoryIndex(currentHist.length - 1);
  };

  const sendToBack = (id: string) => {
    const target = items.find((x) => x.id === id);
    if (!target) return;
    const nextItems = items.filter((x) => x.id !== id);
    nextItems.unshift(target);
    setItems(nextItems);

    const currentHist = history.slice(0, historyIndex + 1);
    currentHist.push(nextItems);
    setHistory(currentHist);
    setHistoryIndex(currentHist.length - 1);
  };

  // Load SVG Template
  const handleLoadTemplate = (tmpl: Template | null) => {
    const performLoad = async () => {
      if (!tmpl) {
        setSvgText(null);
        setItems([]);
        setBgColor('#FFFFFF');
        setSelected(null);
        setActiveTemplateId(null);
        setHistory([[]]);
        setHistoryIndex(0);
        return;
      }

      // load svg from template.svg_url
      if (!tmpl.svg_url) {
        Alert.alert('Template missing', 'This template has no svg URL available.');
        return;
      }

      setLoading(true);
      try {
        const res = await fetch(tmpl.svg_url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const text = await res.text();

        // Try to parse common SVG elements into editable overlay items
        const parseAttrs = (s: string) => {
          const attrs: Record<string, string> = {};
          s.replace(/([a-zA-Z0-9:_-]+)=("|')([^"']*)("|')/g, (_m, k, _q, v) => {
            attrs[k] = v;
            return '';
          });
          return attrs;
        };

        const itemsFromSvg: Item[] = [];

        // Determine svg root viewBox / dimensions so we can map coordinates to the editor canvas
        const svgRootRe = /<svg\b([^>]*)>/i;
        const svgRootMatch = svgRootRe.exec(text);
        let vbMinX = 0;
        let vbMinY = 0;
        let svgW = 400;
        let svgH = 400;
        if (svgRootMatch) {
          const rootAttrs = parseAttrs(svgRootMatch[1]);
          const vbRaw = rootAttrs.viewBox || rootAttrs.viewbox || rootAttrs.viewBOX;
          if (vbRaw) {
            const parts = vbRaw.trim().split(/[,\s]+/).map(Number).filter(n => !isNaN(n));
            if (parts.length >= 4) {
              vbMinX = parts[0];
              vbMinY = parts[1];
              svgW = parts[2] || svgW;
              svgH = parts[3] || svgH;
            }
          } else {
            const wRaw = parseFloat(rootAttrs.width || '0');
            const hRaw = parseFloat(rootAttrs.height || '0');
            if (wRaw > 0 && hRaw > 0) {
              svgW = wRaw;
              svgH = hRaw;
            }
          }
        }

        // Map SVG coordinates -> canvas coordinates (fit within CANVAS_SIZE)
        const scaleX = CANVAS_SIZE / svgW;
        const scaleY = CANVAS_SIZE / svgH;
        const scale = Math.min(scaleX, scaleY);
        const offsetX = (CANVAS_SIZE - svgW * scale) / 2;
        const offsetY = (CANVAS_SIZE - svgH * scale) / 2;

        const mapX = (x: number) => Math.round((x - vbMinX) * scale + offsetX);
        const mapY = (y: number) => Math.round((y - vbMinY) * scale + offsetY);
        const mapW = (w: number) => Math.max(2, Math.round(w * scale));
        const mapH = (h: number) => Math.max(2, Math.round(h * scale));

        // TEXT nodes
        let m: RegExpExecArray | null;
        const textRe = /<text\b([^>]*)>([\s\S]*?)<\/text>/gi;
        while ((m = textRe.exec(text))) {
          const attrs = parseAttrs(m[1]);
          const content = m[2].replace(/<[^>]+>/g, '').trim();
          const fontSize = parseFloat(attrs['font-size'] || attrs['fontSize'] || '20') || 20;
          const rawX = parseFloat(attrs.x || attrs['x'] || '') || svgW / 2;
          const rawY = parseFloat(attrs.y || attrs['y'] || '') || svgH / 2;
          const x = mapX(rawX);
          const y = mapY(rawY);
          const color = attrs.fill || '#000000';
          const mappedFont = Math.max(8, Math.round(fontSize * scale));
          const id = `svg_text_${nextId.current++}`;
          itemsFromSvg.push({ id, type: 'text', x, y, width: Math.max(40, (content.length || 6) * (mappedFont * 0.5)), height: mappedFont * 1.4, rotation: 0, text: content, fontSize: mappedFont, color });
        }

        // IMAGE nodes
        const imgRe = /<image\b([^>]*)\/?>(?:<\/image>)?/gi;
        while ((m = imgRe.exec(text))) {
          const attrs = parseAttrs(m[1]);
          const href = attrs.href || attrs['xlink:href'] || attrs.xlinkHref || attrs.src;
          if (!href) continue;
          const rawX = parseFloat(attrs.x || '0') || 0;
          const rawY = parseFloat(attrs.y || '0') || 0;
          const rawW = parseFloat(attrs.width || '120') || 120;
          const rawH = parseFloat(attrs.height || '120') || 120;
          const x = mapX(rawX);
          const y = mapY(rawY);
          const w = mapW(rawW);
          const h = mapH(rawH);
          const id = `svg_img_${nextId.current++}`;
          itemsFromSvg.push({ id, type: 'image', x, y, width: w, height: h, rotation: 0, uri: href });
        }

        // RECT nodes
        const rectRe = /<rect\b([^>]*)\/?>(?:<\/rect>)?/gi;
        while ((m = rectRe.exec(text))) {
          const attrs = parseAttrs(m[1]);
          const rawX = parseFloat(attrs.x || '0') || 0;
          const rawY = parseFloat(attrs.y || '0') || 0;
          const rawW = parseFloat(attrs.width || '100') || 100;
          const rawH = parseFloat(attrs.height || '100') || 100;
          const fill = attrs.fill || '#df103f';
          const rx = parseFloat(attrs.rx || '0') || 0;
          const x = mapX(rawX);
          const y = mapY(rawY);
          const w = mapW(rawW);
          const h = mapH(rawH);
          const id = `svg_rect_${nextId.current++}`;
          itemsFromSvg.push({ id, type: 'shape', shapeType: 'rect', x, y, width: w, height: h, rotation: 0, color: fill, borderRadius: Math.round(rx * scale) });
        }

        // CIRCLE nodes
        const circRe = /<circle\b([^>]*)\/?>(?:<\/circle>)?/gi;
        while ((m = circRe.exec(text))) {
          const attrs = parseAttrs(m[1]);
          const cx = parseFloat(attrs.cx || '0') || 0;
          const cy = parseFloat(attrs.cy || '0') || 0;
          const r = parseFloat(attrs.r || '10') || 10;
          const id = `svg_circ_${nextId.current++}`;
          const x = mapX(cx - r);
          const y = mapY(cy - r);
          const d = mapW(r * 2);
          itemsFromSvg.push({ id, type: 'shape', shapeType: 'circle', x, y, width: d, height: d, rotation: 0, color: attrs.fill || '#df103f' });
        }

        // PATH nodes -> store as path item (editable limitedly)
        const pathRe = /<path\b([^>]*)\/?>/gi;
        while ((m = pathRe.exec(text))) {
          const attrs = parseAttrs(m[1]);
          const d = attrs.d || '';
          if (!d) continue;
          const id = `svg_path_${nextId.current++}`;
          itemsFromSvg.push({ id, type: 'shape', shapeType: 'path', x: 0, y: 0, width: CANVAS_SIZE, height: CANVAS_SIZE, rotation: 0, color: attrs.fill || '#df103f', pathD: d, pathViewBox: `${vbMinX} ${vbMinY} ${svgW} ${svgH}` });
        }

        // If we parsed items, use them as editable overlays; otherwise keep svgText
        if (itemsFromSvg.length > 0) {
          setSvgText(null);
          setItems(itemsFromSvg);
        } else {
          setSvgText(text);
          setItems([]);
        }

        setBgColor('#FFFFFF');
        setSelected(null);
        setActiveTemplateId(tmpl.id);

        setHistory([itemsFromSvg.length > 0 ? itemsFromSvg : []]);
        setHistoryIndex(0);
      } catch (e: any) {
        Alert.alert('Failed to load template', e?.message || 'Could not fetch SVG');
      } finally {
        setLoading(false);
      }
    };

    if (items.length > 0) {
      Alert.alert(
        'Clear Current Edits?',
        'Loading a template will replace all your current editing elements. Do you want to proceed?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Load Template',
            style: 'destructive',
            onPress: performLoad,
          },
        ]
      );
    } else {
      performLoad();
    }
  };

  // Reset Canvas
  const handleClearCanvas = () => {
    Alert.alert('Reset Canvas', 'This will delete all your added elements and clear the screen. Proceed?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear All',
        style: 'destructive',
        onPress: () => {
          setItems([]);
          setSvgText(null);
          setSelected(null);
          setBgColor('#FFFFFF');
          setActiveTemplateId(null);
          setHistory([[]]);
          setHistoryIndex(0);
        },
      },
    ]);
  };

  // Standalone SVG Exporter
  const handleExportSvg = () => {
    const widthRatio = 400 / CANVAS_SIZE; // Scaling factor relative to 400px base space

    const itemToSvgTag = (it: Item) => {
      const x = it.x * widthRatio;
      const y = it.y * widthRatio;
      const w = it.width * widthRatio;
      const h = it.height * widthRatio;
      const rot = it.rotation;
      const cx = x + w / 2;
      const cy = y + h / 2;
      const transform = rot ? ` transform="rotate(${rot} ${cx.toFixed(1)} ${cy.toFixed(1)})"` : '';
      const fc = it.color || '#000000';
      const opacityAttr = it.opacity !== undefined && it.opacity < 1 ? ` opacity="${it.opacity}"` : '';

      switch (it.type) {
        case 'text': {
          const fs = (it.fontSize ?? 16) * widthRatio;
          const fw = it.fontWeight === 'bold' ? ' font-weight="bold"' : '';
          const fst = it.fontStyle === 'italic' ? ' font-style="italic"' : '';
          const textEscaped = (it.text ?? '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&apos;');
          return `<text x="${cx.toFixed(1)}" y="${cy.toFixed(1)}" font-size="${fs.toFixed(1)}" fill="${fc}"${fw}${fst} text-anchor="middle" dominant-baseline="central"${transform} font-family="System">${textEscaped}</text>`;
        }
        case 'image':
          return `<image x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${w.toFixed(1)}" height="${h.toFixed(1)}" href="${it.uri}"${opacityAttr}${transform}/>`;
        case 'shape': {
          const sw = (it.strokeWidth ?? 0) * widthRatio;
          const sc = it.strokeColor ?? '#000000';
          const strokeAttr = sw > 0 ? ` stroke="${sc}" stroke-width="${sw.toFixed(1)}"` : '';
          const rxVal = (it.borderRadius ?? 0) * widthRatio;

          if (it.shapeType === 'rect') {
            const rxAttr = rxVal > 0 ? ` rx="${rxVal.toFixed(1)}"` : '';
            return `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${w.toFixed(1)}" height="${h.toFixed(1)}" fill="${fc}"${strokeAttr}${rxAttr}${transform}${opacityAttr}/>`;
          } else if (it.shapeType === 'circle') {
            const rad = Math.min(w, h) / 2;
            return `<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="${rad.toFixed(1)}" fill="${fc}"${strokeAttr}${transform}${opacityAttr}/>`;
          } else if (it.shapeType === 'triangle') {
            return `<polygon points="${cx.toFixed(1)},${(y + sw).toFixed(1)} ${(x + w - sw).toFixed(1)}, ${(y + h - sw).toFixed(1)} ${(x + sw).toFixed(1)}, ${(y + h - sw).toFixed(1)}" fill="${fc}"${strokeAttr}${transform}${opacityAttr}/>`;
          } else if (it.shapeType === 'star') {
            // Star vertices inside outer space
            const outerRadius = Math.min(w, h) / 2 - sw;
            const innerRadius = outerRadius * 0.4;
            const spikes = 5;
            let currentRot = (Math.PI / 2) * 3;
            const step = Math.PI / spikes;
            const pointsList = [];

            for (let i = 0; i < spikes; i++) {
              let px = cx + Math.cos(currentRot) * outerRadius;
              let py = cy + Math.sin(currentRot) * outerRadius;
              pointsList.push(`${px.toFixed(1)},${py.toFixed(1)}`);
              currentRot += step;

              px = cx + Math.cos(currentRot) * innerRadius;
              py = cy + Math.sin(currentRot) * innerRadius;
              pointsList.push(`${px.toFixed(1)},${py.toFixed(1)}`);
              currentRot += step;
            }
            return `<polygon points="${pointsList.join(' ')}" fill="${fc}"${strokeAttr}${transform}${opacityAttr}/>`;
          } else if (it.shapeType === 'line') {
            return `<line x1="${x.toFixed(1)}" y1="${cy.toFixed(1)}" x2="${(x + w).toFixed(1)}" y2="${cy.toFixed(1)}" stroke="${fc}" stroke-width="${(sw || 4).toFixed(1)}"${transform}${opacityAttr}/>`;
          } else if (it.shapeType === 'path') {
            const vb = it.pathViewBox || `0 0 ${it.width} ${it.height}`;
            const dashAttr = it.strokeDasharray ? ` stroke-dasharray="${it.strokeDasharray}"` : '';
            return `<svg x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${w.toFixed(1)}" height="${h.toFixed(1)}" viewBox="${vb}"${transform}${opacityAttr}><path d="${it.pathD}" fill="${fc}"${strokeAttr}${dashAttr}/></svg>`;
          }
          return '';
        }
        default:
          return '';
      }
    };

    const itemTags = items.map(itemToSvgTag).join('\n  ');
    let finalSvg = '';

    if (svgText) {
      const closingIndex = svgText.lastIndexOf('</svg>');
      if (closingIndex !== -1) {
        const rootContent = svgText.substring(0, closingIndex);
        finalSvg = `${rootContent}\n  <!-- User Added Overlays -->\n  ${itemTags}\n</svg>`;
      } else {
        finalSvg = `${svgText}\n<!-- Overlays -->\n${itemTags}`;
      }
    } else {
      finalSvg = `<svg width="400" height="400" viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
  <rect width="400" height="400" fill="${bgColor}"/>
  <!-- User Added Overlays -->
  ${itemTags}
</svg>`;
    }

    Alert.alert('SVG Export Ready', 'Your custom Canva design is compiled. Look at details:', [
      { text: 'Copy to Clipboard', onPress: () => Alert.alert('Copied', 'SVG XML text copied to clip!') },
      { text: 'OK', style: 'cancel' },
    ]);

    // Print SVG structure in console log for inspection
    console.log('--- EXPORTED SVG XML ---');
    console.log(finalSvg);
    console.log('------------------------');
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.container}>
        {/* Top Header Row */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation?.goBack()} style={styles.headerBtn}>
            <CloseIcon size={20} color="#0F172A" />
          </TouchableOpacity>
          <Title style={styles.headerTitle}>{category}</Title>
          <View style={styles.headerRight}>
            <TouchableOpacity onPress={handleUndo} disabled={historyIndex <= 0} style={[styles.actionIconBtn, historyIndex <= 0 && styles.disabledBtn]}>
              <UndoIcon size={18} color={historyIndex <= 0 ? '#cbd5e1' : '#0f172a'} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleRedo}
              disabled={historyIndex >= history.length - 1}
              style={[styles.actionIconBtn, historyIndex >= history.length - 1 && styles.disabledBtn]}
            >
              <RedoIcon size={18} color={historyIndex >= history.length - 1 ? '#cbd5e1' : '#0f172a'} />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleExportSvg} style={styles.exportBtn}>
              <DownloadIcon size={16} color="#ffffff" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Canvas Editing Space */}
        <View style={styles.canvasContainer}>
          <View style={[styles.canvasWrapper, { width: CANVAS_SIZE, height: CANVAS_SIZE }]}>
            {/* Checkerboard Background */}
            <View style={styles.checkerboard} />

            {/* Design Artboard */}
            <TouchableOpacity
              activeOpacity={1}
              onPress={() => setSelected(null)}
              style={[styles.artboard, { width: CANVAS_SIZE, height: CANVAS_SIZE, backgroundColor: bgColor }]}
            >
              {loading ? (
                <ActivityIndicator size="large" color="#df103f" style={StyleSheet.absoluteFillObject} />
              ) : error ? (
                <Text style={styles.errorText}>{error}</Text>
              ) : svgText ? (
                <SvgXml xml={svgText} width="100%" height="100%" />
              ) : null}

              {/* Elements Overlay Layer */}
              <View style={StyleSheet.absoluteFillObject} pointerEvents="box-none">
                {items.map((it) => (
                  <Movable
                    key={it.id}
                    item={it}
                    selected={selected === it.id}
                    onSelect={setSelected}
                    onUpdate={handleUpdateItem}
                    onCommitHistory={commitHistory}
                    onDelete={handleDeleteItem}
                  />
                ))}
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Style & Element Toolbar panels */}
        <View style={styles.editorPanel}>
          {/* Active Panel Content */}
          <View style={styles.panelBody}>
            {activeTab === 'templates' && (
              <View style={styles.panelContent}>
                <Text style={styles.panelHeading}>Choose Design Template</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.templatesScroll}>
                  <TouchableOpacity onPress={() => handleLoadTemplate(null)} style={[styles.templateCard, !activeTemplateId && items.length === 0 && styles.activeTemplateCard]}>
                    <View style={[styles.templateCardPreview, { backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#e2e8f0' }]}>
                      <CanvasIcon size={28} color="#64748b" />
                    </View>
                    <Text style={styles.templateLabel}>Blank Canvas</Text>
                  </TouchableOpacity>

                  {templates.map((tmpl) => (
                    <TouchableOpacity
                      key={tmpl.id}
                      onPress={() => handleLoadTemplate(tmpl)}
                      style={[styles.templateCard, activeTemplateId === tmpl.id && styles.activeTemplateCard]}
                    >
                      <View style={[styles.templateCardPreview]}>
                        <Image source={{ uri: tmpl.thumbnail }} style={styles.templateImage} />
                      </View>
                      <Text style={styles.templateLabel} numberOfLines={1}>
                        {tmpl.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}

            {activeTab === 'add' && (
              <View style={styles.panelContent}>
                <Text style={styles.panelHeading}>Insert Element</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.elementsContainer}>
                  {/* TEXT PRESETS */}
                  <View style={styles.elementsGroup}>
                    <Text style={styles.groupHeading}>Typography</Text>
                    <View style={styles.elementsRow}>
                      <TouchableOpacity style={styles.addBtn} onPress={() => addText('head')}>
                        <TextIcon size={16} color="#df103f" />
                        <Text style={styles.addBtnLabel}>Heading</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.addBtn} onPress={() => addText('sub')}>
                        <TextIcon size={14} color="#334155" />
                        <Text style={styles.addBtnLabel}>Subheading</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.addBtn} onPress={() => addText('body')}>
                        <Text style={{ fontSize: 11, fontWeight: '500', color: '#64748b' }}>Paragraph</Text>
                        <Text style={styles.addBtnLabel}>Body Text</Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  <View style={styles.dividerLine} />

                  {/* SHAPES */}
                  <View style={styles.elementsGroup}>
                    <Text style={styles.groupHeading}>Shapes & Lines</Text>
                    <View style={styles.elementsRow}>
                      <TouchableOpacity style={styles.addBtn} onPress={() => addShape('rect')}>
                        <View style={[styles.shapeAddIcon, { borderRadius: 2 }]} />
                        <Text style={styles.addBtnLabel}>Rectangle</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.addBtn} onPress={() => addShape('circle')}>
                        <View style={[styles.shapeAddIcon, { borderRadius: 10 }]} />
                        <Text style={styles.addBtnLabel}>Circle</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.addBtn} onPress={() => addShape('triangle')}>
                        <ShapeIcon size={16} color="#334155" />
                        <Text style={styles.addBtnLabel}>Triangle</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.addBtn} onPress={() => addShape('star')}>
                        <Text style={{ fontSize: 16 }}>★</Text>
                        <Text style={styles.addBtnLabel}>Star</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.addBtn} onPress={() => addShape('line')}>
                        <View style={{ width: 16, height: 2, backgroundColor: '#334155' }} />
                        <Text style={styles.addBtnLabel}>Line</Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  <View style={styles.dividerLine} />

                  {/* IMAGES */}
                  <View style={styles.elementsGroup}>
                    <Text style={styles.groupHeading}>Stock Images</Text>
                    <View style={styles.elementsRow}>
                      <TouchableOpacity style={styles.addBtn} onPress={() => addImage()}>
                        <ImageIcon size={16} color="#df103f" />
                        <Text style={styles.addBtnLabel}>Add Photo</Text>
                      </TouchableOpacity>
                      {STOCK_IMAGES.map((img, i) => (
                        <TouchableOpacity key={img.name} style={styles.addBtn} onPress={() => addImage(img.url)}>
                          <RNImage source={{ uri: img.url }} style={styles.stockThumb} />
                          <Text style={styles.addBtnLabel} numberOfLines={1}>
                            Stock {i + 1}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                </ScrollView>
              </View>
            )}

            {activeTab === 'styles' && (
              <View style={styles.panelContent}>
                {selectedItem ? (
                  <ScrollView contentContainerStyle={styles.scrollStyles}>
                    {/* Text Styling Options */}
                    {selectedItem.type === 'text' && (
                      <View style={styles.styleGroup}>
                        <Text style={styles.styleGroupTitle}>Text Properties</Text>
                        <TextInput
                          mode="outlined"
                          label="Text Content"
                          dense
                          value={selectedItem.text || ''}
                          onChangeText={(t) => handleUpdateItem(selectedItem.id, { text: t })}
                          onBlur={commitHistory}
                          style={styles.textInputStyle}
                          outlineColor="#e2e8f0"
                          activeOutlineColor="#df103f"
                        />

                        {/* Bold / Italic Toggles */}
                        <View style={styles.rowStyle}>
                          <TouchableOpacity
                            style={[styles.styleToggleBtn, selectedItem.fontWeight === 'bold' && styles.activeToggleBtn]}
                            onPress={() => {
                              const nextWeight = selectedItem.fontWeight === 'bold' ? 'normal' : 'bold';
                              handleUpdateItem(selectedItem.id, { fontWeight: nextWeight });
                              setTimeout(commitHistory, 10);
                            }}
                          >
                            <BoldIcon size={14} color={selectedItem.fontWeight === 'bold' ? '#ffffff' : '#334155'} />
                            <Text style={[styles.styleToggleLabel, selectedItem.fontWeight === 'bold' && styles.activeToggleLabel]}>Bold</Text>
                          </TouchableOpacity>

                          <TouchableOpacity
                            style={[styles.styleToggleBtn, selectedItem.fontStyle === 'italic' && styles.activeToggleBtn]}
                            onPress={() => {
                              const nextStyle = selectedItem.fontStyle === 'italic' ? 'normal' : 'italic';
                              handleUpdateItem(selectedItem.id, { fontStyle: nextStyle });
                              setTimeout(commitHistory, 10);
                            }}
                          >
                            <ItalicIcon size={14} color={selectedItem.fontStyle === 'italic' ? '#ffffff' : '#334155'} />
                            <Text style={[styles.styleToggleLabel, selectedItem.fontStyle === 'italic' && styles.activeToggleLabel]}>Italic</Text>
                          </TouchableOpacity>
                        </View>

                        {/* Font Size slider */}
                        <CustomSlider
                          label="Font Size"
                          value={selectedItem.fontSize ?? 16}
                          min={10}
                          max={72}
                          onChange={(v) => handleUpdateItem(selectedItem.id, { fontSize: v })}
                        />
                      </View>
                    )}

                    {/* Shape styling options */}
                    {selectedItem.type === 'shape' && (
                      <View style={styles.styleGroup}>
                        <Text style={styles.styleGroupTitle}>Shape Settings</Text>
                        {selectedItem.shapeType !== 'line' && (
                          <CustomSlider
                            label="Border Stroke Width"
                            value={selectedItem.strokeWidth ?? 0}
                            min={0}
                            max={12}
                            onChange={(v) => handleUpdateItem(selectedItem.id, { strokeWidth: v })}
                          />
                        )}

                        {selectedItem.shapeType === 'rect' && (
                          <CustomSlider
                            label="Corner Radius"
                            value={selectedItem.borderRadius ?? 0}
                            min={0}
                            max={50}
                            onChange={(v) => handleUpdateItem(selectedItem.id, { borderRadius: v })}
                          />
                        )}

                        {selectedItem.strokeWidth && selectedItem.strokeWidth > 0 && (
                          <View style={styles.colorPanel}>
                            <Text style={styles.colorPanelTitle}>Border Stroke Color</Text>
                            <View style={styles.colorsGrid}>
                              {PRESET_COLORS.map((c) => (
                                <TouchableOpacity
                                  key={c}
                                  style={[styles.colorBubble, { backgroundColor: c }, selectedItem.strokeColor === c && styles.activeColorBubble]}
                                  onPress={() => {
                                    handleUpdateItem(selectedItem.id, { strokeColor: c });
                                    setTimeout(commitHistory, 10);
                                  }}
                                />
                              ))}
                            </View>
                          </View>
                        )}
                      </View>
                    )}

                    {/* Image Styling Options */}
                    {selectedItem.type === 'image' && (
                      <View style={styles.styleGroup}>
                        <Text style={styles.styleGroupTitle}>Image Settings</Text>
                        <TextInput
                          mode="outlined"
                          label="Image URL Address"
                          dense
                          value={selectedItem.uri || ''}
                          onChangeText={(u) => handleUpdateItem(selectedItem.id, { uri: u })}
                          onBlur={commitHistory}
                          style={styles.textInputStyle}
                          outlineColor="#e2e8f0"
                          activeOutlineColor="#df103f"
                        />
                        <View style={styles.unsplashGroup}>
                          <Text style={styles.smallSubLabel}>Quick Swap Stock Background:</Text>
                          <View style={styles.unsplashRow}>
                            {STOCK_IMAGES.map((img) => (
                              <TouchableOpacity
                                key={img.name}
                                onPress={() => {
                                  handleUpdateItem(selectedItem.id, { uri: img.url });
                                  setTimeout(commitHistory, 10);
                                }}
                              >
                                <RNImage source={{ uri: img.url }} style={styles.unsplashItemThumb} />
                              </TouchableOpacity>
                            ))}
                          </View>
                        </View>

                        <CustomSlider
                          label="Border Corner Radius"
                          value={selectedItem.borderRadius ?? 0}
                          min={0}
                          max={50}
                          onChange={(v) => handleUpdateItem(selectedItem.id, { borderRadius: v })}
                        />
                      </View>
                    )}

                    {/* Universal Properties (Opacity & Rotation) */}
                    <View style={styles.styleGroup}>
                      <Text style={styles.styleGroupTitle}>Arrange & Transform</Text>
                      {selectedItem.opacity !== undefined && (
                        <CustomSlider
                          label="Element Opacity"
                          value={(selectedItem.opacity ?? 1) * 100}
                          min={10}
                          max={100}
                          suffix="%"
                          onChange={(v) => handleUpdateItem(selectedItem.id, { opacity: v / 100 })}
                        />
                      )}

                      <CustomSlider
                        label="Rotation Angle"
                        value={selectedItem.rotation ?? 0}
                        min={0}
                        max={360}
                        suffix="°"
                        onChange={(v) => handleUpdateItem(selectedItem.id, { rotation: v })}
                      />

                      <View style={styles.quickArrangeRow}>
                        <TouchableOpacity style={styles.arrangeBtn} onPress={() => bringToFront(selectedItem.id)}>
                          <LayersIcon size={12} color="#334155" />
                          <Text style={styles.arrangeBtnText}>Front</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.arrangeBtn} onPress={() => sendToBack(selectedItem.id)}>
                          <LayersIcon size={12} color="#334155" />
                          <Text style={styles.arrangeBtnText}>Back</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.arrangeBtn, styles.deleteArrangeBtn]} onPress={() => handleDeleteItem(selectedItem.id)}>
                          <TrashIcon size={12} color="#ffffff" />
                          <Text style={[styles.arrangeBtnText, { color: '#ffffff' }]}>Delete</Text>
                        </TouchableOpacity>
                      </View>
                    </View>

                    {/* Common Color Grid */}
                    {selectedItem.type !== 'image' && (
                      <View style={styles.colorPanel}>
                        <Text style={styles.colorPanelTitle}>Element Fill Color</Text>
                        <View style={styles.colorsGrid}>
                          {PRESET_COLORS.map((c) => (
                            <TouchableOpacity
                              key={c}
                              style={[styles.colorBubble, { backgroundColor: c }, selectedItem.color === c && styles.activeColorBubble]}
                              onPress={() => {
                                handleUpdateItem(selectedItem.id, { color: c });
                                setTimeout(commitHistory, 10);
                              }}
                            />
                          ))}
                        </View>
                      </View>
                    )}
                  </ScrollView>
                ) : (
                  <View style={styles.emptyStylesPanel}>
                    <Text style={styles.emptyStylesText}>Tap any element on the canvas to edit its size, color, content and rotation.</Text>
                  </View>
                )}
              </View>
            )}

            {activeTab === 'layers' && (
              <View style={styles.panelContent}>
                <Text style={styles.panelHeading}>Manage Elements Layers</Text>
                {items.length === 0 ? (
                  <View style={styles.emptyStylesPanel}>
                    <Text style={styles.emptyStylesText}>No added elements on canvas yet.</Text>
                  </View>
                ) : (
                  <ScrollView contentContainerStyle={styles.layersList}>
                    {items
                      .slice()
                      .reverse()
                      .map((it, revIdx) => {
                        const originalIdx = items.length - 1 - revIdx;
                        return (
                          <TouchableOpacity
                            key={it.id}
                            style={[styles.layerRow, selected === it.id && styles.selectedLayerRow]}
                            onPress={() => setSelected(it.id)}
                          >
                            <View style={styles.layerInfo}>
                              <Text style={styles.layerTypeSymbol}>
                                {it.type === 'text' ? 'T' : it.type === 'shape' ? '⬡' : '🖼'}
                              </Text>
                              <Text style={styles.layerTitle} numberOfLines={1}>
                                {it.type === 'text'
                                  ? `Text: "${it.text}"`
                                  : it.type === 'shape'
                                  ? `Shape: ${it.shapeType}`
                                  : 'Image Component'}
                              </Text>
                            </View>
                            <View style={styles.layerActions}>
                              <TouchableOpacity
                                onPress={() => moveLayerUp(originalIdx)}
                                disabled={originalIdx === items.length - 1}
                                style={[styles.layerControlBtn, originalIdx === items.length - 1 && styles.disabledControlBtn]}
                              >
                                <ChevronUpIcon size={14} color={originalIdx === items.length - 1 ? '#cbd5e1' : '#475569'} />
                              </TouchableOpacity>
                              <TouchableOpacity
                                onPress={() => moveLayerDown(originalIdx)}
                                disabled={originalIdx === 0}
                                style={[styles.layerControlBtn, originalIdx === 0 && styles.disabledControlBtn]}
                              >
                                <ChevronDownIcon size={14} color={originalIdx === 0 ? '#cbd5e1' : '#475569'} />
                              </TouchableOpacity>
                              <TouchableOpacity onPress={() => handleDeleteItem(it.id)} style={[styles.layerControlBtn, styles.layerDeleteBtn]}>
                                <TrashIcon size={14} color="#ef4444" />
                              </TouchableOpacity>
                            </View>
                          </TouchableOpacity>
                        );
                      })}
                  </ScrollView>
                )}
              </View>
            )}

            {activeTab === 'canvas' && (
              <View style={styles.panelContent}>
                <Text style={styles.panelHeading}>Canvas Properties</Text>
                <ScrollView contentContainerStyle={styles.canvasPanelScroll}>
                  {!svgText ? (
                    <View style={styles.colorPanel}>
                      <Text style={styles.colorPanelTitle}>Blank Canvas Color</Text>
                      <View style={styles.colorsGrid}>
                        {PRESET_COLORS.map((c) => (
                          <TouchableOpacity
                            key={c}
                            style={[styles.colorBubble, { backgroundColor: c }, bgColor === c && styles.activeColorBubble]}
                            onPress={() => setBgColor(c)}
                          />
                        ))}
                      </View>
                    </View>
                  ) : (
                    <View style={styles.templateAlert}>
                      <Text style={styles.templateAlertText}>
                        You are editing a preset SVG template. Background styling is baked in. You can still reset to a blank canvas to set
                        colors.
                      </Text>
                    </View>
                  )}

                  <Button mode="contained" buttonColor="#ef4444" onPress={handleClearCanvas} style={styles.clearCanvasBtn}>
                    Reset Canvas Editor
                  </Button>
                </ScrollView>
              </View>
            )}
          </View>

          {/* Primary Panels Select Tab Bar */}
          <View style={styles.tabBar}>
            <TouchableOpacity style={[styles.tabItem, activeTab === 'templates' && styles.activeTabItem]} onPress={() => setActiveTab('templates')}>
              <TemplateIcon size={18} color={activeTab === 'templates' ? '#df103f' : '#64748b'} />
              <Text style={[styles.tabLabel, activeTab === 'templates' && styles.activeTabLabel]}>Templates</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.tabItem, activeTab === 'add' && styles.activeTabItem]} onPress={() => setActiveTab('add')}>
              <PlusIcon size={18} color={activeTab === 'add' ? '#df103f' : '#64748b'} />
              <Text style={[styles.tabLabel, activeTab === 'add' && styles.activeTabLabel]}>Elements</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.tabItem, activeTab === 'styles' && styles.activeTabItem]} onPress={() => setActiveTab('styles')}>
              <TextIcon size={18} color={activeTab === 'styles' ? '#df103f' : '#64748b'} />
              <Text style={[styles.tabLabel, activeTab === 'styles' && styles.activeTabLabel]}>Styles</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.tabItem, activeTab === 'layers' && styles.activeTabItem]} onPress={() => setActiveTab('layers')}>
              <LayersIcon size={18} color={activeTab === 'layers' ? '#df103f' : '#64748b'} />
              <Text style={[styles.tabLabel, activeTab === 'layers' && styles.activeTabLabel]}>Layers</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.tabItem, activeTab === 'canvas' && styles.activeTabItem]} onPress={() => setActiveTab('canvas')}>
              <CanvasIcon size={18} color={activeTab === 'canvas' ? '#df103f' : '#64748b'} />
              <Text style={[styles.tabLabel, activeTab === 'canvas' && styles.activeTabLabel]}>Canvas</Text>
            </TouchableOpacity>
          </View>
        </View>
        {/* Social Media Subcategory Modal */}
        <Portal>
          <Modal visible={showSocialModal} onDismiss={() => setShowSocialModal(false)} contentContainerStyle={styles.socialModal}>
            <Text style={styles.modalTitle}>Pick a Social Template</Text>
            <FlatList
              data={SOCIAL_SUBCATS}
              keyExtractor={(s: any) => s.id}
              numColumns={2}
              columnWrapperStyle={styles.modalRow}
              renderItem={({ item }: { item: any }) => (
                <TouchableOpacity
                  style={styles.modalTemplateCard}
                  onPress={() => {
                    setSubCategory(item.title);
                    setShowSocialModal(false);
                  }}
                >
                  <View style={[styles.modalTemplatePreview, styles.activeTemplateCard]}>
                    {item.icon}
                  </View>
                  <Text style={styles.templateLabel}>{item.title}</Text>
                  <Text style={styles.templateSize}>{item.size}</Text>
                </TouchableOpacity>
              )}
            />
            <Button onPress={() => setShowSocialModal(false)} style={styles.modalCloseBtn}>Close</Button>
          </Modal>
        </Portal>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// StyleSheet
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f8fafc' },
  container: { flex: 1, backgroundColor: '#f8fafc' },

  // Header styles
  header: {
    height: 54,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#ffffff',
  },
  headerBtn: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#0F172A' },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  actionIconBtn: {
    width: 32,
    height: 32,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
  },
  disabledBtn: { opacity: 0.5 },
  exportBtn: {
    paddingHorizontal: 12,
    height: 32,
    borderRadius: 6,
    backgroundColor: '#df103f',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 6,
  },

  // Canvas Workspace area
  canvasContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f1f5f9',
  },
  canvasWrapper: {
    position: 'relative',
    borderRadius: 16,
    elevation: 8,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#ffffff',
  },
  checkerboard: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#e2e8f0',
    // Small mock transparent pattern
    opacity: 0.15,
  },
  artboard: {
    position: 'absolute',
    left: 0,
    top: 0,
    overflow: 'hidden',
  },
  errorText: { color: '#ef4444', textAlign: 'center', padding: 20 },

  // Movable Overlay Elements
  movable: {
    position: 'absolute',
  },
  contentContainer: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Selection styling
  selectionOutline: {
    position: 'absolute',
    left: -2,
    right: -2,
    top: -2,
    bottom: -2,
    borderWidth: 1.5,
    borderColor: '#df103f',
    borderStyle: 'dashed',
    borderRadius: 2,
  },
  handle: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  rotateHandle: {
    backgroundColor: '#475569',
  },
  deleteHandle: {
    backgroundColor: '#ef4444',
  },
  resizeHandle: {
    backgroundColor: '#df103f',
    width: 20,
    height: 20,
    borderRadius: 10,
  },
  resizeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#fff',
  },

  // Bottom Control Panel styling
  editorPanel: {
    height: 290,
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    elevation: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  panelBody: { flex: 1 },
  panelContent: { flex: 1, padding: 16 },
  panelHeading: { fontSize: 16, fontWeight: '700', color: '#0F172A', marginBottom: 12 },

  // Template Scroll gallery
  templatesScroll: { gap: 12, paddingVertical: 4 },
  templateCard: {
    width: 125,
    height: 125,
    alignItems: 'center',
  },
  templateCardPreview: {
    width: 120,
    height: 120,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  activeTemplateCard: {
    borderWidth: 2,
    borderColor: '#df103f',
    borderRadius: 16,
    padding: 2,
  },
  templateLabel: { fontSize: 11, color: '#475569', textAlign: 'center', fontWeight: '500' },
  templateInitial: { fontSize: 28, fontWeight: 'bold', color: '#fff' },
  templateSize: { fontSize: 11, color: '#64748b', textAlign: 'center' },

  // Elements Panel styling
  elementsContainer: { gap: 16, paddingVertical: 6 },
  elementsGroup: { gap: 6 },
  groupHeading: { fontSize: 11, fontWeight: '700', color: '#94A3B8', textTransform: 'uppercase', tracking: 0.5 } as any,
  elementsRow: { flexDirection: 'row', gap: 10 },
  addBtn: {
    width: 72,
    height: 72,
    borderRadius: 12,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
  },
  addBtnLabel: { fontSize: 9, fontWeight: '600', color: '#475569', textAlign: 'center' },
  dividerLine: { width: 1, height: 60, backgroundColor: '#f1f5f9', alignSelf: 'center' },
  shapeAddIcon: { width: 16, height: 16, backgroundColor: '#334155' },
  stockThumb: { width: 32, height: 32, borderRadius: 6 },

  // Styles Panel scrollable elements
  scrollStyles: { paddingBottom: 24, gap: 14 },
  styleGroup: { gap: 8 },
  styleGroupTitle: { fontSize: 12, fontWeight: '700', color: '#94A3B8', textTransform: 'uppercase' },
  textInputStyle: { backgroundColor: '#ffffff', fontSize: 14, height: 40 },
  rowStyle: { flexDirection: 'row', gap: 12, marginTop: 4 },
  styleToggleBtn: {
    flex: 1,
    height: 36,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  activeToggleBtn: { backgroundColor: '#df103f', borderColor: '#df103f' },
  styleToggleLabel: { fontSize: 12, color: '#334155', fontWeight: '600' },
  activeToggleLabel: { color: '#ffffff' },
  smallSubLabel: { fontSize: 11, color: '#64748B', fontWeight: '500', marginBottom: 4 },
  unsplashGroup: { marginTop: 4 },
  unsplashRow: { flexDirection: 'row', gap: 8 },
  unsplashItemThumb: { width: 44, height: 44, borderRadius: 8, borderWidth: 1, borderColor: '#e2e8f0' },

  // Arrangement elements
  quickArrangeRow: { flexDirection: 'row', gap: 8, marginTop: 8, paddingHorizontal: 12 },
  arrangeBtn: {
    flex: 1,
    height: 32,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
  },
  deleteArrangeBtn: { backgroundColor: '#ef4444', borderColor: '#ef4444' },
  arrangeBtnText: { fontSize: 11, color: '#334155', fontWeight: '600' },

  // Colors Grid layout
  colorPanel: { gap: 6 },
  colorPanelTitle: { fontSize: 12, fontWeight: '700', color: '#94A3B8', textTransform: 'uppercase' },
  colorsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  colorBubble: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  activeColorBubble: {
    borderWidth: 2.5,
    borderColor: '#df103f',
  },

  // Layers panel layout
  layersList: { gap: 8, paddingVertical: 4 },
  layerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 10,
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  selectedLayerRow: {
    borderColor: '#df103f',
    backgroundColor: '#fff1f2',
  },
  layerInfo: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  layerTypeSymbol: { fontSize: 16, fontWeight: 'bold', color: '#df103f', width: 24, textAlign: 'center' },
  layerTitle: { fontSize: 13, color: '#334155', fontWeight: '600', flex: 1 },
  layerActions: { flexDirection: 'row', gap: 4 },
  layerControlBtn: {
    width: 28,
    height: 28,
    borderRadius: 4,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  disabledControlBtn: { opacity: 0.3 },
  layerDeleteBtn: { borderColor: '#fecaca' },

  // Canvas Panel layout
  canvasPanelScroll: { gap: 16 },
  templateAlert: { padding: 12, backgroundColor: '#eff6ff', borderRadius: 8, borderWidth: 1, borderColor: '#bfdbfe' },
  templateAlertText: { fontSize: 12, color: '#1d4ed8', lineHeight: 18, fontWeight: '500' },
  clearCanvasBtn: { marginTop: 12, borderRadius: 8 },

  // Tab bar styles
  tabBar: {
    height: 58,
    flexDirection: 'row',
    borderTopWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#ffffff',
  },
  tabItem: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 3 },
  activeTabItem: { borderTopWidth: 2, borderTopColor: '#df103f' },
  tabLabel: { fontSize: 10, color: '#64748b', fontWeight: '500' },
  activeTabLabel: { color: '#df103f', fontWeight: '700' },

  // Empty Panels
  emptyStylesPanel: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  emptyStylesText: { fontSize: 13, color: '#64748b', textAlign: 'center', lineHeight: 20, fontWeight: '500' },
  templateImage: { width: 120, height: 120, borderRadius: 8 },
  socialModal: { backgroundColor: '#ffffff', padding: 16, margin: 20, borderRadius: 12, maxHeight: 600 },
  modalTitle: { fontSize: 16, fontWeight: '700', marginBottom: 8 },
  modalRow: { justifyContent: 'space-between', marginBottom: 12 },
  modalTemplateCard: { width: '48%', alignItems: 'center', marginBottom: 10 },
  modalTemplatePreview: { width: 150, height: 150, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginBottom: 6, backgroundColor: '#f8fafc' },
  modalCloseBtn: { marginTop: 8, borderRadius: 8 },
});
