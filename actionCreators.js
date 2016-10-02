import {firebaseRef} from './config';
import {
  FINDING_PICTURES_FOR_HASHTAG,
  FOUND_PICTURES_FOR_HASHTAG,
  SAVING_PAGE_INFO,
  FINDING_USERS_FROM_PICTURES,
  FOUND_USERS_FROM_PICTURES,
  PARSING_USERS_FOR_EMAILS,
  EMAILS_FOUND_FOR_HASHTAG,
  GETTING_NEXT_PAGE,
  FOUND_NEXT_PAGE,
  FOUND_PROFILES
} from './reducers';



export const savePageInfo = pageInfo => (dispatch, getState) => {
  return new Promise((resolve, reject) => {
    dispatch({
      type: SAVING_PAGE_INFO,
      lastPage: pageInfo.start_cursor,
      nextPage: pageInfo.end_cursor
    });
  });
};
export const findingPicturesForHashtag = hashtag => (dispatch, getState) => {
  return new Promise((resolve, reject) => {
    console.log('finding pictures for hashtag', hashtag);
    firebaseRef.child('status').set('finding pictures for hashtag', () => {
      dispatch({type: FINDING_PICTURES_FOR_HASHTAG});
      resolve();
    });
  });
};

export const foundPicturesForHashtag = (hashtag, pictureCount, pictures) => (dispatch, getState) => {
  console.log('found pictures for hashtag called with', hashtag, pictureCount);
  return new Promise((resolve, reject) => {
    dispatch({type: FOUND_PICTURES_FOR_HASHTAG, pictures});
    firebaseRef.child('status').set(`found pictures for hashtag ${hashtag}`, () => {
    firebaseRef.child(hashtag).child('number_of_pics_found').transaction(currentValue => currentValue + pictureCount, resolve());
    });
  });
};

export const findingUsersFromPictures = () => (dispatch, getState) => {
  return new Promise((resolve, reject) => {
    dispatch({type: FINDING_USERS_FROM_PICTURES});
    firebaseRef.child('status').set('finding users from pictures', resolve());
  });
};

export const foundUsersFromPictures = (hashtag, userCount, users) => (dispatch, getState) => {
  return new Promise((resolve, reject) => {
    firebaseRef.child('status').set(`found users from pictures`, () => {
      firebaseRef.child(hashtag).child('users_found').transaction(currentValue => currentValue + userCount, () => {
        dispatch({type: FOUND_USERS_FROM_PICTURES, users});
        resolve();
      });
    });
  });
};

export const foundProfiles = profiles => (dispatch, getState) => {
  return new Promise((resolve, reject) => {
    dispatch({type: FOUND_PROFILES, profiles});
    resolve();
  });
};

export const parsingUsersForEmails = () => (dispatch, getState) => {
  return new Promise((resolve, reject) => {
    firebaseRef.child('status').set('parsing users for their email', () => {
      dispatch({type: PARSING_USERS_FOR_EMAILS});
      resolve();
    });
  });
};

export const emailsFoundForHashtag = (hashtag, emailCount, emails) => (dispatch, getState) => {
  return new Promise((resolve, reject) => {
    firebaseRef.child('status').set(`emails found for hashtag ${hashtag}`, () => {
      firebaseRef.child(hashtag).child('emails_found').transaction(currentValue => currentValue + emailCount, () => {
        firebaseRef.child(hashtag).child('emails').update(emails, () => {
          dispatch({type: EMAILS_FOUND_FOR_HASHTAG, emails});
          resolve();
        });
      });
    });
  });
};

export const gettingNextPage = (hashtag, lastPage, nextPage) => (dispatch, getState) => {
  return new Promise((resolve, reject) => {
    firebaseRef.child('status').set(`fetching next page for hashtag ${hashtag} LAST_PAGE: ${lastPage} NEXT_PAGE: ${nextPage}`, () => {
      dispatch({type: GETTING_NEXT_PAGE});
      resolve();
    });
  });
};
export const foundNextPage = page => (dispatch, getState) => {
  return new Promise((resolve, reject) => {
    firebaseRef.child('status').set(`found next page PAGE_ID:${page}`, () => {
      dispatch({type: FOUND_NEXT_PAGE});
      resolve();
    });
  });
};

