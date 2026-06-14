import React, { useState, useRef, useMemo } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
  Dimensions,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  Share,
  TextInput,
  Image as RNImage,
  PanResponder,
} from 'react-native';
import { Title, Text } from 'react-native-paper';
import Svg, { Path, Circle } from 'react-native-svg';
import QRCode from 'react-native-qrcode-svg';
import ViewShot, { captureRef } from 'react-native-view-shot';
import { launchImageLibrary, launchCamera } from 'react-native-image-picker';

// Screen Dimensions
const { width: screenWidth } = Dimensions.get('window');
const CANVAS_SIZE = Math.min(screenWidth - 32, 400);

// Preset Colors for QR styling
const PRESET_COLORS = [
  '#000000', '#FFFFFF', '#EF4444', '#F97316', '#F59E0B', '#10B981',
  '#06B6D4', '#3B82F6', '#6366F1', '#8B5CF6', '#EC4899', '#F43F5E'
];

// Preset Logos for center overlay
const PRESET_LOGOS: Record<string, { name: string; url: string }> = {
  wifi: { name: 'WiFi', url: 'https://img.icons8.com/color/96/wifi--v1.png' },
  whatsapp: { name: 'WhatsApp', url: 'https://img.icons8.com/color/96/whatsapp--v1.png' },
  facebook: { name: 'Facebook', url: 'https://img.icons8.com/color/96/facebook-new.png' },
  instagram: { name: 'Instagram', url: 'https://img.icons8.com/color/96/instagram-new.png' },
  web: { name: 'Website', url: 'https://img.icons8.com/color/96/globe--v1.png' },
  email: { name: 'Email', url: 'https://img.icons8.com/color/96/gmail-new.png' },
  phone: { name: 'Phone', url: 'https://img.icons8.com/color/96/phone.png' },
};

