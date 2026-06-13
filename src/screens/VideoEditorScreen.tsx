import React from 'react';
import VideoEditor from './editors/VideoEditor';

export default function VideoEditorScreen({ route, navigation }: any) {
  return <VideoEditor route={route} navigation={navigation} />;
}
