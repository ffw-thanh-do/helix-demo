import { fetchPlaceholders } from '../../scripts/lib-franklin.js';
import { toggleMailMessage, validateEmailProcess } from '../../scripts/utility-functions.js';
import { handleEmailMicroServiceGlobal } from '../../scripts/micro-service-handlers.js';

const placeholders = await fetchPlaceholders();

/**
 * Build micro service form.
 * @param {HTMLElement} element
 */
function generateMicroServiceForm(element) {
  const html = `
    <div>
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
 * loads and decorates the discusssion guide
 *
 * @param {Element} block The discusssion guide block element
 */
export default async function decorate(block) {
  const viewLink = block.querySelector('ul a');

  if (viewLink) {
    // Build form service.
    generateMicroServiceForm(viewLink);
  }

  const emailButton = block.querySelector('.email-button');
  const emailInput = block.querySelector('.email-input');
  emailButton.addEventListener('click', async (event) => {
    event.preventDefault();

    const result = validateEmailProcess(emailInput);

    if (!result) {
      return;
    }

    toggleMailMessage(block);

    await handleEmailMicroServiceGlobal(emailInput.value, placeholders, event.target);
  });
}
