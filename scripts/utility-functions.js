export function validateEmail(email) {
  const emailReg = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return emailReg.test(email);
}

/**
 * Toggle mail message display.
 *
 * @param {Element} block
 * @param {Boolean} isShow
 */
export function toggleMailMessage(block, isShow = true) {
  const mailSuccessMessage = block.querySelector('.send-mail-success-message');
  const mailMessageSibling = mailSuccessMessage.parentElement.querySelector('div');
  const hideFlag = 'hide';
  const showFlag = 'show';

  if (isShow) {
    mailMessageSibling.classList.add(hideFlag);
    mailSuccessMessage.classList.add(showFlag);
  } else {
    mailMessageSibling.classList.remove(hideFlag);
    mailSuccessMessage.classList.remove(showFlag);
  }
}

/**
 * Validate Email Process.
 *
 * @param {Element} emailInput
 *
 * @return {boolean}
 */
export function validateEmailProcess(emailInput) {
  const errorFlag = 'error';
  const email = emailInput.value;
  let pass = false;

  if (!validateEmail(email) || email.length === 0 || email.length >= 120) {
    emailInput.classList.add(errorFlag);
  } else {
    emailInput.classList.remove(errorFlag);
    pass = true;
  }

  return pass;
}
