# Central Backend

|          |                                                   |
| -------- |---------------------------------------------------|
| status   | accepted                                          |
| date     | 2024-04-28                                        |
| deciders | [Joshua Gawenda](https://github.com/gutentag2012) |

## Context and Problem Statement

The go service currently is a service that has to be called manually. 
To accommodate the needs of the frontend, a central backend is needed that can be called by the frontend.

## Decision Drivers

* Time to implement
* Ease of use

## Considered Options

* NestJS
* Go HTTP Server

## Decision Outcome

Chosen option: "NestJS", because is has similar features to the other options but is already know to the maintainers of this project.

## Pros and Cons of the Options

### NestJS

A Typescript-based NodeJS framework that is similar to Angular for the backend.

* Good, because it is already known to the maintainers of this project
* Good, because it has code generators to speed up development
* Neutral, because it is written with Typescript which is the same that is used for most frontends
* Neutral, because it is not as fast as Go

### Go HTTP Server

Go offers a built-in HTTP server that can be used to create a backend.

* Good, because it is very fast
* Good, because it can be merged with the current image processor
* Bad, because it is not known to the maintainers of this project
