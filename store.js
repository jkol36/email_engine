import {createStore, combineReducers, applyMiddleware} from 'redux';
import thunk from 'redux-thunk';
import {emails, profilesSearched, page, status} from './reducers';
export const store = createStore(combineReducers({
  emails,
  profilesSearched,
  page,
  status
}), applyMiddleware(thunk));
