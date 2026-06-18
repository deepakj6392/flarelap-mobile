import React from 'react';
import { View, StyleSheet, Image } from 'react-native';

type Props = {
  size?: number;
};

export default function Logo({ size = 72 }: Props) {
  const imgSize = Math.round(size + 24);

  return (
    <View style={styles.wrap}>
      <Image source={require('../../assets/logo_round.png')} style={{ width: imgSize, height: imgSize, resizeMode: 'contain', marginBottom: 8 }} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', marginBottom: 24 },
  word: { fontSize: 20, fontWeight: '700' },
});
