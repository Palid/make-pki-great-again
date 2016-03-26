'use strict';

function findValueInArray(arr, value) {
    const index = arr.findIndex((item) => {
    return item.indexOf(value) !== -1
  });
  return arr[index];
}

function getValueFromEqualsIdPairInHref(hrefText) {
  const userIdNameAndIdArray = hrefText.split('=');
  const userId = userIdNameAndIdArray[userIdNameAndIdArray.length - 1];
  return userId;
}

const logoutLink = document.querySelector('a[href="default.asp?wyloguj=tak"] > u > b');
// If user is logged in
if (logoutLink) {
  const reportedBy = logoutLink.innerText.replace('wyloguj: ', '');

  const tableRowWithLink = document.querySelectorAll('.tabela_tematow tr:nth-of-type(3n-1) .komentarze_lewy:first-of-type');
  const tableRowsWithoutElectraAds = Array.from(tableRowWithLink).filter((x) => !x.querySelector('a[href="czemu.asp"]'));

  const splitUrl = window.location.search.split('&');
  const topic = getValueFromEqualsIdPairInHref(findValueInArray(splitUrl, 'temat'));
  const group = getValueFromEqualsIdPairInHref(findValueInArray(splitUrl, 'grupa'));
  const pageNumber = getValueFromEqualsIdPairInHref(findValueInArray(splitUrl, 'nr_str'));

  tableRowsWithoutElectraAds.forEach((item) => {
    const postId = item.querySelector('a:first-of-type').href;
    const user = item.querySelector('a:last-of-type');
    const userId = getValueFromEqualsIdPairInHref(findValueInArray(user.href.split('&'), 'id_usr'));
    const userName = user.querySelector('b').innerText;

    const templateHref = `http://sp7pki.iq24.pl/zglos_post.asp?id_komentarza=${userId}&temat=${topic}&grupa=${group}&nr_str=${pageNumber}&nick=${userName}&zglasza=${reportedBy}`
    const a = document.createElement('a');
    a.href = templateHref;
    a.style = 'color:red; float:right;';
    a.textContent = 'Zgłoś ten post.';
    a.className = 'js-report-me-link';
    item.appendChild(a);
  });
}
