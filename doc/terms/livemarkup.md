# Live Markup

Live Markup is an extension to Javascript, and it allows APF to have
a simple consistent syntax for all attribute values and templates.
Live markup is used for templating, rpc, data binding,
property binding, formatting and even events.

Live Markup generates text-output via the default-output of statements,
and APF maintains knowledge of all properties and data used to create
this output allowing for a Live update when any of this information changes.
Nearly all attributes in APF are processed as a live markup " " string
Some attributes (like events) and `<?lm ?>` blocks are processed as code.

LiveMarkup features include:

* inline xpaths
* E4X-like xml literals
* automatic statement/expression output and concat
* code and xpath expansion in-strings
* virtual-sync of async calls

## Examples

```javascript
   var x = [folder/@name]; // value of xpath
   [folder/@name] = 'hello'; // set an attribute
   [folder/file] += <file/>; // add a new file node to folder/file list
   var y = <folder><file name={x}/></folder> // e4x-style xml
   x; //automatic output
   <xml/>; // automatic output
   if(a)func(); // automatic output of function returnvalue
   x = 15; // not outputted, assignments are never output.
   var z = "string with jsvars: {x} and xpath: [folder/@name]";
   alert(comm.someRpcCall(x)); // async call returns sync value
```

LiveMarkup syntax has one conflict with normal JS syntax; an array of 1 item vs xpath.
Arrays are recognised if there is atleast one , present: [1,2] and 1 item: [,1]

Another important feature of LiveMarkup is that its infinitely nestable:
Outer construct: inner constructs
* string: xpath, code
* xpath: code, xpath(its a sub-xpath when NOT after [)\w] or IS inside "str" or 'str' )
* code: xpath, code, string, xml
* xml: xpath, code

Example of code in xpath in xml in code in string, for the sake of argument:

```javascript
var x = "str{<xml id=[xp{y}]/>}"
```

Since code has an auto-output, it is also possible to use scope { } delimiters holding a value
and used as an expression.
var x = {..code with auto output..}
The ^ character at the beginning of a statement can force 'no output' but is very rarely needed.

It is important to realise that Live Markup is converted to normal Javascript
in a single compile pass, and does not constitute black-magic.
As rarely debugging might force you to look at generated code, its useful to know it exists.
For instance:
XML literals are turned into normal JS strings: <xml/> becomes "<xml/>"
in generated code. This is different from E4X where they are special type of object.
xpaths and operators are turned into functioncalls: [xpath] becomes _val(_n,"xpath")
and nesting becomes concatenation: `"a{x}b"` becomes `("str"+(x)+"str")`.

## Live markup xpath reference

Different xpath types:

* `[xpath]` - value xpath (string)
* `%[xpath]` - single node
* `*[xpath]` - node set
* `#[xpath]` - number of nodes selected by xpath
* `$[symbol]` - language 'xpath', fetches value from language symbol library
* `[model::xpath]` - xpath value on model with name 'model'
* `[{x}::xpath]` - xpath value on xml node or model with js variable x
* `[{rpc.thing()}::xpath]` - xpath value on an rpc call
* `[xpath] = 'value'` - assign text-value to xpath (nodeValue = ..)
* `[xpath] = <xml/>` - replace node with right hand xml
* `[xpath] = xmlNode` - replace node with right hand node, removing xmlNode from its old position
* `[xpath] += 'value'` - appends text-value to nodeValue
* `[xpath] += <xml/>` - appends the `<xml/>` after the selected node
* `[xpath] += xmlNode` - appends the node and removes from its old position

## Macro reference

* `localName(n)` - returns the localName of the context node or supplied argument

* `tagName(n)` - tagName of context node or supplied argument

* `nodeValue(n)` - value of context nore or supplied argment similar to [.]

* `local(n){..code..}` - a codeblock with a new context node n, n can be xml-string too

* `each(set){..code..)` iterates over the set. usually used as: each(*[xpath]){}
