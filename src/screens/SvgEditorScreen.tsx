import React from 'react';
import SvgEditor from './editors/SvgEditor';

export default function SvgEditorScreen({ route, navigation }: any) {
  return <SvgEditor route={route} navigation={navigation} />;
}
