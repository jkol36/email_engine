import { influencerRef, hashtagRef} from './config';
import { getFollowers, getPostsForHashtag } from './helpers';
import {
  EMAILS_FOUND_FOR_HASHTAG,
  EMAILS_FOUND_FOR_INFLUENCER,
  SAVE_INFLUENCER,
  INFLUENCER_STARTED,
  SAVE_HASHTAG,
  HASHTAG_STARTED,
  DUMP_FOLLOWERS_FOR_INFLUENCER,
  DUMP_POSTS_FOR_HASHTAG
} from './reducers';



export const getInitialStateForInfluencer = (influencer) => (dispatch, getState) => {
  return new Promise((resolve, reject) => {
    if(getState().influencers[influencer] != undefined) {
      resolve(getState().influencers[influencer])
    }
    else {
      influencerRef.child(influencer).once('value', s => {
        if(s.exists()) {
          dispatch(saveInfluencer(influencer, s.val()))
          .then(() => resolve(s.val()))
        }
        else {
          resolve('run_initial')
        }
      })
    }

  });
};
export const getInitialStateForHashtag = (hashtag) => (dispatch, getState) => {
  return new Promise((resolve, reject) => {
    if(getState().hashtags[hashtag] != undefined) {
      resolve(getState().hashtags[hashtag])
    }
    else {
      hashtagRef.child(hashtag).once('value', s => {
        if(s.exists()) {
          dispatch(saveHashtag(hashtag, s.val()))
          .then(() => resolve())
        }
        else {
          resolve('run_initial')
        }
      })
    }

  });
};

export const getNextStateForHashtag = (hashtag) => (dispatch, getState) => {
  return new Promise((resolve, reject) => {
    let {pageInfo:{nextPage, lastPage, hasNextPage}, posts} = getState().hashtags[hashtag]
    if(!hasNextPage) {
      resolve('done')
    }
    else {
      dispatch(dumpPostsForHashtag(hashtag))
      .then(() => getPostsForHashtag(hashtag, nextPage, 10))
      .then(data => {
        let {pageInfo, posts} = data
        console.log(pageInfo)
        return dispatch(saveHashtag(hashtag, {posts, pageInfo}))
      })
      .then(() => resolve(hashtag))

    }

  })
}
export const influencerStarted = (influencer) => (dispatch, getState) => {
  return new Promise((resolve, reject) => {
    influencerRef.child(influencer).child('status').set('running', () => {
      dispatch({type: INFLUENCER_STARTED, influencer})
      resolve()
    })
  })
}
export const hashtagStarted = (hashtag) => (dispatch, getState) => {
  return new Promise((resolve, reject) => {
    hashtagRef.child(hashtag).child('status').set('running', () => {
      dispatch({type: HASHTAG_STARTED, hashtag})
      resolve()
    })
  })
}
export const dumpPostsForHashtag = (hashtag) => (dispatch, getState) => {
  return new Promise((resolve, reject) => {
    dispatch({type:DUMP_POSTS_FOR_HASHTAG, hashtag})
    resolve()
  })
}


export const saveInfluencer = (influencer, data) => (dispatch, getState) => {
  return new Promise((resolve, reject) => {
    influencerRef.child(influencer).update(data, () => {
      dispatch({type: SAVE_INFLUENCER, influencer, data})
      resolve()
    })
  })
}

export const saveHashtag = (hashtag, data) => (dispatch, getState) => {
  return new Promise((resolve, reject) => {
    hashtagRef.child(hashtag).update(data, () => {
      dispatch({type: SAVE_HASHTAG, hashtag, data})
      resolve()
    })
  })
}
export const emailFoundForHashtag = (hashtag, email) => (dispatch, getState) => {
  return new Promise((resolve, reject) => {
      hashtagRef.child(hashtag).child('emails_found').transaction(currentValue => currentValue+1, () => {
        hashtagRef.child(hashtag).child('emails').push(email, () => {
        dispatch({type: EMAILS_FOUND_FOR_HASHTAG, email});
        resolve();
      });
    })
    .catch(err => console.log(err))
  });
};
export const emailFoundForInfluencer = (influencer, email) => (dispatch, getState) => {
  return new Promise((resolve, reject) => {
      influencerRef.child(influencer).child('emails_found').transaction(currentValue => currentValue + 1, () => {
        influencerRef.child(influencer).child('emails').push(email, () => {
        dispatch({type: EMAILS_FOUND_FOR_INFLUENCER, influencer, email});
        resolve();
      });
    })
    .catch(err => reject(err))
  })
};



export const dumpFollowersForInfluencer = (influencer) => (dispatch, getState) => {
  return new Promise((resolve, reject) => {
    dispatch({type:DUMP_FOLLOWERS_FOR_INFLUENCER, influencer})
    resolve()
  })
}

export const getNextStateForInfluencer = (influencer) => (dispatch, getState) => {
  return new Promise((resolve, reject) => {
    let {pageInfo:{nextPage, lastPage, hasNextPage}, followers, userId} = getState().influencers[influencer]
    if(!hasNextPage) {
      resolve('done')
    }
    else {
      dispatch(dumpFollowersForInfluencer(influencer))
      .then(() => getFollowers(userId, 10, nextPage))
      .then(data => {
        let {pageInfo, followers} = data
        return dispatch(saveInfluencer(influencer, {followers, pageInfo}))
      })
      .then(() => resolve(influencer))

    }

  })
}
