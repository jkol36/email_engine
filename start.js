import {
  queryRef, 
  lastBatchRef,
  suggestionResultRef,
  suggestionRef
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
  createNewBatch
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
  console.log('starting pic chain', pics)
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
  console.log('runnign normal for hashtag')
  console.log('page', getState().placeholders[hashtag.id])

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
  console.log('starting hashtag chain', query)
  return dispatch(getInitialStateForQuery(query))
          .then(state => {
            switch(state) {
              case 'run_initial':
                return runInitialForHashtag(query)
                        .then(() => runNormalForHashtag(query))
              default:
                return runNormalForHashtag(query)
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
                if(getState().influencerIds[query.payload] === undefined) {
                  return getInfluencerId(query).then(() => runNormalForInfluencer(query))
                }
                else {
                  return runNormalForInfluencer(query).catch(console.log)
                }
            }
          })
} 

const runNormalForInfluencer = (influencer={}) => {
  console.log('running normal for influencer', influencer)
  getFollowers(influencer, getState().influencerIds[influencer.payload], 10, getState().placeholders[influencer.id])
  .mapSeries(getUserProfile)
  .mapSeries(parseProfile)
  .mapSeries((profile) => dispatch(newProfileParsed(influencer)).return(profile))
  .mapSeries((profile) => {
    console.log('profile ids', profile.id)
    return profile
  })
  .filter(profile => profile.email != undefined)
  .then(profiles => {
    console.log('profiles with emails', profiles)
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

const startAllUnstartedQueries = () => {
  let unstarted = getState().queries.filter(obj => obj.status === 0)
  dispatch()
}
const setup = () => {
  console.log('setting up')
  return Promise.all([
    startAllUnstartedQueries(),
    startAllUnfinishedQueries()
  ])
  //start all queries that have not been started and all queries that haven't finished
  queryRef.orderByChild('status').equalTo(0).once('value', snap => {
    if(snap.exists()) {
      let queries = Object.keys(snap.val()).map(k => snap.val()[k])
      return Promise.mapSeries(queries, (query) => {
        return dispatch(createQuery(query))
      })
    }
  })
 

}
const startUnfinishedQueries = () => {
  //starts all unfinished queries that are stored in the store
  console.log('starting unfinished queries')
  return new Promise(resolve => resolve('startedUnfinishedQueries'))
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
    console.log('last action', lastAction)
    switch(lastAction.type) {
      case QUERY_ADDED:
        dispatch(updateQuery(lastAction.query.id, {batchId: getState().batch}))
        if(lastAction.query.type === 'Influencer') {
          return startInfluencerChain(lastAction.query)
        }
        else if(lastAction.query.type === 'Hashtag') {
          console.log('hashtag added')
          return startHashtagChain(lastAction.query)
        }
        return
      }
    }))
  })
}
const dispatchActions = () => {
  dispatch(createQuery({
    id: ID(),
    status: 0,
    payload: 'garyvee',
    'type': 'Influencer'
  }))
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
    })
  ])
}
const startQueriesFromLastBatch = () => {
  console.log('starting queries from last batch')
  return new Promise(resolve => {
    let queriesFromLastBatch = listify(getState().initialQueries)
                                .filter(query => query.batchId === getState().lastBatchId.id)
                                .filter(query => query.status != 3)
    Promise.all(Promise.map(queriesFromLastBatch, (query) => {
      return dispatch(updateQuery(query.id, {status:1}))
        switch(query.type) {
         case 'Hashtag':
           startHashtagChain(query)
           break
         case 'Influencer':
           startInfluencerChain(query)
           break

        }
    })).then(resolve)

  })
}


syncStoreWithDataFromFirebase()
.then(startQueriesFromLastBatch)
.then(() => Promise.all([listenForStoreUpdates(), listenForFirebaseUpdates()]))
.catch(console.log)
// .then(startQueriesFromLastBatch)
// .then(() => dispatch(createNewBatch()))
// .then(listenForStoreUpdates)
// .then(dispatchActions)
// startQueriesFromLastBatch()
// listenForStoreUpdates()
// .then(dispatchActions())






