import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Text, Title, TextInput, Button, Card, Snackbar } from 'react-native-paper';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { THEME_COLORS } from '../../constants';
import { getStudentSession, updateStudentProfile, clearStudentSession } from '../../services/student.service';

export default function StudentProfileScreen() {
  const navigation = useNavigation();
  const isFocused = useIsFocused();
  const [student, setStudent] = useState<any>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form Fields
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [collegeName, setCollegeName] = useState('');
  const [rollNumber, setRollNumber] = useState('');
  const [address, setAddress] = useState('');
  const [stateVal, setStateVal] = useState('');
  const [pincode, setPincode] = useState('');

  const [snackbarMessage, setSnackbarMessage] = useState<string | null>(null);

  const loadSession = async () => {
    try {
      const session = await getStudentSession();
      if (session.user && session.token) {
        setStudent(session.user);
        setToken(session.token);

        // Prepopulate form fields
        setFirstName(session.user.firstName || '');
        setLastName(session.user.lastName || '');
        setPhone(session.user.phone || '');
        setCollegeName(session.user.collegeName || '');
        setRollNumber(session.user.roll_number || '');
        setAddress(session.user.address || '');
        setStateVal(session.user.state || '');
        setPincode(session.user.pincode || '');
      }
    } catch (e) {
      console.error('Error loading session in profile:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isFocused) {
      loadSession();
    }
  }, [isFocused]);

  const handleSaveChanges = async () => {
    if (!firstName.trim() || !lastName.trim()) {
      setSnackbarMessage('First and Last names are required.');
      return;
    }
    if (!student?.id || !token) {
      setSnackbarMessage('Session not found.');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        firstName,
        lastName,
        phone,
        collegeName,
        roll_number: rollNumber,
        address,
        state: stateVal,
        pincode,
      };

      const res = await updateStudentProfile(student.id, payload, token);
      setSnackbarMessage('Profile updated successfully!');
      
      // Update local storage
      const session = await getStudentSession();
      const updatedUser = { ...session.user, ...payload };
      const { saveStudentSession } = require('../../services/student.service');
      await saveStudentSession(token, updatedUser);
      setStudent(updatedUser);
    } catch (err: any) {
      console.error('Update profile error:', err);
      setSnackbarMessage(err?.response?.data?.message || err?.message || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    try {
      await clearStudentSession();
    } catch {}
    setSnackbarMessage('Logged out successfully.');

    // Redirect to Main stack login
    // @ts-ignore
    navigation.reset && (navigation as any).reset({
      index: 0,
      routes: [{ name: 'Main' }],
    });
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
        {/* Banner */}
        <Card style={styles.profileBanner}>
          <Card.Content style={styles.bannerContent}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {firstName ? firstName.charAt(0).toUpperCase() : 'S'}
              </Text>
            </View>
            <View style={styles.bannerMeta}>
              <Title style={styles.profileName}>{firstName} {lastName}</Title>
              <Text style={styles.profileEmail}>{student?.email}</Text>
              <Text style={styles.profileCourse}>{student?.courseType || student?.department || 'Web Development'}</Text>
            </View>
          </Card.Content>
        </Card>

        {/* Editable Form */}
        <Card style={styles.card} mode="outlined">
          <Card.Content>
            <Title style={styles.sectionTitle}>Account Information</Title>

            <View style={styles.row}>
              <TextInput
                mode="outlined"
                label="First Name"
                value={firstName}
                onChangeText={setFirstName}
                style={[styles.input, styles.half]}
                outlineStyle={styles.roundInput}
                dense
              />
              <TextInput
                mode="outlined"
                label="Last Name"
                value={lastName}
                onChangeText={setLastName}
                style={[styles.input, styles.half, styles.rightInput]}
                outlineStyle={styles.roundInput}
                dense
              />
            </View>

            <TextInput
              mode="outlined"
              label="Contact Number"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              style={styles.input}
              outlineStyle={styles.roundInput}
              dense
            />

            <TextInput
              mode="outlined"
              label="Institution Name"
              value={collegeName}
              onChangeText={setCollegeName}
              style={styles.input}
              outlineStyle={styles.roundInput}
              dense
            />

            <TextInput
              mode="outlined"
              label="Roll / Registration Number"
              value={rollNumber}
              onChangeText={setRollNumber}
              style={styles.input}
              outlineStyle={styles.roundInput}
              dense
            />

            <TextInput
              mode="outlined"
              label="Street Address"
              value={address}
              onChangeText={setAddress}
              style={styles.input}
              outlineStyle={styles.roundInput}
              dense
            />

            <View style={styles.row}>
              <TextInput
                mode="outlined"
                label="State"
                value={stateVal}
                onChangeText={setStateVal}
                style={[styles.input, styles.half]}
                outlineStyle={styles.roundInput}
                dense
              />
              <TextInput
                mode="outlined"
                label="Pincode"
                value={pincode}
                onChangeText={setPincode}
                keyboardType="numeric"
                style={[styles.input, styles.half, styles.rightInput]}
                outlineStyle={styles.roundInput}
                dense
              />
            </View>

            <Button
              mode="contained"
              onPress={handleSaveChanges}
              disabled={saving}
              loading={saving}
              style={styles.saveBtn}
              buttonColor={THEME_COLORS.primary}
            >
              Save Changes
            </Button>
          </Card.Content>
        </Card>

        {/* Logout Section */}
        <Button
          mode="outlined"
          onPress={handleLogout}
          style={styles.logoutBtn}
          textColor={THEME_COLORS.primary}
        >
          Logout Student Session
        </Button>

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
  profileBanner: {
    borderRadius: 20,
    backgroundColor: '#0f172a',
    elevation: 4,
    marginBottom: 20,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  bannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#3b82f6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 22,
    fontWeight: '800',
    color: '#ffffff',
  },
  bannerMeta: {
    marginLeft: 16,
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#ffffff',
    marginVertical: 0,
  },
  profileEmail: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 2,
  },
  profileCourse: {
    fontSize: 11,
    color: '#3b82f6',
    fontWeight: '700',
    marginTop: 4,
  },
  card: {
    borderRadius: 16,
    borderColor: '#e2e8f0',
    borderWidth: 1,
    backgroundColor: '#ffffff',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  half: {
    flex: 0.48,
  },
  rightInput: {
    marginLeft: 8,
  },
  input: {
    marginBottom: 12,
    backgroundColor: '#ffffff',
  },
  roundInput: {
    borderRadius: 12,
  },
  saveBtn: {
    borderRadius: 12,
    marginTop: 12,
  },
  logoutBtn: {
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 8,
    borderColor: THEME_COLORS.primary,
  },
});
