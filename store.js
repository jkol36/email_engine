import {createStore, combineReducers, applyMiddleware} from 'redux';
import thunk from 'redux-thunk';
import {
  queries,
  queryResults,
  emails,
  placeholders,
  influencerIds,
  lastAction,
  lastBatchId,
  initialQueries,
  batch,
  picsToFetch,
  followersToFetch,
  emailsContacted,
  count
} from './reducers';

export const store = createStore(combineReducers({
  queries,
  queryResults,
  emails,
  placeholders,
  influencerIds,
  lastAction,
  lastBatchId,
  initialQueries,
  batch,
  picsToFetch,
  followersToFetch,
  emailsContacted,
  count
}), applyMiddleware(thunk));

