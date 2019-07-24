# Data Instructions

Data instructions offer a single and consistent way for
storing and retrieving
data from different data sources. For instance from a webserver using REST
or RPC, or from local data sources such as gears, air, o3, HTML5, as well as
from in memory sources from javascript or cookies. There is often an xml
element which is relevant to storing information. This element can be
accessed using XPath statements in the data instruction using curly braces.

## Syntax: Using data instructions to retrieve data:

```
 model="name_of_model"
 model="[name_of_model::xpath]"
 model="{element.selected}"
 model="[local(element.selected) {xpath}]"
 model="{element.choose}"
     model="[local(element.choose) {xpath}]"
     model="[local(element.root) {xpath}]"
     load="<specialtag>[comm.doCall([@id], test(), 5+10).xml]</specialtag>"
     get="example.jsp"
     get="http://www.bla.nl?blah=10&foo=[@bar]&example=[10+5]"
     get="{comm.submit('abc', [@bar])}"
     get="[local(comm.submit('abc', [@bar])) return [xpath]]"
     get="[submit('abc', [@bar])]"
     get="{xmpp.login(username, password)}"
     get="{webdav.getRoot()}"
     get="[10+5]"
```

## Syntax: Using data instructions to store data

```
 set="http://www.bla.nl?blah=10&foo={/bar}&example=[10+5]"
 set="post http://www.bla.nl?blah=10&foo={/bar}&example=[10+5]"
<a:add set="[[@uid] = comm.addPerson('abc', {/bar})]" />
 set="[submit('abc', {/bar})]"
 set="[example=[@name]]"
 set="[apf.setcookie('something', [.])]"
 set="[o3.fs.get('/var/test.xml').data = [.]]"
```
 
```
[
 function test(){
     var blah = comm.blah();
     return blah;
 }
]
<a:add set="[test([.])]" />
```