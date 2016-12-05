import {expect} from 'chai';
import {store} from '../store';
import {firebaseRef} from '../config'
import {
  getFirstPageForHashtag,
  getUserProfile,
  pickProxy
} from '../helpers';
import {
  savePageInfo
} from '../actionCreators';


describe('IGBOT SETUP', () => {
  let {dispatch} = store;
  let {getState} = store;
  it('should set last page scraped for vegan to J0HV_1MFAAAAF0HV_1L5wAAAFiYA', done => {
    firebaseRef.child('vegan').child('LAST_PAGE_SCRAPED').set('J0HV_1MFAAAAF0HV_1L5wAAAFiYA', () => {
      done()
    });
  });
})

describe('pick a proxy', () => {
  it('should pick a proxy server', done => {
    let proxy = pickProxy()
    console.log(proxy)
    expect(proxy).to.not.be.null
    done()
  })
})

describe('test proxy', () => {
  it('should get a users profile using a proxy', done => {
    getUserProfile('jkol36')
    .then(console.log)
  })
})
describe('helpers', () => {
  let lastPageId 
  it('should getInitialPage for hashtag vegan from instagram', done => {
   getFirstPageForHashtag('vegan')
    .then(pageId => {
      lastPageId = pageId
      expect(pageId).to.be.a('string');
      done();
    });
  });
});
describe('action creators', () => {
  let {dispatch} = store
  it('should set the current page id in firebase', done => {
    dispatch(savePageInfo('vegan', 'testing'))
    .then(() => {
      console.log('done')
      done()
    })
  })
})
