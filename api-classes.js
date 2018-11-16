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
        const { author, title, url, username, storyId } = story;

        return new Story(author, title, url, username, storyId);
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
      StoryList.getStories(storyList => {
        this.storyList = storyList;

        // we have the stories, loop over all stories
        this.storyList.stories.forEach(storyObj => {
          this.displaySingleStory(storyObj);
        });
      });
    },

    displaySingleStory: function(storyObj) {
      // this will then create jquery div container for one story with all details
      // temp remove due to garbage data in api
      let $newLink = $('<a>', {
        text: `random`,
        href: storyObj.url,
        target: '_blank'
      });

      let hostname = $newLink
        .prop('hostname')
        .split('.')
        .slice(-2)
        .join('.');

      // TODO LIST

      // 1. DISPLAY LOGIC - render how favorite star looks if the story is or is not in user favorite
      //      impact only the star thing

      // 2. DISPLAY LGOIC - delete button related - show Delete BUTTON element only if storyID is in user ownStories

      // 3. DISPLAY LOGIC - edit functionality - potentially add MODEL POPUP For Editing

      $('#stories').append(
        $('<li>')
          .attr('id', storyObj.storyId)
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
              .append($('<small>').text(`(${hostname})`))
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
    },

    loginUserSubmission: function() {
      event.preventDefault();
      const usernameInput = $('#username').val();
      const passwordInput = $('#password').val();

      // Summary: Submit form, Log User In, Store Token, Retrieve new stories
      // call login Function - check what that requires
      //      then call retreive all user details
      //            then call displayAllStories again

      this.user.username = usernameInput;
      this.user.password = passwordInput;
      this.user.login(() => {
        this.user.retrieveDetails(() => {
          StoryList.getStories(result => {
            this.storyList = result;
            this.checkForLoggedUser();
          });
        });
      });
    },

    // Logic to check if a token exists / User is logged in
    checkForLoggedUser: function() {
      const token = localStorage.getItem('token');
      const username = localStorage.getItem('username');

      // If user token is found in LocalStorage
      if (token) {
        // logic to hide user-required links on navbar
        $('#submit').show();
        $('#favorites').show();

        this.user.loginToken = token;
        this.user.username = username;
        this.user.retrieveDetails(result => {
          // Create DOM Elements in right side of nav-bar
          const displayName = result.name;
          $('#loginContainer').empty();
          $('#loginContainer')
            .append(
              $('<span>')
                .text(displayName)
                .addClass('mr-2')
            )
            .append(
              $('<button>')
                .text('Logout')
                .addClass('btn btn-dark my-2 my-sm-0')
                .attr('type', 'submit')
                .on('click', () => {
                  // delete Local Storage
                  localStorage.clear();

                  // rerender full stories
                  StoryList.getStories(result => {
                    this.storyList = result;
                    this.checkForLoggedUser();
                  });
                })
            );
        });
      } else {
        // User token does not exist. Create sign in on right side of nav bar

        // logic to hide user-required links on navbar
        $('#submit').hide();
        $('#favorites').hide();

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
                .on('click', this.loginUserSubmission.bind(this))
            )
            .append(
              $('<button>')
                .text('Create User')
                .addClass('btn btn-success my-2 my-sm-0 ml-1')
                .attr('id', 'createuser-button')
                .on('click', event => {
                  event.preventDefault();
                  $('#createuser-form').slideToggle();
                })
            )
        );
      }
    },

    createUserSub: function(event) {
      event.preventDefault();

      // grab values from forms
      const name = $('#create-displayname').val();
      const username = $('#create-username').val();
      const password = $('#create-password').val();

      // submit data to API
      User.create(username, password, name, user => {
        $('#createuser-form').slideUp();
        this.checkForLoggedUser();
        this.displayAllStories();
      });
    },

    addNewStory: function(event) {
      event.preventDefault();

      // grab values from forms
      const title = $('#title').val();
      const author = this.user.name;
      const url = $('#url').val();

      // storyData Payload for API
      const storyDataPayload = {
        title,
        author,
        url
      };

      this.storyList.addStory(this.user, storyDataPayload, response => {
        $('#new-form').slideToggle();
        console.log('addStory succeeded');
        this.user.retrieveDetails(user => {
          console.log('retreive details succeeded');
          setTimeout(1000, this.displayAllStories.bind(this));
          // retreive latest user details - user.ownStories
          //   re-render dom stories

          // TODO: Find a way to re-render DOM to show story right away
        });
      });
    },

    createEventListeners: function() {
      // event listener - crete user submission
      $('#createuser-form').on('submit', this.createUserSub.bind(this));

      // event listener - submit new story to API
      $('#new-form').on('submit', this.addNewStory.bind(this));

      // event listener - parent delegation for stories container
      $('#stories').on('click', '.far, .fas', function(e) {
        $(e.target).toggleClass('far fas');

        // grab story id of parent li target = storyID
        // if - is storyID in userFavorite
        //     if yes, then remove from userFavorite via APi call
        //           then retreive updated details for user via API call

        // else - (storyID is NOT in userFavorites)
        //     run api call to add to userfavorites
        //          retrieve details

        // for each star, which story are we are talking ID
        //    event listener ogic

        //    html element logic
        //      for each story we will need to store the storyID during display
        //      rendering - user favorites - check if storyID is in userFavoriteArray
        //    hide stars when you're not a user logged in
      });
    }
  };

  // event listeners for button elements - global events

  // initial all stories
  domView.checkForLoggedUser();
  domView.displayAllStories();
  domView.createEventListeners();
});
