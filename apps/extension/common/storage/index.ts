import { browser } from 'webextension-polyfill-ts';

export async function getLocalStorage(key: string) {
  const value = await browser.storage.local.get(key);
  return value[key];
}

export async function setLocalStorage(key: string, value: any) {
  await browser.storage.local.set({ [key]: value });
}

export async function getSessionStorage(key: string) {
  const value = await chrome.storage.session.get(key);
  return value[key];
}

export async function setSessionStorage(key: string, value: any) {
  await chrome.storage.session.set({ [key]: value });
}
