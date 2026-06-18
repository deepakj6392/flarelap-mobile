import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, FlatList, Image, TouchableOpacity } from 'react-native';
import { Title, Paragraph, Card, Text } from 'react-native-paper';
import { getAllTemplates } from '../../services/template.service';
import { Template } from '../../../types/template';
import { THEME_COLORS } from '../../constants';
import { SafeAreaView } from 'react-native-safe-area-context';

const CATEGORIES = ['All', 'Social Media', 'Business Ads', 'Card Maker', 'Promotion', 'Wallpaper', 'Logos & Sticker'];

export default function HomeScreen() {
  const [active, setActive] = useState('All');
  const [templates, setTemplates] = useState<Template[]>([]);

  useEffect(() => {
    const fetchTemplates = async () => {
      const data = await getAllTemplates('Social Media');
      console.log(data)
      setTemplates(data?.templates);
    };
    fetchTemplates();
  }, []);

  return (
    <SafeAreaView>
    <ScrollView contentContainerStyle={styles.scroll}>
      <View style={styles.header}>
        <Title style={styles.title}>Start with a
          <Text style={styles.highlight}> Template</Text>
        </Title>
        <Paragraph style={styles.subtitle}>Choose from hundreds of professional templates and customize them in seconds.</Paragraph>
      </View>

      <View style={styles.chipsWrap}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 6 }}>
          {CATEGORIES.map(cat => (
            <TouchableOpacity
              key={cat}
              style={[styles.chipBtn, active === cat && styles.chipActive]}
              onPress={() => setActive(cat)}
            >
              <Text style={[styles.chipText, active === cat && styles.chipTextActive]}>{cat}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View style={styles.sectionHeader}>
        <Title style={styles.sectionTitle}>All Templates</Title>
        <View style={styles.countBadge}><Text style={styles.countText}>{templates.length}</Text></View>
      </View>

      <FlatList
        data={templates}
        keyExtractor={i => i.id}
        numColumns={1}
        contentContainerStyle={styles.templates}
        renderItem={({ item }) => (
          <Card style={styles.templateCard}>
            <Card.Content style={styles.templateContent}>
               <Image
                 source={{ uri: item.thumbnail }}
                 style={styles.thumb}
                 resizeMode="cover"
               />
            </Card.Content>
            <Card.Actions style={styles.templateFooter}>
              <Text style={styles.templateLabel}>{item.name}</Text>
            </Card.Actions>
          </Card>
        )}
      />
    </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 20, paddingBottom: 80, backgroundColor: '#fff' },
  header: { alignItems: 'center', marginBottom: 18 },
  title: { fontSize: 26, fontWeight: '800', textAlign: 'center' },
  highlight: { color: THEME_COLORS.primary },
  subtitle: { textAlign: 'center', color: '#6b7280', marginTop: 8, maxWidth: 360 },
  chipsWrap: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 10, marginTop: 18 },
  chipBtn: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 20, backgroundColor: '#fff', margin: 6, elevation: 2 },
  chipActive: { backgroundColor: THEME_COLORS.primary, fontWeight: '700' },
  chipText: { color: '#374151', fontWeight: '600' },
  chipTextActive: { color: '#fff' },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginTop: 22, marginBottom: 12 },
  sectionTitle: { fontSize: 18, fontWeight: '800', flex: 1 },
  countBadge: { backgroundColor: '#eef2ff', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  countText: { color: '#374151', fontWeight: '700' },
  templates: { paddingBottom: 40 },
  templateCard: { borderRadius: 12, marginBottom: 16, overflow: 'hidden' },
  templateContent: { padding: 0 },
  thumb: { height: 160, backgroundColor: '#e6eef8' },
  templateFooter: { justifyContent: 'space-between', paddingHorizontal: 12, paddingVertical: 10 },
  templateLabel: { fontWeight: '700' },
  menuWrap: { alignItems: 'center', marginTop: 12 },
  categoryBtn: { borderRadius: 20, paddingHorizontal: 12 },
});
