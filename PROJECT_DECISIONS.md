# Project Decisions

## 2026-06-15: Treat DawaiSaver.pk As Medicine Intelligence Platform

Decision: The product architecture is centered on intelligence, normalization, equivalence, price observation, review workflows, and source attribution.

Reason: The user explicitly stated this is not a pharmacy website clone.

## 2026-06-15: Phase 0 Before Code

Decision: Create governance and recovery documentation before implementing application code.

Reason: The user marked Phase 0 as mandatory first step.

## 2026-06-15: Preserve Historical Records

Decision: Price observations, source records, crawl outputs, and audit events should be append-only wherever possible.

Reason: The user required historical records to never be overwritten.

## 2026-06-15: Use Reviewable Confidence-Based Intelligence

Decision: Matching, normalization, recommendations, and unknown product discovery must produce confidence scores and support admin review.

Reason: Medical and price intelligence must be explainable and safe.

## 2026-06-15: Keep Health Module Under Runtime Modules

Decision: Place the health module at `src/modules/health/` so it matches the backend runtime layout and is easy to discover alongside other application modules.

Reason: The runtime foundation should follow the same modular organization as the domain engines.
