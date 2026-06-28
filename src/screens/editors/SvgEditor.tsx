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
  useWindowDimensions,
  LayoutChangeEvent,
  KeyboardAvoidingView,
  Platform,
  Image,
  FlatList,
} from 'react-native';
import { Title, Button, TextInput, Text, ActivityIndicator, Portal, Modal } from 'react-native-paper';
import Svg, { Rect, Circle, Polygon, Line, Path, SvgXml, Defs, ClipPath, Image as SvgImage } from 'react-native-svg';
import RNFS from 'react-native-fs';
import { Template } from '../../../types/template';
import { getAllTemplates, svgUrlToFabricJSON, FabricObject, svgStringToFabricJSON } from '../../services/template.service';
import {
  UndoIcon,
  RedoIcon,
  PlusIcon,
  TextIcon,
  ShapeIcon,
  ImageIcon,
  LayersIcon,
  CanvasIcon,
  TemplateIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  CloseIcon,
  DownloadIcon,
  RotateIcon,
  TrashIcon,
  BoldIcon,
  ItalicIcon
} from '../../components/icons-svg';


// Get Responsive Canvas dimensions
const { width: screenWidth } = Dimensions.get('window');
const HEADER_HEIGHT = 54;
const DEFAULT_CANVAS_METRICS = { width: 400, height: 400, minX: 0, minY: 0 };

type CanvasMetrics = typeof DEFAULT_CANVAS_METRICS;



const saveBase64ToTempFile = async (base64Data: string, filename: string): Promise<string> => {
  try {
    const base64Content = base64Data.replace(/^data:image\/[a-z]+;base64,/, '');
    const tempDir = RNFS.TemporaryDirectoryPath;
    const filePath = `${tempDir}/${filename}`;
    await RNFS.writeFile(filePath, base64Content, 'base64');
    return `file://${filePath}`;
  } catch (err) {
    console.warn('Failed to save base64 to temp file:', err);
    return base64Data;
  }
};

const processSvgBase64Images = async (svgText: string | null): Promise<{ cleanSvgText: string | null; localFileMap: Map<string, string> }> => {
  const localFileMap = new Map<string, string>();
  if (!svgText) return { cleanSvgText: svgText, localFileMap };

  let cleanSvgText = svgText;
  const svgImageRegex = /['"](data:image\/[a-z]+;base64,[^'"]+)['"]/g;
  let match;

  const matches: string[] = [];
  while ((match = svgImageRegex.exec(svgText)) !== null) {
    matches.push(match[1]);
  }

  for (let i = 0; i < matches.length; i++) {
    const base64Data = matches[i];
    const extension = base64Data.match(/data:image\/([a-z]+);base64/)?.[1] || 'png';
    const filename = `svg_inline_img_${Date.now()}_${i}.${extension}`;
    const fileUri = await saveBase64ToTempFile(base64Data, filename);

    localFileMap.set(base64Data.trim(), fileUri);
    cleanSvgText = cleanSvgText.replace(base64Data, fileUri);
  }

  return { cleanSvgText, localFileMap };
};

const resolveRelativeUrl = (baseUrl: string | null | undefined, relativeUrl: string): string => {
  if (!relativeUrl) return '';
  const trimmed = relativeUrl.trim();

  // Data URIs can contain whitespaces/newlines which fail to load on mobile native.
  // We sanitize them by removing all internal whitespaces.
  if (trimmed.startsWith('data:')) {
    return trimmed.replace(/\s+/g, '');
  }

  if (trimmed.startsWith('file://')) {
    return trimmed;
  }

  // Fallback to backend domain if base URL is missing or relative
  const fallbackBase = 'https://api.flarelap.com/';
  let baseToUse = baseUrl || fallbackBase;
  if (!baseToUse.startsWith('http://') && !baseToUse.startsWith('https://')) {
    baseToUse = fallbackBase;
  }

  try {
    return new URL(trimmed, baseToUse).href;
  } catch (e) {
    if (trimmed.startsWith('/')) {
      const match = baseToUse.match(/^(https?:\/\/[^\/]+)/);
      if (match) {
        return `${match[1]}${trimmed}`;
      }
      return trimmed;
    }

    const cleanBaseUrl = baseToUse.split('?')[0].split('#')[0];
    const baseParts = cleanBaseUrl.split('/');
    if (baseParts.length > 3) {
      baseParts.pop(); // Remove file name
    }
    const basePath = baseParts.join('/');

    return `${basePath}/${trimmed}`;
  }
};

