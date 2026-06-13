/**
 * LogoAndSticker.tsx
 *
 * A full-featured vector-style Logo & Sticker creator:
 *   • Canvas size presets (square, wide, tall, sticker circle)
 *   • Background color / gradient fill
 *   • Shape tools — rectangle, rounded rect, circle, star, triangle, heart, badge
 *   • Text layers — font family, size, color, bold, italic, shadow
 *   • Emoji drop
 *   • Pick image from gallery as layer
 *   • Every element: draggable, resizable, rotatable
 *   • Undo / Redo
 *   • Export via react-native-view-shot → Share
 */
import React, { useState, useRef, useCallback } from 'react';
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
  ActivityIndicator,
  Modal,
  Share,
  TextInput as RNTextInput,
  Platform,
} from 'react-native';
import { Text, Title } from 'react-native-paper';
import Svg, {
  Path, Circle, Rect, Polygon, Defs, LinearGradient, Stop, G,
  Text as SvgText, Ellipse,
} from 'react-native-svg';
import { launchImageLibrary } from 'react-native-image-picker';
import ViewShot, { captureRef } from 'react-native-view-shot';

const { width: SW } = Dimensions.get('window');

// ─── Canvas presets ────────────────────────────────────────────────────────────
const CANVAS_PRESETS = [
  { id: 'square',  label: '1:1 Square',  w: 320, h: 320  },
  { id: 'wide',    label: '16:9 Wide',   w: 320, h: 180  },
  { id: 'tall',    label: '9:16 Story',  w: 180, h: 320  },
  { id: 'sticker', label: 'Sticker',     w: 280, h: 280  },
  { id: 'logo',    label: 'Logo Wide',   w: 360, h: 160  },
];

const CANVAS_W_DEFAULT = 320;
const CANVAS_H_DEFAULT = 320;

// ─── Color palettes ────────────────────────────────────────────────────────────
const BRAND_COLORS = [
  '#EF4444','#F97316','#F59E0B','#10B981','#06B6D4',
  '#3B82F6','#6366F1','#8B5CF6','#EC4899','#F43F5E',
  '#FFFFFF','#F1F5F9','#CBD5E1','#64748B','#1E293B',
  '#000000','#7C3AED','#059669','#DC2626','#0891B2',
];

const GRADIENT_PRESETS = [
  { id: 'sunset',  label: 'Sunset',   from: '#F97316', to: '#EF4444' },
  { id: 'ocean',   label: 'Ocean',    from: '#06B6D4', to: '#3B82F6' },
  { id: 'forest',  label: 'Forest',   from: '#10B981', to: '#059669' },
  { id: 'purple',  label: 'Purple',   from: '#8B5CF6', to: '#EC4899' },
  { id: 'gold',    label: 'Gold',     from: '#F59E0B', to: '#EF4444' },
  { id: 'night',   label: 'Night',    from: '#1E293B', to: '#0F172A' },
  { id: 'berry',   label: 'Berry',    from: '#EC4899', to: '#8B5CF6' },
  { id: 'fresh',   label: 'Fresh',    from: '#34D399', to: '#06B6D4' },
];

const FONT_FAMILIES = [
  { id: 'default',     label: 'Default',   value: undefined      },
  { id: 'monospace',   label: 'Mono',      value: Platform.OS === 'ios' ? 'Courier' : 'monospace' },
  { id: 'serif',       label: 'Serif',     value: Platform.OS === 'ios' ? 'Georgia'  : 'serif'    },
];

const SHAPE_PRESETS = [
  { id: 'rect',     label: '▬ Rect'      },
  { id: 'rounded',  label: '▢ Rounded'   },
  { id: 'circle',   label: '● Circle'    },
  { id: 'ellipse',  label: '◎ Ellipse'   },
  { id: 'triangle', label: '▲ Triangle'  },
  { id: 'star',     label: '★ Star'      },
  { id: 'hexagon',  label: '⬡ Hexagon'   },
  { id: 'badge',    label: '🔖 Badge'    },
  { id: 'heart',    label: '♥ Heart'     },
  { id: 'arrow',    label: '➤ Arrow'     },
];

const EMOJI_LIST = [
  '⭐','🌟','💫','✨','🔥','💥','🎉','🎊','👑','💎',
  '🚀','🎸','🎵','🏆','🎯','💡','🌈','🦋','🌺','🐉',
  '💪','🤟','👊','✌️','🤘','🙌','🎭','🤖','💀','🦄',
  '🍕','🍔','🌮','🎂','🍦','🍩','🎮','🕹️','📱','💻',
];

// ─── Types ─────────────────────────────────────────────────────────────────────
type LayerType = 'shape' | 'text' | 'emoji' | 'image';

interface CanvasLayer {
  id: string;
  type: LayerType;
  x: number; y: number; w: number; h: number; rotation: number;
  // shape
  shapeId?: string; fillColor?: string; strokeColor?: string; strokeWidth?: number;
  // text
  text?: string; fontSize?: number; fontFamily?: string;
  textColor?: string; bold?: boolean; italic?: boolean;
  shadowColor?: string; shadowOffset?: number;
  // emoji
  emoji?: string;
  // image
  uri?: string; opacity?: number; borderRadius?: number;
}

// ─── SVG shape path builders ───────────────────────────────────────────────────
function starPath(cx: number, cy: number, r: number, points = 5): string {
  const inner = r * 0.4;
  let d = '';
  for (let i = 0; i < points * 2; i++) {
    const angle = (i * Math.PI) / points - Math.PI / 2;
    const radius = i % 2 === 0 ? r : inner;
    const x = cx + radius * Math.cos(angle);
    const y = cy + radius * Math.sin(angle);
    d += `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
  }
  return d + 'Z';
}

function hexagonPath(cx: number, cy: number, r: number): string {
  let d = '';
  for (let i = 0; i < 6; i++) {
    const angle = (i * Math.PI) / 3 - Math.PI / 6;
    const x = cx + r * Math.cos(angle);
    const y = cy + r * Math.sin(angle);
    d += `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
  }
  return d + 'Z';
}

