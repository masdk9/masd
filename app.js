import 'react-native-gesture-handler';
import 'react-native-reanimated';
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
  FlatList,
  Dimensions } 
from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

const Tab = createBottomTabNavigator();
const { width, height } = Dimensions.get('window');

/* ---------------- HOME SCREEN ---------------- */
function HomeScreen() {
  const dummyPosts = [
    { id: '1', name: 'John Doe', username: '@johndoe', content: 'This is a text-only post.', photo: null, video: null, live: false, likes: 12, comments: 3, shares: 1 },
    { id: '2', name: 'Jane Smith', username: '@janesmith', content: 'Check out this photo!', photo: 'https://picsum.photos/400/200', video: null, live: false, likes: 45, comments: 5, shares: 2 },
    { id: '3', name: 'Alex Johnson', username: '@alexj', content: 'Here is a video post', photo: null, video: 'https://sample-videos.com/video123/mp4/240/big_buck_bunny_240p_1mb.mp4', live: false, likes: 78, comments: 10, shares: 4 },
    { id: '4', name: 'Live User', username: '@liveuser', content: "I'm live now!", photo: null, video: 'https://sample-videos.com/video123/mp4/240/big_buck_bunny_240p_1mb.mp4', live: true, likes: 120, comments: 25, shares: 10 }
  ];

  return (
    <View style={styles.homeScreenContainer}>
      {/* Sticky Top Bar */}
      <View style={styles.homeTopBarSticky}>
        <Text style={{ fontSize: 20, fontWeight: 'bold' }}>Home</Text>
        <TouchableOpacity>
          <Ionicons name="notifications-outline" size={28} color="#333" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ paddingTop: 70, paddingBottom: 20 }}>
        {dummyPosts.map(post => (
          <View key={post.id} style={styles.feedCard}>
            {/* Header */}
            <View style={styles.feedHeader}>
              <Image source={{ uri: `https://i.pravatar.cc/150?img=${post.id}` }} style={styles.feedAvatar} />
              <View style={{ marginLeft: 10, flex: 1 }}>
                <Text style={{ fontWeight: 'bold' }}>{post.name}</Text>
                <Text style={{ color: '#777' }}>{post.username}</Text>
              </View>
              {post.live && <Text style={styles.liveBadge}>LIVE</Text>}
              <TouchableOpacity style={styles.followButton}>
                <Text style={{ color: '#fff', fontWeight: 'bold' }}>Follow</Text>
              </TouchableOpacity>
            </View>

            {/* Content */}
            <Text style={{ marginTop: 10 }}>{post.content}</Text>

            {/* Photo */}
            {post.photo && <Image source={{ uri: post.photo }} style={styles.postPhoto} resizeMode="cover" />}

            {/* Video */}
            {post.video && (
              <View style={[styles.videoPlaceholder, post.live && { backgroundColor: 'red' }]}>
                <Text style={{ color: '#fff', fontWeight: 'bold' }}>{post.live ? 'LIVE VIDEO' : 'Video Placeholder'}</Text>
              </View>
            )}

            {/* Actions */}
            <View style={styles.postActions}>
              <TouchableOpacity style={styles.actionButton}>
                <Ionicons name="heart-outline" size={22} color="#333" />
                <Text style={styles.actionText}>{post.likes}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionButton}>
                <Ionicons name="chatbubble-outline" size={22} color="#333" />
                <Text style={styles.actionText}>{post.comments}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionButton}>
                <Ionicons name="share-outline" size={22} color="#333" />
                <Text style={styles.actionText}>{post.shares}</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

/* ---------------- SEARCH SCREEN ---------------- */
function SearchScreen() {
  return (
    <View style={styles.center}>
      <Text style={styles.text}>Search Screen</Text>
    </View>
  );
}

/* ---------------- REELS SCREEN ---------------- */
const dummyReels = Array.from({ length: 5 }).map((_, i) => ({
  id: i.toString(),
  title: `Reel ${i + 1}`
}));

function ReelsScreen() {
  return (
    <FlatList
      data={dummyReels}
      keyExtractor={item => item.id}
      renderItem={({ item }) => (
        <View style={styles.reelCard}>
          <Text style={{ color: '#fff', fontSize: 20 }}>{item.title}</Text>
        </View>
      )}
      pagingEnabled
      horizontal={false}
      showsVerticalScrollIndicator={false}
    />
  );
}

/* ---------------- MESSAGES SCREEN ---------------- */
const dummyMessages = Array.from({ length: 8 }).map((_, i) => ({
  id: i.toString(),
  user: `Friend ${i + 1}`,
  lastMsg: `Last message from Friend ${i + 1}`
}));

function MessagesScreen() {
  return (
 <ScrollView style={{ flex: 1, backgroundColor: '#fff' }}>
      {dummyMessages.map(msg => (
 <View key={msg.id} style={styles.messageCard}>
 <Image source={{ uri: `https://i.pravatar.cc/150?img=${parseInt(msg.id)+10}` }} style={styles.feedAvatar} />
 <View style={{ marginLeft: 10 }}>
 <Text style={{ fontWeight: 'bold' }}>{msg.user}</Text>
            <Text style={{ color: '#777' }}>{msg.lastMsg}</Text>
    </View>
    </View>
      ))} </ScrollView>
  );
}

/* ---------------- PROFILE SCREEN ---------------- */
function ProfileScreen() {
  const [activeScreen, setActiveScreen] = useState('ProfileMain');

  const ProfileMain = () => (
    <ScrollView style={styles.profileContainer}>
      {/* Reduce placeholder to bring avatar up */}
      <View style={{ height: 40 }} />

      <View style={styles.profileRow}>
        <Image source={{ uri: 'https://i.pravatar.cc/300' }} style={styles.profileImage} />
        <View style={styles.profileDetails}>
          <Text style={styles.name}>AnnA</Text>
          <Text style={styles.username}>@anna_dev</Text>
          <Text style={styles.bio}>React Native Developer • Social Media App</Text>
        </View>
      </View>

      <View style={styles.statsRow}>
        <ProfileStat count="120" label="Posts" />
        <ProfileStat count="5.4K" label="Followers" />
        <ProfileStat count="180" label="Following" />
      </View>

      <View style={styles.menuSection}>
        <MenuItem icon="account-multiple-outline" text="Account Center" onPress={() => setActiveScreen('AccountCenter')} />
        <MenuItem icon="cog-outline" text="Settings" onPress={() => setActiveScreen('Settings')} />
        <MenuItem icon="logout-variant" text="Logout" danger />
      </View>

      <View style={styles.placeholder}>
        <Text style={{ color: '#777' }}>Profile content / posts yahan aayenge</Text>
      </View>
    </ScrollView>
  );

  const SettingsScreenComponent = () => (
    <ScrollView style={{ flex: 1, backgroundColor: '#fff' }}>
      <TouchableOpacity style={styles.backButton} onPress={() => setActiveScreen('ProfileMain')}>
        <Ionicons name="arrow-back" size={24} color="#333" />
        <Text style={{ marginLeft: 8, fontSize: 16 }}>Back</Text>
      </TouchableOpacity>
      <MenuItem icon="shield-lock-outline" text="Privacy" />
      <MenuItem icon="bell-outline" text="Notifications" />
      <MenuItem icon="theme-light-dark" text="Theme" />
      <MenuItem icon="help-circle-outline" text="Help & Support" />
    </ScrollView>
  );

  const AccountCenterComponent = () => (
    <ScrollView style={{ flex: 1, backgroundColor: '#fff', padding: 20 }}>
      <TouchableOpacity style={styles.backButton} onPress={() => setActiveScreen('ProfileMain')}>
        <Ionicons name="arrow-back" size={24} color="#333" />
        <Text style={{ marginLeft: 8, fontSize: 16 }}>Back</Text>
      </TouchableOpacity>
      <Text style={styles.sectionTitle}>Edit Account Details</Text>
      <Text style={styles.label}>Name</Text>
      <View style={styles.inputBox}><Text>AnnA</Text></View>
      <Text style={styles.label}>Username</Text>
      <View style={styles.inputBox}><Text>@anna_dev</Text></View>
      <Text style={styles.label}>Bio</Text>
      <View style={[styles.inputBox, { height: 80 }]}><Text>React Developer</Text></View>
    </ScrollView>
  );

  if (activeScreen === 'Settings') return <SettingsScreenComponent />;
  if (activeScreen === 'AccountCenter') return <AccountCenterComponent />;
  return <ProfileMain />;
}

/* ---------------- MENU ITEM ---------------- */
function MenuItem({ icon, text, onPress, danger }) {
  return (
    <TouchableOpacity style={styles.menuItem} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.menuLeft}>
        <MaterialCommunityIcons name={icon} size={22} color={danger ? 'red' : '#333'} />
        <Text style={[styles.menuText, danger && { color: 'red' }]}>{text}</Text>
      </View>
      <MaterialCommunityIcons name="chevron-right" size={22} color="#aaa" />
    </TouchableOpacity>
  );
}

