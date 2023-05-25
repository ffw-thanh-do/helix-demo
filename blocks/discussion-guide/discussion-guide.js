import { fetchPlaceholders } from '../../scripts/lib-franklin.js';
import { handlePdfMicroService } from './micro-service-handlers.js';

const placeholders = await fetchPlaceholders();
let formData = [];

/**
 * Updated form data function.
 *
 * @param {Element} block
 */
function updateFormData(formsWrapper) {
  const form = formsWrapper.querySelector('.data-form');
  formData = [];

  const inputs = form.querySelectorAll('input[type="checkbox"]:checked');
  inputs.forEach((input, index) => {
    const value = input.value.replace(/  +/g, ' ').trim();
    formData[index] = value;
  });
}

/**
 * Build micro service form.
 * @param {HTMLElement} element
 */
function generateMicroServiceForm(element) {
  const html = `
    <div>
      <p class='no-check-error-message'>${placeholders.discussionguideemailerrormessage}</p>
      <button id='pdfButton' class='pdf-button'>
          ${placeholders.discussionguidepdfbutton}
      </button>
      <form class='ms-form'>
        <input id='emailInput' type='text' placeholder='${placeholders.discussionguideemailplaceholder}'>
        <button id='emailButton' type='submit'>
          ${placeholders.discussionguideemailbutton}
        </button>
      </form>
    </div>
  `;
  element.insertAdjacentHTML('afterend', html);
}

/**
 * Convert list item to checkbox form element.
 *
 * @param {HTMLLIElement[]} itemsArray
 * @param {HTMLFormElement} form
 * @param {Number} slideIndex
 */
function generateCheckboxForm(itemsArray, form, slideIndex) {
  itemsArray.forEach((item, index) => {
    const html = `
      <div class='form-item'>
        <input type='checkbox' id='field${index}slide${slideIndex}' name='field${index}' value='${item.innerHTML}'>
        <label for='field${index}slide${slideIndex}'>${item.innerHTML}</label>
      </div>`;
    form.insertAdjacentHTML('beforeend', html);
  });
}

/**
 * Build the form markup.
 *
 * @param {HTMLElement} container
 */
function renderContainer(container) {
  const list = container.querySelector('ul');
  if (list) {
    const form = document.createElement('form');
    form.classList.add('data-form');
    const items = list.querySelectorAll('li');
    const itemsArray = Array.from(items);
    list.replaceWith(form);
    generateCheckboxForm(itemsArray, form, 0);

    // Build form service.
    generateMicroServiceForm(container);
  }
}

/**
 * Process Error Status.
 *
 * @param {Element} block
 * @param {Boolean} isAdd
 */
function processErrorStatus(block, isAdd = true) {
  const noCheckError = block.querySelector('.no-check-error-message');
  const checkboxes = block.querySelectorAll('input[type="checkbox"]');
  const showFlag = 'show';
  const errorFlag = 'error';

  if (isAdd) {
    noCheckError.classList.add(showFlag);
    for (let i = 0; i < checkboxes.length; i += 1) {
      checkboxes[i].parentNode.classList.add(errorFlag);
    }
  } else {
    noCheckError.classList.remove(showFlag);
    for (let i = 0; i < checkboxes.length; i += 1) {
      checkboxes[i].parentNode.classList.remove(errorFlag);
    }
  }
}

/**
 * Action when checkbox form element change.
 *
 * @param {EventTarget} element
 * @param {Element} block
 */
function updateCheckboxes(element, block) {
  const parentLabel = element.parentNode;

  processErrorStatus(block, false);

  if (element.checked) {
    parentLabel.classList.add('checked');
  } else {
    parentLabel.classList.remove('checked');
  }
  updateFormData(block);
}

/**
 * loads and decorates the discusssion guide
 *
 * @param {Element} block The discusssion guide block element
 */
export default async function decorate(block) {
  const container = block.firstElementChild;
  renderContainer(container);

  const checkboxes = block.querySelectorAll('input[type="checkbox"]');
  for (let i = 0; i < checkboxes.length; i += 1) {
    checkboxes[i].addEventListener('change', (e) => updateCheckboxes(e.target, block));
  }

  const pdfButton = block.querySelector('.pdf-button');
  pdfButton.addEventListener('click', async (event) => {
    event.preventDefault();

    if (formData.length) {
      await handlePdfMicroService(formData, placeholders);
    } else {
      processErrorStatus(block);
    }
  });
}