function heartPath(cx: number, cy: number, r: number): string {
  const s = r * 0.9;
  return `M${cx},${cy + s * 0.4} C${cx - s * 1.2},${cy - s * 0.5} ${cx - s * 1.4},${cy + s * 0.9} ${cx},${cy + s * 1.4} C${cx + s * 1.4},${cy + s * 0.9} ${cx + s * 1.2},${cy - s * 0.5} ${cx},${cy + s * 0.4}Z`;
}

function badgePath(w: number, h: number): string {
  const cx = w / 2, cy = h / 2, r = Math.min(w, h) / 2 * 0.85;
  let d = '';
  for (let i = 0; i < 12; i++) {
    const angle = (i * Math.PI * 2) / 12 - Math.PI / 2;
    const sprayR = i % 2 === 0 ? r : r * 0.88;
    const x = cx + sprayR * Math.cos(angle);
    const y = cy + sprayR * Math.sin(angle);
    d += `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
  }
  return d + 'Z';
}

function arrowPath(w: number, h: number): string {
  const m = h * 0.3;
  return `M0,${h * 0.5 - m} L${w * 0.65},${h * 0.5 - m} L${w * 0.65},0 L${w},${h / 2} L${w * 0.65},${h} L${w * 0.65},${h * 0.5 + m} L0,${h * 0.5 + m}Z`;
}

// ─── Render shape inside SVG ───────────────────────────────────────────────────
function ShapeSvg({ layer }: { layer: CanvasLayer }) {
  const { w, h, shapeId, fillColor = '#3B82F6', strokeColor, strokeWidth = 0 } = layer;
  const gradId = `grad_${layer.id}`;
  const gradientPreset = GRADIENT_PRESETS.find(g => g.id === fillColor);
  const fill = gradientPreset ? `url(#${gradId})` : fillColor;

  const defs = gradientPreset ? (
    <Defs>
      <LinearGradient id={gradId} x1="0" y1="0" x2="1" y2="1">
        <Stop offset="0" stopColor={gradientPreset.from} />
        <Stop offset="1" stopColor={gradientPreset.to} />
      </LinearGradient>
    </Defs>
  ) : null;

  const cx = w / 2, cy = h / 2, r = Math.min(cx, cy);
  const stroke = strokeColor ?? 'transparent';

  let shape: React.ReactElement;
  switch (shapeId) {
    case 'circle':
      shape = <Circle cx={cx} cy={cy} r={r * 0.9} fill={fill} stroke={stroke} strokeWidth={strokeWidth} />;
      break;
    case 'ellipse':
      shape = <Ellipse cx={cx} cy={cy} rx={cx * 0.9} ry={cy * 0.75} fill={fill} stroke={stroke} strokeWidth={strokeWidth} />;
      break;
    case 'rounded':
      shape = <Rect x="4" y="4" width={w - 8} height={h - 8} rx="20" ry="20" fill={fill} stroke={stroke} strokeWidth={strokeWidth} />;
      break;
    case 'triangle':
      shape = <Polygon points={`${cx},4 ${w - 4},${h - 4} 4,${h - 4}`} fill={fill} stroke={stroke} strokeWidth={strokeWidth} />;
      break;
    case 'star':
      shape = <Path d={starPath(cx, cy, r * 0.88)} fill={fill} stroke={stroke} strokeWidth={strokeWidth} />;
      break;
    case 'hexagon':
      shape = <Path d={hexagonPath(cx, cy, r * 0.88)} fill={fill} stroke={stroke} strokeWidth={strokeWidth} />;
      break;
    case 'heart':
      shape = <Path d={heartPath(cx, cy, r * 0.55)} fill={fill} stroke={stroke} strokeWidth={strokeWidth} />;
      break;
    case 'badge':
      shape = <Path d={badgePath(w, h)} fill={fill} stroke={stroke} strokeWidth={strokeWidth} />;
      break;
    case 'arrow':
      shape = <Path d={arrowPath(w, h)} fill={fill} stroke={stroke} strokeWidth={strokeWidth} />;
      break;
    default: // rect
      shape = <Rect x="4" y="4" width={w - 8} height={h - 8} fill={fill} stroke={stroke} strokeWidth={strokeWidth} />;
  }

  return (
    <Svg width={w} height={h}>
      {defs}
      {shape}
    </Svg>
  );
}

// ─── Movable Layer ─────────────────────────────────────────────────────────────
interface LayerProps {
  item: CanvasLayer;
  selected: boolean;
  onSelect: (id: string) => void;
  onUpdate: (id: string, patch: Partial<CanvasLayer>) => void;
  onDelete: (id: string) => void;
}

function MovableLayer({ item, selected, onSelect, onUpdate, onDelete }: LayerProps) {
  const startPos  = useRef({ x: 0, y: 0 });
  const startSz   = useRef({ w: 0, h: 0 });
  const startRot  = useRef(0);

  const dragPR = useRef(PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: () => { onSelect(item.id); startPos.current = { x: item.x, y: item.y }; },
    onPanResponderMove: (_, g) => onUpdate(item.id, { x: startPos.current.x + g.dx, y: startPos.current.y + g.dy }),
  })).current;

  const resizePR = useRef(PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: (e) => { e.stopPropagation(); startSz.current = { w: item.w, h: item.h }; },
    onPanResponderMove: (e, g) => {
      e.stopPropagation();
      onUpdate(item.id, { w: Math.max(30, startSz.current.w + g.dx), h: Math.max(24, startSz.current.h + g.dy) });
    },
  })).current;

  const rotatePR = useRef(PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: (e) => { e.stopPropagation(); startRot.current = item.rotation; },
    onPanResponderMove: (e, g) => {
      e.stopPropagation();
      let r = (startRot.current + g.dx * 0.8) % 360;
      if (r < 0) r += 360;
      onUpdate(item.id, { rotation: Math.round(r) });
    },
  })).current;

  const renderContent = () => {
    switch (item.type) {
      case 'shape': return <ShapeSvg layer={item} />;
      case 'text': return (
        <RNText style={{
          fontSize: item.fontSize ?? 20,
          color: item.textColor ?? '#fff',
          fontWeight: item.bold ? 'bold' : 'normal',
          fontStyle: item.italic ? 'italic' : 'normal',
          fontFamily: item.fontFamily,
          textShadowColor: item.shadowColor ?? 'transparent',
          textShadowOffset: { width: item.shadowOffset ?? 2, height: item.shadowOffset ?? 2 },
          textShadowRadius: item.shadowColor ? 4 : 0,
          textAlign: 'center',
          width: item.w,
        }}>
          {item.text}
        </RNText>
      );
      case 'emoji': return (
        <RNText style={{ fontSize: item.fontSize ?? 48, textAlign: 'center' }}>{item.emoji}</RNText>
      );
      case 'image': return (
        <RNImage
          source={{ uri: item.uri }}
          style={{ width: item.w, height: item.h, borderRadius: item.borderRadius ?? 0, opacity: item.opacity ?? 1 }}
          resizeMode="cover"
        />
      );
    }
  };

  return (
    <View style={[lyr.wrap, { left: item.x, top: item.y, width: item.w, height: item.h, transform: [{ rotate: `${item.rotation}deg` }], zIndex: selected ? 999 : 10 }]}>
      <View style={lyr.inner} {...dragPR.panHandlers}>
        {renderContent()}
      </View>
      {selected && (
        <>
          <View style={lyr.outline} pointerEvents="none" />
          {/* Rotate top-centre */}
          <View style={[lyr.handle, lyr.rotH, { left: item.w / 2 - 13, top: -30 }]} {...rotatePR.panHandlers}>
            <RNText style={lyr.hIcon}>↻</RNText>
          </View>
          {/* Delete top-right */}
          <TouchableOpacity style={[lyr.handle, lyr.delH, { right: -12, top: -12 }]} onPress={() => onDelete(item.id)}>
            <RNText style={lyr.hIcon}>✕</RNText>
          </TouchableOpacity>
          {/* Resize bottom-right */}
          <View style={[lyr.handle, lyr.resH, { right: -10, bottom: -10 }]} {...resizePR.panHandlers}>
            <View style={lyr.resDot} />
          </View>
        </>
      )}
    </View>
  );
}

