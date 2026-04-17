/**
 * Type declarations for DSFR's JavaScript API
 * @see https://www.systeme-de-design.gouv.fr/version-courante/fr/premiers-pas/vous-etes-developpeur/api-javascript
 */

interface DSFRCollapseAPI {
  conceal: () => void;
  disclose: () => void;
}

interface DSFRModalAPI {
  conceal: () => void;
  disclose: () => void;
}

interface DSFRCollapseButtonAPI {
  focus: () => void;
}

interface DSFRModalButtonAPI {
  focus: () => void;
}

interface DSFRNavigationAPI {
  index: number;
  current: object | null;
  hasFocus: boolean;
  length: number;
  members: DSFRCollapseAPI[];
}

interface DSFRTabPanelAPI {
  conceal: () => void;
  disclose: () => void;
  focus: () => void;
}

interface DSFRTabsGroupAPI {
  index: number;
  current: object | null;
  hasFocus: boolean;
  length: number;
  members: DSFRTabPanelAPI[];
}

interface DSFRElementAPI {
  collapse?: DSFRCollapseAPI;
  collapseButton?: DSFRCollapseButtonAPI;
  modal?: DSFRModalAPI;
  modalButton?: DSFRModalButtonAPI;
  navigation?: DSFRNavigationAPI;
  tabPanel?: DSFRTabPanelAPI;
  tabsGroup?: DSFRTabsGroupAPI;
}

interface DSFRSchemeAPI {
  scheme: 'light' | 'dark' | 'system';
}

interface DSFRInspector {
  tree: () => void;
  state: () => void;
}

/**
 * DSFR API — both a callable function and an object with static methods.
 *
 * - `dsfr(element)` returns the DSFR instance for a given DOM element
 * - `dsfr.start()` / `dsfr.stop()` control the global lifecycle
 */
interface DSFRAPI {
  (element: HTMLElement | null): DSFRElementAPI | undefined;

  verbose: boolean;
  mode: 'auto' | 'manual' | 'runtime' | 'loaded' | 'vue' | 'angular' | 'react';
  production: boolean;
  level: 'log' | 'debug' | 'info' | 'warn' | 'error';

  start: () => void;
  stop: () => void;

  inspector: DSFRInspector;
}

declare global {
  interface Window {
    dsfr?: DSFRAPI;
  }
}

export {};
