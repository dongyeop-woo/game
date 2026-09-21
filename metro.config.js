/**
 * .glb 을 에셋으로 받아 주게 한다.
 *
 * 메트로는 기본 확장자 목록에 없는 파일을 require 하면 '모듈을 못 찾겠다'고
 * 한다. 3D 모델은 목록에 없어서 직접 넣어 줘야 한다.
 * (새 확장자를 더하면 번들러를 껐다 켜야 한다.)
 */
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);
config.resolver.assetExts.push('glb');

module.exports = config;
