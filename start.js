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

const saveInstagramProfile = (profile, query) => {
  console.log('saving profile', profile)
  return new Promise(resolve => resolve(profile))
}


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
const dispatchActions = () => {
  return Promise.all([
    dispatch(createQuery({
      id: ID(),
      status: 0,
      batchId: getState().batch,
      payload: 'garyvee',
      'type': 'Influencer'
    }))
  ])
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
const updateResults = () => {
  return queryResultRef.once('value', snap => {
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
      uniqueEmailCount.set(finalEmailList.length)
      uniqueEmailRef.set({})
      finalEmailList.forEach(email => {
        let found = initialResults.filter(result => result.email === email)[0]
        uniqueEmailRef.push(found)
      })
    }
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
      updateResults()
    }, 100000)
    //restart every 10 minutes
    setInterval(() => process.exit(), 600000)
    setTimeout(() => resolve(), 2000)
  })
}
const start = () => {
  setup()
  .then(syncStoreWithDataFromFirebase)
  .then(() => dispatch(createBatch()))
  .then(startQueriesFromLastBatch)
  .catch(process.exit)
}




start()




