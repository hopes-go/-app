# Hope's & Go simplified workflow rebuild

This branch rebuilds the active ordering experience while the complete pre-rebuild app remains preserved on:

- Branch: `archive/full-feature-app-2026-08-07`
- Tag: `full-feature-app-before-simplification-2026-08-07`
- Commit: `5908582a9acfeb76fc9420f9433642947b6aa3d1`

## Retained in the active app

- Customer login, profile, membership, saved information, messages, and order history
- Driver clock-in, availability, job offers, acceptance, order progress, messaging, navigation, proof, history, and earnings
- Owner dispatch, customers, drivers, messages, pay records, reports, and system status
- Mapbox business/address search, location confirmation, routing, service areas, ETA, and live-driver map updates
- Add-ons, discounts, service-area charges, and Hope's & Go Stripe service-fee checkout
- Restaurant, grocery store, pharmacy, and other-business pickup requests

## Archived for later and inactive in the rebuild

- Restaurant partner accounts and dashboards
- Restaurant marketplace and individual restaurant menus
- Catalog-based food ordering and automatic restaurant checkout
- Restaurant destination Stripe transfers
- Specific restaurant credentials and partner-site linking
- Automatic food/product total collection through Hope's & Go checkout

## New active request sequence

1. Customer logs in and the app confirms an active driver is available.
2. Customer enters request details, requested pickup time, pickup business/address, drop-off, shopping list, and instructions.
3. Mapbox suggests nearby businesses and addresses; the customer confirms the exact pins before submission.
4. The request is offered to active drivers and an assigned driver accepts it.
5. Customer and driver communicate in the order conversation.
6. A friendly request check-in page explains that Hope's & Go is reviewing the request and confirming driver availability, then advances when a driver accepts.
7. The assigned driver sends approved payment options and instructions in the order conversation.
8. The customer reviews a dedicated optional Tip page and pays the tip directly to the assigned driver.
9. The next Pickup Payment page shows the food/order amount, the driver's approved payment option, and pending or confirmed status.
10. The driver confirms that the tip and food/order funds were received.
11. The app calculates only the Hope's & Go service fee, add-ons, discounts, and service-area charge.
12. Customer pays the Hope's & Go amount through Stripe.
13. A verified Stripe webhook unlocks Start order and notifies the assigned driver.
14. Driver progress, GPS, Mapbox route, ETA, receipt, delivery proof, and completion update the customer account.

No rebuild branch is merged or deployed until the complete local workflow has been reviewed and approved.
