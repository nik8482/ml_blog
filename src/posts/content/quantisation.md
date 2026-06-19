Every LLM takes up space. Whether it's tiny or huge, a model's memory footprint comes down to one thing: its parameters, the 'weights'. You can estimate the footprint as num_params × memory-per-parameter, and that decides what hardware you need to serve it. It matters at inference time too: the weights are streamed from the GPU's HBM at every decode step, and that memory bandwidth is often the bottleneck, so the smaller the weights, the faster inference runs.

The number of parameters which a model has is deeply intertwined with its architecture, and we cannot change these without drastically affecting model performance. The only lever left is the *amount of memory per parameter*. If we can shrink that, we shrink the whole model.

We know that in computers FP16 numbers take up more memory than INT8 numbers, since intuitively FP16 has more information to store. Making this change to the model weights is done by a process called Quantisation, where the goal is to reduce the memory footprint of the model as much as possible whilst keeping the accuracy loss as minimal as possible.

## The Core Idea
Lets take an example of a 70B model which has its weights stored at FP16 precision. Each FP16 number takes around 2 Bytes of memory and therefore the GPU memory needed to serve our model would be roughly 70B × 2 Bytes = 140GB. This is huge, and there isn't currently a single standard GPU on the market which has this much High-bandwidth memory (HBM) to serve this model — we would have to use a multi-GPU set up and shard (split) the model weights across the various GPUs. Now lets take the same model but with the weights at INT8 precision; the calculation becomes 70B × 1 Byte = 70GB. This can now fit on a single standard H100 (80GB), with room to spare for the KV cache.

Instead of storing a weight as a 16-bit float, we store it as an 8-bit integer. The trick is that we're not really throwing the float away — we're approximating a continuous range of floats with a fixed grid of integers, and remembering how to map back. At compute time we dequantise back to float (or do the matmul in integer arithmetic and rescale the result) so the maths still works out.

The mapping is just an affine transform:

$x_q = \text{round}(x / s) + z$

$\hat{x} = (x_q - z) \cdot s$

Here $s$ (the **scale**) and $z$ (the **zero-point**) are calibration parameters computed from the weight distribution. The scale sets how wide each integer "bucket" is, and the zero-point shifts the grid so that the floating-point zero lands exactly on an integer — which matters because zeros (think padding, ReLU, sparsity) need to stay exactly zero. They're stored in FP16 and shared across a block of weights, so they add a small but real overhead.

There are two flavours worth knowing:

- **Symmetric** — we assume the range is centred on zero and force $z = 0$. The scale is just $s = \max(|W|) / (2^{b-1}-1)$, so for INT8 we divide by 127. Cheaper and faster (no zero-point term in the matmul), and it's the default for weights, which tend to be roughly zero-centred.
- **Asymmetric** — we map the true $[\min, \max]$ range onto the full integer range with $s = (\max - \min)/(2^b - 1)$ and a non-zero $z$. This wastes no integer codes on a range the data never uses, which is handy for skewed distributions like post-ReLU activations.

A quick worked example with symmetric INT8: say a row of weights maxes out at $|W| = 0.5$. Then $s = 0.5 / 127 \approx 0.00394$. A weight of $0.30$ quantises to $\text{round}(0.30 / 0.00394) = 76$, and dequantises back to $76 \times 0.00394 = 0.2994$ — an error of about $0.0006$. That rounding error, summed over billions of weights, is exactly what we're trying to keep small.

## Granularity
The big question is: how many weights should *share* a single scale and zero-point? This is the granularity, and there are three main choices:

- **Per-tensor** — one scale for the entire weight matrix.
- **Per-channel** — one scale per row (or column).
- **Per-group** — one scale per block of $n$ weights (commonly 128).

Each has a trade-off. Per-tensor is the fastest and cheapest to store, but because the scale depends on the *widest* value in the whole matrix, a single large outlier stretches the scale and crushes the precision of every other weight — you end up wasting most of your integer codes representing a range that almost no weight occupies.

Per-channel (usually the sweet spot for INT8) takes longer to calibrate and stores one scale per row/column, but since each row is treated independently, the 'blast radius' of an outlier is contained to its own row.

