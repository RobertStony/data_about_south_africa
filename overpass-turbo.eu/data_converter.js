var replaceall = require('replaceall')

var DataConverter = function () {}

DataConverter.prototype.convertTelephone = function (key, value, dataObject) {
  var telephoneArray = []
  switch (key) {
    case 'telephone_':
    case 'phone':
    case 'phone_1':
    case 'contact_phone':
      telephoneArray.push(value)
      break
  }

  if (telephoneArray.length !== 0) {
    telephoneArray = resolveMultipleEntries(telephoneArray, ',', '')
    telephoneArray = filterDuplicates(telephoneArray)
    insertIntoDataObject('telephone', telephoneArray, dataObject)
    dataObject['telephone'] = filterDuplicates(dataObject['telephone'])
  }
}

DataConverter.prototype.convertBuildingType = function (key, value, dataObject) {
  var buildingArray = []
  switch (key) {
    case 'amenity':
    case 'office':
    case 'leisure':
      buildingArray.push(value)
      break
  }

  if (buildingArray.length !== 0) {
    insertIntoDataObject('type', buildingArray, dataObject)
  }
}

DataConverter.prototype.convertOpeningHours = function (key, value, dataObject) {
  var openingHoursArray = []
  switch (key) {
    case 'opening_hours':
      openingHoursArray.push(value)
      break
  }

  if (openingHoursArray.length !== 0) {
    insertIntoDataObject('opening_hours', openingHoursArray, dataObject)
    dataObject['opening_hours'] = filterDuplicates(dataObject['opening_hours'])
  }
}

DataConverter.prototype.convertName = function (key, value, dataObject) {
  var nameArray = []
  switch (key) {
    case 'name':
      nameArray.push(value)
      break
  }

  if (nameArray.length !== 0) {
    insertIntoDataObject('name', nameArray, dataObject)
    dataObject['name'] = filterDuplicates(dataObject['name'])
  }
}

DataConverter.prototype.convertWebsite = function (key, value, dataObject) {
  var websiteArray = []
  switch (key) {
    case 'website_ad':
    case 'website':
      websiteArray.push(value)
      break
  }

  if (websiteArray.length !== 0) {
    insertIntoDataObject('website', websiteArray, dataObject)
    dataObject['website'] = filterDuplicates(dataObject['website'])
  }
}

DataConverter.prototype.convertEmail = function (key, value, dataObject) {
  var emailArray = []
  switch (key) {
    case 'email':
    case 'contact_email':
      emailArray.push(value)
      break
  }

  if (emailArray.length !== 0) {
    emailArray = filterDuplicates(emailArray)
    insertIntoDataObject('email', emailArray, dataObject)
    dataObject['email'] = filterDuplicates(dataObject['email'])
  }
}

DataConverter.prototype.convertAddress = function (key, value, dataObject) {
  var streetNameArray = []
  var houseNumberArray = []
  var districtArray = []
  var stateArray = []
  var municipalityArray = []
  var postcodeArray = []

  switch (key) {
    case 'street_name':
    case 'street_nam':
    case 'addr_street':
      streetNameArray.push(value)
      break
    case 'house_numb':
    case 'house_number':
    case 'addr_housenumber':
      houseNumberArray.push(value)
      break
    case 'addr_district':
      districtArray.push(value)
      break
    case 'addr_municipality':
      municipalityArray.push(value)
      break
    case 'addr_state':
      stateArray.push(value)
      break
    case 'addr_postcode':
    case 'postcode':
      postcodeArray.push(value)
      break
  }

  if (postcodeArray.length !== 0) {
    postcodeArray = filterDuplicates(postcodeArray)
    insertIntoDataObject('postcode', postcodeArray, dataObject)
    dataObject['postcode'] = filterDuplicates(dataObject['postcode'])
  }

  if (houseNumberArray.length !== 0) {
    houseNumberArray = filterDuplicates(houseNumberArray)
    insertIntoDataObject('house_number', houseNumberArray, dataObject)
    dataObject['house_number'] = filterDuplicates(dataObject['house_number'])
  }

  if (streetNameArray.length !== 0) {
    streetNameArray = filterDuplicates(streetNameArray)
    insertIntoDataObject('street_name', streetNameArray, dataObject)
    dataObject['street_name'] = filterDuplicates(dataObject['street_name'])
  }

  if (districtArray.length !== 0) {
    districtArray = filterDuplicates(districtArray)
    insertIntoDataObject('district', districtArray, dataObject)
    dataObject['district'] = filterDuplicates(dataObject['district'])
  }

  if (municipalityArray.length !== 0) {
    municipalityArray = filterDuplicates(municipalityArray)
    insertIntoDataObject('municipality', municipalityArray, dataObject)
    dataObject['municipality'] = filterDuplicates(dataObject['municipality'])
  }

  if (stateArray.length !== 0) {
    stateArray = filterDuplicates(stateArray)
    insertIntoDataObject('state', stateArray, dataObject)
    dataObject['state'] = filterDuplicates(dataObject['state'])
  }
}

