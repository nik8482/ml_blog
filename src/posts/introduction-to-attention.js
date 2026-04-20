export default {
    id: 2,
    title: 'Introduction to Attention',
    category: 'fundamentals',
    date: '2026-04-22',
    excerpt: 'Every modern day LLM depends on Attention, but how does it actually work?',
    readTime: '10 min',
    difficulty: 'beginner',
    content: `Attention might be a topic which seems old school compared to the modern day LLM SOTA systems which we use daily however, its still an extremely important building block to the power of all of the modern day LLMs. To understand why we needed Attention in the first place, its good to take a look back at history.

Before the age of LLMs to model sequences (like sentences) our best performing models where that of a family of models called the Reccurent Neural Network (or RNNs for short). Unlike typical Neural Networks the RNN would posses a special feature, the reccurant connection, which enabled the network to have "memory". This made RNNs especially great at modelling sequences such as text because they could handle variable length sequences. The model didn't need to know the exact length of the sentence or signal beforehand.

However, there was one huge problem with RNNs; they struggled with long-term dependancies. During training time as the sequence length of the input got longer, the RNN would struggle to remember the start of the sequence (due to the vanishing gradient problem) and lead to RNNs not being able to model large text sequences correctly. 

This core problem ultimately lead to the development of the Attention mechansim.

## The Core Idea: Paying Attention to Context
Attention was first introduced to the world in 2017, in the form of a paper called "Attention is all you need" by Viswani et al. This paper changed everything by ditching recurrence entirely. The premise of Attention is quite simple; given any word in a sentence, we can compute an "Attention Score" for each word preceding it which is used to weight relevancy to our scores. These attention scores are then used to compute a final *Context Vector* for a given word which would contain information of words preceding it.

How attention lets a model weigh the relevance of every word to every other word
Queries, Keys, and Values
The three components that make attention work, explained intuitively
Scaled Dot-Product Attention
The maths under the hood — kept simple
Multi-Head Attention
Why one attention mechanism isn't enough, and what we gain from running several in parallel
Why "Attention Is All You Need"
How the 2017 Vaswani et al. paper changed everything by ditching recurrence entirely
Where Attention Shows Up in Modern LLMs
From BERT to GPT — attention as the backbone of today's models`,
  };
  