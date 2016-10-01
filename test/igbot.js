import {expect} from 'chai';
import {store} from '../store';
import {
  findingPicturesForHashtag,
  foundPicturesForHashtag,
  findingUsersFromPictures,
  foundUsersFromPictures,
  parsingUsersForEmails,
  emailsFoundForHashtag,
  gettingNextPage,
  foundNextPage
} from '../actionCreators';


describe('IGBOT', () => {
  let {dispatch} = store;
  let {getState} = store;
  it('should set firebase status to finding pictures for hashtag', done => {
    dispatch(findingPicturesForHashtag('vegan'))
    .then(() => {
      expect(getState().status).to.eq('FINDING_PICTURES_FOR_HASHTAG');
      done();
    });
  });
  it('should set firebase status to found pictures for hashtag', done => {
    dispatch(foundPicturesForHashtag('vegan', 18))
    .then(() => {
      expect(getState().status).to.eq('FOUND_PICTURES_FOR_HASHTAG');
      done();
    });
  });
  it('should set firebase status to finding users from pictures', done => {
    dispatch(findingUsersFromPictures([], 0))
    .then(() => {
      expect(getState().status).to.eq('FINDING_USERS_FROM_PICTURES');
      done();
    });
  });
  it('should set firebase status to found users from pictures', done => {
    dispatch(foundUsersFromPictures('vegan', 18))
    .then(() => {
      expect(getState().status).to.eq('FOUND_USERS_FROM_PICTURES');
      done();
    });
  });
  it('should set firebase status to parsing users for their email', done => {
    dispatch(parsingUsersForEmails())
    .then(() => {
      expect(getState().status).to.eq('PARSING_USERS_FOR_EMAILS');
      done();
    });
  });
  it('should set firebase status to emails found for hashtag', done => {
    dispatch(emailsFoundForHashtag('vegan', 18))
    .then(() => {
      expect(getState().status).to.eq('EMAILS_FOUND_FOR_HASHTAG');
      done();
    });
  });
  it('should set firebase status to fetching next page for hashtag', done => {
    dispatch(gettingNextPage('vegan', 1, 2))
    .then(() => {
      expect(getState().status).to.eq('GETTING_NEXT_PAGE');
      done();
    });
  });
  it('should set firebase status to found next page', done => {
    dispatch(foundNextPage(2))
    .then(() => {
      expect(getState().status).to.eq('FOUND_NEXT_PAGE');
      done();
    });
  });
});
