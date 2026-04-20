const modules = import.meta.glob('./*.js', { eager: true });

export const blogPosts = Object.entries(modules)
  .filter(([path]) => !path.endsWith('index.js'))
  .map(([, mod]) => mod.default)
  .sort((a, b) => new Date(b.date) - new Date(a.date));
