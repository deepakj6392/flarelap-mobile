import React from 'react';
import { View, StyleSheet } from 'react-native';
import SvgEditor from './editors/SvgEditor';

export default function SocialMediaScreen({ navigation, route }: any) {
  return (
    <View style={styles.container}>
      <SvgEditor route={route} navigation={navigation} category={"Social Media"} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 16 },
  button: { marginTop: 20 }
});
