const BASE_URL = 'https://hack-or-snooze-v2.herokuapp.com';

const USER_TOKEN =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6ImtvbGphLWdpbiIsImlhdCI6MTU0MjIzMDYwMH0.EiDDAI-pCXgVg-rTsKAaYHaZVAdDGXrouXVhuCo5MII';

class StoryList {
  constructor(stories) {
    this.stories = stories;
  }

  // current no limit - 25 stories max per request
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
      localStorage.setItem('username', username);

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
    $.post(`${BASE_URL}/login`, loginObj, response => {
      this.loginToken = response.token;
      localStorage.setItem('token', response.token);
      localStorage.setItem('username', this.username);
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
        this.name = response.user.name;
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

// onload for jQuery
$(function() {
  let domView = {
    storyList: [],
    user: new User(),

    // data get all Stories
    displayAllStories: function() {
      StoryList.getStories(results => {
        this.storyList = results.stories;

        // we have the stories, loop over all stories
        this.storyList.forEach(storyObj => {
          this.displaySingleStory(storyObj);
        });
      });
    },

    displaySingleStory: function(storyObj) {
      // this will then create jquery div container for one story with all details
      // temp remove due to garbage data in api
      // let $newLink = $('<a>', {
      //   text: `random`,
      //   href: storyObj.url,
      //   target: '_blank'
      // });

      // let hostname = $newLink
      //   .prop('hostname')
      //   .split('.')
      //   .slice(-2)
      //   .join('.');

      // TODO LIST
      // 1. Iterate through user'a favorites and see if this item is a favorite
      //       If true, make sure it is a solid star
      // 2. CHeck if the current story was created by current user
      //       If true, make sure there is a delete button for that story

      $('#stories').append(
        $('<li>')
          .append(
            $('<div>')
              .addClass('story--header')
              .append($('<span>').addClass('far fa-star'))
              .append(
                $('<a>')
                  .attr('target', '_blank')
                  .attr('href', storyObj.url)
                  .text(storyObj.title)
              )
              .append($('<small>').text(`(${storyObj.url})`))
            // .append($('<small>').text(`(${hostname})`))
          )
          .append(
            $('<div>')
              .append(
                $('<a>')
                  .attr('href', '#')
                  .text('Delete')
              )
              .addClass('story--detail')
          )
      );
      // call helper to show one story
    },

    checkForLoggedUser: function() {
      // logic for if token exist diplay username
      const token = localStorage.getItem('token');
      const username = localStorage.getItem('username');
      if (token) {
        this.user.loginToken = token;
        this.user.username = username;
        this.user.retrieveDetails(result => {
          const displayName = result.name;
          $('#loginContainer').empty();
          $('#loginContainer').append($('<span>').text(displayName));
        });
      } else {
        // dump into navbar sign
        $('#loginContainer').empty();
        $('#loginContainer').append(
          $('<form>')
            .addClass('form-inline my-2 my-lg-0')
            .append(
              $('<input>')
                .addClass('form-control mr-sm-2')
                .attr('type', 'text')
                .attr('placeholder', 'Username')
                .attr('id', 'username')
            )
            .append(
              $('<input>')
                .addClass('form-control mr-sm-2')
                .attr('type', 'password')
                .attr('placeholder', 'Password')
                .attr('id', 'password')
            )
            .append(
              $('<button>')
                .text('Login')
                .addClass('btn btn-dark my-2 my-sm-0')
                .attr('type', 'submit')
                .on('click', event => {
                  event.preventDefault();
                  const usernameInput = $('#username').val();
                  const passwordInput = $('#password').val();

                  // submit form, store token, retrieve new page

                  // call login Function - check what that requires
                  //      then call retreive all user details
                  //            then call displayAllStories again

                  this.user.username = usernameInput;
                  this.user.password = passwordInput;
                  this.user.login(() => {
                    this.user.retrieveDetails(() => {
                      console.log(this.storyList);
                      StoryList.getStories(result => {
                        this.storyList = result;
                        this.checkForLoggedUser();
                      });
                    });
                  });
                })
            )
            .append(
              $('<button>')
                .text('Login')
                .addClass('btn btn-dark my-2 my-sm-0')
                .attr('type', 'submit')
                .on('click', event => {
                  event.preventDefault();
                  const usernameInput = $('#username').val();
                  const passwordInput = $('#password').val();

                  // submit form, store token, retrieve new page

                  // call login Function - check what that requires
                  //      then call retreive all user details
                  //            then call displayAllStories again

                  this.user.username = usernameInput;
                  this.user.password = passwordInput;
                  this.user.login(() => {
                    this.user.retrieveDetails(() => {
                      console.log(this.storyList);
                      StoryList.getStories(result => {
                        this.storyList = result;
                        this.checkForLoggedUser();
                      });
                    });
                  });
                })
            )
        );

        //   <form class="form-inline my-2 my-lg-0">
        //   <input
        //     class="form-control mr-sm-2"
        //     type="text"
        //     placeholder="Username"
        //     aria-label="Username"
        //   />
        //   <input
        //     class="form-control mr-sm-2"
        //     type="password"
        //     placeholder="Password"
        //     aria-label="Password"
        //   />
        //   <button class="btn btn-outline-success my-2 my-sm-0" type="submit">
        //     Login
        //   </button>
        // </form>
      }
    }
  };
  // initial all stories
  domView.checkForLoggedUser();
  domView.displayAllStories();
});
