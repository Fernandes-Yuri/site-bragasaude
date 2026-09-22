import type { FamilyBinding } from '../types';

export function familyGroups(bindings: FamilyBinding[], userId: string): FamilyBinding[] {
  const groups = new Map<string, FamilyBinding>();
  for (const binding of bindings) {
    if (binding.status === 'ACTIVE' && binding.patientUserId &&
        (binding.patientUserId === userId || binding.caregiverUserId === userId)) {
      groups.set(binding.patientUserId, binding);
    }
  }
  return [...groups.values()].sort((a, b) => a.patientUserId.localeCompare(b.patientUserId));
}

export function resolveFamilyGroup(bindings: FamilyBinding[], userId: string, selected: string | null): string {
  const groups = familyGroups(bindings, userId);
  if (selected !== null) return groups.some(b => b.patientUserId === selected) ? selected : '';
  return groups.length === 1 ? groups[0].patientUserId : '';
}
