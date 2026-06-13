import React from 'react';
import QRCodeGenerator from './editors/QRCodeGenerator';

export default function QRCodeGeneratorScreen({ route, navigation }: any) {
  return <QRCodeGenerator route={route} navigation={navigation} />;
}
