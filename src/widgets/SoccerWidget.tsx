"use no memo";
import React from 'react';
import { FlexWidget, TextWidget, ImageWidget, OverlapWidget } from 'react-native-android-widget';

interface SoccerWidgetProps {
  type: 'locket' | 'match' | 'empty';
  title?: string;
  subtitle?: string;
  content?: string;
  time?: string;
  imageUrl?: string;
}

export function SoccerWidget({ type, title, subtitle, content, time, imageUrl }: SoccerWidgetProps) {
  if (type === 'empty') {
    return (
      <FlexWidget
        style={{
          height: 'match_parent',
          width: 'match_parent',
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: '#10233A',
          borderRadius: 16,
        }}
      >
        <TextWidget
          text="Chưa có dữ liệu"
          style={{ fontSize: 16, color: '#A0AEC0' }}
        />
      </FlexWidget>
    );
  }

  if (type === 'match') {
    return (
      <FlexWidget
        style={{
          height: 'match_parent',
          width: 'match_parent',
          backgroundColor: '#10233A',
          borderRadius: 16,
          padding: 16,
          justifyContent: 'space-between',
        }}
      >
        <FlexWidget style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <TextWidget
            text={title || 'Trận đấu yêu thích'}
            style={{ fontSize: 14, color: '#38ef7d', fontWeight: 'bold' }}
          />
          <TextWidget
            text={time || 'Sắp diễn ra'}
            style={{ fontSize: 12, color: '#FFD700' }}
          />
        </FlexWidget>

        <TextWidget
          text={content || 'Đang cập nhật...'}
          style={{ fontSize: 18, color: '#FFFFFF', fontWeight: 'bold', marginTop: 8 }}
        />
      </FlexWidget>
    );
  }

  if (imageUrl) {
    return (
      <OverlapWidget
        style={{
          height: 'match_parent',
          width: 'match_parent',
          borderRadius: 16,
        }}
      >
        <ImageWidget
          image={imageUrl as any}
          imageWidth={800}
          imageHeight={800}
          resizeMode="cover"
          style={{
            width: 'match_parent',
            height: 'match_parent',
          }}
        />
        <FlexWidget
          style={{
            width: 'match_parent',
            height: 'match_parent',
            justifyContent: 'flex-end',
          }}
        >
          <FlexWidget
            style={{
              width: 'match_parent',
              backgroundColor: '#000000B3', // transparent black overlay
              padding: 12,
            }}
          >
            <TextWidget
              text={title || '❤️ Friend Locket'}
              style={{ fontSize: 14, color: '#FF9100', fontWeight: 'bold', marginBottom: 4 }}
            />
            <TextWidget
              text={`"${content}"`}
              style={{ fontSize: 16, color: '#FFFFFF', fontStyle: 'italic', marginBottom: 2 }}
            />
            <TextWidget
              text={`- ${subtitle}`}
              style={{ fontSize: 12, color: '#A0AEC0', textAlign: 'right' }}
            />
          </FlexWidget>
        </FlexWidget>
      </OverlapWidget>
    );
  }

  return (
    <FlexWidget
      style={{
        height: 'match_parent',
        width: 'match_parent',
        backgroundColor: '#1A202C',
        borderRadius: 16,
        padding: 16,
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <TextWidget
        text={title || '❤️ Friend Locket'}
        style={{ fontSize: 14, color: '#FF9100', fontWeight: 'bold', marginBottom: 8 }}
      />
      <TextWidget
        text={`"${content}"`}
        style={{ fontSize: 18, color: '#FFFFFF', fontStyle: 'italic', marginBottom: 4 }}
      />
      <TextWidget
        text={`- ${subtitle}`}
        style={{ fontSize: 14, color: '#A0AEC0', textAlign: 'right' }}
      />
    </FlexWidget>
  );
}
