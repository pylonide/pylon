/*
(The MIT License)

Copyright (c) 2011 Mattijs Hoitink

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the 'Software'), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

Originally from: https://github.com/mattijs/node-terminal
*/

var sys = require('sys');
    
// Terminal object
// Allows for controlling the terminal by outputting control characters
var terminal = {
    // Terminal escape character
    escape: '\033',
    
    // Display attributes reset
    reset: '\033[0m',
    
    // Terminal display colors
    colors: {
        foreground: {
            'black':      30,
            'red':        31,
            'green':      32,
            'yellow':     33,
            'blue':       34,
            'magenta':    35,
            'purple':     35,
            'cyan':       36,
            'white':      37
        },
        background: {
            'black':      40,
            'red':        41,
            'green':      42,
            'yellow':     43,
            'blue':       44,
            'magenta':    45,
            'cyan':       46,
            'white':      47
        },
        attribute: {
            'reset':      0,
            'bright':     1,
            'bold':       1,
            'dim':        2,
            'underscore': 4,
            'underline':  4,
            'blink':      5,
            'inverse':    6,
            'hidden':     8,
        }
    },
    
    // Get the terminal command for a color. A color command is build up of a 
    // foreground, a background and a display attribute. These can be defined as 
    // an object resulting in a compound command. When the color is passed as a 
    // string it is assumed this is a foreground color.
    _color: function(color) {
        if (undefined === color) {
            throw 'Color not defined';
        }
        
        // Check if color is only a string
        if (typeof color == 'string') {
            // Assume we want a foreground color
            color = {foreground: color};
        }
        
        // Collect all parts of the color code
        var code = [];
        for (type in color) {
            var colorCode = this._colorCode(color[type], type);
            if (null !== colorCode) {
                code.push(colorCode);
            }
        }
        
        // Construct the complete code
        return this.escape + '[' + code.join(';') + 'm';
    },
    
    // Print a terminal color command. This uses the `_color` function to 
    // retreive the color command.
    color: function(color) {
        sys.print(this._color(color));
        return this;
    },
    
    // Get a color code for a color type. Color types are `foreground`, 
    // `background` or `attribute`.
    _colorCode: function(name, type) {
        type = type || 'foreground';
        
        if (type in this.colors) {
            if (name in this.colors[type]) {
                return this.colors[type][name];
            }
        }
        
        return null;
    },
    
    // Colorize a message and return it. The message can be colorized with 
    // modifiers that are preceded by a `%` character. The following modifiers 
    // are supported:
    //                  text      text            background
    //      ------------------------------------------------
    //      %k %K %0    black     dark grey       black
    //      %r %R %1    red       bold red        red
    //      %g %G %2    green     bold green      green
    //      %y %Y %3    yellow    bold yellow     yellow
    //      %b %B %4    blue      bold blue       blue
    //      %m %M %5    magenta   bold magenta    magenta
    //      %p %P       magenta (think: purple)
    //      %c %C %6    cyan      bold cyan       cyan
    //      %w %W %7    white     bold white      white
    //
    //      %F     Blinking, Flashing
    //      %U     Underline
    //      %8     Reverse
    //      %_,%9  Bold
    //
    //      %n,%N  Resets the color
    //      %%     A single %
    _colorize: function(message) {
        var conversions = {
            '%y': {foreground: 'yellow'},
            '%g': {foreground: 'green'},
            '%b': {foreground: 'blue'},
            '%r': {foreground: 'red'},
            '%p': {foreground: 'magenta'},
            '%m': {foreground: 'magenta'},
            '%c': {foreground: 'cyan'},
            '%w': {foreground: 'grey'},
            '%k': {foreground: 'black'},
            '%n': 'reset',
            '%Y': {foreground: 'yellow',  attribute: 'bold'},
            '%G': {foreground: 'green',   attribute: 'bold'},
            '%B': {foreground: 'blue',    attribute: 'bold'},
            '%R': {foreground: 'red',     attribute: 'bold'},
            '%P': {foreground: 'magenta', attribute: 'bold'},
            '%M': {foreground: 'magenta', attribute: 'bold'},
            '%C': {foreground: 'cyan',    attribute: 'bold'},
            '%W': {foreground: 'grey',    attribute: 'bold'},
            '%K': {foreground: 'black',   attribute: 'bold'},
            '%N': 'reset',
            '%0': {background: 'black'},
            '%1': {background: 'red'},
            '%2': {background: 'green'},
            '%3': {background: 'yellow'},
            '%4': {background: 'blue'},
            '%5': {background: 'magenta'},
            '%6': {background: 'cyan'},
            '%7': {background: 'grey'},
            '%F': {attribute: 'blink'},
            '%U': {attribute: 'underline'},
            '%8': {attribute: 'inverse'},
            '%9': {attribute: 'bold'},
            '%_': {attribute: 'bold'},
        };
        
        // Replace escaped '%' characters
        message = message.replace('%%', '% ');
        
        // Convert all tokens with color codes
        for (conversion in conversions) {
            // Special case for `reset`
            if ('reset' === conversions[conversion]) {
                message = message.replace(conversion, this.reset);
            } else {
                message = message.replace(new RegExp(conversion, ['g']), this._color(conversions[conversion]));
            }
        }
        // Reset all escape '%' characters
        message = message.replace('% ', '%');
        
        // Return the message
        return message;
    },
    
    // This uses the `_colorize` function to __print__ a colorized message.
    colorize: function(message) {
        sys.print(this._colorize(message));
        return this;
    },
    
    // Write a message in the terminal
    write: function(message) {
        sys.print(message);
        return this;
    },
    
    // Print one or more new line characters
    nl: function(n) {
        n = n || 1;
        for (var i = 0; i < n; i++) {
            sys.print('\n');
        }
        return this;
    },
    
    // Move the terminal cursor
    move: function(x, y) {
        x = x || 0;
        y = y || 0;
        
        var command = this.escape + '[';
        if (undefined !== x && 0 < x) {
            command += ++x;
        }
        if (undefined !== y && 0 < y) {
            command += ';' + ++y ;
        }
        
        sys.print(command + 'H');
        return this;
    },
    
    // Move the terminal cursor up `x` positions
    up: function(x) {
        sys.print(this.escape + '[' + x + 'A');
        return this;
    },
    
    // Move the terminal cursor down x positions
    down: function(x) {
        sys.print(this.escape + '[' + x + 'B');
        return this;
    },
    
    // Move the terminal cursor `p` positions right
    right: function(p) {
        sys.print(this.escape + '[' + p + 'C');
        return this;
    },
    
    // Move the terminal cursor `p` positions left
    left: function(p) {
        sys.print(this.escape + '[' + p + 'D');
        return this;
    },
    
    // Clear all characters from the terminal screen
    clear: function() {
        sys.print(this.escape + '[2J');
        return this;
    },
    
    // Clear the line the cursor is at
    clearLine: function() {
        sys.print(this.escape + '[2K');
        return this;
    },
    
    // Clear the next `n` characters from the current cursor position.
    clearCharacters: function(n) {
        this.write(new Array(n + 2).join(' ')).left(n + 2);
        return this;
    }
};

// Export the command object
module.exports = terminal;
