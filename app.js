import moment from 'moment'
import firebase from 'firebase'
import {
  hashtagRef, 
  influencerRef, 
  pictureCount, 
  followerCount, 
  workRef
} from './config';
import {
	getPostsForHashtag,
  getFirstPageForHashtag,
  findUserFromPic,
  getUserProfile,
  getFollowers,
  getInfluencerProfile
} from './helpers';
import {
  anotherProfileParsed,
  anotherFollowerParsed,
  emailFoundForHashtag,
  emailFoundForInfluencer,
  getInitialStateForInfluencer,
  getNextStateForInfluencer,
  getInitialStateForHashtag,
  influencerStarted,
  influencerStopped,
  influencerHaltedWithError,
  getNextStateForHashtag,
  saveInfluencer,
  hashtagStarted,
  hashtagStopped,
  hashtagHaltedWithError,
  saveHashtag
} from './actionCreators';
import { parseProfile } from './parser';
import {store} from './store';

let {dispatch, getState} = store;

const runNormalForInfluencer = (influencer) => {
  return new Promise((resolve, reject) => {
    const {followers, pageInfo, followersCount, followersParsed } = getState().influencers[influencer]
    const percentageDone = followersParsed / followersCount.count
    console.log(percentageDone)
    dispatch(influencerStarted(influencer))
    .then(dispatch(saveInfluencer(influencer, {lastRun:Date.now()})))
    .then(() => {
      return Promise.map(followers, (follower) => {
        return getUserProfile(follower.username)
      })
    })
    .map(parseProfile)
    .then(parsedProfiles => {
      return Promise.map(parsedProfiles, (parsedProfile) => {
        dispatch(anotherFollowerParsed(influencer))
        if(parsedProfile.email != 404) {
          return dispatch(emailFoundForInfluencer(influencer, parsedProfile))
        }
        else {
          return Promise.resolve(parsedProfile)
        }
      })
    })
    .then(() => dispatch(getNextStateForInfluencer(influencer)))
    .then(() => {
      if(!pageInfo.hasNextPage) {

        
      }
      else{
        runNormalForInfluencer(influencer)
      }
    })
    .catch(err => reject(err))
  })
}

const runInitialForInfluencer = (influencer) => {
  return new Promise((resolve, reject) => {
     getInfluencerProfile(influencer)
      .then(profile => dispatch(saveInfluencer(influencer, 
        {
          userId:profile.id,
          followersCount: profile.followedBy,
        })))
      .then(() => getFollowers(getState().influencers[influencer].userId, followerCount))
      .then(data => {
        return dispatch(saveInfluencer(influencer, data))
      })
      .then(() => resolve(influencer))
  })
}
const startInfluencer = (influencer) => {
  return new Promise((resolve, reject) => {
     dispatch(getInitialStateForInfluencer(influencer))
    .then(state => {
      if(!!state.lastRun) {
          runInitialForInfluencer(influencer).then(runNormalForInfluencer(influencer))
        }
      else if(state === 'run_initial') {
        runInitialForInfluencer(influencer)
        .then(() => runNormalForInfluencer(influencer))
        .then(resolve(influencer))
      }
      else {
        runNormalForInfluencer(influencer)
        .then(resolve(influencer))
      }
    })
    .catch(err => reject(err))
  })
}

const runNormalForHashtag = (hashtag) => {
  const {posts, pageInfo} = getState().hashtags[hashtag]
  return new Promise((resolve, reject) => {
    dispatch(hashtagStarted(hashtag))
    .then(dispatch(saveHashtag(hashtag, {lastRun:Date.now()})))
    .then(() => {
      return Promise.all(Promise.map(posts, (post) => {
        return findUserFromPic(post.code, hashtag)
      }))
    })
    .then(users => Promise.all(Promise.map(users, (user) => {
      if(user != 404) {
        return getUserProfile(user.username)
      }
      else {
        Promise.resolve(user)
      }
    })))
    .then(initialProfiles => {
      const profiles = initialProfiles.filter(profile => profile != undefined)
      return Promise.all(Promise.map(profiles, (profile) => {
        return parseProfile(profile)
      }))
    })
    .then(parsedProfiles => Promise.all(Promise.map(parsedProfiles, (parsedProfile) => {
      dispatch(anotherProfileParsed(hashtag))
      if(parsedProfile.email != 404) {
        dispatch(emailFoundForHashtag(hashtag, parsedProfile))
      }
      else {
        Promise.resolve(parsedProfile)
      }
    })))
    .then(() => dispatch(getNextStateForHashtag(hashtag)))
    .then(() => {
      if(!pageInfo.hasNextPage) {
        dispatch(hashtagHaltedWithError(hashtag, 'no more posts to scrape'))
      }
      else {
        return runNormalForHashtag(hashtag)
      }
    })
    .catch(err => {
      if(getState().hashtags[hashtag].pageInfo.hasNextPage === false) {
        dispatch(hashtagHaltedWithError(hashtag, 'no more pages to scrape'))
        .then(() => resolve(`finished hashtag ${hashtag}`))
      }
      else {
        dispatch(hashtagHaltedWithError(hashtag, 'Restarting in 1000 ms'))
        Promise.delay(1000).then(startHashtag(hashtag))
      }
    })
  })
}
const runInitialForHashtag = (hashtag) => {
  return new Promise((resolve, reject) => {
    getFirstPageForHashtag(hashtag)
    .then(data =>  {
      const { pageInfo, posts} = data
      return dispatch(saveHashtag(hashtag, {pageInfo, posts}))
    })
    .then(() => resolve(hashtag))
  })
}
const startHashtag = (hashtag) => {
  console.log('starting', hashtag)
  return new Promise((resolve, reject) => {
    dispatch(getInitialStateForHashtag(hashtag))
    .then(state => {
      if(state === 'run_initial') {
        runInitialForHashtag(hashtag)
        .then(() => runNormalForHashtag(hashtag))
        .then(() => console.log('finished hashtag', hashtag))
      }
      else {
        runNormalForHashtag(hashtag)
        .then(resolve)
      }
    })
  })
}


const listenForWork = () => {
  console.log('listening for work')
  workRef.child('influencers').once('value', snap => {
    if(snap.exists()) {
      Object.keys(snap.val()).map(k => {
        let query = snap.val()[k].query
        workRef.child('influencers').child(k).remove()
        .then(() => startInfluencer(query))
      })
    }
  })
  workRef.child('hashtags').once('value', snap => {
    if(snap.exists()) {
      Object.keys(snap.val()).map(k => {
        let query = snap.val()[k].query
        startHashtag(query)
        .then(console.log('work finished'))
    })
    }
  })
  workRef.child('influencers').on('child_added', snap => {
    startInfluencer(snap.val().query)
  })
  workRef.child('hashtags').on('child_added', snap => {
    startHashtag(snap.val().query)
    .then(console.log('work finished for hashtag', snap.val().query))
  })
}

listenForWork()



