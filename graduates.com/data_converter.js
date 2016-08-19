var DataConverter = function () {}

DataConverter.prototype.convertTelephone = function (value, dataObject) {
  var telephones = getOrElse(value, []).map(function (element) {
    return element.trim()
  }).filter(function (element) {
    return (element !== '')
  })

  if (telephones.length > 0) {
    insertMutipleDataObject('telephone', telephones, dataObject)
  }
}

DataConverter.prototype.convertMobilephone = function (value, dataObject) {
  var mobilephones = getOrElse(value, []).map(function (element) {
    return element.trim()
  }).filter(function (element) {
    return (element !== '')
  })

  if (mobilephones.length > 0) {
    insertMutipleDataObject('mobilephone', mobilephones, dataObject)
  }
}

DataConverter.prototype.convertFax = function (value, dataObject) {
  var fax = getOrElse(value, []).map(function (element) {
    return element.trim()
  }).filter(function (element) {
    return (element !== '')
  })

  if (fax.length === 1) {
    insertMutipleDataObject('fax', fax, dataObject)
  } else if (fax.length > 1) {
    insertMutipleDataObject('fax', [].concat(fax[0]), dataObject)
  }
}

DataConverter.prototype.convertEmail = function (value, dataObject) {
  var email = getOrElse(value, []).map(function (element) {
    return element.trim()
  }).filter(function (element) {
    return element.match(/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/)
  })

  if (email.length > 0) {
    insertMutipleDataObject('email', email, dataObject)
  }
}

DataConverter.prototype.convertName = function (value, dataObject) {
  var name = getOrElse(value, '').trim()

  if (name !== '') {
    dataObject['name'] = name
  }
}

DataConverter.prototype.convertBuildingType = function (value, dataObject) {
  var type = getOrElse(value, []).map(function (element) {
    return element.trim()
  }).filter(function (element) {
    return (element !== '')
  }).reduce(function (string, element) {
    return string + element + ', '
  }, '')

  type = type.substring(0, type.length - 2).trim()

  if (type !== '') {
    dataObject['building_type'] = type
  }
}

DataConverter.prototype.convertWebsite = function (value, dataObject) {
  var website = getOrElse(value, []).map(function (element) {
    return element.trim()
  }).filter(function (element) {
    return (element !== '')
  })

  if (website.length > 0) {
    insertMutipleDataObject('website', website, dataObject)
  }
}

DataConverter.prototype.convertAddress = function (value, dataObject) {
  var addresses = getOrElse(value, []).map(function (element) {
    return element.trim()
  }).filter(function (element) {
    return (element !== '')
  })

  if (addresses.length === 1) {
    dataObject['city'] = addresses[0]
  } else if (addresses.length > 1) {
    dataObject['city'] = addresses.pop()
    dataObject['address_additional'] = addresses.reduce(function (newAddress, element) {
      return newAddress + element + '\n'
    }, '').trim()
  }
}

function getOrElse (value, elseValue) {
  if (typeof value === 'undefined' || value === null) {
    return elseValue
  } else {
    return value
  }
}

function insertMutipleDataObject (key, values, dataObject) {
  if (values.length > 1) {
    dataObject[key] = values.shift()
    values.forEach(function (element, index) {
      dataObject[key + (index + 2)] = element
    })
  } else if (values.length === 1) {
    dataObject[key] = values[0]
  }
}

module.exports = new DataConverter()
