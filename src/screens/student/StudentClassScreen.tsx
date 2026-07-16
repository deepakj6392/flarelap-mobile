import React, { useState, useEffect, useMemo } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Linking, TextInput } from 'react-native';
import { Text, Title, Card, Button, SegmentedButtons, Snackbar } from 'react-native-paper';
import { useIsFocused } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { THEME_COLORS } from '../../constants';
import { getStudentSession, getLecturesByCourse } from '../../services/student.service';

export default function StudentClassScreen() {
  const isFocused = useIsFocused();
  const [student, setStudent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('lectures'); // 'lectures' | 'tasks'
  const [dbLectures, setDbLectures] = useState<any[]>([]);
  const [loadingLectures, setLoadingLectures] = useState(false);

  // Task submission states
  const [submittingTaskId, setSubmittingTaskId] = useState<string | null>(null);
  const [submissionUrl, setSubmissionUrl] = useState('');
  const [submissionRemarks, setSubmissionRemarks] = useState('');
  const [localTasks, setLocalTasks] = useState<any[]>([]);
  const [snackbarMessage, setSnackbarMessage] = useState<string | null>(null);

  const loadSession = async () => {
    try {
      const session = await getStudentSession();
      if (session.user) {
        setStudent(session.user);
        loadLectures(session.user.courseType || session.user.department);
      }
    } catch (e) {
      console.error('Error loading session in My Class:', e);
    } finally {
      setLoading(false);
    }
  };

  const loadLectures = async (courseName: string) => {
    if (!courseName) return;
    setLoadingLectures(true);
    try {
      const res = await getLecturesByCourse(courseName);
      if (res && res.success && res.data) {
        setDbLectures(res.data);
      }
    } catch (err) {
      console.error('Error loading lectures:', err);
    } finally {
      setLoadingLectures(false);
    }
  };

  useEffect(() => {
    if (isFocused) {
      loadSession();
    }
  }, [isFocused]);

  // Fallback courses syllabus & tasks data matching the frontend
  const fallbackCourseData = useMemo(() => {
    if (!student) return null;
    const name = (student.courseType || student.department || '').toLowerCase();

    if (name.includes('data science') || name.includes('machine learning') || name.includes('python')) {
      return {
        instructor: "Rajpal",
        instructorTitle: "Senior AI & Data Architect",
        meetLink: "https://meet.google.com/abc-defg-hij",
        timing: "07:30 PM - 09:00 PM (Mon to Fri)",
        lectures: [
          { date: "01/07/2026", topic: "Intro to Python & Anaconda Setup", notes: "Reviewed environment variables and virtual environments." },
          { date: "02/07/2026", topic: "Variables, Operators & Lists", notes: "Covered string operations, mutability, dynamic typing." },
          { date: "03/07/2026", topic: "Control Flows & Loop Logic", notes: "Practiced for/while loops, nested conditionals, break/continue." },
        ],
        tasks: [
          { id: "DS-TASK-01", title: "Jupyter Setup & Speccing", desc: "Setup Python environment locally and print specs.", deadline: "20/07/2026", status: "completed", submission: "https://github.com/student/ds-setup", score: "10/10", remarks: "Great setup!" },
          { id: "DS-TASK-02", title: "Operators & Expressions Lab", desc: "Build Interest, BMI, and Temp calculators.", deadline: "22/07/2026", status: "completed", submission: "https://github.com/student/operators", score: "9/10", remarks: "Nicely calculated." },
          { id: "DS-TASK-03", title: "Fibonacci & Loops Quiz", desc: "Write program to print Fibonacci series using loops.", deadline: "25/07/2026", status: "assigned", submission: null, score: null, remarks: null },
          { id: "DS-TASK-04", title: "Data Wrangling with Pandas", desc: "Load csv files and print averages.", deadline: "30/07/2026", status: "locked", submission: null, score: null, remarks: null }
        ]
      };
    } else if (name.includes('design') || name.includes('graphic') || name.includes('ui/ux')) {
      return {
        instructor: "Bharat Bhushan",
        instructorTitle: "Lead Creative Designer",
        meetLink: "https://meet.google.com/xyz-pdqr-lmn",
        timing: "07:30 PM - 09:00 PM (Mon to Fri)",
        lectures: [
          { date: "01/07/2026", topic: "Introduction to Color Theory", notes: "Understanding contrasting RGB/CMYK, visual hierarchies." },
          { date: "02/07/2026", topic: "Typography & Font Pairing", notes: "Serif, Sans-serif,Script font selections and tracking rules." },
        ],
        tasks: [
          { id: "GD-TASK-01", title: "Contrast Color moodboard", desc: "Build matching palettes for custom templates.", deadline: "20/07/2026", status: "completed", submission: "https://drive.google.com/file/1", score: "10/10", remarks: "Superb contrast!" },
          { id: "GD-TASK-02", title: "Pen Tool vector tracing", desc: "Trace complex outlines inside Adobe Illustrator.", deadline: "25/07/2026", status: "assigned", submission: null, score: null, remarks: null }
        ]
      };
    } else {
      // Fallback Full Stack MERN / Web Development
      return {
        instructor: "Bharat Bhushan",
        instructorTitle: "Chief Software Architect",
        meetLink: "https://meet.google.com/def-ghij-klm",
        timing: "07:30 PM - 09:00 PM (Mon to Fri)",
        lectures: [
          { date: "01/07/2026", topic: "HTML5 Semantic elements", notes: "Reviewed page structures, SEO tags and forms." },
          { date: "02/07/2026", topic: "CSS Flexbox layouts", notes: "Flex sizing, axes alignments, responsive breakpoints." },
        ],
        tasks: [
          { id: "WD-TASK-01", title: "HTML semantic portfolio", desc: "Create structural markup for your resume.", deadline: "20/07/2026", status: "completed", submission: "https://github.com/student/resume", score: "10/10", remarks: "Great structure!" },
          { id: "WD-TASK-02", title: "CSS Flexbox pricing cards", desc: "Responsive card columns using CSS Flexbox.", deadline: "25/07/2026", status: "assigned", submission: null, score: null, remarks: null }
        ]
      };
    }
  }, [student]);

  // Combine local tasks states
  useEffect(() => {
    if (fallbackCourseData?.tasks) {
      setLocalTasks(fallbackCourseData.tasks);
    }
  }, [fallbackCourseData]);

  const lecturesToDisplay = useMemo(() => {
    if (dbLectures && dbLectures.length > 0) {
      return dbLectures.map((l: any) => ({
        date: l.lectureDate || 'N/A',
        topic: l.topic || 'No topic',
        notes: l.notes || 'No notes',
        recording: l.youtubeLink || l.googleDriveLink || null,
      }));
    }
    return (fallbackCourseData?.lectures || []).map((l: any) => ({
      date: l.date,
      topic: l.topic,
      notes: l.notes,
      recording: l.recording || null,
    }));
  }, [dbLectures, fallbackCourseData]);

  const handleOpenLink = (url: string) => {
    if (!url) return;
    Linking.openURL(url).catch(err => console.error("Couldn't open link:", err));
  };

  const handleTaskSubmit = (taskId: string) => {
    if (!submissionUrl.trim()) {
      setSnackbarMessage('Submission URL is required.');
      return;
    }

    // Update locally simulated tasks list
    setLocalTasks(prev => prev.map(t => {
      if (t.id === taskId) {
        return {
          ...t,
          status: 'submitted',
          submission: submissionUrl,
          remarks: submissionRemarks || 'Awaiting instructor review',
        };
      }
      return t;
    }));

    setSnackbarMessage('Assignment submitted successfully!');
    setSubmittingTaskId(null);
    setSubmissionUrl('');
    setSubmissionRemarks('');
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
      {/* Header Info */}
      <View style={styles.classHeader}>
        <Title style={styles.classTitle}>{student?.courseType || student?.department || 'My Classroom'}</Title>
        <Text style={styles.instructorText}>
          Instructor: {fallbackCourseData?.instructor} ({fallbackCourseData?.instructorTitle})
        </Text>
        <Text style={styles.timingText}>Schedules: {fallbackCourseData?.timing}</Text>

        <Button
          mode="contained"
          icon="video"
          onPress={() => handleOpenLink(fallbackCourseData?.meetLink || '')}
          style={styles.meetBtn}
          buttonColor="#16a34a"
        >
          Join Google Meet Class
        </Button>
      </View>

      <View style={styles.tabsWrap}>
        <SegmentedButtons
          value={activeTab}
          onValueChange={setActiveTab}
          buttons={[
            { value: 'lectures', label: 'Lectures & Notes' },
            { value: 'tasks', label: 'Assignments' },
          ]}
          theme={{ colors: { primary: THEME_COLORS.primary } }}
        />
      </View>

      {activeTab === 'lectures' ? (
        <ScrollView contentContainerStyle={styles.scroll}>
          {loadingLectures ? (
            <ActivityIndicator size="small" color={THEME_COLORS.primary} style={{ marginTop: 20 }} />
          ) : lecturesToDisplay.length === 0 ? (
            <Text style={styles.emptyText}>No conducted lectures logged yet.</Text>
          ) : (
            lecturesToDisplay.map((lecture, idx) => (
              <Card key={idx} style={styles.card} mode="outlined">
                <Card.Content>
                  <View style={styles.lectureHeader}>
                    <Text style={styles.lectureDate}>{lecture.date}</Text>
                    <Text style={styles.lectureLabel}>Step {idx + 1}</Text>
                  </View>
                  <Title style={styles.lectureTopic}>{lecture.topic}</Title>
                  <Text style={styles.lectureNotes}>{lecture.notes}</Text>

                  {lecture.recording && (
                    <Button
                      mode="outlined"
                      onPress={() => handleOpenLink(lecture.recording)}
                      style={styles.actionBtn}
                      textColor={THEME_COLORS.primary}
                    >
                      Watch Recording / View Notes
                    </Button>
                  )}
                </Card.Content>
              </Card>
            ))
          )}
        </ScrollView>
      ) : (
        <ScrollView contentContainerStyle={styles.scroll}>
          {localTasks.length === 0 ? (
            <Text style={styles.emptyText}>No task assignments found.</Text>
          ) : (
            localTasks.map((task) => {
              const isSubmitting = submittingTaskId === task.id;
              return (
                <Card key={task.id} style={styles.card} mode="outlined">
                  <Card.Content>
                    <View style={styles.lectureHeader}>
                      <Text style={styles.taskCode}>{task.id}</Text>
                      <View style={[
                        styles.taskBadge,
                        {
                          backgroundColor:
                            task.status === 'completed' ? '#f0fdf4' :
                            task.status === 'submitted' ? '#eff6ff' :
                            task.status === 'assigned' ? '#fffbeb' : '#f1f5f9'
                        }
                      ]}>
                        <Text style={[
                          styles.taskBadgeText,
                          {
                            color:
                              task.status === 'completed' ? '#16a34a' :
                              task.status === 'submitted' ? '#2563eb' :
                              task.status === 'assigned' ? '#d97706' : '#64748b'
                          }
                        ]}>
                          {task.status}
                        </Text>
                      </View>
                    </View>
                    <Title style={styles.taskTitle}>{task.title}</Title>
                    <Text style={styles.taskDesc}>{task.desc}</Text>
                    <Text style={styles.taskDeadline}>Deadline: {task.deadline}</Text>

                    {task.score && (
                      <View style={styles.scoreRow}>
                        <Text style={styles.scoreText}>Score: {task.score}</Text>
                        <Text style={styles.remarksText}>Remarks: {task.remarks}</Text>
                      </View>
                    )}

                    {task.status === 'assigned' && !isSubmitting && (
                      <Button
                        mode="contained"
                        onPress={() => setSubmittingTaskId(task.id)}
                        style={styles.submitActionBtn}
                        buttonColor={THEME_COLORS.primary}
                      >
                        Submit Assignment
                      </Button>
                    )}

                    {isSubmitting && (
                      <View style={styles.submissionForm}>
                        <TextInput
                          placeholder="Submission URL (GitHub / Google Drive)"
                          placeholderTextColor="#94a3b8"
                          value={submissionUrl}
                          onChangeText={setSubmissionUrl}
                          style={styles.subInput}
                        />
                        <TextInput
                          placeholder="Notes or Remarks for the Instructor (Optional)"
                          placeholderTextColor="#94a3b8"
                          value={submissionRemarks}
                          onChangeText={setSubmissionRemarks}
                          style={styles.subInput}
                          multiline
                          numberOfLines={3}
                        />
                        <View style={styles.subActions}>
                          <Button mode="outlined" onPress={() => setSubmittingTaskId(null)} style={styles.subHalfBtn} textColor="#64748b">
                            Cancel
                          </Button>
                          <Button mode="contained" onPress={() => handleTaskSubmit(task.id)} style={styles.subHalfBtn} buttonColor={THEME_COLORS.primary}>
                            Upload
                          </Button>
                        </View>
                      </View>
                    )}

                    {task.status === 'submitted' && (
                      <View style={styles.submittedBox}>
                        <Text style={styles.submittedTitle}>Submitted Link:</Text>
                        <Text style={styles.submittedLink} numberOfLines={1}>{task.submission}</Text>
                        <Text style={styles.submittedRemarks}>Status: Awaiting Review</Text>
                      </View>
                    )}
                  </Card.Content>
                </Card>
              );
            })
          )}
        </ScrollView>
      )}

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
  scroll: {
    padding: 16,
    paddingBottom: 40,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  classHeader: {
    padding: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  classTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 4,
  },
  instructorText: {
    fontSize: 13,
    color: '#475569',
    fontWeight: '600',
    marginBottom: 2,
  },
  timingText: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 12,
  },
  meetBtn: {
    borderRadius: 12,
  },
  tabsWrap: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  card: {
    borderRadius: 16,
    marginBottom: 16,
    borderColor: '#e2e8f0',
    borderWidth: 1,
    backgroundColor: '#ffffff',
  },
  lectureHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  lectureDate: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '600',
  },
  lectureLabel: {
    fontSize: 11,
    color: THEME_COLORS.primary,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  lectureTopic: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
    marginVertical: 4,
  },
  lectureNotes: {
    fontSize: 13,
    color: '#475569',
    lineHeight: 18,
    marginTop: 4,
  },
  actionBtn: {
    borderRadius: 12,
    marginTop: 12,
    borderColor: THEME_COLORS.primary,
  },
  emptyText: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    marginTop: 40,
  },
  taskCode: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '700',
  },
  taskBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  taskBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  taskTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
    marginVertical: 4,
  },
  taskDesc: {
    fontSize: 13,
    color: '#475569',
    lineHeight: 18,
  },
  taskDeadline: {
    fontSize: 11,
    color: '#ef4444',
    fontWeight: '600',
    marginTop: 8,
  },
  submitActionBtn: {
    borderRadius: 12,
    marginTop: 12,
  },
  scoreRow: {
    backgroundColor: '#f8fafc',
    padding: 10,
    borderRadius: 10,
    marginTop: 12,
  },
  scoreText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#16a34a',
  },
  remarksText: {
    fontSize: 12,
    color: '#475569',
    marginTop: 2,
  },
  submissionForm: {
    marginTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingTop: 12,
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
  subActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  subHalfBtn: {
    flex: 0.48,
    borderRadius: 10,
  },
  submittedBox: {
    backgroundColor: '#eff6ff',
    padding: 12,
    borderRadius: 12,
    marginTop: 12,
  },
  submittedTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1e40af',
  },
  submittedLink: {
    fontSize: 12,
    color: '#2563eb',
    marginTop: 2,
    textDecorationLine: 'underline',
  },
  submittedRemarks: {
    fontSize: 11,
    color: '#4b5563',
    marginTop: 4,
  },
});