const lyr = StyleSheet.create({
  wrap:   { position: 'absolute' },
  inner:  { width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center', overflow: 'visible' },
  outline:{ ...StyleSheet.absoluteFillObject, borderWidth: 1.5, borderColor: '#38BDF8', borderStyle: 'dashed' },
  handle: { position: 'absolute', width: 26, height: 26, borderRadius: 13, justifyContent: 'center', alignItems: 'center', elevation: 8 },
  hIcon:  { fontSize: 12, color: '#fff', fontWeight: '800' },
  rotH:   { backgroundColor: '#3B82F6' },
  delH:   { backgroundColor: '#EF4444' },
  resH:   { backgroundColor: '#10B981' },
  resDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#fff' },
});

// ─── Slider ───────────────────────────────────────────────────────────────────
function Slider({ label, value, min, max, step = 1, onChange, showValue = true }: {
  label: string; value: number; min: number; max: number; step?: number; onChange: (v: number) => void; showValue?: boolean;
}) {
  const W = SW - 80;
  const pr = useRef(PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: (e) => apply(e.nativeEvent.locationX),
    onPanResponderMove: (e) => apply(e.nativeEvent.locationX),
  })).current;
  const apply = (lx: number) => {
    let r = Math.max(0, Math.min(1, lx / W));
    let v = Math.round((min + r * (max - min)) / step) * step;
    onChange(Math.max(min, Math.min(max, v)));
  };
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <View style={{ marginVertical: 5, paddingHorizontal: 6 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 3 }}>
        <RNText style={{ fontSize: 11, color: '#94A3B8', fontWeight: '600' }}>{label}</RNText>
        {showValue && <RNText style={{ fontSize: 11, color: '#F8FAFC', fontWeight: '700' }}>{value.toFixed(step < 1 ? 1 : 0)}</RNText>}
      </View>
      <View style={{ height: 22, justifyContent: 'center', width: W }} {...pr.panHandlers}>
        <View style={{ height: 4, borderRadius: 2, backgroundColor: '#334155' }} />
        <View style={{ height: 4, borderRadius: 2, backgroundColor: '#38BDF8', position: 'absolute', left: 0, width: `${pct}%` }} />
        <View style={{ position: 'absolute', width: 16, height: 16, borderRadius: 8, backgroundColor: '#38BDF8', borderWidth: 2, borderColor: '#fff', left: `${pct}%`, transform: [{ translateX: -8 }] }} />
      </View>
    </View>
  );
}

// ─── ColorPicker ──────────────────────────────────────────────────────────────
function ColorRow({ current, onPick }: { current: string; onPick: (c: string) => void }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingVertical: 4 }}>
      {BRAND_COLORS.map(c => (
        <TouchableOpacity key={c} onPress={() => onPick(c)}
          style={[cr.dot, { backgroundColor: c }, current === c && cr.active, c === '#FFFFFF' && { borderColor: '#475569' }]}
        />
      ))}
    </ScrollView>
  );
}
const cr = StyleSheet.create({
  dot:    { width: 28, height: 28, borderRadius: 14, borderWidth: 2, borderColor: 'transparent' },
  active: { borderColor: '#38BDF8', transform: [{ scale: 1.2 }] },
});

