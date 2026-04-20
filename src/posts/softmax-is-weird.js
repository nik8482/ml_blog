export default {
  id: 1,
  title: 'Why Softmax Is Actually Weird',
  category: 'fundamentals',
  date: '2026-04-20',
  excerpt: 'Everyone uses it, nobody questions it. The softmax function is quietly one of the strangest decisions in deep learning.',
  readTime: '6 min',
  difficulty: 'beginner',
  content: `Softmax looks innocent. You pass in a vector of logits, get back a probability distribution. Job done.

But spend five minutes asking *why* it works and you hit a wall.

## The exponential is the whole point

The formula is simple:

\`\`\`python
import numpy as np

def softmax(x):
    e_x = np.exp(x - np.max(x))  # subtract max for numerical stability
    return e_x / e_x.sum()
\`\`\`

That subtraction of \`np.max(x)\` is already a hint that something is off. Without it, \`exp\` overflows for even moderately large logits. We've been papering over a numerical instability since day one.

## What the exponential actually does

The exp function does two things simultaneously:

- It maps reals to positives (so outputs can be probabilities)
- It amplifies differences — logits that are slightly larger become *much* more dominant

That second property is why softmax produces "sharp" distributions. A logit gap of 3 doesn't give you 3x more probability mass — it gives you e^3 ≈ 20x more.

## Temperature: admitting the problem

If the sharpness were always right, nobody would have invented temperature scaling. The fact that we routinely divide logits by a temperature T before softmax is an admission that the raw softmax is too confident.

\`\`\`python
def softmax_with_temperature(x, T=1.0):
    scaled = x / T
    e_x = np.exp(scaled - np.max(scaled))
    return e_x / e_x.sum()
\`\`\`

T < 1 sharpens the distribution further. T > 1 flattens it. T = 1 is... whatever the training happened to produce.

## The deeper issue: why not something simpler?

You could normalize with absolute values. Or shift-and-divide. Softmax wins because:

- It's differentiable everywhere
- Its gradient has a clean closed form (the Jacobian is \`diag(p) - p p^T\`)
- It connects neatly to the Boltzmann distribution in statistical mechanics

That last point is the real answer. Softmax isn't a design choice so much as a rediscovery — physicists were using the same formula to model energy state probabilities decades earlier.

## What this means in practice

When your model is overconfident, it's often not a data problem — it's the exponential getting away from you. Label smoothing, temperature scaling at inference, and logit normalization are all attempts to fight the same pathology.

Next time you see a softmax, ask: why exponential? The honest answer is that it works well enough, has nice gradients, and nobody has found something clearly better for the classification case. That's not a bad reason. But it's worth knowing it's *the* reason.`,
};
