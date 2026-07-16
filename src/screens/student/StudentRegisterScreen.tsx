import React, { useState, useEffect } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, ScrollView, Platform, TouchableOpacity, Switch } from 'react-native';
import { Text, TextInput, Button, Title, Card } from 'react-native-paper';
import { useNavigation, useRoute } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import RazorpayCheckout from 'react-native-razorpay';
import api from '../../services/api.service';
import { THEME_COLORS } from '../../constants';
import { RAZORPAY_KEY_ID } from '../../constants/config';
import { studentRegister, createStudentPaymentOrder, verifyStudentPayment } from '../../services/student.service';

export default function StudentRegisterScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { programId } = (route.params || {}) as { programId?: string };

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [loadingProgram, setLoadingProgram] = useState(false);
  const [program, setProgram] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form Fields
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  const [collegeName, setCollegeName] = useState('');
  const [rollNumber, setRollNumber] = useState('');
  const [department, setDepartment] = useState('');

  const [address, setAddress] = useState('');
  const [country, setCountry] = useState('India');
  const [stateVal, setStateVal] = useState('');
  const [pincode, setPincode] = useState('');
  const [consent, setConsent] = useState(false);

  // Date Fields
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState('');

  // Fetch program if programId is provided
  useEffect(() => {
    const fetchProgramDetails = async () => {
      if (!programId) return;
      setLoadingProgram(true);
      try {
        const response = await api.get(`/courses/${programId}`);
        const data = response.data?.data || response.data;
        if (data) {
          setProgram(data);
          setDepartment(data.programName || '');
        }
      } catch (err) {
        console.error('Error fetching course for registration:', err);
      } finally {
        setLoadingProgram(false);
      }
    };
    fetchProgramDetails();
  }, [programId]);

  // Dynamic End Date calculations based on start date and program duration
  useEffect(() => {
    if (!startDate) return;
    
    // Parse duration helper
    const getParsedDuration = () => {
      if (!program || !program.duration) return { value: '3', type: 'month' };
      const val = parseInt(program.duration);
      if (isNaN(val)) return { value: '3', type: 'month' };

      if (program.duration.toLowerCase().includes('day')) {
        return { value: val.toString(), type: 'day' };
      } else if (program.duration.toLowerCase().includes('week')) {
        return { value: val.toString(), type: 'week' };
      } else {
        return { value: val.toString(), type: 'month' };
      }
    };

    const start = new Date(startDate);
    const end = new Date(start);
    const { value, type } = getParsedDuration();
    const val = parseInt(value) || 3;

    if (type === 'day') {
      end.setDate(start.getDate() + val - 1);
    } else if (type === 'week') {
      end.setDate(start.getDate() + (val * 7) - 1);
    } else {
      end.setMonth(start.getMonth() + val);
      end.setDate(end.getDate() - 1);
    }

    setEndDate(end.toISOString().split('T')[0]);
  }, [startDate, program]);

  const validateStep = (currentStep: number) => {
    setError(null);
    if (currentStep === 1) {
      if (!firstName.trim() || !lastName.trim()) {
        setError('First name and last name are required.');
        return false;
      }
      if (!email.trim() || !email.includes('@')) {
        setError('Please enter a valid email address.');
        return false;
      }
      if (!phone.trim() || phone.length < 8) {
        setError('Please enter a valid phone number.');
        return false;
      }
    } else if (currentStep === 2) {
      if (!collegeName.trim()) {
        setError('College/Institution name is required.');
        return false;
      }
      if (!rollNumber.trim()) {
        setError('Roll or registration number is required.');
        return false;
      }
      if (!department.trim()) {
        setError('Department / Stream is required.');
        return false;
      }
    } else if (currentStep === 3) {
      if (!address.trim() || !stateVal.trim() || !pincode.trim()) {
        setError('Address, State, and Pincode are required.');
        return false;
      }
      if (country === 'India' && pincode.trim().length !== 6) {
        setError('Please enter a valid 6-digit Pincode.');
        return false;
      }
      if (!consent) {
        setError('You must agree to the terms and declaration.');
        return false;
      }
    }
    return true;
  };

  const handleNext = () => {
    if (validateStep(step)) {
      setStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    setError(null);
    setStep(prev => prev - 1);
  };

  const handleRegisterSubmit = async () => {
    if (!validateStep(3)) return;

    // Parse duration helper
    const getParsedDuration = () => {
      if (!program || !program.duration) return { value: '3', type: 'month' };
      const val = parseInt(program.duration);
      if (isNaN(val)) return { value: '3', type: 'month' };

      if (program.duration.toLowerCase().includes('day')) {
        return { value: val.toString(), type: 'day' };
      } else if (program.duration.toLowerCase().includes('week')) {
        return { value: val.toString(), type: 'week' };
      } else {
        return { value: val.toString(), type: 'month' };
      }
    };

    const parsedDuration = getParsedDuration();

    const submitData = {
      firstName,
      lastName,
      email,
      phone,
      collegeName,
      roll_number: rollNumber,
      department,
      address,
      country,
      state: stateVal,
      pincode,
      startDate,
      endDate,
      consent,
      programType: program?.category || 'course',
      courseType: program?.programName || 'Custom Program',
      durationType: parsedDuration.type,
      durationValue: parseInt(parsedDuration.value) || 3,
    };

    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const response = await studentRegister(submitData);
      const studentObj = response?.student || response?.user || response?.data || response;
      const studentId = studentObj?.id;

      if (!studentId) {
        throw new Error('Registered student ID was not returned by server.');
      }

      if (program && program.fee > 0) {
        setSuccess('Initiating secure payment checkout...');
        try {
          const orderRes = await createStudentPaymentOrder({
            studentId: studentId.toString(),
            amount: program.fee,
          });

          if (orderRes && orderRes.order_id) {
            const options = {
              key: RAZORPAY_KEY_ID || orderRes.key_id,
              amount: orderRes.amount,
              currency: orderRes.currency || 'INR',
              name: 'Flarelap Foundation',
              description: `Enrollment fee for ${program.programName}`,
              order_id: orderRes.order_id,
              prefill: {
                name: `${firstName} ${lastName}`,
                email: email,
                contact: phone,
              },
              theme: {
                color: THEME_COLORS.primary,
              },
            };

            setSuccess(null);
            
            RazorpayCheckout.open(options)
              .then(async (data: any) => {
                const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = data;
                
                setLoading(true);
                setError(null);
                setSuccess('Verifying payment details with bank...');
                
                try {
                  await verifyStudentPayment({
                    razorpay_order_id,
                    razorpay_payment_id,
                    razorpay_signature,
                  });
                  
                  setSuccess('Enrollment & Payment successful! Credentials emailed.');
                  
                  // Clear form
                  setFirstName('');
                  setLastName('');
                  setEmail('');
                  setPhone('');
                  setCollegeName('');
                  setRollNumber('');
                  setDepartment('');
                  setAddress('');
                  setStateVal('');
                  setPincode('');
                  setConsent(false);
                  
                  setTimeout(() => {
                    navigation.navigate('StudentLogin' as never);
                  }, 3000);
                } catch (verifyErr: any) {
                  setError(verifyErr?.response?.data?.message || verifyErr?.message || 'Payment verification failed. Please contact support.');
                  setSuccess(null);
                  setLoading(false);
                }
              })
              .catch((paymentError: any) => {
                console.error('Razorpay Checkout failed:', paymentError);
                setError(paymentError.description || 'Payment transaction failed or cancelled.');
                setLoading(false);
              });
          } else {
            throw new Error(orderRes?.message || 'Failed to create payment order on server.');
          }
        } catch (paymentErr: any) {
          setError(paymentErr?.response?.data?.message || paymentErr?.message || 'Failed to create payment order.');
          setSuccess(null);
          setLoading(false);
        }
      } else {
        setSuccess('Enrollment successful! Account credentials have been sent to your email.');
        
        // Clear form
        setFirstName('');
        setLastName('');
        setEmail('');
        setPhone('');
        setCollegeName('');
        setRollNumber('');
        setDepartment('');
        setAddress('');
        setStateVal('');
        setPincode('');
        setConsent(false);

        // Navigate to login
        setTimeout(() => {
          navigation.navigate('StudentLogin' as never);
        }, 3000);
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Enrollment registration failed.');
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
        <Text style={styles.headerTitle}>Student Enrollment</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Steps Indicator */}
      <View style={styles.stepsIndicator}>
        <View style={[styles.stepDot, step >= 1 ? styles.activeStepDot : null]}>
          <Text style={styles.stepNumber}>1</Text>
        </View>
        <View style={[styles.stepLine, step >= 2 ? styles.activeStepLine : null]} />
        <View style={[styles.stepDot, step >= 2 ? styles.activeStepDot : null]}>
          <Text style={styles.stepNumber}>2</Text>
        </View>
        <View style={[styles.stepLine, step >= 3 ? styles.activeStepLine : null]} />
        <View style={[styles.stepDot, step >= 3 ? styles.activeStepDot : null]}>
          <Text style={styles.stepNumber}>3</Text>
        </View>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}
      >
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          {program && (
            <Card style={styles.programCard}>
              <Card.Content>
                <Text style={styles.programCategory}>
                  {program.category === 'internship' ? 'Selected Internship' : 'Selected Training'}
                </Text>
                <Title style={styles.programName}>{program.programName}</Title>
                <Text style={styles.programMeta}>Duration: {program.duration} | Fee: ₹{program.fee?.toLocaleString('en-IN')}</Text>
              </Card.Content>
            </Card>
          )}

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

          {step === 1 && (
            <View style={styles.stepForm}>
              <Title style={styles.stepTitle}>Personal Details</Title>
              <TextInput
                mode="outlined"
                label="First Name"
                value={firstName}
                onChangeText={setFirstName}
                style={styles.input}
                outlineStyle={styles.roundInput}
                dense
              />

              <TextInput
                mode="outlined"
                label="Last Name"
                value={lastName}
                onChangeText={setLastName}
                style={styles.input}
                outlineStyle={styles.roundInput}
                dense
              />

              <TextInput
                mode="outlined"
                label="Email Address"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                style={styles.input}
                outlineStyle={styles.roundInput}
                dense
              />

              <TextInput
                mode="outlined"
                label="Phone Number"
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                style={styles.input}
                outlineStyle={styles.roundInput}
                dense
              />

              <Button
                mode="contained"
                onPress={handleNext}
                style={[styles.button, styles.roundBtn]}
                buttonColor={THEME_COLORS.primary}
              >
                Next Step
              </Button>
            </View>
          )}

          {step === 2 && (
            <View style={styles.stepForm}>
              <Title style={styles.stepTitle}>Academic Details</Title>
              <TextInput
                mode="outlined"
                label="Institution/College Name"
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
                label="Department / Course Stream"
                placeholder="e.g. Web Development / CSE"
                value={department}
                onChangeText={setDepartment}
                style={styles.input}
                outlineStyle={styles.roundInput}
                dense
              />

              <TextInput
                mode="outlined"
                label="Start Date (YYYY-MM-DD)"
                value={startDate}
                onChangeText={setStartDate}
                style={styles.input}
                outlineStyle={styles.roundInput}
                dense
              />

              <TextInput
                mode="outlined"
                label="End Date (Auto calculated)"
                value={endDate}
                disabled
                style={styles.input}
                outlineStyle={styles.roundInput}
                dense
              />

              <View style={styles.row}>
                <Button mode="outlined" onPress={handleBack} style={[styles.halfButton, styles.roundBtn]} textColor={THEME_COLORS.primary}>
                  Back
                </Button>
                <Button mode="contained" onPress={handleNext} style={[styles.halfButton, styles.roundBtn]} buttonColor={THEME_COLORS.primary}>
                  Next
                </Button>
              </View>
            </View>
          )}

          {step === 3 && (
            <View style={styles.stepForm}>
              <Title style={styles.stepTitle}>Address & Agreement</Title>
              <TextInput
                mode="outlined"
                label="Street Address"
                value={address}
                onChangeText={setAddress}
                style={styles.input}
                outlineStyle={styles.roundInput}
                dense
              />

              <TextInput
                mode="outlined"
                label="Country"
                value={country}
                onChangeText={setCountry}
                style={styles.input}
                outlineStyle={styles.roundInput}
                dense
              />

              <TextInput
                mode="outlined"
                label="State"
                value={stateVal}
                onChangeText={setStateVal}
                style={styles.input}
                outlineStyle={styles.roundInput}
                dense
              />

              <TextInput
                mode="outlined"
                label="Pincode"
                value={pincode}
                onChangeText={setPincode}
                keyboardType="numeric"
                style={styles.input}
                outlineStyle={styles.roundInput}
                dense
              />

              <View style={styles.switchRow}>
                <Switch
                  value={consent}
                  onValueChange={setConsent}
                  trackColor={{ false: '#cbd5e1', true: THEME_COLORS.primary }}
                  thumbColor="#ffffff"
                />
                <Text style={styles.switchLabel}>
                  I declare that the info provided is true and I consent to the terms of the program.
                </Text>
              </View>

              <View style={styles.row}>
                <Button mode="outlined" onPress={handleBack} style={[styles.halfButton, styles.roundBtn]} textColor={THEME_COLORS.primary}>
                  Back
                </Button>
                <Button
                  mode="contained"
                  onPress={handleRegisterSubmit}
                  style={[styles.halfButton, styles.roundBtn]}
                  disabled={loading}
                  loading={loading}
                  buttonColor={THEME_COLORS.primary}
                >
                  Enroll
                </Button>
              </View>
            </View>
          )}

          <TouchableOpacity style={styles.loginLink} onPress={() => navigation.navigate('StudentLogin' as never)}>
            <Text style={styles.loginLinkText}>Already enrolled? Login here</Text>
          </TouchableOpacity>
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
  stepsIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    backgroundColor: '#f8fafc',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  stepDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#cbd5e1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeStepDot: {
    backgroundColor: THEME_COLORS.primary,
  },
  stepNumber: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  stepLine: {
    width: 48,
    height: 3,
    backgroundColor: '#cbd5e1',
    marginHorizontal: 8,
  },
  activeStepLine: {
    backgroundColor: THEME_COLORS.primary,
  },
  scroll: {
    padding: 24,
    alignItems: 'stretch',
  },
  programCard: {
    marginBottom: 20,
    backgroundColor: '#f8fafc',
    borderColor: '#e2e8f0',
    borderWidth: 1,
    borderRadius: 16,
    elevation: 0,
  },
  programCategory: {
    fontSize: 10,
    fontWeight: '800',
    color: THEME_COLORS.primary,
    letterSpacing: 1,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  programName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
    marginVertical: 0,
  },
  programMeta: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 4,
  },
  stepForm: {
    width: '100%',
  },
  stepTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 16,
  },
  input: {
    marginBottom: 16,
    backgroundColor: '#ffffff',
  },
  roundInput: {
    borderRadius: 16,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 16,
    paddingRight: 32,
  },
  switchLabel: {
    fontSize: 13,
    color: '#475569',
    marginLeft: 12,
    lineHeight: 18,
  },
  button: {
    marginTop: 16,
  },
  halfButton: {
    flex: 0.48,
  },
  roundBtn: {
    borderRadius: 24,
    paddingVertical: 4,
  },
  loginLink: {
    alignSelf: 'center',
    marginTop: 24,
    marginBottom: 24,
  },
  loginLinkText: {
    color: '#64748b',
    fontWeight: '600',
    fontSize: 14,
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
