export const PROFILE_PARSED = 'PROFILE_PARSED';
export const CHANGE_PAGE = 'CHANGE_PAGE';
export const SAVE_PICTURES = 'SAVE_PICTURES';
export const FOUND_USERS_FROM_PICTURES = 'FOUND_USERS_FROM_PICTURES';
export const PARSING_USERS_FOR_EMAILS = 'PARSING_USERS_FOR_EMAILS';
export const EMAILS_FOUND_FOR_HASHTAG = 'EMAILS_FOUND_FOR_HASHTAG';
export const GETTING_FIRST_PAGE_FOR_HASHTAG = 'GETTING_FIRST_PAGE_FOR_HASHTAG';
export const GETTING_NEXT_PAGE = 'GETTING_NEXT_PAGE';
export const FOUND_NEXT_PAGE = 'FOUND_NEXT_PAGE';
export const SAVING_PAGE_INFO = 'SAVING_PAGE_INFO';
export const SAVE_PROFILES = 'SAVE_PROFILES';
export const EMPTY_STORE = 'EMPTY_STORE';
export const PARSED_USERS_FOR_EMAILS = 'PARSED_USERS_FOR_EMAILS';

export const emails = (state = [], action) => {
  switch (action.type) {
    case EMAILS_FOUND_FOR_HASHTAG:
      return [...state, ...action.emails.filter(email => state.indexOf(email) === -1)];
    default:
      return state;
  }
};

export const profilesSearched = (state = 0, action) => {
  switch (action.type) {
    case PARSED_USERS_FOR_EMAILS:
      return state + action.number;
    case EMPTY_STORE:
      return 0;
    default:
      return state;
  }
};

export const page = (state = {}, action) => {
  switch (action.type) {
    case CHANGE_PAGE:
      return action.page;
    case SAVING_PAGE_INFO:
      return action.pageId;
    case EMPTY_STORE:
      return {};
    default:
      return state;
  }
};

export const pictures = (state = [], action) => {
  switch (action.type) {
    case SAVE_PICTURES:
      return action.pictures;
    case EMPTY_STORE:
      return [];
    default:
      return state;
  }
};

export const users = (state = [], action) => {
  switch (action.type) {
    case FOUND_USERS_FROM_PICTURES:
      return action.users;
    case EMPTY_STORE:
      return [];
    default:
      return state;
  }
}

export const profiles = (state = [], action) => {
  switch (action.type) {
    case SAVE_PROFILES:
      return action.profiles;
    case EMPTY_STORE:
      return [];
    default:
      return state;
  }
};

export const status = (state = 'INITIALIZING', action) => {
  switch (action.type) {
    case SAVE_PICTURES:
      return SAVE_PICTURES;
    case FOUND_USERS_FROM_PICTURES:
      return FOUND_USERS_FROM_PICTURES;
    case PARSING_USERS_FOR_EMAILS:
      return PARSING_USERS_FOR_EMAILS;
    case EMAILS_FOUND_FOR_HASHTAG:
      return EMAILS_FOUND_FOR_HASHTAG;
    case GETTING_NEXT_PAGE:
      return GETTING_NEXT_PAGE;
    case GETTING_FIRST_PAGE_FOR_HASHTAG:
      return GETTING_FIRST_PAGE_FOR_HASHTAG;
    case FOUND_NEXT_PAGE:
      return FOUND_NEXT_PAGE;
    case SAVING_PAGE_INFO:
      return SAVING_PAGE_INFO;
    default:
      return state;
  }
};

