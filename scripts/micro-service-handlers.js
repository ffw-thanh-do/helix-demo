function createDynamicHtml(data) {
  let selectedOptions = '';
  Object.entries(data).forEach((item) => {
    selectedOptions += `<li>${item[1]}</li>`;
  });
  return selectedOptions;
}

function sendData(payload, pdflink, requestUrl, token) {
  const xhttp = new XMLHttpRequest();
  xhttp.open('POST', requestUrl, true);
  xhttp.setRequestHeader('Content-Type', 'application/json');
  xhttp.setRequestHeader('x-config-token', token);
  xhttp.onreadystatechange = () => {
    if (xhttp.readyState === 4 && xhttp.status === 200) {
      // eslint-disable-next-line no-console
      console.log('Success, PDF generated');
      const res = xhttp.responseText;
      const obj = JSON.parse(res);
      pdflink.location = obj.data[0].details[0].downloadUrl;
    }
    if (xhttp.readyState !== 4 && xhttp.status !== 200) {
      // eslint-disable-next-line no-console
      console.error('Something went wrong! Please try again.');
    }
  };
  xhttp.send(JSON.stringify(payload));
}

async function generateDownloadPdf(html, basePath, requestUrl, token) {
  let pdflink = '';
  pdflink = window.open('', '_blank');
  pdflink.document.write('Loading preview...');
  fetch(requestUrl, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'X-Config-Token': token,
    },
  })
    .then((response) => response.json())
    .then((data) => {
      const csrf = data.data.csrfToken;
      const payload = {
        csrfToken: csrf,
        dynamic_html: html,
        base_path: basePath,
      };
      sendData(payload, pdflink, requestUrl, token);
    })
    .catch((error) => {
      // eslint-disable-next-line no-console
      console.error('Something went wrong with the get request:', error);
    });
}

async function sendEmailData(payload, requestUrl, token) {
  try {
    const response = await fetch(requestUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Config-Token': token,
      },
      body: JSON.stringify(payload),
    });
    if (response.ok) {
      // eslint-disable-next-line no-console
      console.log('Email sent successfully');
    } else {
      throw new Error('Something went wrong! Please try again.');
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(error.message);
  }
}

async function generateEmailDownloadPdf(html, basePath, email, requestUrl, token) {
  try {
    const response = await fetch(requestUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'X-Config-Token': token,
      },
    });
    if (response.ok) {
      const data = await response.json();
      const csrf = data.data.csrfToken;
      const payload = {
        csrfToken: csrf,
        email,
        dynamic_html: html,
        base_path: basePath,
        type: 'mail',
        email_template: 'glossary_email',
      };

      await sendEmailData(payload, requestUrl, token);
    } else {
      throw new Error('Something went wrong with the GET request');
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(error.message);
  }
}

async function generateGlobalEmail(basePath, email, requestUrl, token) {
  try {
    const response = await fetch(requestUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'X-Config-Token': token,
      },
    });
    if (response.ok) {
      const data = await response.json();
      const csrf = data.data.csrfToken;
      const payload = {
        email,
        source_code: '',
        base_path: basePath,
        email_template: 'glossary_email',
        csrfToken: csrf,
      };

      await sendEmailData(payload, requestUrl, token);
    } else {
      throw new Error('Something went wrong with the GET request');
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(error.message);
  }
}

export async function handlePdfMicroService(formData) {
  const basePath = 'https://xeljanzcom.test.pfizerstatic.io/';
  const token = 'xeljanz_uat-QFYD-RA-pdf-config-download';
  const requestUrl = 'https://ms-forms-service-uat.digitalpfizer.com/api/v2/forms';
  createDynamicHtml(formData);
  const html = `${createDynamicHtml(formData)}`;
  await generateDownloadPdf(html, basePath, requestUrl, token);
}

export async function handleEmailMicroService(email, formData) {
  const basePath = 'https://xeljanzcom.test.pfizerstatic.io/';
  const token = 'xeljanz_uat-QFYD-RA-pdf-config';
  const requestUrl = 'https://ms-forms-service-uat.digitalpfizer.com/api/v2/forms';
  createDynamicHtml(formData);
  const html = `${createDynamicHtml(formData)}`;
  generateEmailDownloadPdf(html, basePath, email, requestUrl, token);
  // await generateDownloadPdf(html, basePath, requestUrl, token);
}

export async function handleEmailMicroServiceGlobal(email) {
  const basePath = 'https://xeljanzcom.test.pfizerstatic.io/';
  const token = 'ra_xeljanz_glossary_email';
  const requestUrl = 'https://ms-forms-service-uat.digitalpfizer.com/api/v2/forms';
  generateGlobalEmail(basePath, email, requestUrl, token);
}
