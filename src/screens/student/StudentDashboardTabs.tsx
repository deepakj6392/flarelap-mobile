import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Svg, { Path, Rect } from 'react-native-svg';
import StudentOverviewScreen from './StudentOverviewScreen';
import StudentClassScreen from './StudentClassScreen';
import StudentActivityScreen from './StudentActivityScreen';
import StudentSupportScreen from './StudentSupportScreen';
import StudentProfileScreen from './StudentProfileScreen';

const Tab = createBottomTabNavigator();

// Custom high-fidelity inline SVGs for tab icons
const OverviewIcon = ({ color, size }: { color: string; size: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Rect x="3" y="3" width="7" height="9" rx="1" />
    <Rect x="14" y="3" width="7" height="5" rx="1" />
    <Rect x="14" y="12" width="7" height="9" rx="1" />
    <Rect x="3" y="16" width="7" height="5" rx="1" />
  </Svg>
);

const ClassIcon = ({ color, size }: { color: string; size: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
    <Path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
  </Svg>
);

const ActivityIcon = ({ color, size }: { color: string; size: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M22 12h-4l-3 9L9 3l-3 9H2" />
  </Svg>
);

const SupportIcon = ({ color, size }: { color: string; size: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </Svg>
);

const ProfileIcon = ({ color, size }: { color: string; size: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <Path d="M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" />
  </Svg>
);

export default function StudentDashboardTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#df103f',
        tabBarInactiveTintColor: '#64748b',
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopWidth: 1,
          borderTopColor: '#e2e8f0',
          paddingBottom: 6,
          paddingTop: 6,
          height: 60,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '600',
        },
      }}
    >
      <Tab.Screen
        name="Overview"
        component={StudentOverviewScreen}
        options={{
          tabBarLabel: 'Dashboard',
          tabBarIcon: (props) => <OverviewIcon {...props} />,
        }}
      />
      <Tab.Screen
        name="MyClass"
        component={StudentClassScreen}
        options={{
          tabBarLabel: 'My Class',
          tabBarIcon: (props) => <ClassIcon {...props} />,
        }}
      />
      <Tab.Screen
        name="Activity"
        component={StudentActivityScreen}
        options={{
          tabBarLabel: 'Activity',
          tabBarIcon: (props) => <ActivityIcon {...props} />,
        }}
      />
      <Tab.Screen
        name="Support"
        component={StudentSupportScreen}
        options={{
          tabBarLabel: 'Support',
          tabBarIcon: (props) => <SupportIcon {...props} />,
        }}
      />
      <Tab.Screen
        name="StudentProfile"
        component={StudentProfileScreen}
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: (props) => <ProfileIcon {...props} />,
        }}
      />
    </Tab.Navigator>
  );
}
