// src/utils/ageFromGrade.ts
// Derive a sensible default age from grade. Removes the need for a
// separate age picker on the setup screen — grade is the meaningful signal.

export function ageFromGrade(grade: number): number {
  if (grade === -1) return 4;   // Pre-K
  if (grade === 0) return 5;    // Kindergarten
  if (grade >= 1 && grade <= 12) return 5 + grade; // Grade N ≈ age N+5
  return 18; // Adult / post-secondary
}

export function gradeLabel(grade: number): string {
  if (grade === -1) return 'Pre-K';
  if (grade === 0) return 'Kindergarten';
  if (grade >= 1 && grade <= 12) return `Grade ${grade}`;
  return 'Adult / post-secondary';
}
