import firebase from 'firebase'
import {
  queryRef, 
  lastBatchRef,
  suggestionResultRef,
  suggestionRef,
  placeholderRef,
  influencerIdRef,
  botRef,
  defaultFollowersToFetch,
  defaultPicsToFetch,
  uniqueEmailRef,
  uniqueEmailCount,
  queryResultRef,
  currentVersion
} from './config'
import {ID, listify, eliminateDuplicates} from './utils'
import {
  getInitialPicsForHashtag,
  getPicsForHashtag,
  findUserFromPic,
  getUserProfile,
  getFollowers,
  getInfluencerProfile,
  getSuggesstions,
  getPicDetails
} from './helpers'
import {
  parseProfile
} from './parser'
import {
  newProfileParsed,
  getInitialStateForQuery,
  initialInfluencerId,
  createQueryResult,
  updateQuery, 
  createQuery,
  lastBatchIdFetched,
  initialQueriesFetched,
  initialPlaceholdersFetched,
  initialInfluencerIdsFetched,
  createBatch,
  emptyStore,
  picsSettingFound,
  followerSettingFound
} from './actionCreators'
import {
  QUERY_ADDED,
} from './reducers'
import {store} from './store'

const {getState, dispatch} = store



const startPicChain = (pics, query) => {
  return Promise.mapSeries(pics, (pic) => {
    return findUserFromPic(pic)
  })
  .map(instagramUser => getUserProfile(instagramUser.username))
  .map(parseProfile)
  .map((profile) => {
    dispatch(newProfileParsed(query))
    return profile
  })
  .filter(profile => profile.email != undefined)
  .each((profile) => {
    return dispatch(createQueryResult(query, profile))
  })
  .delay(400)
  .return(query)

}

const runInitialForHashtag = (hashtag) => {
  return getInitialPicsForHashtag(hashtag)
          .then((pics) => startPicChain(pics, hashtag))
          .return(hashtag)
}
const runNormalForHashtag = (hashtag) => {
  return getPicsForHashtag(hashtag, getState().placeholders[hashtag.id], getState().picsToFetch)
          .then((pics) => startPicChain(pics, hashtag))
          .then(() => runNormalForHashtag(hashtag))
}


const getInfluencerId = (query) => {
  return getInfluencerProfile(query.payload)
          .then(profile => {
            return dispatch(initialInfluencerId(profile.id, query))
          })
          .return(query)
}


const startHashtagChain = (query) => {
  return dispatch(getInitialStateForQuery(query))
          .then(state => {
            switch(state) {
              case 'run_initial':
                return runInitialForHashtag(query)
                        .then(() => runNormalForHashtag(query))
              case 'run_normal':
                return runNormalForHashtag(query)
              case 'query_finished':
                return dispatch(updateQuery(query.id, {status:3}))
            }
          })
}

const startInfluencerChain = (query) => {
  console.log('starting influener', query)
  return dispatch(getInitialStateForQuery(query))
          .then(state => {
            console.log(state)
            switch(state) {
              case 'run_initial':
                  return getInfluencerId(query).then(() => runNormalForInfluencer(query))
              case 'run_normal':
                  return runNormalForInfluencer(query)
              case 'query_finished':
                return dispatch(updateQuery(query.id, {status:3}))
              }
          })
}

const getLocationForUser = user => {
  return getUserProfile(user)
  .then(parseProfile)
  .then(profile => {
    if(profile.lastPicCode !== null) {
      return getPicDetails(profile.username, profile.lastPicCode)
    }
  })
  .then(picDetails => {
    let location
    try {
      location = picDetails.graphql.shortcode_media.location
    }
    catch(err) {
      location = null
    }
    return location
  })
  .catch(console.log)
} 

