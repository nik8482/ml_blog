Every single LLM model takes space to use. Whether they are tiny models or large models, each model has its own unique memory footprint. A models memory footprint can be quite easily estimated as a function of the number of parameters it has. We know that parameters are another name for 'weights' which are just numbers at the end of the day. We can estimate the memory footprint of the model to be num_params * memory per parameter. This memory footprint essentially decides the type of hardware we need to serve our model. At inference time, the model weights need to be loaded from the HBM on the GPU at every decode step, this memory bandwith is often a bottleneck for inference thus the less storage space that these weights take the more efficient our infernece process will be.

The number of parameters which a model has is deeply intertwined with its model architecture, we cannot change these so the only way that we can possibly make the model's memory footprint small would be to somehow change the amount of memory per parameter that the model takes. We know that in computers FP16 numbers take up more memory than INT8 numbers since initutively FP16 has more information to store. Making these changes to the model weights is done by a process called Quantisation where the goal is to reduce the memory footprint of the model as much as possible whilst keeping the accuracy loss as minimal as possible.

## The Core Idea
Lets take an example of a 70B model which has its weights stored at FP16 precision; Each FP16 nummber takes around 2 Bytes of memory therefore the GPU memory needed to serve our model would be 70B * 2 Bytes = 140GB. This is huge, and there isn't currently a single standard GPU on the market which has this much HBM to serve this model, we would have to use a multi-gpu set up or an nvlink setup. Similarly lets take the idea of having the same model but at INT8 precision; the calculation then becomes 70B * 1 Byte = 70GB. This can now fit on a single standard H100 (80GB). 

Instead of storing a weight as a 16-bit float, we can store it as an 8-bit  integer. At compute time, we would need to dequantise back to float for the weight matrix multiply to minimise any accuracy loss.

Generally, the formulae go as follows:

x_quantised = round(x / scale) + zero_point
x_dequantised = (x_quantised - zero_point) × scale

Scale and zero_point are calibration parameters which are computed from the weight distribution. These are needed as they are used to map the entire range of the weight distribution. They're stored in float16 which contributes a minimal but small overhead to the inference process.

## Granularity
There are three main distinct ways to quantise a set of weights:
- Per-tensor; Quantise the entire weight matrix at once
- Per-channel; Quantise row-wise (or column-wise)
- Per-group; Quantise n number of weights at a time (like 128)

Each type of quantisation method has varying trade-offs, for example Per-Tensor would be the quickest way to quantise weights however Since the scale and zero_point are dependant on the weights distribution it would be the method which would be effected more by outliers. 

Per-channel (usually the best) takes a longer time to quantise as we need to calculate and store the scale and zero point per row/column however as each row/column is treated independantly from eachother the 'blast radius' of weight outliers is fairly contained.

Per-group exists because with INT4 you only have 16 possible values. Even per-channel isn't fine-grained enough so outliers within a single row can still dominate the scale and crush precision for the other weights in that row. We go finer for INT4: one scale per every 128 weights within a row.

There are several different weight precisions to choose from:
| Precision | Memory | Accuracy Loss |
|----------|----------|----------|
| FP16        | 2Bytes        | None        |
| INT8        | 1Byte        | <1%        |
| INT4        | 0.5Byte        | 1-3%        |
| INT2        | 0.25Byte        | Significant        |

## KV Cache Quantisation
Separate from weight quantisation you can also quantise the KV cache itself. Each K and V vector stored as INT8 instead of FP16. This effectively halves the KV cache memory which means we can have more concurrent requests and a higher throughput. The accuracy impact is also minimal because our attention mechanism is relatively robust to KV precision values.