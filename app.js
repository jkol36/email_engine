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
    let usersWithEmails = results.filter(result => result.status === undefined);
    return Promise.join([
      dispatch(parsedUsersForEmails(getState().profiles.length, hashtag)),
      dispatch(emailsFoundForHashtag(hashtag, usersWithEmails.length, usersWithEmails))
    ])
  })
  .then(() => setTimeout(() => start(hashtag), 1000))
  .catch(err => console.log('caught error', err.stack))
};

start('tech')


