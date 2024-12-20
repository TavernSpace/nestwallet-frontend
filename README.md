# Project Setup

This README.md file contains instructions for setting up the project frontend.

## Table of Contents

1. [Prerequisite](#prerequisite)
2. [Frontend](#frontend)

- [Installation](#install)
- [Extension](#extension)
- [Mobile App](#mobile)
- [Webapp](#webapp)

3. [Patches](#patches)

4. [References](#references)

## Prerequisite <a name="prerequisite"></a>

Download the following list of softwares

- [Docker Desktop (Apple Chip)](https://www.docker.com/products/docker-desktop)
- [Goland](https://www.jetbrains.com/go/)
- [VS Code](https://code.visualstudio.com/)
- [brew](https://brew.sh/)
- [nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

## Frontend <a name="frontend"></a>

### Installation <a name="install"></a>

Open a new tab at project root folder and run:

```bash
yarn
# running into bugs? try "git clean -fdx" and then run yarn again
```

Before starting the apps locally you must have the backend and docker running, and generate the graphql by running 

```bash
yarn app:build:graphql
```

### Extension <a name="extension"></a>

Open a new terminal tab and run:

```bash
yarn extension:start
```

To use your local extension build in chrome:
- Navigate to `chrome://extensions/` and click 'Load Unpacked'.
- Then select your `nestwallet/apps/extension/web-build/` directory

If you want to debug the extension in window mode, paste "chrome-extension://<EXTENSION_ID>/index.html" into chrome where EXTENSION_ID is the id of your chrome extension.
You can find the EXTENSION_ID in "chrome://extensions/" and seeing the ID on your extension

### Mobile App <a name="mobile"></a>

Open a new terminal tab and run:

```bash
yarn mobile:start:ios
```

or

```bash
yarn mobile:start:android
```

depending if you want to build for ios or android

### Webapp <a name="webapp"></a>

Open a new terminal tab and run:

```bash
yarn webapp:start
```

## Patches <a name='patches'></a>

When updating/reinstall the following modules, please be aware of the patches applied.

`react-native-quick-crypto` needs to patch with following:
- https://github.com/margelo/react-native-quick-crypto/issues/187#issuecomment-1676080957
- https://github.com/margelo/react-native-quick-crypto/pull/210/files

`react-native-reanimated` needs to be patched based on https://github.com/software-mansion/react-native-reanimated/issues/3614#issuecomment-1271684039 to prevent spewing execcessive warnings

## References <a name="references"></a>

- [React Chrome Extension MV3](https://github.com/Sirage-t/react-chrome-extension-MV3#service-worker)
- [React Email](https://react.email/docs/introduction)

