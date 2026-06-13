import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import HomeScreen from '../screens/MainTabs/HomeScreen';
import CreateScreen from '../screens/MainTabs/CreateScreen';
import DesignsScreen from '../screens/MainTabs/DesignsScreen';
import ProfileScreen from '../screens/MainTabs/ProfileScreen';
import { StyleSheet } from 'react-native';
import HomeSvg from '../assets/icons/home.svg';
import CreateSvg from '../assets/icons/create.svg';
import DesignsSvg from '../assets/icons/designs.svg';
import ProfileSvg from '../assets/icons/profile.svg';

const HomeIcon = ({ color, size }: { color: string; size: number }) => <HomeSvg width={size} height={size} fill={color} stroke={color} />;
const CreateIcon = ({ color, size }: { color: string; size: number }) => <CreateSvg width={size} height={size} fill={color} stroke={color} />;
const DesignsIcon = ({ color, size }: { color: string; size: number }) => <DesignsSvg width={size} height={size} fill={color} stroke={color} />;
const ProfileIcon = ({ color, size }: { color: string; size: number }) => <ProfileSvg width={size} height={size} fill={color} stroke={color} />;

const Tab = createBottomTabNavigator();

export default function MainTabs(): React.ReactElement {
  return (
    <Tab.Navigator screenOptions={{ headerShown: false }}>
      <Tab.Screen name="Create" component={CreateScreen} options={{ tabBarIcon: CreateIcon, tabBarActiveTintColor: '#df103f', tabBarLabel: 'Create', tabBarActiveBackgroundColor: '#f0f0f0' }} />
      <Tab.Screen name="Home" component={HomeScreen} options={{ tabBarIcon: HomeIcon, tabBarActiveTintColor: '#df103f', tabBarLabel: 'Home', tabBarActiveBackgroundColor: '#f0f0f0' }} />
      <Tab.Screen name="Designs" component={DesignsScreen} options={{ tabBarIcon: DesignsIcon, tabBarActiveTintColor: '#df103f', tabBarLabel: 'Designs', tabBarActiveBackgroundColor: '#f0f0f0' }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ tabBarIcon: ProfileIcon, tabBarActiveTintColor: '#df103f', tabBarLabel: 'Profile', tabBarActiveBackgroundColor: '#f0f0f0' }} />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({});
