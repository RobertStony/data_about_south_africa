var whacko = require('whacko')
var request = require('request')

function run (db, callbackScraper) {
  var counter = 0
  var policy = 1000
  var numberOfPages = 0

  fetchPage('http://www.graduates.com/Schools/South_Africa', getStates)

  function fetchPage (url, callback) {
    request(url, function (error, response, body) {
      if (error) {
        console.log('Error requesting page: ' + error)
        return
      }
      callback(body)
    })
  }

  function getStates (body) {
    var $ = whacko.load(body)

    var states = []

    $('.col-lg-12').children('ul').eq(1).children('li').each(function () {
      states.push('http://www.graduates.com/' + $(this).children('a').attr('href'))
    })

    $ = undefined

    getCities(states[0])
    states.forEach(function (link) {
      getCities(link)
    })
  }

  function getCities (link) {
    fetchPage(link, function (body) {
      var $ = whacko.load(body)

      var cities = []

      $('.col-lg-12').children('ul').eq(1).children('li').each(function () {
        cities.push('http://www.graduates.com/' + $(this).children('a').attr('href'))
      })

      $ = undefined

      cities.forEach(function (link) {
        counter += policy
        setTimeout(function getPage () {
          console.log('graduates.com - Get Page: ' + link)
          getSchools(link)
        }, counter)
      })
    })
  }

  function getSchools (link) {
    fetchPage(link, function (body) {
      var $ = whacko.load(body)

      var schools = []

      $('ul').children('li').each(function () {
        if (String($(this).children('a').attr('href')).includes('/ss/')) {
          schools.push('http://www.graduates.com/' + $(this).children('a').attr('href'))
        }
      })

      numberOfPages += schools.length

      $ = undefined

      schools.forEach(function (link) {
        counter += policy
        setTimeout(function getPage () {
          console.log('graduates.com - Get Page: ' + link)
          getSchoolInfo(link)
        }, counter)
      })
    })
  }

  function getSchoolInfo (link) {
    fetchPage(link, function (body) {
      var $ = whacko.load(body)

      var informationObject = {
        'name': '',
        'type': 'school',
        'region': '',
        'city': '',
        'address': '',
        'postcode': '',
        'telephone': '',
        'website': ''
      }

      var infoPanel = $('.panel-body.text-muted').children('div')
      informationObject.name = infoPanel.eq(0).children('span').filter(function (i, el) {
        return $(this).attr('itemprop') === 'name'
      }).text()

      informationObject.address = infoPanel.eq(1).children('div').children('span').filter(function (i, el) {
        return $(this).attr('itemprop') === 'streetAddress'
      }).text()

      informationObject.city = infoPanel.eq(1).children('div').children('span').filter(function (i, el) {
        return $(this).attr('itemprop') === 'addressLocality'
      }).text()

      informationObject.region = infoPanel.eq(1).children('div').children('span').filter(function (i, el) {
        return $(this).attr('itemprop') === 'addressRegion'
      }).text()

      informationObject.postcode = infoPanel.eq(1).children('div').children('span').filter(function (i, el) {
        return $(this).attr('itemprop') === 'postalCode'
      }).text()

      informationObject.telephone = infoPanel.eq(1).children('div').children('span').filter(function (i, el) {
        return $(this).attr('itemprop') === 'telephone'
      }).text()

      informationObject.website = infoPanel.eq(1).children('div').children('a').filter(function (i, el) {
        return $(this).attr('itemprop') === 'url'
      }).attr('href')

      $ = undefined

      var dataObject = Object.keys(informationObject).reduce(function (dataObject, key) {
        if (typeof informationObject[key] === 'undefined' || informationObject[key].trim() === '') {
          return dataObject
        } else {
          dataObject[key] = informationObject[key].trim()
          return dataObject
        }
      }, {})

      db.insertRow(dataObject)

      numberOfPages -= 1
      if (numberOfPages === 0) {
        if (typeof callbackScraper === 'function') {
          callbackScraper()
        }
      }
    })
  }
}

module.exports.run = run
