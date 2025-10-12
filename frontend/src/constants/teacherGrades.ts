export const TEACHER_GRADES = [
  'MAB',
  'MAA',
  'MCB',
  'MCA',
  'Professeur',
] as const;

export type TeacherGrade = typeof TEACHER_GRADES[number];