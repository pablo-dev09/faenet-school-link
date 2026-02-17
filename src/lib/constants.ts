export const COURSES = [
  "Informática",
  "Química",
  "Enfermagem",
  "Administração",
  "Eletromecânica",
  "Segurança do Trabalho",
] as const;

export type Course = (typeof COURSES)[number];

export const COURSE_SLUGS: Record<string, Course> = {
  informatica: "Informática",
  quimica: "Química",
  enfermagem: "Enfermagem",
  administracao: "Administração",
  eletromecanica: "Eletromecânica",
  "seguranca-do-trabalho": "Segurança do Trabalho",
};

export function courseToSlug(course: string): string {
  return Object.entries(COURSE_SLUGS).find(([, v]) => v === course)?.[0] || course.toLowerCase().replace(/\s+/g, "-");
}

export function slugToCourse(slug: string): Course | undefined {
  return COURSE_SLUGS[slug];
}
