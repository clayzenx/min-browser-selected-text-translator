// ==UserScript==
// @name Min selected text translator
// @match *
// @run-at document-start
// ==/UserScript==
//

const LIBRE_TRANSLATE_URL = "http://127.0.0.1:5000/translate";
const TARGET_LANG = "ru";
const POPUP_ELEMENT_ID = "min-translate-popup";

// Configurable styles for popup
const popupStyles = {
  container: {
    position: "absolute",
    background: "#222",
    color: "#393a34",
    padding: "9px",
    border: "2px solid #a44fa5",
    borderRadius: "9px",
    zIndex: 99999,
    maxWidth: "460px",
    fontSize: "13px",
    fontFamily: "sans-serif",
    boxShadow: "0 2px 6px rgba(0,0,0,0.7)",
    pointerEvents: "auto",
  },
  title: {
    margin: "0 0 4px",
    fontSize: "13px",
    fontWeight: "600",
    color: "#c2bdae",
  },
  altItem: {
    padding: "2px 0",
    fontSize: "12px",
    color: "#777777",
    cursor: "pointer",
  },
  divider: {
    border: "none",
    height: "1px",
    background: "#777777",
    margin: "6px 0",
  },
};


let popupTimeoutId = null;


const applyStyles = (el, styles) => Object.assign(el.style, styles);


const createElement = (tag, id, innerElements, styles = {}) => {
  const el = document.createElement(tag);

  if (id) el.id = id;
  if (innerElements) {
    typeof innerElements == "string"
      ? el.append(innerElements)
      : el.append(...innerElements);
  }

  applyStyles(el, styles);

  return el;
};


const outsideClickHandler = (e, popupEl) => {
  if (!popupEl.contains(e.target)) closePopup();
};


const getLibreTranslateRequestOptions = (text) => ({
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    q: text,
    source: "auto",
    target: TARGET_LANG,
    format: "text",
    alternatives: 4,
  }),
});


const successTranslation = ({ translatedText, alternatives }, originText) => ({
  originText,
  translatedText,
  alternatives,
});


function closePopup() {
  const popup = document.getElementById(POPUP_ELEMENT_ID);
  if (popup) popup.remove();
  if (popupTimeoutId) {
    clearTimeout(popupTimeoutId);
    popupTimeoutId = null;
  }
}


function showPopup(event, popupEl) {
  const pageWidth = document.documentElement.scrollWidth;
  const pageHeight = document.documentElement.scrollHeight;

  const rect = popupEl.getBoundingClientRect();
  const popupWidth = rect.width;
  const popupHeight = rect.height;

  let x = event.pageX + 10;
  let y = event.pageY + 10;

  if (x + popupWidth > pageWidth) {
    x = pageWidth - popupWidth - 10;
  }

  if (y + popupHeight > pageHeight) {
    y = pageHeight - tooltipHeight - 10;
  }

  popupEl.style.left = `${x}px`;
  popupEl.style.top = `${y}px`;

  document.body.appendChild(popupEl);

  document.addEventListener("click", (e) => outsideClickHandler(e, popupEl));
}


function createPopup({ originText, translatedText, alternatives }) {
  const popupEl = createElement(
    "div",
    POPUP_ELEMENT_ID,
    [
      createElement(
        "h3",
        null,
        `[${TARGET_LANG}] ${translatedText}`,
        popupStyles.title,
      ),
      ...(alternatives?.length && [
        createElement("hr", null, null, popupStyles.divider),
        ...alternatives.map((alt) =>
          createElement("div", null, alt.toString(), popupStyles.altItem),
        ),
      ]),
    ],

    popupStyles.container,
  );

  popupTimeoutId = setTimeout(closePopup, 15000);

  return popupEl;
}


function translateText(text) {
  return fetch(LIBRE_TRANSLATE_URL, getLibreTranslateRequestOptions(text))
    .then((res) => res.json())
    .then((data) => successTranslation(data, text))
    .catch(Error);
}

function handleTranslateEvent(e) {
  const selection = window.getSelection().toString().trim();

  if (e.type === 'mouseup' && !e.altKey) return;
  if (!selection) return;

  translateText(selection)
    .then(createPopup)
    .then((popupEl) => showPopup(e, popupEl))
    .catch(console.error);
}

document.addEventListener("dblclick", handleTranslateEvent);
document.addEventListener("mouseup", handleTranslateEvent);

