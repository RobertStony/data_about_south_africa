var PostingList = require('./postinglist.js')

var idfCache = {}
var postingList = new PostingList()
var documentStorage = {}
var documentLenghts = {}

var TfIdf = function () {
  idfCache = {}
  postingList = new PostingList()
  documentStorage = {}
  documentLenghts = {}
}

TfIdf.prototype.addDocument = function (id, value) {
  var doc = getOrElse(value, [])
  postingList.addDocument(id, doc)
  documentStorage[id] = doc
}

TfIdf.prototype.calculateIDFs = function () {
  var documentNumber = Object.keys(documentStorage).length
  postingList.getTerms().forEach(function (term) {
    idfCache[term] = Math.log10(documentNumber / postingList.getDocumentFrequency(term))
  })
  var that = this
  Object.keys(documentStorage).forEach(function (id) {
    var tfidfs = documentStorage[id].map(function (term) {
      return that.calculateTFIDF(postingList.getTermFrequency(id, term), term)
    })
    documentLenghts[id] = that.calculateNorm(tfidfs)
  })
}

TfIdf.prototype.getPostingList = function () {
  return (JSON.parse(JSON.stringify(postingList.getPostingList())))
}

TfIdf.prototype.getIDFs = function () {
  return (JSON.parse(JSON.stringify(idfCache)))
}

TfIdf.prototype.calculateCosinusSimilarity = function (query, threshold) {
  var queryVector = getOrElse(query, [])
  var scores = {}
  var queryTermTfIdfs = this.calculateQueryTFIDFs(queryVector)
  var that = this

  queryVector.forEach(function (term) {
    var termPostingList = postingList.getPostingListTerm(term)
    Object.keys(termPostingList).forEach(function (id) {
      if (scores.hasOwnProperty(id)) {
        scores[id] += queryTermTfIdfs[term] * that.calculateTFIDF(postingList.getTermFrequency(id, term), term)
      } else {
        scores[id] = queryTermTfIdfs[term] * that.calculateTFIDF(postingList.getTermFrequency(id, term), term)
      }
    })
  })

  var queryTfIdfs = queryVector.map(function (term) {
    return queryTermTfIdfs[term]
  })

  var queryLenght = this.calculateNorm(queryTfIdfs)
  scores = Object.keys(scores).reduce(function (cosScore, id) {
    cosScore[id] = scores[id] / (queryLenght * documentLenghts[id])
    return cosScore
  }, {})

  var sortable = []
  for (var score in scores) {
    sortable.push([score, scores[score]])
  }
  sortable.sort(function (a, b) {
    if (a[1] < b[1]) {
      return 1
    }
    if (a[1] > b[1]) {
      return -1
    }
    return 0
  })

  return sortable.slice(0, threshold).map(function (score) {
    if (score > 1) {
      return 1
    } else if (score < -1) {
      return -1
    } else {
      return score
    }
  })
}

TfIdf.prototype.calculateQueryTFs = function (value) {
  var terms = getOrElse(value, [])
  terms = this.getOccurrences(terms)
  return Object.keys(terms).reduce(function (tfs, term) {
    tfs[term] = 1 + Math.log10(terms[term])
    return tfs
  }, {})
}

TfIdf.prototype.calculateQueryTFIDFs = function (value) {
  var terms = getOrElse(value, [])
  terms = this.calculateQueryTFs(terms)
  return Object.keys(terms).reduce(function (tfidfs, term) {
    tfidfs[term] = terms[term] * idfCache[term]
    return tfidfs
  }, {})
}

TfIdf.prototype.calculateTF = function (value) {
  return (1 + Math.log10(value))
}

TfIdf.prototype.calculateTFIDF = function (value, term) {
  return (this.calculateTF(value) * idfCache[term])
}

TfIdf.prototype.calculateDotProduct = function (value1, value2) {
  var vector1 = getOrElse(value1, [])
  var vector2 = getOrElse(value2, [])
  vector1 = this.calculateTFIDFs(vector1)
  vector2 = this.calculateTFIDFs(vector2)
  return Object.keys(vector1).reduce(function (sum, term) {
    return sum + (vector1[term] * getOrElse(vector2[term], 0.0))
  }, 0.0)
}

TfIdf.prototype.calculateNorm = function (value) {
  var vector = getOrElse(value, [])
  return Math.sqrt(Object.keys(vector).reduce(function (sum, term) {
    return sum + (vector[term] * vector[term])
  }, 0.0))
}

TfIdf.prototype.getNumberOfTerms = function (value) {
  var terms = getOrElse(value, {})
  return Object.keys(terms).reduce(function (length, term) {
    return length + terms[term]
  }, 0)
}

TfIdf.prototype.getOccurrences = function (value) {
  var terms = getOrElse(value, [])
  return terms.reduce(function (occurrences, term) {
    if (occurrences.hasOwnProperty(term)) {
      occurrences[term] += 1
    } else {
      occurrences[term] = 1
    }
    return occurrences
  }, {})
}

function getOrElse (value, elseValue) {
  if (typeof value === 'undefined' || value === null) {
    return elseValue
  } else {
    return value
  }
}

module.exports = TfIdf
