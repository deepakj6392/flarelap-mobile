import React, { useState, useRef, useEffect } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, ScrollView, Platform, TouchableOpacity, Alert } from 'react-native';
import Logo from '../components/Logo';
import { Text, TextInput, Button, Title } from 'react-native-paper';
import { setAuthToken } from '../services/api.service';
import { login } from '../services/auth.service';
import { saveTokens } from '../services/token.service';
import { THEME_COLORS } from '../constants';
import Svg, { Path } from 'react-native-svg';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import { GOOGLE_WEB_CLIENT_ID } from '../constants/config';
import { LoginManager, AccessToken } from 'react-native-fbsdk-next';
import appleAuth from '@invertase/react-native-apple-authentication';

// Custom inline branded SVG icons
const GoogleIcon = ({ size = 20 }: { size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Path
      fill="#4285F4"
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
    />
    <Path
      fill="#34A853"
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
    />
    <Path
      fill="#FBBC05"
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22c-.08-.2-.14-.41-.2-.63z"
    />
    <Path
      fill="#EA4335"
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
    />
  </Svg>
);

const FacebookIcon = ({ size = 20 }: { size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="#1877F2">
    <Path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
  </Svg>
);

const AppleIcon = ({ size = 20 }: { size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="#000000">
    <Path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.54 9.103 1.51 12.067 1.007 1.452 2.2 3.076 3.774 3.018 1.52-.058 2.09-.98 3.928-.98 1.837 0 2.36.98 3.928.95 1.6-.027 2.65-1.477 3.633-2.9 1.13-1.665 1.597-3.275 1.625-3.359-.033-.016-3.13-1.2-3.16-4.784-.025-2.997 2.45-4.436 2.56-4.502-1.4-2.05-3.56-2.278-4.32-2.336-1.97-.16-3.98 1.202-4.98 1.202zM15.42 3.722c.826-1.004 1.38-2.398 1.228-3.722-1.13.047-2.5 0.755-3.312 1.705-.724.836-1.356 2.247-1.185 3.548 1.26.096 2.54-.62 3.268-1.53z" />
  </Svg>
);

import { PasswordEyeIcon } from '../components/icons-svg';

function LoginScreen({ navigation }: any) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const passwordRef = useRef<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    GoogleSignin.configure({
      webClientId: GOOGLE_WEB_CLIENT_ID,
      offlineAccess: true,
    });
  }, []);

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
        try { await saveTokens({ accessToken: token, refreshToken: data.refresh_token }); } catch { };
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

  const handleSocialLogin = async (provider: string) => {
    setError(null);
    setLoading(true);
    try {
      let token = '';
      if (provider === 'Google') {
        await GoogleSignin.hasPlayServices();
        const userInfo = await GoogleSignin.signIn();
        const idToken = (userInfo as any).idToken || (userInfo as any).data?.idToken;
        if (!idToken) {
          throw new Error('Google Sign-In succeeded, but no ID Token was received.');
        }
        token = idToken;
      } else if (provider === 'Facebook') {
        const result = await LoginManager.logInWithPermissions(['public_profile', 'email']);
        if (result.isCancelled) {
          throw new Error('Facebook Login was cancelled.');
        }
        const data = await AccessToken.getCurrentAccessToken();
        if (!data || !data.accessToken) {
          throw new Error('Facebook Login succeeded, but failed to obtain access token.');
        }
        token = data.accessToken;
      } else if (provider === 'Apple') {
        if (Platform.OS === 'ios') {
          const appleAuthRequestResponse = await appleAuth.performRequest({
            requestedOperation: appleAuth.Operation.LOGIN,
            requestedScopes: [appleAuth.Scope.EMAIL, appleAuth.Scope.FULL_NAME],
          });
          const credentialState = await appleAuth.getCredentialStateForUser(appleAuthRequestResponse.user);
          if (credentialState === appleAuth.State.AUTHORIZED) {
            token = appleAuthRequestResponse.identityToken || '';
            if (!token) {
              throw new Error('Apple Sign-In succeeded, but no Identity Token was received.');
            }
          } else {
            throw new Error('Apple Sign-In failed or was unauthorized.');
          }
        } else {
          throw new Error('Apple Sign-In is only natively supported on iOS.');
        }
      } else {
        // Simulate network request/OAuth flow delay
        await new Promise<void>((resolve) => setTimeout(() => resolve(), 800));
        token = `mock-${provider.toLowerCase()}-token-${Date.now()}`;
      }

      setAuthToken(token);
      try {
        await saveTokens({
          accessToken: token,
          refreshToken: `mock-refresh-token-${Date.now()}`,
        });
      } catch { }
      Alert.alert('Success', `Logged in successfully with ${provider}!`);
      navigation.replace && navigation.replace('Main');
    } catch (err: any) {
      if (provider === 'Google') {
        if (err.code === statusCodes.SIGN_IN_CANCELLED) {
          setError('Google Login cancelled by user.');
        } else if (err.code === statusCodes.IN_PROGRESS) {
          setError('Google Login already in progress.');
        } else if (err.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
          setError('Google Play Services not available or outdated.');
        } else {
          setError(err.message || 'Google Login failed');
        }
      } else if (provider === 'Facebook') {
        setError(err.message || 'Facebook Login failed');
      } else if (provider === 'Apple') {
        setError(err.message || 'Apple Login failed');
      } else {
        setError(`${provider} login failed`);
      }
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
          secureTextEntry={!showPassword}
          value={password}
          onChangeText={setPassword}
          returnKeyType="done"
          onSubmitEditing={handleLogin}
          right={
            <TextInput.Icon
              icon={props => <PasswordEyeIcon visible={showPassword} {...props} />}
              onPress={() => setShowPassword(!showPassword)}
            />
          }
        />

        <Button mode="contained" onPress={handleLogin} style={styles.button} loading={loading} disabled={loading}>
          Login
        </Button>

        <Button onPress={() => navigation.navigate('ForgotPassword')} compact>
          Forgot password?
        </Button>

        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>Or continue with</Text>
          <View style={styles.dividerLine} />
        </View>

        <View style={styles.socialContainer}>
          <TouchableOpacity
            style={styles.socialBtn}
            onPress={() => handleSocialLogin('Google')}
            disabled={loading}
          >
            <GoogleIcon size={24} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.socialBtn}
            onPress={() => handleSocialLogin('Facebook')}
            disabled={loading}
          >
            <FacebookIcon size={24} />
          </TouchableOpacity>
          {
            Platform.OS === 'ios' && (
              <TouchableOpacity
                style={styles.socialBtn}
                onPress={() => handleSocialLogin('Apple')}
                disabled={loading}
              >
                <AppleIcon size={24} />
              </TouchableOpacity>
            )
          }
        </View>

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
  container: { flex: 1, padding: 24, justifyContent: 'center', backgroundColor: "#FFFFFF" },
  title: { fontSize: 28, marginBottom: 24, color: THEME_COLORS.primary },
  input: { marginBottom: 12 },
  roundInput: { borderRadius: 16 },
  translucentInput: { backgroundColor: 'rgba(255,255,255,0.08)' },
  inputContent: { paddingVertical: 8 },
  inputContentShift: { paddingTop: 18 },
  button: { marginTop: 8, backgroundColor: THEME_COLORS.primary, color: '#FFFFFF' },
  row: { flexDirection: 'row', marginTop: 16, alignItems: 'center', justifyContent: 'center' },
  errorText: { color: '#d20d0dff', marginBottom: 8 },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E2E8F0',
  },
  dividerText: {
    marginHorizontal: 12,
    color: '#64748B',
    fontSize: 14,
    fontWeight: '500',
  },
  socialContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginBottom: 16,
  },
  socialBtn: {
    width: 54,
    height: 54,
    borderRadius: 27,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
});

export default LoginScreen;
