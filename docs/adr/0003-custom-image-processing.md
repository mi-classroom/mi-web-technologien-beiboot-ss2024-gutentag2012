# {short title of solved problem and solution}

|          |                                                                                                      |
| -------- | ---------------------------------------------------------------------------------------------------- |
| status   | accepted |
| date     | 2024-04-27                                                      |
| deciders | [Joshua Gawenda](https://github.com/gutentag2012)                                                    |

## Context and Problem Statement

After deciding to create a custom image processor, it has to be decided how to implement it.

## Decision Drivers

* How long does it take to implement?
* How performant is it?
* How maintainable is it?

## Considered Options

* Golang
* Javascript
* Compute Shaders

## Decision Outcome

Chosen option: "Golang", because it is the neccessary tools to do image processing in the stdlib and is very performant due to its implementation of green threads with goroutines.

## Pros and Cons of the Options

### Golang

* Good, because it is very performant when using goroutines
* Good, because it has image processing in the stdlib
* Neutral, because it is a popular tool and has a lot of resources to read
* Neutral, because it is somewhat know to the maintainers of this project
* Bad, because it might not be know to all reviewers of this project

### Javascript

* Good, because it is the main tool used by the maintainers of this project
* Good, because it has a lot of different libaries for image processing
* Netural, because it is probably known to a lot of reviewers of this project
* Bad, because it has very poor performance
* Bad, because it might not be know to all reviewers of this project

### Compute Shaders

* Good, because it has the best performance of all solutions
* Good, because it is made for graphics calculations
* Netural, because it is not known by the maintainer of this project, but does not seem too complex on the first look
* Bad, because it is probably not known by most of the reviewers of this project
* Bad, because it is might behave differently in deployed environment due to possible lack of GPU
