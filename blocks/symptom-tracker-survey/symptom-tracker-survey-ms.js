import { sendMs } from '../../scripts/helpers/handle-ms.js';
import { arrToParts } from '../../scripts/helpers/format.js';

function covertStepRc(arrStep, step, basePath) {
  let mkRc = '';
  arrStep.forEach((arr) => {
    let tds = '';
    for (let i = 0; i <= 3; i += 1) {
      let td = '';
      let shiftLeft = '';
      let width = 'width: 130px;';
      if (i === 1 || i === 2) {
        shiftLeft = 'margin-left: -20px;';
        width = 'width: 110px;';
      }
      if (arr[i] !== undefined || arr[i] != null) {
        const imgSrc = `${basePath}images/pdf-icons/ra-survey/step-${step}/icon-${arr[i].value}.png`;
        td = `<td style="${width} padding: 0; padding-bottom: 20px;">
                <div style="${shiftLeft} border: 2px solid #e5e5e5; padding-bottom: 7px; border-radius: 10px; box-shadow: 0px 0px 3px #e5e5e5;">
                  <div style="text-align: center; height: 80px; margin: 5px 0 5px 0;">
                    <img
                      style="width: 50px; height: auto;"
                      src="${imgSrc}"
                    />
                    <br>
                    <span style="font-size: 13.5px; font-family:open-sans-regular; color: #454b4b; padding:10px 0;">  ${arr[i].label} </span>
                  </div>
                </div>
              </td>`;
      } else if (i !== 3) {
        td = '<td style="padding: 0;"></td>';
      } else {
        td = '<td style="padding: 0; width: 1px;"></td>';
      }
      tds += td;
    }

    mkRc += `<tr>${tds}</tr>`;
  });

  return mkRc;
}

// eslint-disable-next-line
export async function handlePdfMS(formData, placeholders, type, block) {
  const { basePath, msFormsRequestUrl } = placeholders;
  const today = new Date();
  const date = today.toLocaleString('en-US', {
    timeZone: 'America/New_York',
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: '2-digit',
  });
  let step1Rc = '';
  let step1RcClass = 'invisible';
  const step1C = formData.step0.length;
  const step1Rt = step1C % 3 >= 1 ? parseInt(step1C / 3, 10) + 1 : parseInt(step1C / 3, 10);
  if (step1C > 0) {
    const step1 = arrToParts(formData.step0, 3);
    step1Rc = covertStepRc(step1, 1, basePath);
    step1RcClass = '';
  }
  let step2Rc = '';
  let step2RcClass = 'invisible';
  const step2C = formData.step1.length;
  const step2Rt = step2C % 3 >= 1 ? parseInt(step2C / 3, 10) + 1 : parseInt(step2C / 3, 10);
  if (step2C > 0) {
    const step2 = arrToParts(formData.step1, 3);
    step2Rc = covertStepRc(step2, 2, basePath);
    step2RcClass = '';
  }
  const totalRowCount = step1Rt + step2Rt;
  const lessThanEquals3 = totalRowCount <= 3 ? 'visible' : 'invisible';
  const greaterThan3 = totalRowCount > 3 ? 'visible' : 'invisible';
  const lessThanEquals4 = totalRowCount <= 4 ? 'visible' : 'invisible';
  const equals4 = totalRowCount === 4 ? 'visible' : 'invisible';
  const greaterThan4 = totalRowCount > 4 ? 'visible' : 'invisible';
  const payload = {
    csrfToken: '',
    base_path: basePath,
    date_created: date,
    indication: formData.indication,
    type,
    step1_rc: step1Rc,
    step1_rc_class: step1RcClass,
    step2_rc: step2Rc,
    step2_rc_class: step2RcClass,
    step3: formData.step2.label,
    step4: formData.step3.label,
    total_row_count_less_than_equals_3: lessThanEquals3,
    total_row_count_greater_than_3: greaterThan3,
    total_row_count_less_than_equals_4: lessThanEquals4,
    total_row_count_equals_4: equals4,
    total_row_count_greater_than_4: greaterThan4,
    response: formData.step3.value,
  };

  if (type === 'mail') {
    const successMsMailFunc = () => {
      block.querySelector('.ms-actions-mail-submit').classList.remove('sending');
      block.querySelector('.ms-actions-mail-input').classList.remove('sending');
      block.querySelector('.ms-actions-mail-submit').classList.add('hidden');
      block.querySelector('.ms-actions-mail-input').classList.add('hidden');
      block.querySelector('.ms-actions-mail-message').classList.remove('hidden');
    };
    payload.email = formData.email;
    payload.email_template = 'glossary_email';
    await sendMs(payload, msFormsRequestUrl, formData.tokenMail, successMsMailFunc);
  } else {
    let pdflink = '';
    pdflink = window.open('', '_blank');
    pdflink.document.write('Loading preview...');
    const successMsDownloadPdfFunc = (data) => {
      pdflink.location = data.data[0].details[0].downloadUrl;
    };
    await sendMs(payload, msFormsRequestUrl, formData.token, successMsDownloadPdfFunc);
  }
}
