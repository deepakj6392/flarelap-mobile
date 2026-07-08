import 'react-native-gesture-handler';
import React from 'react';
import { StatusBar } from 'react-native';
import { NavigationContainer, createNavigationContainerRef } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import SplashScreen from './src/screens/SplashScreen';
import LoginScreen from './src/screens/LoginScreen';
import SignupScreen from './src/screens/SignupScreen';
import ForgotPasswordScreen from './src/screens/ForgotPasswordScreen';
import MainTabs from './src/navigation/MainTabs';
import { Provider as PaperProvider, MD3LightTheme as DefaultTheme } from 'react-native-paper';
import { THEME_COLORS } from './src/constants';
import SocialMediaScreen from './src/screens/SocialMediaScreen';
import PhotoEditorScreen from './src/screens/PhotoEditorScreen';
import VideoEditorScreen from './src/screens/VideoEditorScreen';
import MagicToolScreen from './src/screens/MagicToolScreen';
import LogoStickerScreen from './src/screens/LogoMakerScreen';
import CardMakerScreen from './src/screens/CardMakerScreen';
import QRCodeGeneratorScreen from './src/screens/QRCodeGeneratorScreen';
import BusinessAdsScreen from './src/screens/BusinessAdsScreen';
import CustomSizeScreen from './src/screens/CustomSizeScreen';
import PromotionScreen from './src/screens/PromotionScreen';
import SvgEditorScreen from './src/screens/SvgEditorScreen';

export const navigationRef = createNavigationContainerRef();

const Stack = createNativeStackNavigator();

function App(): React.JSX.Element {
  const theme = {
    ...DefaultTheme,
    colors: {
      ...DefaultTheme.colors,
      primary: THEME_COLORS.primary,
      secondary: THEME_COLORS.secondary,
      // keep other colors from DefaultTheme
    },
  } as typeof DefaultTheme;

  return (
    <PaperProvider theme={theme}>
      {/* Ensure status bar is visible on non-splash screens by default */}
      <StatusBar barStyle="light-content" hidden={false} />
      <NavigationContainer ref={navigationRef}>
        <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName="Splash">
          <Stack.Screen name="Splash" component={SplashScreen} />
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Signup" component={SignupScreen} />
          <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
          <Stack.Screen name="Main" component={MainTabs} />
          {/* editors */}
          <Stack.Screen name="SocialMedia" component={SocialMediaScreen} />
          <Stack.Screen name="PhotoEditor" component={PhotoEditorScreen} />
          <Stack.Screen name="VideoEditor" component={VideoEditorScreen} />
          <Stack.Screen name="MagicTool" component={MagicToolScreen} />
          <Stack.Screen name="LogoSticker" component={LogoStickerScreen} />
          <Stack.Screen name="CardMaker" component={CardMakerScreen} />
          <Stack.Screen name="BusinessAds" component={BusinessAdsScreen} />
          <Stack.Screen name="CustomSize" component={CustomSizeScreen} />
          <Stack.Screen name="Promotion" component={PromotionScreen} />
          <Stack.Screen name="QRCodeGenerator" component={QRCodeGeneratorScreen} />
          <Stack.Screen name="SvgEditor" component={SvgEditorScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </PaperProvider>
  );
}

// styles intentionally omitted (not used here)

export default App;
