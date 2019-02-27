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
  currentVersion,
  errorRef
} from './config'
import {ID, listify, eliminateDuplicates} from './utils'
import {
  getInitialPicsForHashtag,
  getPicsForHashtag,
  findUserFromPic,
  getUserProfile,
  getFollowersFromInstagram,
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
  followerSettingFound,
  placeholderUpdated,
  emailFound
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
  return getUserProfile(query.payload)
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
  return dispatch(getInitialStateForQuery(query))
          .then(state => {
            console.log('state is',state)
            switch(state) {
              case 'run_initial':
                  return getInfluencerId(query).then(() => runNormalForInfluencer(query)).catch(console.log)
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
    let location = null
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

const startProfileChain = profile => {
  profile = profile.user
  console.log('startProfileChain', profile)
  let locationForUser = null
  let engagement
  let rawEngagement
  let avgLikes
  let totalLikes = 0
  if(profile.lastTenPics !== null) {
    return Promise.all(Promise.map(profile.lastTenPics, pic => {
      return getPicDetails(profile.username, pic)
    }))
    .each(detail => {
      // console.log('got pic details', detail)
      // console.log('likes ?', detail.graphql.shortcode_media.edge_media_preview_like.count)
      totalLikes += +detail.graphql.shortcode_media.edge_media_preview_like.count
      return detail
    })
    .then(() => {
      avgLikes = +totalLikes/10
      engagement = Math.floor(avgLikes/+profile.followedBy.count * 100)
      rawEngagement = avgLikes/+profile.followedBy.count
      return getLocationForUser(profile.username)
    })
    .then(location => {
      return {location, engagement, rawEngagement}
    })
  }
  else {
    return getLocationForUser(profile.username).then(location => {
      return {location, engagement:0, rawEngagement:0}
    })
  }

}
const runNormalForInfluencer = (influencer={}) => {
  console.log('running normal', influencer)
  setInterval(() => runNormalForInfluencer(influencer), 20000)
  // console.log(`fetching ${getState().followersToFetch} followers`)
  getFollowersFromInstagram(influencer.payload, getState().influencerIds[influencer.payload], getState().followersToFetch, getState().placeholders[influencer.id])
  .then(({followers, end_cursor}) => {
    // console.log(end_cursor)
    return dispatch(placeholderUpdated(influencer, end_cursor))
    .then(() => Promise.map(followers, follower => getUserProfile(follower)))
  })
  .map(profile => Object.assign({}, {email: extractEmails(profile.biography), business_email: profile.business_email}))
  .filter(res => res.email !== null || res.business_email !== null)
  .map(({email, business_email}) => {
    return dispatch(createQueryResult(influencer, {email, business_email}))
  }).then(() => runNormalForInfluencer(influencer))
  .catch(err => runNormalForInfluencer(influencer))
}

const listenForFirebaseUpdates = () => {
  // consolse.log('call')
  return new Promise(resolve => {
    console.log('listening for firebase updates')
    return Promise.all([
      botRef.child('followersToFetch').on('child_changed', snap => {
        // console.log('followers setting changed')
        dispatch(followerSettingFound(snap.val())).then(() => console.log(getState().followersToFetch))
    }),
    botRef.on('child_changed', snap => {
        switch(snap.key) {
          case 'followersToFetch':
          // console.log('followers changed', snap.val())
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
  // console.log('listening for store updates')
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
  // console.log('syncing store with data...')
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
  console.log('starting queries from last batch')
  return new Promise(resolve => {
    // console.log('starting queries from last batch')
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
        console.log('yooo')
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
    // listenForStoreUpdates()
    // listenForFirebaseUpdates()
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
      payload: 'nutiva'
    },
    //   {
    //   type: 'Influencer', 
    //   id: ID(),
    //   batchId: ID(),
    //   payload: 'welleco'
    // },
    // {
    //   type: 'Influencer', 
    //   id: ID(),
    //   batchId: ID(),
    //   payload: 'vivolife'
    // },{
    //   type: 'Influencer', 
    //   id: ID(),
    //   batchId: ID(),
    //   payload: 'allynutrition'
    // },{
    //   type: 'Influencer', 
    //   id: ID(),
    //   batchId: ID(),
    //   payload: 'amazinggrass'
    // },{
    //   type: 'Influencer', 
    //   id: ID(),
    //   batchId: ID(),
    //   payload: 'livevegansmart'
    // },{
    //   type: 'Influencer', 
    //   id: ID(),
    //   batchId: ID(),
    //   payload: 'organifi'
    // },
    // {
    //   type: 'Influencer', 
    //   id: ID(),
    //   batchId: ID(),
    //   payload: 'sunwarriortribe'
    // },

    // {
    //   type: 'Influencer', 
    //   id: ID(),
    //   batchId: ID(),
    //   payload: 'toneitupnutrition'
    // },{
    //   type: 'Influencer', 
    //   id: ID(),
    //   batchId: ID(),
    //   payload: 'yoursuperfoods'
    // },{
    //   type: 'Influencer', 
    //   id: ID(),
    //   batchId: ID(),
    //   payload: 'getyuve'
    // },{
    //   type: 'Influencer', 
    //   id: ID(),
    //   batchId: ID(),
    //   payload: 'arbonne'
    // },{
    //   type: 'Influencer', 
    //   id: ID(),
    //   batchId: ID(),
    //   payload: 'ripplefoods'
    // },
    // {
    //   type: 'Influencer', 
    //   id: ID(),
    //   batchId: ID(),
    //   payload: 'sproutliving'
    // }

  ]
  return Promise.all(Promise.map(queries, query => dispatch(createQuery(query))))
}
const updateResults = () => {
  // console.log('updating results')
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
    // console.log(`parsing results ${index/unique.length}`)
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
          let usernameList = []
          let rootObj = snap.val()
          let queryIds = Object.keys(rootObj)
          let initialResults = []
          queryIds.map(queryId => {
            let resultsForQueryId = rootObj[queryId]
            let resultIds = Object.keys(resultsForQueryId)
            resultIds.map(resultId => {
              let resultObjForQueryId = Object.assign({}, resultsForQueryId[resultId], {query: queries[queryId] ? queries[queryId].payload: null})
              emailList.push(resultObjForQueryId.email)
              usernameList.push(resultObjForQueryId.username)
              initialResults.push(resultObjForQueryId)
            })
          })
          let finalEmailList = eliminateDuplicates(emailList)
          resolve(
            {
              uniqueEmails:finalEmailList, 
              all:initialResults,
              uniqueUsernames: eliminateDuplicates(usernameList)
            })
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
  syncStoreWithDataFromFirebase()
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
  return setup()
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


// startInfluencerChain({
//       type: 'Influencer', 
//       id: ID(),
//       batchId: ID(),
//       payload: 'nutiva'
//     })
const extractEmails = text => {
  return text.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]+)/gi);
};

const startFollowerChain = (query, userId, count, placeholder) => {
  console.log('running', query)
  // placeholder = store.getState().placeholders[query.id] ? store.getState().placeholders[query.id]: null
    getFollowersFromInstagram(query, userId, count, placeholder)
    .then(({followers, end_cursor}) => {
      // console.log(followers)
      return Promise.all(Promise.map(followers, follower => {
        return getUserProfile(follower).then(profile => {
          if(profile) {
            return {email:extractEmails(profile.biography), business_email: profile.business_email}
          }
        })
        .then(email => store.dispatch(createQueryResult(query, Object.assign({}, query, {email, business_email}))))
        })).then(() => store.dispatch(placeholderUpdated(query, end_cursor)))
      })
      .then(() => {
        return startFollowerChain(query, userId, count, store.getState().placeholders[query.id])
      })
      .catch(err => setTimeout(() => startFollowerChain(query, userId, count, placeholder, 20000)))
}


const josh = () => {
  let usernames = [
  'nutiva', 
  'welleco', 
  'vivolife', 
  'allynutrition', 
  'amazinggrass', 
  'livevegansmart',
  'organifi',
  'sunwarriortribe',
  'gardenolife',
  'philisophielove',
  'toneitupnutrition',
  'yoursuperfoods',
  'getyuve',
  'arbonne',
  'ripplefoods',
  'sproutliving'
  ]
  let emails = []
  let totalFollowers = 0
  let seen = 0
  return Promise.all(Promise.map(usernames, (username, index) => getUserProfile(username).then(res => {
    seen+=1 
    console.log(seen)
    let {biography, edge_followed_by} = res
    // console.log(edge_followed_by.count)
    totalFollowers+= +edge_followed_by.count
    if(seen === 16) {
      console.log(totalFollowers)
    }
    return Promise.resolve(totalFollowers)
    
    // console.log(followed_by_edges)
    // console.log(extractEmails(biography)[0])
  })))
  .catch(console.log)
}

// startInitialQueries().then(start).catch(console.log)
// queryResultRef.remove()
// .then(dispatchQueries)
// .then(() => (Promise.resolve(Object.keys(store.getState().queries))))
// .then(queryIds => {
//   return Promise.map(queryIds, queryId => {
//     return getUserProfile(store.getState().queries[queryId].payload)
//   })
// }).then(profiles => profiles.map(profile => {
//   // console.log(profile)
//   let queryId = Object.keys(store.getState().queries).map(k => store.getState().queries[k]).filter(query => query.payload === profile.username)[0].id
//   return Promise.resolve(store.dispatch(updateQuery(queryId, store.getState().queries[queryId], {instagramId: profile.id})))
// }))
// .then(() => {
//   console.log('got here')
//   let queriesToStart = Object.keys(store.getState().queries).map(k => store.getState().queries[k])
//   let promises = Promise.map(queriesToStart, query => startFollowerChain(query, query.instagramId, 12, store.getState().placeholders[query.id]))
//   console.log(promises)
//   return Promise.all(promises)
//   // return Promise.all(Promise.map(Object.keys(store.getState().queries)), queryId => {
//   //   let query = store.getState().queries[queryId]
//   //   console.log('got query', query)
//   //   // return startFollowerChain(store.getState().queries[queryId], store.getState().queries[queryId].instagramUsername, 12, store.getState().placeholders[queryId])
//   // })
// })

// .then(() => {
//   console.log(store.getState().queries)
// })
// .map(({query, userId, count, placeholder}) => startFollowerChain(query, userId, count, placeholder))
//track it



//josh()
// let placeholder = null
// let count = 12
// let userId = '372147986'
// let query = {
//   type: 'Influencer', 
//   id: ID(),
//   batchId: ID(),
//   payload:'welleco'
// }

 const createNewFollower = (instagramUsername, 
    follows, 
    queryId, 
    pageNumber) => {
    return {
      instagramUsername,
      follows,
      queryId,
      pageNumber,
      type: 'Follower'
    }
  }

// let promises = []
// queryResultRef.once('value', snap => {
//   if(snap.exists()) {
//     let emailList = []
//     let usernameList = []
//     let rootObj = snap.val()
//     let queryIds = Object.keys(rootObj)
//     let initialResults = []
//     queryIds.map(queryId => {
//       let resultsForQueryId = rootObj[queryId]
//       let resultIds = Object.keys(resultsForQueryId)
//       resultIds.map(resultId => {
//         let resultObjForQueryId = Object.assign({}, resultsForQueryId[resultId], {query: queryIds[queryId] ? queries[queryId].payload: null})
//         promises.push(getUserProfile(resultObjForQueryId.instagramUsername))
//       })
//     })
//   }
// })
// .then(() => {
//   setInterval(() => console.log(promises.filter(p => p.isFulfilled() === true)) / promises.length, 2000)
// })

// getUserProfile('nutiva')
// .then(console.log)
// startFollowerChain(query, userId, count, placeholder)




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


// getUnique()
// .then(res => {
//   let usernames = res.uniqueUsernames.slice(0,100)
//   let worked = 0
//   let failed = 0
//   let called = 0
//   console.log(usernames.length)
//   let promises = usernames.map(username => {
//     return getUserProfile(username).then(res => {
//       console.log(res)
//       if(res === 'worked') {
//         worked += 1
//       }
//       console.log(`worked ${worked} vs ${failed}`)
//     })
//     .catch(err => {
//       failed +=1
//     })
//   })
//   Promise.all(promises).then(() => {
//     console.log('finished', worked+failed)
//   })
// })

// startFollowerChain(query, 12, placeholder)

getUserProfile('jkol36')
.then(res => {
  const extractEmails = text => {
    return text.length > 0 ? text.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]+)/gi)[0]: null
  }
  console.log(extractEmails(res.biography))
})
.then(console.log)

let userId = 1189159040
let count = 120
let placeholder = null
getFollowersFromInstagram(userId, count, placeholder)
.then(({end_cursor, followers}) => {
  return Promise.map(followers, follower => {
    return Promise.delay(getUserProfile(follower).then(res => store.dispatch(emailFound(res.business_email))), 10000)
  })
})

