Per-group exists because INT4 only gives you 16 possible values. At that resolution even per-channel isn't fine-grained enough — a single outlier in a long row still dominates the scale. So we go finer: one scale per 128 weights within a row. This is why you'll see modern INT4 formats described as "group size 128"; it's the standard knob for trading a tiny bit more metadata for a lot more fidelity.

There are several different weight precisions to choose from:

| Precision | Memory | Accuracy Loss |
|----------|----------|----------|
| FP16        | 2 Bytes        | None        |
| INT8        | 1 Byte        | <1%        |
| INT4        | 0.5 Byte        | 1-3%        |
| INT2        | 0.25 Byte        | Significant        |

## Weights aren't the whole story
So far we've only quantised weights, and dequantised them to FP16 to do the actual matmul. This is **weight-only** quantisation (you'll see it written as W4A16 or W8A16 — 4/8-bit weights, 16-bit activations). It's the easiest win because it shrinks the model on disk and in HBM, which is exactly what you want when you're memory-bandwidth bound during decode.

But the activations — the inputs flowing through each layer — are still FP16. If we quantise those too (W8A8) we can do the matmul in genuine INT8 arithmetic, which is roughly 2× faster on tensor cores and helps when you're compute bound (e.g. large-batch prefill). The catch is that activations are far harder to quantise than weights.

## The outlier problem
Here's the thing that makes LLM quantisation interesting. Once models pass a few billion parameters, their activations develop **emergent outlier features** — a handful of dimensions whose values are 10–100× larger than everything else. These outliers are rare but they carry a disproportionate amount of the model's signal, so you can't just clip them away.

For a per-tensor or per-channel INT8 activation scale, even one such outlier blows up the scale and everything else rounds to near-zero. This is why naive W8A8 wrecks accuracy on large models while the same scheme is fine on small ones. A few approaches have emerged to deal with it:

- **Mixed-precision decomposition (LLM.int8())** — detect the outlier dimensions at runtime and compute *those* columns in FP16, while the other 99%+ go through INT8. You keep almost all the speed-up and lose almost none of the accuracy.
- **SmoothScaling (SmoothQuant)** — since weights are easy to quantise and activations aren't, mathematically migrate some of the activation's "difficulty" into the weights. You divide the activations by a per-channel factor and multiply the corresponding weights by it; the matmul output is unchanged, but now both sides are smooth enough for INT8.
- **Error-aware weight quantisation (GPTQ / AWQ)** — for weight-only INT4, don't quantise each weight in isolation. GPTQ uses second-order (Hessian) information to adjust the remaining weights and compensate for the rounding error already introduced, while AWQ identifies the *salient* weight channels (the ones that interact with large activations) and scales them to protect their precision.

The common thread: the cost of quantisation isn't spread evenly across the model, so the good methods spend their bit budget where it actually matters.

## PTQ vs QAT
There are two broad regimes for *when* you quantise. Everything above is **Post-Training Quantisation (PTQ)** — you take a finished FP16 model and convert it, usually using a small **calibration** dataset (a few hundred sample sequences) to observe the activation ranges and pick good scales. It's cheap, needs no labels, and runs in minutes to hours.

**Quantisation-Aware Training (QAT)** instead simulates the rounding during training (or fine-tuning), so the model learns weights that are robust to being quantised. It recovers more accuracy, especially at very low bit-widths like INT2, but it costs a training run. The rule of thumb: reach for PTQ first, and only pay for QAT when PTQ has left too much accuracy on the table.

## KV Cache Quantisation
Separate from weight quantisation you can also quantise the KV cache itself — each K and V vector stored as INT8 instead of FP16. This matters because the KV cache grows linearly with both sequence length and batch size, and at long contexts it can dwarf the weights in memory. Halving it means more concurrent requests and higher throughput. The accuracy impact is minimal because attention is a weighted average and is fairly robust to a bit of noise in the cached precision — though it's common to keep the keys at higher precision than the values, since the keys feed the softmax where errors get amplified.
