const BASE_URL = 'https://hack-or-snooze-v2.herokuapp.com';

const USER_TOKEN =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6ImtvbGphLWdpbiIsImlhdCI6MTU0MjIzMDYwMH0.EiDDAI-pCXgVg-rTsKAaYHaZVAdDGXrouXVhuCo5MII';

class StoryList {
  constructor(stories) {
    this.stories = stories;
  }

  static getStories(cb) {
    $.getJSON(`${BASE_URL}/stories`, function(response) {
      const stories = response.stories.map(function(story) {
        const { username, title, author, url, storyId } = story;

        return new Story(username, title, author, url, storyId);
      });

      const storyList = new StoryList(stories);
      return cb(storyList);
    });
  }
}

class User {
  constructor(username, password, name, loginToken, favorites, ownStories) {
    this.username = username;
    this.password = password;
    this.name = name;
    this.loginToken = loginToken;
    this.favorites = favorites;
    this.ownStories = ownStories;
  }

  static create(username, password, name, cb) {
    let userObj = {
      user: {
        name,
        username,
        password
      }
    };

    $.post(
      `https://hack-or-snooze-v2.herokuapp.com/signup`,
      userObj,
      response => {
        const { username, name, favorites, stories } = response.user;
        const token = response.token;

        let user = new User(
          username,
          password,
          name,
          token,
          favorites,
          stories
        );

        return cb(user);
      }
    );
  }

  login(cb) {
    let loginObj = {
      user: {
        username: this.username,
        password: this.password
      }
    };

    console.log(this.username, this.password);

    $.post(`https://hack-or-snooze-v2.herokuapp.com/login`, loginObj, function(
      response
    ) {
      return cb(response);
    });
  }

  retrieveDetails(cb) {
    $.get(
      `https://hack-or-snooze-v2.herokuapp.com/users/${this.username}?token=${
        this.loginToken
      }`,
      response => {
        this.favorites = response.user.favorites;
        this.ownStories = response.user.stories;

        return cb(this);
      }
    );
  }
}

class Story {
  constructor(author, title, url, username, storyId) {
    this.author = author;
    this.title = title;
    this.url = url;
    this.username = username;
    this.storyId = storyId;
  }
}
