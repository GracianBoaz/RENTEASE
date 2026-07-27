import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../constants/theme';

import HomeScreen from '../screens/main/HomeScreen';
import SearchScreen from '../screens/main/SearchScreen';
import ItemDetailScreen from '../screens/main/ItemDetailScreen';
import BookingRequestScreen from '../screens/main/BookingRequestScreen';
import BookingConfirmationScreen from '../screens/main/BookingConfirmationScreen';
import AdvancedFiltersScreen from '../screens/main/AdvancedFiltersScreen';
import AIAssistantScreen from '../screens/main/AIAssistantScreen';

// Batch 3
import MyRentalsScreen from '../screens/main/MyRentalsScreen';
import BookingDetailScreen from '../screens/main/BookingDetailScreen';
import CancelBookingScreen from '../screens/main/CancelBookingScreen';
import AddItemStep1Screen from '../screens/main/AddItemStep1Screen';
import AddItemStep2Screen from '../screens/main/AddItemStep2Screen';
import AddItemStep3Screen from '../screens/main/AddItemStep3Screen';
import ItemPreviewScreen from '../screens/main/ItemPreviewScreen';
import PublishSuccessScreen from '../screens/main/PublishSuccessScreen';

// Batch 4
import ProfileScreen from '../screens/main/ProfileScreen';
import EditProfileScreen from '../screens/main/EditProfileScreen';
import SavedItemsScreen from '../screens/main/SavedItemsScreen';
import MessagesListScreen from '../screens/main/MessagesListScreen';
import ChatScreen from '../screens/main/ChatScreen';
import EarningsDashboardScreen from '../screens/main/EarningsDashboardScreen';
import WriteReviewScreen from '../screens/main/WriteReviewScreen';

// Batch 5
import AllCategoriesScreen from '../screens/main/AllCategoriesScreen';
import CategoryItemsScreen from '../screens/main/CategoryItemsScreen';
import MapViewScreen from '../screens/main/MapViewScreen';
import NotificationsScreen from '../screens/main/NotificationsScreen';
import NotificationSettingsScreen from '../screens/main/NotificationSettingsScreen';
import SettingsScreen from '../screens/main/SettingsScreen';
import HelpSupportScreen from '../screens/main/HelpSupportScreen';
import FAQDetailScreen from '../screens/main/FAQDetailScreen';
import AboutScreen from '../screens/main/AboutScreen';
import OwnerProfileScreen from '../screens/main/OwnerProfileScreen';
import ReviewSuccessScreen from '../screens/main/ReviewSuccessScreen';

const PlaceholderScreen = () => <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><Text>Coming Soon</Text></View>;

export type SharedStackParamList = {
  HomeMain: undefined;
  SearchMain: undefined;
  RentalsMain: undefined;
  ProfileMain: undefined;
  ItemDetail: { item: any };
  BookingRequest: { item: any };
  BookingConfirmation: { bookingId: string, item: any, startDate: string, endDate: string, totalPrice: number };
  AdvancedFilters: undefined;
  BookingDetail: { bookingId: string };
  CancelBooking: { bookingId: string, item: any, startDate: string, endDate: string };
  AddItemStep1: { itemData?: any };
  AddItemStep2: { itemData: any };
  AddItemStep3: { itemData: any };
  ItemPreview: { itemData: any };
  PublishSuccess: { itemData: any };
  EditProfile: undefined;
  SavedItems: undefined;
  MessagesList: undefined;
  Chat: { otherId: string, itemId: string, otherName: string, itemTitle: string, otherAvatar?: string };
  EarningsDashboard: undefined;
  WriteReview: { booking: any };
  AllCategories: undefined;
  CategoryItems: { categoryId: string, categoryName: string, categoryColor: string };
  MapView: undefined;
  Notifications: undefined;
  NotificationSettings: undefined;
  Settings: undefined;
  HelpSupport: undefined;
  FAQDetail: { question?: string, answer?: string };
  About: undefined;
  OwnerProfile: { ownerId: string };
  ReviewSuccess: { itemName?: string, itemId?: string };
  AIAssistant: undefined;
};

const HomeStack = createNativeStackNavigator<SharedStackParamList>();
const HomeStackScreen = () => (
  <HomeStack.Navigator screenOptions={{ headerShown: false }}>
    <HomeStack.Screen name="HomeMain" component={HomeScreen} />
    <HomeStack.Screen name="ItemDetail" component={ItemDetailScreen} />
    <HomeStack.Screen name="BookingRequest" component={BookingRequestScreen} />
    <HomeStack.Screen name="BookingConfirmation" component={BookingConfirmationScreen} />
    <HomeStack.Screen name="BookingDetail" component={BookingDetailScreen} />
    <HomeStack.Screen name="CancelBooking" component={CancelBookingScreen} />
    <HomeStack.Screen name="AllCategories" component={AllCategoriesScreen} />
    <HomeStack.Screen name="CategoryItems" component={CategoryItemsScreen} />
    <HomeStack.Screen name="MapView" component={MapViewScreen} />
    <HomeStack.Screen name="Notifications" component={NotificationsScreen} />
    <HomeStack.Screen name="OwnerProfile" component={OwnerProfileScreen} />
    <HomeStack.Screen name="ReviewSuccess" component={ReviewSuccessScreen} />
    <HomeStack.Screen name="AIAssistant" component={AIAssistantScreen} />
  </HomeStack.Navigator>
);

