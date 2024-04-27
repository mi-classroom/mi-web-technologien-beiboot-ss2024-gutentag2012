# {short title of solved problem and solution}

|          |                                                   |
|----------|---------------------------------------------------|
| status   | accepted                                          |
| date     | 2024-04-27                                        |
| deciders | [Joshua Gawenda](https://github.com/gutentag2012) |

## Context and Problem Statement

When working with files that users can upload, we need to store them so they can be accessed later.

## Decision Drivers

* How easy is it to implement?
* Can this be deployed?

## Considered Options

* Amazon S3
* Minio
* Local File System

## Decision Outcome

Chosen option: "Minio", because it can be used as a drop-in replacement for Amazon S3 and can be deployed on-premises.

## Pros and Cons of the Options

### Amazon S3

It Is a commonly used service for file storage and hosted by Amazon.

* Good, because it is a well-known service
* Good, because it can store and serve large amounts of data
* Bad, because it is a paid service
* Bad, because it cannot be hosted on-premises
* Bad, because it has the overhead of server requests

### Minio

It is an open-source object storage server that can be used as a drop-in replacement for Amazon S3.

* Good, because it is open-source
* Good, because it can be hosted on-premises
* Neutral, because it is not as well-known as Amazon S3
* Bad, because it has the overhead of server requests

### Local File System

It is the simplest option for file storage.

* Good, because it is straightforward to implement
* Good, because it has no overhead of server requests
* Bad, because it is not scalable
* Bad, because it is not fault-tolerant
* Bad, because it cannot be used in every deployment environment
