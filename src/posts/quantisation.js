import content from './content/quantisation.md?raw';
import thunderstorm from './../assets/thunderstorm.JPG';

export default {
    id: 3,
    slug: 'quantisation',
    title: 'Introduction to Quantisation',
    category: 'inference',
    date: '2026-04-23',
    excerpt: 'How to fit a 70GB model on a single GPU',
    readTime: '7 min',
    difficulty: 'beginner',
    content: `![thunderstorm](${thunderstorm} "Oil painting of a thunderstorm brewing")\n\n${content}`,
};