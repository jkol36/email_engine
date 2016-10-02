import {
	getPostsForHashtag,
  findUserFromPic,
  getUserProfile
} from './helpers';
import {
  findingPicturesForHashtag,
  foundPicturesForHashtag,
  savePageInfo,
  findingUsersFromPictures,
  foundUsersFromPictures,
  parsingUsersForEmails,
  foundProfiles,
  emailsFoundForHashtag
} from './actionCreators';
import {parseProfile} from './parser';
import {store} from './store';

const start = hashtag => {
  const {dispatch, getState} = store;
  dispatch(findingPicturesForHashtag(hashtag))
  .then(() => getPostsForHashtag(hashtag))
  .then(res => {
    return Promise.join([
      dispatch(foundPicturesForHashtag(hashtag,
        res.tag.media.count,
        res.tag.media.nodes)),
      dispatch(savePageInfo(res.tag.media.page_info))
    ]);
  })
  .then(() => {
    if (getState().pictures.length > 0) {
      dispatch(findingUsersFromPictures());
      return Promise.map(getState().pictures, picture => {
        return findUserFromPic(picture.code);
      });
    }
  })
  .then(users => dispatch(foundUsersFromPictures(hashtag, users.length, users)))
  .then(() => {
    if (getState().users.length > 0) {
      dispatch(parsingUsersForEmails());
      return Promise.map(getState().users, user => {
        return getUserProfile(user.username);
      });
    }
  })
  .then(profiles => dispatch(foundProfiles(profiles)))
  .then(() => {
    if (getState().profiles.length > 0) {
      return Promise.map(getState().profiles, profile => {
        return parseProfile(profile);
      });
    }
  })
  .then(results => {
    let emails = results.filter(result => result.status === undefined);
    return dispatch(emailsFoundForHashtag(hashtag, emails.length, emails));
  })
  .then(() => console.log(getState().emails));
};

start('vegan');
