var postingList = {}

var PostingList = function () {
  postingList = {}
}

PostingList.prototype.addDocument = function (id, value) {
  var doc = getOrElse(value, [])
  doc.forEach(function (term) {
    if (postingList.hasOwnProperty(term)) {
      if (postingList[term].hasOwnProperty(id)) {
        postingList[term][id] += 1
      } else {
        postingList[term][id] = 1
      }
    } else {
      postingList[term] = {}
      postingList[term][id] = 1
    }
  })
}

PostingList.prototype.getTermFrequency = function (id, term) {
  return postingList[term][id]
}

PostingList.prototype.getPostingListTerm = function (term) {
  return (JSON.parse(JSON.stringify(postingList[term])))
}

PostingList.prototype.getDocumentFrequency = function (term) {
  return Object.keys(postingList[term]).length
}

PostingList.prototype.getTerms = function () {
  return Object.keys(postingList)
}

PostingList.prototype.getPostingList = function () {
  return (JSON.parse(JSON.stringify(postingList)))
}

function getOrElse (value, elseValue) {
  if (typeof value === 'undefined' || value === null) {
    return elseValue
  } else {
    return value
  }
}

module.exports = PostingList
