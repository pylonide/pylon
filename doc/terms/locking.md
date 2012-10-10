# Locking

[A lock](http://en.wikipedia.org/wiki/Lock_(computer_science))
is a mechanism for enforcing limits on access to a resource in a
multi-user environment. Locks are one way of enforcing concurrency
control policies. Ajax.org Platform (APF) has support for locking in
combination with [action rules](./actionrules.md). There are two
types of locks; pessimistic and optimistic locks. Descriptions below are
from [wikipedia](http://en.wikipedia.org/wiki/Lock_(computer_science)).
    
## Optimistic

This allows multiple concurrent users access to the database whilst the
system keeps a copy of the initial-read made by each user. When a user
wants to update a record, the application determines whether another user
has changed the record since it was last read. The application does this
by comparing the initial-read held in memory to the database record to
verify any changes made to the record. Any discrepancies between the
initial-read and the database record violates concurrency rules and hence
causes the system to disregard any update request. An error message is
generated and the user is asked to start the update process again.
It improves database performance by reducing the amount of locking
required, thereby reducing the load on the database server. It works
efficiently with tables that require limited updates since no users are
locked out. However, some updates may fail. The downside is constant
update failures due to high volumes of update requests from multiple
concurrent users - it can be frustrating for users.
 
For optimistic locking APF can run as if there would be no locking.
Changed data is sent to the server and is either successfully saved or
not. When the action isn't changed and the server returns an error code
the `apf.actiontracker` **automatically
reverts the change**.
     
## Pessimistic

This is whereby a user who reads a record with the intention of updating
it, places an exclusive lock on the record to prevent other users from
manipulating it. This means no one else can manipulate that record until
the user releases the lock. The downside is that users can be locked out
for a long time thereby causing frustration.
 
For pessimistic locking add the locking attribute to the [action rules](./actionrules.html)
that need it. The following example shows a lock request for a rename
action on a file browser tree.

```xml
 <a:rename set="..." lock="{comm.lockFile([@path], unlock)}" />
```

The unlock variable is true when the lock needs to be released. This is
done when the action was cancelled after getting a lock. For instance
when the user presses escape while renaming.
     
### MultiUser

In multi-user environments it can be handy
to be signalled of changes by others within the application. For more
information on this please look at `apf.remote`.
     
### Remarks

During offline works pessimistic locks will always fail. If the application
does not use remote smart bindings the developer
should reload the part of the content for which the lock failed. See `databinding@lockfailed`.

Note: APF understands the status codes specified in [RFC4918](http://tools.ietf.org/html/rfc4918#section-9.10.6) for the locking implementation