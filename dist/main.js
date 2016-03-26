// ==UserScript==
// @name        PKI-great-again
// @namespace http://sp7pki.iq24.pl
// @description Make PKI forum great again
// @include     http://sp7pki.iq24.pl/*
// @version     1
// @grant       GM_getValue
// @grant       GM_setValue
// ==/UserScript==

'use strict';

var context = this;
var STORAGE = {
  get: context.GM_getValue ? context.GM_getValue : context.localStorage.getItem.bind(context.localStorage),
  set: context.GM_setValue ? context.GM_setValue : context.localStorage.setItem.bind(context.localStorage)
};
var UTILITY = {
  addGlobalStyle: function addGlobalStyle(css) {
    var head = document.querySelector('head');
    if (!head) {
      return;
    }
    var style = document.createElement('style');
    style.type = 'text/css';
    style.innerHTML = css;
    head.appendChild(style);
  },
  findValueInArray: function findValueInArray(arr, value) {
    var index = arr.findIndex(function (item) {
      return item.indexOf(value) !== -1;
    });
    return arr[index];
  },
  getValueFromEqualsIdPairInHref: function getValueFromEqualsIdPairInHref(hrefText) {
    var userIdNameAndIdArray = hrefText.split('=');
    var userId = userIdNameAndIdArray[userIdNameAndIdArray.length - 1];
    return userId;
  }
};
var NODE_BUILDER = {
  reportLink: function reportLink(templateHref) {
    var a = document.createElement('a');
    a.href = templateHref;
    a.style = 'color:red; float:right;';
    a.textContent = 'Zgłoś ten post.';
    a.className = 'js-report-me-link';
    return a;
  },
  hideAllPostsButton: function hideAllPostsButton(_ref) {
    var userId = _ref.userId;
    var userName = _ref.userName;

    var button = document.createElement('button');
    button.dataset.userId = userId;
    button.dataset.userName = userName;
    button.innerHTML = 'Ukryj wszystkie posty tego użytkownika';
    return button;
  }
};

var USER = {
  getIdFromNode: function getIdFromNode(node) {
    return UTILITY.getValueFromEqualsIdPairInHref(UTILITY.findValueInArray(node.href.split('&'), 'id_usr'));
  },
  hidePost: function hidePost(userNode) {
    var parentEl = userNode.parentNode.parentNode;
    var separatorEl = parentEl.previousSibling;
    var secondSeparator = separatorEl.querySelector('td:nth-of-type(2)');
    var elementsToHide = [parentEl, parentEl.nextSibling];
    secondSeparator.dataset.innerText = secondSeparator.innerText;
    secondSeparator.innerText = 'Kliknij na mnie, żeby zobaczyć post użytkownika ' + userNode.dataset.userName;
    secondSeparator.className = 'bordered-spacer';
    secondSeparator.addEventListener('click', onSeparatorClick, false);
    elementsToHide.forEach(function (node) {
      node.style.display = 'none';
    });
  },
  addHideButton: function addHideButton(_ref2) {
    var userId = _ref2.userId;
    var userName = _ref2.userName;
    var item = _ref2.item;

    var hideAllPostsButton = NODE_BUILDER.hideAllPostsButton({
      userId: userId, userName: userName
    });
    hideAllPostsButton.addEventListener('click', onRemovePostsButtonClick, false);
    item.appendChild(hideAllPostsButton);
  }
};

var currentSiteData = {
  posts: new Map(),
  users: new Map()
};

UTILITY.addGlobalStyle('.bordered-spacer { cursor:pointer; text-align: center; border:1px solid black; }');

var BANNED_USERS_GREASEMONKEY_KEY = '__BANNED_USERS__';
var BANNED_USERS_GREASMONKEY_DELIMITER = 'â„¢';
var bannedUsersString = STORAGE.get(BANNED_USERS_GREASEMONKEY_KEY) || '';
var bannedUsersList = bannedUsersString.split(BANNED_USERS_GREASMONKEY_DELIMITER);

function hideUserPosts(usersId) {
  if (usersId) {
    var usersPosts = Array.from(document.querySelectorAll('a[href$="' + usersId + '"]'));
    usersPosts.forEach(function (userNode) {
      return USER.hidePost(userNode);
    });
  }
}

function onRemovePostsButtonClick(e) {
  var userId = this.dataset.userId;
  if (bannedUsersList.indexOf(userId) === -1) {
    bannedUsersList.push(userId);
    bannedUsersString = bannedUsersList.join(BANNED_USERS_GREASMONKEY_DELIMITER);
  }
  STORAGE.set(BANNED_USERS_GREASEMONKEY_KEY, bannedUsersString);
  hideUserPosts(userId);
  this.removeEventListener('click', onRemovePostsButtonClick);
  this.remove();
  return false;
}

function onSeparatorClick() {
  var parent = this.parentNode;
  var nextSibling = parent.nextSibling;
  nextSibling.style.display = 'table-row';
  nextSibling.nextSibling.style.display = 'table-row';
  this.removeEventListener('click', onSeparatorClick);
  this.innerText = this.dataset.innerText;
  this.className = '';
  this.classList = '';
  return false;
}

// Raporting functionality
var logoutLink = document.querySelector('a[href="default.asp?wyloguj=tak"] > u > b');
// If user is logged in
if (logoutLink) {
  (function () {
    var reportedBy = logoutLink.innerText.replace('wyloguj: ', '');

    var tableRowWithLink = document.querySelectorAll('.tabela_tematow tr:nth-of-type(3n-1) .komentarze_lewy:first-of-type');
    var tableRowsWithoutElectraAds = Array.from(tableRowWithLink).filter(function (x) {
      return !x.querySelector('a[href="czemu.asp"]');
    });

    var splitUrl = window.location.search.split('&');
    var topic = UTILITY.getValueFromEqualsIdPairInHref(UTILITY.findValueInArray(splitUrl, 'temat'));
    var group = UTILITY.getValueFromEqualsIdPairInHref(UTILITY.findValueInArray(splitUrl, 'grupa'));
    var pageNumber = UTILITY.getValueFromEqualsIdPairInHref(UTILITY.findValueInArray(splitUrl, 'nr_str'));

    tableRowsWithoutElectraAds.forEach(function (item) {
      var postId = item.querySelector('a:first-of-type').name;
      var user = item.querySelector('a:last-of-type');
      var userId = USER.getIdFromNode(user);
      var userName = user.querySelector('b').innerText;
      var siteData = {
        postId: postId, userId: userId, userName: userName, item: item
      };
      currentSiteData.posts.set(postId, siteData);
      currentSiteData.users.set(userId, siteData);
      user.dataset.id = userId;
      user.dataset.userName = userName;
      user.dataset.postId = postId;
      USER.addHideButton({
        userId: userId,
        userName: userName,
        item: item
      });

      var templateHref = 'http://sp7pki.iq24.pl/zglos_post.asp?id_komentarza=' + userId + '&temat=' + topic + '&grupa=' + group + '&nr_str=' + pageNumber + '&nick=' + userName + '&zglasza=' + reportedBy;
      var a = NODE_BUILDER.reportLink(templateHref);
      item.appendChild(a);
    });
    bannedUsersList.forEach(function (bannedUser) {
      return hideUserPosts(bannedUser);
    });
  })();
}
