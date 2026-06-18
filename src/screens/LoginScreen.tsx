import React, { useState, useRef } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, ScrollView, Platform } from 'react-native';
import Logo from '../components/Logo';
import { Text, TextInput, Button, Title } from 'react-native-paper';
import { setAuthToken } from '../services/api.service';
import { login } from '../services/auth.service';
import { saveTokens } from '../services/token.service';
import { THEME_COLORS } from '../constants';

function LoginScreen({navigation}: any) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const passwordRef = useRef<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    setError(null);
    setLoading(true);
    try {
      const data = await login({ email, password });
      // if API returns token field, set it for future requests
      if (data && data.access_token) {
        const token = data.access_token;
        console.log(token)
        setAuthToken(token);
        // persist tokens (if backend returns refresh token)
        try { await saveTokens({ accessToken: token, refreshToken: data.refresh_token }); } catch {};
      }
      // navigate into main app
      navigation.replace && navigation.replace('Main');
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Login failed';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Logo size={150} />
        <Title style={styles.title}>Welcome Back</Title>
        {error ? <Text style={styles.errorText}>{error}</Text> : null}
        <TextInput
          mode="outlined"
          label="Email"
          style={[styles.input, styles.roundInput]}
          outlineStyle={styles.roundInput}
          dense
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          returnKeyType="next"
          onSubmitEditing={() => passwordRef.current?.focus && passwordRef.current.focus()}
        />
        <TextInput
          ref={passwordRef}
          mode="outlined"
          label="Password"
          style={[styles.input, styles.roundInput]}
          outlineStyle={styles.roundInput}
          dense
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          returnKeyType="done"
          onSubmitEditing={handleLogin}
        />

        <Button mode="contained" onPress={handleLogin} style={styles.button} loading={loading} disabled={loading}>
          Login
        </Button>

        <Button onPress={() => navigation.navigate('ForgotPassword')} compact>
          Forgot password?
        </Button>

        <View style={styles.row}>
          <Text>Don't have an account?</Text>
          <Button onPress={() => navigation.navigate('Signup')} compact>
            Sign up
          </Button>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, justifyContent: 'center', backgroundColor:"#FFFFFF" },
  title: { fontSize: 28, marginBottom: 24, color: THEME_COLORS.primary },
  input: { marginBottom: 12 },
  roundInput: { borderRadius: 16 },
  translucentInput: { backgroundColor: 'rgba(255,255,255,0.08)' },
  inputContent: { paddingVertical: 8 },
  inputContentShift: { paddingTop: 18 },
  button: { marginTop: 8, backgroundColor: THEME_COLORS.primary, color: '#FFFFFF' },
  row: { flexDirection: 'row', marginTop: 16, alignItems: 'center', justifyContent: 'center' },
  errorText: { color: '#d20d0dff', marginBottom: 8 },
});

export default LoginScreen;
