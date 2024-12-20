require('node-libs-react-native/globals');

import { ethers } from 'ethers';
import 'react-native-reanimated';
import 'text-encoding-polyfill';
// https://docs.ethers.org/v6/cookbook/react-native/
import crypto from 'react-native-quick-crypto';

import '@formatjs/intl-getcanonicallocales/polyfill';

import '@formatjs/intl-locale/polyfill';

import '@formatjs/intl-pluralrules/polyfill';

import "@formatjs/intl-pluralrules/locale-data/en";

import '@formatjs/intl-numberformat/polyfill';

import '@formatjs/intl-numberformat/locale-data/en';

import '@walletconnect/react-native-compat';

import 'react-native-url-polyfill/auto';

global.Buffer = require('@craftzdog/react-native-buffer').Buffer

ethers.randomBytes.register((length) => {
  return new Uint8Array(crypto.randomBytes(length));
});

ethers.computeHmac.register((algo, key, data) => {
  return crypto.createHmac(algo, key).update(data).digest();
});

ethers.pbkdf2.register((passwd, salt, iter, keylen, algo) => {
  return crypto.pbkdf2Sync(passwd, salt, iter, keylen, algo);
});

ethers.sha256.register((data) => {
  return crypto.createHash('sha256').update(data).digest();
});

ethers.sha512.register((data) => {
  return crypto.createHash('sha512').update(data).digest();
});

import firebase from '@react-native-firebase/app';
import messaging from '@react-native-firebase/messaging';
import { registerRootComponent } from 'expo';
import App from './App';

const firebaseConfig = {};

if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}
// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately

registerRootComponent(App);
// Prevent warning in console
messaging().setBackgroundMessageHandler(async () => {});
