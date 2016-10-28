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

export const emails = (state = {}, action) => {
  switch (action.type) {
      case EMAILS_FOUND_FOR_INFLUENCER:
        state[action.influencer] = {...state[action.influencer], ...action.email}
        return state
      case EMAILS_FOUND_FOR_HASHTAG:
        return state[action.hashtag] = {...state[action.hashtag], ...action.email}
    default:
      return state;
  }
};


export const influencers = (state={}, action) => {
  switch(action.type) {
    case SAVE_INFLUENCER:
      state[action.influencer] = {...state[action.influencer], ...action.data}
      return state
    case DUMP_FOLLOWERS_FOR_INFLUENCER:
      state[action.influencer] = Object.assign({}, state[action.influencer], delete state[action.influencer].followers)
      return state
    case INFLUENCER_STARTED:
      state[action.influencer] = {...state[action.influencer], ...{status:'running'} }
      return state
    case INFLUENCER_STOPPED:
      state[action.influencer] = {...state[action.influencer], ...{status:'stopped'} }
      return state
    default:
      return state
  }
}

export const hashtags = (state={}, action) => {
  switch(action.type) {
    case SAVE_HASHTAG:
      state[action.hashtag] = {...state[action.hashtag], ...action.data}
      return state
    case DUMP_POSTS_FOR_HASHTAG:
      state[action.hashtag] = Object.assign({}, state[action.hashtag], delete state[action.hashtag].posts)
      return state
    case HASHTAG_STARTED:
      state[action.hashtag] = {...state[action.hashtag], ...{status:'running'} }
      return state
    case HASHTAG_STOPPED:
      state[action.hashtag] = {...state[action.hashtag], ...{status:'stopped'} }
      return state
    default:
      return state
  }
}