DataConverter.prototype.deleteKey = function (dataObject, key) {
  if (dataObject.hasOwnProperty(key)) {
    delete dataObject[key]
  }
}

DataConverter.prototype.replaceMissingValuesWithNull = function (dataSchema, dataObject) {
  if (dataObject.hasOwnProperty(dataSchema)) {
    return dataObject[dataSchema]
  } else {
    return null
  }
}

DataConverter.prototype.convertNode = function (key, value, dataObject) {
  this.convertTelephone(key, value, dataObject)
  this.convertEmail(key, value, dataObject)
  this.convertName(key, value, dataObject)
  this.convertWebsite(key, value, dataObject)
  this.convertOpeningHours(key, value, dataObject)
  this.convertAddress(key, value, dataObject)
  this.convertBuildingType(key, value, dataObject)
}

DataConverter.prototype.convertWayToNode = function (dataObject) {
  Object.keys(dataObject.elements).map(function (newElements, element) {
    Object.keys(dataObject.elements[element]).map(function (key) {
      if (dataObject.elements[element][key] === 'way') {
        if (dataObject.elements[element].hasOwnProperty('nodes')) {
          var node = findNode(dataObject.elements[element].nodes.shift(), dataObject)
          if (typeof node !== 'undefined') {
            if (dataObject.elements[element].hasOwnProperty('tags')) {
              node['tags'] = dataObject.elements[element]['tags']
            }
          }
        }
      }
    })
  })
  dataObject.elements = deleteWayNodes(dataObject)
}

DataConverter.prototype.convertRelToWay = function (dataObject) {
  Object.keys(dataObject.elements).map(function (newElements, element) {
    Object.keys(dataObject.elements[element]).map(function (key) {
      if (dataObject.elements[element][key] === 'relation') {
        if (dataObject.elements[element].hasOwnProperty('members')) {
          var way = findWay(dataObject.elements[element].members.shift().ref, dataObject)
          if (typeof way !== 'undefined') {
            if (dataObject.elements[element].hasOwnProperty('tags')) {
              way['tags'] = dataObject.elements[element]['tags']
            }
          }
        }
      }
    })
  })
  dataObject.elements = deleteRefNodes(dataObject)
}

function findWay (ref, dataObject) {
  var way = undefined
  Object.keys(dataObject.elements).map(function (element) {
    Object.keys(dataObject.elements[element]).map(function (key) {
      if (key === 'id' && dataObject.elements[element][key] === ref) {
        way = dataObject.elements[element]
      }
    })
  })
  return way
}

function findNode (id, dataObject) {
  var node = undefined
  Object.keys(dataObject.elements).map(function (element) {
    Object.keys(dataObject.elements[element]).map(function (key) {
      if (key === 'id' && dataObject.elements[element][key] === id) {
        node = dataObject.elements[element]
      }
    })
  })
  return node
}

function deleteWayNodes (dataObject) {
  return dataObject.elements.filter(function (el) {
    return (el.type === 'node' && el.hasOwnProperty('tags'))
  })
}

function deleteRefNodes (dataObject) {
  return dataObject.elements.filter(function (el) {
    return (el.type !== 'relation')
  })
}

function insertIntoDataObject (key, values, dataObject) {
  if (dataObject.hasOwnProperty(key)) {
    dataObject[key] = dataObject[key].concat(values)
  } else {
    dataObject[key] = values
  }
}

function filterDuplicates (array) {
  return array.filter(function (element, index, arr) {
    return arr.indexOf(element) === index
  })
}

function resolveMultipleEntries (array, replaceString, replaceWith) {
  return array.reduce(function (newArr, value) {
    var multipleEntries = replaceall(replaceString, replaceWith, value)
    if (multipleEntries !== value) {
      return newArr.concat(multipleEntries.split(' '))
    }
    return newArr.concat(value)
  }, [])
}

module.exports = new DataConverter()
