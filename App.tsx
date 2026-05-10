import React, { useEffect, useState } from 'react';
import { StyleSheet, SafeAreaView, StatusBar, useColorScheme, View, Image, Text, Linking } from 'react-native';
import { WebView } from 'react-native-webview';
import NetInfo from '@react-native-community/netinfo';

function App(): React.JSX.Element {
  const WEBSITE_URL = 'https://flarelap.com/';
  const isDarkMode = useColorScheme() === 'dark';
  const [isConnected, setIsConnected] = useState<boolean | null>(true);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsConnected(state.isConnected);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  if (isConnected === false) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar
          barStyle={isDarkMode ? 'light-content' : 'dark-content'}
          backgroundColor={isDarkMode ? '#000000' : '#ffffff'}
        />
        <View style={styles.offlineContainer}>
          <Image
            source={require('./assets/no_internet.png')}
            style={styles.offlineImage}
            resizeMode="contain"
          />
          <Text style={[styles.offlineText, { color: isDarkMode ? '#fff' : '#000' }]}>
            No Internet Connection
          </Text>
          <Text style={[styles.offlineSubText, { color: isDarkMode ? '#ccc' : '#666' }]}>
            Please check your internet connection and try again.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor={isDarkMode ? '#000000' : '#ffffff'}
      />
      <WebView
        source={{ uri: WEBSITE_URL }}
        style={styles.webview}
        originWhitelist={['*']}
        onShouldStartLoadWithRequest={(request) => {
          // If the request URL starts with our website URL, load it in the WebView
          if (request.url.startsWith(WEBSITE_URL)) {
            return true;
          }

          // Otherwise, open in external browser
          try {
            Linking.openURL(request.url);
          } catch (e) {
            console.error("Failed to open URL:", e);
          }
          return false;
        }}
        onError={(syntheticEvent) => {
          const { nativeEvent } = syntheticEvent;
          console.warn('WebView error: ', nativeEvent);
          // Optional: handle specific webview errors here
        }}
        startInLoadingState={true}
        renderLoading={() => (
          <View style={styles.loadingContainer}>
            <Image
              source={require('./assets/logo.png')}
              style={styles.loadingLogo}
              resizeMode="contain"
            />
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000', // Match dark mode
  },
  webview: {
    flex: 1,
  },
  offlineContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  offlineImage: {
    width: 150,
    height: 150,
    marginBottom: 20,
  },
  offlineText: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  offlineSubText: {
    fontSize: 16,
    textAlign: 'center',
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  loadingLogo: {
    width: 120,
    height: 120,
  }
});

export default App;
