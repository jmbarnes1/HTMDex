/*
 * Based on Modal Code from 
 *
 * Pico.css - https://picocss.com
 * Copyright 2019-2024 - Licensed under MIT
 * 
 * 
 */

// Config
// modal.js

import { getDataAttribute } from './utils.js';

const isOpenClass = "modal-is-open";
const openingClass = "modal-is-opening";
const closingClass = "modal-is-closing";
const scrollbarWidthCssVar = "--pico-scrollbar-width";
const animationDuration = 400;
let visibleModal = null;

export function toggleModal(event) {
    event.preventDefault();

    const modal = document.getElementById(event.target.dataset.target);
    if (!modal) return;

    const titleText = getDataAttribute(event.target, "title", "");
    const modalTitle = document.getElementById("modalTitle");
    modalTitle.innerHTML = titleText;

    const buttonText = getDataAttribute(event.target, "caption", "CLOSE");
    const buttonAction = getDataAttribute(event.target, "buttonaction", "");

    const modalButton = document.getElementById("modalButton");
    modalButton.innerHTML = buttonText;
    modalButton.style.display="";
    

    if (buttonAction !== "") modalButton.dataset.action = buttonAction;

    modal.open ? closeModal(modal) : openModal(modal);
}


export function openModal(modal) {
    const { documentElement: html } = document;
    const scrollbarWidth = getScrollbarWidth();

    if (scrollbarWidth) {
        html.style.setProperty(scrollbarWidthCssVar, `${scrollbarWidth}px`);
    }

    html.classList.add(isOpenClass, openingClass);

    setTimeout(() => {
        visibleModal = modal;
        html.classList.remove(openingClass);
    }, animationDuration);

    modal.showModal();
}


export function closeModal(modal) {
    visibleModal = null;
    const { documentElement: html } = document;

    html.classList.add(closingClass);

    setTimeout(() => {
        html.classList.remove(closingClass, isOpenClass);
        html.style.removeProperty(scrollbarWidthCssVar);
        modal.close();
    }, animationDuration);
}


function getScrollbarWidth() {
    return window.innerWidth - document.documentElement.clientWidth;
}