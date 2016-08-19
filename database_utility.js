var sqlite3 = require('sqlite3').verbose()

var db = null
var model = null
var insertStatement = null

var DatabaseUtility = function (dataModel, dataName) {
  db = new sqlite3.Database(dataName)
  model = dataModel
  insertStatement = createInsertStatement()
}

DatabaseUtility.prototype.deleteDatabase = function (callback) {
  db.run('DROP TABLE IF EXISTS data', function () {
    callback()
  })
}

DatabaseUtility.prototype.createDatabase = function (callback) {
  var sqlStatement = 'CREATE TABLE IF NOT EXISTS data ('

  Object.keys(model).map(function (key, index) {
    sqlStatement += key + ' ' + model[key] + ', '
  })

  sqlStatement = sqlStatement.substring(0, sqlStatement.length - 2) + ')'

  db.run(sqlStatement, function () {
    callback()
  })
}

DatabaseUtility.prototype.readRows = function (callback) {
  db.all('SELECT * FROM data', callback)
}

DatabaseUtility.prototype.insertRow = function (databaseObject) {
  var statement = db.prepare(insertStatement)

  var rowObject = []

  delete databaseObject['id']

  Object.keys(model).forEach(function (key) {
    rowObject.push(replaceMissingValuesWithNull(key, databaseObject))
  })

  statement.run(rowObject)
  statement.finalize()
}

DatabaseUtility.prototype.getRow = function (id, callback) {
  db.get('SELECT * FROM data WHERE id = ' + id, callback)
}

DatabaseUtility.prototype.deleteRow = function (id, callback) {
  db.get('DELETE FROM data WHERE id = ' + id, callback)
}

DatabaseUtility.prototype.serialize = function (callback) {
  db.serialize(callback)
}

function createInsertStatement () {
  var sqlStatement = 'INSERT INTO data VALUES ('

  Object.keys(model).forEach(function (key, index) {
    sqlStatement += '?, '
  })

  return sqlStatement.substring(0, sqlStatement.length - 2) + ');'
}

function replaceMissingValuesWithNull (dataSchema, dataObject) {
  if (dataObject.hasOwnProperty(dataSchema)) {
    return dataObject[dataSchema]
  } else {
    return null
  }
}

module.exports = DatabaseUtility