const runNormalForInfluencer = (influencer={}) => {
  console.log(`fetching ${getState().followersToFetch} followers`)
  getFollowers(influencer, getState().influencerIds[influencer.payload], getState().followersToFetch, getState().placeholders[influencer.id])
  .map(getUserProfile)
  .map(parseProfile)
  .map((profile) => dispatch(newProfileParsed(influencer)).return(profile))
  .map((profile) => {
    return profile
  })
  .filter(profile => profile.email != undefined)
  .map(profile => {
    return getLocationForUser(profile.username)
    .then(location => {
      return Object.assign({}, profile, {location})
    })
  })
  .each((profile) => {
    return dispatch(createQueryResult(influencer, profile))
  })
  .then(() => runNormalForInfluencer(influencer))
  .catch(err => {
    switch(err.status) {
      case 404:
        return runNormalForInfluencer(influencer)
      case 429:
        console.log('got 429 err')
        process.exit()
    }
  })
}

const listenForFirebaseUpdates = () => {
  console.log('call')
  return new Promise(resolve => {
    console.log('listening for firebase updates')
    return Promise.all([
      botRef.child('followersToFetch').on('child_changed', snap => {
        console.log('followers setting changed')
        dispatch(followerSettingFound(snap.val())).then(() => console.log(getState().followersToFetch))
    }),
    botRef.on('child_changed', snap => {
        switch(snap.key) {
          case 'followersToFetch':
          console.log('followers changed', snap.val())
            dispatch(followerSettingFound(snap.val())).then(() => console.log(getState().followersToFetch))
            return
          case 'picsToFetch':
             dispatch(picsSettingFound(snap.val())).then(()=> console.log(getState().picsToFetch))
             return
        }
      })
    ]).then(resolve)
  })

}
const listenForStoreUpdates = () => {
  console.log('listening for store updates')
  return new Promise(resolve => {
    resolve(store.subscribe(() => {
    let {lastAction} = getState()
    switch(lastAction.type) {
      case QUERY_ADDED:
        dispatch(updateQuery(lastAction.query.id, {batchId: getState().batch}))
        if(lastAction.query.type === 'Influencer') {
          return startInfluencerChain(lastAction.query)
        }
        else if(lastAction.query.type === 'Hashtag') {
          return startHashtagChain(lastAction.query)
        }
        return
      }
    }))
  })
}

const syncStoreWithDataFromFirebase = () => {
  console.log('syncing store with data...')
  return Promise.all([
    lastBatchRef.once('value', snap => {
      if(snap.exists()) {
        return dispatch(lastBatchIdFetched(snap.val()))
      }
    }),
    queryRef.once('value', snap => {
      if(snap.exists()) {
        return dispatch(initialQueriesFetched(snap.val()))
      }
    }),
    placeholderRef.once('value', snap => {
      if(snap.exists()) {
        return dispatch(initialPlaceholdersFetched(snap.val()))
      }
    }),
    influencerIdRef.once('value', snap => {
      console.log('influencerids', snap.val())
      if(snap.exists()) {
        return dispatch(initialInfluencerIdsFetched(snap.val()))
      }
    }),
    botRef.child('picsToFetch').once('value', snap => {
      if(snap.exists()) {
        return dispatch(picsSettingFound(snap.val()))
      }
      else {
        return dispatch(picsSettingFound(defaultPicsToFetch))
      }
    }),
    botRef.child('followersToFetch').once('value', snap => {
      if(snap.exists()) {
        return dispatch(followerSettingFound(snap.val()))
      }
      else {
        return dispatch(followerSettingFound(defaultFollowersToFetch))
      }
    })

  ])
}
const startQueriesFromLastBatch = () => {
  return new Promise(resolve => {
    console.log('starting queries from last batch')
    if(!getState().lastBatchId) {
      resolve([])
    }
    console.log(getState())
    let queriesFromLastBatch = listify(getState().initialQueries)
                                .filter(query => query.status !== 3)
    console.log(queriesFromLastBatch.length)
    Promise.all(Promise.map(queriesFromLastBatch, (query) => {
      return dispatch(updateQuery(query.id, {status:1, batchId: getState().batch}))
      .then(() => {
        switch(query.type) {
         case 'Hashtag':
           return startHashtagChain(query)
         case 'Influencer':
           return startInfluencerChain(query)
        default:
          return
        }
      })
    })).then(resolve)

  })
}

