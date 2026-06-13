import React, {useEffect} from 'react';
import { StyleSheet, StatusBar } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Logo from '../components/Logo';
import { getTokens, clearTokens, saveTokens } from '../services/token.service';
import { refreshToken } from '../services/auth.service';
import { setAuthToken } from '../services/api.service';

function SplashScreen({navigation}: any) {
  useEffect(() => {
    let mounted = true;

    async function check() {
      try {
        const tokens = await getTokens();
  // debug: log tokens to help identify storage issues
  console.log('Splash tokens:', tokens);
  const accessToken = (tokens as any).accessToken || (tokens as any).access_token || (tokens as any).token || null;
  const rToken = (tokens as any).refreshToken || (tokens as any).refresh_token || null;
        if (accessToken && accessToken !== 'null') {
          // ensure axios default header is set (token may have been loaded from storage)
          setAuthToken(accessToken);
          navigation.replace('Main');
          return;
        }
        if (rToken && rToken !== 'null') {
          // try refresh
          const res = await refreshToken({ refreshToken: rToken });
          if (res && (res.accessToken || res.token)) {
            await saveTokens({ accessToken: res.accessToken || res.token, refreshToken: res.refreshToken || res.refresh_token || rToken });
            navigation.replace('Main');
            return;
          }
        }
      } catch {
        // clear tokens and go to login
        await clearTokens();
      }
      if (mounted) {
        setTimeout(() => navigation.replace('Login'), 600);
      }
    }

    check();
    return () => { mounted = false; };
  }, [navigation]);

  return (
    <LinearGradient
      colors={["#D9007A", "#FF1744", "#FF6A00"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <StatusBar hidden />
      <Logo size={220} />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center' },
  logoWrap: { width: 180, height: 180, justifyContent: 'center', alignItems: 'center', borderRadius: 12, backgroundColor: '#0b5' },
  logoText: { color: '#fff', fontSize: 32, fontWeight: '800' },
});

export default SplashScreen;
