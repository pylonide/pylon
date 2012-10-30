Cloud9 should no longer use `find` or `grep` as part of its server processes.
The reason is that there are far too many peculiarities to keep track of between
problems such as:

* BSD and GNU differences
* Issues with compiling PCRE
* Issues with keeping track of regular expression handling (_e.g._, JavaScript's
regular expression patterns closely match Perl, while even with PCRE some
workarounds need to be made)
* Portability (aside from BSD/GNU, there's Windows and Solaris to consider,
depending on a user's SSH workspace)

In this directory are two alternatives.

* [`ag`](https://github.com/ggreer/the_silver_searcher) is C program modled after
`ack`, which is considerably faster than `grep` and `find`. We can define a 
default _.agignore_ file (found here) to omit standard annoyances. Users can then
create their own _.agignore_ files in their directories to omit further results.

Since `ag` needs to be compiled, we ought to provide the (tiny) binary for users'
platforms.


* In the event that a user's platform is not supported by `ag`, we fall back to the
`nak`.

For more information on these changes, read [this pull request](https://github.com/ajaxorg/cloud9/pull/2369).