export function questsQueryKey(filter?: { os: string; version: string }) {
  return [
    'Quests',
    {
      filter,
    },
  ];
}

export function levelInfoQueryKey() {
  return ['LevelInfo'];
}
