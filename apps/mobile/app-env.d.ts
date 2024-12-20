/// <reference types="nativewind/types" />

declare module '*.png';
declare module '*.svg';
declare module '*.jpeg';
declare module '*.jpg';
declare module '*.mp3';
declare module '*.ogg';
declare module '*.wav';



declare namespace NodeJS {
  interface Process {
    browser: boolean;
  }
}

interface Window {
  ReactNativeWebView: {
    postMessage: (message: string) => void;
  };
}