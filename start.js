import {
  queryRef, 
  lastBatchRef,
  suggestionResultRef,
  suggestionRef,
  placeholderRef,
  influencerIdRef,
  botRef
} from './config'
import {ID, listify} from './utils'
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
  emptyStore
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
  .mapSeries(instagramUser => getUserProfile(instagramUser.username))
  .mapSeries(parseProfile)
  .mapSeries((profile) => {
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
  return getPicsForHashtag(hashtag, getState().placeholders[hashtag.id], 10)
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
  getFollowers(influencer, getState().influencerIds[influencer.payload], 10, getState().placeholders[influencer.id])
  .mapSeries(getUserProfile)
  .mapSeries(parseProfile)
  .mapSeries((profile) => dispatch(newProfileParsed(influencer)).return(profile))
  .mapSeries((profile) => {
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
      case 1:
        console.log('should restart this query')
      default:
        console.log(err)
    }
  })
}

const listenForFirebaseUpdates = () => {
  console.log('listening for firebase updates')
  suggestionRef.on('child_added', snap => {
    switch(snap.val().status) {
      case 0:
        getSuggesstions(snap.val().query, snap.val().queryType)
        .then(suggestions => {
          suggestionResultRef.child(`${snap.val().postRef}`).set(suggestions)
        })
    }
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
      payload: 'whatveganseat',
      'type': 'Hashtag'
    })),
    dispatch(createQuery({
      id: ID(),
      status: 0,
      batchId: getState().batch,
      payload: 'bestofvegan',
      'type': 'Influencer'
    })),
    dispatch(createQuery({
      id: ID(),
      status: 0,
      batchId: getState().batch,
      payload: 'vegansofig',
      'type': 'Hashtag'
    })),
    dispatch(createQuery({
      id: ID(),
      status: 0,
      batchId: getState().batch,
      payload: 'rawfoodshare',
      'type': 'Hashtag'
    })),
    dispatch(createQuery({
      id: ID(),
      status: 0,
      batchId: getState().batch,
      payload: 'veganfitness',
      'type': 'Hashtag'
    })),
    dispatch(createQuery({
      id: ID(),
      status: 0,
      batchId: getState().batch,
      payload: 'plantpower',
      'type': 'Hashtag'
    }))
  ])
}
const syncStoreWithDataFromFirebase = () => {
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

const start = () => {
  let now = Date.now()
  botRef.child('lastRestart').set({lastRetart: now})
  setInterval(() => {
    let upTime = Date.now() - now
    let minutesUp = new Date(upTime).getMinutes()
    botRef.child('UpTime').set({minutes:minutesUp})
  }, 10000)
  setInterval(() => dispatch(emptyStore()), 10000)
  //restart every 10 minutes
  setInterval(() => process.exit(), 600000)
  syncStoreWithDataFromFirebase()
  .then(() => dispatch(createBatch()))
  .then(startQueriesFromLastBatch)
  .then(() => Promise.all([listenForStoreUpdates(), listenForFirebaseUpdates()]))
  .catch(console.log)
}

start()




