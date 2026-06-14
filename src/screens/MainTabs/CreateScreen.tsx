import React from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { Title, Paragraph, Text } from 'react-native-paper';

const TOOLS = [
  {
    label: 'Social Media',
    value: 'social_media',
    image: require('../../assets/images/social_media.png'),
    route: 'SocialMedia'
  },
  {
    label: 'Photo Editor',
    value: 'photo_editor',
    image: require('../../assets/images/image-editing.png'),
    route: 'PhotoEditor'
  },
  {
    label: 'Video Editor',
    value: 'video_editor',
    image: require('../../assets/images/video_editor.png'),
    route: 'VideoEditor'
  },
  {
    label: 'Magic Tool',
    value: 'magic_tool',
    image: require('../../assets/images/magic.png'),
    route: 'MagicTool'
  },
  {
    label: 'Logo Sticker',
    value: 'logo_sticker',
    image: require('../../assets/images/sticker.png'),
    route: 'LogoSticker'
  },
  {
    label: 'Card Maker',
    value: 'card_maker',
    image: require('../../assets/images/card.png'),
    route: 'CardMaker'
  },
  {
    label: 'Business Ads',
    value: 'business_ads',
    image: require('../../assets/images/advertising.png'),
    route: 'BusinessAds'
  },
  {
    label: 'Promotion',
    value: 'promotion',
    image: require('../../assets/images/poster_maker.png'),
    route: 'Promotion'
  },
  {
    label: 'Custom Size',
    value: 'custom_size',
    image: require('../../assets/images/wallpaper.png'),
    route: 'CustomSize'
  },
  {
    label: 'QR Code',
    value: 'qr_code',
    image: require('../../assets/images/qr-code.png'),
    route: 'QRCodeGenerator'
  },
];

export default function CreateScreen({ navigation }: any) {
  return (
    <ScrollView contentContainerStyle={styles.scroll}>
      <View style={styles.header}>
        <Title style={styles.title}>Let's create something amazing!</Title>
        <Paragraph style={styles.subtitle}>Create stunning designs in minutes with AI-powered tools</Paragraph>
      </View>

      <View style={styles.grid}>
        {TOOLS.map((tool, i) => (
          <TouchableOpacity key={tool.value} style={styles.tile} onPress={() => {
            navigation.navigate(tool.route);
          }}>
            <View style={[styles.tileIcon, { backgroundColor: tileColor(i) }]} >
              <Image source={tool.image} style={styles.tileImage} />
            </View>
            <Text style={styles.tileLabel}>{tool.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

function tileColor(index: number) {
  const colors = ['#fce4ec', '#f3e5f5', '#e3f2fd', '#e8f5e9', '#fff3e0', '#fce4ec', '#e8f5e9', '#f3e5f5', '#e3f2fd', '#fff3e0'];
  return colors[index % colors.length];
}

const styles = StyleSheet.create({
  scroll: { padding: 20, paddingBottom: 40, backgroundColor: '#ffffffff' },
  header: { alignItems: 'center', marginTop: 6, marginBottom: 12 },
  title: { fontSize: 22, fontWeight: '800', textAlign: 'center', color: '#df103f' },
  subtitle: { textAlign: 'center', color: '#556070', marginTop: 8, maxWidth: 340 },
  searchWrap: { marginTop: 18, alignItems: 'center' },
  search: { width: '100%', maxWidth: 520, borderRadius: 14, elevation: 2 },
  searchInput: { fontSize: 16 },
  grid: { marginTop: 20, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  tile: { width: '30%', backgroundColor: '#fff', borderRadius: 16, padding: 12, alignItems: 'center', marginBottom: 16, elevation: 3 },
  tileIcon: { width: 90, height: 90, borderRadius: 12, padding: 15, marginBottom: 8 },
  tileLabel: { fontSize: 12, textAlign: 'center', color: '#334155' },
  trendingRow: { marginTop: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 4 },
  trendingTitle: { fontSize: 18, fontWeight: '800' },
  viewAll: { color: '#df103f', fontWeight: '700' },
  fabContainer: { position: 'absolute', right: 20, bottom: 30, alignItems: 'center' },
  fabInner: { width: 52, height: 52, borderRadius: 26, backgroundColor: '#ff8c4c', justifyContent: 'center', alignItems: 'center', marginBottom: 12, elevation: 6 },
  fabMain: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#df103f', justifyContent: 'center', alignItems: 'center', elevation: 8 },
  fabIcon: { color: '#fff', fontSize: 24, fontWeight: '700' },
  tileImage: { width: '100%', height: '100%', borderRadius: 12 }
});
