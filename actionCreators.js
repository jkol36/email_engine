import {ID} from './utils'
import { 
  followerCount, 
  pictureCount,
  queryRef,
  botRef,
  queryResultRef,
  influencerRef,
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
  LAST_BATCH_ID_FETCHED
} from './reducers';


export const createNewBatch = () => dispatch => {
  return new Promise(resolve => {
    let newBatchId = ID()
    lastBatchRef.set({id:newBatchId}, () => {
      dispatch({
        type: NEW_BATCH_CREATED,
        newBatchId
      })
      resolve()
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
  return new Promise(resolve => {
    dispatch({
      type: LAST_BATCH_ID_FETCHED,
      batchId
    })
  })
}
export const placeholderUpdated = (query, placeholder) => dispatch => {
  console.log('placeholder updated called with', placeholder)
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
    influencerRef.child(query.payload).set(influencerId, () => {
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
  return new Promise((resolve, reject) => {
    botRef.child('totalQueryResults').transaction(currentValue => currentValue +1)
    queryResultRef.child(query.id).push(queryResult, () => {
      dispatch({
        type: QUERY_RESULT_ADDED,
        queryResult,
        queryId: query.id
      })
      resolve(query)
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
  console.log('get initial state for query called', query.id)
  return new Promise((resolve, reject) => {
    if(getState().queryResults[query.id] != undefined) {
      resolve(getState().queryResults[query.id])
    }
    else {
      queryResultRef.child(query.id).once('value', snap => {
        if(snap.exists()) {
          //save the query in the redux state so we don't need to fetch from firebase again
          dispatch(updateQueryResult(query.id, snap.val())).then(() => resolve(snap.val()))
        }
        else {
          resolve('run_initial')
        }
      })
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





