// Pure reminder due-filter, split out from reminderSweep so the firing rule can
// be unit-tested without EventBridge/DynamoDB. A reminder is due when its ISO
// `when` timestamp is at or before `nowIso`. ISO-8601 strings sort
// lexicographically in time order, so a string compare is correct.

export function dueReminders<T extends { when: string }>(all: T[], nowIso: string): T[] {
  return all.filter((r) => r.when <= nowIso);
}
