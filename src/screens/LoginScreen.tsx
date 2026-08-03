import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  TouchableOpacity,
  Alert,
  Text,
  TextInput as RNTextInput,
  Animated,
  Dimensions,
  StatusBar,
  ActivityIndicator,
  LayoutAnimation,
  UIManager,
  Keyboard,
} from 'react-native';
import Logo from '../components/Logo';
import { Portal, Modal } from 'react-native-paper';
import { setAuthToken } from '../services/api.service';
import { login, googleLogin, facebookLogin, appleLogin } from '../services/auth.service';
import { saveTokens } from '../services/token.service';
import { THEME_COLORS } from '../constants';
import Svg, { Path, Circle } from 'react-native-svg';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import { GOOGLE_WEB_CLIENT_ID } from '../constants/config';
import { LoginManager, AccessToken } from 'react-native-fbsdk-next';
import appleAuth from '@invertase/react-native-apple-authentication';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// ─── Brand Colors ─────────────────────────────────────────────────────────────
const BRAND = {
  primary: '#df103f',
  primaryDark: '#b00d32',
  primaryLight: '#ff3d6b',
  secondary: '#ff8c4c',
  bg: '#ffffff',
  cardBg: '#ffffff',
  surface: '#f5f5f5',
  inputBg: '#f8f8f8',
  border: '#e8e0e0',
  borderFocus: '#df103f',
  textPrimary: '#1a0a0a',
  textSecondary: '#5c3d3d',
  textMuted: '#9e7e7e',
  white: '#ffffff',
  error: '#c0392b',
  divider: '#f0e5e5',
};

