export const QUERY_ADDED = 'QUERY_ADDED'
export const QUERY_UPDATED = 'QUERY_UPDATED'
export const PLACEHOLDER_UPDATED = 'PLACEHOLDER_UPDATED'
export const QUERY_RESULT_ADDED = 'QUERY_RESULT_ADDED'
export const QUERY_RESULT_UPDATED = 'QUERY_RESULT_UPDATED'
export const EMAIL_FOUND = 'EMAIL_FOUND'
export const INITIAL_INFLUENCER_ID = 'INITIAL_INFLUENCER_ID'
export const NEW_PROFILE_PARSED = 'NEW_PROFILE_PARSED'
export const INITIAL_QUERIES_FETCHED = 'INITIAL_QUERIES_FETCHED'
export const LAST_BATCH_ID_FETCHED = 'LAST_BATCH_ID_FETCHED'
export const NEW_BATCH_CREATED = 'NEW_BATCH_CREATED'
export const EMPTY_STORE = 'EMPTY_STORE'
export const PIC_SETTING_FOUND = 'PIC_SETTING_FOUND'
export const FOLLOWER_SETTING_FOUND = 'FOLLOWER_SETTING_FOUND'


export const picsToFetch = (state=10, action) => {
  switch(action.type) {
    case PIC_SETTING_FOUND:
      return action.value
    default:
      return state
  }
}
export const followersToFetch = (state=10, action) => {
  switch(action.type) {
    case FOLLOWER_SETTING_FOUND:
      return action.value
    default:
      return state
  }
}
export const batch = (state=null, action) => {
  switch(action.type) {
    case NEW_BATCH_CREATED:
      state = action.newBatchId
      return state
    default:
      return state
  }
}
export const initialQueries = (state=null, action) => {
  switch(action.type) {
    case INITIAL_QUERIES_FETCHED:
      return action.queries
    default:
      return state
  }
}
export const lastBatchId = (state=null, action) => {
  switch(action.type) {
    case LAST_BATCH_ID_FETCHED:
      return action.batchId
    default:
      return state
  }
}
export const lastAction = (state=null, action) => {
  return action
}
export const placeholders = (state={}, action) => {
  switch(action.type) {
    case PLACEHOLDER_UPDATED:
      state[action.queryId] = action.placeholder
      return state
    default:
      return state

  }
}
export const influencerIds = (state={}, action) => {
  switch(action.type) {
    case INITIAL_INFLUENCER_ID:
      state[action.query.payload] = action.id
      return state
    default:
      return state
  }
}
export const emails = (state = [], action) => {
  switch (action.type) {
      case EMAIL_FOUND:
        let newState = [...state, action.email]
        return newState
      case EMPTY_STORE:
        return []
    default:
      return state;
  }
};

export const profilesParsed = (state={}, action) => {
  switch(action.type) {
    case NEW_PROFILE_PARSED:
      let previousCount = state[action.query.id]
      state[action.query.id] = previousCount + 1
      return state
    default:
      return state
  }
}
export const queries = (state={}, action) => {
  switch(action.type) {
    case QUERY_ADDED:
      state[action.query.id] = action.query
      return state
    case QUERY_UPDATED:
      state[action.id] = {...state[action.id], ...action.query }
      return state
    default:
      return state
  }
}


//pass in the query id to get its results
//EXAMPLE OBJECT 
// let queryResult = {
//   profilesParsed: 0,
//   emailsFound: 0,
//   currentPage: 1,
//   hasNextPage: true,
//   posts: [{
//     0 {
//       caption: 'heyoo',
//       code: '12312312',
//       comments: [{
//         count: 3
//       }],
//       date: '1481231231',
//       dimensions: {
//         height: 140,
//         width: 140
//       }
//       displaySource: 'https://cdn.instagram.com/asdadsassas',
//       id: '12312312',
//       isVideo: true,
//       likes: [{
//         count: 68
//       }],
//       owner: {
//         id: '1231231221',
//       },
//       thumbnail_src: 'https://cdn.instagram.com/asdajsdaskd'

//     }
//   }]

// }
export const queryResults = (state={}, action) => {
  switch(action.type) {
    case QUERY_RESULT_ADDED:
    case QUERY_RESULT_UPDATED:
      state[action.queryId] = {...state[action.queryId], ...action.queryResult}
      return state
    case EMPTY_STORE:
      return {}
    default:
      return state
  }
}






