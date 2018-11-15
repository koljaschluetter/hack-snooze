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

  addStory(user, story, cb) {
    const postPayload = { token: user.loginToken, story };

    $.post(`${BASE_URL}/stories`, postPayload, response => {
      user.retrieveDetails(function() {
        return cb(response);
      });
    });
  }

  removeStory(user, storyId, cb) {
    let deletePayload = { token: user.loginToken };

    $.ajax({
      url: `${BASE_URL}/stories/${storyId}`,
      method: 'DELETE',
      data: deletePayload,
      success: response => {
        const storyIndex = this.stories.findIndex(
          story => story.storyId === storyId
        );

        this.stories.splice(storyIndex, 1);
        user.retrieveDetails(() => cb(response));
      }
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

    $.post(`${BASE_URL}/signup`, userObj, response => {
      const { username, name, favorites, stories } = response.user;
      const token = response.token;

      localStorage.setItem('token', token);

      let user = new User(username, password, name, token, favorites, stories);

      return cb(user);
    });
  }

  login(cb) {
    let loginObj = {
      user: {
        username: this.username,
        password: this.password
      }
    };

    $.post(`${BASE_URL}/login`, loginObj, function(response) {
      localStorage.setItem('token', response.token);
      return cb(response);
    });
  }

  retrieveDetails(cb) {
    $.get(
      `${BASE_URL}/users/${this.username}`,
      {
        token: this.loginToken
      },
      response => {
        this.favorites = response.user.favorites;
        this.ownStories = response.user.stories;

        this.ownStories = response.user.stories.map(story => {
          const { username, title, author, url, storyId } = story;

          return new Story(username, title, author, url, storyId);
        });

        return cb(this);
      }
    );
  }

  addFavorite(storyId, cb) {
    let tokenPayload = {
      token: this.loginToken
    };

    $.post(
      `${BASE_URL}/users/${this.username}/favorites/${storyId}`,
      tokenPayload,
      response => {
        this.retrieveDetails(() => cb(response));
      }
    );
  }

  removeFavorite(storyId, cb) {
    let tokenPayload = {
      token: this.loginToken
    };

    $.ajax({
      url: `${BASE_URL}/users/${this.username}/favorites/${storyId}`,
      method: 'DELETE',
      data: tokenPayload,
      success: response => {
        this.retrieveDetails(() => cb(response));
      }
    });
  }

  update(userData, cb) {
    let patchPayload = {
      token: this.loginToken,
      user: userData
    };

    $.ajax({
      url: `${BASE_URL}/users/${this.username}`,
      method: 'PATCH',
      data: patchPayload,
      success: response => {
        this.retrieveDetails(() => cb(response));
      }
    });
  }

  remove(cb) {
    let deletePayload = {
      token: this.loginToken
    };

    $.ajax({
      url: `${BASE_URL}/users/${this.username}`,
      method: 'DELETE',
      data: deletePayload,
      success: response => {
        cb(response);
      }
    });
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

  update(user, storyData, cb) {
    let patchPayload = { token: user.loginToken, story: storyData };

    $.ajax({
      url: `${BASE_URL}/stories/${this.storyId}`,
      method: 'PATCH',
      data: patchPayload,
      success: response => {
        user.retrieveDetails(() => cb(response));
      }
    });
  }
}
