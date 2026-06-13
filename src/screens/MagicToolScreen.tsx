import React from 'react';
import MagicToolEditor from './editors/MagicToolEditor';

export default function MagicToolScreen({ route, navigation }: any) {
  return <MagicToolEditor route={route} navigation={navigation} />;
}

