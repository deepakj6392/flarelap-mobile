import React from 'react';
import { View, StyleSheet } from 'react-native';
import SvgEditor from './editors/SvgEditor';

export default function CustomSizeScreen({ route, navigation }: any) {
  return (
    <View style={styles.container}>
      <SvgEditor route={route} navigation={navigation} category={"Custom Size"} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 16 },
  button: { marginTop: 20 }
});
