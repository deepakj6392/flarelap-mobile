import { createAsyncStorage } from '@react-native-async-storage/async-storage';
import { setAuthToken } from './api.service';

const ACCESS_KEY = '@flarelap:access_token';
const REFRESH_KEY = '@flarelap:refresh_token';

const databaseName = '@flarelap:database';

export async function createDatabase() {
  const db = createAsyncStorage(databaseName);
  return db;
}

export async function getDatabase() {
  const db = createAsyncStorage(databaseName);
  return db;
}

export async function saveTokens(tokens: { accessToken?: string | null; refreshToken?: string | null }) {
  try {
    if (tokens.accessToken) {
      (await getDatabase()).setItem(ACCESS_KEY, tokens.accessToken);
      setAuthToken(tokens.accessToken);
    }
    if (tokens.refreshToken) {
      (await getDatabase()).setItem(REFRESH_KEY, tokens.refreshToken);
    }
  } catch(ex) {
    console.error('Error saving tokens:', ex);
    // ignore storage errors for now
  }
}

export async function getTokens() {
  try {
    const [accessToken, refreshToken] = await Promise.all([(await getDatabase()).getItem(ACCESS_KEY), (await getDatabase()).getItem(REFRESH_KEY)]);
    return { accessToken, refreshToken };
  } catch (ex) {
    console.error('Error getting tokens:', ex);
    return { accessToken: null, refreshToken: null };
  }
}

export async function clearTokens() {
  try {
    await Promise.all([(await getDatabase()).removeItem(ACCESS_KEY), (await getDatabase()).removeItem(REFRESH_KEY)]);
  } catch {
    // ignore
  } finally {
    setAuthToken(null);
  }
}

export default { saveTokens, getTokens, clearTokens };
