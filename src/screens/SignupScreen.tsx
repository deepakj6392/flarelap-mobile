import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Linking } from 'react-native';
import Logo from '../components/Logo';
import { TextInput, Button, Title, Text } from 'react-native-paper';
import { setAuthToken } from '../services/api.service';
import { Snackbar } from 'react-native-paper';
import { signup } from '../services/auth.service';

function SignupScreen({ navigation }: any) {
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [street, setStreet] = useState('');
  const [country, setCountry] = useState('');
  const [pincode, setPincode] = useState('');
  const [stateVal, setStateVal] = useState('');
  const [city, setCity] = useState('');
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ visible: false, message: '' });

  const showMessage = (message: string) => setSnackbar({ visible: true, message });


  const openURL = async (url: string) => {
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        showMessage(`Cannot open: ${url}`);
      }
    } catch (e) {
      console.error('Failed to open URL', e);
      showMessage('Failed to open link');
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
      <View style={styles.topRow}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>◀</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.header}>
        <Logo />
        <Title style={styles.title}>Create Account</Title>
        <Text style={styles.subtitle}>Tell us a bit about yourself.</Text>
      </View>

      <View style={styles.form}>
        <View style={styles.row}>
          <TextInput label="Username" mode="outlined" outlineStyle={styles.roundInput} value={username} onChangeText={setUsername} style={[styles.input, styles.half]} />
          <TextInput label="Full Name" mode="outlined" outlineStyle={styles.roundInput} value={fullName} onChangeText={setFullName} style={[styles.input, styles.half, styles.rightInput]} />
        </View>

        <TextInput label="Email Address" mode="outlined" keyboardType="email-address" outlineStyle={styles.roundInput} value={email} onChangeText={setEmail} style={styles.input} />

        <View style={styles.passwordWrapper}>
          <TextInput
            label="Password"
            mode="outlined"
            secureTextEntry={!show}
            value={password}
            onChangeText={setPassword}
            style={[styles.input, styles.passwordInput]}
            outlineStyle={styles.roundInput}
          />
          <TouchableOpacity onPress={() => setShow(s => !s)} style={styles.eyeBtnAbsolute}>
            <Text style={styles.eyeText}>{show ? '🙈' : '👁️'}</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.section}>LOCATION DETAILS</Text>
        <TextInput label="Street Address" mode="outlined" outlineStyle={styles.roundInput} value={street} onChangeText={setStreet} style={styles.input} />

        <View style={styles.row}>
          <TextInput label="Country" mode="outlined" outlineStyle={styles.roundInput} value={country} onChangeText={setCountry} style={[styles.input, styles.half]} placeholder="Select country" />
          <TextInput label="Pincode" mode="outlined" outlineStyle={styles.roundInput} value={pincode} onChangeText={setPincode} style={[styles.input, styles.half, styles.rightInput]} keyboardType="numeric" />
        </View>

        <View style={styles.row}>
          <TextInput label="State" mode="outlined" outlineStyle={styles.roundInput} value={stateVal} onChangeText={setStateVal} style={[styles.input, styles.half]} placeholder="Select state" />
          <TextInput label="City" mode="outlined" outlineStyle={styles.roundInput} value={city} onChangeText={setCity} style={[styles.input, styles.half, styles.rightInput]} placeholder="Select city" />
        </View>

        <Button mode="contained" onPress={async () => {
          setLoading(true);
          try {
            const payload = { username, fullName, email, password, street, country, pincode, state: stateVal, city };
            const res = await signup(payload);
            if (res && (res.token || res.accessToken)) {
              setAuthToken(res.token || res.accessToken);
            }
            showMessage('Account created successfully');
            setTimeout(() => navigation.replace && navigation.replace('Main'), 800);
          } catch (e: any) {
            const msg = e?.response?.data?.message || e?.message || 'Signup failed';
            showMessage(msg);
          } finally {
            setLoading(false);
          }
        }} style={styles.saveBtn} loading={loading} disabled={loading}>
          Create Account
        </Button>

        <Snackbar visible={snackbar.visible} onDismiss={() => setSnackbar(s => ({ ...s, visible: false }))} duration={3000}>
          {snackbar.message}
        </Snackbar>

        <View style={styles.loginRow}>
          <Text>Already have an account?</Text>
          <Button onPress={() => navigation.navigate('Login')} compact>
            Login
          </Button>
        </View>
        <View style={styles.privacyRow}>
          <Text style={styles.privacyText} onPress={() => openURL('https://flarelap.com/privacy')}>Privacy Policy</Text>
          <Text style={styles.privacyPipe}> | </Text>
          <Text style={styles.termsText} onPress={() => openURL('https://flarelap.com/terms')}>Terms & Conditions</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 20, paddingBottom: 60, backgroundColor: '#fff' },
  topRow: { height: 36 },
  back: { fontSize: 18 },
  header: { alignItems: 'center', marginBottom: 10 },
  title: { fontSize: 26, fontWeight: '800' },
  subtitle: { color: '#6b7280', marginTop: 6 },
  form: { marginTop: 12 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  /* make Paper outlined inputs look rounded */
  input: { marginTop: 12, backgroundColor: '#fff' },
  roundInput: { borderRadius: 16 },
  half: { flex: 1 },
  rightInput: { marginLeft: 12 },
  rightWrapper: { alignItems: 'center', justifyContent: 'center', marginLeft: 12 },
  passwordWrapper: { position: 'relative' },
  passwordInput: { paddingRight: 56 },
  eyeBtnAbsolute: { position: 'absolute', right: 8, top: 23, height: 40, width: 40, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f3f4f6', borderRadius: 8 },
  eyeBtn: { height: 56, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f3f4f6', borderRadius: 8 },
  eyeText: { fontSize: 18 },
  section: { marginTop: 18, color: '#64748b', fontWeight: '700' },
  saveBtn: { marginTop: 18 },
  loginRow: { flexDirection: 'row', marginTop: 16, alignItems: 'center', justifyContent: 'center' },
  privacyRow: { flexDirection: 'row', marginTop: 16, alignItems: 'center', justifyContent: 'center' },
  privacyText: { color: '#aaaaaaff', fontSize: 12 },
  privacyPipe: { color: '#aaaaaaff', fontSize: 12 },
  termsText: { color: '#aaaaaaff', fontSize: 12 },
});

export default SignupScreen;
