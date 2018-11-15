var user;
User.create(
  `testing${Math.floor(Math.random() * 10000)}`,
  `testing${Math.floor(Math.random() * 10000)}`,
  `testing${Math.floor(Math.random() * 10000)}`,
  function(newUser) {
    // this should be object containing newly created user
    user = newUser;
    console.log(user);
  }
);

// using the `user` variable from above:
user.login(function(data) {
  // should be object containing user info along with loginToken
  console.log(data);
});

user.retrieveDetails(function(response) {
  console.log(response); // this should be the user
});

var storyList;
StoryList.getStories(function(response) {
  storyList = response;
});
// should be instance of StoryList class.
// It should have a property called stories which is an array of Story instances.
console.log(storyList);

var newStoryData = {
  title: 'testing again',
  author: 'A Rithm Instructor',
  url: 'https://www.rithmschool.com'
};
storyList.addStory(user, newStoryData, function(response) {
  // should be array of all stories including new story
  console.log(response);
  // should be array of all stories written by user
  console.log(user.stories);
});

// using the `user` and `storyList` variables from above:
var firstStory = user.ownStories[0];

storyList.removeStory(user, firstStory.storyId, function(response) {
  console.log(response); // this will contain an empty list of stories
});
