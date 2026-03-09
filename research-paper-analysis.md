# Analysis: TradeFM — A Generative Foundation Model for Trade-flow and Market Microstructure

**Paper:** [arXiv 2602.23784](https://arxiv.org/abs/2602.23784)
**Authors:** Maxime Kawawa-Beaudan, Srijan Sood, Kassiani Papasotiriou, Daniel Borrajo, Manuela Veloso
**Published:** February 27, 2026

## Abstract

TradeFM is a 524M-parameter generative Transformer that brings the foundation model
paradigm to market microstructure, learning directly from billions of trade events across
more than 9,000 equities. The authors develop scale-invariant features and a universal
tokenization scheme that map the heterogeneous, multi-modal event stream of order flow
into a unified discrete sequence, eliminating asset-specific calibration. When integrated
with a deterministic market simulator, TradeFM-generated rollouts reproduce key stylized
facts of financial returns (heavy tails, volatility clustering, absence of return
autocorrelation). Quantitatively, TradeFM achieves 2-3x lower distributional error than
Compound Hawkes baselines and generalizes zero-shot to geographically out-of-distribution
APAC markets.

## Methodology

1. **Scale-Invariant Features & Universal Tokenization:** The heterogeneous, multi-modal
   event stream of order flow is mapped into a unified discrete token sequence. This
   eliminates asset-specific calibration so a single model works across thousands of
   stocks without per-asset tuning.

2. **Autoregressive Sequence Modeling:** Market microstructure is formulated as a
   generative, autoregressive sequence modeling problem — analogous to how GPT models
   language, TradeFM models the sequence of market events.

3. **Partial Observability:** Unlike prior approaches requiring the full limit order book
   (LOB), TradeFM learns from a partially observed market state — the Level 3 event
   stream available to any single market participant.

4. **Deterministic Market Simulator Integration:** The model is coupled with a
   deterministic market simulator to generate full market rollouts from predictions.

## Data

- **Training:** Billions of trade events across >9,000 equities, constructed to maximize
  heterogeneity across assets, sectors, and liquidity regimes.
- **Evaluation:** Temporally out-of-sample data and geographically out-of-distribution
  APAC markets (zero-shot generalization).

## Results

- **2-3x lower distributional error** vs. Compound Hawkes process baselines.
- Reproduces canonical stylized facts: heavy tails, volatility clustering, absence of
  return autocorrelation.
- Zero-shot generalization to APAC markets with moderate perplexity degradation.
- Matches real distributions of log returns and spreads.

## Conclusion

Scale-invariant trade representations capture transferable structure in market
microstructure, opening a path toward:

1. **Synthetic data generation** for backtesting
2. **Stress testing** under extreme market conditions
3. **Learning-based trading agents** trained in high-fidelity simulated environments

TradeFM distinguishes itself from prior work (e.g., MaRS) by pre-training on maximally
heterogeneous data across thousands of assets and learning from Level 3 trade messages
rather than full LOB snapshots.
