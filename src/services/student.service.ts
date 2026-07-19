import { getDatabase } from './token.service';
import api from './api.service';

const STUDENT_TOKEN_KEY = '@flarelap:student_token';
const STUDENT_USER_KEY = '@flarelap:student_user';

export async function saveStudentSession(token: string, student: any) {
  try {
    const db = await getDatabase();
    await Promise.all([
      db.setItem(STUDENT_TOKEN_KEY, token),
      db.setItem(STUDENT_USER_KEY, JSON.stringify(student)),
    ]);
  } catch (e) {
    console.error('Error saving student session:', e);
  }
}

export async function getStudentSession() {
  try {
    const db = await getDatabase();
    const [token, userStr] = await Promise.all([
      db.getItem(STUDENT_TOKEN_KEY),
      db.getItem(STUDENT_USER_KEY),
    ]);
    return {
      token,
      user: userStr ? JSON.parse(userStr) : null,
    };
  } catch (e) {
    console.error('Error getting student session:', e);
    return { token: null, user: null };
  }
}

export async function clearStudentSession() {
  try {
    const db = await getDatabase();
    await Promise.all([
      db.removeItem(STUDENT_TOKEN_KEY),
      db.removeItem(STUDENT_USER_KEY),
    ]);
  } catch (e) {
    console.error('Error clearing student session:', e);
  }
}

// Student API Calls
export async function studentLogin(payload: any) {
  // payload should contain studentId and password
  const res = await api.post('/students/login', payload);
  return res.data;
}

export async function studentRegister(payload: any) {
  const res = await api.post('/students/register', payload);
  return res.data;
}

export async function studentForgotPassword(email: string) {
  const res = await api.post('/students/forgot-password', { email });
  return res.data;
}

export async function studentResetPassword(payload: any) {
  // payload should contain email, otp, newPassword
  const res = await api.post('/students/reset-password', payload);
  return res.data;
}

export async function getStudentProfile(studentId: string, token: string) {
  const res = await api.get(`/api/students/${studentId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
}

export async function updateStudentProfile(studentId: string, studentData: any, token: string) {
  const res = await api.put(`/api/students/${studentId}`, studentData, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
}

export async function getLecturesByCourse(courseName: string) {
  const res = await api.get(`/api/courses/by-name/lectures?name=${encodeURIComponent(courseName)}`);
  return res.data;
}

export async function getStudentTickets(studentId: string, token: string) {
  const res = await api.get(`/api/student-support/student/${studentId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
}

export async function createStudentTicket(ticketData: any, token: string) {
  const res = await api.post('/api/student-support', ticketData, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
}

export async function createStudentPaymentOrder(payload: { studentId: string; amount: number }) {
  const res = await api.post('/student-payments/create-order', payload);
  return res.data;
}

export async function verifyStudentPayment(payload: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) {
  const res = await api.post('/student-payments/verify-payment', payload);
  return res.data;
}

export async function getStudentActivities(studentId: string) {
  const res = await api.get(`/student-activities/${studentId}`);
  return res.data;
}

export async function addStudentActivity(payload: any) {
  const res = await api.post('/student-activities/add', payload);
  return res.data;
}

