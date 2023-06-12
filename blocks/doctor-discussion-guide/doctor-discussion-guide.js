import { fetchPlaceholders } from '../../scripts/lib-franklin.js';
import { toggleMailMessage, validateEmailProcess } from '../../scripts/utility-functions.js';
import { handlePdfMicroService, handleEmailMicroService } from '../../scripts/micro-service-handlers.js';

const placeholders = await fetchPlaceholders();
let formData = [];

/**
 * Build micro service form.
 * @param {HTMLElement} element
 */
function generateMicroServiceForm(element) {
  const html = `
    <div>
      <p class='no-check-error-message'>${placeholders.discussionguideemailerrormessage}</p>
      <button class='pdf-button'>
          ${placeholders.discussionguidepdfbutton}
      </button>
      <form class='ms-form'>
        <div>
          <input class='email-input' type='text' placeholder='${placeholders.discussionguideemailplaceholder}'>
          <button class='email-button' type='submit'>
            ${placeholders.discussionguideemailbutton}
          </button>
        </div>
        <span class="send-mail-success-message">${placeholders.emailsuccessmessage}</span>
      </form>
    </div>
  `;
  element.insertAdjacentHTML('afterend', html);
}

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
 * Random number with range.
 *
 * @param {number} min
 * @param {number} max
 * @return {number}
 */
function randomNumberRange(min, max) {
  return Math.floor(Math.random() * (max - min + 1) + min);
}

/**
 * Convert list item to checkbox form element.
 *
 * @param {HTMLLIElement[]} list
 * @param {HTMLFormElement} form
 * @param {Number} slideIndex
 */
function generateCheckboxForm(list, form) {
  const number = randomNumberRange(1, 1000);

  [...list.children].forEach((item, index) => {
    const html = `
      <div class='form-item'>
        <input type='checkbox' id='field-${index}-slide-${number}' name='field-${index}-slide-${number}' value='${item.innerHTML}'>
        <label for='field-${index}-slide-${number}'>${item.innerHTML}</label>
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
    // Create form.
    const form = document.createElement('form');
    form.classList.add('data-form');
    generateCheckboxForm(list, form);

    // Replace form.
    list.replaceWith(form);

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

  toggleMailMessage(block, false);

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

  const emailButton = block.querySelector('.email-button');
  const emailInput = block.querySelector('.email-input');
  emailButton.addEventListener('click', async (event) => {
    event.preventDefault();
    const result = validateEmailProcess(emailInput);

    if (!result) {
      return;
    }

    if (formData.length) {
      await handleEmailMicroService(emailInput.value, formData, placeholders, event.target);

      // Show mail success message.
      toggleMailMessage(block);
    } else {
      processErrorStatus(block);
    }
  });

  emailButton.addEventListener('submit', async (event) => {
    event.preventDefault();
    await handlePdfMicroService(formData, placeholders);
  });
}
