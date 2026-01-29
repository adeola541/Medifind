import React from 'react';
import { Tabs } from 'expo-router';
import { Colors } from '../../constants/Colors';
import { Home, Search, ShoppingCart, User, MapPin } from 'lucide-react-native';
import { View, StyleSheet, Platform } from 'react-native';

const TabIcon = ({ Icon, color, focused }: { Icon: any; color: string; focused: boolean }) => {
  return (
    <View style={[styles.iconContainer, focused && styles.iconActive]}>
      <Icon size={focused ? 24 : 22} color={focused ? '#FFFFFF' : color} />
    </View>
  );
};

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: '#9CA3AF', // Lighter gray for better contrast
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: styles.tabBar,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => <TabIcon Icon={Home} color={color} focused={focused} />,
        }}
      />

      <Tabs.Screen
        name="cart"
        options={{
          title: 'Cart',
          tabBarIcon: ({ color, focused }) => <TabIcon Icon={ShoppingCart} color={color} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, focused }) => <TabIcon Icon={User} color={color} focused={focused} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    position: 'absolute',
    bottom: 30,
    left: 20,
    right: 20,
    backgroundColor: '#0F172A', // Deeper slate black
    borderRadius: 38,
    height: 72,
    borderTopWidth: 0,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    elevation: 10,
    ...(Platform.OS === 'web' ? {
      boxShadow: '0px 10px 25px rgba(0, 0, 0, 0.3)',
    } : {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.3,
      shadowRadius: 10,
    }),
    paddingBottom: 0,
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 44,
    height: 44,
    borderRadius: 22,
    marginTop: 25,
  },
  iconActive: {
    backgroundColor: Colors.primary,
    ...(Platform.OS === 'web' ? {
      boxShadow: `0px 4px 10px ${Colors.primary}4D`,
    } : {}),
  }
});