const setup = () => {
  return new Promise(resolve => {
    listenForStoreUpdates()
    listenForFirebaseUpdates()
    let now = Date.now()
    botRef.child('lastRestart').set({lastRetart: now})
    setInterval(() => {
      let upTime = Date.now() - now
      let minutesUp = new Date(upTime).getMinutes()
      botRef.child('UpTime').set({minutes:minutesUp})
      emptyStore()
      updateResults().then(() => start())
    }, 100000)
    //restart every 10 minutes
    setInterval(() => process.exit(), 600000)
    setTimeout(() => resolve(), 2000)
  })
}


const dispatchQueries = () => {
  let queries = [
    {
      type: 'Influencer', 
      id: ID(),
      batchId: ID(),
      payload: 'toneitupnutrition'
    },
    {
      type: 'Influencer', 
      id: ID(),
      batchId: ID(),
      payload: 'vega_team'
    },
    {
      type: 'Influencer', 
      id: ID(),
      batchId: ID(),
      payload: 'green_blender'
    },
    {
      type: 'Influencer', 
      id: ID(),
      batchId: ID(),
      payload: 'alohamoment'
    },
    {
      type: 'Influencer', 
      id: ID(),
      batchId: ID(),
      payload: 'yoursuperfoods'
    },
    {
      type: 'Influencer', 
      id: ID(),
      batchId: ID(),
      payload: 'humnutrition'
    },
    {
      type: 'Influencer', 
      id: ID(),
      batchId: ID(),
      payload: 'gardenoflife'
    },
    {
      type: 'Influencer', 
      id: ID(),
      batchId: ID(),
      payload: 'sunwarriortribe'
    },
    {
      type: 'Influencer', 
      id: ID(),
      batchId: ID(),
      payload: 'toneitupnutrition'
    },
    {
      type: 'Influencer', 
      id: ID(),
      batchId: ID(),
      payload: '22daysnutrition'
    },
    {
      type: 'Influencer', 
      id: ID(),
      batchId: ID(),
      payload: 'toneitupnutrition'
    },
    {
      type: 'Influencer', 
      id: ID(),
      batchId: ID(),
      payload: 'getyuve'
    },
    {
      type: 'Influencer', 
      id: ID(),
      batchId: ID(),
      payload: 'organifi'
    },
    {
      type: 'Influencer', 
      id: ID(),
      batchId: ID(),
      payload: 'nutiva'
    },
    {
      type: 'Influencer', 
      id: ID(),
      batchId: ID(),
      payload: 'philosophielove'
    },
    {
      type: 'Influencer', 
      id: ID(),
      batchId: ID(),
      payload: 'amazinggrass'
    },
    {
      type: 'Influencer', 
      id: ID(),
      batchId: ID(),
      payload: 'drinkorgain'
    },
    {
      type: 'Influencer', 
      id: ID(),
      batchId: ID(),
      payload: 'utopicnutrition'
    },
    {
      type: 'Influencer', 
      id: ID(),
      batchId: ID(),
      payload: 'kachavatribe'
    },
    {
      type: 'Influencer', 
      id: ID(),
      batchId: ID(),
      payload: 'sproutliving'
    },
    {
      type: 'Influencer', 
      id: ID(),
      batchId: ID(),
      payload: 'plantfusion'
    },
    {
      type: 'Influencer', 
      id: ID(),
      batchId: ID(),
      payload: 'rawfusionprotein'
    }
  ]
  return Promise.all(Promise.map(queries, query => dispatch(createQuery(query))))
}
const updateResults = () => {
  console.log('updating results')
  return getUnique().then((data) => {
    return new Promise(resolve => {
      uniqueEmailCount.set(data.unique.length, () => {
        setTimeout(() => updateResults(), 100000)
        resolve(data.unique.length)
      })

    })
  })
}
const parseResults = (results) => {
  let {all, unique} = results
  return Promise.all(Promise.map(unique, (item, index) => {
    console.log(`parsing results ${index/unique.length}`)
    return new Promise(resolve => {
      let found = all.filter(obj => obj.email === item)[0]
      resolve(found)
    })
  })) 
}
const saveResult = (result) => {
  return uniqueEmailRef.push(result)

}
const getUnique = () => {
  return new Promise(resolve => {
    queryRef.once('value', s => {
      let queries = s.val()
      queryResultRef.once('value', snap => {
        if(snap.exists()) {
          let emailList = []
          let rootObj = snap.val()
          let queryIds = Object.keys(rootObj)
          let initialResults = []
          queryIds.map(queryId => {
            let resultsForQueryId = rootObj[queryId]
            let resultIds = Object.keys(resultsForQueryId)
            resultIds.map(resultId => {
              let resultObjForQueryId = Object.assign({}, resultsForQueryId[resultId], {query: queries[queryId] ? queries[queryId].payload: null})
              emailList.push(resultObjForQueryId.email)
              initialResults.push(resultObjForQueryId)
            })
          })
          let finalEmailList = eliminateDuplicates(emailList)
          resolve({unique:finalEmailList, all:initialResults})
        }
      })
    })
  })
}

