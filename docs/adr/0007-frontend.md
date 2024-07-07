# Frontend

|          |                                                   |
| -------- |---------------------------------------------------|
| status   | accepted                                          |
| date     | 2024-04-28                                        |
| deciders | [Joshua Gawenda](https://github.com/gutentag2012) |

## Context and Problem Statement

It turns out, that Astro is not fitting the needs of the project. Its focus is mainly on static content sites and not on dynamic web applications. Therefore, a new frontend framework needs to be chosen.

## Decision Drivers

* Time to implement
* Ease of use
* Ability for routing
* Dynamic web application

## Considered Options

* NextJS
* SvelteKit

## Decision Outcome

Chosen option: "NextJS", because it is widely used, already known to the maintainers of this project, and can handle React (since already some components are created with React).

## Pros and Cons of the Options

### NextJS

NextJS is a popular frontend server framework for React.

* Good, because it is widely used
* Good, because it is already known to the maintainers of this project
* Good, because it can use already created React components
* Neutral, because it can only handle React
* Neutral, because it uses different patterns than "normal" React with Server Components

### SvelteKit

SvelteKit is a frontend server framework for Svelte.

* Good, because it is performant
* Neutral, because it is somewhat known to the maintainers of this project
* Neutral, because it cannot reuse any previous work
* Bad, because it is still relatively new
