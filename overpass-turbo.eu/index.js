var request = require('request')
var osmtogeojson = require('osmtogeojson')
var replaceall = require('replaceall')
var async = require('async')
var dataconverter = require('./data_converter.js')

var timeoutInSec = 60
var countries = ['South Africa']

var queryAttributes = {
  amenity: ['hospital', 'police', 'fire_station', 'school', 'university', 'post_office', 'courthouse', 'library'],
  office: ['government'],
  leisure: ['playground']
}

function run (db, callbackScraper) {
  function runQueries () {
    var queryQueue = {}
    countries.forEach(function (country) {
      Object.keys(queryAttributes).forEach(function (queryKey, index) {
        queryAttributes[queryKey].forEach(function (queryAttribute) {
          queryQueue[createQuery(timeoutInSec, country, queryKey, queryAttribute)] = [country, queryAttribute]
        })
      })
    })
    async.eachSeries(Object.keys(queryQueue), function (query, callback) {
      function signalingEndOfProcessing () {
        callback()
      }
      console.log('Overpass - Fetching page: ' + queryQueue[query])
      fetchPage('http://api.openstreetmap.fr/oapi/interpreter', query, queryQueue[query], prepareRawData, signalingEndOfProcessing)
    }, function (error) {
      console.log('Overpass - Ghana scraper has finished.')
      if (error) {
        console.log('Overpass - Error processing data: ' + error)
      } else {
        if (typeof callbackScraper === 'function') {
          callbackScraper()
        }
        console.log('Overpass - Done with all queries.')
      }
    })
  }

  function createQuery (timeout, country, queryKey, queryAttribute) {
    var query = `[out:json][timeout:'${timeout}'];` +
      `area["name"="${country}"]->.boundaryarea;` +
      '(' +
      `node(area.boundaryarea)["${queryKey}"="${queryAttribute}"];` +
      `rel(area.boundaryarea)["${queryKey}"="${queryAttribute}"];` +
      `way(area.boundaryarea)["${queryKey}"="${queryAttribute}"];` +
      ');' +
      'out body;>;out skel qt;'
    return query
  }

  function fetchPage (url, query, queryArgs, callback, signalingEndFunc) {
    request.post({'url': url, timeout: (timeoutInSec * 1000), form: {'data': query}}, function (error, response, body) {
      if (error || response.statusCode !== 200) {
        console.log('Overpass - Error requesting page: ' + error + ' response code: ' +
          response.statusCode + ' body: ' + body + 'query: ' + query)
        return
      }
      callback(body, queryArgs, signalingEndFunc)
    })
  }

  function prepareRawData (body, queryArgs, signalingEndFunc) {
    console.log('Overpass - Prepare raw data.')
    var data = manipulateData(body, queryArgs)
    insertDataIntoDatabase(data, signalingEndFunc)
  }

  function manipulateData (body, args) {
    var data = JSON.parse(body)
    data['geo_json'] = osmtogeojson(data)
    dataconverter.convertRelToWay(data)
    dataconverter.convertWayToNode(data)
    console.log('Overpass - ' + data.elements.length + ' objects')
    Object.keys(data.elements).map(function (element) {
      dataconverter.deleteKey(data.elements[element], 'type')
      Object.keys(data.elements[element]).map(function (key) {
        if (key === 'tags') {
          Object.keys(data.elements[element].tags).map(function (tagKey) {
            var newKey = replaceall(':', '_', (tagKey).toLowerCase())
            dataconverter.convertNode(newKey, data.elements[element].tags[tagKey], data.elements[element])
          })
        }
      })
      dataconverter.deleteKey(data.elements[element], 'tags')
    })

    data['country'] = args[0]
    data['building_type'] = args[1]
    return data
  }

  function insertDataIntoDatabase (data, signalingEndFunc) {
    Object.keys(data.elements).map(function (element) {
      var databaseObject = createDatabaseObject(data, element)
      db.insertRow(databaseObject)
    })
    console.log('Overpass - Insert data into database.')
    setTimeout(function () {
      signalingEndFunc()
    }, 5000)
  }

  function createDatabaseObject (data, element) {
    var databaseObject = {}
    Object.keys(data.elements[element]).map(function (key) {
      var value = data.elements[element][key]
      if (Array.isArray(value)) {
        databaseObject[key] = value.shift()
        value.map(function (element, index) {
          databaseObject[key + (index + 2)] = element
        })
      } else if (key === 'lat') {
        databaseObject['latitude'] = data.elements[element][key]
      } else if (key === 'lon') {
        databaseObject['longitude'] = data.elements[element][key]
      } else {
        databaseObject[key] = data.elements[element][key]
      }
    })

    databaseObject['type'] = data['building_type']
    databaseObject['country'] = data['country']
    return databaseObject
  }

  runQueries()
}

module.exports.run = run