// ─── Main Component ────────────────────────────────────────────────────────────
export default function LogoAndSticker({ navigation, route }: { navigation?: any; route?: any }) {

  // Canvas
  const [canvasPreset, setCanvasPreset] = useState(CANVAS_PRESETS[0]);
  const canvasW = canvasPreset.w;
  const canvasH = canvasPreset.h;

  // Background
  const [bgType, setBgType] = useState<'solid' | 'gradient'>('gradient');
  const [bgColor, setBgColor] = useState('#1E293B');
  const [bgGradient, setBgGradient] = useState(GRADIENT_PRESETS[0]);

  // Layers
  const [layers, setLayers] = useState<CanvasLayer[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const nextId = useRef(1);

  // Undo/Redo
  const [history, setHistory] = useState<CanvasLayer[][]>([[]]);
  const [histIdx, setHistIdx] = useState(0);

  // Active tool tab
  const [activeTab, setActiveTab] = useState<'canvas' | 'shapes' | 'text' | 'emoji' | 'image' | 'props'>('shapes');

  // Text modal
  const [textModal, setTextModal] = useState(false);
  const [txtInput, setTxtInput]   = useState('');
  const [txtColor, setTxtColor]   = useState('#FFFFFF');
  const [txtSize, setTxtSize]     = useState(28);
  const [txtBold, setTxtBold]     = useState(false);
  const [txtItalic, setTxtItalic] = useState(false);
  const [txtShadow, setTxtShadow] = useState(false);
  const [txtFont, setTxtFont]     = useState(FONT_FAMILIES[0]);

  // Export
  const canvasRef = useRef<any>(null);
  const [exporting, setExporting] = useState(false);

  // ── history helpers ──
  const commitHistory = useCallback((newLayers: CanvasLayer[]) => {
    setHistory(h => {
      const next = [...h.slice(0, histIdx + 1), newLayers];
      setHistIdx(next.length - 1);
      return next;
    });
  }, [histIdx]);

  const undo = () => {
    if (histIdx <= 0) return;
    const idx = histIdx - 1;
    setLayers(history[idx]);
    setHistIdx(idx);
    setSelectedId(null);
  };

  const redo = () => {
    if (histIdx >= history.length - 1) return;
    const idx = histIdx + 1;
    setLayers(history[idx]);
    setHistIdx(idx);
    setSelectedId(null);
  };

  // ── layer helpers ──
  const addLayer = (partial: Omit<CanvasLayer, 'id' | 'x' | 'y' | 'rotation'> & { x?: number; y?: number }) => {
    const id = `l_${nextId.current++}`;
    const layer: CanvasLayer = {
      rotation: 0,
      x: canvasW / 2 - (partial.w ?? 80) / 2,
      y: canvasH / 2 - (partial.h ?? 80) / 2,
      ...partial,
      id,
    };
    const updated = [...layers, layer];
    setLayers(updated);
    setSelectedId(id);
    commitHistory(updated);
    return id;
  };

  const updateLayer = (id: string, patch: Partial<CanvasLayer>) =>
    setLayers(prev => prev.map(l => l.id === id ? { ...l, ...patch } : l));

  const deleteLayer = (id: string) => {
    const updated = layers.filter(l => l.id !== id);
    setLayers(updated);
    setSelectedId(null);
    commitHistory(updated);
  };

  const bringForward = () => {
    if (!selectedId) return;
    const idx = layers.findIndex(l => l.id === selectedId);
    if (idx >= layers.length - 1) return;
    const updated = [...layers];
    [updated[idx], updated[idx + 1]] = [updated[idx + 1], updated[idx]];
    setLayers(updated); commitHistory(updated);
  };

  const sendBackward = () => {
    if (!selectedId) return;
    const idx = layers.findIndex(l => l.id === selectedId);
    if (idx <= 0) return;
    const updated = [...layers];
    [updated[idx - 1], updated[idx]] = [updated[idx], updated[idx - 1]];
    setLayers(updated); commitHistory(updated);
  };

  // ── add shape ──
  const addShape = (shapeId: string) => {
    addLayer({ type: 'shape', w: 120, h: 120, shapeId, fillColor: GRADIENT_PRESETS[0].id, strokeColor: undefined, strokeWidth: 0 });
  };

  // ── add text ──
  const confirmAddText = () => {
    if (!txtInput.trim()) return;
    addLayer({
      type: 'text', w: 200, h: 60,
      text: txtInput, fontSize: txtSize, textColor: txtColor,
      bold: txtBold, italic: txtItalic,
      fontFamily: txtFont.value,
      shadowColor: txtShadow ? 'rgba(0,0,0,0.5)' : undefined, shadowOffset: txtShadow ? 3 : 0,
    });
    setTxtInput(''); setTextModal(false);
    setActiveTab('props');
  };

  // ── add emoji ──
  const addEmoji = (emoji: string) => {
    addLayer({ type: 'emoji', w: 80, h: 80, emoji, fontSize: 60 });
    setActiveTab('props');
  };

  // ── add image ──
  const pickImage = async () => {
    const res = await launchImageLibrary({ mediaType: 'photo', quality: 1 });
    if (res.assets?.[0]?.uri) {
      addLayer({ type: 'image', w: 140, h: 140, uri: res.assets[0].uri, opacity: 1, borderRadius: 0 });
      setActiveTab('props');
    }
  };

  // ── clear ──
  const clearCanvas = () => Alert.alert('Clear Canvas', 'Remove all layers?', [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Clear', style: 'destructive', onPress: () => { setLayers([]); setSelectedId(null); commitHistory([]); } },
  ]);

  // ── export ──
  const handleExport = async () => {
    setSelectedId(null);
    await new Promise<void>(r => setTimeout(r, 80));
    setExporting(true);
    try {
      const uri = await captureRef(canvasRef, { format: 'png', quality: 1 });
      await Share.share({ url: uri, message: 'Logo/Sticker made with Flarelap ✨' });
    } catch (e: any) {
      Alert.alert('Export Failed', e?.message ?? 'Unknown error');
    } finally {
      setExporting(false);
    }
  };

  const selectedLayer = layers.find(l => l.id === selectedId) ?? null;

  // ── background SVG ──
  const BgSvg = () => {
    if (bgType === 'gradient') {
      return (
        <Svg width={canvasW} height={canvasH} style={StyleSheet.absoluteFillObject}>
          <Defs>
            <LinearGradient id="bg_grad" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0" stopColor={bgGradient.from} />
              <Stop offset="1" stopColor={bgGradient.to} />
            </LinearGradient>
          </Defs>
          <Rect x="0" y="0" width={canvasW} height={canvasH} fill="url(#bg_grad)" />
        </Svg>
      );
    }
    return <View style={[StyleSheet.absoluteFillObject, { backgroundColor: bgColor }]} />;
  };

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.safe}>

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation?.goBack()} style={styles.hBtn}>
          <RNText style={styles.hBtnTxt}>✕</RNText>
        </TouchableOpacity>
        <Title style={styles.hTitle}>Logo & Sticker</Title>
        <View style={styles.hRight}>
          <TouchableOpacity onPress={undo} disabled={histIdx <= 0} style={[styles.hBtn, histIdx <= 0 && styles.dim]}>
            <RNText style={[styles.hBtnTxt, histIdx <= 0 && { color: '#475569' }]}>↩</RNText>
          </TouchableOpacity>
          <TouchableOpacity onPress={redo} disabled={histIdx >= history.length - 1} style={[styles.hBtn, histIdx >= history.length - 1 && styles.dim]}>
            <RNText style={[styles.hBtnTxt, histIdx >= history.length - 1 && { color: '#475569' }]}>↪</RNText>
          </TouchableOpacity>
          <TouchableOpacity onPress={clearCanvas} style={styles.hBtn}>
            <RNText style={[styles.hBtnTxt, { color: '#EF4444' }]}>🗑</RNText>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleExport} disabled={exporting} style={[styles.exportBtn, exporting && styles.dim]}>
            {exporting ? <ActivityIndicator size="small" color="#fff" /> : <RNText style={styles.exportLabel}>Export</RNText>}
          </TouchableOpacity>
        </View>
      </View>

      {/* Canvas area */}
      <View style={styles.canvasArea}>
        <ViewShot
          ref={canvasRef}
          options={{ format: 'png', quality: 1 }}
          style={[styles.canvas, { width: canvasW, height: canvasH }]}
        >
          <BgSvg />
          <TouchableOpacity
            activeOpacity={1}
            style={StyleSheet.absoluteFillObject}
            onPress={() => setSelectedId(null)}
          />
          <View style={StyleSheet.absoluteFillObject} pointerEvents="box-none">
            {layers.map(layer => (
              <MovableLayer
                key={layer.id}
                item={layer}
                selected={selectedId === layer.id}
                onSelect={(id) => { setSelectedId(id); setActiveTab('props'); }}
                onUpdate={updateLayer}
                onDelete={deleteLayer}
              />
            ))}
          </View>
        </ViewShot>

        {/* Canvas size strip */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.presetStrip} contentContainerStyle={{ gap: 8, paddingHorizontal: 4 }}>
          {CANVAS_PRESETS.map(p => (
            <TouchableOpacity key={p.id} style={[styles.presetChip, canvasPreset.id === p.id && styles.presetChipActive]} onPress={() => setCanvasPreset(p)}>
              <Text style={[styles.presetChipLabel, canvasPreset.id === p.id && { color: '#38BDF8' }]}>{p.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Bottom deck */}
      <View style={styles.deck}>
        <ScrollView style={styles.panelBody} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

          {/* CANVAS tab */}
          {activeTab === 'canvas' && (
            <View style={styles.panel}>
              <Text style={styles.sectionTitle}>Background Style</Text>
              <View style={styles.rowBtns}>
                <TouchableOpacity style={[styles.toggleBtn, bgType === 'solid' && styles.toggleActive]} onPress={() => setBgType('solid')}>
                  <Text style={[styles.toggleLabel, bgType === 'solid' && styles.toggleLabelActive]}>Solid</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.toggleBtn, bgType === 'gradient' && styles.toggleActive]} onPress={() => setBgType('gradient')}>
                  <Text style={[styles.toggleLabel, bgType === 'gradient' && styles.toggleLabelActive]}>Gradient</Text>
                </TouchableOpacity>
              </View>

              {bgType === 'solid' && (
                <>
                  <Text style={styles.sectionTitle}>Background Color</Text>
                  <ColorRow current={bgColor} onPick={setBgColor} />
                </>
              )}

              {bgType === 'gradient' && (
                <>
                  <Text style={styles.sectionTitle}>Gradient Preset</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingVertical: 4 }}>
                    {GRADIENT_PRESETS.map(g => (
                      <TouchableOpacity key={g.id} style={[styles.gradCard, bgGradient.id === g.id && styles.gradCardActive]} onPress={() => setBgGradient(g)}>
                        <View style={[styles.gradSwatch, { backgroundColor: g.from }]}>
                          <View style={[styles.gradSwatch2, { backgroundColor: g.to }]} />
                        </View>
                        <Text style={[styles.gradLabel, bgGradient.id === g.id && { color: '#38BDF8' }]}>{g.label}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </>
              )}
            </View>
          )}

          {/* SHAPES tab */}
          {activeTab === 'shapes' && (
            <View style={styles.panel}>
              <Text style={styles.sectionTitle}>Tap a shape to add it</Text>
              <View style={styles.shapeGrid}>
                {SHAPE_PRESETS.map(s => (
                  <TouchableOpacity key={s.id} style={styles.shapeCell} onPress={() => addShape(s.id)}>
                    <Text style={styles.shapeCellLabel}>{s.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* TEXT tab */}
          {activeTab === 'text' && (
            <View style={styles.panel}>
              <Text style={styles.sectionTitle}>Add Text Layer</Text>
              <TouchableOpacity style={styles.addTextBtn} onPress={() => setTextModal(true)}>
                <Text style={styles.addTextBtnLabel}>+ Add Text</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* EMOJI tab */}
          {activeTab === 'emoji' && (
            <View style={styles.panel}>
              <Text style={styles.sectionTitle}>Tap emoji to add</Text>
              <View style={styles.emojiGrid}>
                {EMOJI_LIST.map(e => (
                  <TouchableOpacity key={e} style={styles.emojiCell} onPress={() => addEmoji(e)}>
                    <RNText style={styles.emojiTxt}>{e}</RNText>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* IMAGE tab */}
          {activeTab === 'image' && (
            <View style={styles.panel}>
              <Text style={styles.sectionTitle}>Add Image Layer</Text>
              <TouchableOpacity style={styles.addTextBtn} onPress={pickImage}>
                <Text style={styles.addTextBtnLabel}>📷 Pick from Gallery</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* PROPS tab — selected layer editor */}
          {activeTab === 'props' && !selectedLayer && (
            <View style={styles.panel}>
              <Text style={[styles.sectionTitle, { color: '#475569' }]}>Select a layer on the canvas to edit its properties.</Text>
            </View>
          )}

          {activeTab === 'props' && selectedLayer && (
            <View style={styles.panel}>
              <View style={styles.propsHeader}>
                <Text style={styles.propsTitle}>{selectedLayer.type.toUpperCase()} LAYER</Text>
                <View style={styles.rowBtns}>
                  <TouchableOpacity style={styles.orderBtn} onPress={sendBackward}><Text style={styles.orderBtnTxt}>↓ Back</Text></TouchableOpacity>
                  <TouchableOpacity style={styles.orderBtn} onPress={bringForward}><Text style={styles.orderBtnTxt}>↑ Front</Text></TouchableOpacity>
                </View>
              </View>

              {/* Common: size & rotation */}
              <Slider label="Width"    value={selectedLayer.w}        min={20}  max={canvasW}   onChange={v => updateLayer(selectedLayer.id, { w: v })} />
              <Slider label="Height"   value={selectedLayer.h}        min={20}  max={canvasH}   onChange={v => updateLayer(selectedLayer.id, { h: v })} />
              <Slider label="Rotation" value={selectedLayer.rotation} min={0}   max={360} step={1} onChange={v => updateLayer(selectedLayer.id, { rotation: v })} />

              {/* Shape-specific */}
              {selectedLayer.type === 'shape' && (
                <>
                  <Text style={styles.sectionTitle}>Fill</Text>
                  {/* Solid colors */}
                  <ColorRow current={selectedLayer.fillColor ?? '#3B82F6'} onPick={c => updateLayer(selectedLayer.id, { fillColor: c })} />
                  {/* Gradient fills */}
                  <Text style={styles.sectionTitle}>Gradient Fill</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingVertical: 4 }}>
                    {GRADIENT_PRESETS.map(g => (
                      <TouchableOpacity key={g.id} style={[styles.gradCard, selectedLayer.fillColor === g.id && styles.gradCardActive]} onPress={() => updateLayer(selectedLayer.id, { fillColor: g.id })}>
                        <View style={[styles.gradSwatch, { backgroundColor: g.from }]}>
                          <View style={[styles.gradSwatch2, { backgroundColor: g.to }]} />
                        </View>
                        <Text style={[styles.gradLabel, selectedLayer.fillColor === g.id && { color: '#38BDF8' }]}>{g.label}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                  <Text style={styles.sectionTitle}>Stroke</Text>
                  <ColorRow current={selectedLayer.strokeColor ?? 'transparent'} onPick={c => updateLayer(selectedLayer.id, { strokeColor: c })} />
                  <Slider label="Stroke Width" value={selectedLayer.strokeWidth ?? 0} min={0} max={12} step={0.5} onChange={v => updateLayer(selectedLayer.id, { strokeWidth: v })} />
                </>
              )}

              {/* Text-specific */}
              {selectedLayer.type === 'text' && (
                <>
                  <RNTextInput
                    value={selectedLayer.text}
                    onChangeText={t => updateLayer(selectedLayer.id, { text: t })}
                    style={styles.inlineTxtInput}
                    placeholderTextColor="#475569"
                    placeholder="Text..."
                    multiline
                  />
                  <Slider label="Font Size" value={selectedLayer.fontSize ?? 20} min={8} max={100} step={1} onChange={v => updateLayer(selectedLayer.id, { fontSize: v })} />
                  <Text style={styles.sectionTitle}>Text Color</Text>
                  <ColorRow current={selectedLayer.textColor ?? '#fff'} onPick={c => updateLayer(selectedLayer.id, { textColor: c })} />
                  <View style={styles.rowBtns}>
                    <TouchableOpacity style={[styles.toggleBtn, selectedLayer.bold && styles.toggleActive]} onPress={() => updateLayer(selectedLayer.id, { bold: !selectedLayer.bold })}>
                      <Text style={[styles.toggleLabel, selectedLayer.bold && styles.toggleLabelActive]}>Bold</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.toggleBtn, selectedLayer.italic && styles.toggleActive]} onPress={() => updateLayer(selectedLayer.id, { italic: !selectedLayer.italic })}>
                      <Text style={[styles.toggleLabel, selectedLayer.italic && styles.toggleLabelActive]}>Italic</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.toggleBtn, !!selectedLayer.shadowColor && styles.toggleActive]} onPress={() => updateLayer(selectedLayer.id, { shadowColor: selectedLayer.shadowColor ? undefined : 'rgba(0,0,0,0.5)', shadowOffset: 3 })}>
                      <Text style={[styles.toggleLabel, !!selectedLayer.shadowColor && styles.toggleLabelActive]}>Shadow</Text>
                    </TouchableOpacity>
                  </View>
                  <Text style={styles.sectionTitle}>Font</Text>
                  <View style={styles.rowBtns}>
                    {FONT_FAMILIES.map(f => (
                      <TouchableOpacity key={f.id} style={[styles.toggleBtn, selectedLayer.fontFamily === f.value && styles.toggleActive]} onPress={() => updateLayer(selectedLayer.id, { fontFamily: f.value })}>
                        <Text style={[styles.toggleLabel, selectedLayer.fontFamily === f.value && styles.toggleLabelActive]}>{f.label}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </>
              )}

              {/* Emoji-specific */}
              {selectedLayer.type === 'emoji' && (
                <Slider label="Size" value={selectedLayer.fontSize ?? 60} min={20} max={180} step={2} onChange={v => updateLayer(selectedLayer.id, { fontSize: v })} />
              )}

              {/* Image-specific */}
              {selectedLayer.type === 'image' && (
                <>
                  <Slider label="Opacity"       value={selectedLayer.opacity ?? 1}       min={0.05} max={1}  step={0.05} onChange={v => updateLayer(selectedLayer.id, { opacity: v })} />
                  <Slider label="Corner Radius"  value={selectedLayer.borderRadius ?? 0}  min={0}    max={70} step={1}    onChange={v => updateLayer(selectedLayer.id, { borderRadius: v })} />
                </>
              )}

              <TouchableOpacity style={styles.deleteBtn} onPress={() => deleteLayer(selectedLayer.id)}>
                <Text style={styles.deleteBtnLabel}>🗑 Remove Layer</Text>
              </TouchableOpacity>
            </View>
          )}

        </ScrollView>

        {/* Tab strip */}
        <View style={styles.tabStrip}>
          {([
            { id: 'canvas',  label: '🎨 BG'     },
            { id: 'shapes',  label: '⬡ Shapes'  },
            { id: 'text',    label: 'T Text'     },
            { id: 'emoji',   label: '😂 Emoji'   },
            { id: 'image',   label: '🖼 Image'   },
            { id: 'props',   label: '⚙ Props'    },
          ] as const).map(tab => (
            <TouchableOpacity key={tab.id} style={styles.tabItem} onPress={() => setActiveTab(tab.id)}>
              <Text style={[styles.tabLabel, activeTab === tab.id && styles.tabLabelActive]}>{tab.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Add Text Modal */}
      <Modal visible={textModal} animationType="slide" transparent onRequestClose={() => setTextModal(false)}>
        <View style={styles.modalBg}>
          <View style={styles.modalCard}>
            <Title style={styles.modalTitle}>Add Text</Title>
            <RNTextInput
              value={txtInput}
              onChangeText={setTxtInput}
              placeholder="Your text here..."
              placeholderTextColor="#475569"
              style={styles.modalInput}
              autoFocus multiline
            />
            <Slider label="Font Size" value={txtSize} min={10} max={90} step={1} onChange={setTxtSize} />
            <Text style={[styles.sectionTitle, { paddingHorizontal: 6 }]}>Color</Text>
            <ColorRow current={txtColor} onPick={setTxtColor} />
            <View style={[styles.rowBtns, { marginTop: 8 }]}>
              <TouchableOpacity style={[styles.toggleBtn, txtBold && styles.toggleActive]} onPress={() => setTxtBold(b => !b)}>
                <Text style={[styles.toggleLabel, txtBold && styles.toggleLabelActive]}>Bold</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.toggleBtn, txtItalic && styles.toggleActive]} onPress={() => setTxtItalic(i => !i)}>
                <Text style={[styles.toggleLabel, txtItalic && styles.toggleLabelActive]}>Italic</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.toggleBtn, txtShadow && styles.toggleActive]} onPress={() => setTxtShadow(s => !s)}>
                <Text style={[styles.toggleLabel, txtShadow && styles.toggleLabelActive]}>Shadow</Text>
              </TouchableOpacity>
            </View>
            <Text style={[styles.sectionTitle, { paddingHorizontal: 6, marginTop: 8 }]}>Font</Text>
            <View style={styles.rowBtns}>
              {FONT_FAMILIES.map(f => (
                <TouchableOpacity key={f.id} style={[styles.toggleBtn, txtFont.id === f.id && styles.toggleActive]} onPress={() => setTxtFont(f)}>
                  <Text style={[styles.toggleLabel, txtFont.id === f.id && styles.toggleLabelActive]}>{f.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
            {/* Preview */}
            <View style={styles.textPreviewBox}>
              <RNText style={{ fontSize: txtSize, color: txtColor, fontWeight: txtBold ? 'bold' : 'normal', fontStyle: txtItalic ? 'italic' : 'normal', fontFamily: txtFont.value, textAlign: 'center', textShadowColor: txtShadow ? 'rgba(0,0,0,0.5)' : 'transparent', textShadowOffset: { width: 2, height: 2 }, textShadowRadius: txtShadow ? 4 : 0 }}>
                {txtInput || 'Preview'}
              </RNText>
            </View>
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={() => { setTextModal(false); setTxtInput(''); }}>
                <Text style={styles.modalCancelLabel}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalConfirmBtn} onPress={confirmAddText}>
                <Text style={styles.modalConfirmLabel}>Add to Canvas</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#060A12' },

  // Header
  header: { height: 54, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, borderBottomWidth: 1, borderBottomColor: '#1E293B' },
  hBtn:    { padding: 8 },
  hBtnTxt: { color: '#F8FAFC', fontSize: 18, fontWeight: '700' },
  hTitle:  { fontSize: 17, color: '#F8FAFC', fontWeight: '800', flex: 1, textAlign: 'center' },
  hRight:  { flexDirection: 'row', alignItems: 'center' },
  dim:     { opacity: 0.3 },
  exportBtn:   { backgroundColor: '#38BDF8', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 18, marginLeft: 6 },
  exportLabel: { color: '#0F172A', fontWeight: '800', fontSize: 13 },

  // Canvas
  canvasArea:   { alignItems: 'center', paddingTop: 10 },
  canvas:       { backgroundColor: '#0F172A', borderRadius: 10, overflow: 'hidden', elevation: 8 },
  presetStrip:  { marginTop: 8, maxHeight: 34 },
  presetChip:       { paddingHorizontal: 10, paddingVertical: 5, backgroundColor: '#1E293B', borderRadius: 16, borderWidth: 1, borderColor: '#334155' },
  presetChipActive: { borderColor: '#38BDF8', backgroundColor: '#0C1A2E' },
  presetChipLabel:  { color: '#94A3B8', fontSize: 11, fontWeight: '700' },

  // Deck
  deck:      { flex: 1, borderTopWidth: 1, borderTopColor: '#1E293B', backgroundColor: '#080C14' },
  panelBody: { flex: 1 },
  panel:     { padding: 12 },
  sectionTitle: { color: '#64748B', fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 6, marginTop: 8 },
  rowBtns:   { flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginBottom: 6 },

  // Toggle
  toggleBtn:        { paddingHorizontal: 12, paddingVertical: 6, backgroundColor: '#1E293B', borderRadius: 8, borderWidth: 1, borderColor: '#334155' },
  toggleActive:     { backgroundColor: '#0C1A2E', borderColor: '#38BDF8' },
  toggleLabel:      { color: '#64748B', fontSize: 12, fontWeight: '700' },
  toggleLabelActive:{ color: '#38BDF8' },

  // Gradient picker
  gradCard:       { alignItems: 'center', gap: 4 },
  gradCardActive: { opacity: 1 },
  gradSwatch:     { width: 40, height: 40, borderRadius: 8, overflow: 'hidden', justifyContent: 'flex-end' },
  gradSwatch2:    { width: '100%', height: '50%' },
  gradLabel:      { color: '#64748B', fontSize: 10, fontWeight: '600' },

  // Shape grid
  shapeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  shapeCell: { paddingHorizontal: 10, paddingVertical: 8, backgroundColor: '#0F172A', borderRadius: 10, borderWidth: 1, borderColor: '#1E293B', minWidth: 90, alignItems: 'center' },
  shapeCellLabel: { color: '#94A3B8', fontSize: 13, fontWeight: '600' },

  // Text / image buttons
  addTextBtn:      { backgroundColor: '#38BDF8', borderRadius: 10, paddingVertical: 11, alignItems: 'center', marginTop: 6 },
  addTextBtnLabel: { color: '#0F172A', fontWeight: '800', fontSize: 15 },

  // Emoji
  emojiGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  emojiCell: { width: (SW - 32 - 48) / 8, aspectRatio: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#0F172A', borderRadius: 8 },
  emojiTxt:  { fontSize: 26 },

  // Props
  propsHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  propsTitle:  { color: '#38BDF8', fontSize: 11, fontWeight: '800', letterSpacing: 1 },
  orderBtn:    { paddingHorizontal: 10, paddingVertical: 5, backgroundColor: '#1E293B', borderRadius: 8 },
  orderBtnTxt: { color: '#94A3B8', fontSize: 11, fontWeight: '700' },
  inlineTxtInput: { backgroundColor: '#1E293B', color: '#F8FAFC', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, fontSize: 15, marginBottom: 6, minHeight: 46 },
  deleteBtn:      { backgroundColor: '#7F1D1D', borderRadius: 8, paddingVertical: 9, alignItems: 'center', marginTop: 10 },
  deleteBtnLabel: { color: '#FCA5A5', fontWeight: '700', fontSize: 13 },

  // Tab strip
  tabStrip: { height: 52, flexDirection: 'row', borderTopWidth: 1, borderTopColor: '#1E293B', backgroundColor: '#060A12' },
  tabItem:  { flex: 1, justifyContent: 'center', alignItems: 'center' },
  tabLabel: { fontSize: 9, color: '#475569', fontWeight: '700', textAlign: 'center' },
  tabLabelActive: { color: '#38BDF8' },

  // Modal
  modalBg:   { flex: 1, backgroundColor: 'rgba(0,0,0,0.78)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: '#0D1117', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 18, borderTopWidth: 1, borderColor: '#1E293B', maxHeight: '90%' },
  modalTitle:{ color: '#F8FAFC', fontSize: 18, fontWeight: '800', marginBottom: 10 },
  modalInput:{ backgroundColor: '#1E293B', color: '#F8FAFC', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 9, fontSize: 16, minHeight: 54, textAlignVertical: 'top', marginBottom: 8 },
  textPreviewBox: { backgroundColor: '#000', borderRadius: 8, padding: 12, alignItems: 'center', justifyContent: 'center', minHeight: 56, marginVertical: 8 },
  modalActions:     { flexDirection: 'row', gap: 10, marginTop: 10 },
  modalCancelBtn:   { flex: 1, paddingVertical: 11, backgroundColor: '#1E293B', borderRadius: 10, alignItems: 'center' },
  modalCancelLabel: { color: '#94A3B8', fontWeight: '700' },
  modalConfirmBtn:   { flex: 2, paddingVertical: 11, backgroundColor: '#38BDF8', borderRadius: 10, alignItems: 'center' },
  modalConfirmLabel: { color: '#0F172A', fontWeight: '800', fontSize: 15 },
});
