import React, { useState, useEffect, useMemo } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, ScrollView, Image, ActivityIndicator } from 'react-native';
import { Title, Searchbar, Text, Chip } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import api from '../../services/api.service';

function DesignCard({ item }: { item: any }) {
  const navigation = useNavigation<any>();
  const template = item.template || {};
  const formattedDate = item.used_at ? new Date(item.used_at).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  }) : '';

  const handlePress = () => {
    if (template.category === 'Video') {
      navigation.navigate('VideoEditor', { videoUri: template.videoURL });
    } else {
      // Default to photo/image editor for other categories like Social Media / Photo Editor / Svg / logo etc.
      navigation.navigate('PhotoEditor', { imageUri: template.thumbnail });
    }
  };

  return (
    <TouchableOpacity style={cardStyles.card} onPress={handlePress} activeOpacity={0.85}>
      {template.thumbnail ? (
        <Image source={{ uri: template.thumbnail }} style={cardStyles.thumb} resizeMode="cover" />
      ) : (
        <View style={cardStyles.thumbPlaceholder}>
          <Text style={cardStyles.placeholderText}>No Preview</Text>
        </View>
      )}
      <Text style={cardStyles.cardTitle} numberOfLines={1}>{template.name || 'Untitled Design'}</Text>
      <View style={cardStyles.metaRow}>
        <Text style={cardStyles.metaText}>{formattedDate}</Text>
        <Text style={cardStyles.metaText}> • </Text>
        <Text style={cardStyles.metaText}>{template.category || 'Design'}</Text>
      </View>
      <View style={cardStyles.statsRow}>
        <Text style={cardStyles.small} numberOfLines={1}>{template.subCategory || 'Template'}</Text>
        <Text style={cardStyles.small}>{template.orientation || 'custom'}</Text>
      </View>
    </TouchableOpacity>
  );
}

