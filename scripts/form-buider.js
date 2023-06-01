const FORMS_API_ENDPOINT = 'https://ms-forms-service-uat.digitalpfizer.com/api/v2/forms';

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

function createButton(fd) {
  const button = document.createElement('button');
  button.textContent = fd.Label;
  button.classList.add('button');
  button.type = fd.Type;
  if (fd.Classes) {
    button.classList.add(fd.Classes);
  }
  return button;
}

function createInput(fd) {
  const input = document.createElement('input');

  input.type = fd.Type;
  input.id = fd.Field;
  input.name = fd.Field;

  if (fd.Required === true) {
    input.setAttribute('required', 'required');
  }

  if (fd.Value) {
    input.value = fd.Value;
  }

  return input;
}

function createLabel(fd, hasFor = true) {
  const label = document.createElement('label');
  if (hasFor) {
    label.setAttribute('for', fd.Field);
  }
  label.textContent = fd.Label;
  if (fd.Required === true) {
    label.classList.add('required');
  }
  return label;
}

function createRadio(fd) {
  const radiosContainer = document.createElement('div');
  radiosContainer.classList.add('form-radios');

  for (let index = 0; index < fd.Options.length; index += 1) {
    const inputContainer = document.createElement('div');
    inputContainer.classList.add('form-radio');
    const input = document.createElement('input');
    const id = `${fd.Field}-${fd.Options[index].value}`.replaceAll('_', '-').toLowerCase();
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

export function createForm(formDefinition, datas = {}) {
  const form = document.createElement('form');
  const newFormDefinition = { ...formDefinition, data: [...formDefinition.data, datas] };

  form.dataset.action = newFormDefinition.submitTo;
  form.dataset.csrfToken = newFormDefinition.csrfToken;
  form.dataset.configToken = newFormDefinition.configToken;
  newFormDefinition.data.forEach((fd) => {
    fd.Type = fd.Type || 'text';
    const fieldWrapper = document.createElement('div');
    const fieldId = `form-${fd.Type}-wrapper`;
    const fieldName = `form-${fd.Field}-wrapper`.replaceAll('_', '-');
    fieldWrapper.className = fieldId;
    fieldWrapper.classList.add('field-wrapper', fieldName);
    switch (fd.Type) {
      case 'text':
        fieldWrapper.append(createLabel(fd));
        fieldWrapper.append(createInput(fd));
        break;
      case 'email':
        fieldWrapper.append(createLabel(fd));
        fieldWrapper.append(createInput(fd));
        break;
      case 'checkbox':
        fieldWrapper.append(createInput(fd));
        fieldWrapper.append(createLabel(fd));
        break;
      case 'radio':
        fieldWrapper.append(createLabel(fd));
        fieldWrapper.append(createRadio(fd, false));
        break;
      case 'submit':
        fieldWrapper.append(createButton(fd));
        break;
      default:
        fieldWrapper.append(createLabel(fd));
        fieldWrapper.append(createInput(fd));
    }
    form.append(fieldWrapper);
  });
  return (form);
}
