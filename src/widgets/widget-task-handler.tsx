"use no memo";
import React from 'react';
import { WidgetTaskHandlerProps } from 'react-native-android-widget';
import { SoccerWidget } from './SoccerWidget';
import AsyncStorage from '@react-native-async-storage/async-storage';

export async function widgetTaskHandler(props: WidgetTaskHandlerProps) {
  const { widgetAction, renderWidget } = props;

  let widgetProps: any = {
    type: 'empty',
  };

  try {
    const rawData = await AsyncStorage.getItem('LATEST_WIDGET_DATA');
    if (rawData) {
      widgetProps = JSON.parse(rawData);
    } else {
      // Fallback
      widgetProps = {
        type: 'locket',
        title: '❤️ Soccer Locket',
        subtitle: 'Hệ thống',
        content: 'Chưa có dữ liệu. Hãy mở app!',
      };
    }
  } catch (err) {
    console.error('Widget task error', err);
  }

  switch (widgetAction) {
    case 'WIDGET_ADDED':
    case 'WIDGET_UPDATE':
    case 'WIDGET_RESIZED':
      renderWidget(<SoccerWidget {...widgetProps} />);
      break;
    default:
      break;
  }
}
