# Frontend

|          |                                                      |
| -------- |------------------------------------------------------|
| status   | superseded by [0007-frontend.md](0007-frontend.md)   |
| date     | 2024-04-28                                           |
| deciders | [Joshua Gawenda](https://github.com/gutentag2012)    |

## Context and Problem Statement

For the frontend of the image processing application, a framework needs to be chosen.

## Decision Drivers

* Time to implement
* Ease of use
* Ability for routing

## Considered Options

* NextJS
* Astro
* SvelteKit

## Decision Outcome

Chosen option: "Astro", because is has built in routing and performance optimizations as well as support for most front-end frameworks.

## Pros and Cons of the Options

### NextJS

NextJS is a popular frontend server framework for React.

* Good, because it is widely used
* Good, because it is already known to the maintainers of this project
* Neutral, because it can only handle React
* Neutral, because it uses different patterns than "normal" React with Server Components

### Astro

Astro is a new frontend server framework that is gaining popularity.

* Good, because it has built in routing
* Good, because it has performance optimizations
* Good, because it supports most front-end frameworks
* Neutral, because it is only somewhat known to the maintainers of this project

### SvelteKit

SvelteKit is a frontend server framework for Svelte.

* Good, because it is performant
* Neutral, because it is somewhat known to the maintainers of this project
* Bad, because it is still relatively new
