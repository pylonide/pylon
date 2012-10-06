Cloud9 should no longer use `find` or `grep` as part of its server processes.
The reason is that there are far too many peculiarities to keep track of between
problems such as:

* BSD or GNU differences
* Issues with compiling PCRE
* Issues with keeping track of regular expression handling (_e.g._, JavaScript's
regular expression patterns closely match Perl, while even with PCRE some
workarounds need to be made)
* Portability (aside from BSD/GNU, there's Windows and Solaris to consider,
depending on a user's SSH workspace)

In this directory are two alternatives.

### ag

[`ag`](https://github.com/ggreer/the_silver_searcher) is C program modled after
`ack`, which is considerably faster than `grep` and `find`. We can define a 
default _.agignore_ file (found here) to omit standard annoyances. Users can then
create their own _.agignore_ files in their directories to omit further results.

Since `ag` needs to be compiled, we ought to provide the (tiny) binary for users'
platforms.

### ack

In the event that a user's platform is not supported by `ag`, we fall back to the
Perl `ack`.

For various reasons, `ack` 1.96, the latest stable, omits a lot of niceities that
`ag` provides, such as the ability to filter directories or patterns based on 
filename.

`ack` 2.0 solves some of these issues, but it's been under development for over
two years, and shows no sign of rapid completion.

Therefore, the `ack` provided here is modified from the original source. It's 
**not** just a copy of what you get when you run `make` from the `ack` repo. 
Don't just overrride it! Changes have been made in the source and annotated with
comments prefixed with `# CHANGE:`.