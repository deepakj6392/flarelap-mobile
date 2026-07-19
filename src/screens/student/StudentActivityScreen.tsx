import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, TextInput } from 'react-native';
import { Text, Title, Card, Snackbar } from 'react-native-paper';
import { useIsFocused } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path, Polyline } from 'react-native-svg';
import { THEME_COLORS } from '../../constants';
import { getStudentSession, getStudentActivities, addStudentActivity } from '../../services/student.service';

// Custom SVG Icons
const ActivityIcon = ({ color = '#64748b', size = 20 }: { color?: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M22 12h-4l-3 9L9 3l-3 9H2" />
  </Svg>
);

const SaveIcon = ({ color = '#ffffff', size = 16 }: { color?: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
    <Polyline points="17 21 17 13 7 13 7 21" />
    <Polyline points="7 3 7 8 15 8" />
  </Svg>
);

export default function StudentActivityScreen() {
  const isFocused = useIsFocused();
  const [student, setStudent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activities, setActivities] = useState<any[]>([]);
  const [loadingActivities, setLoadingActivities] = useState(false);
  const [submittingActivity, setSubmittingActivity] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState<string | null>(null);

  // Form fields for new activity
  const [activityDate, setActivityDate] = useState(new Date().toISOString().split('T')[0]);
  const [activityTarget, setActivityTarget] = useState('');
  const [activityDesc, setActivityDesc] = useState('');
  const [activityChallenges, setActivityChallenges] = useState('');
  const [activityRemark, setActivityRemark] = useState('');

  const loadSession = async () => {
    try {
      const session = await getStudentSession();
      if (session.user) {
        setStudent(session.user);
        fetchStudentActivitiesList(session.user.id.toString());
      }
    } catch (e) {
      console.error('Error loading session in Activity Logbook:', e);
    } finally {
      setLoading(false);
    }
  };

  const fetchStudentActivitiesList = async (studentId: string) => {
    setLoadingActivities(true);
    try {
      const res = await getStudentActivities(studentId);
      if (res) {
        setActivities(res);
      }
    } catch (err) {
      console.error('Error fetching student activities list:', err);
    } finally {
      setLoadingActivities(false);
    }
  };

  useEffect(() => {
    if (isFocused) {
      loadSession();
    }
  }, [isFocused]);

  const handleActivitySubmit = async () => {
    if (!activityDesc.trim()) {
      setSnackbarMessage('Activity description is required.');
      return;
    }

    setSubmittingActivity(true);
    try {
      await addStudentActivity({
        studentId: student.id,
        date: activityDate,
        todayTarget: activityTarget.trim(),
        activityDescription: activityDesc.trim(),
        challenges: activityChallenges.trim(),
        remark: activityRemark.trim()
      });

      setSnackbarMessage('Daily activity report submitted successfully!');
      
      // Reset form fields
      setActivityTarget('');
      setActivityDesc('');
      setActivityChallenges('');
      setActivityRemark('');
      
      // Refresh list
      fetchStudentActivitiesList(student.id.toString());
    } catch (err) {
      console.error('Error submitting activity report:', err);
      setSnackbarMessage('Failed to submit activity report.');
    } finally {
      setSubmittingActivity(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.centerContainer}>
        <ActivityIndicator size="large" color={THEME_COLORS.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.mainScroll} keyboardShouldPersistTaps="handled">
        {/* Activity Header Banner */}
        <View style={styles.headerBanner}>
          <View style={styles.headerIconContainer}>
            <ActivityIcon color="#ffffff" size={24} />
          </View>
          <View style={styles.headerTextWrap}>
            <Title style={styles.headerTitle}>Activity Logbook</Title>
            <Text style={styles.headerSubtitle}>Submit and track your daily training tasks, active targets, and logbook status.</Text>
          </View>
        </View>

        <View style={styles.contentWrap}>
          {/* Submit Daily Work Report Form */}
          <Card style={styles.card} mode="outlined">
            <Card.Content>
              <Title style={styles.activitySectionTitle}>✍️ Submit Daily Work Report</Title>
              
              <Text style={styles.inputLabel}>Work Date</Text>
              <TextInput
                value={activityDate}
                onChangeText={setActivityDate}
                style={styles.subInput}
                placeholder="YYYY-MM-DD"
                placeholderTextColor="#94a3b8"
              />

              <Text style={styles.inputLabel}>Today's Target (Max 50 Words)</Text>
              <TextInput
                value={activityTarget}
                onChangeText={setActivityTarget}
                style={styles.subInput}
                placeholder="What was your target for today?"
                placeholderTextColor="#94a3b8"
                multiline
                numberOfLines={2}
              />

              <Text style={styles.inputLabel}>Description of Activity (Max 200 Words) *</Text>
              <TextInput
                value={activityDesc}
                onChangeText={setActivityDesc}
                style={styles.subInput}
                placeholder="Provide details on what you achieved today (e.g. built modules, fixed routes)..."
                placeholderTextColor="#94a3b8"
                multiline
                numberOfLines={4}
              />

              <Text style={styles.inputLabel}>Challenges / Blocks (Optional)</Text>
              <TextInput
                value={activityChallenges}
                onChangeText={setActivityChallenges}
                style={styles.subInput}
                placeholder="Explain any blockers or challenges faced..."
                placeholderTextColor="#94a3b8"
                multiline
                numberOfLines={2}
              />

              <Text style={styles.inputLabel}>Remarks / Notes (Optional)</Text>
              <TextInput
                value={activityRemark}
                onChangeText={setActivityRemark}
                style={styles.subInput}
                placeholder="Additional notes if any..."
                placeholderTextColor="#94a3b8"
                multiline
                numberOfLines={2}
              />

              <TouchableOpacity
                onPress={handleActivitySubmit}
                activeOpacity={0.8}
                style={[styles.meetBtn, { backgroundColor: THEME_COLORS.primary, marginTop: 8 }]}
                disabled={submittingActivity}
              >
                <SaveIcon color="#ffffff" size={16} />
                <Text style={styles.meetBtnText}>{submittingActivity ? 'Submitting...' : 'Submit Activity'}</Text>
              </TouchableOpacity>
            </Card.Content>
          </Card>

          {/* Activity Logs History */}
          <View style={styles.logsHeaderWrap}>
            <Title style={styles.activitySectionTitle}>📋 Activity Logs History</Title>
            <Text style={styles.logsSubtitle}>List of all daily activity submittals and login/logout times.</Text>
          </View>

          {loadingActivities ? (
            <ActivityIndicator size="small" color={THEME_COLORS.primary} style={{ marginTop: 20 }} />
          ) : activities.length === 0 ? (
            <Text style={styles.emptyText}>No daily activities logged yet.</Text>
          ) : (
            activities.map((act: any, actIdx: number) => (
              <Card key={act.id || actIdx} style={styles.card} mode="outlined">
                <Card.Content>
                  <View style={styles.activityLogHeader}>
                    <View style={styles.activityLogDateWrap}>
                      <View style={styles.dateBlock}>
                        <Text style={styles.dateBlockText}>
                          {act.date ? new Date(act.date).getDate() : '-'}
                        </Text>
                      </View>
                      <Text style={styles.activityLogDateText}>{act.date}</Text>
                    </View>
                    <View style={styles.workHoursBadgeRow}>
                      <View style={styles.workHoursBadgeIn}>
                        <Text style={styles.workHoursBadgeTextIn}>IN {act.logInTime || '--:--'}</Text>
                      </View>
                      <View style={styles.workHoursBadgeOut}>
                        <Text style={styles.workHoursBadgeTextOut}>OUT {act.logOutTime || '--:--'}</Text>
                      </View>
                    </View>
                  </View>

                  <View style={styles.logDetailRow}>
                    <Text style={styles.logDetailLabel}>Description:</Text>
                    <Text style={styles.logDetailValue}>{act.activityDescription}</Text>
                  </View>

                  {act.todayTarget ? (
                    <View style={styles.logDetailRow}>
                      <Text style={styles.logDetailLabel}>Target:</Text>
                      <Text style={styles.logDetailValue}>{act.todayTarget}</Text>
                    </View>
                  ) : null}

                  {act.challenges ? (
                    <View style={styles.logDetailRow}>
                      <Text style={styles.logDetailLabel}>Challenges:</Text>
                      <Text style={styles.logDetailValue}>{act.challenges}</Text>
                    </View>
                  ) : null}

                  {act.remark ? (
                    <View style={styles.logDetailRow}>
                      <Text style={styles.logDetailLabel}>Remarks:</Text>
                      <Text style={styles.logDetailValue}>{act.remark}</Text>
                    </View>
                  ) : null}
                </Card.Content>
              </Card>
            ))
          )}
        </View>
      </ScrollView>

      <Snackbar
        visible={snackbarMessage !== null}
        onDismiss={() => setSnackbarMessage(null)}
        duration={3000}
      >
        {snackbarMessage}
      </Snackbar>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  mainScroll: {
    paddingBottom: 40,
  },
  headerBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0f172a',
    padding: 20,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 20,
  },
  headerIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#2563eb',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  headerTextWrap: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#ffffff',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 2,
    lineHeight: 16,
  },
  contentWrap: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  card: {
    borderRadius: 16,
    marginBottom: 16,
    borderColor: '#e2e8f0',
    borderWidth: 1,
    backgroundColor: '#ffffff',
  },
  activitySectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#475569',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
    marginLeft: 2,
  },
  subInput: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: '#0f172a',
    backgroundColor: '#f8fafc',
    marginBottom: 12,
    textAlignVertical: 'top',
  },
  meetBtn: {
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 44,
  },
  meetBtnText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 14,
    marginLeft: 8,
  },
  logsHeaderWrap: {
    marginTop: 12,
    marginBottom: 16,
  },
  logsSubtitle: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '600',
    marginTop: 2,
  },
  emptyText: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    marginTop: 40,
  },
  activityLogHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    paddingBottom: 10,
    marginBottom: 10,
  },
  activityLogDateWrap: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateBlock: {
    width: 32,
    height: 32,
    backgroundColor: '#eff6ff',
    borderColor: '#bfdbfe',
    borderWidth: 1,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  dateBlockText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#2563eb',
  },
  activityLogDateText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
  },
  workHoursBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  workHoursBadgeIn: {
    backgroundColor: '#f0fdf4',
    borderColor: '#bbf7d0',
    borderWidth: 1,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginRight: 4,
  },
  workHoursBadgeTextIn: {
    fontSize: 9,
    fontWeight: '800',
    color: '#15803d',
  },
  workHoursBadgeOut: {
    backgroundColor: '#fef2f2',
    borderColor: '#fecaca',
    borderWidth: 1,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  workHoursBadgeTextOut: {
    fontSize: 9,
    fontWeight: '800',
    color: '#b91c1c',
  },
  logDetailRow: {
    marginBottom: 8,
  },
  logDetailLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748b',
    marginBottom: 2,
  },
  logDetailValue: {
    fontSize: 12,
    color: '#334155',
    lineHeight: 16,
  },
});
