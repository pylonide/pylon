define(function(require, exports, module) {

exports['!'] = exports.ifBang = {
  name: '!',
  type: '!',
  defaultValue: ''
}

exports.bang = {
  name: '!',
  type: '!',
  defaultValue: '!'
}

exports.count = {
  name: 'count',
  regex: '^([0-9]*)',
  match: 1,
  type: 'number',
  defaultValue: 1
}

exports.line = {
  name: 'line',
  regex: '([0-9]+)',
  match: 1,
  type: 'number'
}

exports.char = {
    name: 'char',
    regex: '((?:shift-){0,1}[\\s\\S])',
    match: 2,
    type: 'text',
    valueOf: function(input) {
        return input.length > 1 ? input.replace('shift-', '').toUpperCase() : input
    }
}

});
