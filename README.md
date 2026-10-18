# Ensurance

*Insure what you have. Ensure it lasts.*

JunctionX Turku 2026, If challenge: "If Insurance Could Do More".

## Problem

Small missed checks become large damage bills. One fire or water damage costs about €10,000 (Finance Finland, Insurance Survey 2025). Customers meet their insurer at signing and at claims, rarely in between. Their policies and bills are scattered, they lack a full picture of cost and cover, they find repair help alone, and good upkeep does not change the price.

## Idea

One app holds everything a customer insures and pays: home, cottage, boat, car and dog. Every insurance cost sits in one list, and each category gets a score for the condition of the item, not just the policy.

When the app spots a need, it matches a vetted If partner. The customer books and pays in the app. The finished job is logged and raises the score. Small jobs count too, such as cleaning gutters. A higher score earns a discount on each insurance, and the combined score sets a tier, from Bronze to Platinum, with extra benefits.

| Who | Gets |
|---|---|
| If | Fewer claims, a possible fee per job, per-item risk data for pricing |
| Customers | One app, quick fixes and lower premiums |
| Partners | Customers who need them |

## App

The customer app is for Finnish citizens and is built with Expo. Customers see all their insurances, costs and scores. They book partner services, track jobs, and earn discounts and tier rewards.

## Dashboard

The staff dashboard is for If staff and is built with Next.js. Staff compute how scores spread across customers and relate to claims. They simulate new discount bands or rewards and see the premium impact. They then set and publish prices, tiers and partner offers to the app.

## Backend

Both apps use one backend: a FastAPI API, a worker and an LLM pipeline, with a PostgreSQL database.

## Team

Eero, Joona, Antton, Oleksii, Oskari.
