import React from 'react';
import { View, Text, StyleSheet, Button } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';

type TrackingScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Tracking'>;
};

const TrackingScreen = ({ navigation }: TrackingScreenProps) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Live Tracking</Text>
      <Button title="Back Home" onPress={() => navigation.navigate('Home')} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 24, fontWeight: 'bold' },
});

export default TrackingScreen;
