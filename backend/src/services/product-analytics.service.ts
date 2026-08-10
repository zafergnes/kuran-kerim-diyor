export type ProductEvent = {
  event: string;
  installId: string;
  sessionId: string;
  screen: string | null;
  metadata: unknown;
  userId: string | null;
  createdAt: Date;
};

export type ProductProgress = {
  userId: string;
  readCounts: string;
  completedSurahs: string;
};

const FUNNEL_EVENTS = [
  'APP_OPEN', 'ONBOARDING_VIEW', 'ONBOARDING_COMPLETE', 'AUTH_REGISTER',
  'AUTH_LOGIN', 'READING_PROGRESS', 'AI_CHAT_OPEN',
] as const;

export function calculateProductAnalytics(events: ProductEvent[], progressRows: ProductProgress[]) {
  const uniqueByEvent = new Map<string, Set<string>>();
  for (const event of events) {
    const installs = uniqueByEvent.get(event.event) || new Set<string>();
    installs.add(event.installId);
    uniqueByEvent.set(event.event, installs);
  }

  // The controller supplies newest-first events. The first event for each session is its exit point.
  const lastBySession = new Map<string, ProductEvent>();
  for (const event of events) {
    if (!lastBySession.has(event.sessionId)) lastBySession.set(event.sessionId, event);
  }
  const exits = new Map<string, number>();
  for (const event of lastBySession.values()) {
    const stage = event.screen || event.event;
    exits.set(stage, (exits.get(stage) || 0) + 1);
  }

  const latestProgressByInstall = new Map<string, { uniqueAyahs: number; userId: string | null }>();
  for (const event of events) {
    if (event.event !== 'READING_PROGRESS' || latestProgressByInstall.has(event.installId)) continue;
    const metadata = event.metadata as Record<string, unknown> | null;
    const uniqueAyahs = Number(metadata?.uniqueAyahs || 0);
    if (Number.isFinite(uniqueAyahs) && uniqueAyahs >= 0) {
      latestProgressByInstall.set(event.installId, { uniqueAyahs, userId: event.userId });
    }
  }

  const eventUserIds = new Set(
    [...latestProgressByInstall.values()].map((item) => item.userId).filter((value): value is string => Boolean(value)),
  );
  let totalReadPercent = [...latestProgressByInstall.values()]
    .reduce((sum, item) => sum + Math.min(100, (item.uniqueAyahs / 6236) * 100), 0);
  let progressBase = latestProgressByInstall.size;
  let totalCompletedSurahs = 0;
  let validProgressRows = 0;

  for (const progress of progressRows) {
    try {
      const readCounts = JSON.parse(progress.readCounts || '{}') as Record<string, number>;
      const completedSurahs = JSON.parse(progress.completedSurahs || '[]') as unknown[];
      if (!readCounts || Array.isArray(readCounts) || typeof readCounts !== 'object' || !Array.isArray(completedSurahs)) continue;
      validProgressRows += 1;
      if (!eventUserIds.has(progress.userId)) {
        totalReadPercent += Math.min(100, (Object.keys(readCounts).length / 6236) * 100);
        progressBase += 1;
      }
      totalCompletedSurahs += completedSurahs.length;
    } catch {
      // Legacy malformed rows are excluded instead of distorting the denominator.
    }
  }

  return {
    activity: {
      sessions: new Set(events.map((event) => event.sessionId)).size,
      appOpens: events.filter((event) => event.event === 'APP_OPEN').length,
    },
    engagement: {
      averageQuranProgressPercent: Number((totalReadPercent / (progressBase || 1)).toFixed(2)),
      averageCompletedSurahs: Number((totalCompletedSurahs / (validProgressRows || 1)).toFixed(2)),
      aiChatUsers: uniqueByEvent.get('AI_CHAT_OPEN')?.size || 0,
      aiMessages: events.filter((event) => event.event === 'AI_CHAT_MESSAGE').length,
    },
    funnel: FUNNEL_EVENTS.map((event) => ({ event, uniqueInstalls: uniqueByEvent.get(event)?.size || 0 })),
    exitStages: [...exits.entries()]
      .map(([stage, count]) => ({ stage, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 12),
  };
}
