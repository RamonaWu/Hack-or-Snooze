"use strict";

// This is the global list of the stories, an instance of StoryList
let storyList;

/** Get and show stories when site first loads. */
//fetch the stories from the server when the page first loads, and render the HTML for each story.
async function getAndShowStoriesOnStart() {
  storyList = await StoryList.getStories();
  $storiesLoadingMsg.remove();

  putStoriesOnPage();
}

/**
 * A render method to render HTML for an individual Story instance
 * - story: an instance of Story
 *
 * Returns the markup for the story.
*/
//create the HTML for each individual story, with options to show delete and favorite buttons depending on the current user's status.
function generateStoryMarkup(story, showDeleteBtn = false) {
  // console.debug("generateStoryMarkup", story);

  const hostName = story.getHostName();
  const showStar = Boolean(currentUser);
  const deleteBtnHtml = showDeleteBtn ? getDeleteBtnHTML() : ''; //calling the getDeleteBtnHTML function if showDeleteBtn is true
  const starHtml = showStar ? getStarHTML(story, currentUser) : '';//calling the getStarHTML function if showStar is true

  return $(`
      <li id="${story.storyId}">
        ${deleteBtnHtml}
        ${starHtml}
        <a href="${story.url}" target="a_blank" class="story-link">
          ${story.title}
        </a>
        <small class="story-hostname">(${hostName})</small>
        <small class="story-author">by ${story.author}</small>
        <small class="story-user">posted by ${story.username}</small>
      </li>
  `);
  
}
$("#myStories").css({
  "list-style-type": "none",
});

/** Make delete button HTML for story */
function getDeleteBtnHTML() {
  return `
      <span class="trash-can">
        <i class="fas fa-trash-alt"></i>
      </span>`;
}

/** Make favorite/not-favorite star for story */
function getStarHTML(story, user) {
  const isFavorite = user.isFavorite(story);
  const starType = isFavorite ? "fas" : "far";
  return `
      <span class="star">
        <i class="${starType} fa-star"></i>
      </span>`;
}


/** Gets list of stories from server, generates their HTML, and puts on page. */
function putStoriesOnPage() {
  console.debug("putStoriesOnPage");

  $allStoriesList.empty();

  // loop through all of our stories and generate HTML for them
  for (let story of storyList.stories) {
    const $story = generateStoryMarkup(story);
    $allStoriesList.append($story);
  }

  $allStoriesList.show();
}

/** Handle deleting a story. */
// finds the ID of the story to be deleted and remove the story from the server.
async function deleteStory (evt) {
  console.debug("deleteStory");

  const $closestLi = $(evt.target).closest("li");
  const storyId = $closestLi.attr("id");
  await storyList.removeStory(currentUser, storyId);
  await putUserStoriesOnPage();
}
$("#myStories").on("click", ".trash-can", deleteStory);

// handle submit new story on page
// gets the input values for the new story, adds the story to the server
async function submitNewStory (evt) {
  console.debug("submitNewStory");
  evt.preventDefault();

  const author = $("#create-author").val();
  const title = $("#create-title").val();
  const url = $("#create-url").val();
  const username = currentUser.username;
  const storyData = {title, url, author, username};

  const story = await storyList.addStory(currentUser, storyData);

  const $story = generateStoryMarkup(story);
  $allStoriesList.append($story);

  $("#submit-form").hide();
  $("#submit-form").trigger("reset");
}

$("#submit-form").on("submit", submitNewStory);



// put user's stories on page
// display the stories that the current user has posted. 
function putUserStoriesOnPage () {
  console.debug("putUserStoriesOnPage");

  $("#myStories").empty();

  if(currentUser.ownStories.length === 0) {
    $("#myStories").append("No stories! ")
  } else {
    for (let story of currentUser.ownStories) {
      let $story = generateStoryMarkup(story, true); // set showDeleteBtn to true
      $("#myStories").append($story);
    }
  }
  $("#myStories").show();
}

// only put favorites stories on page
// display the stories that the current user has favorited.
function putFavoritesListOnPage () {
  console.debug("putFavoritesListOnPage");
  $("#favoriteStories").empty();

  if(currentUser.favorites.length === 0) {
    $("#favoriteStories").append("No favorites! ")
  } else {
    for (let story of currentUser.favorites) {
      let $story = generateStoryMarkup(story);
      $("#favoriteStories").append($story);
    }
  }
  $("#favoriteStories").show();
  
}

// handle “favorite” and “un-favorite” a story
// finds the ID of the story to be toggled, gets the corresponding Story object. toggles the star icon to reflect the new favorite status.
async function toggleFavoriteStory(evt) {
  console.debug("toggleFavoriteStory");

  const $tgt = $(evt.target);
  const $closestLi = $tgt.closest("li");
  const storyId = $closestLi.attr("id");
  const story = storyList.stories.find(s => s.storyId === storyId);

  if ($tgt.hasClass("fas")) {
    await currentUser.removeFavorite(story);
    $tgt.closest("i").toggleClass("fas far");
  } else {
    await currentUser.addFavorite(story);
    $tgt.closest("i").toggleClass("far fas");
  }
}
$(".stories-list").on("click", ".star", toggleFavoriteStory);