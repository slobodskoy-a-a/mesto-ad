/*
  Файл index.js является точкой входа в наше приложение
  и только он должен содержать логику инициализации нашего приложения
  используя при этом импорты из других файлов

  Из index.js не допускается что то экспортировать
*/

import { createCardElement } from "./components/card.js";
import { openModalWindow, closeModalWindow, setCloseModalWindowEventListeners } from "./components/modal.js";
import {
  getUserInfo,
  getCardList,
  setUserInfo,
  setUserAvatar,
  addCard,
  deleteCardRequest,
  changeLikeCardStatus,
} from "./components/api.js";

// DOM узлы
const placesWrap = document.querySelector(".places__list");
const profileFormModalWindow = document.querySelector(".popup_type_edit");
const profileForm = profileFormModalWindow.querySelector(".popup__form");
const profileTitleInput = profileForm.querySelector(".popup__input_type_name");
const profileDescriptionInput = profileForm.querySelector(".popup__input_type_description");

const cardFormModalWindow = document.querySelector(".popup_type_new-card");
const cardForm = cardFormModalWindow.querySelector(".popup__form");
const cardNameInput = cardForm.querySelector(".popup__input_type_card-name");
const cardLinkInput = cardForm.querySelector(".popup__input_type_url");

const imageModalWindow = document.querySelector(".popup_type_image");
const imageElement = imageModalWindow.querySelector(".popup__image");
const imageCaption = imageModalWindow.querySelector(".popup__caption");

const removeCardModalWindow = document.querySelector(".popup_type_remove-card");
const removeCardForm = removeCardModalWindow.querySelector(".popup__form");
const removeCardSubmitButton = removeCardForm.querySelector(".popup__button");

const infoModalWindow = document.querySelector(".popup_type_info");
const infoModalTitle = infoModalWindow.querySelector(".popup__title");
const infoModalInfoList = infoModalWindow.querySelector(".popup__info");
const infoModalUsersTitle = infoModalWindow.querySelector(".popup__text");
const infoModalUsersList = infoModalWindow.querySelector(".popup__list");
const infoDefinitionTemplate = document
  .getElementById("popup-info-definition-template")
  .content.querySelector(".popup__info-item");
const infoUserTemplate = document
  .getElementById("popup-info-user-preview-template")
  .content.querySelector(".popup__list-item");

const openProfileFormButton = document.querySelector(".profile__edit-button");
const openCardFormButton = document.querySelector(".profile__add-button");

const profileTitle = document.querySelector(".profile__title");
const profileDescription = document.querySelector(".profile__description");
const profileAvatar = document.querySelector(".profile__image");
let currentUserId = null;

const avatarFormModalWindow = document.querySelector(".popup_type_edit-avatar");
const avatarForm = avatarFormModalWindow.querySelector(".popup__form");
const avatarInput = avatarForm.querySelector(".popup__input");
const profileSubmitButton = profileForm.querySelector(".popup__button");
const cardSubmitButton = cardForm.querySelector(".popup__button");
const avatarSubmitButton = avatarForm.querySelector(".popup__button");
let pendingDelete = null;

const setSubmitButtonText = (button, text) => {
  button.textContent = text;
};

const handlePreviewPicture = ({ name, link }) => {
  imageElement.src = link;
  imageElement.alt = name;
  imageCaption.textContent = name;
  openModalWindow(imageModalWindow);
};

