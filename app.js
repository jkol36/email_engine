import firebase from 'firebase'
import {
  hashtagRef, 
  influencerRef, 
  pictureCount, 
  followerCount, 
  queryRef,
  suggestionRef,
  suggestionResultRef,
  botRef,
  currentVersion
} from './config';
import {
	getPostsForHashtag,
  getFirstPageForHashtag,
  findUserFromPic,
  getUserProfile,
  getFollowers,
  getInfluencerProfile,
  getSuggesstions
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
  console.log('running normail for influencer')
  return new Promise((resolve, reject) => {
    const {followers, pageInfo, followersCount, followersParsed } = getState().influencers[influencer.id]
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
  console.log('running inital for influencer', influencer)
  return new Promise((resolve, reject) => {
     getInfluencerProfile(influencer)
      .then(profile => dispatch(saveInfluencer(influencer, 
        {
          userId:profile.id,
          followersCount: profile.followedBy,
        })))
      .then(() => getFollowers(getState().influencers[influencer.id].userId, followerCount))
      .then(data => {
        return dispatch(saveInfluencer(influencer, data))
      })
      .then(() => resolve(influencer))
      .catch(err => console.log(err.stack))
  })
}
const startInfluencer = (influencer) => {
  return new Promise((resolve, reject) => {
     dispatch(getInitialStateForInfluencer(influencer))
    .then(state => {
      if(!!state.lastRun) {
          runInitialForInfluencer(influencer).then(runNormalForInfluencer(influencer))
          .catch(err => console.log(err.stack))
        }
      else if(state === 'run_initial') {
        runInitialForInfluencer(influencer)
        .then(() => runNormalForInfluencer(influencer))
        .then(resolve(influencer))
        .catch(err => console.log(err.stack))
      }
      else {
        runNormalForInfluencer(influencer)
        .then(resolve(influencer))
        .catch(err => console.log(err.stack))
      }
    })
    .catch(err => reject(err))
  })
}

const runNormalForHashtag = (hashtag) => {
  const {posts, pageInfo} = getState().hashtags[hashtag.id]
  return new Promise((resolve, reject) => {
    dispatch(hashtagStarted(hashtag))
    .then(dispatch(saveHashtag(hashtag, {lastRun:Date.now()})))
    .then(() => {
      return Promise.all(Promise.map(posts, (post) => {
        return findUserFromPic(post.code, hashtag.id)
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
        .then(() => resolve(`finished hashtag ${hashtag.id}`))
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
    getFirstPageForHashtag(hashtag.query)
    .then(data =>  {
      const { pageInfo, posts} = data
      return dispatch(saveHashtag(hashtag, {pageInfo, posts, hashtag}))
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
        .catch(err => console.log(err.stack))
      }
      else {
        runNormalForHashtag(hashtag)
        .then(resolve)
      }
    })
    .catch(err => console.log('error caught'))
  })
}


const markAsRunning = () => {
  return new Promise((resolve, reject) => {
    botRef.child('currentVersion').set(currentVersion)
    botRef.update({
      lastRestart: Date.now(),
      reason: 'Start function called'
    }, () => resolve())
  })
}
const listenForWork = () => {
  console.log('listening for work')
  suggestionRef.on('child_added', snap => {
    console.log(snap.val().status)
    switch(snap.val().status) {
      case 0:
        getSuggesstions(snap.val().query, snap.val().queryType)
        .then(suggestions => {
          suggestionResultRef.child(`${snap.val().postRef}`).set(suggestions) 
        })
    }
  })
  setInterval(() => suggestionRef.set(null, () => {
   suggestionResultRef.set(null)
   }), 10000)
  queryRef.on('child_added', s => {
    Object.keys(s.val()).map(k => {
      if(s.val()[k].status === 0) {
        queryRef.child(s.key).child(k).child('status').set('done')
        switch(s.val()[k].type) {
          case 'influencer':
            return startInfluencer(s.val()[k]).catch(err => console.log(err))
          case 'hashtag':
            return startHashtag(s.val()[k]).catch(err => console.log(err))
        }
      }
    })
  })
  queryRef.on('child_changed', s => {
    console.log('something changed')
    Object.keys(s.val()).map(k => {
      if(s.val()[k].status === 0) {
        queryRef.child(s.key).child(k).child('status').set('done')
          switch(s.val()[k].type) {
            case 'influencer':
              return startInfluencer(s.val()[k]).catch(err => console.log(err))
            case 'hashtag':
              return startHashtag(s.val()[k]).catch(err => console.log(err))
          }
      }
    })
  })
}
const start = () => {
  process.on('error', (e) => console.log(e))
  process.on('uncaughtException', (e) => console.log('gotchya',e))
  markAsRunning()
  .then(listenForWork())
}
start()



