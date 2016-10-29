import {hashtagRef, influencerRef, pictureCount, followerCount} from './config';
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
  const {followers, pageInfo, followersCount, followersParsed } = getState().influencers[influencer]
  const percentageDone = followersParsed / followersCount.count
  console.log(percentageDone)
  dispatch(influencerStarted(influencer))
  .then(() => {
    return Promise.all(Promise.map(followers, (follower) => {
      return getUserProfile(follower.username)
    }))
  })
  .then(userProfiles => {
    return Promise.all(Promise.map(userProfiles, (userProfile) => {
      if(userProfile != 404) {
        return parseProfile(userProfile)
      }
      else Promise.resolve(userProfile)
    }))
  })
  .then(parsedProfiles => {
    return Promise.all(Promise.map(parsedProfiles, (parsedProfile) => {
      dispatch(anotherFollowerParsed(influencer))
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
      process.exit()
      
    }
    else{
      Promise.delay(100).then(runNormalForInfluencer(influencer))
    }
  })
  .catch(err => {
    dispatch(influencerHaltedWithError(influencer, err.stack))
    .then(() => Promise.delay(1000))
    .then(() => runNormalForInfluencer(influencer))
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
      .catch(err => console.log('runInitialForInfluencer caught err', err))
  })
}
const startInfluencer = (influencer) => {
  process.on('exit', () => {
    dispatch(influencerStopped(influencer))
    .then(() => process.exit())
  })
  process.on('SIGINT', () => {
    dispatch(influencerStopped(influencer))
    .then(() => process.exit())
  })
  dispatch(getInitialStateForInfluencer(influencer))
  .then(state => {
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
      process.exit()
    }
    else {
      return runNormalForHashtag(hashtag)
    }
  })
  .catch(err => {
    dispatch(hashtagHaltedWithError(hashtag, err.stack))
    Promise.delay(100).then(startHashtag(hashtag))
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
  process.on('exit', () => {
    dispatch(hashtagStopped(hashtag))
    .then(() => process.exit())
  })
  process.on('SIGINT', () => {
    dispatch(hashtagStopped(hashtag))
    .then(() => process.exit())
  })
  dispatch(getInitialStateForHashtag(hashtag))
  .then(state => {
    if(state === 'run_initial') {
      runInitialForHashtag(hashtag)
      .then(() => runNormalForHashtag(hashtag))
    }
    else if(state.status === 'running') {
      return
    }
    else {
      runNormalForHashtag(hashtag)
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

startHashtag('startups')




