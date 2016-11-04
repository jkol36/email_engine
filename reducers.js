export const DUMP_FOLLOWERS_FOR_INFLUENCER = 'DUMP_FOLLOWERS_FOR_INFLUENCER';
export const DUMP_POSTS_FOR_HASHTAG = 'DUMP_POSTS_FOR_HASHTAG';
export const EMAILS_FOUND_FOR_HASHTAG = 'EMAILS_FOUND_FOR_HASHTAG';
export const EMAILS_FOUND_FOR_INFLUENCER = 'EMAILS_FOUND_FOR_INFLUENCER';
export const SAVE_INFLUENCER = 'SAVE_INFLUENCER';
export const SAVE_HASHTAG = 'SAVE_HASHTAG';
export const INFLUENCER_STARTED = 'INFLUENCER_STARTED';
export const INFLUENCER_STOPPED = 'INFLUENCER_STOPPED';
export const HASHTAG_STOPPED = 'HASHTAG_STOPPED';
export const HASHTAG_STARTED = 'HASHTAG_STARTED';
export const ANOTHER_FOLLOWER_PARSED = 'ANOTHER_FOLLOWER_PARSED';
export const ANOTHER_PROFILE_PARSED = 'ANOTHER_PROFILE_PARSED';

export const emails = (state = {}, action) => {
  switch (action.type) {
      case EMAILS_FOUND_FOR_INFLUENCER:
        state[action.influencer.id] = {...state[action.influencer.id], ...action.email}
        return state
      case EMAILS_FOUND_FOR_HASHTAG:
        return state[action.hashtag.id] = {...state[action.hashtag.id], ...action.email}
    default:
      return state;
  }
};


export const influencers = (state={}, action) => {
  switch(action.type) {
    case SAVE_INFLUENCER:
      state[action.influencer.id] = {...state[action.influencer.id], ...action.data}
      return state
    case DUMP_FOLLOWERS_FOR_INFLUENCER:
      state[action.influencer.id] = Object.assign({}, state[action.influencer.id], delete state[action.influencer.id].followers)
      return state
    case INFLUENCER_STARTED:
      state[action.influencer.id] = {...state[action.influencer.id], ...{status:'running'} }
      return state
    case INFLUENCER_STOPPED:
      state[action.influencer.id] = {...state[action.influencer.id], ...{status:'stopped'} }
      return state
    case ANOTHER_FOLLOWER_PARSED:
      const previousCount = state[action.influencer.id].followersParsed
      state[action.influencer.id] = {...state[action.influencer.id], ...{followersParsed:previousCount+1}}
      return state
    default:
      return state
  }
}

export const hashtags = (state={}, action) => {
  switch(action.type) {
    case SAVE_HASHTAG:
      state[action.hashtag.id] = {...state[action.hashtag.id], ...action.data}
      return state
    case DUMP_POSTS_FOR_HASHTAG:
      state[action.hashtag.id] = Object.assign({}, state[action.hashtag.id], delete state[action.hashtag.id].posts)
      return state
    case HASHTAG_STARTED:
      state[action.hashtag.id] = {...state[action.hashtag.id], ...{status:'running'} }
      return state
    case HASHTAG_STOPPED:
      state[action.hashtag.id] = {...state[action.hashtag.id], ...{status:'stopped'} }
      return state
    case ANOTHER_PROFILE_PARSED:
      const previousCount = state[action.hashtag.id].profilesParsed
      state[action.hashtag] = {...state[action.hashtag.id], ...{profilesParsed:previousCount+1}}
    default:
      return state
  }
}





