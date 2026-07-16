import React, { useState, useRef } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, ScrollView, Platform, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Text, TextInput, Button, Title, Card } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Logo from '../../components/Logo';
import { THEME_COLORS } from '../../constants';
import { studentLogin, studentForgotPassword, studentResetPassword, saveStudentSession } from '../../services/student.service';
import { PasswordEyeIcon } from '../../components/icons-svg';

export default function StudentLoginScreen() {
  const navigation = useNavigation();
  const [view, setView] = useState<'login' | 'forgot' | 'otp' | 'reset'>('login');
  
  // Login Form States
  const [studentId, setStudentId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Forgot Password / OTP Verification States
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);

  // General States
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const passwordRef = useRef<any>(null);

  const handleLoginSubmit = async () => {
    setError(null);
    setSuccess(null);
    if (!studentId.trim() || !password.trim()) {
      setError('Please fill in all fields.');
      return;
    }

    setLoading(true);
    try {
      const res = await studentLogin({ studentId, password });
      if (res && res.token) {
        // Save session locally
        await saveStudentSession(res.token, res.student || res.user);
        setSuccess('Logged in successfully!');
        
        // Reset states
        setStudentId('');
        setPassword('');
        
        // Navigate to Dashboard (using navigate reset structure to clear stack history)
        // @ts-ignore
        navigation.reset && (navigation as any).reset({
          index: 0,
          routes: [{ name: 'StudentDashboard' }],
        });
      } else {
        setError('Login failed: Token not received.');
      }
    } catch (err: any) {
      console.error('Student login error:', err);
      setError(err?.response?.data?.message || err?.message || 'Invalid Student ID or Password.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotRequest = async () => {
    setError(null);
    setSuccess(null);
    if (!email.trim()) {
      setError('Email address is required.');
      return;
    }

    setLoading(true);
    try {
      await studentForgotPassword(email);
      setSuccess('Verification OTP sent to your email!');
      setView('otp');
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Failed to send OTP.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = () => {
    setError(null);
    setSuccess(null);
    if (otp.length !== 6) {
      setError('Please enter a valid 6-digit OTP.');
      return;
    }
    setView('reset');
  };

  const handleResetPassword = async () => {
    setError(null);
    setSuccess(null);
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);
    try {
      await studentResetPassword({
        email,
        otp,
        newPassword,
      });
      setSuccess('Password reset successfully! Please login.');
      setView('login');
      setOtp('');
      setEmail('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Password reset failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Student Hub</Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}
      >
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.logoContainer}>
            <Logo size={120} />
            <Title style={styles.title}>
              {view === 'login' && 'Student Login'}
              {view === 'forgot' && 'Forgot Password'}
              {view === 'otp' && 'Verify OTP'}
              {view === 'reset' && 'Reset Password'}
            </Title>
            <Text style={styles.subtitle}>
              {view === 'login' && 'Access your academic and internship workspace'}
              {view === 'forgot' && 'Enter your registered email for OTP'}
              {view === 'otp' && `Enter the 6-digit code sent to ${email}`}
              {view === 'reset' && 'Choose a strong new password for your account'}
            </Text>
          </View>

          {error ? (
            <Card style={styles.errorCard}>
              <Card.Content style={styles.errorCardContent}>
                <Text style={styles.errorText}>{error}</Text>
              </Card.Content>
            </Card>
          ) : null}

          {success ? (
            <Card style={styles.successCard}>
              <Card.Content style={styles.successCardContent}>
                <Text style={styles.successText}>{success}</Text>
              </Card.Content>
            </Card>
          ) : null}

          {view === 'login' && (
            <View style={styles.form}>
              <TextInput
                mode="outlined"
                label="Student ID / Email"
                placeholder="Enter Student ID or email"
                style={[styles.input, styles.roundInput]}
                outlineStyle={styles.roundInput}
                dense
                value={studentId}
                onChangeText={setStudentId}
                autoCapitalize="none"
                returnKeyType="next"
                onSubmitEditing={() => passwordRef.current?.focus && passwordRef.current.focus()}
              />

              <TextInput
                ref={passwordRef}
                mode="outlined"
                label="Password"
                placeholder="Enter Password"
                style={[styles.input, styles.roundInput]}
                outlineStyle={styles.roundInput}
                dense
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={setPassword}
                returnKeyType="done"
                onSubmitEditing={handleLoginSubmit}
                right={
                  <TextInput.Icon
                    icon={props => <PasswordEyeIcon visible={showPassword} {...props} />}
                    onPress={() => setShowPassword(!showPassword)}
                  />
                }
              />

              <TouchableOpacity style={styles.forgotBtn} onPress={() => { setView('forgot'); setError(null); setSuccess(null); }}>
                <Text style={styles.forgotText}>Forgot Password?</Text>
              </TouchableOpacity>

              <Button
                mode="contained"
                onPress={handleLoginSubmit}
                style={[styles.button, styles.roundBtn]}
                disabled={loading}
                loading={loading}
                buttonColor={THEME_COLORS.primary}
              >
                Sign In
              </Button>

              <View style={styles.footerRow}>
                <Text style={styles.footerLabel}>New student? </Text>
                <TouchableOpacity onPress={() => navigation.navigate('StudentRegister' as never)}>
                  <Text style={styles.footerLink}>Register / Enroll Here</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {view === 'forgot' && (
            <View style={styles.form}>
              <TextInput
                mode="outlined"
                label="Registered Email Address"
                placeholder="Enter email address"
                style={[styles.input, styles.roundInput]}
                outlineStyle={styles.roundInput}
                dense
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
              />

              <Button
                mode="contained"
                onPress={handleForgotRequest}
                style={[styles.button, styles.roundBtn]}
                disabled={loading}
                loading={loading}
                buttonColor={THEME_COLORS.primary}
              >
                Send OTP
              </Button>

              <TouchableOpacity style={styles.backToLogin} onPress={() => { setView('login'); setError(null); setSuccess(null); }}>
                <Text style={styles.backToLoginText}>Back to Login</Text>
              </TouchableOpacity>
            </View>
          )}

          {view === 'otp' && (
            <View style={styles.form}>
              <TextInput
                mode="outlined"
                label="6-Digit OTP Code"
                placeholder="Enter OTP code"
                style={[styles.input, styles.roundInput]}
                outlineStyle={styles.roundInput}
                dense
                keyboardType="numeric"
                maxLength={6}
                value={otp}
                onChangeText={setOtp}
              />

              <Button
                mode="contained"
                onPress={handleVerifyOTP}
                style={[styles.button, styles.roundBtn]}
                buttonColor={THEME_COLORS.primary}
              >
                Verify Code
              </Button>

              <TouchableOpacity style={styles.backToLogin} onPress={() => { setView('forgot'); setError(null); setSuccess(null); }}>
                <Text style={styles.backToLoginText}>Resend Code / Change Email</Text>
              </TouchableOpacity>
            </View>
          )}

          {view === 'reset' && (
            <View style={styles.form}>
              <TextInput
                mode="outlined"
                label="New Password"
                placeholder="Min 6 characters"
                style={[styles.input, styles.roundInput]}
                outlineStyle={styles.roundInput}
                dense
                secureTextEntry={!showNewPassword}
                value={newPassword}
                onChangeText={setNewPassword}
                right={
                  <TextInput.Icon
                    icon={props => <PasswordEyeIcon visible={showNewPassword} {...props} />}
                    onPress={() => setShowNewPassword(!showNewPassword)}
                  />
                }
              />

              <TextInput
                mode="outlined"
                label="Confirm New Password"
                placeholder="Confirm password"
                style={[styles.input, styles.roundInput]}
                outlineStyle={styles.roundInput}
                dense
                secureTextEntry={!showNewPassword}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                right={
                  <TextInput.Icon
                    icon={props => <PasswordEyeIcon visible={showNewPassword} {...props} />}
                    onPress={() => setShowNewPassword(!showNewPassword)}
                  />
                }
              />

              <Button
                mode="contained"
                onPress={handleResetPassword}
                style={[styles.button, styles.roundBtn]}
                disabled={loading}
                loading={loading}
                buttonColor={THEME_COLORS.primary}
              >
                Reset Password
              </Button>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  backButton: {
    padding: 8,
    borderRadius: 8,
  },
  backArrow: {
    fontSize: 24,
    color: '#0f172a',
    fontWeight: 'bold',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
  },
  scroll: {
    padding: 24,
    alignItems: 'stretch',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0f172a',
    marginTop: 16,
  },
  subtitle: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 20,
    paddingHorizontal: 12,
  },
  form: {
    width: '100%',
  },
  input: {
    marginBottom: 16,
    backgroundColor: '#ffffff',
  },
  roundInput: {
    borderRadius: 16,
  },
  forgotBtn: {
    alignSelf: 'flex-end',
    marginBottom: 24,
  },
  forgotText: {
    color: '#3b82f6',
    fontWeight: '600',
    fontSize: 13,
  },
  button: {
    marginVertical: 8,
  },
  roundBtn: {
    borderRadius: 24,
    paddingVertical: 4,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  footerLabel: {
    color: '#64748b',
    fontSize: 14,
  },
  footerLink: {
    color: '#df103f',
    fontWeight: '700',
    fontSize: 14,
  },
  backToLogin: {
    alignSelf: 'center',
    marginTop: 16,
  },
  backToLoginText: {
    color: '#64748b',
    fontWeight: '600',
    fontSize: 13,
  },
  errorCard: {
    backgroundColor: '#fef2f2',
    borderColor: '#fca5a5',
    borderWidth: 1,
    marginBottom: 20,
    borderRadius: 12,
    elevation: 0,
  },
  errorCardContent: {
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  errorText: {
    color: '#dc2626',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  successCard: {
    backgroundColor: '#f0fdf4',
    borderColor: '#86efac',
    borderWidth: 1,
    marginBottom: 20,
    borderRadius: 12,
    elevation: 0,
  },
  successCardContent: {
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  successText: {
    color: '#16a34a',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
});
