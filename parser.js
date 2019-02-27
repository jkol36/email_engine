export const parseProfile = data => {
  console.log('parse profile called with', data)
  const extractEmails = text => {
  return text.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]+)/gi);
  };
  return new Promise((resolve, reject) => {
    const {instagramProfile, username} = data
    console.log('instagramProfile', instagramProfile)
    let json = instagramProfile.split('<script type="text/javascript">window._sharedData =')[1]
    json =  JSON.parse(json.split(';</script>')[0])
    let returnData = {}
    try {
      let bio = json.entry_data.ProfilePage[0].graphql.user.biography
      if(bio) {
        let email = extractEmails(bio)
        if(email) {
          returnData.email = email[0]
        }
      }
      returnData.user = json.entry_data.ProfilePage[0].graphql.user
      // console.log(json.entry_data.ProfilePage[0].graphql.user.)
    }
    catch(err) {
      console.log(err)
      reject({message:'no json to parse', originalError:err, 'retryPayload': username, code: 1})
    }
    console.log(Object.keys(returnData).length)
    resolve(returnData)
  });
};

