/**
 * Approximate public API token pricing (USD per 1M tokens) for cost & cache-savings estimates.
 */

export const DEFAULT_RATES = {
  pro: { input: 1.25, cache: 0.31, output: 10.0 },
  flash: { input: 0.15, cache: 0.0375, output: 0.6 },
  claude: { input: 3.0, cache: 0.3, output: 15.0 },
  gpt: { input: 2.5, cache: 1.25, output: 10.0 },
  default: { input: 1.25, cache: 0.31, output: 10.0 },
};

const MODEL_MATCHERS = [
  ['claude', /claude|sonnet|opus|haiku/],
  ['gpt', /gpt|codex|(?:^|[^a-z0-9])o[134](?:$|[^a-z0-9])/],
  ['flash', /flash|hydrogen/],
  ['pro', /pro|neon|carbon/],
];

export function modelBucket(model) {
  const m = String(model || '').toLowerCase();
  const hit = MODEL_MATCHERS.find(([, re]) => re.test(m));
  return hit ? hit[0] : 'default';
}

function pickRateNum(val, fallback) {
  const n = Number(val);
  return Number.isFinite(n) && n >= 0 ? n : fallback;
}

export function rateForModel(model, customRates) {
  const bucket = modelBucket(model);
  const base = DEFAULT_RATES[bucket] || DEFAULT_RATES.default;
  const custom = customRates?.[bucket];
  if (!custom || typeof custom !== 'object') return base;
  return {
    input: pickRateNum(custom.input, base.input),
    cache: pickRateNum(custom.cache, base.cache),
    output: pickRateNum(custom.output, base.output),
  };
}

export function estimateCost(input, cache, output, model, customRates) {
  const r = rateForModel(model, customRates);
  const actualUsd = ((input * r.input) + (cache * r.cache) + (output * r.output)) / 1e6;
  const noCacheUsd = (((input + cache) * r.input) + (output * r.output)) / 1e6;
  const savedUsd = Math.max(0, noCacheUsd - actualUsd);
  return { actualUsd, noCacheUsd, savedUsd };
}

export function mergeCost(target, delta) {
  target.actualUsd += delta.actualUsd;
  target.noCacheUsd += delta.noCacheUsd;
  target.savedUsd += delta.savedUsd;
}
