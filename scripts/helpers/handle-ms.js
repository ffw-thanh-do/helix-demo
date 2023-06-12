import { validateEmail } from './validate-form.js';

/**
 * Post to microservices with csrfToken.
 *
 * @param {object} payload
 * @param {string} requestUrl
 * @param {string} token
 * @param {function} successFunc
 * @param {function} errorFunc
 */
async function sendMsData(payload, requestUrl, token, successFunc, errorFunc) {
  fetch(requestUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Config-Token': token,
    },
    body: JSON.stringify(payload),
  })
    .then((response) => response.json())
    .then((data) => {
      // eslint-disable-next-line no-console
      console.log('The microservice sent successfully');
      if (typeof successFunc === 'function') {
        successFunc(data);
      }
    })
    .catch((error) => {
      // eslint-disable-next-line no-console
      console.error('Something went wrong with the get request:', error);
      if (typeof successFunc === 'function') {
        errorFunc(error);
      }
    });
}

/**
 * Get to microservices to get csrfToken.
 *
 * @param {object} payload
 * @param {string} requestUrl
 * @param {string} token
 * @param {function} successFunc
 * @param {function} errorFunc
 */
export async function sendMs(payload, requestUrl, token, successFunc, errorFunc) {
  fetch(requestUrl, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'X-Config-Token': token,
    },
  })
    .then((response) => response.json())
    .then((data) => {
      payload.csrfToken = data.data.csrfToken;
      sendMsData(payload, requestUrl, token, successFunc, errorFunc);
    })
    .catch((error) => {
      // eslint-disable-next-line no-console
      console.error('Something went wrong with the get request:', error);
      if (typeof successFunc === 'function') {
        errorFunc(error);
      }
    });
}

export function validateMsMail(parent) {
  const errorFlag = 'error';
  const input = parent.querySelector('.ms-actions-mail-input');
  const submit = parent.querySelector('.ms-actions-mail-submit');

  input.addEventListener('keyup', () => {
    const isValidate = validateEmail(input.value);
    if (isValidate === true) {
      input.classList.remove(errorFlag);
      submit.classList.remove(errorFlag);
    } else {
      input.classList.add(errorFlag);
      submit.classList.add(errorFlag);
    }
  });
}
