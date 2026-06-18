import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Avatar, Title, Text, Button, TextInput, SegmentedButtons, Card, Snackbar, ActivityIndicator } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import api from '../../services/api.service';
import { clearTokens } from '../../services/token.service';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ProfileScreen() {
  const navigation = useNavigation();
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [tab, setTab] = useState('account');
  const [street, setStreet] = useState('');
  const [country, setCountry] = useState('');
  const [pincode, setPincode] = useState('');
  const [stateVal, setStateVal] = useState('');
  const [city, setCity] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [snackbar, setSnackbar] = useState({ visible: false, message: '' });

  const showMessage = (message: string) => setSnackbar({ visible: true, message });

  useEffect(() => {
    let active = true;
    const fetchProfile = async () => {
      try {
        const response = await api.get('/auth/me');
        if (active && response.data) {
          const data = response.data?.user;
          setUsername(data.username || '');
          setFullName(data.fullName || '');
          setEmail(data.email || '');
          setStreet(data.street || '');
          setCountry(data.country || '');
          setPincode(data.pincode || '');
          setStateVal(data.state || '');
          setCity(data.city || '');
        }
      } catch (e: any) {
        console.error('Error fetching profile:', e);
        showMessage(e?.response?.data?.message || e?.message || 'Failed to load profile');
      } finally {
        if (active) {
          setFetching(false);
        }
      }
    };
    fetchProfile();
    return () => {
      active = false;
    };
  }, []);

  const handleLogout = async () => {
    try {
      await clearTokens();
    } catch {}
    // reset navigation to login screen (clear history)
    // @ts-ignore
    navigation.reset && (navigation as any).reset({ index: 0, routes: [{ name: 'Login' }] });
  };

  if (fetching) {
    return (
      <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8fafc' }}>
        <ActivityIndicator size="large" color="#df103f" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView>
    <ScrollView contentContainerStyle={styles.scroll}>
      <View style={styles.header}>
        <Title style={styles.pageTitle}>Settings</Title>
        <Text style={styles.subtitle}>Manage your account preferences</Text>
      </View>

      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.userRow}>
            <Avatar.Text size={64} label={fullName ? fullName.charAt(0).toUpperCase() : (username ? username.charAt(0).toUpperCase() : 'U')} />
            <View style={styles.userMeta}>
              <Title style={styles.userTitle}>{fullName || username || 'User'}</Title>
              <Text style={styles.userEmail}>{email}</Text>
            </View>
            <Button mode="contained" onPress={handleLogout}>Logout</Button>
          </View>
        </Card.Content>
      </Card>

      <View style={styles.tabsWrap}>
        <SegmentedButtons
          value={tab}
          onValueChange={setTab}
          buttons={[{ value: 'account', label: 'Account' }, { value: 'subscription', label: 'Subscription' }]}
        />
      </View>

      {tab === 'account' && (
        <Card style={styles.formCard}>
          <Card.Content>
            <Text style={styles.sectionTitle}>Account</Text>
            <TextInput mode="outlined" label="Username" value={username} onChangeText={setUsername} style={[styles.input, styles.roundInput]} outlineStyle={styles.roundInput} />
            <TextInput mode="outlined" label="Full Name" value={fullName} onChangeText={setFullName} style={[styles.input, styles.roundInput]} outlineStyle={styles.roundInput} />
            <TextInput mode="outlined" label="Email Address" value={email} disabled style={[styles.input, styles.roundInput]} outlineStyle={styles.roundInput} />
            <TextInput mode="outlined" label="Street Address" value={street} onChangeText={setStreet} style={[styles.input, styles.roundInput]} outlineStyle={styles.roundInput} />
            <View style={styles.row}>
              <TextInput mode="outlined" label="Country" value={country} onChangeText={setCountry} style={[styles.input, styles.half, styles.roundInput]} outlineStyle={styles.roundInput} />
              <TextInput mode="outlined" label="Pincode" value={pincode} onChangeText={setPincode} style={[styles.input, styles.half, styles.rightInput, styles.roundInput]} outlineStyle={styles.roundInput} keyboardType="numeric" />
            </View>
            <View style={styles.row}>
              <TextInput mode="outlined" label="State" value={stateVal} onChangeText={setStateVal} style={[styles.input, styles.half, styles.roundInput]} outlineStyle={styles.roundInput} />
              <TextInput mode="outlined" label="City" value={city} onChangeText={setCity} style={[styles.input, styles.half, styles.rightInput, styles.roundInput]} outlineStyle={styles.roundInput} />
            </View>

            <Button mode="contained" style={styles.saveBtn} loading={loading} disabled={loading} onPress={async () => {
              setLoading(true);
              try {
                await api.put('/auth/profile', {
                  username,
                  fullName,
                  street,
                  country,
                  pincode,
                  state: stateVal,
                  city,
                });
                showMessage('Profile saved successfully');
              } catch (e: any) {
                showMessage(e?.response?.data?.message || e?.message || 'Save failed');
              } finally {
                setLoading(false);
              }
            }}>Save changes</Button>
            <Snackbar visible={snackbar.visible} onDismiss={() => setSnackbar(s => ({ ...s, visible: false }))} duration={3000}>
              {snackbar.message}
            </Snackbar>
          </Card.Content>
        </Card>
      )}

      {tab === 'subscription' && (
        <Card style={styles.formCard}>
          <Card.Content>
            <Text style={styles.sectionTitle}>Subscription</Text>
            <Text>Manage your subscription here.</Text>
          </Card.Content>
        </Card>
      )}
    </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 20, paddingBottom: 60, backgroundColor: '#f8fafc' },
  header: { marginBottom: 12 },
  pageTitle: { fontSize: 24, fontWeight: '800' },
  subtitle: { color: '#64748b', marginTop: 6 },
  card: { padding: 12, marginBottom: 12 },
  userRow: { flexDirection: 'row', alignItems: 'center' },
  tabsWrap: { marginBottom: 12 },
  formCard: { padding: 8 },
  sectionTitle: { fontWeight: '700', marginBottom: 12 },
  input: { marginBottom: 12, backgroundColor: '#fff', paddingHorizontal: 8 },
  /* inputs helpers */
  roundInput: { borderRadius: 16 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  half: { flex: 1 },
  rightInput: { marginLeft: 12 },
  userMeta: { marginLeft: 12, flex: 1 },
  userTitle: { marginBottom: 4 },
  userEmail: { color: '#64748b' },
  saveBtn: { marginTop: 12 },
});
