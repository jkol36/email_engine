import {hashtagRef, influencerRef, pictureCount} from './config';
import {
	getPostsForHashtag,
  getFirstPageForHashtag,
  findUserFromPic,
  getUserProfile,
  getFollowers,
  getInfluencerProfile
} from './helpers';
import {
  emailFoundForHashtag,
  emailFoundForInfluencer,
  getInitialStateForInfluencer,
  getNextStateForInfluencer,
  getInitialStateForHashtag,
  influencerStarted,
  getNextStateForHashtag,
  saveInfluencer,
  saveHashtag
} from './actionCreators';
import { parseProfile } from './parser';
import {store} from './store';

let {dispatch, getState} = store;

const runNormalForInfluencer = (influencer) => {
  const {followers, pageInfo } = getState().influencers[influencer]
  dispatch(influencerStarted(influencer))
  .then(() => {
    return Promise.all(Promise.map(followers, (follower) => {
      return getUserProfile(follower.username)
    }))
  })
  .then(userProfiles => {
    return Promise.all(Promise.map(userProfiles, (userProfile) => {
      return parseProfile(userProfile)
    }))
  })
  .then(parsedProfiles => {
    return Promise.all(Promise.map(parsedProfiles, (parsedProfile) => {
      if(parsedProfile.email != 404) {
        return dispatch(emailFoundForInfluencer(influencer, parsedProfile))
      }
      else {
        return Promise.resolve(parsedProfile)
      }
    }))
  })
  .then(() => dispatch(getNextStateForInfluencer(influencer)))
  .then(() => {
    if(!pageInfo.hasNextPage) {
      console.log('finished', influencer)
      
    }
    else{
      return runNormalForInfluencer(influencer)
    }
  })

}

const runInitialForInfluencer = (influencer) => {
  return new Promise((resolve, reject) => {
     getInfluencerProfile(influencer)
      .then(profile => dispatch(saveInfluencer(influencer, {userId: profile.id})))
      .then(() => getFollowers(getState().influencers[influencer].userId, 10))
      .then(data => {
        const {pageInfo, followers} = data
        return dispatch(saveInfluencer(influencer, {followers, pageInfo}))
      })
      .then(() => resolve(influencer))
  })
}
const startInfluencer = (influencer) => {
  dispatch(getInitialStateForInfluencer(influencer))
  .then(state => {
    console.log('initial state', state)
    if(state === 'run_initial') {
      runInitialForInfluencer(influencer)
      .then(() => runNormalForInfluencer(influencer))
    }
    else if(state.status == 'running') {
      console.log('already running')
      return
    }
    else {
      runNormalForInfluencer(influencer)
      
    }
  })
  .catch(err => setTimeout(() => startInfluencer(influencer), 1000))
}

const runNormalForHashtag = (hashtag) => {
  const {posts, pageInfo} = getState().hashtags[hashtag]
  dispatch(hashtagStarted(hashtag))
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
      console.log('finished hashtag', hashtag)
    }
    else {
      return runNormalForHashtag(hashtag)
    }
  })
  .catch(err => err)
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
  dispatch(getInitialStateForHashtag(hashtag))
  .then(state => {
    if(state === 'run_initial') {
      runInitialForHashtag(hashtag)
      .then(() => runNormalForHashtag(hashtag))
    }
    else {
      runNormalForHashtag(hashtag)
    }
  })
  .catch(err => setTimeout(() => startHashtag(hashtag), 1000))
}


const listenForWork = () => {
  console.log('listening for work')
  firebase.database().ref('igbot').child('work-to-do').on('child_added', snap => {
    firebase.database().ref('igbot').child('work-to-do').child(snap.key).remove()
    .then(() => start(snap.val().hashtag))
  })
}

startInfluencer('pokerstars')




