export const parseProfile = data => {
  let { username } = data
  const extractEmails = text => {
  return text.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]+)/gi);
  };
  const {instagramProfile} = data.instagramProfile;
  return new Promise((resolve, reject) => {
    let json = instagramProfile.split('window._sharedData = ')[1];
    json = json.split('"environment_switcher_visible_server_guess": true')[0];
    let len = json.length - 2;
    json = json.substr(0, len) + '}';
    json = JSON.parse(json);
    let bio = json.entry_data.ProfilePage[0].user.biography;
    if (bio) {
      let emails = extractEmails(bio);
      if (emails) {
        resolve({email: emails[0], username, createdAt:Date.now()});
      }
      else {
        resolve({status: 404});
      }
    }
    else {
      resolve({status: 404});
    }
  });
};