// ─── SVG Icons ────────────────────────────────────────────────────────────────
const GoogleIcon = ({ size = 20 }: { size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
    <Path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
    <Path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22c-.08-.2-.14-.41-.2-.63z" />
    <Path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
  </Svg>
);

const FacebookIcon = ({ size = 20 }: { size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="#1877F2">
    <Path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
  </Svg>
);

const AppleIcon = ({ size = 20 }: { size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="#000000">
    <Path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.54 9.103 1.51 12.067 1.007 1.452 2.2 3.076 3.774 3.018 1.52-.058 2.09-.98 3.928-.98 1.837 0 2.36.98 3.928.95 1.6-.027 2.65-1.477 3.633-2.9 1.13-1.665 1.597-3.275 1.625-3.359-.033-.016-3.13-1.2-3.16-4.784-.025-2.997 2.45-4.436 2.56-4.502-1.4-2.05-3.56-2.278-4.32-2.336-1.97-.16-3.98 1.202-4.98 1.202zM15.42 3.722c.826-1.004 1.38-2.398 1.228-3.722-1.13.047-2.5.755-3.312 1.705-.724.836-1.356 2.247-1.185 3.548 1.26.096 2.54-.62 3.268-1.53z" />
  </Svg>
);

const MailIcon = ({ size = 18, color = BRAND.textMuted }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
    <Path stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      d="M22 6l-10 7L2 6" />
  </Svg>
);

const LockIcon = ({ size = 18 }: { size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path stroke={BRAND.textMuted} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      d="M19 11H5a2 2 0 00-2 2v7a2 2 0 002 2h14a2 2 0 002-2v-7a2 2 0 00-2-2z" />
    <Path stroke={BRAND.textMuted} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      d="M7 11V7a5 5 0 0110 0v4" />
  </Svg>
);

const EyeIcon = ({ visible, size = 20 }: { visible: boolean; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    {visible ? (
      <>
        <Path stroke={BRAND.textSecondary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
        <Circle cx="12" cy="12" r="3" stroke={BRAND.textSecondary} strokeWidth="2" />
      </>
    ) : (
      <>
        <Path stroke={BRAND.textSecondary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" />
        <Path stroke={BRAND.textSecondary} strokeWidth="2" strokeLinecap="round" d="M1 1l22 22" />
      </>
    )}
  </Svg>
);

const ChevronDownIcon = ({ size = 16 }: { size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path stroke={BRAND.textMuted} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
      d="M6 9l6 6 6-6" />
  </Svg>
);

// ─── Animated Text Input ───────────────────────────────────────────────────────
interface AnimatedInputProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  secureTextEntry?: boolean;
  keyboardType?: any;
  returnKeyType?: any;
  onSubmitEditing?: () => void;
  rightElement?: React.ReactNode;
  leftIcon?: React.ReactNode;
  inputRef?: React.RefObject<RNTextInput>;
  autoCapitalize?: any;
  editable?: boolean;
}

const AnimatedInput = ({
  label, value, onChangeText, secureTextEntry, keyboardType,
  returnKeyType, onSubmitEditing, rightElement, leftIcon,
  inputRef, autoCapitalize = 'none', editable = true,
}: AnimatedInputProps) => {
  const [isFocused, setIsFocused] = useState(false);
  const focusAnim = useRef(new Animated.Value(0)).current;
  const labelAnim = useRef(new Animated.Value(value ? 1 : 0)).current;

  const handleFocus = () => {
    setIsFocused(true);
    Animated.parallel([
      Animated.timing(focusAnim, { toValue: 1, duration: 200, useNativeDriver: false }),
      Animated.timing(labelAnim, { toValue: 1, duration: 180, useNativeDriver: false }),
    ]).start();
  };

  const handleBlur = () => {
    setIsFocused(false);
    Animated.timing(focusAnim, { toValue: 0, duration: 200, useNativeDriver: false }).start();
    if (!value) {
      Animated.timing(labelAnim, { toValue: 0, duration: 180, useNativeDriver: false }).start();
    }
  };

  useEffect(() => {
    if (value) {
      Animated.timing(labelAnim, { toValue: 1, duration: 0, useNativeDriver: false }).start();
    }
  }, []);

  const borderColor = focusAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [BRAND.border, BRAND.primary],
  });
  const labelTop = labelAnim.interpolate({ inputRange: [0, 1], outputRange: [18, 4] });
  const labelSize = labelAnim.interpolate({ inputRange: [0, 1], outputRange: [15, 11] });
  const labelColor = labelAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [BRAND.textMuted, isFocused ? BRAND.primary : BRAND.textSecondary],
  });

  return (
    <Animated.View style={[styles.inputWrapper, { borderColor }]}>
      <Animated.Text style={[styles.floatingLabel, { top: labelTop, fontSize: labelSize, color: labelColor }]}>
        {label}
      </Animated.Text>
      <View style={styles.inputRow}>
        {leftIcon && <View style={styles.inputLeftIcon}>{leftIcon}</View>}
        <RNTextInput
          ref={inputRef}
          style={styles.textInput}
          value={value}
          onChangeText={onChangeText}
          onFocus={handleFocus}
          onBlur={handleBlur}
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          returnKeyType={returnKeyType}
          onSubmitEditing={onSubmitEditing}
          autoCapitalize={autoCapitalize}
          placeholderTextColor={BRAND.textMuted}
          editable={editable}
        />
        {rightElement && <View style={styles.inputRightIcon}>{rightElement}</View>}
      </View>
    </Animated.View>
  );
};

// ─── Main Screen ──────────────────────────────────────────────────────────────
function LoginScreen({ navigation }: any) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const passwordRef = useRef<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showEmailForm, setShowEmailForm] = useState(false);

  // Scroll ref for keyboard-aware scrolling
  const scrollViewRef = useRef<ScrollView>(null);

  // Facebook missing email prompt states
  const [emailPromptVisible, setEmailPromptVisible] = useState(false);
  const [promptEmail, setPromptEmail] = useState('');
  const [promptEmailError, setPromptEmailError] = useState<string | null>(null);
  const [pendingFbData, setPendingFbData] = useState<{ accessToken: string; userID: string } | null>(null);

  // Entrance animations
  const headerAnim = useRef(new Animated.Value(0)).current;
  const formAnim = useRef(new Animated.Value(0)).current;
  const emailFormAnim = useRef(new Animated.Value(0)).current;
  const errorShake = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    GoogleSignin.configure({ webClientId: GOOGLE_WEB_CLIENT_ID, offlineAccess: true });
    Animated.stagger(100, [
      Animated.timing(headerAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(formAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
    ]).start();

    // Scroll down when keyboard appears so inputs stay visible
    const showSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      () => {
        setTimeout(() => {
          scrollViewRef.current?.scrollToEnd({ animated: true });
        }, 100);
      }
    );
    return () => showSub.remove();
  }, []);

  const handleToggleEmailForm = () => {
    const next = !showEmailForm;
    setShowEmailForm(next);
    Animated.timing(emailFormAnim, {
      toValue: next ? 1 : 0,
      duration: 350,
      useNativeDriver: true,
    }).start();
  };

  const triggerShake = () => {
    Animated.sequence([
      Animated.timing(errorShake, { toValue: 8, duration: 60, useNativeDriver: true }),
      Animated.timing(errorShake, { toValue: -8, duration: 60, useNativeDriver: true }),
      Animated.timing(errorShake, { toValue: 6, duration: 60, useNativeDriver: true }),
      Animated.timing(errorShake, { toValue: -6, duration: 60, useNativeDriver: true }),
      Animated.timing(errorShake, { toValue: 0, duration: 60, useNativeDriver: true }),
    ]).start();
  };

  const handleLogin = async () => {
    setError(null);
    setLoading(true);
    try {
      const data = await login({ email, password });
      if (data && data.access_token) {
        const token = data.access_token;
        setAuthToken(token);
        try { await saveTokens({ accessToken: token, refreshToken: data.refresh_token }); } catch { }
      }
      navigation.replace && navigation.replace('Main');
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Login failed';
      setError(msg);
      triggerShake();
    } finally {
      setLoading(false);
    }
  };

  const handleSocialLogin = async (provider: string) => {
    setError(null);
    setLoading(true);
    try {
      let sessionToken = '';
      if (provider === 'Google') {
        await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
        const userInfo = await GoogleSignin.signIn();
        const idToken = (userInfo as any).idToken || (userInfo as any).data?.idToken;
        if (!idToken) throw new Error('Google Sign-In succeeded, but no ID Token was received.');
        const response = await googleLogin({ token: idToken });
        if (!response.token) throw new Error('Backend Google login failed.');
        sessionToken = response.token;
      } else if (provider === 'Facebook') {
        const result = await LoginManager.logInWithPermissions(['public_profile', 'email']);
        if (result.isCancelled) throw new Error('Facebook Login was cancelled.');
        const data = await AccessToken.getCurrentAccessToken();
        if (!data || !data.accessToken) throw new Error('Facebook Login succeeded, but failed to obtain access token.');
        try {
          const response = await facebookLogin({ accessToken: data.accessToken, userID: data.userID });
          if (!response.token) throw new Error('Backend Facebook login failed.');
          sessionToken = response.token;
        } catch (fbErr: any) {
          const fbBackendMsg = fbErr?.response?.data?.message || fbErr?.message || '';
          if (fbBackendMsg.includes('Email is required')) {
            setPendingFbData({ accessToken: data.accessToken, userID: data.userID });
            setPromptEmail('');
            setPromptEmailError(null);
            setEmailPromptVisible(true);
            setLoading(false);
            return;
          }
          throw fbErr;
        }
      } else if (provider === 'Apple') {
        if (Platform.OS === 'ios') {
          const appleAuthRequestResponse = await appleAuth.performRequest({
            requestedOperation: appleAuth.Operation.LOGIN,
            requestedScopes: [appleAuth.Scope.EMAIL, appleAuth.Scope.FULL_NAME],
          });
          const credentialState = await appleAuth.getCredentialStateForUser(appleAuthRequestResponse.user);
          if (credentialState === appleAuth.State.AUTHORIZED) {
            const identityToken = appleAuthRequestResponse.identityToken || '';
            if (!identityToken) throw new Error('Apple Sign-In succeeded, but no Identity Token was received.');
            let fullNameStr = '';
            if (appleAuthRequestResponse.fullName) {
              const first = appleAuthRequestResponse.fullName.givenName || '';
              const last = appleAuthRequestResponse.fullName.familyName || '';
              fullNameStr = `${first} ${last}`.trim();
            }
            const emailVal = appleAuthRequestResponse.email || '';
            const response = await appleLogin({ identityToken, email: emailVal, fullName: fullNameStr || undefined });
            if (!response.token) throw new Error('Backend Apple login failed.');
            sessionToken = response.token;
          } else {
            throw new Error('Apple Sign-In failed or was unauthorized.');
          }
        } else {
          throw new Error('Apple Sign-In is only natively supported on iOS.');
        }
      } else {
        await new Promise<void>((resolve) => setTimeout(() => resolve(), 800));
        sessionToken = `mock-${provider.toLowerCase()}-token-${Date.now()}`;
      }

      setAuthToken(sessionToken);
      try { await saveTokens({ accessToken: sessionToken, refreshToken: `mock-refresh-token-${Date.now()}` }); } catch { }
      Alert.alert('Success', `Logged in successfully with ${provider}!`);
      navigation.replace && navigation.replace('Main');
    } catch (err: any) {
      const backendMsg = err?.response?.data?.message || err?.response?.data?.errors?.[0]?.message;
      if (provider === 'Google') {
        if (err.code === statusCodes.SIGN_IN_CANCELLED) setError('Google Login cancelled by user.');
        else if (err.code === statusCodes.IN_PROGRESS) setError('Google Login already in progress.');
        else if (err.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) setError('Google Play Services not available or outdated.');
        else setError(backendMsg || err.message || 'Google Login failed');
      } else if (provider === 'Facebook') {
        setError(backendMsg || err.message || 'Facebook Login failed');
      } else if (provider === 'Apple') {
        setError(backendMsg || err.message || 'Apple Login failed');
      } else {
        setError(backendMsg || `${provider} login failed`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleFbEmailSubmit = async () => {
    if (!promptEmail) { setPromptEmailError('Email is required'); return; }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(promptEmail)) { setPromptEmailError('Please enter a valid email address'); return; }
    if (!pendingFbData) { setEmailPromptVisible(false); return; }
    setPromptEmailError(null);
    setLoading(true);
    try {
      const response = await facebookLogin({ accessToken: pendingFbData.accessToken, userID: pendingFbData.userID, email: promptEmail });
      if (!response.token) throw new Error('Backend Facebook login failed.');
      setEmailPromptVisible(false);
      setPendingFbData(null);
      const sessionToken = response.token;
      setAuthToken(sessionToken);
      try { await saveTokens({ accessToken: sessionToken, refreshToken: response.refresh_token || `mock-refresh-token-${Date.now()}` }); } catch { }
      Alert.alert('Success', 'Logged in successfully with Facebook!');
      navigation.replace && navigation.replace('Main');
    } catch (err: any) {
      const backendMsg = err?.response?.data?.message || err?.message || 'Facebook Login failed';
      setPromptEmailError(backendMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor={BRAND.bg} />

      {/* Decorative blobs */}
      <View style={styles.bgDecorTop} />
      <View style={styles.bgDecorBottom} />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}
      >
        <ScrollView
          ref={scrollViewRef}
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ── Header ── */}
          <Animated.View style={[
            styles.headerSection,
            {
              opacity: headerAnim,
              transform: [{ translateY: headerAnim.interpolate({ inputRange: [0, 1], outputRange: [-30, 0] }) }],
            },
          ]}>
            <Logo size={80} />
            <Text style={styles.welcomeText}>Welcome</Text>
            <Text style={styles.subtitleText}>Sign in to continue your creative journey</Text>
          </Animated.View>

          {/* ── Card ── */}
          <Animated.View style={[
            styles.card,
            {
              opacity: formAnim,
              transform: [
                { translateY: formAnim.interpolate({ inputRange: [0, 1], outputRange: [40, 0] }) },
                { translateX: errorShake },
              ],
            },
          ]}>

            {/* Error Banner */}
            {error ? (
              <View style={styles.errorBanner}>
                <Text style={styles.errorBannerIcon}>⚠</Text>
                <Text style={styles.errorBannerText}>{error}</Text>
              </View>
            ) : null}

            {/* ── Social Buttons ── */}
            <TouchableOpacity
              style={styles.socialFullBtn}
              onPress={() => handleSocialLogin('Google')}
              disabled={loading}
              activeOpacity={0.8}
            >
              <GoogleIcon size={20} />
              <Text style={styles.socialFullBtnText}>Continue with Google</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.socialFullBtn]}
              onPress={() => handleSocialLogin('Facebook')}
              disabled={loading}
              activeOpacity={0.8}
            >
              <FacebookIcon size={20} />
              <Text style={styles.socialFullBtnText}>Continue with Facebook</Text>
            </TouchableOpacity>

            {Platform.OS === 'ios' && (
              <TouchableOpacity
              style={[styles.socialFullBtn, styles.socialFullBtnApple]}
              onPress={() => handleSocialLogin('Apple')}
              disabled={loading}
              activeOpacity={0.8}
            >
              <AppleIcon size={20}  />
              <Text style={[styles.socialFullBtnText, { color: '#ffffff' }]}>Continue with Apple</Text>
            </TouchableOpacity>
            )}

            {/* ── Divider ── */}
            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* ── Continue with Email Toggle ── */}
            <TouchableOpacity
              style={[styles.emailToggleBtn, showEmailForm && styles.emailToggleBtnActive]}
              onPress={handleToggleEmailForm}
              activeOpacity={0.8}
              disabled={loading}
            >
              <MailIcon size={18} color={showEmailForm ? BRAND.primary : BRAND.textSecondary} />
              <Text style={[styles.emailToggleBtnText, showEmailForm && styles.emailToggleBtnTextActive]}>
                Continue with Email
              </Text>
              <Animated.View style={{
                transform: [{
                  rotate: emailFormAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] })
                }]
              }}>
                <ChevronDownIcon size={16} />
              </Animated.View>
            </TouchableOpacity>

            {/* ── Email Form (animated slide in) ── */}
            {showEmailForm && (
              <Animated.View style={[
                styles.emailFormContainer,
                {
                  opacity: emailFormAnim,
                  transform: [{
                    translateY: emailFormAnim.interpolate({ inputRange: [0, 1], outputRange: [-12, 0] }),
                  }],
                },
              ]}>
                <AnimatedInput
                  label="Email address"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  returnKeyType="next"
                  onSubmitEditing={() => passwordRef.current?.focus && passwordRef.current.focus()}
                  leftIcon={<MailIcon size={18} />}
                  editable={!loading}
                />

                <AnimatedInput
                  label="Password"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  returnKeyType="done"
                  onSubmitEditing={handleLogin}
                  inputRef={passwordRef}
                  editable={!loading}
                  leftIcon={<LockIcon size={18} />}
                  rightElement={
                    <TouchableOpacity
                      onPress={() => setShowPassword(!showPassword)}
                      style={styles.eyeBtn}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                      <EyeIcon visible={showPassword} size={20} />
                    </TouchableOpacity>
                  }
                />

                {/* Forgot Password */}
                <TouchableOpacity
                  style={styles.forgotBtn}
                  onPress={() => navigation.navigate('ForgotPassword')}
                >
                  <Text style={styles.forgotText}>Forgot password?</Text>
                </TouchableOpacity>

                {/* Sign In Button */}
                <TouchableOpacity
                  style={[styles.loginBtn, loading && styles.loginBtnDisabled]}
                  onPress={handleLogin}
                  disabled={loading}
                  activeOpacity={0.85}
                >
                  {loading ? (
                    <ActivityIndicator color={BRAND.white} size="small" />
                  ) : (
                    <Text style={styles.loginBtnText}>Sign In</Text>
                  )}
                  <View style={styles.loginBtnShimmer} />
                </TouchableOpacity>
              </Animated.View>
            )}

            {/* ── Sign Up ── */}
            <View style={styles.signupRow}>
              <Text style={styles.signupPromptText}>Don't have an account?</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Signup')} activeOpacity={0.7}>
                <Text style={styles.signupLinkText}> Sign up</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* ── Facebook Email Prompt Dialog ── */}
      <Portal>
        <Modal
          visible={emailPromptVisible}
          onDismiss={() => {
            if (!loading) { setEmailPromptVisible(false); setPendingFbData(null); }
          }}
          contentContainerStyle={styles.dialogContainer}
        >
          <Text style={styles.dialogTitle}>Email Required</Text>
          <Text style={styles.dialogSubtitle}>
            Your Facebook account didn't share an email. Please provide one to complete sign-up.
          </Text>

          {promptEmailError ? (
            <View style={styles.dialogErrorBanner}>
              <Text style={styles.dialogErrorText}>{promptEmailError}</Text>
            </View>
          ) : null}

          <AnimatedInput
            label="Email Address"
            value={promptEmail}
            onChangeText={setPromptEmail}
            keyboardType="email-address"
            returnKeyType="done"
            onSubmitEditing={handleFbEmailSubmit}
            leftIcon={<MailIcon size={18} />}
            editable={!loading}
          />

          <View style={styles.dialogActions}>
            <TouchableOpacity
              style={styles.dialogCancelBtn}
              onPress={() => { setEmailPromptVisible(false); setPendingFbData(null); }}
              disabled={loading}
            >
              <Text style={styles.dialogCancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.dialogSubmitBtn, loading && styles.loginBtnDisabled]}
              onPress={handleFbEmailSubmit}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={BRAND.white} size="small" />
              ) : (
                <Text style={styles.dialogSubmitText}>Submit</Text>
              )}
            </TouchableOpacity>
          </View>
        </Modal>
      </Portal>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: BRAND.bg,
  },
  bgDecorTop: {
    position: 'absolute',
    top: -80,
    right: -80,
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: BRAND.primary,
    opacity: 0.05,
  },
  bgDecorBottom: {
    position: 'absolute',
    bottom: -60,
    left: -60,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: BRAND.primary,
    opacity: 0.04,
  },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingBottom: 40,
    justifyContent: 'center',
    minHeight: SCREEN_HEIGHT,
  },

  // Header
  headerSection: {
    alignItems: 'center',
    paddingTop: 20,
    paddingBottom: 8,
  },
  welcomeText: {
    fontSize: 30,
    fontWeight: '800',
    color: BRAND.textPrimary,
    letterSpacing: -0.5,
    marginTop: 4,
  },
  subtitleText: {
    fontSize: 14,
    color: BRAND.textSecondary,
    marginTop: 6,
    textAlign: 'center',
    lineHeight: 20,
  },

  // Card
  card: {
    marginTop: 28,
    backgroundColor: BRAND.cardBg,
    borderRadius: 28,
    padding: 24,
    borderWidth: 1,
    borderColor: '#f0e5e5',
    shadowColor: '#df103f',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 6,
  },

  // Error Banner
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,77,109,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,77,109,0.3)',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 16,
    gap: 8,
  },
  errorBannerIcon: { fontSize: 14, color: BRAND.error },
  errorBannerText: { flex: 1, color: BRAND.error, fontSize: 13, lineHeight: 18 },

  // Social Full-Width Buttons
  socialFullBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    height: 52,
    borderRadius: 16,
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderColor: '#e8e0e0',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  socialFullBtnApple: {
    borderColor: '#1a1a1a',
    backgroundColor: '#1a1a1a',
  },
  socialFullBtnText: {
    color: '#3d2d2d',
    fontSize: 14,
    fontWeight: '600',
  },

  // Divider
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: BRAND.divider },
  dividerText: {
    marginHorizontal: 14,
    color: BRAND.textMuted,
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },

  // Email Toggle Button
  emailToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 16,
    height: 52,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#e0d0d0',
    backgroundColor: '#ffffff',
    marginBottom: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  emailToggleBtnActive: {
    borderColor: BRAND.primary,
  },
  emailToggleBtnText: {
    flex: 1,
    textAlign: 'center',
    color: '#5c3d3d',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  emailToggleBtnTextActive: {
    color: BRAND.primary,
  },

  // Email Form
  emailFormContainer: {
    marginTop: 16,
  },

  // Animated Input
  inputWrapper: {
    borderWidth: 1.5,
    borderRadius: 16,
    backgroundColor: BRAND.inputBg,
    marginBottom: 14,
    paddingHorizontal: 14,
    paddingTop: 20,
    paddingBottom: 10,
    position: 'relative',
    minHeight: 62,
  },
  floatingLabel: {
    position: 'absolute',
    left: 46,
    fontWeight: '500',
    zIndex: 1,
  },
  inputRow: { flexDirection: 'row', alignItems: 'center' },
  inputLeftIcon: { marginRight: 10, opacity: 0.7 },
  textInput: {
    flex: 1,
    color: BRAND.textPrimary,
    fontSize: 15,
    fontWeight: '500',
    paddingVertical: 0,
    height: 28,
  },
  inputRightIcon: { paddingLeft: 8 },
  eyeBtn: { padding: 2 },

  // Forgot Password
  forgotBtn: { alignSelf: 'flex-end', marginBottom: 20, marginTop: 2 },
  forgotText: { color: BRAND.primary, fontSize: 13, fontWeight: '600' },

  // Login Button
  loginBtn: {
    backgroundColor: BRAND.primary,
    borderRadius: 16,
    height: 54,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    shadowColor: BRAND.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 10,
  },
  loginBtnDisabled: { opacity: 0.65 },
  loginBtnText: { color: BRAND.white, fontSize: 16, fontWeight: '700', letterSpacing: 0.5 },
  loginBtnShimmer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '45%',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderBottomLeftRadius: 100,
    borderBottomRightRadius: 100,
    pointerEvents: 'none',
  },

  // Sign up
  signupRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  signupPromptText: { color: BRAND.textMuted, fontSize: 14 },
  signupLinkText: { color: BRAND.primary, fontSize: 14, fontWeight: '700' },

  // Dialog
  dialogContainer: {
    backgroundColor: '#ffffff',
    padding: 24,
    margin: 20,
    borderRadius: 24,
    alignSelf: 'center',
    width: '90%',
    maxWidth: 400,
    borderWidth: 1,
    borderColor: '#f0e5e5',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 16,
  },
  dialogTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: BRAND.textPrimary,
    letterSpacing: -0.3,
    marginBottom: 8,
  },
  dialogSubtitle: {
    fontSize: 14,
    color: BRAND.textSecondary,
    marginBottom: 20,
    lineHeight: 20,
  },
  dialogErrorBanner: {
    backgroundColor: 'rgba(255,77,109,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,77,109,0.3)',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 14,
  },
  dialogErrorText: { color: BRAND.error, fontSize: 13 },
  dialogActions: { flexDirection: 'row', gap: 12, marginTop: 16 },
  dialogCancelBtn: {
    flex: 1,
    height: 46,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#e0d0d0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dialogCancelText: { color: '#5c3d3d', fontSize: 14, fontWeight: '600' },
  dialogSubmitBtn: {
    flex: 1,
    height: 46,
    borderRadius: 14,
    backgroundColor: BRAND.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: BRAND.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },
  dialogSubmitText: { color: BRAND.white, fontSize: 14, fontWeight: '700' },
});

export default LoginScreen;
