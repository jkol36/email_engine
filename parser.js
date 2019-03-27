export const parseProfile = data => {
  console.log('called wiht', Object.keys(data))
  const extractEmails = text => {
  return text.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]+)/gi);
  };
  return new Promise((resolve, reject) => {
    const {instagramProfile, username} = data
    let json = instagramProfile.split('window._sharedData =')[1]
    json = json.split(";</script>")[0];
    json = JSON.parse(json)
    // console.log('got json', json)
    let returnData = {}
    try {
      let bio = json.entry_data.ProfilePage[0].graphql.user.biography
      if(bio) {
        let email = extractEmails(bio)
        if(email) {
          returnData.email = email[0]
        }

        else {
          if(json.entry_data.ProfilePage[0].graphql.user.business_email) {
            returnData.email = json.entry_data.ProfilePage[0].graphql.user.business_email
          }
        }
      }
      // let pics = json.entry_data.ProfilePage[0].graphql.user.edge_media_collection.nodes
      returnData.id = json.entry_data.ProfilePage[0].graphql.user.id,
      returnData.followedBy = json.entry_data.ProfilePage[0].graphql.user.edge_followed_by,
      returnData.follows = json.entry_data.ProfilePage[0].graphql.user.edge_follow
      returnData.name = json.entry_data.ProfilePage[0].graphql.user.full_name
      returnData.username = username
      // returnData.lastPicCode = pics.length > 0 ? pics[0].code: null
      // returnData.lastTenPics = pics.length > 0 && pics.length >=10 ? pics.slice(0,10).map(pic => pic.code): null
      //returnData.bio = json.entry_data.ProfilePage[0].user.biography
      returnData.url = 'https://www.instagram.com/'+username
    }
    catch(err) {
      //reject({message:'no json to parse', originalError:err, 'retryPayload': username, code: 1})
    }
    resolve(returnData)
  });
};
