import { readBlockConfig } from '../../scripts/lib-franklin.js';
import { fetchBuilderForm, createForm } from '../../scripts/form-buider.js';
import { testSend } from '../../scripts/micro-service-handlers.js';

/**
 * Random number with range.
 *
 * @param {number} min
 * @param {number} max
 * @return {number}
 */
function randomNumberRange(min, max) {
  return Math.floor(Math.random() * (max - min + 1) + min);
}

function renderTable(table, number, blockName) {
  const tableClass = table.querySelector('tbody').firstElementChild.textContent.trim();
  const markup = document.createElement('div');
  markup.classList.add(tableClass);
  [...table.querySelector('tbody').children].forEach((el, index) => {
    if (index) {
      const formItem = document.createElement('div');
      formItem.classList.add('form-item');

      [...el.children].forEach((e, i) => {
        const formElementId = `field-${el.children[1].textContent}-${blockName}-${number}`;

        if (i === 0) {
          const label = document.createElement('label');
          label.textContent = e.textContent;
          label.setAttribute('for', formElementId);
          formItem.append(label);
        } else if (i === 1) {
          const input = document.createElement('input');
          input.type = e.textContent.includes('mail') ? 'email' : 'text';
          input.name = e.textContent;
          input.id = formElementId;
          if (tableClass === 'questions') {
            input.placeholder = '3,000 character limit';
            input.maxLength = 3000;
          }
          formItem.append(input);
        }
      });

      markup.append(formItem);
    }
  });

  table.replaceWith(markup);
}

function renderContainer(container, blockName) {
  const tables = container.querySelectorAll('table');
  const number = randomNumberRange(1, 1000);
  tables.forEach((table) => renderTable(table, number, blockName));

  const form = document.createElement('form');
  form.classList.add('share-your-story-form');
  form.innerHTML = container.innerHTML;
  container.replaceWith(form);
}

/*!
 * Serialize all form data into an array of key/value pairs
 * (c) 2020 Chris Ferdinandi, MIT License, https://gomakethings.com
 * @param {Node} form The form to serialize
 * @return {Array} The serialized form data
 */
function serializeArray(form) {
  let field; let l; const
    s = {};
  if (typeof form === 'object' && form.nodeName === 'FORM') {
    const len = form.elements.length;
    for (let i = 0; i < len; i += 1) {
      field = form.elements[i];
      if (field.name && !field.disabled && field.type !== 'file' && field.type !== 'reset' && field.type !== 'submit' && field.type !== 'button') {
        if (field.type === 'select-multiple') {
          l = form.elements[i].options.length;
          for (let j = 0; j < l; j += 1) {
            if (field.options[j].selected) {
              s[field.name] = field.options[j].value;
            }
          }
        } else if ((field.type !== 'checkbox' && field.type !== 'radio') || field.checked) {
          s[field.name] = field.value;
        }
      }
    }
  }
  return s;
}

/**
 * loads and decorates the share your story
 *
 * @param {Element} block The share your story block element
 */
export default async function decorate(block) {
  const config = readBlockConfig(block);

  const isObjectEmpty = (objectName) => JSON.stringify(objectName) === '{}';

  if (config && config.token) {
    const { token } = config;
    const formDef = await fetchBuilderForm(token);
    block.textContent = '';
    const formSubmit = {
      Field: 'submit',
      Label: 'Submit',
      Placeholder: '',
      Type: 'submit',
      Classes: 'share-your-story-btn',
    };
    block.append(createForm(formDef, formSubmit));

    const shareYourStoryBtn = block.querySelector('.share-your-story-btn');
    const form = block.querySelector('form');
    shareYourStoryBtn.addEventListener('click', async (event) => {
      event.preventDefault();
      // const formData = serializeArray(form);
      // const formData = {
      //   question1: 'question1',
      //   question2: 'question2',
      //   question3: 'question3',
      //   firstname: 'FirstName',
      //   lastname: 'LastName',
      //   phone: '023232323232',
      //   emailaddress: 'thanh.do@ffw.com',
      //   i_meet: 'Yes',
      //   support_program: 'Yes',
      //   cep_id: '160176',
      //   implied_consent: 'NI',
      //   implied_pap_contact_consent: 'Yes',
      // };

      // {
      //   "question1": "question1",
      //   "question2": "question2",
      //   "question3": "question3",
      //   "firstname": "FirstName",
      //   "lastname": "LastName",
      //   "phone": "023232323232",
      //   "emailaddress": "thanh.do@ffw.com",
      //   "i_meet": "Yes",
      //   "support_program": "Yes",
      //   "cep_id": "160176",
      //   "implied_consent": "NI",
      //   "implied_pap_contact_consent": "Yes",
      //   "source_code": "",
      //   "csrfToken": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJjb25maWdUb2tlbiI6InhlbGphbnpfdWF0LXJhLXNoYXJleW91cnN0b3J5LWNvbmZpZyIsImlkIjoiZGQ5MmU4YzZkZjlmOTAxMjBmYjgzOWEyNTYyZWEwNWMiLCJleHAiOjE2ODU1NDkxMjcsImlzcyI6IkRFVCIsImF1ZCI6Imh0dHBzOi8veGVsamFuemNvbS50ZXN0LnBmaXplcnN0YXRpYy5pbyJ9.mytyAzBkHiFh0I0zHKcMuiw-rU55yCwCp8t4esbYi-Y"
      // }

      // const formData = {
      //   "question1": "",
      //   "question2": "",
      //   "question3": "",
      //   "firstname": "",
      //   "lastname": "",
      //   "phone": "",
      //   "emailaddress": "",
      //   "i_meet": "Yes",
      //   "support_program": "Yes",
      //   "cep_id": "160176",
      //   "implied_consent": "NI",
      //   "implied_pap_contact_consent": "Yes",
      // };

      const formData = {
        question1: '',
        question2: '',
        question3: '',
        firstname: '',
        lastname: '',
        phone: '',
        emailaddress: '',
        i_meet: 'Yes',
        support_program: 'Yes',
        cep_id: '160176',
        implied_consent: 'NI',
        implied_pap_contact_consent: 'Yes',
      };

      if (!isObjectEmpty(formData)) {
        const payload = {
          ...formData,
          source_code: '',
          csrfToken: form.getAttribute('data-csrf-token'),
        };
        const test3 = await testSend(payload, form.getAttribute('data-config-token'));
        console.log(test3);
        // console.log('true');
      } else {
        // processErrorStatus(block);
        console.log('false');
      }
    });
  }
}
