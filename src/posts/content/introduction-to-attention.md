Attention might seem old school compared to modern LLM SOTA systems, but it's still a fundamental building block powering all of them. To understand why we needed it, it helps to look back at history.

Before LLMs, our best models for sequences were Recurrent Neural Networks (RNNs). Unlike typical neural networks, RNNs had a recurrent connection giving the network "memory" — making them great at modelling variable length sequences like text without needing to know the length upfront.

But RNNs had one huge problem: long-term dependencies. As sequences got longer, the RNN struggled to remember the start of the sequence due to the vanishing gradient problem, meaning it couldn't correctly model large pieces of text.

This core problem ultimately led to the development of the Attention mechanism.

## The Core Idea: Paying Attention to Context
Attention was first introduced to the world in 2017, in the form of a paper called "Attention is all you need" by Viswani et al. This paper changed everything by ditching recurrence entirely. 

The premise of Attention is quite simple; given any token in a sentence, we can compute an "Attention Score" for each token preceding it. These scores are then used to weight our final context vectors such that our vectors have an indication of token revelancy which is used to weight relevancy to our scores. 

Each token in a given sentence has three different vectors which allow us to calculate attention; Key, Value and Query (like how a database works). These vectors are formed by taking the embedding vector of a token and doing the matrix multiplication of the embedding with a trainable weight matrix which get tuned during pretraining. 

Once we have those vectors, we can calculate the final "Context Vector" of a selected token $T_i$:
- Take the query vector for $T_i$ and take the dot product of the Key vectors of itself and the tokens preceding it to get attention scores
-  Normalise the scores by dividing each attention score by $\sqrt{D_k}$ where $D_k$ is the dimension of the key vectors
- Take the weighted sum of all value vectors with the associated attention score to produce a context vector for $T_i$

Python snippet below for the mechanism

```python
import numpy as np

def attention(Q, K, V): 
    """
    Q: query vectors (seq_len, d_k)
    K: key vectors (seq_len, d_k)
    V: value vectors (seq_len, d_v)
    """
    d_k = K.shape[-1] # Step 1: dot product of queries with keys → raw attention scores
    scores = Q @ K.T # (seq_len seq_len)
    # Step 2: mask future tokens (causal/autoregressive)
    seq_len = scores.shape[0]
    mask = np.triu(np.ones((seq_len, seq_len)), k=1) * -1e9
    scores += mask
    # Step 3: scale by sqrt(d_k)
    scores /= np.sqrt(d_k)

    # Step 4: softmax to get weights
    scores -= scores.max(axis=-1, keepdims=True) # numerical stability
    weights = np.exp(scores)
    weights /= weights.sum(axis=-1, keepdims=True)  # (seq_len, seq_len)

    # Step 5: weighted sum of value vectors
    context = weights @ V # (seq_len, d_v)
    return context, weights 
```


## Multi-Head Attention
If a single attention mechanism is like looking at a sentence through a magnifying glass, Multi-Head Attention is like having a team of experts looking at that same sentence from different angles simultaneously.

Instead of performing a single attention function, we split our Query, Key, and Value vectors into multiple "heads." Each head has its own set of learnable weight matrices ($W^Q, W^K, W^V$). This allows the model to capture different types of relationships at once:

- Head 1 might focus on grammar and syntax (e.g., matching a verb to its subject)
- Head 2 might focus on semantic meaning (e.g., linking a pronoun like "it" back to "the car")
- Head 3 might focus on long-range context or specific factual associations.

Once each head has calculated its own context vector, we concatenate them back together and pass them through a final linear layer. This ensures the model doesn't just get a "blurry" average of the sentence, but a rich, multi-dimensional representation of how every token interacts with every other token.

## Round up
The transition from the linear bottleneck of RNNs to the parallelised power of Multi-Head Attention triggered the Transformer revolution. By weighing word importance regardless of distance, this mechanism solved long-term dependencies and enabled massive scaling. 

Today’s SOTA models—from GPT-4 to Gemini—are essentially deep stacks of these attention heads, turning a clever mathematical concept into the sophisticated reasoning we see in modern AI.