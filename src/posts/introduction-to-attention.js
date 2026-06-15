import content from './content/introduction-to-attention.md?raw';
import catPainting from './../assets/cat-painting.jpg';

export default {
    id: 2,
    slug: 'attention',
    title: 'Attention Basics',
    category: 'fundamentals',
    date: '2026-04-20',
    excerpt: 'Every modern day LLM depends on Attention, but how does it actually work?',
    readTime: '10 min',
    difficulty: 'beginner',
    content: `![cat painting](${catPainting} "Oil painting of a cat beneath blossoms")\n\n${content}`,
};
  