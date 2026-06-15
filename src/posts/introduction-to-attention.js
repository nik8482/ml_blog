import content from './content/introduction-to-attention.md?raw';
import thunderstorm from '../assets/thunderstorm.JPG';

export default {
    id: 2,
    title: 'Introduction to Attention',
    category: 'fundamentals',
    date: '2026-04-20',
    excerpt: 'Every modern day LLM depends on Attention, but how does it actually work?',
    readTime: '10 min',
    difficulty: 'beginner',
    content: `![thunderstorm](${thunderstorm} "Oil painting of a thunderstorm brewing")\n\n${content}`,
};
  