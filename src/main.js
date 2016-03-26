// ==UserScript==
// @name        PKI-great-again
// @namespace http://sp7pki.iq24.pl
// @description Make PKI forum great again
// @include     http://sp7pki.iq24.pl/
// @version     1
// @grant       GM_getValue
// @grant       GM_setValue
// ==/UserScript==

'use strict';

const context = this;
const STORAGE = {
  get: context.GM_getValue ? context.GM_getValue : context.localStorage.getItem.bind(context.localStorage),
  set: context.GM_setValue ? context.GM_setValue : context.localStorage.setItem.bind(context.localStorage)
};
const UTILITY = {
  addGlobalStyle(css) {
    const head = document.querySelector('head');
    if (!head) {
      return;
    }
    const style = document.createElement('style');
    style.type = 'text/css';
    style.innerHTML = css;
    head.appendChild(style);
  },
  findValueInArray(arr, value) {
    const index = arr.findIndex((item) => {
      return item.indexOf(value) !== -1;
    });
    return arr[index];
  },
  getValueFromEqualsIdPairInHref(hrefText) {
    const userIdNameAndIdArray = hrefText.split('=');
    const userId = userIdNameAndIdArray[userIdNameAndIdArray.length - 1];
    return userId;
  }
};
const NODE_BUILDER = {
  reportLink(templateHref) {
    const a = document.createElement('a');
    a.href = templateHref;
    a.style = 'color:red; float:right;';
    a.textContent = 'Zgłoś ten post.';
    a.className = 'js-report-me-link';
    return a;
  },
  hideAllPostsButton({userId, userName}) {
    const button = document.createElement('button');
    button.dataset.userId = userId;
    button.dataset.userName = userName;
    button.innerHTML = 'Ukryj wszystkie posty tego użytkownika';
    return button;
  }
};

const USER = {
  getIdFromNode(node) {
    return UTILITY.getValueFromEqualsIdPairInHref(UTILITY.findValueInArray(node.href.split('&'), 'id_usr'));
  },
  hidePost(userNode) {
    const parentEl = userNode.parentNode.parentNode;
    const separatorEl = parentEl.previousSibling;
    const secondSeparator = separatorEl.querySelector('td:nth-of-type(2)');
    const elementsToHide = [parentEl, parentEl.nextSibling];
    secondSeparator.dataset.innerText = secondSeparator.innerText;
    secondSeparator.innerText = `Kliknij na mnie, żeby zobaczyć post użytkownika ${userNode.dataset.userName}`;
    secondSeparator.className = 'bordered-spacer';
    secondSeparator.addEventListener('click', onSeparatorClick, false);
    elementsToHide.forEach((node) => {
      node.style.display = 'none';
    });
  },
  addHideButton({userId, userName, item}) {
    const hideAllPostsButton = NODE_BUILDER.hideAllPostsButton({userId, userName});
    hideAllPostsButton.addEventListener('click', onRemovePostsButtonClick, false);
    item.appendChild(hideAllPostsButton);
  }
};

const currentSiteData = {
  posts: new Map(),
  users: new Map()
};

UTILITY.addGlobalStyle('.bordered-spacer { cursor:pointer; text-align: center; border:1px solid black; }');

const BANNED_USERS_GREASEMONKEY_KEY = '__BANNED_USERS__';
const BANNED_USERS_GREASMONKEY_DELIMITER = 'â„¢';
let bannedUsersString = STORAGE.get(BANNED_USERS_GREASEMONKEY_KEY) || '';
const bannedUsersList = bannedUsersString.split(BANNED_USERS_GREASMONKEY_DELIMITER);

function hideUserPosts(usersId) {
  if (usersId) {
    var usersPosts = Array.from(document.querySelectorAll(`a[href$="${usersId}"]`));
    usersPosts.forEach(userNode => USER.hidePost(userNode));
  }
}


function onRemovePostsButtonClick(e) {
  const userId = this.dataset.userId;
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
  const parent = this.parentNode;
  const nextSibling = parent.nextSibling;
  nextSibling.style.display = 'table-row';
  nextSibling.nextSibling.style.display = 'table-row';
  this.removeEventListener('click', onSeparatorClick);
  this.innerText = this.dataset.innerText;
  this.className = '';
  this.classList = '';
  return false;
}

// Raporting functionality
const logoutLink = document.querySelector('a[href="default.asp?wyloguj=tak"] > u > b');
// If user is logged in
if (logoutLink) {
  const reportedBy = logoutLink.innerText.replace('wyloguj: ', '');

  const tableRowWithLink = document.querySelectorAll('.tabela_tematow tr:nth-of-type(3n-1) .komentarze_lewy:first-of-type');
  const tableRowsWithoutElectraAds = Array.from(tableRowWithLink).filter((x) => !x.querySelector('a[href="czemu.asp"]'));

  const splitUrl = window.location.search.split('&');
  const topic = UTILITY.getValueFromEqualsIdPairInHref(UTILITY.findValueInArray(splitUrl, 'temat'));
  const group = UTILITY.getValueFromEqualsIdPairInHref(UTILITY.findValueInArray(splitUrl, 'grupa'));
  const pageNumber = UTILITY.getValueFromEqualsIdPairInHref(UTILITY.findValueInArray(splitUrl, 'nr_str'));

  bannedUsersList.forEach(bannedUser => hideUserPosts(bannedUser));
  tableRowsWithoutElectraAds.forEach((item) => {
    const postId = item.querySelector('a:first-of-type').name;
    const user = item.querySelector('a:last-of-type');
    const userId = USER.getIdFromNode(user);
    const userName = user.querySelector('b').innerText;
    const siteData = {postId, userId, userName, item};
    currentSiteData.posts.set(postId, siteData);
    currentSiteData.users.set(userId, siteData);
    user.dataset.id = userId;
    user.dataset.userName = userName;
    user.dataset.postId = postId;
    USER.addHideButton({
      userId,
      userName,
      item,
    });

    const templateHref = `http://sp7pki.iq24.pl/zglos_post.asp?id_komentarza=${userId}&temat=${topic}&grupa=${group}&nr_str=${pageNumber}&nick=${userName}&zglasza=${reportedBy}`;
    const a = NODE_BUILDER.reportLink(templateHref);
    item.appendChild(a);
  });
}
