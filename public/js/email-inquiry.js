(() => {
  window.showSiteNotification = (type, title, message) => {
    let stack = document.getElementById('notificationStack');
    if (!stack) {
      stack = document.createElement('div');
      stack.id = 'notificationStack';
      stack.className = 'notification-stack';
      stack.setAttribute('aria-live', 'polite');
      stack.setAttribute('aria-relevant', 'additions');
      document.body.appendChild(stack);
    }

    const notification = document.createElement('article');
    notification.className = `site-notification is-${type}`;
    notification.setAttribute('role', type === 'error' ? 'alert' : 'status');

    const icon = document.createElement('span');
    icon.className = 'notification-icon';
    icon.setAttribute('aria-hidden', 'true');
    icon.textContent = type === 'success' ? '✓' : type === 'error' ? '!' : 'i';

    const content = document.createElement('div');
    content.className = 'notification-content';
    const heading = document.createElement('strong');
    heading.textContent = title;
    const description = document.createElement('p');
    description.textContent = message;
    content.append(heading, description);

    const closeButton = document.createElement('button');
    closeButton.className = 'notification-close';
    closeButton.type = 'button';
    closeButton.setAttribute('aria-label', 'Dismiss notification');
    closeButton.textContent = '×';

    const progress = document.createElement('span');
    progress.className = 'notification-progress';
    progress.setAttribute('aria-hidden', 'true');

    notification.append(icon, content, closeButton, progress);
    stack.appendChild(notification);

    let dismissed = false;
    let removalTimer;
    const dismiss = () => {
      if (dismissed) return;
      dismissed = true;
      window.clearTimeout(removalTimer);
      notification.classList.add('is-leaving');
      window.setTimeout(() => notification.remove(), 220);
    };

    closeButton.addEventListener('click', dismiss);
    removalTimer = window.setTimeout(dismiss, 6500);
    return notification;
  };

  window.validateInquiryForm = (form) => {
    const invalidField = [...form.querySelectorAll('input, textarea, select')].find((field) => {
      if (field.required && !field.value.trim()) return true;
      return !field.checkValidity();
    });

    form.querySelectorAll('[aria-invalid="true"]').forEach((field) => {
      field.removeAttribute('aria-invalid');
    });

    if (!invalidField) return true;

    invalidField.setAttribute('aria-invalid', 'true');
    invalidField.focus();
    invalidField.scrollIntoView({ behavior: 'smooth', block: 'center' });

    const label = invalidField.labels?.[0]?.textContent.replace('*', '').trim() || 'This field';
    const message = invalidField.validity.typeMismatch
      ? 'Enter a valid email address, for example name@company.com.'
      : invalidField.validity.valueMissing || !invalidField.value.trim()
        ? `Please enter your ${label.toLowerCase()}.`
        : `Please check the ${label.toLowerCase()} and try again.`;
    window.showSiteNotification('error', 'A little more information needed', message);
    return false;
  };

  document.addEventListener('input', (event) => {
    if (event.target.matches('[aria-invalid="true"]') && event.target.checkValidity() && event.target.value.trim()) {
      event.target.removeAttribute('aria-invalid');
    }
  });

  window.openOfficeEmailInquiry = (inquiry) => {
    const body = [
      'New inquiry from Evatho Matrix Security website',
      `Name: ${inquiry.fullName}`,
      `Email: ${inquiry.email}`,
      inquiry.phone ? `Phone: ${inquiry.phone}` : '',
      inquiry.service ? `Service: ${inquiry.service}` : '',
      inquiry.facilityType ? `Facility type: ${inquiry.facilityType}` : '',
      '',
      `Message:\n${inquiry.message}`,
    ].filter((line) => line !== '').join('\n');
    const subject = `Website inquiry - ${inquiry.fullName}`;
    const url = `mailto:info@evathomatrixsecurity.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

    window.location.href = url;
    return url;
  };

  window.submitInquiryForm = (form) => {
    if (!window.validateInquiryForm(form)) return;

    const readField = (id) => form.querySelector(`#${id}`)?.value.trim() || '';
    const payload = {
      fullName: readField('fullName'),
      email: readField('email'),
      phone: readField('phone'),
      service: readField('serviceSelect'),
      facilityType: readField('facilityType'),
      message: readField('message'),
    };
    const feedback = form.querySelector('#formFeedback');
    const isHomeForm = Boolean(form.closest('.contact-form-wrap'));
    const message = 'Your email app should open with a pre-filled message to our office. Review it and press Send in your email app.';
    const emailUrl = window.openOfficeEmailInquiry(payload);

    if (feedback) {
      feedback.replaceChildren();
      feedback.className = isHomeForm ? 'form-feedback is-visible is-success' : 'form-feedback success';
      feedback.append(
        document.createTextNode('Your email app should open with a pre-filled message addressed to our office. Press Send in that app to deliver it. If it did not open, use the link below.'),
        document.createElement('br')
      );
      const link = document.createElement('a');
      link.href = emailUrl;
      link.textContent = 'Open email draft';
      feedback.appendChild(link);
    }

    window.showSiteNotification('success', 'Your message is ready', message);
  };
})();
