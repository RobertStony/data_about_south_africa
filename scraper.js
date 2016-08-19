var DatabaseUtility = require('./database_utility.js')
var osmGhana = require('./overpass-turbo.eu/index.js')
var graduates = require('./graduates.com/index.js')
var entityResolution = require('./entity_resolution.js')

var model = {
  id: 'INTEGER PRIMARY KEY AUTOINCREMENT',
  latitude: 'TEXT',
  longitude: 'TEXT',
  name: 'TEXT',
  type: 'TEXT',
  telephone: 'TEXT',
  telephone2: 'TEXT',
  telephone3: 'TEXT',
  telephone4: 'TEXT',
  telephone5: 'TEXT',
  mobilephone: 'TEXT',
  mobilephone2: 'TEXT',
  mobilephone3: 'TEXT',
  mobilephone4: 'TEXT',
  mobilephone5: 'TEXT',
  fax: 'TEXT',
  fax2: 'TEXT',
  fax3: 'TEXT',
  fax4: 'TEXT',
  fax5: 'TEXT',
  website: 'TEXT',
  website2: 'TEXT',
  website3: 'TEXT',
  website4: 'TEXT',
  website5: 'TEXT',
  email: 'TEXT',
  email2: 'TEXT',
  email3: 'TEXT',
  email4: 'TEXT',
  email5: 'TEXT',
  opening_hours: 'TEXT',
  service: 'TEXT',
  postcode: 'TEXT',
  house_number: 'TEXT',
  street_name: 'TEXT',
  region: 'TEXT',
  district: 'TEXT',
  city: 'TEXT',
  address: 'TEXT',
  address_additional: 'TEXT',
  geo_json: 'BLOB'
}

var db = new DatabaseUtility(model, 'data.sqlite')

db.deleteDatabase(prepareDatabase)

function prepareDatabase () {
  db.createDatabase(runScrapers)
}

function runScrapers () {
  osmGhana.run(db, runGraduates)
}

function runGraduates () {
  // graduates.run(db)
}

function runEntityResolution () {
  entityResolution.run(db)
}
