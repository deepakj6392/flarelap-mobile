import React, { useRef, useEffect } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import HomeScreen from '../screens/MainTabs/HomeScreen';
import CreateScreen from '../screens/MainTabs/CreateScreen';
import DesignsScreen from '../screens/MainTabs/DesignsScreen';
import ProfileScreen from '../screens/MainTabs/ProfileScreen';
import { StyleSheet, View, TouchableOpacity, Animated } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import HomeSvg from '../assets/icons/home.svg';
import CreateSvg from '../assets/icons/create.svg';
import DesignsSvg from '../assets/icons/designs.svg';
import ProfileSvg from '../assets/icons/profile.svg';

const HomeIcon = ({ color, size }: { color: string; size: number }) => <HomeSvg width={size} height={size} fill={color} stroke={color} />;
const CreateIcon = ({ color, size }: { color: string; size: number }) => <CreateSvg width={size} height={size} fill={color} stroke={color} />;
const DesignsIcon = ({ color, size }: { color: string; size: number }) => <DesignsSvg width={size} height={size} fill={color} stroke={color} />;
const ProfileIcon = ({ color, size }: { color: string; size: number }) => <ProfileSvg width={size} height={size} fill={color} stroke={color} />;

const Tab = createBottomTabNavigator();

const CreatorPlaceholder = () => null;

function FloatingCenterButton({ onPress }: any) {
  const scaleValue = useRef(new Animated.Value(1)).current;
  const floatValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const floatAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(floatValue, {
          toValue: -4,
          duration: 1800,
          useNativeDriver: true,
        }),
        Animated.timing(floatValue, {
          toValue: 0,
          duration: 1800,
          useNativeDriver: true,
        }),
      ])
    );
    floatAnimation.start();
    return () => floatAnimation.stop();
  }, [floatValue]);

  const handlePressIn = () => {
    Animated.spring(scaleValue, {
      toValue: 0.85,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleValue, {
      toValue: 1,
      friction: 4,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };

  return (
    <View style={styles.floatingContainer}>
      <Animated.View
        style={[
          styles.buttonWrapper,
          {
            transform: [
              { scale: scaleValue },
              { translateY: floatValue }
            ]
          }
        ]}
      >
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={onPress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          style={styles.floatingButton}
        >
          <Svg width={28} height={28} viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <Path d="M12 3l1.912 5.813a2 2 0 001.275 1.275L21 12l-5.813 1.912a2 2 0 00-1.275 1.275L12 21l-1.912-5.813a2 2 0 00-1.275-1.275L3 12l5.813-1.912a2 2 0 001.275-1.275L12 3z" />
            <Path d="M5 3l.5 1.5L7 5l-1.5.5L5 7l-.5-1.5L3 5l1.5-.5L5 3z" />
          </Svg>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

export default function MainTabs(): React.ReactElement {
  return (
    <Tab.Navigator screenOptions={{ headerShown: false }}>
      <Tab.Screen name="Create" component={CreateScreen} options={{ tabBarIcon: CreateIcon, tabBarActiveTintColor: '#df103f', tabBarLabel: 'Create', tabBarActiveBackgroundColor: '#f0f0f0' }} />
      <Tab.Screen name="Home" component={HomeScreen} options={{ tabBarIcon: HomeIcon, tabBarActiveTintColor: '#df103f', tabBarLabel: 'Home', tabBarActiveBackgroundColor: '#f0f0f0' }} />
      <Tab.Screen
        name="Creator"
        component={CreatorPlaceholder}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            e.preventDefault();
            navigation.navigate('SvgEditor');
          },
        })}
        options={{
          tabBarButton: (props) => <FloatingCenterButton {...props} />,
        }}
      />
      <Tab.Screen name="Designs" component={DesignsScreen} options={{ tabBarIcon: DesignsIcon, tabBarActiveTintColor: '#df103f', tabBarLabel: 'Designs', tabBarActiveBackgroundColor: '#f0f0f0' }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ tabBarIcon: ProfileIcon, tabBarActiveTintColor: '#df103f', tabBarLabel: 'Profile', tabBarActiveBackgroundColor: '#f0f0f0' }} />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  floatingContainer: {
    position: 'relative',
    width: 70,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonWrapper: {
    position: 'absolute',
    top: -24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  floatingButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#df103f',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#df103f',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 5,
    borderWidth: 3,
    borderColor: '#ffffff',
  },
});
