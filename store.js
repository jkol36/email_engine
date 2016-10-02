import {createStore, combineReducers, applyMiddleware} from 'redux';
import thunk from 'redux-thunk';
import {emails,
	profilesSearched,
	page,
	status,
	pictures,
	users,
	profiles
} from './reducers';

export const store = createStore(combineReducers({
  emails,
  profilesSearched,
  page,
  status,
  pictures,
  users,
  profiles
}), applyMiddleware(thunk));
