import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, FlatList, Image } from 'react-native';
import { Title, Paragraph, Card, Text, Menu, Button } from 'react-native-paper';
import { getAllTemplates } from '../../services/template.service';
import { Template } from '../../../types/template';

const CATEGORIES = ['All', 'Social Media', 'Business Ads', 'Card Maker', 'Promotion', 'Wallpaper', 'Logos & Sticker'];

export default function HomeScreen() {
  const [active, setActive] = useState('All');
  const [menuVisible, setMenuVisible] = useState(false);
  const [templates, setTemplates] = useState<Template[]>([]);

  const openMenu = () => setMenuVisible(true);
  const closeMenu = () => setMenuVisible(false);

  useEffect(() => {
    const fetchTemplates = async () => {
      const data = await getAllTemplates('Social Media');
      console.log(data)
      setTemplates(data?.templates);
    };
    fetchTemplates();
  }, []);

  return (
    <ScrollView contentContainerStyle={styles.scroll}>
      <View style={styles.header}>
        <Title style={styles.title}>Start with a
          <Text style={styles.highlight}> Template</Text>
        </Title>
        <Paragraph style={styles.subtitle}>Choose from hundreds of professional templates and customize them in seconds.</Paragraph>
      </View>

      <View style={styles.menuWrap}>
        <Menu
          visible={menuVisible}
          onDismiss={closeMenu}
          anchor={
            <Button mode="outlined" onPress={openMenu} style={styles.categoryBtn}>
              {active}
            </Button>
          }
        >
          {CATEGORIES.map(cat => (
            <Menu.Item key={cat} onPress={() => { setActive(cat); closeMenu(); }} title={cat} />
          ))}
        </Menu>
      </View>

      <View style={styles.sectionHeader}>
        <Title style={styles.sectionTitle}>All Templates</Title>
        <View style={styles.countBadge}><Text style={styles.countText}>158</Text></View>
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
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 20, paddingBottom: 80, backgroundColor: '#fff' },
  header: { alignItems: 'center', marginBottom: 18 },
  title: { fontSize: 26, fontWeight: '800', textAlign: 'center' },
  highlight: { color: '#7b2ab6' },
  subtitle: { textAlign: 'center', color: '#6b7280', marginTop: 8, maxWidth: 360 },
  chipsWrap: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 10, marginTop: 18 },
  chipBtn: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 20, backgroundColor: '#fff', margin: 6, elevation: 2 },
  chipActive: { backgroundColor: '#df103f' },
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