const SearchStack = createNativeStackNavigator<SharedStackParamList>();
const SearchStackScreen = () => (
  <SearchStack.Navigator screenOptions={{ headerShown: false }}>
    <SearchStack.Screen name="SearchMain" component={SearchScreen} />
    <SearchStack.Screen name="AdvancedFilters" component={AdvancedFiltersScreen} options={{ presentation: 'modal' }} />
    <SearchStack.Screen name="ItemDetail" component={ItemDetailScreen} />
    <SearchStack.Screen name="BookingRequest" component={BookingRequestScreen} />
    <SearchStack.Screen name="BookingConfirmation" component={BookingConfirmationScreen} />
  </SearchStack.Navigator>
);

const RentalsStack = createNativeStackNavigator<SharedStackParamList>();
const RentalsStackScreen = () => (
  <RentalsStack.Navigator screenOptions={{ headerShown: false }}>
    <RentalsStack.Screen name="RentalsMain" component={MyRentalsScreen} />
    <RentalsStack.Screen name="ItemDetail" component={ItemDetailScreen} />
    <RentalsStack.Screen name="BookingDetail" component={BookingDetailScreen} />
    <RentalsStack.Screen name="CancelBooking" component={CancelBookingScreen} />
    <RentalsStack.Screen name="AddItemStep1" component={AddItemStep1Screen} />
    <RentalsStack.Screen name="AddItemStep2" component={AddItemStep2Screen} />
    <RentalsStack.Screen name="AddItemStep3" component={AddItemStep3Screen} />
    <RentalsStack.Screen name="ItemPreview" component={ItemPreviewScreen} />
    <RentalsStack.Screen name="PublishSuccess" component={PublishSuccessScreen} />
    <RentalsStack.Screen name="WriteReview" component={WriteReviewScreen} />
  </RentalsStack.Navigator>
);

const ProfileStack = createNativeStackNavigator<SharedStackParamList>();
const ProfileStackScreen = () => (
  <ProfileStack.Navigator screenOptions={{ headerShown: false }}>
    <ProfileStack.Screen name="ProfileMain" component={ProfileScreen} />
    <ProfileStack.Screen name="EditProfile" component={EditProfileScreen} />
    <ProfileStack.Screen name="SavedItems" component={SavedItemsScreen} />
    <ProfileStack.Screen name="MessagesList" component={MessagesListScreen} />
    <ProfileStack.Screen name="Chat" component={ChatScreen} />
    <ProfileStack.Screen name="EarningsDashboard" component={EarningsDashboardScreen} />
    <ProfileStack.Screen name="ItemDetail" component={ItemDetailScreen} />
    <ProfileStack.Screen name="Settings" component={SettingsScreen} />
    <ProfileStack.Screen name="NotificationSettings" component={NotificationSettingsScreen} />
    <ProfileStack.Screen name="HelpSupport" component={HelpSupportScreen} />
    <ProfileStack.Screen name="FAQDetail" component={FAQDetailScreen} />
    <ProfileStack.Screen name="About" component={AboutScreen} />
  </ProfileStack.Navigator>
);

const Tab = createBottomTabNavigator();

export const MainNavigator = () => {
  return (
    <Tab.Navigator 
      screenOptions={({ route }) => ({ 
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Search') {
            iconName = focused ? 'search' : 'search-outline';
          } else if (route.name === 'Rentals') {
            iconName = focused ? 'receipt' : 'receipt-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          } else if (route.name === 'AIAssistant') {
            return <Text style={{ fontSize: 20 }}>🤖</Text>;
          }

          return <Ionicons name={iconName as any} size={size} color={color} />;
        },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textMuted,
        tabBarStyle: {
          backgroundColor: theme.colors.white,
          borderTopColor: theme.colors.border,
        }
      })}
    >
      <Tab.Screen name="Home" component={HomeStackScreen} />
      <Tab.Screen name="Search" component={SearchStackScreen} />
      <Tab.Screen
        name="AIAssistant"
        component={AIAssistantScreen}
        options={{
          tabBarLabel: 'AI Chat',
          tabBarIcon: ({ color }) => (
            <Text style={{ fontSize: 20 }}>🤖</Text>
          ),
          headerShown: false,
        }}
      />
      <Tab.Screen name="Rentals" component={RentalsStackScreen} />
      <Tab.Screen name="Profile" component={ProfileStackScreen} />
    </Tab.Navigator>
  );
};