// --- Custom SVG Icons ---
const CloseIcon = ({ size = 20, color = '#F8FAFC' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M18 6L6 18M6 6l12 12" />
  </Svg>
);

const ShareIcon = ({ size = 18, color = '#ffffff' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8M16 6l-4-4-4 4M12 2v13" />
  </Svg>
);

const LinkIcon = ({ size = 16, color = '#94A3B8' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
    <Path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
  </Svg>
);

const TextIcon = ({ size = 16, color = '#94A3B8' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M4 7V4h16v3M9 20h6M12 4v16" />
  </Svg>
);

const WifiIcon = ({ size = 16, color = '#94A3B8' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M5 12.55a11 11 0 0 1 14.08 0M1.42 9a16 16 0 0 1 21.16 0M8.53 16.11a6 6 0 0 1 6.95 0M12 20h.01" />
  </Svg>
);

const MailIcon = ({ size = 16, color = '#94A3B8' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
    <Path d="M22 6l-10 7L2 6" />
  </Svg>
);

const PhoneIcon = ({ size = 16, color = '#94A3B8' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
  </Svg>
);

const ColorIcon = ({ size = 18, color = '#94A3B8' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
    <Path d="M7.5 10.5c.828 0 1.5-.672 1.5-1.5s-.672-1.5-1.5-1.5-1.5.672-1.5 1.5.672 1.5 1.5 1.5zM11.5 7.5c.828 0 1.5-.672 1.5-1.5S12.328 4.5 11.5 4.5s-1.5.672-1.5 1.5.672 1.5 1.5 1.5z" />
  </Svg>
);

const ImagePickerIcon = ({ size = 18, color = '#94A3B8' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7" />
    <Circle cx="16" cy="5" r="3" />
    <Path d="M21 15l-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
  </Svg>
);

const SettingsIcon = ({ size = 18, color = '#94A3B8' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Circle cx="12" cy="12" r="3" />
    <Path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </Svg>
);

// --- Custom Pan-Responder Slider Component ---
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
  const sliderWidth = screenWidth - 48;
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
  container: { marginVertical: 8, paddingHorizontal: 12 },
  labelRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
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

export default function QRCodeGenerator({ navigation }: { route?: any; navigation?: any }) {
  const viewShotRef = useRef<any>(null);

  // Tab State
  const [activeTab, setActiveTab] = useState<'content' | 'colors' | 'logo' | 'settings'>('content');
  const [contentType, setContentType] = useState<'url' | 'text' | 'wifi' | 'email' | 'sms'>('url');

  // Input states
  const [urlText, setUrlText] = useState('https://flarelap.com');
  const [plainText, setPlainText] = useState('Hello from Flarelap!');
  
  // WiFi states
  const [wifiSsid, setWifiSsid] = useState('MyHomeWiFi');
  const [wifiPassword, setWifiPassword] = useState('SecurePass123');
  const [wifiSecurity, setWifiSecurity] = useState<'WPA' | 'WEP' | 'none'>('WPA');
  const [wifiHidden, setWifiHidden] = useState(false);

  // Email states
  const [emailTo, setEmailTo] = useState('hello@flarelap.com');
  const [emailSubject, setEmailSubject] = useState('Hello Flarelap');
  const [emailBody, setEmailBody] = useState('Sent from Flarelap QR Generator!');

  // SMS states
  const [smsPhone, setSmsPhone] = useState('+1234567890');
  const [smsMessage, setSmsMessage] = useState('Hi, scanning this QR code worked!');

  // QR Customization states
  const [fgColor, setFgColor] = useState('#000000');
  const [bgColor, setBgColor] = useState('#FFFFFF');
  const [qrSize, setQrSize] = useState(180);
  const [ecl, setEcl] = useState<'L' | 'M' | 'Q' | 'H'>('Q');

  // Logo Customization states
  const [logoType, setLogoType] = useState<'none' | 'preset' | 'custom'>('none');
  const [selectedPresetLogo, setSelectedPresetLogo] = useState<string>('wifi');
  const [customLogoUri, setCustomLogoUri] = useState<string | null>(null);
  const [logoSize, setLogoSize] = useState(40);
  const [logoBorderRadius, setLogoBorderRadius] = useState(8);
  const [logoMargin, setLogoMargin] = useState(4);
  const [logoBgColor, setLogoBgColor] = useState('#FFFFFF');

  // Compute raw QR value based on selected content type
  const computedQRValue = useMemo(() => {
    switch (contentType) {
      case 'url':
        return urlText.trim() || 'https://flarelap.com';
      case 'text':
        return plainText || 'Flarelap QR';
      case 'wifi':
        const sec = wifiSecurity === 'none' ? 'nopass' : wifiSecurity;
        return `WIFI:S:${wifiSsid};T:${sec};P:${wifiPassword};H:${wifiHidden ? 'true' : 'false'};;`;
      case 'email':
        return `mailto:${emailTo}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;
      case 'sms':
        return `SMSTO:${smsPhone}:${smsMessage}`;
      default:
        return 'https://flarelap.com';
    }
  }, [contentType, urlText, plainText, wifiSsid, wifiPassword, wifiSecurity, wifiHidden, emailTo, emailSubject, emailBody, smsPhone, smsMessage]);

  // Determine Logo Image Source
  const logoSource = useMemo(() => {
    if (logoType === 'none') return undefined;
    if (logoType === 'preset') {
      return { uri: PRESET_LOGOS[selectedPresetLogo]?.url };
    }
    if (logoType === 'custom' && customLogoUri) {
      return { uri: customLogoUri };
    }
    return undefined;
  }, [logoType, selectedPresetLogo, customLogoUri]);

  // Automatically suggest High Error Correction Level if central logo is active
  const recommendedECL = useMemo(() => {
    if (logoType !== 'none') {
      return 'H'; // logo needs high ECL to ensure scan stability
    }
    return ecl;
  }, [logoType, ecl]);

  // Image pickers for custom logo
  const handleSelectGallery = async () => {
    const response = await launchImageLibrary({
      mediaType: 'photo',
      quality: 0.8,
    });
    if (response.assets && response.assets.length > 0 && response.assets[0].uri) {
      setCustomLogoUri(response.assets[0].uri);
      setLogoType('custom');
    }
  };

  const handleSelectCamera = async () => {
    const response = await launchCamera({
      mediaType: 'photo',
      quality: 0.8,
    });
    if (response.assets && response.assets.length > 0 && response.assets[0].uri) {
      setCustomLogoUri(response.assets[0].uri);
      setLogoType('custom');
    }
  };

  const handleExportQRCode = async () => {
    try {
      const uri = await captureRef(viewShotRef, {
        format: 'png',
        quality: 1.0,
      });

      // Present explicit Download and Share actions
      Alert.alert(
        'QR Code Exported!',
        'Your custom QR code has been compiled. What would you like to do?',
        [
          {
            text: 'Download',
            onPress: async () => {
              try {
                await saveImageToDevice(uri);
              } catch (e: any) {
                Alert.alert('Save Failed', e?.message || 'Could not save image.');
              }
            },
          },
          {
            text: 'Share',
            onPress: async () => {
              try {
                await shareImageFile(uri);
              } catch {
                Alert.alert('Share Failed', 'Failed to trigger share system.');
              }
            },
          },
          { text: 'Cancel', style: 'cancel' },
        ]
      );
    } catch (err: any) {
      Alert.alert('Export Failed', err.message || 'Could not compile QR code canvas.');
    }
  };

  // Attempt to save an image URI to the user's device.
  // We intentionally avoid using @react-native-community/cameraroll here to prevent hard dependency issues.
  // Instead we open the native share sheet so users can save the image (Save Image / Save to Files) from there.
  const saveImageToDevice = async (localUri: string) => {
    // Try to use react-native-fs if it's installed so we can write to a visible folder (Downloads on Android).
    // If RNFS isn't available, fall back to the share sheet.
    const tryRNFS = () => {
      try {
        // @ts-ignore - optional dependency
        return require('react-native-fs');
      } catch {
        return null;
      }
    };

    const RNFS = tryRNFS();

    // normalize uri helpers
    const stripFilePrefix = (u: string) => (u.startsWith('file://') ? u.replace('file://', '') : u);

    try {
      if (RNFS) {
        // If the captured URI is a data URI (base64), write it out directly.
        if (localUri.startsWith('data:')) {
          // data:[<mediatype>][;base64],<data>
          const parts = localUri.split(',');
          const meta = parts[0] || '';
          const isBase64 = meta.includes(';base64');
          const data = parts[1] || '';
          const filename = `flarelap_qr_${Date.now()}.png`;

          if (Platform.OS === 'android') {
            const destPath = `${RNFS.DownloadDirectoryPath}/${filename}`;
            if (isBase64) {
              await RNFS.writeFile(destPath, data, 'base64');
            } else {
              await RNFS.writeFile(destPath, data, 'utf8');
            }
            // Try to scan so the image shows in Downloads/Gallery apps
            if (RNFS.scanFile) {
              try { RNFS.scanFile([{ path: destPath, mime: 'image/png' }]); } catch { /* ignore */ }
            }
            Alert.alert('Saved', `Image saved to Downloads: ${destPath}`);
            return;
          } else {
            const destPath = `${RNFS.DocumentDirectoryPath}/${filename}`;
            if (isBase64) {
              await RNFS.writeFile(destPath, data, 'base64');
            } else {
              await RNFS.writeFile(destPath, data, 'utf8');
            }
            // On iOS present share sheet so user can Save to Files or save image
            await Share.share({ url: `file://${destPath}` }, { subject: 'QR Code from Flarelap' });
            Alert.alert('Saved', 'Image written to app documents. Use the share sheet to move it to Files or Photos.');
            return;
          }
        }

        // Otherwise localUri should be a file:// path returned by view-shot
        const srcPath = stripFilePrefix(localUri);
        const filename = `flarelap_qr_${Date.now()}.png`;

        if (Platform.OS === 'android') {
          const destPath = `${RNFS.DownloadDirectoryPath}/${filename}`;
          await RNFS.copyFile(srcPath, destPath);
          if (RNFS.scanFile) {
            try { RNFS.scanFile([{ path: destPath, mime: 'image/png' }]); } catch { /* ignore */ }
          }
          Alert.alert('Saved', `Image saved to Downloads: ${destPath}`);
          return;
        } else {
          const destPath = `${RNFS.DocumentDirectoryPath}/${filename}`;
          await RNFS.copyFile(srcPath, destPath);
          // Present share so user can export to Files or Photos
          await Share.share({ url: `file://${destPath}` }, { subject: 'QR Code from Flarelap' });
          Alert.alert('Saved', 'Image written to app documents. Use the share sheet to move it to Files or Photos.');
          return;
        }
      }

      // If RNFS is not present, fallback to share sheet so user can Save Image / Save to Files
      if (Platform.OS === 'ios') {
        await Share.share({ url: localUri }, { subject: 'QR Code from Flarelap' });
      } else {
        await Share.share({ message: 'Scan my QR code made in Flarelap!', url: localUri });
      }

      Alert.alert('Share opened', 'Use the share sheet to save the image (e.g. "Save Image" or "Save to Files").');
    } catch (err: any) {
      console.warn('saveImageToDevice failed', err);
      Alert.alert(
        'Save Failed',
        'Could not save the image automatically. You can still share it using the system share sheet.'
      );
    }
  };

  // Ensure we share the actual image file. If the captured URI is a data URI, write it to a temp file (RNFS) first.
  const shareImageFile = async (localUri: string) => {
    const tryRNFS = () => {
      try {
        // @ts-ignore
        return require('react-native-fs');
      } catch {
        return null;
      }
    };

    const RNFS = tryRNFS();

    const stripFilePrefix = (u: string) => (u.startsWith('file://') ? u : (u.startsWith('/') ? `file://${u}` : u));

    try {
      let shareUri = localUri;

      if (localUri.startsWith('data:')) {
        // need to write data URI to a temporary file to share
        const parts = localUri.split(',');
        const meta = parts[0] || '';
        const isBase64 = meta.includes(';base64');
        const data = parts[1] || '';
        const filename = `flarelap_qr_share_${Date.now()}.png`;

        if (RNFS) {
          const tmpPath = Platform.OS === 'android' ? `${RNFS.TemporaryDirectoryPath}/${filename}` : `${RNFS.TemporaryDirectoryPath || RNFS.DocumentDirectoryPath}/${filename}`;
          if (isBase64) {
            await RNFS.writeFile(tmpPath, data, 'base64');
          } else {
            await RNFS.writeFile(tmpPath, data, 'utf8');
          }
          shareUri = `file://${tmpPath}`;
        } else {
          // If RNFS isn't available, fall back to share sheet with data URI (may not work on Android)
          shareUri = localUri;
        }
      } else {
        // ensure file:// prefix when appropriate
        shareUri = stripFilePrefix(localUri);
      }

      if (Platform.OS === 'ios') {
        await Share.share({ url: shareUri }, { subject: 'QR Code from Flarelap' });
      } else {
        await Share.share({ message: 'Scan my QR code made in Flarelap!', url: shareUri });
      }
    } catch (err) {
      console.warn('shareImageFile failed', err);
      Alert.alert('Share Failed', 'Could not share the QR image file.');
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation?.goBack()} style={styles.headerBtn}>
            <CloseIcon size={20} color="#F8FAFC" />
          </TouchableOpacity>
          <Title style={styles.headerTitle}>QR Code Generator</Title>
          <TouchableOpacity onPress={handleExportQRCode} style={styles.exportBtn}>
            <ShareIcon size={18} color="#ffffff" />
          </TouchableOpacity>
        </View>

        {/* Live QR Preview Canvas */}
        <View style={styles.canvasContainer}>
          <ViewShot
            ref={viewShotRef}
            options={{ format: 'png', quality: 1.0 }}
            style={[
              styles.canvasWrapper,
              {
                backgroundColor: bgColor,
                width: CANVAS_SIZE,
                height: CANVAS_SIZE,
              },
            ]}
          >
            <View style={styles.qrCenteredWrapper}>
              <QRCode
                value={computedQRValue}
                size={qrSize}
                color={fgColor}
                backgroundColor={bgColor}
                logo={logoSource}
                logoSize={logoSize}
                logoBorderRadius={logoBorderRadius}
                logoMargin={logoMargin}
                logoBackgroundColor={logoBgColor}
                ecl={recommendedECL}
              />
            </View>
          </ViewShot>
          <Text style={styles.scannableHint}>Position or scan above preview directly</Text>
        </View>

        {/* Configuration Deck */}
        <View style={styles.deck}>
          {/* Subpanel Controls based on Active Tab */}
          <ScrollView style={styles.deckScroll} contentContainerStyle={styles.deckScrollContent}>
            
            {/* 1. CONTENT CONFIG PANEL */}
            {activeTab === 'content' && (
              <View style={styles.panelContent}>
                <Text style={styles.panelTitle}>Choose Content Type</Text>
                
                {/* Content Type Sub-Selector */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.contentTypesScroll}>
                  <TouchableOpacity
                    style={[styles.contentTypeBtn, contentType === 'url' && styles.contentTypeBtnActive]}
                    onPress={() => setContentType('url')}
                  >
                    <LinkIcon size={14} color={contentType === 'url' ? '#ffffff' : '#94A3B8'} />
                    <Text style={[styles.contentTypeLabel, contentType === 'url' && styles.contentTypeLabelActive]}>URL</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.contentTypeBtn, contentType === 'text' && styles.contentTypeBtnActive]}
                    onPress={() => setContentType('text')}
                  >
                    <TextIcon size={14} color={contentType === 'text' ? '#ffffff' : '#94A3B8'} />
                    <Text style={[styles.contentTypeLabel, contentType === 'text' && styles.contentTypeLabelActive]}>Text</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.contentTypeBtn, contentType === 'wifi' && styles.contentTypeBtnActive]}
                    onPress={() => setContentType('wifi')}
                  >
                    <WifiIcon size={14} color={contentType === 'wifi' ? '#ffffff' : '#94A3B8'} />
                    <Text style={[styles.contentTypeLabel, contentType === 'wifi' && styles.contentTypeLabelActive]}>Wi-Fi</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.contentTypeBtn, contentType === 'email' && styles.contentTypeBtnActive]}
                    onPress={() => setContentType('email')}
                  >
                    <MailIcon size={14} color={contentType === 'email' ? '#ffffff' : '#94A3B8'} />
                    <Text style={[styles.contentTypeLabel, contentType === 'email' && styles.contentTypeLabelActive]}>Email</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.contentTypeBtn, contentType === 'sms' && styles.contentTypeBtnActive]}
                    onPress={() => setContentType('sms')}
                  >
                    <PhoneIcon size={14} color={contentType === 'sms' ? '#ffffff' : '#94A3B8'} />
                    <Text style={[styles.contentTypeLabel, contentType === 'sms' && styles.contentTypeLabelActive]}>SMS</Text>
                  </TouchableOpacity>
                </ScrollView>

                {/* Subpanel form inputs */}
                <View style={styles.formWrapper}>
                  {contentType === 'url' && (
                    <View>
                      <Text style={styles.inputLabel}>Website URL</Text>
                      <TextInput
                        style={styles.textInput}
                        value={urlText}
                        onChangeText={setUrlText}
                        placeholder="https://example.com"
                        placeholderTextColor="#475569"
                        autoCapitalize="none"
                        autoCorrect={false}
                      />
                    </View>
                  )}

                  {contentType === 'text' && (
                    <View>
                      <Text style={styles.inputLabel}>Text Content</Text>
                      <TextInput
                        style={[styles.textInput, styles.textArea]}
                        value={plainText}
                        onChangeText={setPlainText}
                        placeholder="Enter text or message to encode..."
                        placeholderTextColor="#475569"
                        multiline
                        numberOfLines={3}
                      />
                    </View>
                  )}

                  {contentType === 'wifi' && (
                    <View>
                      <Text style={styles.inputLabel}>Network SSID (Name)</Text>
                      <TextInput
                        style={styles.textInput}
                        value={wifiSsid}
                        onChangeText={setWifiSsid}
                        placeholder="SSID Name"
                        placeholderTextColor="#475569"
                        autoCapitalize="none"
                      />
                      
                      <Text style={styles.inputLabel}>Password</Text>
                      <TextInput
                        style={styles.textInput}
                        value={wifiPassword}
                        onChangeText={setWifiPassword}
                        placeholder="Network Password"
                        placeholderTextColor="#475569"
                        secureTextEntry
                        autoCapitalize="none"
                      />

                      <Text style={styles.inputLabel}>Security Mode</Text>
                      <View style={styles.securityRow}>
                        {(['WPA', 'WEP', 'none'] as const).map((mode) => (
                          <TouchableOpacity
                            key={mode}
                            style={[styles.securityBtn, wifiSecurity === mode && styles.securityBtnActive]}
                            onPress={() => setWifiSecurity(mode)}
                          >
                            <Text style={[styles.securityLabel, wifiSecurity === mode && styles.securityLabelActive]}>
                              {mode === 'none' ? 'Open' : mode}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>

                      <TouchableOpacity
                        style={styles.checkboxRow}
                        onPress={() => setWifiHidden(!wifiHidden)}
                      >
                        <View style={[styles.checkbox, wifiHidden && styles.checkboxChecked]}>
                          {wifiHidden && <Text style={styles.checkmark}>✓</Text>}
                        </View>
                        <Text style={styles.checkboxLabel}>Hidden Network</Text>
                      </TouchableOpacity>
                    </View>
                  )}

                  {contentType === 'email' && (
                    <View>
                      <Text style={styles.inputLabel}>Recipient Email</Text>
                      <TextInput
                        style={styles.textInput}
                        value={emailTo}
                        onChangeText={setEmailTo}
                        placeholder="example@mail.com"
                        placeholderTextColor="#475569"
                        autoCapitalize="none"
                        keyboardType="email-address"
                      />

                      <Text style={styles.inputLabel}>Subject</Text>
                      <TextInput
                        style={styles.textInput}
                        value={emailSubject}
                        onChangeText={setEmailSubject}
                        placeholder="Mail Subject"
                        placeholderTextColor="#475569"
                      />

                      <Text style={styles.inputLabel}>Email Message</Text>
                      <TextInput
                        style={[styles.textInput, styles.textArea]}
                        value={emailBody}
                        onChangeText={setEmailBody}
                        placeholder="Enter email body text..."
                        placeholderTextColor="#475569"
                        multiline
                        numberOfLines={3}
                      />
                    </View>
                  )}

                  {contentType === 'sms' && (
                    <View>
                      <Text style={styles.inputLabel}>Phone Number</Text>
                      <TextInput
                        style={styles.textInput}
                        value={smsPhone}
                        onChangeText={setSmsPhone}
                        placeholder="+1 (555) 000-0000"
                        placeholderTextColor="#475569"
                        keyboardType="phone-pad"
                      />

                      <Text style={styles.inputLabel}>SMS Message</Text>
                      <TextInput
                        style={[styles.textInput, styles.textArea]}
                        value={smsMessage}
                        onChangeText={setSmsMessage}
                        placeholder="Enter SMS text to auto-fill..."
                        placeholderTextColor="#475569"
                        multiline
                        numberOfLines={2}
                      />
                    </View>
                  )}
                </View>
              </View>
            )}

            {/* 2. STYLE PANEL */}
            {activeTab === 'colors' && (
              <View style={styles.panelContent}>
                {/* Foreground color */}
                <Text style={styles.panelTitle}>QR Code Modules Color</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.colorsScroll}>
                  {PRESET_COLORS.map((color) => (
                    <TouchableOpacity
                      key={`fg_${color}`}
                      style={[styles.colorBubble, { backgroundColor: color }, fgColor === color && styles.activeColorBubble]}
                      onPress={() => setFgColor(color)}
                    />
                  ))}
                </ScrollView>
                <View style={styles.hexInputWrapper}>
                  <Text style={styles.hexLabel}>Hex Code:</Text>
                  <TextInput
                    style={styles.hexInput}
                    value={fgColor}
                    onChangeText={setFgColor}
                    placeholder="#000000"
                    placeholderTextColor="#475569"
                    autoCapitalize="none"
                  />
                </View>

                {/* Background color */}
                <Text style={[styles.panelTitle, { marginTop: 16 }]}>Background Color</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.colorsScroll}>
                  {PRESET_COLORS.map((color) => (
                    <TouchableOpacity
                      key={`bg_${color}`}
                      style={[styles.colorBubble, { backgroundColor: color }, bgColor === color && styles.activeColorBubble]}
                      onPress={() => setBgColor(color)}
                    />
                  ))}
                </ScrollView>
                <View style={styles.hexInputWrapper}>
                  <Text style={styles.hexLabel}>Hex Code:</Text>
                  <TextInput
                    style={styles.hexInput}
                    value={bgColor}
                    onChangeText={setBgColor}
                    placeholder="#FFFFFF"
                    placeholderTextColor="#475569"
                    autoCapitalize="none"
                  />
                </View>
              </View>
            )}

            {/* 3. LOGO OVERLAY PANEL */}
            {activeTab === 'logo' && (
              <View style={styles.panelContent}>
                <Text style={styles.panelTitle}>Select Central Logo Type</Text>
                <View style={styles.logoTypeRow}>
                  <TouchableOpacity
                    style={[styles.logoTypeBtn, logoType === 'none' && styles.logoTypeBtnActive]}
                    onPress={() => setLogoType('none')}
                  >
                    <Text style={[styles.logoTypeLabel, logoType === 'none' && styles.logoTypeLabelActive]}>None</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.logoTypeBtn, logoType === 'preset' && styles.logoTypeBtnActive]}
                    onPress={() => setLogoType('preset')}
                  >
                    <Text style={[styles.logoTypeLabel, logoType === 'preset' && styles.logoTypeLabelActive]}>Presets</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.logoTypeBtn, logoType === 'custom' && styles.logoTypeBtnActive]}
                    onPress={() => setLogoType('custom')}
                  >
                    <Text style={[styles.logoTypeLabel, logoType === 'custom' && styles.logoTypeLabelActive]}>Upload</Text>
                  </TouchableOpacity>
                </View>

                {/* Subpanel depending on logo source selected */}
                {logoType === 'preset' && (
                  <View style={styles.presetLogoWrapper}>
                    <Text style={styles.subTitle}>Select Preset Brand</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.presetsLogoScroll}>
                      {Object.keys(PRESET_LOGOS).map((key) => (
                        <TouchableOpacity
                          key={key}
                          style={[styles.presetLogoCard, selectedPresetLogo === key && styles.presetLogoCardActive]}
                          onPress={() => setSelectedPresetLogo(key)}
                        >
                          <RNImage source={{ uri: PRESET_LOGOS[key].url }} style={styles.presetLogoImage} />
                          <Text style={styles.presetLogoName}>{PRESET_LOGOS[key].name}</Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                )}

                {logoType === 'custom' && (
                  <View style={styles.customUploadWrapper}>
                    <Text style={styles.subTitle}>Select Custom Logo Image</Text>
                    <View style={styles.uploadButtons}>
                      <TouchableOpacity style={styles.uploadBtn} onPress={handleSelectGallery}>
                        <ImagePickerIcon size={18} color="#ffffff" />
                        <Text style={styles.uploadBtnLabel}>Gallery</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.uploadBtn} onPress={handleSelectCamera}>
                        <Text style={styles.uploadBtnLabel}>Camera</Text>
                      </TouchableOpacity>
                    </View>
                    {customLogoUri ? (
                      <View style={styles.customLogoPreviewRow}>
                        <RNImage source={{ uri: customLogoUri }} style={styles.customLogoPreview} />
                        <Text style={styles.customLogoPath} numberOfLines={1}>Selected custom logo image</Text>
                      </View>
                    ) : (
                      <Text style={styles.noLogoSelectedText}>No image selected yet.</Text>
                    )}
                  </View>
                )}

                {/* Logo Customization controls when logo is active */}
                {logoType !== 'none' && (
                  <View style={styles.logoSlidersContainer}>
                    <Text style={[styles.panelTitle, { marginTop: 12 }]}>Logo Styling Controls</Text>
                    <CustomSlider value={logoSize} min={20} max={60} step={2} onChange={setLogoSize} label="Logo Size" suffix=" px" />
                    <CustomSlider value={logoBorderRadius} min={0} max={30} step={1} onChange={setLogoBorderRadius} label="Border Radius" suffix=" px" />
                    <CustomSlider value={logoMargin} min={0} max={15} step={1} onChange={setLogoMargin} label="Logo Margin" suffix=" px" />

                    {/* Logo Background Color selection */}
                    <Text style={[styles.panelTitle, { marginTop: 8 }]}>Logo background Color</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.colorsScroll}>
                      {PRESET_COLORS.map((color) => (
                        <TouchableOpacity
                          key={`logo_bg_${color}`}
                          style={[styles.colorBubble, { backgroundColor: color }, logoBgColor === color && styles.activeColorBubble]}
                          onPress={() => setLogoBgColor(color)}
                        />
                      ))}
                    </ScrollView>
                    <View style={styles.hexInputWrapper}>
                      <Text style={styles.hexLabel}>Hex Code:</Text>
                      <TextInput
                        style={styles.hexInput}
                        value={logoBgColor}
                        onChangeText={setLogoBgColor}
                        placeholder="#FFFFFF"
                        placeholderTextColor="#475569"
                        autoCapitalize="none"
                      />
                    </View>
                  </View>
                )}
              </View>
            )}

            {/* 4. SETTINGS PANEL */}
            {activeTab === 'settings' && (
              <View style={styles.panelContent}>
                <Text style={styles.panelTitle}>QR Overall Scale</Text>
                <CustomSlider value={qrSize} min={100} max={300} step={10} onChange={setQrSize} label="QR Dimensions" suffix=" px" />

                <Text style={[styles.panelTitle, { marginTop: 16 }]}>Error Correction Level (ECL)</Text>
                <View style={styles.eclRow}>
                  {(['L', 'M', 'Q', 'H'] as const).map((level) => {
                    const labelMap = { L: 'L - Low (7%)', M: 'M - Medium (15%)', Q: 'Q - Quartile (25%)', H: 'H - High (30%)' };
                    return (
                      <TouchableOpacity
                        key={level}
                        style={[styles.eclBtn, (logoType !== 'none' ? recommendedECL === level : ecl === level) && styles.eclBtnActive]}
                        onPress={() => {
                          if (logoType !== 'none') {
                            Alert.alert('ECL Overridden', 'High error correction (H) is required to ensure QR codes are scannable with a central logo.');
                          } else {
                            setEcl(level);
                          }
                        }}
                      >
                        <Text style={[styles.eclLabel, (logoType !== 'none' ? recommendedECL === level : ecl === level) && styles.eclLabelActive]}>
                          {labelMap[level]}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
                {logoType !== 'none' && (
                  <Text style={styles.eclNotice}>* Force set to High (H) because logo overlay is enabled.</Text>
                )}
              </View>
            )}
          </ScrollView>

          {/* Bottom Navigation Tab Bar */}
          <View style={styles.tabBar}>
            <TouchableOpacity
              style={[styles.tabItem, activeTab === 'content' && styles.tabItemActive]}
              onPress={() => setActiveTab('content')}
            >
              <TextIcon size={18} color={activeTab === 'content' ? '#df103f' : '#94A3B8'} />
              <Text style={[styles.tabLabel, activeTab === 'content' && styles.tabLabelActive]}>Content</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tabItem, activeTab === 'colors' && styles.tabItemActive]}
              onPress={() => setActiveTab('colors')}
            >
              <ColorIcon size={18} color={activeTab === 'colors' ? '#df103f' : '#94A3B8'} />
              <Text style={[styles.tabLabel, activeTab === 'colors' && styles.tabLabelActive]}>Style</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tabItem, activeTab === 'logo' && styles.tabItemActive]}
              onPress={() => setActiveTab('logo')}
            >
              <ImagePickerIcon size={18} color={activeTab === 'logo' ? '#df103f' : '#94A3B8'} />
              <Text style={[styles.tabLabel, activeTab === 'logo' && styles.tabLabelActive]}>Logo</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tabItem, activeTab === 'settings' && styles.tabItemActive]}
              onPress={() => setActiveTab('settings')}
            >
              <SettingsIcon size={18} color={activeTab === 'settings' ? '#df103f' : '#94A3B8'} />
              <Text style={[styles.tabLabel, activeTab === 'settings' && styles.tabLabelActive]}>Settings</Text>
            </TouchableOpacity>
          </View>
        </View>
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
  exportBtn: {
    backgroundColor: '#df103f',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },

  canvasContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#05070B',
  },
  canvasWrapper: {
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 10,
    elevation: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  qrCenteredWrapper: {
    padding: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scannableHint: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 14,
    fontWeight: '500',
    letterSpacing: 0.5,
  },

  deck: {
    borderTopWidth: 1,
    borderTopColor: '#1E293B',
    backgroundColor: '#0F172A',
    height: 340,
  },
  deckScroll: { flex: 1 },
  deckScrollContent: { paddingBottom: 16 },
  panelContent: { padding: 16 },
  panelTitle: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    marginBottom: 10,
    paddingHorizontal: 4,
    letterSpacing: 0.7,
  },
  subTitle: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
  },

  // Content configuration subtabs
  contentTypesScroll: { flexDirection: 'row', marginBottom: 12, paddingHorizontal: 4 },
  contentTypeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  contentTypeBtnActive: {
    backgroundColor: '#df103f',
    borderColor: '#df103f',
  },
  contentTypeLabel: { color: '#94A3B8', fontSize: 13, fontWeight: '600', marginLeft: 6 },
  contentTypeLabelActive: { color: '#ffffff', fontWeight: '700' },

  // Forms
  formWrapper: { marginTop: 4 },
  inputLabel: { fontSize: 12, color: '#64748B', fontWeight: '700', marginBottom: 4, marginTop: 8 },
  textInput: {
    backgroundColor: '#1E293B',
    borderColor: '#334155',
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    color: '#F8FAFC',
    fontSize: 14,
    marginBottom: 6,
  },
  textArea: {
    height: 70,
    textAlignVertical: 'top',
  },

  // Security selector (WiFi)
  securityRow: { flexDirection: 'row', justifyContent: 'space-between', marginVertical: 6 },
  securityBtn: {
    flex: 1,
    backgroundColor: '#1E293B',
    borderColor: '#334155',
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: 'center',
    marginHorizontal: 3,
  },
  securityBtnActive: { backgroundColor: '#df103f', borderColor: '#df103f' },
  securityLabel: { color: '#94A3B8', fontSize: 12, fontWeight: '600' },
  securityLabelActive: { color: '#ffffff', fontWeight: '700' },

  // Checkbox (WiFi)
  checkboxRow: { flexDirection: 'row', alignItems: 'center', marginTop: 10, marginBottom: 4 },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: '#334155',
    backgroundColor: '#1E293B',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  checkboxChecked: { backgroundColor: '#df103f', borderColor: '#df103f' },
  checkmark: { color: '#ffffff', fontSize: 11, fontWeight: 'bold' },
  checkboxLabel: { color: '#F8FAFC', fontSize: 13, fontWeight: '500' },

  // Colors
  colorsScroll: { flexDirection: 'row', paddingVertical: 6, marginBottom: 8 },
  colorBubble: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 10,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  activeColorBubble: { borderColor: '#ffffff', transform: [{ scale: 1.1 }] },
  hexInputWrapper: { flexDirection: 'row', alignItems: 'center', marginTop: 4, paddingHorizontal: 4 },
  hexLabel: { color: '#64748B', fontSize: 13, marginRight: 8, fontWeight: '600' },
  hexInput: {
    backgroundColor: '#1E293B',
    borderColor: '#334155',
    borderWidth: 1,
    borderRadius: 6,
    paddingVertical: 4,
    paddingHorizontal: 8,
    color: '#F8FAFC',
    fontSize: 13,
    width: 100,
    textAlign: 'center',
  },

  // Logo Types
  logoTypeRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  logoTypeBtn: {
    flex: 1,
    backgroundColor: '#1E293B',
    borderColor: '#334155',
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  logoTypeBtnActive: { backgroundColor: '#df103f', borderColor: '#df103f' },
  logoTypeLabel: { color: '#94A3B8', fontSize: 13, fontWeight: '600' },
  logoTypeLabelActive: { color: '#ffffff', fontWeight: '700' },

  // Preset Logos Scroll
  presetLogoWrapper: { marginTop: 4 },
  presetsLogoScroll: { flexDirection: 'row', paddingVertical: 6 },
  presetLogoCard: {
    marginRight: 12,
    width: 76,
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1E293B',
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#334155',
  },
  presetLogoCardActive: { borderColor: '#df103f', backgroundColor: '#1E293B' },
  presetLogoImage: { width: 34, height: 34, borderRadius: 6 },
  presetLogoName: { fontSize: 11, color: '#94A3B8', marginTop: 6, fontWeight: '600' },

  // Custom Logo Upload
  customUploadWrapper: { marginTop: 4 },
  uploadButtons: { flexDirection: 'row', marginBottom: 10 },
  uploadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1E293B',
    borderColor: '#334155',
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 20,
    marginRight: 10,
  },
  uploadBtnLabel: { color: '#F8FAFC', fontSize: 13, fontWeight: '700', marginLeft: 6 },
  customLogoPreviewRow: { flexDirection: 'row', alignItems: 'center', marginTop: 10, backgroundColor: '#1E293B', padding: 8, borderRadius: 8 },
  customLogoPreview: { width: 40, height: 40, borderRadius: 6, marginRight: 10 },
  customLogoPath: { color: '#94A3B8', fontSize: 12, flex: 1 },
  noLogoSelectedText: { color: '#64748B', fontSize: 13, fontStyle: 'italic', marginTop: 8 },
  logoSlidersContainer: { marginTop: 8 },

  // ECL settings
  eclRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  eclBtn: {
    width: '48%',
    backgroundColor: '#1E293B',
    borderColor: '#334155',
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
    marginBottom: 8,
  },
  eclBtnActive: { backgroundColor: '#df103f', borderColor: '#df103f' },
  eclLabel: { color: '#94A3B8', fontSize: 12, fontWeight: '600' },
  eclLabelActive: { color: '#ffffff', fontWeight: '700' },
  eclNotice: { fontSize: 11, color: '#F59E0B', marginTop: 4, fontStyle: 'italic' },

  // Tab Bar Bottom Menu
  tabBar: {
    height: 60,
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#1E293B',
    backgroundColor: '#0F172A',
  },
  tabItem: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 6,
  },
  tabItemActive: {
    borderTopWidth: 2,
    borderTopColor: '#df103f',
  },
  tabLabel: { fontSize: 10, color: '#94A3B8', marginTop: 4, fontWeight: '600' },
  tabLabelActive: { color: '#df103f', fontWeight: '700' },
});
