var DatabaseUtility = require('./database_utility.js')
var CosineSimilarity = require('./cosine_similarity/tf-idf')
var Preprocessor = require('./preprocessor/preprocessor.js')

// run()

function run (db) {
  var model = {
    id: 'ignore',
    latitude: 'blank',
    longitude: 'blank',
    name: 'text',
    type: 'text',
    telephone: 'telephone',
    telephone2: 'telephone',
    telephone3: 'telephone',
    telephone4: 'telephone',
    telephone5: 'telephone',
    mobilephone: 'telephone',
    mobilephone2: 'telephone',
    mobilephone3: 'telephone',
    mobilephone4: 'telephone',
    mobilephone5: 'telephone',
    fax: 'telephone',
    fax2: 'telephone',
    fax3: 'telephone',
    fax4: 'telephone',
    fax5: 'telephone',
    website: 'text',
    website2: 'text',
    website3: 'text',
    website4: 'text',
    website5: 'text',
    email: 'text',
    email2: 'text',
    email3: 'text',
    email4: 'text',
    email5: 'text',
    opening_hours: 'ignore',
    postcode: 'text',
    house_number: 'text',
    street_name: 'text',
    region: 'clean',
    district: 'clean',
    city: 'text',
    address: 'text',
    address_additional: 'text',
    geo_json: 'ignore',
    service: 'ignore'
  }

  var preprocessor = new Preprocessor()

  var parserMethods = {
    'text': preprocessor.text,
    'telephone': preprocessor.text,
    'ignore': preprocessor.ignore,
    'blank': preprocessor.blank,
    'clean': preprocessor.clean
  }

  // var db = new DatabaseUtility(model, 'data_about_ghana.sqlite')

  var cosineSimilarity = new CosineSimilarity()

  // var data = {}

  prepareDatabase()

  function prepareDatabase () {
    db.readRows(resolveDuplicateEntities)
  }

  function resolveDuplicateEntities (err, rows) {
    var data = preProcessData(rows)
    data = addDocumentVector(data)

    Object.keys(data).forEach(function (id) {
      cosineSimilarity.addDocument(id, data[id]['documentVector'])
    })

    cosineSimilarity.calculateIDFs()

    var possibleMatches = findPossibleMatches(data, 25)

    data = postProcessData(data)

    var updateEntities = validateMatches(possibleMatches, data)

    replaceMatches(updateEntities)
  }

  function preProcessData (rows) {
    var data = {}
    rows.forEach(function (entity) {
      data[entity.id] = Object.keys(entity).reduce(function (processedEntity, key) {
        if (model.hasOwnProperty(key)) {
          if (entity[key] !== null) {
            processedEntity[key] = parserMethods[model[key]](entity[key])
          }
        }
        return processedEntity
      }, {})
    })
    return data
  }

  function addDocumentVector (data) {
    Object.keys(data).forEach(function (entityId) {
      var documentVector = Object.keys(data[entityId]).reduce(function (documentVector, key) {
        return documentVector.concat(data[entityId][key])
      }, [])
      data[entityId]['documentVector'] = documentVector
    })
    return data
  }

  function findPossibleMatches (data, threshold) {
    var possibleMatches = []
    Object.keys(data).forEach(function (firstEntityId) {
      var matches = cosineSimilarity.calculateCosinusSimilarity(data[firstEntityId]['documentVector'], 3)
      matches.forEach(function (match) {
        var secondEntityId = match[0]
        var score = match[1]

        if (secondEntityId !== firstEntityId && testIfContainValue(possibleMatches, [secondEntityId, firstEntityId]) !== true) {
          score = Math.acos(score) * (180 / Math.PI)
          if (score === 0 || score <= threshold) {
            console.log(firstEntityId + ' match --> ' + secondEntityId + ' - ' + score + '°')
            possibleMatches.push([firstEntityId, secondEntityId, score])
          }
        }
      })
    })
    return possibleMatches
  }

  function testIfContainValue (array, value) {
    return array.some(function (element) {
      return (element[0] === value[0] && element[1] === value[1])
    })
  }

  function postProcessData (data) {
    Object.keys(data).forEach(function (entityId) {
      delete data[entityId]['documentVector']
    })
    return data
  }

  function validateMatches (possibleMatches, data) {
    return possibleMatches.reduce(function (updateEntities, match) {
      var firstEntityId = match[0]
      var secondEntityId = match[1]

      updateEntities.push(mergeEntities(firstEntityId, secondEntityId, data))

      return updateEntities
    }, []).filter(function (match) {
      if (match.hasOwnProperty('ignore')) {
        console.log('Ignore match: ' +
          match['id_entity1'] + ' <--> ' +
          match['id_entity2'] + '\n\t' +
          JSON.stringify(data[match['id_entity1']]) + '\n\t' +
          JSON.stringify(data[match['id_entity2']]) + '\n')
        return false
      } else {
        return true
      }
    })
  }

  function mergeEntities (firstEntityId, secondEntityId, data) {
    var firstEntity = data[firstEntityId]
    var secondEntity = data[secondEntityId]

    var mergeSchema = findImbalancedValues(firstEntity, secondEntity, 1, {})
    mergeSchema = findImbalancedValues(secondEntity, firstEntity, 2, mergeSchema)

    mergeSchema['id_entity1'] = firstEntityId
    mergeSchema['id_entity2'] = secondEntityId

    mergeSameValues(firstEntity, secondEntity, mergeSchema)

    return mergeSchema
  }

  function findImbalancedValues (firstEntity, secondEntity, firstEntityId, dataObject) {
    return Object.keys(firstEntity).reduce(function (dataObject, key) {
      if (!secondEntity.hasOwnProperty(key)) {
        dataObject[key] = firstEntityId
      }
      return dataObject
    }, dataObject)
  }

  function mergeSameValues (firstEntity, secondEntity, dataObject) {
    var isTrueMatch = true
    Object.keys(firstEntity).forEach(function (key) {
      if (!dataObject.hasOwnProperty(key)) {
        if (isTrueMatch === true) {
          var result = []
          switch (key) {
            case 'name':
              result = getValueIfSubset(firstEntity[key], secondEntity[key])
              dataObject[key] = result[0]
              isTrueMatch = result[1]
              break
            case 'type':
              dataObject[key] = getValueWithMoreInformation(firstEntity[key], secondEntity[key])
              break
            case 'telephone':
            case 'telephone2':
            case 'telephone3':
            case 'telephone4':
            case 'telephone5':
              dataObject[key] = getBestTelephoneNumber(firstEntity[key], secondEntity[key])
              break
            case 'mobilephone':
            case 'mobilephone2':
            case 'mobilephone3':
            case 'mobilephone4':
            case 'mobilephone5':
              dataObject[key] = getBestTelephoneNumber(firstEntity[key], secondEntity[key])
              break
            case 'fax':
            case 'fax2':
            case 'fax3':
            case 'fax4':
            case 'fax5':
              dataObject[key] = getBestTelephoneNumber(firstEntity[key], secondEntity[key])
              break
            case 'website':
            case 'website2':
            case 'website3':
            case 'website4':
            case 'website5':
              dataObject[key] = getValueWithMoreInformation(firstEntity[key], secondEntity[key])
              break
            case 'email':
            case 'email2':
            case 'email3':
            case 'email4':
            case 'email5':
              dataObject[key] = getValueWithMoreInformation(firstEntity[key], secondEntity[key])
              break
            case 'service':
              dataObject[key] = getValueWithMoreInformation(firstEntity[key], secondEntity[key])
              break
            case 'postcode':
            case 'street_name':
            case 'region':
            case 'district':
            case 'city':
            case 'address':
            case 'address_additional':
              result = getValueIfSubset(firstEntity[key], secondEntity[key])
              dataObject[key] = result[0]
              isTrueMatch = result[1]
              break
            default:
              break
          }
        } else {
          dataObject['ignore'] = true
        }
      }
    })
  }

  function getValueWithMoreInformation (value1, value2) {
    var value1String = value1.reduce(function (string, element) {
      return string + element
    }, '')

    var value2String = value2.reduce(function (string, element) {
      return string + element
    }, '')

    if (value1String.length > value2String.length) {
      return 1
    } else if (value1String.length < value2String.length) {
      return 2
    } else {
      return 1
    }
  }

  function getValueIfSubset (value1, value2) {
    var conditionIsFullSubset = true
    var idWithMoreInformation = getValueWithMoreInformation(value1, value2)
    if (idWithMoreInformation === 1) {
      conditionIsFullSubset = testIfSubset(value1, value2)
    } else {
      conditionIsFullSubset = testIfSubset(value2, value1)
    }
    return [idWithMoreInformation, conditionIsFullSubset]
  }

  function testIfSubset (fullSet, subset) {
    var fullSetAsString = fullSet.reduce(function (string, setElement) {
      return string + ' ' + setElement
    }, '')

    var results = subset.map(function (element) {
      return fullSetAsString.includes(element)
    })

    var conditionIsFullSubset = true

    results.forEach(function (element) {
      if (element === false) {
        conditionIsFullSubset = false
      }
    })
    return conditionIsFullSubset
  }

  function getBestTelephoneNumber (value1, value2) {
    var value1String = value1.reduce(function (string, element) {
      return string + element
    }, '')

    var value2String = value2.reduce(function (string, element) {
      return string + element
    }, '')

    var percentageValue = 0
    var entityId = 0
    if (getValueWithMoreInformation(value1, value2) === 1) {
      percentageValue = (value2String.length * 100) / value1String.length
      entityId = 1
    } else {
      percentageValue = (value1String.length * 100) / value2String.length
      entityId = 2
    }

    // id 1 "telephone":["23","302","968692","968693"], id 2 "telephone":["0302","968692"],"telephone2":["0302","968693"]
    if (percentageValue > 20) {
      if (entityId === 1) {
        return 2
      } else {
        return 1
      }
    } else {
      return entityId
    }
  }

  function replaceMatches (updateEntities) {
    db.readRows(function (err, rows) {
      var data = rows.reduce(function (newData, element) {
        newData[element.id] = element
        return newData
      }, {})

      try {
        updateEntities.forEach(function (matchSchema) {
          var firstEntityId = matchSchema['id_entity1']
          var secondEntityId = matchSchema['id_entity2']

          var dataObject = Object.keys(matchSchema).reduce(function (newDataObject, key) {
            if (matchSchema[key] === 1) {
              newDataObject[key] = data[firstEntityId][key]
            } else if (matchSchema[key] === 2) {
              newDataObject[key] = data[secondEntityId][key]
            }
            return newDataObject
          }, {})

          dataObject = insertMissingValues(data[firstEntityId], dataObject)
          dataObject = insertMissingValues(data[secondEntityId], dataObject)

          console.log('replace entities:\n' +
            JSON.stringify(data[firstEntityId]) + '\n\n' +
            JSON.stringify(data[secondEntityId]) + '\n\n' +
            JSON.stringify(dataObject) + '\n')

          db.insertRow(dataObject)
          db.deleteRow(firstEntityId)
          db.deleteRow(secondEntityId)
        })
        console.log(updateEntities.length + ' entities replaced.')
        if (updateEntities.length > 0) {
          run(db)
        }
      } catch (ex) {
        console.log(ex, data[firstEntityId], data[secondEntityId])
      }
    })
  }

  function insertMissingValues (entity, dataObject) {
    return Object.keys(entity).reduce(function (newDataObject, key) {
      if (!newDataObject.hasOwnProperty(key) && entity[key] !== null) {
        newDataObject[key] = entity[key]
      }
      return newDataObject
    }, dataObject)
  }
}

module.exports.run = run
