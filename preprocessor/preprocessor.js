var Preprocessor = function () {}

Preprocessor.prototype.clean = function (string) {
  var stringElements = string.toLowerCase().split(/[^\w]/).filter(function (element) {
    if (element !== '') {
      return element
    }
  }).reduce(function (newString, stringElement) {
    return newString + ' ' + stringElement
  }, '').trim()

  var value = []
  value.push(stringElements)

  return value
}

Preprocessor.prototype.text = function (string) {
  return string.toLowerCase().split(/[^\w]/).filter(function (stringElement) {
    if (stringElement !== '') {
      return stringElement
    }
  })
}

Preprocessor.prototype.ignore = function (string) {
  return []
}

Preprocessor.prototype.blank = function (string) {
  var value = []
  value.push(string)
  return value
}

module.exports = Preprocessor
