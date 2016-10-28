import {createStore, combineReducers, applyMiddleware} from 'redux';
import thunk from 'redux-thunk';
import {
  emails,
  influencers,
  hashtags
} from './reducers';

export const store = createStore(combineReducers({
  emails,
  influencers,
  hashtags
}), applyMiddleware(thunk));
