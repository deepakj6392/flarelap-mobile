import React, { useState } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import Logo from '../components/Logo';
import { TextInput, Button, Title, Snackbar } from 'react-native-paper';
import { confirmPasswordReset, requestPasswordReset } from '../services/auth.service';

// Using API service functions instead of local endpoints

function ForgotPasswordScreen({ navigation }: any) {
  const [step, setStep] = useState<1 | 2>(1);
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ visible: false, message: '' });

  const showMessage = (message: string) => setSnackbar({ visible: true, message });

  async function sendResetLink() {
    if (!email || !email.includes('@')) {
      showMessage('Please enter a valid email');
      return;
    }

    setLoading(true);
    try {
      await requestPasswordReset({ email });
      showMessage('Reset code sent to your email');
      setStep(2);
    } catch (e: any) {
      const msg = e?.response?.data?.message || e?.message || 'Network error';
      showMessage(msg);
    } finally {
      setLoading(false);
    }
  }

  async function confirmReset() {
    if (!code) {
      showMessage('Enter the code sent to your email');
      return;
    }
    if (!password || password.length < 6) {
      showMessage('Password must be at least 6 characters');
      return;
    }
    if (password !== passwordConfirm) {
      showMessage('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      await confirmPasswordReset({ email, code, newPassword: password });
      showMessage('Password reset successful. Please login.');
      setTimeout(() => navigation.replace('Login'), 1200);
    } catch (e: any) {
      const msg = e?.response?.data?.message || e?.message || 'Network error';
      showMessage(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.select({ ios: 'padding', android: undefined })}>
      <View style={styles.container}>
        <Logo />
        <Title style={styles.title}>Reset Password</Title>

        {step === 1 ? (
          <>
            <TextInput
              mode="outlined"
              label="Email"
              style={[styles.input, styles.roundInput]}
              outlineStyle={styles.roundInput}
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
            />

            <Button loading={loading} mode="contained" onPress={sendResetLink} style={styles.button}>
              Send reset link
            </Button>
          </>
        ) : (
          <>
            <TextInput mode="outlined" label="Code" style={[styles.input, styles.roundInput]} value={code} onChangeText={setCode} />
            <TextInput mode="outlined" label="New password" style={[styles.input, styles.roundInput]} value={password} onChangeText={setPassword} secureTextEntry />
            <TextInput mode="outlined" label="Confirm password" style={[styles.input, styles.roundInput]} value={passwordConfirm} onChangeText={setPasswordConfirm} secureTextEntry />

            <Button loading={loading} mode="contained" onPress={confirmReset} style={styles.button}>
              Reset password
            </Button>
          </>
        )}

        <Button onPress={() => navigation.navigate('Login')} compact>
          Back to login
        </Button>

        <Snackbar visible={snackbar.visible} onDismiss={() => setSnackbar(s => ({ ...s, visible: false }))} duration={3000}>
          {snackbar.message}
        </Snackbar>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { flex: 1, padding: 24, justifyContent: 'center' },
  title: { fontSize: 24, marginBottom: 24 },
  input: { marginBottom: 12 },
  roundInput: { borderRadius: 16 },
  button: { marginTop: 8 },
});

export default ForgotPasswordScreen;
