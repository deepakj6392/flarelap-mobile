/**
 * MagicToolEditor.tsx
 *
 * Features:
 *  - Pick image from device gallery (background canvas)
 *  - Freehand drawing with colour, stroke-width, eraser
 *  - Pixabay sticker / image search (funny stickers & clipart)
 *  - Draggable, resizable, rotatable stickers on canvas
 *  - Emoji sticker quick panel
 *  - Export via react-native-view-shot → Share
 *  - Undo / Redo for drawing strokes
 */
import React, {
  useState,
  useRef,
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
  ActivityIndicator,
  Modal,
  TextInput as RNTextInput,
  FlatList,
  Platform,
} from 'react-native';
import Share from 'react-native-share';
import { Text, Title } from 'react-native-paper';
import Svg, { Path, Circle } from 'react-native-svg';
import { launchImageLibrary } from 'react-native-image-picker';
import ViewShot, { captureRef } from 'react-native-view-shot';
import { PIXABAY_API_KEY } from '../../constants/config';
import { SafeAreaView } from 'react-native-safe-area-context';

// ─── Canvas ────────────────────────────────────────────────────────────────────
const { width: screenWidth } = Dimensions.get('window');
const CANVAS_W = screenWidth - 32;
const CANVAS_H = (CANVAS_W * 4) / 3;   // 4:3 portrait canvas

// ─── Pixabay ──────────────────────────────────────────────────────────────────
// Using the free demo key — replace with your own from pixabay.com/api/docs/
const PIXABAY_KEY = PIXABAY_API_KEY;
const PIXABAY_BASE = 'https://pixabay.com/api/';

// ─── Preset Emoji Stickers ────────────────────────────────────────────────────
const EMOJI_STICKERS = [
  '😂','🤣','😍','🥳','😎','🤩','😜','🤪',
  '🥴','🤯','😱','😤','🎉','🎊','🔥','💥',
  '⭐','💫','✨','💯','❤️','💕','👏','🙌',
  '👑','💎','🌈','🦄','🍕','🍔','🎸','🎮',
  '🚀','🌟','😈','👻','💀','🎭','🤖','👾',
];

// ─── Preset Draw Colors ───────────────────────────────────────────────────────
const DRAW_COLORS = [
  '#FFFFFF','#000000','#EF4444','#F97316','#FBBF24',
  '#34D399','#22D3EE','#60A5FA','#A78BFA','#F472B6',
  '#FB7185','#4ADE80','#38BDF8','#E879F9','#FDE68A',
];

// ─── Types ────────────────────────────────────────────────────────────────────
interface DrawStroke {
  id: string;
  points: string;     // SVG path d-attribute
  color: string;
  width: number;
  opacity: number;
  isEraser: boolean;
}

interface Sticker {
  id: string;
  type: 'image' | 'emoji';
  uri?: string;
  emoji?: string;
  x: number;
  y: number;
  size: number;
  rotation: number;
  opacity: number;
}