function ProfileStat({ count, label }) {
  return (
    <View style={styles.statBox}>
      <Text style={styles.statCount}>{count}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

/* ---------------- APP ROOT ---------------- */
export default function App() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarShowLabel: false,
          tabBarIcon: ({ color, size }) => {
            if (route.name === 'Home') 
            return <Ionicons name="home-outline" size={size} color={color} />;
            if (route.name === 'Search') 
            return <Ionicons name="search-outline" size={size} color={color} />;
            if (route.name === 'Reels') 
            return <MaterialCommunityIcons name="video-outline" size={size} color={color} />;
            if (route.name === 'Messages') 
            return <Ionicons name="chatbubble-outline" size={size} color={color} />;
            if (route.name === 'Profile') 
            return <Ionicons name="person-outline" size={size} color={color} />;
          }
        })}
      >
        <Tab.Screen name="Home" component={HomeScreen} />
        <Tab.Screen name="Search" component={SearchScreen} />
        <Tab.Screen name="Reels" component={ReelsScreen} />
        <Tab.Screen name="Messages" component={MessagesScreen} />
        <Tab.Screen name="Profile" component={ProfileScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}

/* ---------------- STYLES ---------------- */
const styles = StyleSheet.create({
  center: { 
      flex: 1, 
      justifyContent: 'center', 
      alignItems: 'center' },
      
  text: { 
      fontSize: 22, 
      fontWeight: 'bold' },

  homeScreenContainer: { 
      flex: 1, 
      backgroundColor: '#f0f2f5' },

  homeTopBarSticky: {
    position: 'absolute',
    top: 20,   // notification icon thoda niche
    left: 0,
    right: 0,
    height: 70,
    backgroundColor: '#fff',
    zIndex: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee'
  },

  feedCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginHorizontal: 10,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3  },
  
  feedHeader: { 
      flexDirection: 'row', 
      alignItems: 'center', 
      marginBottom: 8 },
      
  feedAvatar: { 
      width: 50, 
      height: 50, 
      borderRadius: 25 },
      
  liveBadge: { 
      marginLeft: 8, 
      backgroundColor: 'red', 
      color: '#fff', 
      fontWeight: 'bold', 
      paddingHorizontal: 6, 
      paddingVertical: 2, 
      borderRadius: 4, 
      fontSize: 12 },
      
  followButton: { 
      marginLeft: 10, 
      backgroundColor: '#1DA1F2', 
      paddingHorizontal: 12, 
      paddingVertical: 6, 
      borderRadius: 20 },
      
  postPhoto: { 
      width: '100%', 
      height: 200, 
      marginTop: 10, 
      borderRadius: 10 },
      
  videoPlaceholder: { 
      width: '100%', 
      height: 200, 
      marginTop: 10, 
      borderRadius: 10, 
      backgroundColor: '#333', 
      justifyContent: 'center', 
      alignItems: 'center' },
      
  postActions: { 
      flexDirection: 'row', 
      marginTop: 12, 
      justifyContent: 'space-around', 
      borderTopWidth: 1, 
      borderTopColor: '#eee', 
      paddingTop: 8 },
      
  actionButton: { 
      flexDirection: 'row', 
      alignItems: 'center', 
      gap: 6 },
      
  actionText: { 
      fontSize: 14, 
      color: '#333' },

  reelCard: { 
      height: height - 100, 
      justifyContent: 'center', 
      alignItems: 'center', 
      backgroundColor: '#333', 
      marginBottom: 10 },
      
  messageCard: { 
      flexDirection: 'row', 
      alignItems: 'center', 
      padding: 16, 
      borderBottomWidth: 1, 
      borderBottomColor: '#eee' },

  profileContainer: { 
      flex: 1, 
      backgroundColor: '#fff' },
      
  profileRow: { 
      flexDirection: 'row', 
      paddingHorizontal: 20, 
      alignItems: 'center', 
      marginTop: 20 },
      
  profileImage: { 
      width: 90, 
      height: 90, 
      borderRadius: 45 },
      
  profileDetails: { 
      marginLeft: 16, 
      flex: 1 },
  name: { 
      fontSize: 20,
      fontWeight: 'bold' },
  
  username: { 
      fontSize: 14,
      color: '#777',
      marginTop: 2 },
  
  bio: { 
      fontSize: 14,
      color: '#444', 
      marginTop: 6 },

  statsRow: { 
      flexDirection: 'row', 
      justifyContent: 'space-around',
      marginTop: 25, 
      paddingVertical: 10, 
      borderTopWidth: 1, 
      borderTopColor: '#eee', 
      borderBottomWidth: 1, 
      borderBottomColor: '#eee' },
      
  statBox: { 
      alignItems: 'center' },
      
  statCount: { 
      fontSize: 16,
      fontWeight: 'bold' },
      
  statLabel: { 
      fontSize: 12,
      color: '#777',
      marginTop: 2 },

  menuSection: { 
      marginTop: 30, 
      borderTopWidth: 1, 
      borderTopColor: '#eee' },
      
  menuItem: { 
      flexDirection: 'row', 
      justifyContent: 'space-between', 
      alignItems: 'center', 
      paddingVertical: 16, 
      paddingHorizontal: 20, 
      borderBottomWidth: 1, 
      borderBottomColor: '#f2f2f2' }
      ,
  menuLeft: { 
      flexDirection: 'row', 
      alignItems: 'center', 
      gap: 14 },
      
  menuText: { 
      fontSize: 16 },

  placeholder: { 
      height: 200, 
      justifyContent: 'center', 
      alignItems: 'center' },

  sectionTitle: { 
      fontSize: 18, 
      fontWeight: 'bold', 
      marginBottom: 20 },

  label: { 
    marginBottom: 6, 
    color: '#555' },
    
 inputBox: { 
    borderWidth: 1, 
    borderColor: '#ddd', 
    borderRadius: 8, 
    padding: 12, 
    marginBottom: 16 },

  backButton: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16 }
});