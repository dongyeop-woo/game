import React from 'react';
import { Text as RNText, type TextProps } from 'react-native';

/**
 * 앱 전체 기본 폰트.
 *
 * Expo 에는 '앱 전역 기본 폰트' 설정이 없고(SDK 57 문서 확인), React 19 부터는
 * 함수 컴포넌트의 defaultProps 가 무시돼서 예전에 쓰던 `Text.defaultProps` 꼼수도
 * 안 통한다. 그래서 RN 의 Text 를 한 번 감싸 fontFamily 를 앞에 깔아 두고,
 * 화면들은 'react-native' 대신 이 파일에서 Text 를 가져다 쓴다.
 *
 * 호출부 style 이 뒤에 오므로 필요하면 개별 화면에서 얼마든지 덮어쓸 수 있다.
 *
 * 주의: 이 이름은 useFonts 에 넘긴 '키'다. 폰트 파일 자체의 내부 이름은
 * 'BM JUA OTF'(PostScript: BMJUAOTF)라 서로 다르다. 지금은 App.tsx 의
 * useFonts 가 이 키로 등록해 주므로 맞아떨어지지만, 나중에 expo-font
 * config plugin(빌드 타임 내장)으로 바꾸면 iOS 가 내부 이름으로 등록해서
 * 이 이름이 안 먹고 조용히 시스템 폰트로 떨어진다. 그때는 여기를
 * 'BM JUA OTF' 로 바꿔야 한다.
 */
export const FONT = 'BMJUA';

export function Text({ style, ...rest }: TextProps) {
  return <RNText {...rest} style={[{ fontFamily: FONT }, style]} />;
}
