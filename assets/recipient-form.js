if (!customElements.get('recipient-form')) {
  customElements.define('recipient-form', class RecipientForm extends HTMLElement {
    constructor() {
      super();

      this.checkboxInput = this.querySelector(`#Recipient-Checkbox-${this.dataset.sectionId}`);
      this.checkboxInput.disabled = false;
      this.hiddenControlField = this.querySelector(`#Recipient-Control-${this.dataset.sectionId}`);
      this.hiddenControlField.disabled = true;
      this.emailInput = this.querySelector(`#Recipient-email-${this.dataset.sectionId}`);
      this.nameInput = this.querySelector(`#Recipient-name-${this.dataset.sectionId}`);
      this.messageInput = this.querySelector(`#Recipient-message-${this.dataset.sectionId}`);
      this.errorMessageWrapper = this.querySelector('.product-form__recipient-error-message-wrapper');
      this.errorMessageList = this.errorMessageWrapper && this.errorMessageWrapper.querySelector('ul');
      this.errorMessage = this.errorMessageWrapper && this.errorMessageWrapper.querySelector('.error-message');
      this.defaultErrorHeader = this.errorMessage && this.errorMessage.innerText;
      this.currentProductVariantId = this.dataset.productVariantId;
      this.productId = this.dataset.productId
      this.fields = this.querySelector('.m-recipient-form__fields');
      this.addEventListener('change', this.onChange.bind(this));
    }

    cartUpdateUnsubscriber = undefined;
    variantChangeUnsubscriber = undefined;
    cartErrorUnsubscriber = undefined;

    connectedCallback() {
      this.cartUpdateUnsubscriber = window.MinimogEvents.subscribe(MinimogTheme.pubSubEvents.cartUpdate, response => {
        this.resetRecipientForm();
      });

      this.variantChangeUnsubscriber = MinimogEvents.subscribe(
        MinimogTheme.pubSubEvents.variantChange,
        (event) => {
          if (event.data.sectionId === this.dataset.sectionId) {
            this.currentProductVariantId = event.data.variant.id.toString();
          }
        }
      );

      this.cartUpdateUnsubscriber = window.MinimogEvents.subscribe(MinimogTheme.pubSubEvents.cartError, (event) => {
        if (event.source === 'product-form' && event.productVariantId.toString() === this.currentProductVariantId) {
          this.displayErrorMessage(event.message, event.errors);
        }
      });
    }

    disconnectedCallback() {
      if (this.cartUpdateUnsubscriber) {
        this.cartUpdateUnsubscriber();
      }

      if (this.variantChangeUnsubscriber) {
        this.variantChangeUnsubscriber();
      }

      if (this.cartErrorUnsubscriber) {
        this.cartErrorUnsubscriber();
      }
    }

    onChange() {
      if (!this.checkboxInput.checked) {
        this.clearInputFields();
        this.clearErrorMessage();
      }
    }

    displayErrorMessage(title, body) {
      this.clearErrorMessage();
      const errorSize = Object.keys(body).length;
      if (errorSize > 1) this.errorMessageWrapper.hidden = false;
      if (typeof body === 'object') {
        this.errorMessage.innerText = this.defaultErrorHeader;
        return Object.entries(body).forEach(([key, value]) => {
          const errorMessageId = `RecipientForm-${key}-error-${this.dataset.sectionId}`
          const fieldSelector = `#Recipient-${key}-${this.dataset.sectionId}`;
          const placeholderElement = this.querySelector(`${fieldSelector}`);
          const label = placeholderElement && placeholderElement.getAttribute('placeholder') || key;
          const message = `${label} ${value}`;
          const errorMessageElement = this.querySelector(`#${errorMessageId}`);
          const errorTextElement = errorMessageElement && errorMessageElement.querySelector('.error-message')
          if (!errorTextElement) return;

          if (this.errorMessageList) {
            this.errorMessageList.appendChild(this.createErrorListItem(fieldSelector, message));
          }

          errorTextElement.innerText = `${message}.`;
          errorMessageElement.classList.remove('m\:hidden');

          const inputElement = this[`${key}Input`];
          if (!inputElement) return;

          inputElement.setAttribute('aria-invalid', true);
          inputElement.setAttribute('aria-describedby', errorMessageId);
        });
      }

      this.errorMessage.innerText = body;
    }

    createErrorListItem(target, message) {
      const li = document.createElement('li');
      const a = document.createElement('a');
      a.setAttribute('href', target);
      a.innerText = message;
      li.appendChild(a);
      li.className = "error-message";
      return li;
    }

    clearInputFields() {
      this.emailInput.value = '';
      this.nameInput.value = '';
      this.messageInput.value = '';
    }

    clearErrorMessage() {
      this.errorMessageWrapper.hidden = true;

      if (this.errorMessageList) this.errorMessageList.innerHTML = '';

      this.querySelectorAll('.m-recipient-form__fields .form-field--message').forEach(field => {
        field.classList.add('m\:hidden');
        const textField = field.querySelector('.error-message');
        if (textField) textField.innerText = '';
      });

      [this.emailInput, this.messageInput, this.nameInput].forEach(inputElement => {
        inputElement.setAttribute('aria-invalid', false);
        inputElement.removeAttribute('aria-describedby');
      });
    }

    resetRecipientForm() {
      if (this.checkboxInput.checked) {
        this.checkboxInput.checked = false;
        this.fields.classList.remove('show');
        this.clearInputFields();
        this.clearErrorMessage();
      }
    }
  })
}