// ─── SVG Icon Helpers ─────────────────────────────────────────────────────────
const Icon = {
  Close: ({ s = 18, c = '#F8FAFC' }: { s?: number; c?: string }) => (
    <Svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2.5" strokeLinecap="round">
      <Path d="M18 6L6 18M6 6l12 12" />
    </Svg>
  ),
  Back: ({ s = 20, c = '#F8FAFC' }: { s?: number; c?: string }) => (
    <Svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <Path d="M19 12H5M12 19l-7-7 7-7" />
    </Svg>
  ),
  Check: ({ s = 18, c = '#F8FAFC' }: { s?: number; c?: string }) => (
    <Svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2.5" strokeLinecap="round">
      <Path d="M20 6L9 17l-5-5" />
    </Svg>
  ),
  Undo: ({ s = 18, c = '#F8FAFC' }: { s?: number; c?: string }) => (
    <Svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round">
      <Path d="M3 7v6h6M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13" />
    </Svg>
  ),
  Redo: ({ s = 18, c = '#F8FAFC' }: { s?: number; c?: string }) => (
    <Svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round">
      <Path d="M21 7v6h-6M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3l3 2.7" />
    </Svg>
  ),
  Pen: ({ s = 20, c = '#94A3B8' }: { s?: number; c?: string }) => (
    <Svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round">
      <Path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
    </Svg>
  ),
  Eraser: ({ s = 20, c = '#94A3B8' }: { s?: number; c?: string }) => (
    <Svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round">
      <Path d="M20 20H7L3 16l13-13 6 6-2 2M6 20l4-4" />
    </Svg>
  ),
  Image: ({ s = 20, c = '#94A3B8' }: { s?: number; c?: string }) => (
    <Svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round">
      <Path d="M21 9v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h10" />
      <Circle cx="8.5" cy="8.5" r="1.5" fill={c} stroke="none" />
      <Path d="M21 15l-5-5L5 21" />
    </Svg>
  ),
  Sticker: ({ s = 20, c = '#94A3B8' }: { s?: number; c?: string }) => (
    <Svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round">
      <Circle cx="12" cy="12" r="10" />
      <Path d="M8 14s1.5 2 4 2 4-2 4-2M9 9h.01M15 9h.01" />
    </Svg>
  ),
  Search: ({ s = 18, c = '#94A3B8' }: { s?: number; c?: string }) => (
    <Svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round">
      <Circle cx="11" cy="11" r="8" />
      <Path d="M21 21l-4.35-4.35" />
    </Svg>
  ),
  Share: ({ s = 20, c = '#94A3B8' }: { s?: number; c?: string }) => (
    <Svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round">
      <Path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8M16 6l-4-4-4 4M12 2v13" />
    </Svg>
  ),
  Trash: ({ s = 16, c = '#EF4444' }: { s?: number; c?: string }) => (
    <Svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round">
      <Path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </Svg>
  ),
  Rotate: ({ s = 14, c = '#F8FAFC' }: { s?: number; c?: string }) => (
    <Svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2.5" strokeLinecap="round">
      <Path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38" />
    </Svg>
  ),
};

// ─── Movable Sticker ──────────────────────────────────────────────────────────
interface StickerProps {
  item: Sticker;
  selected: boolean;
  onSelect: (id: string) => void;
  onUpdate: (id: string, patch: Partial<Sticker>) => void;
  onDelete: (id: string) => void;
}

function StickerLayer({ item, selected, onSelect, onUpdate, onDelete }: StickerProps) {
  const startPos   = useRef({ x: 0, y: 0 });
  const startSize  = useRef(0);
  const startRot   = useRef(0);

  const dragPR = useRef(PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: () => { onSelect(item.id); startPos.current = { x: item.x, y: item.y }; },
    onPanResponderMove: (_, g) => onUpdate(item.id, { x: startPos.current.x + g.dx, y: startPos.current.y + g.dy }),
  })).current;

  const resizePR = useRef(PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: (e) => { e.stopPropagation(); startSize.current = item.size; },
    onPanResponderMove: (e, g) => { e.stopPropagation(); onUpdate(item.id, { size: Math.max(30, startSize.current + (g.dx + g.dy) / 2) }); },
  })).current;

  const rotatePR = useRef(PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: (e) => { e.stopPropagation(); startRot.current = item.rotation; },
    onPanResponderMove: (e, g) => { e.stopPropagation(); let r = (startRot.current + g.dx * 0.8) % 360; if (r < 0) r += 360; onUpdate(item.id, { rotation: r }); },
  })).current;

  return (
    <View style={[sk.wrap, { left: item.x, top: item.y, width: item.size, height: item.size, transform: [{ rotate: `${item.rotation}deg` }], zIndex: selected ? 999 : 10 }]}>
      <View style={sk.inner} {...dragPR.panHandlers}>
        {item.type === 'emoji' ? (
          <RNText style={{ fontSize: item.size * 0.72, textAlign: 'center', opacity: item.opacity }}>{item.emoji}</RNText>
        ) : (
          <RNImage source={{ uri: item.uri }} style={{ width: '100%', height: '100%', opacity: item.opacity }} resizeMode="contain" />
        )}
      </View>
      {selected && (
        <>
          <View style={sk.outline} pointerEvents="none" />
          {/* Rotate top-centre */}
          <View style={[sk.handle, sk.rotH, { left: item.size / 2 - 13, top: -30 }]} {...rotatePR.panHandlers}>
            <Icon.Rotate s={11} />
          </View>
          {/* Delete top-right */}
          <TouchableOpacity style={[sk.handle, { backgroundColor: '#EF4444', right: -12, top: -12 }]} onPress={() => onDelete(item.id)}>
            <Icon.Close s={10} />
          </TouchableOpacity>
          {/* Resize bottom-right */}
          <View style={[sk.handle, { backgroundColor: '#10B981', right: -10, bottom: -10 }]} {...resizePR.panHandlers}>
            <View style={sk.resDot} />
          </View>
        </>
      )}
    </View>
  );
}

