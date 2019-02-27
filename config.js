import firebase from 'firebase';
import mongoose from 'mongoose'
import models from './models'

const serviceAccount = require('./igbot-serviceaccount.json');

if(process.env.NODE_ENV != 'production')
  require('dotenv').load()

firebase.initializeApp({
  serviceAccount,
  databaseURL: 'https://igbot-dc02d.firebaseio.com'
});

export const headers = {
    'cookie': 'mid=W756OwAEAAHiYlQjZrLZuynSLCWZ; mcd=3; fbm_124024574287414=base_domain=.instagram.com; csrftoken=duJXsQKx47BsvbvIlAzL1ZjIjOBbJmUG; shbid=14488; ds_user_id=54537579; rur=PRN; sessionid=IGSC12f7a82a01ece0c5c6c025b2c01b679448abe4e8f692cda8ee081c8dd919520c%3A8NTxER8JQdUnbk5mtRa72gUZhPFWO8ma%3A%7B%22_auth_user_id%22%3A54537579%2C%22_auth_user_backend%22%3A%22accounts.backends.CaseInsensitiveModelBackend%22%2C%22_auth_user_hash%22%3A%22%22%2C%22_platform%22%3A4%2C%22_token_ver%22%3A2%2C%22_token%22%3A%2254537579%3AuHK1wW2vxIJj3yzJLqNMvKwunsmmoGXN%3Abd170869162cb17f1feebbf6a05000b725377144c1583ba335541ca3b0b703b3%22%2C%22last_refreshed%22%3A1539549584.5124232769%7D; fbsr_124024574287414=c7eB2KkdED-y-g6oNQgv6Cnd0Jb_jGE8mzmEkKuRPyI.eyJhbGdvcml0aG0iOiJITUFDLVNIQTI1NiIsImNvZGUiOiJBUURmQ3l0dFlxcUJOR2VRREJwcjBxeFNuXzFreVNlRlVwSkdiYUtVOHd4WXRpVVI5LWoycGNnSGpDVWhBV0RqdllGLXRvTHNFU1VKcU1FRUU0SnVOdHdfYlBHay1rWFpjTnZ1VWJBaVRwVWY5RkVVZXNuQ1c2MnI0X2ZGbVhFVjlMdmtHMklycHVlUG91b21odk1FbW83b3ZneFNITXlILTBQRmUxSFIzUmVqdjZJWC1yVTNLTmp6NE5tblVhWFI3Q3Q5eTBOSnZtakxDVFY3S3AzZFFDb2FfRG9EdW5fajA4THJhZU5tbWNOekVJYVc4dkNhOElRYjhibms4ZEk3S1FOWUQ5ZXVQTDhkV19oV1JXbFRMRFllcHViUjlBT1V5a0RSdmd1MlVQcjl3NkI2cU5WQjNQdGMxZUVsQnNKT0t0NEhFX3RCYnNWRnB0SzYxc2lEMEFSWmdKV2xheGZEcGZPekRIRi1EVU1Ib1oyWmV6a09tT1BabGMtMVUyRzY5NlUiLCJpc3N1ZWRfYXQiOjE1Mzk1NTQyNjcsInVzZXJfaWQiOiI2NjAyNTE0NDcifQ;',
    'accept-encoding': 'gzip, deflate, br',
    'accept-language': 'en-US,en;q=0.9',
    'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/69.0.3497.100 Safari/537.36',
    'accept': '*/*',
    'referer': 'https://www.instagram.com/jkol36/',
    'authority': 'www.instagram.com',
    'x-requested-with': 'XMLHttpRequest',
    'x-instagram-gis': '00cb4d597a5a210ed55c70166dffd36a'
};
export const currentVersion = 'jonk'
export const firebaseRef = firebase.database().ref(`igbot/${currentVersion}`)
export const uniqueEmailRef = firebase.database().ref(`igbot/${currentVersion}/uniqueEmails`)
export const uniqueEmailCount = firebase.database().ref(`igbot/${currentVersion}/uniqueEmailCount`)
export const currentBatchRef = firebase.database().ref(`igbot/${currentVersion}/currentBatchId`)
export const lastBatchRef = firebase.database().ref(`igbot/${currentVersion}/lastBatchId`)
export const botRef = firebase.database().ref(`igbot/${currentVersion}`)
export const queryRef = firebase.database().ref(`igbot/${currentVersion}/queries`)
export const placeholderRef = firebase.database().ref(`igbot/${currentVersion}/placeholders`)
export const profilesParsedRef = firebase.database().ref(`igbot/${currentVersion}/profilesParsed`)
export const queryResultRef = firebase.database().ref(`igbot/${currentVersion}/queryResults`)
export const influencerIdRef = firebase.database().ref(`igbot/${currentVersion}/influencerIds`)
export const suggestionRef = firebase.database().ref(`igbot/${currentVersion}/querySuggestions`)
export const suggestionResultRef = firebase.database().ref(`igbot/${currentVersion}/querySuggestionResults`)
export const userSessionRef = firebase.database().ref(`igbot/${currentVersion}/anonymousUserSessions`)
export const emailRef = firebase.database().ref(`igbot/${currentVersion}/emails`)
export const errorRef = firebase.database().ref(`igbot/${currentVersion}/errors`)
export const defaultPicsToFetch = 12
export const defaultFollowersToFetch = 12
export const DAILY_EMAIL_LIMIT = 300
global.Promise = require('bluebird');
mongoose.Promise = require('bluebird')
export const initializeDatabase = () => {
  return mongoose.connect(process.env.DATABASE_URL)
}
