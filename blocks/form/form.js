import { getMetadata, readBlockConfig } from '../../scripts/lib-franklin.js';

const FORMS_API_ENDPOINT = 'https://ms-forms-service-uat.digitalpfizer.com/api/v2/forms';

const validFields = {};
let isError = false;

async function formsApiRequest(token, method = 'GET', payload = null) {
  const headers = new Headers();
  headers.append('x-config-token', token);
  const response = await fetch(FORMS_API_ENDPOINT, {
    method,
    headers,
    body: payload,
  });
  return response;
}

export async function fetchBuilderForm(token) {
  const resp = await formsApiRequest(token);
  if (resp.status === 200) {
    const json = await resp.json();
    const formDef = {
      submitTo: FORMS_API_ENDPOINT,
      configToken: token,
      csrfToken: json.data.csrfToken,
    };
    formDef.data = json.data.fields.map((fd) => {
      if (fd.id === 'submit') {
        return {
          Field: 'submit',
          Label: 'Submit',
          Placeholder: '',
          Type: 'submit',
          Format: '',
          Required: '',
          Options: '',
          Rules: '',
          Extra: '/forms/thank-you',
        };
      }
      let isRequired = false;
      let validatorsArray = [];
      let requiredMessage = '';
      if (fd.validators) {
        if (fd.validators.find((obj) => obj.type === 'required')) {
          isRequired = true;
          requiredMessage = fd.validators.find((obj) => obj.type === 'required').message;
          const filtered = fd.validators.filter((el) => el.type !== 'required');
          validatorsArray = filtered;
        }
      }
      return {
        Field: fd.name,
        Label: fd.label,
        Type: fd.type,
        Value: fd.value,
        Required: isRequired,
        RequiredMessage: requiredMessage,
        Placeholder: fd.placeholder || '',
        Validators: validatorsArray,
        Options: fd.options ?? {},
      };
    });
    return (formDef);
  }
  return { error: `Error loading webform: ${token}` };
}

function constructPayload(form) {
  const payload = {};
  [...form.elements].forEach((fe) => {
    if (fe.type === 'checkbox') {
      if (fe.checked) payload[fe.id] = fe.value;
    } else if (fe.id) {
      payload[fe.id] = fe.value;
    }
  });
  return payload;
}

async function submitForm(form) {
  const submitWrapper = document.querySelector('.form-submit-wrapper');
  const errorMessage = submitWrapper.querySelector('.required-error-message');
  if (Object.values(validFields).includes(false)) {
    if (!errorMessage) {
      submitWrapper.style.display = 'block';
    } else {
      errorMessage.style.display = 'block';
    }
    return Promise.resolve();
  }
  if (errorMessage) {
    errorMessage.style.display = 'none';
  }

  const payload = constructPayload(form);
  const { csrfToken, configToken } = form.dataset;
  payload.csrfToken = csrfToken;
  const resp = await fetch(form.dataset.action, {
    method: 'POST',
    cache: 'no-cache',
    headers: {
      'Content-Type': 'application/json',
      'x-config-token': configToken,
    },
    body: JSON.stringify(csrfToken ? payload : { data: payload }),
  });
  const message = await resp.text();
  return Promise.resolve({
    success: resp.status < 400,
    status: resp.status,
    message,
  });
}

function createButton(fd) {
  const button = document.createElement('button');
  const formHeading = document.querySelector('h2#sign-up-to-be-the-first-to-know');
  button.textContent = fd.Label;
  button.classList.add('button');
  button.setAttribute('disabled', '');
  button.type = fd.Type;
  if (fd.Type === 'submit') {
    button.addEventListener('click', async (event) => {
      const form = button.closest('form');
      if (form.checkValidity()) {
        event.preventDefault();
        button.setAttribute('disabled', '');
        const submission = await submitForm(form);

        if (!submission) return;

        if (submission.success) {
          const redirectTo = fd.Extra;
          const resp = await fetch(`${redirectTo}.plain.html`);
          const html = await resp.text();
          const container = form.closest('.section');
          container.outerHTML = html;
          formHeading.style.display = 'none';
        } else {
          // eslint-disable-next-line no-alert
          window.alert(submission.message);
        }
      }
    });
  }
  return button;
}

function createHeading(fd) {
  const heading = document.createElement('h3');
  heading.textContent = fd.Label;
  return heading;
}

function regexValidation(fd, regex, inputField, validator) {
  const inputLabel = inputField.parentNode.parentNode.querySelector('label');
  const submitWrapper = document.querySelector('.form-submit-wrapper');
  const submitWrapperChildren = Array.from(submitWrapper.children);
  const errorMessage = document.createElement('p');
  errorMessage.classList.add('error-message');
  if (!regex.test(inputField.value)) {
    inputLabel.classList.add('input-error');
    inputField.classList.add('input-error');

    let found = false;

    for (let i = 0; i < submitWrapperChildren.length; i += 1) {
      const child = submitWrapperChildren[i];
      if (child.dataset.field === fd.Field && child.dataset.validator === validator.type) {
        child.style.display = 'block';
        found = true;
      }
    }
    if (!found && validator.type === 'email') {
      errorMessage.dataset.validator = validator.type;
      errorMessage.dataset.field = fd.Field;
      errorMessage.innerHTML = validator.message;
      errorMessage.style.display = 'block';
      submitWrapper.insertBefore(errorMessage, submitWrapper.lastChild);
    }
    isError = true;
  } else {
    isError = false;
  }
}

