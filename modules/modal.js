/*
 * Based on Modal Code from 
 *
 * Pico.css - https://picocss.com
 * Copyright 2019-2024 - Licensed under MIT
 * 
 * 
 */

// Config

const isOpenClass = "modal-is-open";
const openingClass = "modal-is-opening";
const closingClass = "modal-is-closing";
const scrollbarWidthCssVar = "--pico-scrollbar-width";
const animationDuration = 400; // ms
let visibleModal = null;


// Toggle modal
const toggleModal = (event) => {
    
    event.preventDefault();console.log(event);
    const modal = document.getElementById(event.target.dataset.target);
    
    if (!modal) return;

    // Set the title.
    const titleText = getDataAttribute(event.target,"title","");
    const modalTitle = document.getElementById("modalTitle");
    modalTitle.innerHTML = titleText;

    // Pull in the button action and text from element opening modal.
    const buttonText = getDataAttribute(event.target,"caption","CLOSE");
    const buttonAction = getDataAttribute(event.target,"buttonaction","");

    // Set button attributes.
    const modalButton = document.getElementById("modalButton");
    modalButton.innerHTML = buttonText;

    // Don't wipe out action. There's a timing issue with close.
    if (buttonAction !== "")  modalButton.dataset.action = buttonAction;

    // Perform toggle.
    modal && (modal.open ? closeModal(modal) : openModal(modal));
}


// Open modal
const openModal = (modal) => {
    const { documentElement: html } = document;
    const scrollbarWidth = getScrollbarWidth();
  
    if (scrollbarWidth) {
        html.style.setProperty(scrollbarWidthCssVar, `${scrollbarWidth}px`);
    }
  
    html.classList.add(isOpenClass, openingClass);
  
    setTimeout(() => {
          visibleModal = modal;
          html.classList.remove(openingClass);
        }, 
        animationDuration);
  
    modal.showModal();
};


// Close modal
const closeModal = (modal) => {
    
    visibleModal = null;
    
    const { documentElement: html } = document;
    
    html.classList.add(closingClass);
    
    setTimeout(
        () => {
        html.classList.remove(closingClass, isOpenClass);
        html.style.removeProperty(scrollbarWidthCssVar);
        modal.close();
    }, animationDuration);
};


// Close with a click outside
document.addEventListener("click", (event) => {
    if (visibleModal === null) return;
        const modalContent = visibleModal.querySelector("article");
        const isClickInside = modalContent.contains(event.target);
        !isClickInside && closeModal(visibleModal);
});


// Close with Esc key
document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && visibleModal) {
        closeModal(visibleModal);
    }
});


// Get scrollbar width
const getScrollbarWidth = () => {
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    return scrollbarWidth;
};


// Is scrollbar visible
const isScrollbarVisible = () => {
    return document.body.scrollHeight > screen.height;
};


function getDataAttribute(element, attrName, defaultValue = null) {
    return element.hasAttribute(`data-${attrName}`) 
        ? element.getAttribute(`data-${attrName}`) 
        : defaultValue;
}