const preprocessSvg = (xml: string | null): string | null => {
  if (!xml) return null;
  // Remove font-variation-settings to prevent Android native crash in react-native-svg
  const cleanedXml = xml
    .replace(/font-variation-settings\s*=\s*["'][^"']*["']/gi, '')
    .replace(/font-variation-settings\s*:\s*[^;"}]*;?/gi, '')
    .replace(/font-variation-settings\s*:\s*[^;'}];?/gi, '');
  // Find the opening <svg ...> tag

  const svgTagMatch = cleanedXml.match(/<svg([^>]*)>/i);
  if (!svgTagMatch) return cleanedXml;

  const svgTag = svgTagMatch[0];

  // Extract existing width and height if present
  const widthMatch = svgTag.match(/width=["']([^"']+)["']/i);
  const heightMatch = svgTag.match(/height=["']([^"']+)["']/i);
  const viewBoxMatch = svgTag.match(/viewBox=["']([^"']+)["']/i);

  let newTag = svgTag;

  // If there's no viewBox but there are width and height, add viewBox to ensure proper scaling
  if (!viewBoxMatch && widthMatch && heightMatch) {
    const w = widthMatch[1].replace(/px/gi, '').trim();
    const h = heightMatch[1].replace(/px/gi, '').trim();
    if (!isNaN(parseFloat(w)) && !isNaN(parseFloat(h))) {
      newTag = newTag.replace(/>$/, ` viewBox="0 0 ${w} ${h}">`);
    }
  }

  // Force width and height to 100% in the root tag so it scales dynamically
  // within the container size defined by width and height props of SvgXml
  if (newTag.match(/width=["']([^"']+)["']/i)) {
    newTag = newTag.replace(/width=["']([^"']+)["']/i, 'width="100%"');
  } else {
    newTag = newTag.replace(/<svg/i, '<svg width="100%"');
  }

  if (newTag.match(/height=["']([^"']+)["']/i)) {
    newTag = newTag.replace(/height=["']([^"']+)["']/i, 'height="100%"');
  } else {
    newTag = newTag.replace(/<svg/i, '<svg height="100%"');
  }

  return cleanedXml.replace(svgTag, newTag);
};




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
import { SafeAreaView } from 'react-native-safe-area-context';
import { THEME_COLORS } from '../../constants';

const SOCIAL_SUBCATS = [
  { id: 'instagram_post', title: 'Instagram Post', icon: <InstagramPostIcon width={150} height={150} />, size: '1080 x 1080' },
  { id: 'facebook_cover', title: 'Facebook Cover', icon: <FacebookCoverIcon width={150} height={150} />, size: '851 x 315' },
  { id: 'facebook_post', title: 'Facebook Post', icon: <FacebookPostIcon width={150} height={150} />, size: '1200 x 630' },
  { id: 'x_cover', title: 'X Cover', icon: <XCoverIcon width={150} height={150} />, size: '900 x 300' },
  { id: 'youtube_thumb', title: 'YouTube Thumbnail', icon: <YouTubeThumbIcon width={150} height={150} />, size: '1280 x 720' },
  { id: 'linkedin_banner', title: 'LinkedIn Banner', icon: <LinkedInBannerIcon width={150} height={150} />, size: '1584 x 396' },
  { id: 'pinterest_pin', title: 'Pinterest Pin', icon: <PinterestPinIcon width={150} height={150} />, size: '1000 x 1500' },
];



// ─── Fabric.js JSON → Item mapper ──────────────────────────────────────────
// Fabric stores positions as center-point (left/top = center when originX/Y='center').
// We convert to top-left origin expected by the canvas overlay system.
const fabricPathToString = (path: Array<Array<string | number>>): string =>
  path.map((seg) => seg.join(' ')).join(' ');

const mapFabricObjectsToItems = async (
  objects: FabricObject[],
  nextIdRef: React.MutableRefObject<number>,
  baseUrl?: string | null,
  localFileMap?: Map<string, string>
): Promise<Item[]> => {
  const items: Item[] = [];

  for (const obj of objects) {
    if (obj.visible === false) continue;

    const scaleX = obj.scaleX ?? 1;
    const scaleY = obj.scaleY ?? 1;
    const scaledW = (obj.width ?? 0) * scaleX;
    const scaledH = (obj.height ?? 0) * scaleY;
    const angle = obj.angle ?? 0;
    const opacity = obj.opacity ?? 1;
    const fill = typeof obj.fill === 'string' ? obj.fill : '#df103f';
    const stroke = typeof obj.stroke === 'string' ? obj.stroke : '#000000';
    const strokeWidth = obj.strokeWidth ?? 0;

    // Fabric originX/Y 'center' means left/top is the center point
    const isCenterOrigin = (obj.originX ?? 'left') === 'center';
    const x = isCenterOrigin ? (obj.left ?? 0) - scaledW / 2 : (obj.left ?? 0);
    const y = isCenterOrigin ? (obj.top ?? 0) - scaledH / 2 : (obj.top ?? 0);

    const lowerType = (obj.type ?? '').toLowerCase();

    if (lowerType === 'i-text' || lowerType === 'textbox' || lowerType === 'text') {
      items.push({
        id: `fab_text_${nextIdRef.current++}`,
        type: 'text',
        x,
        y,
        width: Math.max(40, scaledW),
        height: Math.max(20, scaledH),
        rotation: angle,
        text: obj.text ?? '',
        fontSize: (obj.fontSize ?? 16) * scaleY,
        color: fill === 'transparent' || fill === 'none' ? '#000000' : fill,
        fontWeight: String(obj.fontWeight) === 'bold' || Number(obj.fontWeight) >= 700 ? 'bold' : 'normal',
        fontStyle: obj.fontStyle === 'italic' ? 'italic' : 'normal',
        textAlign: (obj.textAlign === 'center' || obj.textAlign === 'right' || obj.textAlign === 'left') ? obj.textAlign : 'left',
        opacity,
      });
      continue;
    }

    if (lowerType === 'image') {
      let resolvedSrc = '';
      if (obj.src) {
        const trimmedSrc = obj.src.trim();
        if (trimmedSrc.startsWith('data:')) {
          const cached = localFileMap?.get(trimmedSrc) || localFileMap?.get(obj.src);
          if (cached) {
            resolvedSrc = cached;
          } else {
            const extension = trimmedSrc.match(/data:image\/([a-z]+);base64/)?.[1] || 'png';
            const filename = `fabric_inline_img_${Date.now()}_${nextIdRef.current}.${extension}`;
            resolvedSrc = await saveBase64ToTempFile(trimmedSrc, filename);
            if (localFileMap) {
              localFileMap.set(trimmedSrc, resolvedSrc);
            }
          }
        } else {
          resolvedSrc = resolveRelativeUrl(baseUrl, obj.src);
        }
      }

      let clipPathD = undefined;
      if (obj.clipPath) {
        const clipType = (obj.clipPath.type || '').toLowerCase();
        const cW = scaledW;
        const cH = scaledH;
        if (clipType === 'rect') {
          const rx = (obj.clipPath.rx || 0) * scaleX;
          const ry = (obj.clipPath.ry || 0) * scaleY;
          if (rx > 0 || ry > 0) {
            clipPathD = `M ${rx} 0 H ${cW - rx} A ${rx} ${ry} 0 0 1 ${cW} ${ry} V ${cH - ry} A ${rx} ${ry} 0 0 1 ${cW - rx} ${cH} H ${rx} A ${rx} ${ry} 0 0 1 0 ${cH - ry} V ${ry} A ${rx} ${ry} 0 0 1 ${rx} 0 Z`;
          } else {
            clipPathD = `M 0 0 H ${cW} V ${cH} H 0 Z`;
          }
        } else if (clipType === 'circle') {
          const r = Math.min(cW, cH) / 2;
          const cx = cW / 2;
          const cy = cH / 2;
          clipPathD = `M ${cx} ${cy - r} A ${r} ${r} 0 1 0 ${cx} ${cy + r} A ${r} ${r} 0 1 0 ${cx} ${cy - r}`;
        } else if (clipType === 'polygon' || clipType === 'polyline') {
          if (Array.isArray(obj.clipPath.points) && obj.clipPath.points.length > 0) {
            const xs = obj.clipPath.points.map((p: any) => p.x);
            const ys = obj.clipPath.points.map((p: any) => p.y);
            const minX = Math.min(...xs);
            const minY = Math.min(...ys);
            const maxX = Math.max(...xs);
            const maxY = Math.max(...ys);
            const pScaleX = cW / (maxX - minX || 1);
            const pScaleY = cH / (maxY - minY || 1);
            const pts = obj.clipPath.points.map((p: any) => `${(p.x - minX) * pScaleX},${(p.y - minY) * pScaleY}`);
            clipPathD = `M ${pts[0]} ` + pts.slice(1).map((p: string) => `L ${p}`).join(' ') + (clipType === 'polygon' ? ' Z' : '');
          }
        } else if (clipType === 'triangle') {
          clipPathD = `M ${cW / 2} 0 L ${cW} ${cH} L 0 ${cH} Z`;
        } else if (clipType === 'path' && Array.isArray(obj.clipPath.path)) {
          clipPathD = fabricPathToString(obj.clipPath.path);
        }
      }

      items.push({
        id: `fab_img_${nextIdRef.current++}`,
        type: 'image',
        x,
        y,
        width: Math.max(10, scaledW),
        height: Math.max(10, scaledH),
        rotation: angle,
        uri: resolvedSrc,
        opacity,
        borderRadius: 0,
        clipPathD,
        clipPathTransform: (obj.clipPath?.type || '').toLowerCase() === 'path'
          ? `translate(${scaledW / 2}, ${scaledH / 2}) scale(${scaledW / (obj.clipPath.width || scaledW)}, ${scaledH / (obj.clipPath.height || scaledH)})`
          : undefined,
      });
      continue;
    }

    if (lowerType === 'rect') {
      items.push({
        id: `fab_rect_${nextIdRef.current++}`,
        type: 'shape',
        shapeType: 'rect',
        x,
        y,
        width: Math.max(2, scaledW),
        height: Math.max(2, scaledH),
        rotation: angle,
        color: fill,
        strokeColor: stroke,
        strokeWidth,
        borderRadius: obj.rx ?? 0,
        opacity,
      });
      continue;
    }

    if (lowerType === 'circle' || lowerType === 'ellipse') {
      items.push({
        id: `fab_circ_${nextIdRef.current++}`,
        type: 'shape',
        shapeType: 'circle',
        x,
        y,
        width: Math.max(2, scaledW),
        height: Math.max(2, scaledH),
        rotation: angle,
        color: fill,
        strokeColor: stroke,
        strokeWidth,
        opacity,
      });
      continue;
    }

    if (lowerType === 'triangle') {
      items.push({
        id: `fab_tri_${nextIdRef.current++}`,
        type: 'shape',
        shapeType: 'triangle',
        x,
        y,
        width: Math.max(2, scaledW),
        height: Math.max(2, scaledH),
        rotation: angle,
        color: fill,
        strokeColor: stroke,
        strokeWidth,
        opacity,
      });
      continue;
    }

    if (lowerType === 'line') {
      items.push({
        id: `fab_line_${nextIdRef.current++}`,
        type: 'shape',
        shapeType: 'line',
        x,
        y,
        width: Math.max(2, scaledW),
        height: Math.max(20, scaledH),
        rotation: angle,
        color: fill !== 'transparent' ? fill : stroke,
        strokeWidth: Math.max(1, strokeWidth),
        opacity,
      });
      continue;
    }

    if (lowerType === 'path' && Array.isArray(obj.path) && obj.path.length > 0) {
      const pathD = fabricPathToString(obj.path);
      items.push({
        id: `fab_path_${nextIdRef.current++}`,
        type: 'shape',
        shapeType: 'path',
        x,
        y,
        width: Math.max(2, scaledW),
        height: Math.max(2, scaledH),
        rotation: angle,
        color: fill,
        strokeColor: stroke,
        strokeWidth,
        pathD,
        pathViewBox: `${x} ${y} ${scaledW} ${scaledH}`,
        opacity,
        strokeDasharray: Array.isArray(obj.strokeDashArray) ? obj.strokeDashArray.join(' ') : undefined,
      });
      continue;
    }

    if (lowerType === 'polygon' || lowerType === 'polyline') {
      if (Array.isArray(obj.points) && obj.points.length > 0) {
        const xs = obj.points.map((p: any) => p.x);
        const ys = obj.points.map((p: any) => p.y);
        const minX = Math.min(...xs);
        const minY = Math.min(...ys);

        const pathParts = obj.points.map((p: any, i: number) => {
          const relX = p.x - minX;
          const relY = p.y - minY;
          return `${i === 0 ? 'M' : 'L'} ${relX} ${relY}`;
        });
        if (lowerType === 'polygon') {
          pathParts.push('Z');
        }
        const pathD = pathParts.join(' ');

        items.push({
          id: `fab_poly_${nextIdRef.current++}`,
          type: 'shape',
          shapeType: 'path',
          x,
          y,
          width: Math.max(2, scaledW),
          height: Math.max(2, scaledH),
          rotation: angle,
          color: fill,
          strokeColor: stroke,
          strokeWidth,
          pathD,
          pathViewBox: `0 0 ${obj.width ?? scaledW} ${obj.height ?? scaledH}`,
          opacity,
          strokeDasharray: Array.isArray(obj.strokeDashArray) ? obj.strokeDashArray.join(' ') : undefined,
        });
      }
      continue;
    }
    // Unknown or unsupported Fabric type — skip
  }

  return items;
};

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
  textAlign?: 'left' | 'center' | 'right';
  shapeType?: 'rect' | 'circle' | 'triangle' | 'star' | 'line' | 'path';
  strokeColor?: string;
  strokeWidth?: number;
  borderRadius?: number;
  uri?: string;
  opacity?: number;
  pathD?: string;
  pathViewBox?: string;
  strokeDasharray?: string;
  clipPathD?: string;
  clipPathTransform?: string;
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
  zIndex: number;
  canvasScaleX: number;
  canvasScaleY: number;
  onSelect: (id: string) => void;
  onUpdate: (id: string, patch: Partial<Item>) => void;
  onCommitHistory: () => void;
  onDelete: (id: string) => void;
}

function Movable({ item, selected, zIndex, canvasScaleX, canvasScaleY, onSelect, onUpdate, onCommitHistory, onDelete }: MovableProps) {
  const startPosition = useRef({ x: 0, y: 0 });
  const startSize = useRef({ width: 0, height: 0 });
  const startRotation = useRef(0);

  // Use a single uniform scale to avoid double-scaling issues.
  const canvasUniformScale = Math.min(canvasScaleX, canvasScaleY);
  const fontScale = canvasUniformScale;

  const canvasScaleRef = useRef({ x: canvasUniformScale, y: canvasUniformScale });
  useEffect(() => {
    canvasScaleRef.current = { x: canvasUniformScale, y: canvasUniformScale };
  }, [canvasUniformScale]);

  const scaledWidth = item.width * canvasUniformScale;
  const scaledHeight = item.height * canvasUniformScale;


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
          x: startPosition.current.x + gestureState.dx / canvasScaleRef.current.x,
          y: startPosition.current.y + gestureState.dy / canvasScaleRef.current.y,
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
          width: Math.max(30, startSize.current.width + gestureState.dx / canvasScaleRef.current.x),
          height: Math.max(30, startSize.current.height + gestureState.dy / canvasScaleRef.current.y),
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
    const w = scaledWidth;
    const h = scaledHeight;
    const sw = (item.strokeWidth ?? 0) * fontScale;
    const sc = item.strokeColor ?? '#000000';
    const fc = item.color ?? '#df103f';
    const rx = (item.borderRadius ?? 0) * fontScale;

    switch (item.shapeType) {
      case 'rect':
        return (
          <Svg width={w} height={h}>
            <Rect x={sw / 2} y={sw / 2} width={w - sw} height={h - sw} fill={fc} stroke={sc} strokeWidth={sw} rx={rx > 0 ? rx : undefined} />
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
          left: item.x * canvasUniformScale,
          top: item.y * canvasUniformScale,
          width: scaledWidth,
          height: scaledHeight,
          transform: [{ rotate: `${item.rotation}deg` }],
          zIndex,
        },
      ]}
    >
      <View style={styles.contentContainer} {...dragPanResponder.panHandlers}>
        {item.type === 'text' && (
          <RNText
            style={{
              fontSize: (item.fontSize ?? 16) * fontScale,
              lineHeight: Math.max(1, (item.fontSize ?? 16) * fontScale * 1.1),
              color: item.color ?? '#000000',
              fontWeight: item.fontWeight ?? 'normal',
              fontStyle: item.fontStyle ?? 'normal',
              width: '100%',
              height: '100%',
              textAlign: item.textAlign ?? 'center',
            }}
            numberOfLines={undefined}
          >
            {item.text}
          </RNText>
        )}
        {item.type === 'shape' && renderShape()}
        {item.type === 'image' && item.clipPathD && (
          <Svg width="100%" height="100%" viewBox={`0 0 ${item.width} ${item.height}`}>
            <Defs>
              <ClipPath id={`clip_${item.id}`}>
                <Path d={item.clipPathD} transform={item.clipPathTransform} />
              </ClipPath>
            </Defs>
            <SvgImage
              x="0"
              y="0"
              width="100%"
              height="100%"
              preserveAspectRatio="xMidYMid meet"
              href={{ uri: item.uri || 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=400' }}
              clipPath={`url(#clip_${item.id})`}
              opacity={item.opacity ?? 1}
            />
          </Svg>
        )}
        {item.type === 'image' && !item.clipPathD && (
          <RNImage
            source={{ uri: item.uri || 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=400' }}
            style={{
              width: '100%',
              height: '100%',
              borderRadius: (item.borderRadius ?? 0) * fontScale,
              opacity: item.opacity ?? 1,
            }}
            resizeMode="contain"
          />
        )}
      </View>

      {selected && (
        <>
          <View style={styles.selectionOutline} pointerEvents="none" />
          <View style={[styles.handle, styles.rotateHandle, { left: scaledWidth / 2 - 12, top: -32 }]} {...rotatePanResponder.panHandlers}>
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
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
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
  const [canvasMetrics, setCanvasMetrics] = useState<CanvasMetrics>(DEFAULT_CANVAS_METRICS);
  // Toolbar & Panels state
  const [activeTab, setActiveTab] = useState<'templates' | 'add' | 'styles' | 'layers' | 'canvas'>('templates');
  const [editorPanelHidden, setEditorPanelHidden] = useState(false);
  const [canvasArea, setCanvasArea] = useState({
    width: windowWidth,
    height: Math.max(0, windowHeight - HEADER_HEIGHT),
  });

  const canvasFrame = useMemo(() => {
    const availableWidth = Math.max(1, canvasArea.width);
    const availableHeight = Math.max(1, canvasArea.height);
    const scale = Math.min(availableWidth / canvasMetrics.width, availableHeight / canvasMetrics.height);
    const width = Math.max(1, Math.floor(canvasMetrics.width * scale));
    const height = Math.max(1, Math.floor(canvasMetrics.height * scale));
    return { width, height };
  }, [canvasArea.height, canvasArea.width, canvasMetrics.height, canvasMetrics.width]);
  const canvasScaleX = canvasFrame.width / canvasMetrics.width;
  const canvasScaleY = canvasFrame.height / canvasMetrics.height;

  const handleCanvasAreaLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setCanvasArea((prev) => {
      if (Math.round(prev.width) === Math.round(width) && Math.round(prev.height) === Math.round(height)) {
        return prev;
      }
      return { width, height };
    });
  };

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
      if (!initialSvgText && !svgUrl) return;

      setLoading(true);
      try {
        let fabricJSON: any;
        let processedCleanSvgText: string | null = null;
        let localFileMap = new Map<string, string>();

        if (svgUrl) {
          const res = await svgUrlToFabricJSON(svgUrl);
          fabricJSON = res.fabricJSON;
          const resolvedCleanSvgUrl = resolveRelativeUrl(svgUrl, res.svgUrl);
          const bgRes = await fetch(resolvedCleanSvgUrl);
          const rawSvgText = bgRes.ok ? await bgRes.text() : null;
          const processed = await processSvgBase64Images(rawSvgText);
          processedCleanSvgText = processed.cleanSvgText;
          localFileMap = processed.localFileMap;
        } else if (initialSvgText) {
          fabricJSON = await svgStringToFabricJSON(initialSvgText);
          const processed = await processSvgBase64Images(initialSvgText);
          processedCleanSvgText = processed.cleanSvgText;
          localFileMap = processed.localFileMap;
        }

        if (!fabricJSON) throw new Error('No Fabric JSON returned');

        // Derive canvas dimensions from the Fabric objects bounding box
        let maxRight = 400;
        let maxBottom = 400;
        for (const obj of fabricJSON.objects) {
          const scaleX = obj.scaleX ?? 1;
          const scaleY = obj.scaleY ?? 1;
          const w = (obj.width ?? 0) * scaleX;
          const h = (obj.height ?? 0) * scaleY;
          const isCenterOrigin = (obj.originX ?? 'left') === 'center';
          const right = isCenterOrigin ? (obj.left ?? 0) + w / 2 : (obj.left ?? 0) + w;
          const bottom = isCenterOrigin ? (obj.top ?? 0) + h / 2 : (obj.top ?? 0) + h;
          if (right > maxRight) maxRight = right;
          if (bottom > maxBottom) maxBottom = bottom;
        }
        const svgMetrics: CanvasMetrics = { width: maxRight, height: maxBottom, minX: 0, minY: 0 };

        // Map Fabric objects → editable items
        const fabricItems = await mapFabricObjectsToItems(fabricJSON.objects, nextId, svgUrl || null, localFileMap);

        if (!mounted) return;
        setCanvasMetrics(svgMetrics);
        setSvgText(null);
        setItems(fabricItems);
        setHistory([fabricItems]);
        setHistoryIndex(0);
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
  }, [svgUrl, initialSvgText]);

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
      x: (canvasMetrics.width - 200) / 2,
      y: (canvasMetrics.height - 60) / 2,
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
      x: (canvasMetrics.width - 100) / 2,
      y: (canvasMetrics.height - 100) / 2,
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
      x: (canvasMetrics.width - 120) / 2,
      y: (canvasMetrics.height - 120) / 2,
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

  // Load SVG Template via Fabric.js JSON API
  const handleLoadTemplate = (tmpl: Template | null) => {
    const performLoad = async () => {
      if (!tmpl) {
        setSvgText(null);
        setItems([]);
        setBgColor('#FFFFFF');
        setCanvasMetrics(DEFAULT_CANVAS_METRICS);
        setSelected(null);
        setActiveTemplateId(null);
        setHistory([[]]);
        setHistoryIndex(0);
        return;
      }

      if (!tmpl.svg_url) {
        Alert.alert('Template missing', 'This template has no SVG URL available.');
        return;
      }

      setLoading(true);
      setItems([]);
      setSvgText(null);
      setSelected(null);
      try {
        // Call the Fabric.js conversion API
        const { fabricJSON } = await svgUrlToFabricJSON(tmpl.svg_url);
        console.log("fabricJSON", fabricJSON, tmpl.svg_url);
        // Derive canvas dimensions from the Fabric objects bounding box
        let minX = Infinity;
        let minY = Infinity;
        let maxX = -Infinity;
        let maxY = -Infinity;

        for (const obj of fabricJSON.objects) {
          const scaleX = obj.scaleX ?? 1;
          const scaleY = obj.scaleY ?? 1;
          const w = (obj.width ?? 0) * scaleX;
          const h = (obj.height ?? 0) * scaleY;
          const isCenterOrigin = (obj.originX ?? 'left') === 'center';
          const left = isCenterOrigin ? (obj.left ?? 0) - w / 2 : (obj.left ?? 0);
          const top = isCenterOrigin ? (obj.top ?? 0) - h / 2 : (obj.top ?? 0);

          if (left < minX) minX = left;
          if (top < minY) minY = top;
          if (left + w > maxX) maxX = left + w;
          if (top + h > maxY) maxY = top + h;
        }

        const contentWidth = Number.isFinite(maxX) && Number.isFinite(minX) ? maxX - minX : 400;
        const contentHeight = Number.isFinite(maxY) && Number.isFinite(minY) ? maxY - minY : 400;
        const templateWidth = contentWidth;
        const templateHeight = contentHeight;

        const targetWidth = windowWidth;
        const targetHeight = templateWidth > 0 ? (templateHeight / templateWidth) * targetWidth : targetWidth;

        if (templateWidth > 0 && templateHeight > 0) {
          const sourceLeft = Number.isFinite(minX) ? minX : 0;
          const sourceTop = Number.isFinite(minY) ? minY : 0;
          const fitWidth = contentWidth > 0 ? contentWidth : templateWidth;
          const fitHeight = contentHeight > 0 ? contentHeight : templateHeight;
          const scaleX = targetWidth / fitWidth;
          const scaleY = targetHeight / fitHeight;

          fabricJSON.objects.forEach((obj: any) => {
            const currentLeft = obj.left || 0;
            const currentTop = obj.top || 0;

            obj.left = (currentLeft - sourceLeft) * scaleX;
            obj.top = (currentTop - sourceTop) * scaleY;
            obj.scaleX = (obj.scaleX || 1) * scaleX;
            obj.scaleY = (obj.scaleY || 1) * scaleY;
          });
        }

        const svgMetrics: CanvasMetrics = { width: targetWidth, height: targetHeight, minX: 0, minY: 0 };

        // Use the clean SVG URL (returned by API) as the background layer and cache base64 images
        const bgRes = await fetch(tmpl.svg_url);
        const rawSvgText = bgRes.ok ? await bgRes.text() : null;
        const { cleanSvgText, localFileMap } = await processSvgBase64Images(rawSvgText);

        // Map Fabric objects → editable items
        const fabricItems = await mapFabricObjectsToItems(fabricJSON.objects, nextId, tmpl.svg_url, localFileMap);

        setSvgText(null);
        setItems(fabricItems);
        setBgColor('#FFFFFF');
        setCanvasMetrics(svgMetrics);
        setSelected(null);
        setActiveTemplateId(tmpl.id);

        setHistory([fabricItems]);
        setHistoryIndex(0);
      } catch (e: any) {
        Alert.alert('Failed to load template', e?.message || 'Could not load SVG');
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
          setCanvasMetrics(DEFAULT_CANVAS_METRICS);
          setActiveTemplateId(null);
          setHistory([[]]);
          setHistoryIndex(0);
        },
      },
    ]);
  };

  // Standalone SVG Exporter
  const handleExportSvg = () => {
    const exportOffsetX = svgText ? canvasMetrics.minX : 0;
    const exportOffsetY = svgText ? canvasMetrics.minY : 0;

    const itemToSvgTag = (it: Item) => {
      const x = it.x + exportOffsetX;
      const y = it.y + exportOffsetY;
      const w = it.width;
      const h = it.height;
      const rot = it.rotation;
      const cx = x + w / 2;
      const cy = y + h / 2;
      const transform = rot ? ` transform="rotate(${rot} ${cx.toFixed(1)} ${cy.toFixed(1)})"` : '';
      const fc = it.color || '#000000';
      const opacityAttr = it.opacity !== undefined && it.opacity < 1 ? ` opacity="${it.opacity}"` : '';

      switch (it.type) {
        case 'text': {
          const fs = it.fontSize ?? 16;
          const fw = it.fontWeight === 'bold' ? ' font-weight="bold"' : '';
          const fst = it.fontStyle === 'italic' ? ' font-style="italic"' : '';
          const textEscaped = (it.text ?? '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&apos;');
          const ta = it.textAlign === 'left' ? 'start' : it.textAlign === 'right' ? 'end' : 'middle';
          return `<text x="${cx.toFixed(1)}" y="${cy.toFixed(1)}" font-size="${fs.toFixed(1)}" fill="${fc}"${fw}${fst} text-anchor="${ta}" dominant-baseline="central"${transform} font-family="System">${textEscaped}</text>`;
        }
        case 'image':
          return `<image x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${w.toFixed(1)}" height="${h.toFixed(1)}" href="${it.uri}"${opacityAttr}${transform}/>`;
        case 'shape': {
          const sw = it.strokeWidth ?? 0;
          const sc = it.strokeColor ?? '#000000';
          const strokeAttr = sw > 0 ? ` stroke="${sc}" stroke-width="${sw.toFixed(1)}"` : '';
          const rxVal = it.borderRadius ?? 0;

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
      finalSvg = `<svg width="${canvasMetrics.width}" height="${canvasMetrics.height}" viewBox="0 0 ${canvasMetrics.width} ${canvasMetrics.height}" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
  <rect width="${canvasMetrics.width}" height="${canvasMetrics.height}" fill="${bgColor}"/>
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
            <TouchableOpacity
              onPress={() => setEditorPanelHidden((hidden) => !hidden)}
              style={styles.actionIconBtn}
              accessibilityRole="button"
              accessibilityLabel={editorPanelHidden ? 'Show bottom tools' : 'Hide bottom tools'}
            >
              {editorPanelHidden ? (
                <ChevronUpIcon size={18} color="#0f172a" />
              ) : (
                <ChevronDownIcon size={18} color="#0f172a" />
              )}
            </TouchableOpacity>
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
        <View style={styles.canvasContainer} onLayout={handleCanvasAreaLayout}>
          <View style={[styles.canvasWrapper, { width: canvasFrame.width, height: canvasFrame.height }]}>
            {/* Checkerboard Background */}
            <View style={styles.checkerboard} />

            {/* Design Artboard */}
            <TouchableOpacity
              activeOpacity={1}
              onPress={() => setSelected(null)}
              style={[styles.artboard, { width: canvasFrame.width, height: canvasFrame.height, backgroundColor: bgColor }]}
            >
              {loading ? (
                <ActivityIndicator size="large" color="#df103f" style={StyleSheet.absoluteFillObject} />
              ) : error ? (
                <Text style={styles.errorText}>{error}</Text>
              ) : svgText ? (
                <SvgXml
                  xml={preprocessSvg(svgText) || ''}
                  width={canvasFrame.width}
                  height={canvasFrame.height}
                  style={{ position: 'absolute', top: 0, left: 0 }}
                />
              ) : null}

              {/* Elements Overlay Layer */}
              <View style={StyleSheet.absoluteFillObject} pointerEvents="box-none">
                {items.map((it, index) => (
                  <Movable
                    key={it.id}
                    item={it}
                    selected={selected === it.id}
                    zIndex={index + 1}
                    canvasScaleX={canvasScaleX}
                    canvasScaleY={canvasScaleY}
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
        {!editorPanelHidden && <View style={styles.editorPanel}>
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
                          multiline={true}
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
        </View>}
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
  safe: { flex: 1, backgroundColor: THEME_COLORS.primary },
  container: { flex: 1, backgroundColor: '#ffffffff', position: 'relative' },

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
    justifyContent: 'flex-start',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    paddingTop: 16,
  },
  canvasWrapper: {
    position: 'relative',
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
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 290,
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    elevation: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    zIndex: 20,
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
