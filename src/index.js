import { diff as deepDiff } from 'deep-object-diff';

import setCssVars from '~/utils/css-vars';
import log from '~/utils/log';
import { isBookmarklet, markBookmarkletLoaded, isBookmarletLoaded } from '~/utils/bookmarklet';

import { getRegisteredModules } from '~/module';
import { modulesForHash } from '~/module-map';
import { loadModule, softUnloadModule, hardUnloadModule, isModuleLoaded } from '~/module-loader';
import { fetchRemoteDisabled } from '~/remote-disable';
import {
  getFlattenedOptions,
  setFlattenedOptions,
  mergeDefaultOptions,
  addOptionsChangeListener,
} from '~/options';

function getHash(url) {
  return new URL(url).hash || '#';
}

function loadModules(hash) {
  for (const module of modulesForHash(hash)) {
    loadModule(module);
  }
}

function unloadModules(oldHash, newHash) {
  const oldModules = modulesForHash(oldHash);
  const newModules = modulesForHash(newHash);

  const unloadedModules = new Set([...oldModules].filter(m => !newModules.has(m)));

  for (const module of unloadedModules) {
    if (!softUnloadModule(module)) { // module affects global state
      if (!hardUnloadModule(module)) {
        log('warn', `Failed to hard unload module '${module.config.name}'`);
      }
    }
  }
}

async function initializeOptions() {
  const optsObj = await getFlattenedOptions();
  await setFlattenedOptions(mergeDefaultOptions(optsObj));
}

function hardUnloadOrRefreshPage(module) {
  if (!hardUnloadModule(module)) {
    return window.location.reload();
  }
}

async function applyNewOptions({ oldValue: oldOptions, newValue: newOptions }) {
  const GUID_MAP = getRegisteredModules();
  const diff = deepDiff(oldOptions, newOptions);

  for (const moduleGuid in diff) {
    const module = GUID_MAP[moduleGuid];
    if ('enabled' in diff[moduleGuid]) {
      if (diff[moduleGuid].enabled) {
        if (modulesForHash(window.location.hash).has(module)) {
          loadModule(module);
        }
      } else {
        hardUnloadOrRefreshPage(module);
      }
    } else if (isModuleLoaded(module)) {
      hardUnloadOrRefreshPage(module);
      loadModule(module);
    }
  }
}

async function runExtension() {
  // TODO: only call initializeOptions on install and update
  // (plus dev feature to force initialization)

  if (isBookmarklet()) {
    if (isBookmarletLoaded()) {
      return;
    }
    markBookmarkletLoaded();
  }

  await initializeOptions();
  fetchRemoteDisabled();
  setCssVars();
  addOptionsChangeListener(applyNewOptions);
  loadModules(getHash(window.location.href));

  window.addEventListener('hashchange', e => {
    fetchRemoteDisabled();
    const newHash = getHash(e.newURL);
    const oldHash = getHash(e.oldURL);
    unloadModules(oldHash, newHash);
    loadModules(newHash);
  });
}

runExtension();
