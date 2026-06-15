# Warehouse Expansion Plan

## Status

Warehouse fulfillment is future-only. No implementation is planned before intelligence and marketplace validation.

## Future Domains

- inventory
- expiry management
- batch tracking
- supplier management
- purchasing
- receiving
- picking and packing
- fulfillment
- returns
- recalls

## Decision Criteria

Warehouse expansion should be considered only after there is reliable evidence for:

- recurring demand by city
- high savings opportunities
- partner pharmacy limitations
- stable supplier relationships
- regulatory readiness
- operational capital availability

## Future Architecture

```mermaid
flowchart TD
  Demand[Demand Intelligence] --> Purchase[Purchasing]
  Supplier[Supplier Management] --> Receiving[Receiving]
  Receiving --> Inventory[Inventory and Batches]
  Inventory --> Expiry[Expiry Monitoring]
  Inventory --> Fulfillment[Fulfillment]
  Fulfillment --> Returns[Returns and Recalls]
```

