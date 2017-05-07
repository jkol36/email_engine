import {ID} from './utils'
import mongoose from 'mongoose'
import { 
  followerCount, 
  pictureCount,
  queryRef,
  botRef,
  queryResultRef,
  influencerIdRef,
  emailRef,
  placeholderRef,
  profilesParsedRef,
  lastBatchRef
} from './config';
import { statusText } from './utils'
import { getFollowers, getPostsForHashtag } from './helpers';
import {
  INITIAL_QUERIES_FETCHED,
  QUERY_ADDED,
  QUERY_UPDATED,
  QUERY_RESULT_ADDED,
  QUERY_RESULT_UPDATED,
  EMAIL_FOUND,
  INITIAL_INFLUENCER_ID,
  PLACEHOLDER_UPDATED,
  NEW_PROFILE_PARSED,
  NEW_BATCH_CREATED,
  LAST_BATCH_ID_FETCHED,
  EMPTY_STORE,
  FOLLOWER_SETTING_FOUND,
  PIC_SETTING_FOUND,
  EMAIL_CONTACTED,
  INITIAL_EMAIL_CONTACTED,
  COUNT_CHANGED
} from './reducers';


export const emailContacted = email => dispatch => {
  return new Promise((resolve, reject) => {
    mongoose
      .model('emailsContacted')
      .create({email, timestamp:Date.now()})
      .then(res => res.save())
      .then(() => {
        dispatch({
          type: EMAIL_CONTACTED,
          email
        })
        return resolve(email)
      })
      .catch(err => reject(err))
  })
}

export const initialSentEmails = emailArray => dispatch => {
  return new Promise(resolve => {
    emailArray.forEach(email => {
      dispatch({
        type: INITIAL_EMAIL_CONTACTED,
        email: email._doc
      })
    })
    resolve()
  })
}
export const followerSettingFound = (followerSetting) => dispatch => {
  return new Promise(resolve => {
    dispatch({
      type: FOLLOWER_SETTING_FOUND,
      value: followerSetting
    })
    resolve(followerSetting)
  })
}
export const picsSettingFound = (picsSetting) => dispatch => {
  return new Promise(resolve => {
    dispatch({
      type: PIC_SETTING_FOUND,
      value: picsSetting
    })
    resolve(picsSetting)
  })
}  
export const emptyStore = () => (dispatch, getState) => {
  return new Promise(resolve => {
    dispatch({
      type: EMPTY_STORE
    })
    resolve()
  })
}
export const initialPlaceholdersFetched = (placeholders) => dispatch => {
  let queryIds = Object.keys(placeholders)
  return Promise.mapSeries(queryIds, (queryId) => {
    return new Promise(resolve => {
       dispatch({
        type: PLACEHOLDER_UPDATED,
        placeholder: placeholders[queryId],
        queryId
      })
      resolve()
    })
  })
}
export const initialInfluencerIdsFetched = (influencerIds) => dispatch => {
  return new Promise(resolve => {
    let influencerNames = Object.keys(influencerIds)
    return Promise.mapSeries(influencerNames, (name) => {
      let query = {
        payload: name
      }
      dispatch({
        type: INITIAL_INFLUENCER_ID,
        id: influencerIds[name],
        query
      })
      resolve()
    })
  })
}
export const createBatch = () => dispatch => {
  return new Promise(resolve => {
    let newBatchId = ID()
    lastBatchRef.set({id:newBatchId}, () => {
      dispatch({
        type: NEW_BATCH_CREATED,
        newBatchId
      })
      resolve(newBatchId)
    })
  })
}
export const initialQueriesFetched = queries => dispatch => {
  return new Promise(resolve => {
    dispatch({
      type: INITIAL_QUERIES_FETCHED,
      queries
    })
  })
}
export const lastBatchIdFetched = (batchId) => dispatch => {
  console.log('got last batch id', batchId)
  return new Promise(resolve => {
    dispatch({
      type: LAST_BATCH_ID_FETCHED,
      batchId
    })
  })
}
export const placeholderUpdated = (query, placeholder) => dispatch => {
  return new Promise((resolve, reject) => {
    placeholderRef.child(query.id).set(placeholder, () => {
      dispatch({
        type: PLACEHOLDER_UPDATED,
        placeholder,
        queryId: query.id
      })
      resolve(placeholder)
    })

  })
}
export const initialInfluencerId = (influencerId, query) => (dispatch) => {
  return new Promise((resolve, reject) => {
    influencerIdRef.child(query.payload).set(influencerId, () => {
      dispatch({
        type: INITIAL_INFLUENCER_ID,
        id: influencerId,
        query
      })
      resolve(influencerId)
    })
  })
}
export const createQuery = (query={}) => (dispatch) => {
  return new Promise((resolve, reject) => {
    queryRef.child(query.id).set(query, () => {
      dispatch({
        type: QUERY_ADDED,
        query
      })
      resolve(query.id)
    })
  })
}
export const startQuery = (id) => (dispatch) => {
  return new Promise(resolve => {
    queryRef.child(id).update({
      statusText: 'running',
      status: 1
    }, () => {
      dispatch({
        type: QUERY_UPDATED,
        query: {status:1, statusText:'running'}
      })
    })
  })
}
export const stopQuery = (id) => (dispatch) => {
  return new Promise(resolve => {
    queryRef.child(id).update({
      statusText: 'stopped',
      status: 2
    })
  })
}

export const updateQuery = (id, query={}) => (dispatch) => {
  console.log(`updating query ${id} ${query.payload}`) 
  return new Promise((resolve, reject) => {
    queryRef.child(id).update(query, () => {
      dispatch({
        type: QUERY_UPDATED,
        id,
        query
      })
      resolve(query)
    })
  })
}


export const createQueryResult = (query, queryResult={}) => (dispatch) => {
  console.log(`creating query result ${queryResult}`)
  return new Promise((resolve, reject) => {
    botRef.child('totalQueryResults').transaction(currentValue => currentValue +1)
    queryResultRef.child(query.id).push(queryResult, () => {
      dispatch({
        type: QUERY_RESULT_ADDED,
        queryResult,
        queryId: query.id
      })
      resolve(query.id)
    })
  })
}



export const updateQueryResult = (queryId=123, queryResult={}) => (dispatch) => {
  return new Promise((resolve, reject) => {
    queryResultRef.child(queryId).update(queryResult, () => {
      dispatch({
        type: QUERY_RESULT_UPDATED,
        queryResult,
        queryId
      })
      resolve(queryResult)
    })
  })
}


//generalize queries
//query can be of type influencer or type hashtag
export const getInitialStateForQuery = (query={}) => (dispatch, getState) => {
  return new Promise((resolve, reject) => {
    if(getState().placeholders[query.id] != undefined) {
      resolve('run_normal')
    }
    else if(getState().placeholders[query.id] === null) {
      resolve('query finished')
    }
    else {
      resolve('run_initial')
    }
  })
}

export const newProfileParsed = (query) => (dispatch) => {
  return new Promise((resolve, reject) => {
    botRef.child('totalProfilesParsed').transaction(currentValue => currentValue+1, () => {
      profilesParsedRef.child(query.id).transaction(currentValue => currentValue + 1, () => {
        dispatch({type: NEW_PROFILE_PARSED, query })
        resolve(query)
      })
    })
  })
}

export const countChanged = (count) => dispatch => {
  return new Promise(resolve => {
    mongoose.model('count')
      .increment()
      .then(res => {
        dispatch({
        type: COUNT_CHANGED,
        count: res.count
        })
        resolve(res.count)
      })
  })
}





