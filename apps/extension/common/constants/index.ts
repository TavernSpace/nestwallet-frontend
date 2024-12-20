export const IS_PRODUCTION = process.env.NODE_ENV === 'production';

export enum PopupStorageKey {
  // This is the default query cache key for react-query
  QueryCache = 'REACT_QUERY_OFFLINE_CACHE',
  SelectedOrganization = 'SELECTED_ORGANIZATION',
}

export enum SidepanelState {
  Active = 'SIDEPANEL_ACTIVE',
  Inactive = 'SIDEPANEL_INACTIVE',
}
