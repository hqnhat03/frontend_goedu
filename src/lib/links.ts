const domain = process.env.NEXT_PUBLIC_DOMAIN;

export const APP_LINKS = {
  admin: `https://${domain}`,
  teacher: `https://teacher.${domain}`,
  student: `https://student.${domain}`,
};

export const getAbsoluteUrl = (app: 'admin' | 'teacher' | 'student', path: string = '') => {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${APP_LINKS[app]}${cleanPath}`;
};