export default function DesignsScreen() {
  const [designs, setDesigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [total, setTotal] = useState(0);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('All');
  const [grid, setGrid] = useState(true);

  const filters = ['All', 'Social Media', 'Custom Size', 'Promotion', 'Business Ads', 'Card Maker'];

  const fetchRecentTemplates = async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true);
    try {
      let userId = 1;
      try {
        const userRes = await api.get('/auth/me');
        if (userRes.data?.user?.id) {
          userId = userRes.data.user.id;
        }
      } catch (err) {
        console.warn('Failed to fetch user ID from auth/me, falling back to 1', err);
      }

      const response = await api.get(`/recent-templates/user/${userId}?limit=50`);
      if (response.data) {
        setDesigns(response.data.recentTemplates || []);
        setTotal(response.data.total || 0);
      }
    } catch (err: any) {
      console.error('Error fetching recent templates:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchRecentTemplates();
  }, []);

  const filteredData = useMemo(() => {
    let result = designs;

    // Filter by Category
    if (filter !== 'All') {
      result = result.filter(
        d => d.template?.category?.toLowerCase() === filter.toLowerCase()
      );
    }

    // Filter by Search Query
    if (query.trim()) {
      result = result.filter(
        d => d.template?.name?.toLowerCase().includes(query.toLowerCase())
      );
    }

    return result;
  }, [designs, filter, query]);

  if (loading) {
    return (
      <SafeAreaView style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#df103f" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <FlatList
          data={filteredData}
          keyExtractor={item => item.id}
          key={grid ? 'grid' : 'list'}
          numColumns={grid ? 2 : 1}
          contentContainerStyle={styles.listContent}
          onRefresh={() => fetchRecentTemplates(true)}
          refreshing={refreshing}
          ListHeaderComponent={
            <View style={styles.headerContainer}>
              <View style={styles.header}>
                <Title style={styles.heading}>All your designs</Title>
                <Text style={styles.count}>{filteredData.length} design(s)</Text>
              </View>

              <View style={styles.controlsRow}>
                <Searchbar
                  placeholder="Search your designs..."
                  value={query}
                  onChangeText={setQuery}
                  style={styles.search}
                  inputStyle={styles.searchInput}
                />
                <View style={styles.viewToggle}>
                  <TouchableOpacity
                    onPress={() => setGrid(true)}
                    style={[styles.toggleBtn, grid ? styles.toggleActive : null]}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.toggleIcon, grid ? styles.toggleTextActive : null]}>▦</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => setGrid(false)}
                    style={[styles.toggleBtn, !grid ? styles.toggleActive : null]}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.toggleIcon, !grid ? styles.toggleTextActive : null]}>☰</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.chipsScroll}
              >
                {filters.map(f => (
                  <Chip
                    key={f}
                    mode="outlined"
                    selected={f === filter}
                    onPress={() => setFilter(f)}
                    style={styles.chip}
                    selectedColor={f === filter ? '#df103f' : '#64748b'}
                    showSelectedOverlay
                  >
                    {f}
                  </Chip>
                ))}
              </ScrollView>
            </View>
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>🎨</Text>
              <Text style={styles.emptyText}>No recent designs found</Text>
              <Text style={styles.emptySub}>
                {query || filter !== 'All'
                  ? "Try adjusting your search terms or filters."
                  : "Start creating projects from the Create tab to see them here!"}
              </Text>
            </View>
          }
          renderItem={({ item }) => <DesignCard item={item} />}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f8fafc' },
  container: { flex: 1 },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8fafc' },
  headerContainer: { paddingHorizontal: 16, paddingTop: 16 },
  header: { marginBottom: 8 },
  heading: { fontSize: 24, fontWeight: '800', color: '#0f172a' },
  count: { color: '#64748b', fontSize: 13, marginTop: 2 },
  controlsRow: { flexDirection: 'row', alignItems: 'center', marginTop: 12, marginBottom: 8 },
  search: { flex: 1, marginRight: 8, height: 44, borderRadius: 12, backgroundColor: '#fff', elevation: 1 },
  searchInput: { minHeight: 0, alignSelf: 'center' },
  viewToggle: { flexDirection: 'row', backgroundColor: '#e2e8f0', padding: 3, borderRadius: 8 },
  toggleBtn: { width: 34, height: 34, justifyContent: 'center', alignItems: 'center', borderRadius: 6 },
  toggleActive: { backgroundColor: '#fff', elevation: 1 },
  toggleIcon: { fontSize: 16, color: '#64748b' },
  toggleTextActive: { color: '#df103f', fontWeight: 'bold' },
  chipsScroll: { paddingVertical: 10, gap: 8 },
  chip: { height: 34, justifyContent: 'center', borderRadius: 18, backgroundColor: '#fff' },
  listContent: { paddingBottom: 40 },
  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, marginTop: 40 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: 16, fontWeight: '700', color: '#334155' },
  emptySub: { fontSize: 12, color: '#64748b', textAlign: 'center', marginTop: 6, maxWidth: 260, lineHeight: 18 },
});

const cardStyles = StyleSheet.create({
  card: { flex: 1, backgroundColor: '#fff', borderRadius: 16, padding: 12, margin: 8, minWidth: 150, borderWidth: 1, borderColor: '#f1f5f9', elevation: 1 },
  thumb: { height: 130, borderRadius: 10, marginBottom: 10, backgroundColor: '#f1f5f9' },
  thumbPlaceholder: { height: 130, borderRadius: 10, marginBottom: 10, backgroundColor: '#f1f5f9', justifyContent: 'center', alignItems: 'center' },
  placeholderText: { color: '#94a3b8', fontSize: 12 },
  cardTitle: { fontWeight: '700', fontSize: 14, color: '#0f172a' },
  metaRow: { flexDirection: 'row', marginTop: 6, alignItems: 'center' },
  metaText: { color: '#94a3b8', fontSize: 11 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10, borderTopWidth: 1, borderTopColor: '#f1f5f9', paddingTop: 8 },
  small: { color: '#64748b', fontSize: 11, fontWeight: '600', maxWidth: '65%' },
});
