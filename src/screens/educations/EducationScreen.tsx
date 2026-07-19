import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, TextInput, ActivityIndicator } from 'react-native';
import { Card, Text, Button, SegmentedButtons, Icon } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '../../services/api.service';
import { THEME_COLORS } from '../../constants';
import { getStudentSession } from '../../services/student.service';

interface CurriculumItem {
  title: string;
  content: string;
}

interface Course {
  id: string;
  category: string;
  programName: string;
  duration: string;
  fee: number;
  eligibility: string;
  curriculum: CurriculumItem[];
  certification: string;
  classTiming: string;
  learningSupport: string;
}

export default function EducationScreen() {
  const navigation = useNavigation();
  const [courses, setCourses] = useState<Course[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedCourseId, setExpandedCourseId] = useState<string | null>(null);

  const fetchCourses = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/courses');
      if (response.data) {
        // Handle response formats (array directly, or wrapped in success object)
        const fetched = Array.isArray(response.data) 
          ? response.data 
          : (response.data.data || response.data.courses || []);
        setCourses(fetched);
      }
    } catch (e: any) {
      console.error('Error fetching courses:', e);
      setError(e?.response?.data?.message || e?.message || 'Failed to load courses');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  const toggleCourse = (id: string) => {
    setExpandedCourseId(prev => prev === id ? null : id);
  };

  const filteredCourses = courses.filter(course => {
    const matchesSearch = course.programName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.eligibility?.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Support category match for 'all', 'training'/'course' under Training tab, and 'internship' under Internship tab
    const matchesCategory = activeTab === 'all'
      ? true
      : activeTab === 'training'
      ? (course.category === 'training' || course.category === 'course')
      : course.category === 'internship';

    return matchesSearch && matchesCategory;
  });

  return (
    <SafeAreaView style={styles.container}>
      {/* Custom Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Education & Programs</Text>
          <Text style={styles.headerSubtitle}>Upgrade your skills with Flarelap</Text>
        </View>
        <TouchableOpacity
          style={styles.portalButton}
          onPress={async () => {
            const session = await getStudentSession();
            if (session.token && session.user) {
              navigation.navigate('StudentDashboard' as never);
            } else {
              navigation.navigate('StudentLogin' as never);
            }
          }}
        >
          <Text style={styles.portalButtonText}>Portal</Text>
        </TouchableOpacity>
      </View>

      {/* Search Input */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search courses or skills..."
          placeholderTextColor="#94a3b8"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <SegmentedButtons
          value={activeTab}
          onValueChange={setActiveTab}
          buttons={[
            { value: 'all', label: 'All' },
            { value: 'training', label: 'Training' },
            { value: 'internship', label: 'Internships' }
          ]}
          theme={{ colors: { primary: THEME_COLORS.primary } }}
        />
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={THEME_COLORS.primary} />
          <Text style={styles.loadingText}>Fetching programs...</Text>
        </View>
      ) : error ? (
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <Button mode="contained" onPress={fetchCourses} style={styles.retryBtn}>
            Retry
          </Button>
        </View>
      ) : filteredCourses.length === 0 ? (
        <ScrollView contentContainerStyle={styles.centerContainer}>
          <Text style={styles.noResultsText}>No courses found matching your criteria.</Text>
          <Button mode="outlined" onPress={() => { setSearchQuery(''); setActiveTab('all'); }} style={styles.retryBtn}>
            Reset Filters
          </Button>
        </ScrollView>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {filteredCourses.map(course => {
            const isExpanded = expandedCourseId === course.id;
            return (
              <Card key={course.id} style={styles.card} mode="outlined">
                <Card.Content>
                  <View style={styles.courseHeader}>
                    <Text style={styles.courseName}>{course.programName}</Text>
                    <View style={[styles.badge, { backgroundColor: course.category === 'internship' ? '#fdf2f8' : '#eff6ff' }]}>
                      <Text style={[styles.badgeText, { color: course.category === 'internship' ? '#db2777' : '#2563eb' }]}>
                        {course.category === 'internship' ? 'Internship' : 'Training'}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.detailsRow}>
                    <View style={styles.detailsCol}>
                      <Text style={styles.detailLabel}>Duration</Text>
                      <Text style={styles.detailVal}>{course.duration}</Text>
                    </View>
                    <View style={styles.detailsCol}>
                      <Text style={styles.detailLabel}>Fee</Text>
                      <Text style={styles.detailVal}>₹{course.fee?.toLocaleString('en-IN') || 'Free'}</Text>
                    </View>
                    <View style={styles.detailsCol}>
                      <Text style={styles.detailLabel}>Certificate</Text>
                      <Text style={styles.detailVal} numberOfLines={1}>Yes</Text>
                    </View>
                  </View>

                  {isExpanded && (
                    <View style={styles.expandedContent}>
                      <View style={styles.divider} />
                      
                      <View style={styles.infoSection}>
                        <Text style={styles.sectionTitle}>Eligibility</Text>
                        <Text style={styles.sectionText}>{course.eligibility || 'Open to all'}</Text>
                      </View>

                      {course.classTiming && (
                        <View style={styles.infoSection}>
                          <Text style={styles.sectionTitle}>Schedule</Text>
                          <Text style={styles.sectionText}>{course.classTiming}</Text>
                        </View>
                      )}

                      {course.learningSupport && (
                        <View style={styles.infoSection}>
                          <Text style={styles.sectionTitle}>Learning Support</Text>
                          <Text style={styles.sectionText}>{course.learningSupport}</Text>
                        </View>
                      )}

                      {course.certification && (
                        <View style={styles.infoSection}>
                          <Text style={styles.sectionTitle}>Certification</Text>
                          <Text style={styles.sectionText}>{course.certification}</Text>
                        </View>
                      )}

                      {course.curriculum && Array.isArray(course.curriculum) && course.curriculum.length > 0 && (
                        <View style={styles.infoSection}>
                          <Text style={styles.sectionTitle}>Curriculum</Text>
                          {course.curriculum.map((curr, idx) => (
                            <View key={idx} style={styles.curriculumRow}>
                              <View style={styles.curriculumDotContainer}>
                                <View style={styles.curriculumDot} />
                                {idx < course.curriculum.length - 1 && <View style={styles.curriculumLine} />}
                              </View>
                              <View style={styles.curriculumTextContainer}>
                                <Text style={styles.curriculumTitle}>{curr.title}</Text>
                                <Text style={styles.curriculumDesc}>{curr.content}</Text>
                              </View>
                            </View>
                          ))}
                        </View>
                      )}

                      <Button
                        mode="contained"
                        onPress={() => (navigation as any).navigate('StudentRegister', { programId: course.id })}
                        style={styles.enrollBtn}
                        buttonColor="#16a34a"
                      >
                        Enroll / Register Now
                      </Button>
                    </View>
                  )}

                  <Button
                    mode={isExpanded ? 'outlined' : 'contained'}
                    onPress={() => toggleCourse(course.id)}
                    style={styles.expandButton}
                    textColor={isExpanded ? THEME_COLORS.primary : '#ffffff'}
                    buttonColor={isExpanded ? 'transparent' : THEME_COLORS.primary}
                  >
                    {isExpanded ? 'Show Less' : 'View Curriculum & Details'}
                  </Button>
                </Card.Content>
              </Card>
            );
          })}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    backgroundColor: '#ffffff',
  },
  backButton: {
    padding: 8,
    borderRadius: 8,
  },
  backArrow: {
    fontSize: 24,
    color: '#0f172a',
    fontWeight: 'bold',
  },
  headerTitleContainer: {
    alignItems: 'center',
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchInput: {
    height: 48,
    backgroundColor: '#ffffff',
    borderRadius: 24,
    paddingHorizontal: 20,
    fontSize: 15,
    color: '#0f172a',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  tabsContainer: {
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 12,
    color: '#64748b',
    fontSize: 15,
  },
  errorText: {
    color: '#ef4444',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 16,
  },
  noResultsText: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryBtn: {
    borderRadius: 20,
    backgroundColor: THEME_COLORS.primary,
  },
  card: {
    marginBottom: 16,
    borderRadius: 16,
    backgroundColor: '#ffffff',
    borderColor: '#e2e8f0',
    borderWidth: 1,
    elevation: 2,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  courseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  courseName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
    flex: 1,
    marginRight: 8,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  detailsCol: {
    flex: 1,
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 11,
    color: '#0856c3ff',
    fontWeight: 'bold',
    marginBottom: 4,
  },
  detailVal: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0f172a',
  },
  expandButton: {
    borderRadius: 24,
    marginTop: 8,
  },
  expandedContent: {
    marginBottom: 16,
  },
  divider: {
    height: 1,
    backgroundColor: '#f1f5f9',
    marginVertical: 16,
  },
  infoSection: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 6,
  },
  sectionText: {
    fontSize: 13,
    color: '#475569',
    lineHeight: 18,
  },
  curriculumRow: {
    flexDirection: 'row',
    marginTop: 8,
  },
  curriculumDotContainer: {
    alignItems: 'center',
    width: 20,
    marginRight: 8,
  },
  curriculumDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: THEME_COLORS.primary,
    marginTop: 6,
  },
  curriculumLine: {
    width: 1,
    flex: 1,
    backgroundColor: '#cbd5e1',
    marginTop: 4,
  },
  curriculumTextContainer: {
    flex: 1,
    paddingBottom: 12,
  },
  curriculumTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1e293b',
  },
  curriculumDesc: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
    lineHeight: 16,
  },
  portalButton: {
    backgroundColor: '#eff6ff',
    borderColor: '#bfdbfe',
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  portalButtonText: {
    fontSize: 12,
    color: '#2563eb',
    fontWeight: '700',
  },
  enrollBtn: {
    marginTop: 16,
    borderRadius: 24,
  },
});
