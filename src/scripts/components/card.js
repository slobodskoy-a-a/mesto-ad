const getTemplate = () => {
  return document
    .getElementById("card-template")
    .content.querySelector(".card")
    .cloneNode(true);
};

export const createCardElement = (
  data,
  currentUserId,
  { onPreviewPicture, onLikeIcon, onDeleteCard, onInfoClick }
) => {
  const cardElement = getTemplate();
  const likeButton = cardElement.querySelector(".card__like-button");
  const deleteButton = cardElement.querySelector(".card__control-button_type_delete");
  const likeCountElement = cardElement.querySelector(".card__like-count");
  const infoButton = cardElement.querySelector(".card__control-button_type_info");
  const cardImage = cardElement.querySelector(".card__image");

  cardImage.src = data.link;
  cardImage.alt = data.name;
  cardElement.querySelector(".card__title").textContent = data.name;

  if (Array.isArray(data.likes)) {
    if (likeCountElement) {
      likeCountElement.textContent = data.likes.length;
    }

    if (data.likes.some((like) => like._id === currentUserId)) {
      likeButton.classList.add("card__like-button_is-active");
    }
  }

  if (data.owner?._id !== currentUserId) {
    deleteButton.remove();
  } else if (onDeleteCard) {
    deleteButton.addEventListener("click", () => onDeleteCard(data._id, cardElement));
  }

  if (onLikeIcon) {
    likeButton.addEventListener("click", () =>
      onLikeIcon({
        cardId: data._id,
        likeButton,
        likeCountElement,
        isLiked: likeButton.classList.contains("card__like-button_is-active"),
      })
    );
  }

  if (onInfoClick && infoButton) {
    infoButton.addEventListener("click", () => onInfoClick(data._id));
  }

  if (onPreviewPicture) {
    cardImage.addEventListener("click", () =>
      onPreviewPicture({ name: data.name, link: data.link })
    );
  }

  return cardElement;
};
