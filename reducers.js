export const EMAIL_FOUND = 'EMAIL_FOUND';
export const PROFILE_PARSED = 'PROFILE_PARSED';
export const CHANGE_PAGE = 'CHANGE_PAGE';
export const FINDING_PICTURES_FOR_HASHTAG = 'FINDING_PICTURES_FOR_HASHTAG';
export const FOUND_PICTURES_FOR_HASHTAG = 'FOUND_PICTURES_FOR_HASHTAG';
export const FINDING_USERS_FROM_PICTURES = 'FINDING_USERS_FROM_PICTURES';
export const FOUND_USERS_FROM_PICTURES = 'FOUND_USERS_FROM_PICTURES';
export const PARSING_USERS_FOR_EMAILS = 'PARSING_USERS_FOR_EMAILS';
export const EMAILS_FOUND_FOR_HASHTAG = 'EMAILS_FOUND_FOR_HASHTAG';
export const GETTING_NEXT_PAGE = 'GETTING_NEXT_PAGE';
export const FOUND_NEXT_PAGE = 'FOUND_NEXT_PAGE';

export const emails = (state = [], action) => {
  switch (action.type) {
    case EMAIL_FOUND:
      if (state.indexOf(action.email) === -1) {
        return [...state, action.email];
      }
      return state;

    default:
      return state;
  }
};

export const profilesSearched = (state = 0, action) => {
  switch (action.type) {
    case PROFILE_PARSED:
      return state + 1;
    default:
      return state;
  }
};

export const page = (state = 0, action) => {
  switch (action.type) {
    case CHANGE_PAGE:
      return action.page;
    default:
      return state;
  }
};

export const status = (state = 'INITIALIZING', action) => {
  switch (action.type) {
    case FINDING_PICTURES_FOR_HASHTAG:
      return FINDING_PICTURES_FOR_HASHTAG;
    case FOUND_PICTURES_FOR_HASHTAG:
      return FOUND_PICTURES_FOR_HASHTAG;
    case FINDING_USERS_FROM_PICTURES:
      return FINDING_USERS_FROM_PICTURES;
    case FOUND_USERS_FROM_PICTURES:
      return FOUND_USERS_FROM_PICTURES;
    case PARSING_USERS_FOR_EMAILS:
      return PARSING_USERS_FOR_EMAILS;
    case EMAILS_FOUND_FOR_HASHTAG:
      return EMAILS_FOUND_FOR_HASHTAG;
    case GETTING_NEXT_PAGE:
      return GETTING_NEXT_PAGE;
    case FOUND_NEXT_PAGE:
      return FOUND_NEXT_PAGE;
    default:
      return state;
  }
};

