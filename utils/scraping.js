const requestInstagram = require("./request");

module.exports = {
  async scrapeUser(user, proxy) {
    try {
      const options = {
        uri: `https://www.instagram.com/${user}/`,
        proxy,
        headers: {
          Connection: "keep-alive",
          "accept-language": "en-US,en;q=0.9",
          "upgrade-insecure-requests": 1,
          "User-Agent":
            "Mozilla/5.0 (iPhone; CPU iPhone OS 12_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/72.0.3626.101 Mobile/15E148 Safari/605.1",
        },
      };

      const resp = await requestInstagram(options);
      if (resp.statusCode !== 200) {
        console.log("Rate limit exceeded! - [429]");

        return false;
      }

      const jsonObject = resp.body;

      return jsonObject;
    } catch (e) {
      console.log("Proxy timeout! - [503]");
      return false;
    }
  },
  /**
   *
   * @param {array} body - Must be an array of body response
   */
  async scrapeUserData(body) {
    const data = [];

    // get user data
    const userDetail = {
      userID: body.id,
      userName: body.username,
      fullName: body.full_name,
      imageUrl: body.profile_pic_url_hd,
    };

    for (let i = 0; i < body.edge_owner_to_timeline_media.edges.length; i++) {
      const node = body.edge_owner_to_timeline_media.edges[i].node;

      if (node.owner.id === userDetail.userID) {
        data.push({
          ...userDetail,
          post: {
            postID: node.shortcode,
            displayUrl: node.display_url,
            text: this.validateText(node.edge_media_to_caption.edges),
            isVideo: node.is_video,
            timestamp: node.taken_at_timestamp,
            owner: node.owner,
          },
        });
      }
    }

    return data;
  },
  validateText(caption) {
    if (caption.length == 0) {
      return null;
    }

    return caption[0].node.text;
  },
};