const sk = StyleSheet.create({
  wrap:   { position: 'absolute' },
  inner:  { width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' },
  outline:{ ...StyleSheet.absoluteFillObject, borderWidth: 1.5, borderColor: '#df103f', borderStyle: 'dashed' },
  handle: { position: 'absolute', width: 26, height: 26, borderRadius: 13, justifyContent: 'center', alignItems: 'center', elevation: 6 },
  rotH:   { backgroundColor: '#3B82F6' },
  resDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#fff' },
});

// ─── Slider ───────────────────────────────────────────────────────────────────
function Slider({ label, value, min, max, step = 1, onChange }: { label: string; value: number; min: number; max: number; step?: number; onChange: (v: number) => void }) {
  const W = screenWidth - 96;
  const pr = useRef(PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: (e) => apply(e.nativeEvent.locationX),
    onPanResponderMove: (e) => apply(e.nativeEvent.locationX),
  })).current;
  const apply = (lx: number) => {
    let r = Math.max(0, Math.min(1, lx / W));
    let v = min + r * (max - min);
    v = Math.round(v / step) * step;
    onChange(Math.max(min, Math.min(max, v)));
  };
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <View style={{ marginVertical: 5, paddingHorizontal: 8 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 3 }}>
        <Text style={{ fontSize: 11, color: '#94A3B8', fontWeight: '600' }}>{label}</Text>
        <Text style={{ fontSize: 11, color: '#F8FAFC', fontWeight: '700' }}>{value.toFixed(step < 1 ? 1 : 0)}</Text>
      </View>
      <View style={{ height: 22, justifyContent: 'center', width: W }} {...pr.panHandlers}>
        <View style={{ height: 4, borderRadius: 2, backgroundColor: '#334155' }} />
        <View style={{ height: 4, borderRadius: 2, backgroundColor: '#df103f', position: 'absolute', left: 0, width: `${pct}%` }} />
        <View style={{ position: 'absolute', width: 16, height: 16, borderRadius: 8, backgroundColor: '#df103f', borderWidth: 2, borderColor: '#fff', left: `${pct}%`, transform: [{ translateX: -8 }] }} />
      </View>
    </View>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function MagicToolEditor({ navigation, route }: { navigation?: any; route?: any }) {

  // ── Canvas image ──
  const [bgUri, setBgUri] = useState<string | null>(null);

  // ── Drawing ──
  const [strokes, setStrokes]         = useState<DrawStroke[]>([]);
  const [redoStack, setRedoStack]     = useState<DrawStroke[]>([]);
  const currentPoints                 = useRef<{ x: number; y: number }[]>([]);
  const currentStrokeId               = useRef('');

  // ── Draw settings ──
  const [drawColor, setDrawColor]     = useState('#EF4444');
  const [drawWidth, setDrawWidth]     = useState(5);
  const [drawOpacity, setDrawOpacity] = useState(1.0);
  const [isEraser, setIsEraser]       = useState(false);
  const [drawMode, setDrawMode]       = useState(true);  // true = draw, false = sticker mode

  // ── Stickers ──
  const [stickers, setStickers]       = useState<Sticker[]>([]);
  const [selectedSticker, setSelected] = useState<string | null>(null);
  const nextId                         = useRef(1);

  // ── Active bottom tab ──
  const [activeTab, setActiveTab]     = useState<'draw' | 'stickers' | 'emoji'>('draw');

  // ── Pixabay search ──
  const [searchQuery, setSearchQuery]   = useState('funny sticker');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching]         = useState(false);
  const [stickerPanelOpen, setStickerPanel] = useState(false);

  // ── Export ──
  const canvasRef  = useRef<any>(null);
  const [exporting, setExporting] = useState(false);

  // ── Drawing PanResponder ──
  const drawPR = useRef(PanResponder.create({
    onStartShouldSetPanResponder: () => drawMode,
    onMoveShouldSetPanResponder: () => drawMode,
    onPanResponderGrant: (e) => {
      if (!drawMode) return;
      const { locationX: x, locationY: y } = e.nativeEvent;
      currentPoints.current = [{ x, y }];
      currentStrokeId.current = `s_${Date.now()}`;
      setRedoStack([]); // clear redo on new stroke
    },
    onPanResponderMove: (e) => {
      if (!drawMode) return;
      const { locationX: x, locationY: y } = e.nativeEvent;
      currentPoints.current = [...currentPoints.current, { x, y }];
      const d = pointsToPath(currentPoints.current);
      setStrokes(prev => {
        const existing = prev.findIndex(s => s.id === currentStrokeId.current);
        const stroke: DrawStroke = { id: currentStrokeId.current, points: d, color: isEraser ? '#TRANSPARENT_ERASE' : drawColor, width: isEraser ? drawWidth * 3 : drawWidth, opacity: drawOpacity, isEraser };
        if (existing >= 0) { const n = [...prev]; n[existing] = stroke; return n; }
        return [...prev, stroke];
      });
    },
    onPanResponderRelease: () => { currentPoints.current = []; },
  })).current;

  const pointsToPath = (pts: { x: number; y: number }[]) => {
    if (pts.length === 0) return '';
    return pts.reduce((acc, p, i) => i === 0 ? `M${p.x.toFixed(1)},${p.y.toFixed(1)}` : `${acc} L${p.x.toFixed(1)},${p.y.toFixed(1)}`, '');
  };

  // ── Gallery pick ──
  const pickBg = async () => {
    const res = await launchImageLibrary({ mediaType: 'photo', quality: 1 });
    if (res.assets?.[0]?.uri) setBgUri(res.assets[0].uri);
  };

  // ── Undo / Redo ──
  const undo = () => {
    if (strokes.length === 0) return;
    const last = strokes[strokes.length - 1];
    setRedoStack(r => [last, ...r]);
    setStrokes(s => s.slice(0, -1));
  };
  const redo = () => {
    if (redoStack.length === 0) return;
    const next = redoStack[0];
    setStrokes(s => [...s, next]);
    setRedoStack(r => r.slice(1));
  };

  // ── Pixabay search ──
  const searchPixabay = async (q: string) => {
    setSearching(true);
    setSearchResults([]);
    try {
      const url = `${PIXABAY_BASE}?key=${PIXABAY_KEY}&q=${encodeURIComponent(q)}&image_type=clipart&per_page=40&safesearch=true&lang=en`;
      const resp = await fetch(url);
      const json = await resp.json();
      setSearchResults(json.hits || []);
    } catch {
      Alert.alert('Search Error', 'Could not connect to Pixabay. Check your internet connection.');
    } finally {
      setSearching(false);
    }
  };

  // ── Add Pixabay sticker ──
  const addPixabaySticker = (uri: string) => {
    const id = `pk_${nextId.current++}`;
    setStickers(s => [...s, {
      id, type: 'image', uri,
      x: CANVAS_W / 2 - 60, y: CANVAS_H / 2 - 60,
      size: 120, rotation: 0, opacity: 1,
    }]);
    setSelected(id);
    setDrawMode(false);
    setStickerPanel(false);
  };

  // ── Add emoji sticker ──
  const addEmoji = (emoji: string) => {
    const id = `em_${nextId.current++}`;
    setStickers(s => [...s, {
      id, type: 'emoji', emoji,
      x: CANVAS_W / 2 - 50, y: CANVAS_H / 2 - 50,
      size: 80, rotation: 0, opacity: 1,
    }]);
    setSelected(id);
    setDrawMode(false);
  };

  const updateSticker = (id: string, patch: Partial<Sticker>) =>
    setStickers(prev => prev.map(s => s.id === id ? { ...s, ...patch } : s));

  const deleteSticker = (id: string) => {
    setStickers(s => s.filter(x => x.id !== id));
    setSelected(null);
  };

  // ── Export ──
  const handleExport = async () => {
    if (!canvasRef.current) return;
    setExporting(true);
    try {
      const uri = await captureRef(canvasRef, { format: 'png', quality: 1 });
      await Share.open({
        url: uri,
        type: 'image/png',
        message: 'Created with Flarelap Magic Tool ✨',
      });
    } catch (e: any) {
      Alert.alert('Export Failed', e?.message || 'Unknown error');
    } finally {
      setExporting(false);
    }
  };

  // ── Clear all ──
  const clearAll = () => {
    Alert.alert('Clear Canvas', 'Remove all drawings and stickers?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Clear', style: 'destructive', onPress: () => { setStrokes([]); setStickers([]); setRedoStack([]); setSelected(null); } },
    ]);
  };

  const selectedStickerItem = stickers.find(s => s.id === selectedSticker) ?? null;

  // ── Quick-tag suggestions for Pixabay ──
  const QUICK_TAGS = ['funny sticker', 'cartoon', 'emoji clipart', 'cute animals', 'star burst', 'speech bubble', 'rainbow', 'fire', 'heart', 'confetti'];

  return (
    <SafeAreaView style={styles.safe}>

      {/* ── Header ── */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation?.goBack()} style={styles.hBtn}>
          <Icon.Back s={20} />
        </TouchableOpacity>
        <Title style={styles.hTitle}>✨ Magic Tool</Title>
        <View style={styles.hRight}>
          <TouchableOpacity onPress={undo} disabled={strokes.length === 0} style={[styles.hBtn, strokes.length === 0 && styles.dim]}>
            <Icon.Undo s={18} c={strokes.length === 0 ? '#475569' : '#F8FAFC'} />
          </TouchableOpacity>
          <TouchableOpacity onPress={redo} disabled={redoStack.length === 0} style={[styles.hBtn, redoStack.length === 0 && styles.dim]}>
            <Icon.Redo s={18} c={redoStack.length === 0 ? '#475569' : '#F8FAFC'} />
          </TouchableOpacity>
          <TouchableOpacity onPress={clearAll} style={styles.hBtn}>
            <Icon.Trash s={18} c="#EF4444" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleExport}
            disabled={exporting}
            style={[styles.exportBtn, exporting && styles.dim]}
          >
            {exporting
              ? <ActivityIndicator size="small" color="#fff" />
              : <Icon.Share s={15} c="#fff" />}
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Canvas ── */}
      <View style={styles.canvasWrap}>
        <ViewShot ref={canvasRef} options={{ format: 'png', quality: 1 }} style={[styles.canvas, { width: CANVAS_W, height: CANVAS_H }]}>

          {/* Background image or gradient placeholder */}
          {bgUri
            ? <RNImage source={{ uri: bgUri }} style={StyleSheet.absoluteFillObject} resizeMode="cover" />
            : <View style={[StyleSheet.absoluteFillObject, styles.bgPlaceholder]} />
          }

          {/* Drawing layer */}
          <View style={StyleSheet.absoluteFillObject} {...drawPR.panHandlers} pointerEvents={drawMode ? 'box-only' : 'none'}>
            <Svg width={CANVAS_W} height={CANVAS_H} style={StyleSheet.absoluteFillObject}>
              {strokes.map(stroke => (
                <Path
                  key={stroke.id}
                  d={stroke.points}
                  stroke={stroke.isEraser ? '#000000' : stroke.color}
                  strokeWidth={stroke.width}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                  opacity={stroke.isEraser ? 1 : stroke.opacity}
                  // For eraser: use destination-out in a compositing layer
                  // We approximate by drawing in canvas bg color
                />
              ))}
            </Svg>
          </View>

          {/* Sticker deselect layer */}
          {!drawMode && (
            <TouchableOpacity
              activeOpacity={1}
              style={[StyleSheet.absoluteFillObject, { zIndex: 5 }]}
              onPress={() => setSelected(null)}
            />
          )}

          {/* Stickers */}
          <View style={StyleSheet.absoluteFillObject} pointerEvents="box-none">
            {stickers.map(s => (
              <StickerLayer
                key={s.id}
                item={s}
                selected={selectedSticker === s.id}
                onSelect={(id) => { setSelected(id); setDrawMode(false); }}
                onUpdate={updateSticker}
                onDelete={deleteSticker}
              />
            ))}
          </View>
        </ViewShot>

        {/* Pick bg image floating button */}
        <TouchableOpacity style={styles.bgPickBtn} onPress={pickBg}>
          <Icon.Image s={16} c="#fff" />
          <Text style={styles.bgPickLabel}>{bgUri ? 'Change BG' : 'Add Photo'}</Text>
        </TouchableOpacity>
      </View>

      {/* ── Bottom Deck ── */}
      <View style={styles.deck}>

        {/* ── Mode Toggle Strip ── */}
        <View style={styles.modeStrip}>
          <TouchableOpacity
            style={[styles.modeBtn, drawMode && !isEraser && styles.modeBtnActive]}
            onPress={() => { setDrawMode(true); setIsEraser(false); setActiveTab('draw'); setSelected(null); }}
          >
            <Icon.Pen s={18} c={drawMode && !isEraser ? '#df103f' : '#94A3B8'} />
            <Text style={[styles.modeLabel, drawMode && !isEraser && styles.modeLabelActive]}>Draw</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.modeBtn, drawMode && isEraser && styles.modeBtnActive]}
            onPress={() => { setDrawMode(true); setIsEraser(true); setActiveTab('draw'); setSelected(null); }}
          >
            <Icon.Eraser s={18} c={drawMode && isEraser ? '#df103f' : '#94A3B8'} />
            <Text style={[styles.modeLabel, drawMode && isEraser && styles.modeLabelActive]}>Erase</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.modeBtn, !drawMode && activeTab === 'stickers' && styles.modeBtnActive]}
            onPress={() => { setDrawMode(false); setActiveTab('stickers'); setStickerPanel(true); }}
          >
            <Icon.Search s={18} c={!drawMode && activeTab === 'stickers' ? '#df103f' : '#94A3B8'} />
            <Text style={[styles.modeLabel, !drawMode && activeTab === 'stickers' && styles.modeLabelActive]}>Stickers</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.modeBtn, !drawMode && activeTab === 'emoji' && styles.modeBtnActive]}
            onPress={() => { setDrawMode(false); setActiveTab('emoji'); }}
          >
            <Icon.Sticker s={18} c={!drawMode && activeTab === 'emoji' ? '#df103f' : '#94A3B8'} />
            <Text style={[styles.modeLabel, !drawMode && activeTab === 'emoji' && styles.modeLabelActive]}>Emoji</Text>
          </TouchableOpacity>
        </View>

        {/* ── Panel Content ── */}
        <ScrollView style={styles.panelBody} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

          {/* DRAW panel */}
          {activeTab === 'draw' && (
            <View style={styles.panel}>
              {!isEraser && (
                <>
                  <Text style={styles.panelTitle}>Brush Color</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.colorRow}>
                    {DRAW_COLORS.map(c => (
                      <TouchableOpacity key={c} onPress={() => setDrawColor(c)}
                        style={[styles.colorDot, { backgroundColor: c }, drawColor === c && styles.colorDotActive]} />
                    ))}
                  </ScrollView>
                </>
              )}
              <Slider label={isEraser ? 'Eraser Size' : 'Brush Size'} value={drawWidth} min={1} max={40} step={1} onChange={setDrawWidth} />
              {!isEraser && (
                <Slider label="Opacity" value={drawOpacity} min={0.1} max={1} step={0.05} onChange={setDrawOpacity} />
              )}
              {!isEraser && (
                <View style={styles.previewRow}>
                  <Text style={styles.panelTitle}>Preview</Text>
                  <View style={styles.brushPreview}>
                    <View style={[styles.brushDot, { width: drawWidth * 2, height: drawWidth * 2, borderRadius: drawWidth, backgroundColor: drawColor, opacity: drawOpacity }]} />
                  </View>
                </View>
              )}
            </View>
          )}

          {/* STICKERS panel — shows selected sticker controls */}
          {activeTab === 'stickers' && selectedStickerItem && (
            <View style={styles.panel}>
              <Text style={styles.panelTitle}>Sticker Options</Text>
              <Slider label="Size" value={selectedStickerItem.size} min={30} max={300} step={1} onChange={v => updateSticker(selectedStickerItem.id, { size: v })} />
              <Slider label="Rotation" value={selectedStickerItem.rotation} min={0} max={360} step={1} onChange={v => updateSticker(selectedStickerItem.id, { rotation: v })} />
              <Slider label="Opacity" value={selectedStickerItem.opacity} min={0.1} max={1} step={0.05} onChange={v => updateSticker(selectedStickerItem.id, { opacity: v })} />
              <TouchableOpacity style={styles.deleteBtn} onPress={() => deleteSticker(selectedStickerItem.id)}>
                <Icon.Trash s={14} c="#fff" />
                <Text style={styles.deleteBtnLabel}>Remove Sticker</Text>
              </TouchableOpacity>
            </View>
          )}

          {activeTab === 'stickers' && !selectedStickerItem && (
            <View style={styles.panel}>
              <Text style={styles.panelTitle}>Tap a sticker on canvas to edit, or search for more stickers</Text>
              <TouchableOpacity style={styles.openSearchBtn} onPress={() => setStickerPanel(true)}>
                <Icon.Search s={16} c="#fff" />
                <Text style={styles.srcBtnLabel}>Search Pixabay Stickers</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* EMOJI panel */}
          {activeTab === 'emoji' && (
            <View style={styles.panel}>
              <Text style={styles.panelTitle}>Tap emoji to add to canvas</Text>
              {selectedStickerItem?.type === 'emoji' && (
                <>
                  <Slider label="Size" value={selectedStickerItem.size} min={30} max={200} step={1} onChange={v => updateSticker(selectedStickerItem.id, { size: v })} />
                  <Slider label="Opacity" value={selectedStickerItem.opacity} min={0.1} max={1} step={0.05} onChange={v => updateSticker(selectedStickerItem.id, { opacity: v })} />
                  <TouchableOpacity style={styles.deleteBtn} onPress={() => deleteSticker(selectedStickerItem.id)}>
                    <Icon.Trash s={14} c="#fff" />
                    <Text style={styles.deleteBtnLabel}>Remove Emoji</Text>
                  </TouchableOpacity>
                </>
              )}
              <View style={styles.emojiGrid}>
                {EMOJI_STICKERS.map(em => (
                  <TouchableOpacity key={em} onPress={() => addEmoji(em)} style={styles.emojiCell}>
                    <RNText style={styles.emojiText}>{em}</RNText>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

        </ScrollView>
      </View>

      {/* ── Pixabay Sticker Search Modal ── */}
      <Modal visible={stickerPanelOpen} animationType="slide" transparent onRequestClose={() => setStickerPanel(false)}>
        <View style={styles.modalBg}>
          <View style={styles.modalCard}>

            {/* Modal header */}
            <View style={styles.modalHeader}>
              <Title style={styles.modalTitle}>🎨 Pixabay Stickers</Title>
              <TouchableOpacity onPress={() => setStickerPanel(false)} style={styles.hBtn}>
                <Icon.Close s={20} />
              </TouchableOpacity>
            </View>

            {/* Search bar */}
            <View style={styles.searchBar}>
              <Icon.Search s={17} c="#64748B" />
              <RNTextInput
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Search funny stickers..."
                placeholderTextColor="#475569"
                style={styles.searchInput}
                returnKeyType="search"
                onSubmitEditing={() => searchPixabay(searchQuery)}
                autoFocus
              />
              <TouchableOpacity onPress={() => searchPixabay(searchQuery)} style={styles.searchGoBtn}>
                <Icon.Check s={15} />
              </TouchableOpacity>
            </View>

            {/* Quick-tag chips */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tagRow}>
              {QUICK_TAGS.map(tag => (
                <TouchableOpacity key={tag} style={styles.tagChip} onPress={() => { setSearchQuery(tag); searchPixabay(tag); }}>
                  <Text style={styles.tagLabel}>{tag}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Results */}
            {searching ? (
              <View style={styles.loader}>
                <ActivityIndicator size="large" color="#df103f" />
                <Text style={styles.loadingText}>Searching Pixabay…</Text>
              </View>
            ) : searchResults.length === 0 ? (
              <View style={styles.loader}>
                <RNText style={{ fontSize: 48 }}>🔍</RNText>
                <Text style={styles.loadingText}>Search for stickers above!</Text>
                <Text style={styles.loadingSubText}>Try: "funny sticker", "cartoon", "emoji clipart"</Text>
              </View>
            ) : (
              <FlatList
                data={searchResults}
                keyExtractor={item => String(item.id)}
                numColumns={3}
                contentContainerStyle={styles.resultsGrid}
                renderItem={({ item }) => (
                  <TouchableOpacity style={styles.resultItem} onPress={() => addPixabaySticker(item.webformatURL)}>
                    <RNImage source={{ uri: item.previewURL }} style={styles.resultImg} resizeMode="contain" />
                  </TouchableOpacity>
                )}
              />
            )}

            {/* Attribution */}
            <Text style={styles.attribution}>Images from Pixabay · Free for commercial use</Text>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#060A12' },

  // Header
  header: { height: 54, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, borderBottomWidth: 1, borderBottomColor: '#1E293B' },
  hBtn:  { padding: 8 },
  hTitle:{ fontSize: 18, color: '#F8FAFC', fontWeight: '800' },
  hRight:{ flexDirection: 'row', alignItems: 'center' },
  dim:   { opacity: 0.3 },
  exportBtn: { backgroundColor: '#df103f', width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginLeft: 8 },

  // Canvas
  canvasWrap: { alignItems: 'center', paddingHorizontal: 16, paddingTop: 10, position: 'relative' },
  canvas: { backgroundColor: '#0F172A', borderRadius: 12, overflow: 'hidden', position: 'relative' },
  bgPlaceholder: {
    backgroundColor: '#0F172A',
    // subtle grid pattern approximated via overlapping lines
  },
  bgPickBtn: { position: 'absolute', bottom: 10, right: 26, flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.65)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20, gap: 5 },
  bgPickLabel: { color: '#fff', fontSize: 12, fontWeight: '700' },

  // Deck
  deck: { flex: 1, borderTopWidth: 1, borderTopColor: '#1E293B', backgroundColor: '#080C14' },

  // Mode strip
  modeStrip: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#1E293B' },
  modeBtn: { flex: 1, paddingVertical: 8, alignItems: 'center', justifyContent: 'center', gap: 3 },
  modeBtnActive: { borderBottomWidth: 2, borderBottomColor: '#df103f' },
  modeLabel: { fontSize: 10, color: '#475569', fontWeight: '700' },
  modeLabelActive: { color: '#df103f' },

  // Panel
  panelBody: { flex: 1 },
  panel: { padding: 14 },
  panelTitle: { color: '#64748B', fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8 },

  // Color row
  colorRow: { paddingVertical: 4, gap: 8, paddingHorizontal: 2 },
  colorDot: { width: 30, height: 30, borderRadius: 15, borderWidth: 2, borderColor: 'transparent' },
  colorDotActive: { borderColor: '#fff', transform: [{ scale: 1.2 }] },

  // Brush preview
  previewRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 4 },
  brushPreview: { flex: 1, alignItems: 'center', justifyContent: 'center', height: 40, backgroundColor: '#0F172A', borderRadius: 8 },
  brushDot: {},

  // Sticker
  openSearchBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#df103f', paddingVertical: 11, borderRadius: 10, gap: 8, marginTop: 6 },
  srcBtnLabel: { color: '#fff', fontWeight: '700', fontSize: 14 },

  // Selected sticker editor
  deleteBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#7F1D1D', borderRadius: 8, paddingVertical: 8, marginTop: 8, gap: 6 },
  deleteBtnLabel: { color: '#FCA5A5', fontWeight: '700', fontSize: 13 },

  // Emoji grid
  emojiGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 4 },
  emojiCell: { width: (screenWidth - 32 - 48) / 8, aspectRatio: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#0F172A', borderRadius: 8 },
  emojiText: { fontSize: 24 },

  // Modal
  modalBg:   { flex: 1, backgroundColor: 'rgba(0,0,0,0.80)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: '#0D1117', borderTopLeftRadius: 22, borderTopRightRadius: 22, maxHeight: '88%', paddingBottom: Platform.OS === 'ios' ? 24 : 8 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 },
  modalTitle: { color: '#F8FAFC', fontSize: 18, fontWeight: '800' },

  // Search bar
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1E293B', borderRadius: 12, marginHorizontal: 14, marginBottom: 10, paddingHorizontal: 10, height: 44 },
  searchInput: { flex: 1, color: '#F8FAFC', fontSize: 15, paddingHorizontal: 8 },
  searchGoBtn: { backgroundColor: '#df103f', width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },

  // Tags
  tagRow: { paddingHorizontal: 14, paddingBottom: 10, gap: 8 },
  tagChip: { backgroundColor: '#1E293B', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5, borderWidth: 1, borderColor: '#334155' },
  tagLabel: { color: '#94A3B8', fontSize: 12, fontWeight: '600' },

  // Results
  loader: { height: 200, justifyContent: 'center', alignItems: 'center', gap: 8 },
  loadingText: { color: '#64748B', fontSize: 14, fontWeight: '600' },
  loadingSubText: { color: '#475569', fontSize: 12, textAlign: 'center' },
  resultsGrid: { paddingHorizontal: 12, paddingBottom: 12, gap: 8 },
  resultItem: { flex: 1, margin: 4, aspectRatio: 1, backgroundColor: '#1E293B', borderRadius: 10, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  resultImg: { width: '90%', height: '90%' },

  // Attribution
  attribution: { color: '#334155', fontSize: 10, textAlign: 'center', paddingVertical: 6 },
});
