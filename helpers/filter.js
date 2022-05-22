import sales from "../api/sales.js"
import exchangeRates from '~/api/exchangeRates.js'

// DATA STRUCT:
// fetchData: {
//   page: 'Page index',
//   size: 'Items per page',
//   data: {
//     filter: {
//        each key will be custom column filter
//     },
//     search: 'Global search keyphrase',
//     sort: {
//        sortBy: ['Array of column names, ORDERED'],
//        sortDesc: ['Array of booleans, ORDERED']
//     }
//   }
// }

export default (fetchData) => {
  let apiData = [...sales.results]
  const meta = {
    emails: getAllUniqueEmailProviders(apiData),
    titles: getAllUniqueTitles(apiData),
    exchangeRates: exchangeRates,
    currencies: Object.keys(exchangeRates),
    countries: getAllCountries(apiData),
    genders: getAllGenders(apiData)
  }

  const pageIndex = fetchData.page
  const pageSize = fetchData.size
  const filterSortData = fetchData.data

  // strategy:
  // first we filter data, filter order does not matter so we go column by column
  // then we handle sort EXACTLY by sort order. Since multi-sort is on, custom algo
  //    is needed, effectively creating a grouping system
  // lastly, we handle global search keyphrase (ideas: regex? comma separated keywords?)
  if (filterSortData.filters) {
    Object.keys(filterSortData.filters).forEach(key => {
      // afaik there is no way key can be set by user so "eval" should be fine
      // secondly, even if key was set, I believe filter_ as prepend will not cause any system calls or similar
      // this really should be safe
      // alternative: just have an if statement per key to call functions
      const funcName = 'filter_' + key
      apiData = eval(funcName)(apiData, filterSortData.filters[key])
    })
  }
  if (hasSort(filterSortData.sort)) {
    for (let i = 0; i <= filterSortData.sort.sortBy.length - 1; i++) {
      // previous column is needed for multi-sort
      let previousColumn = null
      if (i !== 0) {
        previousColumn = filterSortData.sort.sortBy[i - 1]
      }
      apiData = sortBy(apiData, filterSortData.sort.sortBy[i], filterSortData.sort.sortDesc[i], previousColumn)
    }
  }
  if (filterSortData.search) {
    apiData = globalSearch(apiData, filterSortData.search)
  }
  const itemsCount = apiData.length
  const start = (pageIndex - 1) * pageSize
  const items = apiData.slice(start, start + pageSize)
  return {
    items,
    itemsCount,
    meta // holds data for selects (f.ex. list of used email providers or list of titles)
  }
}

function hasSort(sortData) {
  // sortDesc should always be filled by vuetify if sortBy is present, but I kept it as a sanity check
  if (sortData && sortData.sortBy?.length > 0 && sortData.sortDesc?.length > 0) {
    return true
  }
  return false
}

// this function is very stupid but gets the job done
function globalSearch(apiData, keyword) {
  keyword = keyword.toLowerCase()
  return apiData.filter(entry => {
    return entry.user.first_name.toLowerCase().includes(keyword) ||
      entry.user.last_name.toLowerCase().includes(keyword) ||
      entry.user.title.toLowerCase().includes(keyword) ||
      entry.email.toLowerCase().includes(keyword) ||
      entry.gender.toLowerCase().includes(keyword) ||
      entry.year.toString().toLowerCase().includes(keyword) ||
      entry.sales.toString().toLowerCase().includes(keyword) ||
      entry.currency.toLowerCase().includes(keyword) ||
      entry.country.toLowerCase().includes(keyword)
  })
}

// --------------------- SORT FUNCTIONS ---------------------

function sortBy(apiData, columnName, descending, previousColumn = null) {
  if (!previousColumn) {
    apiData.sort((a, b) => {
      return eval('sort_' + columnName)(a, b, descending)
    })
  } else {
    const unique = [...new Set(apiData.map(entry => entry[previousColumn]))]
    for (const el of unique) {
      // find the range in apiData where "el" value is
      const rangeOfPrevious = getAllIndexes(apiData, previousColumn, el)
      if (rangeOfPrevious.length < 2) continue
      const rangeStart = rangeOfPrevious[0]
      const rangeEnd = rangeOfPrevious[rangeOfPrevious.length - 1]
      let copyApiData = [...apiData]
      // remember the portion to sort
      let toSort = copyApiData.slice(rangeStart, rangeEnd + 1)
      // require at least 2 items to sort
      if (toSort.length < 2) continue
      toSort.sort((a, b) => {
        return eval('sort_' + columnName)(a, b, descending)
      })
      // remember everything after the portion to sort
      const end = copyApiData.slice(rangeEnd + 1, copyApiData.length)
      // remove the end and the section that was just sorted
      copyApiData.splice(rangeEnd, copyApiData.length - rangeEnd)
      copyApiData.splice(rangeStart, rangeEnd - rangeStart + 1)
      copyApiData.push(...toSort)
      copyApiData.push(...end)
      apiData = copyApiData
    }
  }
  return apiData
}

