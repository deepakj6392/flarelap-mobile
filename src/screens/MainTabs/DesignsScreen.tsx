import React, { useState, useMemo } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { Title, Searchbar, Text, Chip } from 'react-native-paper';

const SAMPLE = Array.from({ length: 8 }).map((_, i) => ({
  id: String(i + 1),
  title: i % 2 === 0 ? 'Facebook' : 'Promo',
  category: 'Social_media',
  date: 'Jun 9, 2026',
}));

function DesignCard({ item }: { item: any }) {
  return (
    <View style={cardStyles.card}>
      <View style={cardStyles.thumb} />
      <Text style={cardStyles.cardTitle}>{item.title}</Text>
      <View style={cardStyles.metaRow}>
        <Text style={cardStyles.metaText}>{item.date}</Text>
        <Text style={cardStyles.metaText}> • </Text>
        <Text style={cardStyles.metaText}>{item.category}</Text>
      </View>
      <View style={cardStyles.statsRow}>
        <Text style={cardStyles.small}>0</Text>
        <Text style={cardStyles.small}>♡</Text>
        <Text style={cardStyles.small}>vertical</Text>
      </View>
    </View>
  );
}

export default function DesignsScreen() {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('All');
  const [grid, setGrid] = useState(true);

  const filters = ['All', 'Social Media', 'Custom Size', 'Promotion', 'Business Ads', 'Print', 'Card Maker'];

  const data = useMemo(() => SAMPLE.filter(d => (query ? d.title.toLowerCase().includes(query.toLowerCase()) : true)), [query]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Title style={styles.heading}>All your designs</Title>
        <Text style={styles.count}>50 designs</Text>
      </View>

      <View style={styles.controlsRow}>
        <Searchbar placeholder="Search your designs..." value={query} onChangeText={setQuery} style={styles.search} />

        <View style={styles.viewToggle}>
          <TouchableOpacity onPress={() => setGrid(true)} style={[styles.toggleBtn, grid ? styles.toggleActive : null]}>
            <Text>▦</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setGrid(false)} style={[styles.toggleBtn, !grid ? styles.toggleActive : null]}>
            <Text>☰</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.chipsRow}>
        <FlatList data={filters} horizontal showsHorizontalScrollIndicator={false} keyExtractor={f => f} renderItem={({ item }) => (
          <Chip mode="outlined" selected={item === filter} onPress={() => setFilter(item)} style={styles.chip}>{item}</Chip>
        )} />
      </View>

      <FlatList
        data={data}
        keyExtractor={i => i.id}
        numColumns={grid ? 2 : 1}
        contentContainerStyle={styles.grid}
        renderItem={({ item }) => <DesignCard item={item} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#f8fafc' },
  header: { marginBottom: 8 },
  heading: { fontSize: 22, fontWeight: '800' },
  count: { color: '#64748b', marginTop: 4 },
  controlsRow: { flexDirection: 'row', alignItems: 'center', marginTop: 12, marginBottom: 8 },
  search: { flex: 1, marginRight: 8 },
  viewToggle: { flexDirection: 'row' },
  toggleBtn: { padding: 8, borderRadius: 8, marginLeft: 6, backgroundColor: '#fff' },
  toggleActive: { backgroundColor: '#fdecef' },
  chipsRow: { marginVertical: 8 },
  grid: { paddingBottom: 120 },
  chip: { margin: 4 }
});

const cardStyles = StyleSheet.create({
  card: { flex: 1, backgroundColor: '#fff', borderRadius: 12, padding: 12, margin: 8, minWidth: 150 },
  thumb: { height: 120, backgroundColor: '#e2e8f0', borderRadius: 8, marginBottom: 8 },
  cardTitle: { fontWeight: '700' },
  metaRow: { flexDirection: 'row', marginTop: 6 },
  metaText: { color: '#94a3b8', fontSize: 12 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  small: { color: '#94a3b8', fontSize: 12 },
});
