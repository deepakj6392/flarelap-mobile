import React from 'react';
import PhotoEditor from './editors/PhotoEditor';

export default function PhotoEditorScreen({ route, navigation }: any) {
  return <PhotoEditor route={route} navigation={navigation} />;
}

