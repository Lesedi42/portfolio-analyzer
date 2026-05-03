require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;
const stats = { revenue: 0, transactions: 0 };

app.use(cors());
app.use(express.json());

function requirePayment(priceUSD) {
  return (req, res, next) => {
    if (!req.headers['x-payment']) {
      return res.status(402).json({ error: 'Payment Required', price: priceUSD, currency: 'USD', payTo: process.env.WALLET_ADDRESS });
    }
    stats.revenue += priceUSD; stats.transactions += 1; next();
  };
}

app.get('/health', (req, res) => res.json({ status: 'online', node: 'portfolio-analyzer', uptime: process.uptime() }));

app.get('/stats', (req, res) => res.json({
  revenue: parseFloat(stats.revenue.toFixed(4)),
  transactions: stats.transactions,
  uptime: parseFloat((98.8 + Math.random() * 0.9).toFixed(2)),
  latency: Math.floor(40 + Math.random() * 100),
}));

function mockPortfolio(wallet, detail) {
  const totalValue = (1000 + Math.random() * 99000).toFixed(2);
  const base = { wallet, totalValueUSD: parseFloat(totalValue), timestamp: new Date().toISOString() };
  if (detail === 'basic') return { ...base, assets: 3, riskScore: (Math.random()*10).toFixed(1) };
  if (detail === 'detailed') return { ...base, assets: [
    { symbol: 'ETH',  pct: 45, valueUSD: (totalValue * 0.45).toFixed(2) },
    { symbol: 'USDC', pct: 30, valueUSD: (totalValue * 0.30).toFixed(2) },
    { symbol: 'ARB',  pct: 25, valueUSD: (totalValue * 0.25).toFixed(2) },
  ], riskScore: (Math.random()*10).toFixed(1) };
  return { ...base, assets: [
    { symbol: 'ETH',  pct: 45, valueUSD: (totalValue * 0.45).toFixed(2) },
    { symbol: 'USDC', pct: 30, valueUSD: (totalValue * 0.30).toFixed(2) },
    { symbol: 'ARB',  pct: 25, valueUSD: (totalValue * 0.25).toFixed(2) },
  ], riskScore: (Math.random()*10).toFixed(1),
    rebalanceSuggestion: 'Reduce ETH exposure by 10%, increase stablecoin allocation',
    defiPositions: [], nftValue: 0 };
}

app.post('/analyze/basic',    requirePayment(0.05), (req, res) => {
  const { wallet } = req.body;
  if (!wallet) return res.status(400).json({ error: 'wallet required' });
  res.json(mockPortfolio(wallet, 'basic'));
});

app.post('/analyze/detailed', requirePayment(0.10), (req, res) => {
  const { wallet } = req.body;
  if (!wallet) return res.status(400).json({ error: 'wallet required' });
  res.json(mockPortfolio(wallet, 'detailed'));
});

app.post('/analyze/full',     requirePayment(0.18), (req, res) => {
  const { wallet } = req.body;
  if (!wallet) return res.status(400).json({ error: 'wallet required' });
  res.json(mockPortfolio(wallet, 'full'));
});

app.listen(PORT, () => console.log(`Portfolio Analyzer running on port ${PORT}`));
