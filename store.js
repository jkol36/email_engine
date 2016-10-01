import firebase from 'firebase'
import {firebaseRef, headers} from './config'
import {createStore, combineReducers, applyMiddleware} from 'redux'
import thunk from 'redux-thunk'
import {getPostsForHashtag, query} from './helpers'
import {emails, profilesSearched, page, status} from './reducers'
import * as actionCreators from './actionCreators'




export const store = createStore(combineReducers({
	emails,
	profilesSearched,
	page,
	status,
}), applyMiddleware(thunk))