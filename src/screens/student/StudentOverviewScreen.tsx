import React, { useState, useEffect, useMemo } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Dimensions } from 'react-native';
import { Text, Title, Card, Avatar, Button } from 'react-native-paper';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { THEME_COLORS } from '../../constants';
import { getStudentSession, getStudentProfile } from '../../services/student.service';

export default function StudentOverviewScreen() {
  const navigation = useNavigation();
  const isFocused = useIsFocused();
  const [student, setStudent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);

  // Dynamic greeting based on time of day
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  }, []);

  const loadSession = async () => {
    setLoading(true);
    try {
      const session = await getStudentSession();
      if (!session.token || !session.user) {
        // Not logged in as student, navigate to Student Login
        // @ts-ignore
        navigation.navigate('StudentLogin');
        return;
      }
      setToken(session.token);
      setStudent(session.user);

      // Sync latest profile in the background
      try {
        const freshProfile = await getStudentProfile(session.user.id, session.token);
        if (freshProfile?.student) {
          setStudent(freshProfile.student);
        }
      } catch (ex) {
        console.error('Failed to sync student profile:', ex);
      }
    } catch (e) {
      console.error('Error loading student session:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isFocused) {
      loadSession();
    }
  }, [isFocused]);

  const progressStats = useMemo(() => {
    if (!student) return { percent: 0, daysLeft: 0, totalDays: 0 };
    try {
      const start = new Date(student.startDate || student.createdAt);
      const end = new Date(student.endDate || new Date(start).setMonth(start.getMonth() + 3));
      const today = new Date();

      const totalMs = end.getTime() - start.getTime();
      const elapsedMs = today.getTime() - start.getTime();

      const totalDays = Math.max(1, Math.round(totalMs / (1000 * 60 * 60 * 24)));
      const elapsedDays = Math.round(elapsedMs / (1000 * 60 * 60 * 24));

      const percent = Math.min(100, Math.max(0, Math.round((elapsedDays / totalDays) * 100)));
      const daysLeft = Math.max(0, Math.round((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)));

      return { percent, daysLeft, totalDays };
    } catch (e) {
      return { percent: 0, daysLeft: 0, totalDays: 0 };
    }
  }, [student]);

  const formatDate = (dateStr: string) => {
    if (!dateStr) return 'N/A';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.centerContainer}>
        <ActivityIndicator size="large" color={THEME_COLORS.primary} />
        <Text style={styles.loadingText}>Loading Dashboard...</Text>
      </SafeAreaView>
    );
  }

  if (!student) return null;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        
        {/* Welcome Greeting Banner */}
        <Card style={styles.welcomeCard}>
          <Card.Content style={styles.welcomeContent}>
            <View style={styles.welcomeTextWrap}>
              <Text style={styles.welcomeGreeting}>{greeting},</Text>
              <Title style={styles.welcomeName}>{student.firstName} {student.lastName}! 👋</Title>
              <Text style={styles.welcomeSub}>
                Welcome back to your workspace. Keep track of your learning modules, class timetable, and credentials.
              </Text>
            </View>
            <View style={styles.avatarWrap}>
              <Avatar.Text 
                size={54} 
                label={student.firstName ? student.firstName.charAt(0).toUpperCase() : 'S'} 
                style={styles.avatar}
                labelStyle={styles.avatarLabel}
              />
            </View>
          </Card.Content>
        </Card>

        {/* Branded Graphical ID Card Mockup */}
        <Title style={styles.sectionTitle}>Digital Student Identity</Title>
        <Card style={styles.idCard}>
          <View style={styles.idCardHeader}>
            <Text style={styles.idHeaderCompany}>FLARELAP ACADEMY</Text>
            <Text style={styles.idHeaderSub}>Student Identity Card</Text>
          </View>
          
          <Card.Content style={styles.idCardBody}>
            <View style={styles.idCardRow}>
              <Avatar.Text 
                size={72} 
                label={student.firstName ? student.firstName.charAt(0).toUpperCase() : 'S'}
                style={styles.idAvatar}
                labelStyle={styles.idAvatarText}
              />
              <View style={styles.idMeta}>
                <Text style={styles.idName}>{student.firstName} {student.lastName}</Text>
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{student.programType || 'Internship'}</Text>
                </View>
              </View>
            </View>

            <View style={styles.idDetailsContainer}>
              <View style={styles.idDetailsRow}>
                <Text style={styles.idLabel}>STUDENT ID:</Text>
                <Text style={styles.idValue}>{student.userId || student.roll_number || 'N/A'}</Text>
              </View>
              <View style={styles.idDetailsRow}>
                <Text style={styles.idLabel}>DEPARTMENT:</Text>
                <Text style={styles.idValue} numberOfLines={1}>{student.courseType || student.department || 'Web Development'}</Text>
              </View>
              <View style={styles.idDetailsRow}>
                <Text style={styles.idLabel}>VALIDITY:</Text>
                <Text style={styles.idValue}>{formatDate(student.startDate)} - {formatDate(student.endDate)}</Text>
              </View>
            </View>
          </Card.Content>

          <View style={styles.idCardFooter}>
            <Text style={styles.idFooterText}>Verify at: www.flarelap.com</Text>
          </View>
        </Card>

        {/* Progress Tracker Card */}
        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.progressHeader}>
              <View>
                <Text style={styles.cardSectionTitle}>Program Timeline Progress</Text>
                <Text style={styles.cardSectionSub}>Elapsed duration tracking</Text>
              </View>
              <View style={styles.daysLeftBadge}>
                <Text style={styles.daysLeftText}>{progressStats.daysLeft} Days Left</Text>
              </View>
            </View>

            <View style={styles.progressContainer}>
              <View style={styles.progressBarBg}>
                <View style={[styles.progressBarFill, { width: `${progressStats.percent}%` }]} />
              </View>
              <View style={styles.progressLabels}>
                <Text style={styles.progressTimeLabel}>Day 1</Text>
                <Text style={styles.progressPercent}>{progressStats.percent}% Elapsed</Text>
                <Text style={styles.progressTimeLabel}>{progressStats.totalDays} Days Max</Text>
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* Metrics Grid */}
        <Title style={styles.sectionTitle}>Workspace Metrics</Title>
        <View style={styles.grid}>
          <View style={styles.gridCol}>
            <Card style={styles.metricCard}>
              <Card.Content style={styles.metricContent}>
                <Text style={styles.metricLabel}>Duration</Text>
                <Text style={styles.metricVal}>{student.durationValue || '3'} {student.durationType || 'Month'}(s)</Text>
              </Card.Content>
            </Card>
          </View>
          <View style={styles.gridCol}>
            <Card style={styles.metricCard}>
              <Card.Content style={styles.metricContent}>
                <Text style={styles.metricLabel}>Commence</Text>
                <Text style={styles.metricVal} numberOfLines={1}>{formatDate(student.startDate)}</Text>
              </Card.Content>
            </Card>
          </View>
        </View>

        <View style={styles.grid}>
          <View style={styles.gridCol}>
            <Card style={styles.metricCard}>
              <Card.Content style={styles.metricContent}>
                <Text style={styles.metricLabel}>Stream Type</Text>
                <Text style={styles.metricVal}>{student.programType || 'Internship'}</Text>
              </Card.Content>
            </Card>
          </View>
          <View style={styles.gridCol}>
            <Card style={styles.metricCard}>
              <Card.Content style={styles.metricContent}>
                <Text style={styles.metricLabel}>Institution</Text>
                <Text style={styles.metricVal} numberOfLines={1}>{student.collegeName || 'N/A'}</Text>
              </Card.Content>
            </Card>
          </View>
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scroll: {
    padding: 16,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  loadingText: {
    marginTop: 12,
    color: '#64748b',
    fontSize: 15,
  },
  welcomeCard: {
    borderRadius: 24,
    backgroundColor: '#0f172a',
    elevation: 4,
    marginBottom: 20,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  welcomeContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 20,
  },
  welcomeTextWrap: {
    flex: 1,
    paddingRight: 8,
  },
  welcomeGreeting: {
    fontSize: 13,
    color: '#94a3b8',
    fontWeight: '500',
  },
  welcomeName: {
    fontSize: 20,
    fontWeight: '800',
    color: '#ffffff',
    marginVertical: 4,
  },
  welcomeSub: {
    fontSize: 12,
    color: '#cbd5e1',
    lineHeight: 18,
    marginTop: 4,
  },
  avatarWrap: {
    marginLeft: 12,
  },
  avatar: {
    backgroundColor: '#3b82f6',
  },
  avatarLabel: {
    fontWeight: 'bold',
    color: '#ffffff',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1e293b',
    marginTop: 8,
    marginBottom: 12,
    paddingLeft: 4,
  },
  idCard: {
    borderRadius: 20,
    backgroundColor: '#ffffff',
    borderColor: '#0f172a',
    borderWidth: 2,
    overflow: 'hidden',
    marginBottom: 20,
    elevation: 3,
  },
  idCardHeader: {
    backgroundColor: '#0f172a',
    alignItems: 'center',
    paddingVertical: 12,
  },
  idHeaderCompany: {
    fontSize: 12,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: 2,
  },
  idHeaderSub: {
    fontSize: 8,
    color: '#94a3b8',
    textTransform: 'uppercase',
    marginTop: 2,
    letterSpacing: 1,
  },
  idCardBody: {
    paddingTop: 16,
    paddingBottom: 8,
  },
  idCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  idAvatar: {
    backgroundColor: '#f1f5f9',
    borderColor: '#e2e8f0',
    borderWidth: 2,
  },
  idAvatarText: {
    color: '#0f172a',
    fontWeight: '800',
  },
  idMeta: {
    marginLeft: 16,
    flex: 1,
  },
  idName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
  },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: '#eff6ff',
    borderColor: '#bfdbfe',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginTop: 4,
  },
  badgeText: {
    fontSize: 9,
    color: '#2563eb',
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  idDetailsContainer: {
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingTop: 12,
  },
  idDetailsRow: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  idLabel: {
    width: 90,
    fontSize: 10,
    color: '#64748b',
    fontWeight: '700',
  },
  idValue: {
    flex: 1,
    fontSize: 11,
    color: '#0f172a',
    fontWeight: '600',
  },
  idCardFooter: {
    backgroundColor: '#f8fafc',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    alignItems: 'center',
    paddingVertical: 8,
  },
  idFooterText: {
    fontSize: 9,
    color: '#64748b',
    fontWeight: '500',
  },
  card: {
    borderRadius: 16,
    backgroundColor: '#ffffff',
    borderColor: '#e2e8f0',
    borderWidth: 1,
    marginBottom: 20,
    elevation: 1,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  cardSectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
  },
  cardSectionSub: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  daysLeftBadge: {
    backgroundColor: '#f1f5f9',
    borderColor: '#e2e8f0',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  daysLeftText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#334155',
  },
  progressContainer: {
    marginTop: 16,
  },
  progressBarBg: {
    height: 8,
    backgroundColor: '#f1f5f9',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '105%',
    backgroundColor: '#3b82f6',
    borderRadius: 4,
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  progressTimeLabel: {
    fontSize: 9,
    color: '#94a3b8',
    fontWeight: '700',
  },
  progressPercent: {
    fontSize: 10,
    fontWeight: '700',
    color: '#3b82f6',
    backgroundColor: '#eff6ff',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  grid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  gridCol: {
    flex: 0.48,
  },
  metricCard: {
    borderRadius: 16,
    borderColor: '#e2e8f0',
    borderWidth: 1,
    elevation: 0,
    backgroundColor: '#ffffff',
  },
  metricContent: {
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  metricLabel: {
    fontSize: 10,
    color: '#64748b',
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  metricVal: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0f172a',
    marginTop: 4,
  },
});