function updateButton() {
  const form = document.querySelector('form');
  const button = form.querySelector('button[type="submit"]');
  if (button) {
    if (form.checkValidity() && !Object.values(validFields).includes(false)) {
      button.removeAttribute('disabled', '');
    } else {
      button.setAttribute('disabled', '');
    }
  }
}

function validateInput(e, fd) {
  const inputField = e.target;
  const inputLabel = inputField.parentNode.parentNode.querySelector('label');
  const requiredMessage = document.querySelector('.required-error-message');
  let showRequiredMessage = false;

  inputField.setAttribute('value', inputField.value);

  // Reset error UI
  inputLabel.classList.remove('input-error');
  inputField.classList.remove('input-error');
  Array.from(document.querySelectorAll(`[data-field='${fd.Field}']`)).forEach((element) => { element.style.display = 'none'; });

  Array.from(document.querySelector('form').elements).forEach((input) => {
    if (((input.value === '' && input.type !== 'submit') || (input.type === 'checkbox' && !input.checked)) && !showRequiredMessage) {
      showRequiredMessage = true;
    }
  });

  // Check and validate required field
  if ((fd.Required && !inputField.value) || (fd.Required && fd.Type === 'checkbox' && !inputField.checked)) {
    requiredMessage.style.display = 'block';
    isError = true;
    validFields[fd.Field] = false;
    updateButton();
    if (fd.Type === 'checkbox') return;
    inputLabel.classList.add('input-error');
    inputField.classList.add('input-error');
    return;
  }

  if (fd.Required && fd.Type === 'checkbox' && inputField.checked) {
    isError = false;
    validFields[fd.Field] = true;
  }

  if ((fd.Required && inputField.value) || ((fd.Required && fd.Type === 'checkbox' && !fd.checked) && !showRequiredMessage)) {
    requiredMessage.style.display = 'none';
  }

  const inputFirstName = document.getElementById('first_name');
  const inputLastName = document.getElementById('last_name');
  const inputEmail = document.getElementById('email');
  const checkboxHcp = document.getElementById('is_hcp');
  const checkboxProductInfo = document.getElementById('to_receive_production_information');

  if (inputFirstName.value.trim() === '' || inputLastName.value.trim() === '' || inputEmail.value.trim() === '' || !checkboxHcp.checked || !checkboxProductInfo.checked) {
    requiredMessage.style.display = 'block';
  }

  // Check and validate other rules
  if (fd.Validators.length > 0) {
    const errorMessage = document.createElement('p');
    errorMessage.classList.add('error-message');

    const alphaRegex = /^[A-Za-z]+$/;
    const nameRegex = /^[a-zA-Z\s,.'\-\pL]{2,}$/;
    const emailRegex = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

    fd.Validators.forEach((validator) => {
      switch (validator.type) {
        case 'alpha':
          regexValidation(fd, alphaRegex, inputField, validator);
          break;
        case 'name':
          regexValidation(fd, nameRegex, inputField, validator);
          break;
        case 'email':
          regexValidation(fd, emailRegex, inputField, validator);
          break;
        default:
          break;
      }
    });
  }

  // Update the error tracking object
  if (isError) {
    validFields[fd.Field] = false;
  } else {
    validFields[fd.Field] = true;
  }

  updateButton();
}

function createInput(fd) {
  const inputContainer = document.createElement('div');
  inputContainer.classList.add('input-container');

  const input = document.createElement('input');

  let clearIcon;
  if (fd.Type !== 'checkbox') {
    clearIcon = document.createElement('div');
    clearIcon.setAttribute('focusable', 'false');
    clearIcon.classList.add('clear-icon');
    clearIcon.addEventListener('mousedown', (e) => {
      e.preventDefault();
    });
    clearIcon.addEventListener('click', () => {
      if (input.value !== '') {
        input.value = '';
      }
      input.focus();
    });
  }

  input.type = fd.Type;
  input.id = fd.Field;
  input.setAttribute('placeholder', fd.Placeholder);

  if (fd.Required === true) {
    input.setAttribute('required', 'required');
  }

  inputContainer.append(input);

  if (clearIcon !== undefined) {
    inputContainer.append(clearIcon);
  }

  if (fd.Value) input.value = fd.Value;

  if (input.type === 'checkbox') {
    input.addEventListener('click', (e) => validateInput(e, fd));
  } else {
    input.addEventListener('blur', (e) => validateInput(e, fd));
  }
  return inputContainer;
}

function createLabel(fd) {
  const label = document.createElement('label');
  label.setAttribute('for', fd.Field);
  label.textContent = fd.Label;
  if (fd.Required === true) {
    label.classList.add('required');
  }
  return label;
}

function createRadio(fd) {
  const radiosContainer = document.createElement('div');
  radiosContainer.classList.add('radios-container');

  for (let index = 0; index < fd.Options.length; index += 1) {
    const inputContainer = document.createElement('div');
    inputContainer.classList.add('input-container');
    const input = document.createElement('input');
    const id = `${fd.Field}-${fd.Options[index].value}`.replace('_', '-').toLowerCase();
    input.type = fd.Type;
    input.id = id;
    input.value = fd.Options[index].value;
    input.name = fd.Field;
    inputContainer.append(input);

    const labelInfo = {
      Field: id,
      Label: fd.Options[index].label,
    };
    inputContainer.append(createLabel(labelInfo));

    radiosContainer.append(inputContainer);
  }

  return radiosContainer;
}

async function fetchSpreadsheetForm(formURL) {
  const { pathname } = new URL(formURL);
  const resp = await fetch(pathname);
  const json = await resp.json();
  [json.submitTo] = pathname.split('.json');
  return json;
}

export function createForm(formDefinition) {
  const form = document.createElement('form');
  const rules = [];
  // eslint-disable-next-line prefer-destructuring
  form.dataset.action = formDefinition.submitTo;
  form.dataset.csrfToken = formDefinition.csrfToken;
  form.dataset.configToken = formDefinition.configToken;
  formDefinition.data.forEach((fd) => {
    fd.Type = fd.Type || 'text';
    const fieldWrapper = document.createElement('div');
    const style = fd.Style ? ` form-${fd.Style}` : '';
    const fieldId = `form-${fd.Type}-wrapper${style}`;
    fieldWrapper.className = fieldId;
    fieldWrapper.classList.add('field-wrapper');
    switch (fd.Type) {
      case 'heading':
        fieldWrapper.append(createHeading(fd));
        break;
      case 'checkbox':
        fieldWrapper.append(createInput(fd));
        fieldWrapper.append(createLabel(fd));
        break;
      case 'submit':
        fieldWrapper.append(createButton(fd));
        break;
      case 'hidden':
        fieldWrapper.append(createInput(fd));
        break;
      case 'radio':
        fieldWrapper.append(createRadio(fd));
        break;
      default:
        fieldWrapper.append(createLabel(fd));
        fieldWrapper.append(createInput(fd));
    }

    if (fd.Rules) {
      try {
        rules.push({ fieldId, rule: JSON.parse(fd.Rules) });
      } catch (e) {
        // eslint-disable-next-line no-console
        console.warn(`Invalid Rule ${fd.Rules}: ${e}`);
      }
    }
    form.append(fieldWrapper);
  });
  return (form);
}

export default async function decorate(block) {
  const getFormsEnv = () => {
    const params = new URLSearchParams(window.location.search);
    if (params.has('forms-env')) return params.get('forms-env');
    if (window.location.pathname.startsWith('/drafts/')) return 'wd';
    if (window.location.hostname.endsWith('.page') || window.location.hostname.endsWith('.live') || window.location.hostname === 'localhost') return 'review';
    return 'live';
  };

  const adjustConfigToken = (token) => {
    const env = getFormsEnv();

    // temporary fix for broken forms that don't support wd, review and live
    if (token.includes('__413__')) return token;

    if (token.endsWith('__wd')) {
      return `${token.substr(0, token.length - 4)}__${env}`;
    }
    return token;
  };

  let formDef;
  const config = readBlockConfig(block);

  if (config && config['webform-config-token']) {
    const token = adjustConfigToken(config['webform-config-token']);
    block.textContent = '';
    formDef = await fetchBuilderForm(token);
  } else {
    const form = block.querySelector('a[href$=".json"]');
    if (form) formDef = await fetchSpreadsheetForm(form.href);
    block.textContent = '';
  }

  if (formDef) {
    // Populate the error tracking object
    for (let i = 0; i < formDef.data.length; i += 1) {
      const key = formDef.data[i].Field;
      validFields[key] = true;
    }

    if (formDef.error) {
      block.textContent = formDef.error;
    } else {
      block.append(createForm(formDef));

      const submitWrapper = document.querySelector('.form-submit-wrapper');
      if (submitWrapper) {
        const errorMeta = getMetadata('form-error');
        const errorPath = errorMeta ? new URL(errorMeta).pathname : '/forms/form-error';
        const resp = await fetch(`${errorPath}.plain.html`);
        const html = await resp.text();
        const errorMessage = document.createElement('p');
        errorMessage.classList.add('required-error-message');
        errorMessage.innerHTML = html;
        submitWrapper.insertBefore(errorMessage, submitWrapper.firstChild);
      }
    }
  }
}
