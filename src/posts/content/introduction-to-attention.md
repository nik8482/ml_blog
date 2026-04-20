 Attention might seem old school compared to modern LLM SOTA systems, but it's still a fundamental building block powering all of them. To understand why we needed it, it helps to look back at history.
                                                                        
Before LLMs, our best models for sequences were Recurrent Neural Networks (RNNs). Unlike typical neural networks, RNNs had a recurrent connection giving the network "memory" — making them great at modelling variable length sequences like text without needing to know the length upfront.

But RNNs had one huge problem: long-term dependencies. As sequences got longer, the RNN struggled to remember the start of the sequence due to the vanishing gradient problem, meaning it couldn't correctly model large pieces of text.

This core problem ultimately led to the development of the Attention mechanism.

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
From BERT to GPT — attention as the backbone of today's models