function sort_user(a, b, descending) {
  if (descending) {
    return a.user.last_name.localeCompare(b.user.last_name)
  }
  return b.user.last_name.localeCompare(a.user.last_name)
}

function sort_email(a, b, descending) {
  if (descending) {
    return a.email.localeCompare(b.email)
  }
  return b.email.localeCompare(a.email)
}

function sort_gender(a, b, descending) {
  if (descending) {
    return a.gender.localeCompare(b.gender)
  }
  return b.gender.localeCompare(a.gender)
}

function sort_year(a, b, descending) {
  if (descending) {
    return a.year < b.year
  }
  return b.year < a.year
}

// I have decided to assume the sales column is original currency sales and conversion is needed
function sort_sales(a, b, descending) {
  const rateA = exchangeRates[a.currency]
  const rateB = exchangeRates[b.currency]
  if (descending) {
    return (a.sales * rateA) < (b.sales * rateB)
  }
  return (b.sales * rateB) < (a.sales * rateA)
}

function sort_country(a, b, descending) {
  if (descending) {
    return a.country.localeCompare(b.country)
  }
  return b.country.localeCompare(a.country)
}

function sort_string(a, b, descending) {
  if (descending) {
    return a.localeCompare(b)
  }
  return b.localeCompare(a)
}
// --------------------- FILTER FUNCTIONS -------------------
// TODO: split filters into "category", "range" and "keyword" to make them more generic
//     to improve readability and maintainability

function filter_user(apiData, filter) {
  if (filter.selectedCategories?.length > 0) {
    apiData = apiData.filter(entry => {
      return filter.selectedCategories.includes(entry.user.title)
    })
  }
  if (filter.searchKeyword) {
    // I decided to use case insensitive search, could easily use case-sensitivity or even "" to signal literal search
    const searchKeyword = filter.searchKeyword.toLowerCase()
    apiData = apiData.filter(entry => {
      const firstName = entry.user.first_name.toLowerCase()
      const lastName = entry.user.last_name.toLowerCase()
      return firstName.includes(searchKeyword) || lastName.includes(searchKeyword)
    })
  }
  return apiData
}

function filter_email(apiData, filter) {
  if (filter.selectedCategories?.length > 0) {
    apiData = apiData.filter(entry => {
      return filter.selectedCategories.includes(entry.email.split('@')[1])
    })
  }
  if (filter.searchKeyword) {
    // I decided to use case insensitive search, could easily use case-sensitivity or even "" to signal literal search
    const searchKeyword = filter.searchKeyword.toLowerCase()
    apiData = apiData.filter(entry => {
      const email = entry.email.toLowerCase()
      return email.includes(searchKeyword)
    })
  }
  return apiData
}

function filter_sales(apiData, filter) {
  if (filter.selectedCategories?.length > 0) {
    apiData = apiData.filter(entry => {
      return filter.selectedCategories.includes(entry.currency)
    })
  }
  if (filter.range) {
    if (filter.range.from) {
      apiData = apiData.filter(entry => {
        return entry.sales * exchangeRates[entry.currency] > filter.range.from
      })   
    }
    if (filter.range.to) {
      apiData = apiData.filter(entry => {
        return entry.sales * exchangeRates[entry.currency] < filter.range.to
      })   
    }
  }
  return apiData
}

function filter_year(apiData, filter) {
  if (filter.range) {
    if (filter.range.from) {
      apiData = apiData.filter(entry => {
        return entry.year > filter.range.from
      })   
    }
    if (filter.range.to) {
      apiData = apiData.filter(entry => {
        return entry.year < filter.range.to
      })   
    }
  }
  return apiData
}

function filter_country(apiData, filter) {
  if (filter.selectedCategories?.length > 0) {
    apiData = apiData.filter(entry => {
      return filter.selectedCategories.includes(entry.country)
    })
  }
  if (filter.searchKeyword) {
    // I decided to use case insensitive search, could easily use case-sensitivity or even "" to signal literal search
    const searchKeyword = filter.searchKeyword.toLowerCase()
    apiData = apiData.filter(entry => {
      const country = entry.country.toLowerCase()
      return country.includes(searchKeyword)
    })
  }
  return apiData
}

function filter_gender(apiData, filter) {
  if (filter.selectedCategories?.length > 0) {
    apiData = apiData.filter(entry => {
      return filter.selectedCategories.includes(entry.gender)
    })
  }
  return apiData
}

// --------------------- HELPER FUNCTIONS -------------------

function getAllIndexes(arr, column, val) {
  var indexes = []
  for (let i = 0; i < arr.length; i++)
    if (arr[i][column]=== val)
      indexes.push(i)
  return indexes
}

function getAllUniqueEmailProviders(arr) {
  const unique = [...new Set(arr.map(entry => entry.email.split('@')[1]))]
  return unique.sort()
}

function getAllUniqueTitles(arr) {
  return [...new Set(arr.map(entry => entry.user.title))]
}

function getAllCountries(arr) {
  // why no Slovakia :(
  return [...new Set(arr.map(entry => entry.country))].sort()
}

function getAllGenders(arr) {
  return [...new Set(arr.map(entry => entry.gender))].sort()
}