const exportToCsv = () => {
  let data = []
  uniqueEmailRef.remove()
  .then(() => {
      return getUnique().then(parseResults).map(saveResult).then(() => {
        uniqueEmailRef.orderByKey().once('value', snap => {
          Object.keys(snap.val()).map((k, index, arr) => {
          console.log(`percentage parsed ${index/arr.length}`)
          let location
          let bio
          let name
          try {
            location = snap.val()[k].location.name
          }
          catch(err) {
            location = null
          }
          try {
            bio = snap.val()[k].bio.replace(/(\r\n|\n|\r)/gm,"").trim()
          }
          catch(err) {
            bio = null
          }
          try {
            name = snap.val()[k].name.replace(/(\r\n|\n|\r)/gm,"").trim()
          }
          catch(err) {
            name = null
          }
          let obj = Object.assign({}, snap.val()[k], {name}, {location}, {bio})
          data.push(obj)
        })
        var csvExport = require('csv-export')
        var fs = require('fs')
        csvExport.export(data, (buffer) => {
              fs.writeFileSync(`./${currentVersion}.zip`, buffer)
        })
      })
    })
  })
}

const start = () => {
  setup()
  .then(syncStoreWithDataFromFirebase)
  .then(() => dispatch(createBatch()))
  .then(startQueriesFromLastBatch)
  .catch(err => {
    console.log('got error ', err.status)
    switch(err.status) {
      case 429:
        return
      default:
        process.exit()
    }
  })
}

//run this first
const startInitialQueries = () => {
  setup()
  .then(dispatch(createBatch()))
  .then(dispatchQueries)
  .catch(err => {
    switch(err.status) {
      case 429:
        return
      default:
        process.exit()
    }
  })
}

const syncQueriesWithFirebase = () => {
  return setup()
  .then(dispatch(createBatch()))
  .then(dispatchQueries)
  .catch(console.log)
}

const startOver = () => {
  require('./cleanup.js')
}

// queryResultRef.once('value', s => {
//   let queryIds = Object.keys(s.val())
//   Promise.map(queryIds, queryId => {
//     let query = s.val()[queryId]
//     let resultsForquery = Object.keys(query).map(k => k)
//     return Promise.all(Promise.map(resultsForquery, resultId => {
//       return getLocationForUser(query[resultId].username)
//       .then(location => {
//         return queryResultRef.child(queryId).child(resultId).update({location})
//       })
//     }))
//     .then(() => console.log('should be finished'))
//     .catch(console.log)
//   })
// })


start()














