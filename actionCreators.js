import {firebaseRef} from './config';
import {
  SAVE_PICTURES,
  SAVING_PAGE_INFO,
  FOUND_USERS_FROM_PICTURES,
  PARSED_USERS_FOR_EMAILS,
  EMAILS_FOUND_FOR_HASHTAG,
  GETTING_FIRST_PAGE_FOR_HASHTAG,
  SAVE_PROFILES,
} from './reducers';

export const savePageInfo = (hashtag, pageId) => (dispatch, getState) => {
  return new Promise((resolve, reject) => {
    firebaseRef.child(hashtag).child('LAST_PAGE_SCRAPED').set(pageId, () => {
      dispatch({
        type: SAVING_PAGE_INFO,
        pageId
      })
      resolve()
    })
  });
};

export const gettingFirstPageForHashtag = hashtag => (dispatch, getState) => {
  return new Promise((resolve, reject) => {
    dispatch({type: GETTING_FIRST_PAGE_FOR_HASHTAG});
    resolve();
  });
};

export const savePictures = (hashtag, pictureCount, pictures) => (dispatch, getState) => {
  return new Promise((resolve, reject) => {
    dispatch({type: SAVE_PICTURES, pictureCount, pictures});
    firebaseRef.child(hashtag).child('number_of_pics_found').transaction(currentValue => currentValue + pictureCount, resolve());
  });
};

export const foundUsersFromPictures = (hashtag, userCount, users) => (dispatch, getState) => {
  return new Promise((resolve, reject) => {
    firebaseRef.child(hashtag).child('users_found').transaction(currentValue => currentValue + userCount, () => {
      dispatch({type: FOUND_USERS_FROM_PICTURES, users});
       resolve();
    });
  });
};

export const saveProfiles = profiles => (dispatch, getState) => {
  return new Promise((resolve, reject) => {
    dispatch({type: SAVE_PROFILES, profiles});
    resolve(profiles);
  });
};


export const parsedUsersForEmails = (number, hashtag) => (dispatch, getState) => {
  return new Promise((resolve, reject)=> {
    firebaseRef.child(hashtag).child('profiles_parsed').transaction(currentValue => currentValue + number, () => {
      dispatch({type: PARSED_USERS_FOR_EMAILS, number})
      resolve();
    });
  });
};
export const emailsFoundForHashtag = (hashtag, emailCount, emails) => (dispatch, getState) => {
  return new Promise((resolve, reject) => {
      firebaseRef.child(hashtag).child('emails_found').transaction(currentValue => currentValue + emailCount, () => {
        firebaseRef.child(hashtag).child('emails').push(emails, () => {
        dispatch({type: EMAILS_FOUND_FOR_HASHTAG, emails});
        resolve();
      });
    });
  });
};
