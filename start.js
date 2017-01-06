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
  queryResultRef
} from './config'
import {ID, listify, eliminateDuplicates} from './utils'
import {
  getInitialPicsForHashtag,
  getPicsForHashtag,
  findUserFromPic,
  getUserProfile,
  getFollowers,
  getInfluencerProfile,
  getSuggesstions
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

const runNormalForInfluencer = (influencer={}) => {
  getFollowers(influencer, getState().influencerIds[influencer.payload], getState().followersToFetch, getState().placeholders[influencer.id])
  .map(getUserProfile)
  .map(parseProfile)
  .map((profile) => dispatch(newProfileParsed(influencer)).return(profile))
  .map((profile) => {
    return profile
  })
  .filter(profile => profile.email != undefined)
  .then(profiles => {
    return profiles
  })
  .each((profile) => {
    return dispatch(createQueryResult(influencer, profile))
  })
  .then(() => runNormalForInfluencer(influencer))
  .catch(err => {
    switch(err.code) {
      case 404:
        return runNormalForInfluencer(influencer)
      default:
        console.log(err)
        process.exit()
    }
  })
}

const listenForFirebaseUpdates = () => {
  console.log('listening for firebase updates...')
  return new Promise(resolve => {
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
    let queriesFromLastBatch = listify(getState().initialQueries)
                                .filter(query => query.batchId === getState().lastBatchId.id)
                                .filter(query => query.status != 3)
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
const getUnique = () => {
  return new Promise(resolve => {
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
            let resultObjForQueryId = Object.assign({}, resultsForQueryId[resultId], {queryId})
            emailList.push(resultObjForQueryId.email)
            initialResults.push(resultObjForQueryId)
          })
        })
        let finalEmailList = eliminateDuplicates(emailList)
        resolve({unique:finalEmailList, all:initialResults})
      }
    })
  })
}

const updateResults = () => {
  console.log('updating results')
  getUnique().then((data) => {
    return new Promise(resolve => {
      uniqueEmailCount.set(data.unique.length, () => {
        setTimeout(() => updateResults(), 100000)
        resolve(data.unique.length)
      })

    })
  })
}
const setup = () => {
  let now = Date.now()
  botRef.child('lastRestart').set({lastRetart: now})
  setInterval(() => {
      let upTime = Date.now() - now
      let minutesUp = new Date(upTime).getMinutes()
      botRef.child('UpTime').set({minutes:minutesUp})
      dispatch(emptyStore()).then(() => console.log('emptied store'))
    }, 20000)
  return Promise.all([
    listenForFirebaseUpdates(),
    listenForStoreUpdates(),
    updateResults()
  ])
}
const start = () => {
  setup()
  .then(syncStoreWithDataFromFirebase)
  .then(() => dispatch(createBatch()))
  .then(startQueriesFromLastBatch)
  .catch(process.exit)
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
const exportToCsv = () => {
  getUnique().then(parseResults).map(saveResult).then(() => console.log('done'))
  var csvExport = require('csv-export')
  var fs = require('fs')
  let data = []
  uniqueEmailRef.orderByKey().once('value', snap => {
    Object.keys(snap.val()).map((k, index, arr) => {
      console.log(`percentage parsed ${index/arr.length}`)
      let obj = snap.val()[k]
      data.push(obj)
    })
    csvExport.export(data, (buffer) => {
      fs.writeFileSync('./veganMarket.zip', buffer)
    })
  })
}

start()


