# 🍩 10tance

10tance is a data processor to build virtual worlds from the state of an EVM chain.

The core concept is the translation of an 0x address into a predictable location, giving objects (EOA accounts and contracts) a position and subsequently distance between them.

## An EVM world

To each chain its own world. They will be displayed on an interactive 2d map.

If you think the world is flat, I can tell you you are wrong because it is actually a doughnut ! Here they are indeed toruses, east connects with west and north with south :

* it makes the projection s simple as on flat world
* there is no edges as on a sphere world

Same as with classical interactive maps, it will be composed of several layers fitting into two categories :

### Background layers

They could be an addresses density map, market value density.

### Interactive points of interest

Accounts and contracts shown as interactive locations. Searchable from their standard ERC interfaces, their addresses, their links to other objects

## Context

* Started during the ETHGlobal Superhack 2024 event : https://ethglobal.com/showcase/10tance-ggf1f
* Launched as a demo app on https://10tance.vercel.app/ with ERC20 tokens from the Optimism blockchain

## How it works 

* An [indexer](/packages/indexer/) to get data from the Blockscout API and to compute the virual locations
* A [NextJS application](/packages/nextjs) to display the map
* A [tiles and API backend](/pacckages/tileserver) to generate the map background images and retrieve objects to display them on top