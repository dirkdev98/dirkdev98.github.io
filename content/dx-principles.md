---
title: DX principles
description: Digest of developers experience principles
date: 2021-03-27
tags: []
type: blog
order: 3
---

# Digest of Developer experience principles

Warmed up by the interesting post
['Principles of Developer Experience'](https://cpojer.net/posts/principles-of-devx)
from Christoph Nakazawa here is a digest of the post, for future reference.

## The principles

It is a stack, easier to change the top of the stack, and gets increasingly
difficult at the bottom. This document starts describing the principles the DX
way, from bottom to top.

### User focussed

- Be as performant as possible. Aim for a fast develop and run cycle.
- Clear signals. Accessible output, clear and actionable errors
- Documentation should answer the questions that the user has
- Scalable for the growth of dev team

Things that make this challenging to accomplish: focus on potential new users
instead of the current users, and the boring work that goes in testing, ensuring
clear errors, writing documentation etc.

### Incremental migration

Incremental migration ensures everyone can keep up, while 'legacy' api's are
worked out of the code base. Big breaking changes and rewrites have a big sunk
cost.

### Clarity

Write proposals, share with people knowledgeable in the domain or people willing
to give honest feedback. Surface the right amount of complexity when discussing
features with the users.

### Re-evaluate

Re-evaluate assumptions, constraints and trade-offs. These tend to change over
time. By documenting decisions, future you can look back and reflect on these
and decide if they hold up or need to be improved. Re-evaluate assumptions,
constraints and trade-offs. These tend to change over time. By documenting
decisions, future you can look back and reflect on these and decide if they hold
up or not. Always aim to make things easier.

### Maximize option value

Retain and gain option value when doing changes. There are always related
features that can then be implemented with less work. This conflicts with
`YAGNI`.

- Modularize with clear api boundaries
- Third party dependencies introduce external control

### Final notes

These are not set in stone for all situations. Tools may have a principle on
scale, companies on growth. Some examples in the wild:

- [React's design principles](https://reactjs.org/docs/design-principles.html)
- [Fish shell design](http://fishshell.com/docs/current/design.html)