const formatDate = (date) =>
  date.toLocaleDateString("ru-RU", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

const createInfoString = (term, description) => {
  const item = infoDefinitionTemplate.cloneNode(true);
  item.querySelector(".popup__info-term").textContent = term;
  item.querySelector(".popup__info-description").textContent = description;
  return item;
};

const createUserPreview = (name) => {
  const item = infoUserTemplate.cloneNode(true);
  item.textContent = name;
  return item;
};

const handleProfileFormSubmit = (evt) => {
  evt.preventDefault();
  setSubmitButtonText(profileSubmitButton, "Сохранение...");
  setUserInfo({
    name: profileTitleInput.value,
    about: profileDescriptionInput.value,
  })
    .then((userData) => {
      profileTitle.textContent = userData.name;
      profileDescription.textContent = userData.about;
      closeModalWindow(profileFormModalWindow);
    })
    .catch((err) => {
      console.log(err);
    })
    .finally(() => {
      setSubmitButtonText(profileSubmitButton, "Сохранить");
    });
};

const handleAvatarFromSubmit = (evt) => {
  evt.preventDefault();
  setSubmitButtonText(avatarSubmitButton, "Сохранение...");
  setUserAvatar(avatarInput.value)
    .then((userData) => {
      profileAvatar.style.backgroundImage = `url(${userData.avatar})`;
      closeModalWindow(avatarFormModalWindow);
    })
    .catch((err) => {
      console.log(err);
    })
    .finally(() => {
      setSubmitButtonText(avatarSubmitButton, "Сохранить");
    });
};

const handleCardFormSubmit = (evt) => {
  evt.preventDefault();
  setSubmitButtonText(cardSubmitButton, "Создание...");
  addCard({
    name: cardNameInput.value,
    link: cardLinkInput.value,
  })
    .then((cardData) => {
      placesWrap.prepend(
        createCardElement(cardData, currentUserId, {
          onPreviewPicture: handlePreviewPicture,
          onLikeIcon: handleLikeClick,
          onDeleteCard: handleDeleteCard,
          onInfoClick: handleInfoClick,
        })
      );
      cardForm.reset();
      closeModalWindow(cardFormModalWindow);
    })
    .catch((err) => {
      console.log(err);
    })
    .finally(() => {
      setSubmitButtonText(cardSubmitButton, "Создать");
    });
};

const handleLikeClick = ({ cardId, likeButton, likeCountElement, isLiked }) => {
  changeLikeCardStatus(cardId, isLiked)
    .then((updatedCard) => {
      const likeOwnerIds = updatedCard.likes.map((like) => like._id);
      likeButton.classList.toggle(
        "card__like-button_is-active",
        likeOwnerIds.includes(currentUserId)
      );
      if (likeCountElement) {
        likeCountElement.textContent = updatedCard.likes.length;
      }
    })
    .catch((err) => {
      console.log(err);
    });
};

const handleDeleteCard = (cardId, cardElement) => {
  pendingDelete = { cardId, cardElement };
  openModalWindow(removeCardModalWindow);
};

const handleInfoClick = (cardId) => {
  getCardList()
    .then((cards) => {
      const cardData = cards.find((card) => card._id === cardId);
      if (!cardData) {
        return;
      }

      infoModalTitle.textContent = cardData.name;
      infoModalInfoList.innerHTML = "";
      infoModalUsersList.innerHTML = "";

      infoModalInfoList.append(
        createInfoString("Автор:", cardData.owner?.name || "—"),
        createInfoString("Дата создания:", formatDate(new Date(cardData.createdAt))),
        createInfoString("Лайков:", String(cardData.likes.length))
      );

      infoModalUsersTitle.textContent = "Понравилось:";
      if (cardData.likes.length === 0) {
        infoModalUsersList.append(createUserPreview("Пока нет лайков"));
      } else {
        cardData.likes.forEach((like) => {
          infoModalUsersList.append(createUserPreview(like.name));
        });
      }

      openModalWindow(infoModalWindow);
    })
    .catch((err) => {
      console.log(err);
    });
};

// EventListeners
profileForm.addEventListener("submit", handleProfileFormSubmit);
cardForm.addEventListener("submit", handleCardFormSubmit);
avatarForm.addEventListener("submit", handleAvatarFromSubmit);
removeCardForm.addEventListener("submit", (evt) => {
  evt.preventDefault();
  if (!pendingDelete) {
    return;
  }

  setSubmitButtonText(removeCardSubmitButton, "Сохранение...");
  deleteCardRequest(pendingDelete.cardId)
    .then(() => {
      pendingDelete.cardElement.remove();
      closeModalWindow(removeCardModalWindow);
      pendingDelete = null;
    })
    .catch((err) => {
      console.log(err);
    })
    .finally(() => {
      setSubmitButtonText(removeCardSubmitButton, "Да");
    });
});

openProfileFormButton.addEventListener("click", () => {
  profileTitleInput.value = profileTitle.textContent;
  profileDescriptionInput.value = profileDescription.textContent;
  openModalWindow(profileFormModalWindow);
});

profileAvatar.addEventListener("click", () => {
  avatarForm.reset();
  openModalWindow(avatarFormModalWindow);
});

openCardFormButton.addEventListener("click", () => {
  cardForm.reset();
  openModalWindow(cardFormModalWindow);
});

Promise.all([getCardList(), getUserInfo()])
  .then(([cards, userData]) => {
    currentUserId = userData._id;
    profileTitle.textContent = userData.name;
    profileDescription.textContent = userData.about;
    profileAvatar.style.backgroundImage = `url(${userData.avatar})`;

    cards.forEach((data) => {
      placesWrap.append(
        createCardElement(data, currentUserId, {
          onPreviewPicture: handlePreviewPicture,
          onLikeIcon: handleLikeClick,
          onDeleteCard: handleDeleteCard,
          onInfoClick: handleInfoClick,
        })
      );
    });
  })
  .catch((err) => {
    console.log(err);
  });

//настраиваем обработчики закрытия попапов
const allPopups = document.querySelectorAll(".popup");
allPopups.forEach((popup) => {
  setCloseModalWindowEventListeners(popup);
});
