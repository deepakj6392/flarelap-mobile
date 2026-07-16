import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, TextInput } from 'react-native';
import { Text, Title, Card, Button, SegmentedButtons, Snackbar } from 'react-native-paper';
import { useIsFocused } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { THEME_COLORS } from '../../constants';
import { getStudentSession, getStudentTickets, createStudentTicket } from '../../services/student.service';

export default function StudentSupportScreen() {
  const isFocused = useIsFocused();
  const [student, setStudent] = useState<any>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [tickets, setTickets] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Form states
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [category, setCategory] = useState('General Inquiry');
  const [submitting, setSubmitting] = useState(false);

  const [snackbarMessage, setSnackbarMessage] = useState<string | null>(null);

  const loadSession = async () => {
    try {
      const session = await getStudentSession();
      if (session.user && session.token) {
        setStudent(session.user);
        setToken(session.token);
        fetchTicketsHistory(session.user.id, session.token);
      }
    } catch (e) {
      console.error('Error loading session in Support:', e);
    } finally {
      setLoading(false);
    }
  };

  const fetchTicketsHistory = async (studentId: string, authToken: string) => {
    setLoadingHistory(true);
    try {
      const res = await getStudentTickets(studentId, authToken);
      if (res) {
        // Response is usually an array of tickets
        setTickets(Array.isArray(res) ? res : (res.data || []));
      }
    } catch (err) {
      console.error('Error loading tickets:', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    if (isFocused) {
      loadSession();
    }
  }, [isFocused]);

  const handleTicketSubmit = async () => {
    if (!subject.trim() || !message.trim()) {
      setSnackbarMessage('Subject and Message are required.');
      return;
    }
    if (!student?.id || !token) {
      setSnackbarMessage('Authentication session not found.');
      return;
    }

    setSubmitting(true);
    try {
      await createStudentTicket({
        studentId: student.id,
        subject,
        message,
        category,
      }, token);
      setSnackbarMessage('Ticket submitted successfully! Admin will respond shortly.');
      setSubject('');
      setMessage('');
      setCategory('General Inquiry');
      
      // Reload tickets
      fetchTicketsHistory(student.id, token);
    } catch (err: any) {
      console.error('Create ticket error:', err);
      setSnackbarMessage(err?.response?.data?.message || err?.message || 'Failed to submit ticket.');
    } finally {
      setSubmitting(false);
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
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        {/* Support Request Form Card */}
        <Card style={styles.card} mode="outlined">
          <Card.Content>
            <Title style={styles.formTitle}>Raise a Ticket / Inquiry</Title>
            <Text style={styles.formSub}>Need support with fees, schedules or classes? Let us know.</Text>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Select Category</Text>
              <SegmentedButtons
                value={category}
                onValueChange={setCategory}
                buttons={[
                  { value: 'General Inquiry', label: 'General' },
                  { value: 'Academic Support', label: 'Academic' },
                  { value: 'Billing & Payments', label: 'Billing' },
                ]}
                theme={{ colors: { primary: THEME_COLORS.primary } }}
              />
            </View>

            <TextInput
              placeholder="Enter brief subject"
              placeholderTextColor="#94a3b8"
              value={subject}
              onChangeText={setSubject}
              style={styles.subInput}
            />

            <TextInput
              placeholder="Explain your problem, question or inquiry in detail..."
              placeholderTextColor="#94a3b8"
              value={message}
              onChangeText={setMessage}
              style={[styles.subInput, styles.textArea]}
              multiline
              numberOfLines={4}
            />

            <Button
              mode="contained"
              onPress={handleTicketSubmit}
              disabled={submitting}
              loading={submitting}
              style={styles.submitBtn}
              buttonColor={THEME_COLORS.primary}
            >
              Submit Ticket
            </Button>
          </Card.Content>
        </Card>

        {/* Support Tickets History */}
        <Title style={styles.sectionTitle}>Inquiry History</Title>

        {loadingHistory ? (
          <ActivityIndicator size="small" color={THEME_COLORS.primary} style={{ marginTop: 20 }} />
        ) : tickets.length === 0 ? (
          <Text style={styles.emptyText}>You haven't raised any support tickets yet.</Text>
        ) : (
          tickets.map((ticket) => (
            <Card key={ticket.id} style={styles.historyCard} mode="outlined">
              <Card.Content>
                <View style={styles.ticketHeader}>
                  <View style={styles.badgeCol}>
                    <View style={styles.categoryBadge}>
                      <Text style={styles.categoryText}>{ticket.category}</Text>
                    </View>
                  </View>

                  <View style={[
                    styles.statusBadge,
                    {
                      backgroundColor:
                        ticket.status === 'Resolved' ? '#e6f4ea' :
                        ticket.status === 'In Progress' ? '#e8f0fe' : '#fef3c7'
                    }
                  ]}>
                    <Text style={[
                      styles.statusText,
                      {
                        color:
                          ticket.status === 'Resolved' ? '#137333' :
                          ticket.status === 'In Progress' ? '#1a73e8' : '#d97706'
                      }
                    ]}>
                      {ticket.status || 'Pending'}
                    </Text>
                  </View>
                </View>

                <Title style={styles.ticketSubject}>{ticket.subject}</Title>
                <Text style={styles.ticketMsg}>{ticket.message}</Text>

                {ticket.adminRemarks && (
                  <View style={styles.remarksBox}>
                    <Text style={styles.remarksTitle}>Response from Admin:</Text>
                    <Text style={styles.remarksContent}>{ticket.adminRemarks}</Text>
                  </View>
                )}
              </Card.Content>
            </Card>
          ))
        )}

        <View style={{ height: 32 }} />
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
  scroll: {
    padding: 16,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  card: {
    borderRadius: 16,
    borderColor: '#e2e8f0',
    borderWidth: 1,
    backgroundColor: '#ffffff',
    marginBottom: 24,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
  },
  formSub: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 16,
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748b',
    textTransform: 'uppercase',
    marginBottom: 8,
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
  },
  textArea: {
    textAlignVertical: 'top',
    height: 100,
  },
  submitBtn: {
    borderRadius: 12,
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 12,
    paddingLeft: 4,
  },
  emptyText: {
    fontSize: 13,
    color: '#64748b',
    textAlign: 'center',
    marginTop: 20,
  },
  historyCard: {
    borderRadius: 16,
    borderColor: '#e2e8f0',
    borderWidth: 1,
    backgroundColor: '#ffffff',
    marginBottom: 12,
  },
  ticketHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  badgeCol: {
    flex: 1,
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#f1f5f9',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  categoryText: {
    fontSize: 10,
    color: '#475569',
    fontWeight: '600',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
  },
  ticketSubject: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
    marginVertical: 4,
  },
  ticketMsg: {
    fontSize: 13,
    color: '#475569',
    lineHeight: 18,
  },
  remarksBox: {
    backgroundColor: '#eff6ff',
    borderColor: '#dbeafe',
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    marginTop: 12,
  },
  remarksTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1e40af',
  },
  remarksContent: {
    fontSize: 12,
    color: '#1e3a8a',
    marginTop: 2,
    lineHeight: 16,
  },
});
