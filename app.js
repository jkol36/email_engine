import firebase from 'firebase'
import {firebaseRef, pictureCount} from './config';
import {
	getPostsForHashtag,
  getFirstPageForHashtag,
  getNextPageForHashtag,
  findUserFromPic,
  getUserProfile
} from './helpers';
import {
  savePictures,
  savePageInfo,
  foundUsersFromPictures,
  parsedUsersForEmails,
  saveProfiles,
  emailsFoundForHashtag,
  gettingFirstPageForHashtag,
} from './actionCreators';
import {parseProfile} from './parser';
import {store} from './store';

let {dispatch, getState} = store;
const start = (hashtag) => {
  dispatch(gettingFirstPageForHashtag(hashtag))
  .then(() => getFirstPageForHashtag(hashtag))
  .then(pageId => getPostsForHashtag(hashtag, pageId, pictureCount))
  .then((obj) => {
    if(!obj.hasNextPage) {
      firebaseRef.child(hashtag).child('STOPPED').child('reason').set('No more pages left', () => process.exit())
    }
    if(obj.posts.length === 0) {
        firebaseRef.child(hashtag).child('LAST_PAGE_SCRAPED').remove().then(() => start(hashtag))
      }
    else {
      return Promise.all([
        dispatch(savePageInfo(hashtag, obj.nextPage)),
        dispatch(savePictures(hashtag, obj.posts.length, obj.posts))
      ]);
    }
  })
  .then(() => Promise.map(getState().pictures, (picture) => {
    return findUserFromPic(picture.code);
  }))
  .then(users => dispatch(foundUsersFromPictures(hashtag, users.length, users)))
  .then(() => Promise.map(getState().users, (user) => {
    return getUserProfile(user.username)
  }))
  .then(profiles => dispatch(saveProfiles(profiles)))
  .then((profiles) => Promise.map(profiles, (profile) => {
    return parseProfile(profile)
  }))
  .then(results => {
    console.log(results)
    let usersWithEmails = results.filter(result => result.status === undefined);
    return Promise.join([
      dispatch(parsedUsersForEmails(getState().profiles.length, hashtag)),
      dispatch(emailsFoundForHashtag(hashtag, usersWithEmails.length, usersWithEmails))
    ])
  })
  .then(() => setTimeout(() => start(hashtag), 1000))
  .catch(err => {
    switch(err.status) {
      //bad gateway
      case 502:
        setTimeout(() => start(hashtag), 10000)
      //bad request
      case 400:
        start(hashtag)
      //not found
      case 404:
        setTimeout(() => start(hashtag))
      case 429:
        setTimeout(() => start(hashtag), 10000)
      case 500:
        setTimeout(() => start(hashtag), 10000)
      default:
        console.log(err)
    }
  })
};

const saveEmailsToTxtFile = () => {
  let emails  = []
  firebase.database().ref('igbot').child('hashtags').child('5dimes/emails').once('value', snap => {
  if(snap.exists()) {
    Object.keys(snap.val()).map(k => snap.val()[k]).filter(obj => {
      obj.forEach(emailObj => {
        if(emails.indexOf(emailObj.email.toLowerCase()) === -1 ) {
          emails.push(emailObj.email.toLowerCase())
        }
      })
    })
    let fs = require('fs')
    fs.writeFile('emails.txt', emails, () => {
      console.log('done')
    })
  }
  else {
    console.log('doesnt exist')
  }
  })
}

const listenForWork = () => {
  console.log('listening for work')
  firebase.database().ref('igbot').child('work-to-do').on('child_added', snap => {
    firebase.database().ref('igbot').child('work-to-do').child(snap.key).remove()
    .then(() => start(snap.val().hashtag))
  })
}

start('vegan')




