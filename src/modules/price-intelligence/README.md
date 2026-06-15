# Price Intelligence Engine

## Purpose

The Price Intelligence Engine transforms raw `price_snapshots` into product statistics, city statistics, market signals, price change events, anomalies, and trends.

## Files

- `price-intelligence.module.ts`: module factory and exports
- `price-intelligence.service.ts`: internal API facade
- `price-comparison.service.ts`: product-level statistics
- `price-analytics.service.ts`: market signals, anomalies, trends
- `price-change-detector.service.ts`: change event detection
- `city-price-analytics.service.ts`: city-level aggregation
- `price-intelligence.types.ts`: DTOs and calculation contracts
- `testing/sample-price.dataset.ts`: sample price snapshots
- `testing/analytics.test.ts`: product and market analytics scaffold
- `testing/change-detection.test.ts`: price change test scaffold
- `testing/city-aggregation.test.ts`: city aggregation test scaffold

## Architecture Diagram

```mermaid
flowchart LR
  Snapshots[price_snapshots] --> ProductStats[Product Statistics]
  Snapshots --> CityStats[City Statistics]
  Snapshots --> ChangeDetector[Price Change Detector]
  Snapshots --> AnomalyDetector[Anomaly Detector]
  ProductStats --> Signals[Market Signals]
  ChangeDetector --> Events[price_change_events]
  AnomalyDetector --> Anomalies[price_anomalies]
  Signals --> MarketDB[market_price_signals]
```

## Sequence Diagram

```mermaid
sequenceDiagram
  participant Worker
  participant Engine as PriceIntelligenceService
  participant Compare as PriceComparisonService
  participant City as CityPriceAnalyticsService
  participant Detect as PriceChangeDetectorService
  participant Analytics as PriceAnalyticsService

  Worker->>Engine: getProductStatistics(snapshots)
  Engine->>Compare: calculate product statistics
  Worker->>Engine: getCityStatistics(snapshots)
  Engine->>City: aggregate by city
  Worker->>Engine: detectPriceChanges(snapshots)
  Engine->>Detect: compare time-ordered prices
  Worker->>Engine: detectAnomalies(snapshots)
  Engine->>Analytics: detect invalid/extreme/duplicate prices
  Worker->>Engine: getMarketSignals(snapshots)
  Engine->>Analytics: generate market signal
```

## Test Plan

- Run product analytics over `sample-price.dataset.ts`.
- Verify lowest, highest, average, median, latest, variance, source count, and availability score.
- Run city aggregation and verify Karachi and Lahore outputs.
- Run change detection and verify increase, decrease, new low, new high, and significant change events.
- Run anomaly detection and verify invalid, duplicate, suspicious drop, and suspicious spike detection.

## Current Verification Limit

This workspace has no `package.json`, dependency installation, TypeScript compiler, generated Prisma client, live database, or test runner.

