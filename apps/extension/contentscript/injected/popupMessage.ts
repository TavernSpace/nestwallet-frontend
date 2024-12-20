import { colors } from '@nestwallet/app/design/constants';

chrome.runtime.onMessage.addListener((message) => {
  if (message.type === 'SHOW_POPUP_MESSAGE') {
    showPopupMessage(
      message.message.title,
      message.message.subtitle,
      message.message.duration,
    );
  }
});

// Allows fontAwesome icons to be used
const fontAwesomeLink = document.createElement('link');
fontAwesomeLink.rel = 'stylesheet';
fontAwesomeLink.href =
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css';
document.head.appendChild(fontAwesomeLink);

const containerWidth = 400;
const containerHeight = 95;
const animationDuration = 200;

function showPopupMessage(title: string, subtitle: string, duration: number) {
  const mainContainer = document.createElement('div');
  mainContainer.style.cssText = `
    position: fixed;
    border-radius: 12px;
    border: 1px solid ${colors.failure};
    background-color: ${colors.background};
    display: flex;
    flex-direction: row;
    top: 10px;
    right: 10px;
    width: ${containerWidth}px;
    height: 0px;
    opacity: 0;
    transition: width ${animationDuration}ms ease-out, height ${animationDuration}ms ease-out, opacity ${animationDuration}ms ease-out;
  `;

  const errorIconBackground = document.createElement('div');
  errorIconBackground.innerHTML = `<i class="fa-solid fa-circle-exclamation"></i>`;
  errorIconBackground.style.cssText = `
    display: flex;
    background: none;
    height: 100%;
    padding-left: 15px;
    padding-right: 15px;
    color: ${colors.failure};
    align-items: center;
    justify-content: center;
  `;

  const closeButton = document.createElement('div');
  closeButton.innerHTML = `<i class="fa-solid fa-times"></i>`;
  closeButton.style.cssText = `
    position: relative;
    display: flex;
    background: none;
    padding-left: 15px;
    padding-right: 15px;
    height: 100%;
    align-items: center;
    justify-content: center;
    font-size: 20px;
    cursor: pointer;
    color: ${colors.failure};
  `;
  closeButton.addEventListener('click', () => {
    hidePopupMessage(mainContainer);
  });

  mainContainer.appendChild(errorIconBackground);

  updateMessageText(mainContainer, title, subtitle);

  mainContainer.appendChild(closeButton);

  document.body.appendChild(mainContainer);

  setTimeout(() => {
    mainContainer.style.height = `${containerHeight}px`;
    mainContainer.style.opacity = '1';
  }, 10); // Delay needed to before showing animation

  setTimeout(() => {
    hidePopupMessage(mainContainer);
  }, duration);
}

function hidePopupMessage(mainContainer: HTMLElement) {
  mainContainer.style.height = '0';
  mainContainer.style.opacity = '0';
  setTimeout(() => {
    mainContainer.remove();
  }, animationDuration); // Wait for the animation to complete before removing the container
}

function updateMessageText(
  mainContainer: HTMLElement,
  title: string,
  subtitle: string,
) {
  const textElement = document.createElement('div');
  textElement.classList.add('popup-message-text');
  textElement.style.cssText = `
    position: relative;
    width: auto;
    display: flex;
    flex-direction: column;
    justify-content: center;
    height: 100%;
  `;
  textElement.innerHTML = `<div style="color: ${colors.textPrimary}; font-size: 18px; padding-bottom: 4px;">${title}</div><div style="color: ${colors.textSecondary}; font-size: 14px; padding-top: 4px;">${subtitle}</div>`;

  mainContainer.appendChild(textElement);
}
