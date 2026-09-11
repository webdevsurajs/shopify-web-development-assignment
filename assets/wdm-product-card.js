(function () {
  function replaceCartSections(sections) {
    if (!sections) {
      return;
    }

    Object.keys(sections).forEach(function (sectionId) {
      if (!sections[sectionId]) {
        return;
      }

      const current = document.getElementById(
        'shopify-section-' + sectionId
      );

      if (current) {
        const wrapper = document.createElement('div');
        wrapper.innerHTML = sections[sectionId];

        const replacement = wrapper.firstElementChild;

        if (replacement) {
          current.replaceWith(replacement);
        }

        return;
      }

      const currentById = document.getElementById(sectionId);

      if (currentById) {
        const wrapper = document.createElement('div');
        wrapper.innerHTML = sections[sectionId];

        const replacement = wrapper.firstElementChild;

        if (replacement) {
          currentById.replaceWith(replacement);
        }
      }
    });
  }

  function updateCartCount(itemCount) {
    document
      .querySelectorAll('[data-cart-count]')
      .forEach(function (element) {
        element.textContent = itemCount;
        element.hidden = itemCount < 1;
      });

    document
      .querySelectorAll(
        '.cart-count-bubble span[aria-hidden="true"]'
      )
      .forEach(function (element) {
        element.textContent = itemCount;
      });

    document
      .querySelectorAll('.cart-count-bubble')
      .forEach(function (element) {
        element.classList.toggle(
          'is-empty',
          itemCount < 1
        );
      });
  }

  function initProductCard(card) {
    if (
      !card ||
      card.dataset.initialized === 'true'
    ) {
      return;
    }

    card.dataset.initialized = 'true';

    const image = card.querySelector(
      '.wdm-product-card__image'
    );

    const links = card.querySelectorAll(
      '[data-product-link]'
    );

    const swatches = card.querySelectorAll(
      '[data-product-swatch]'
    );

    const quickAdd = card.querySelector(
      '[data-quick-add]'
    );

    const currentPrice = card.querySelector(
      '[data-current-price]'
    );

    const comparePrice = card.querySelector(
      '[data-compare-price]'
    );

    const soldOut = card.querySelector(
      '[data-sold-out]'
    );

    const message = card.querySelector(
      '[data-quick-add-message]'
    );

    let selectedVariantId = quickAdd
      ? quickAdd.dataset.variantId
      : null;

    let selectedVariantAvailable =
      quickAdd
        ? quickAdd.dataset.variantAvailable === 'true'
        : false;

    let messageTimer;

    /*
     * Show message
     *
     * sticky = true
     * keeps the message visible until another
     * variant is selected or another message is shown.
     */
    function showMessage(text, sticky) {
      if (!message) {
        console.warn(
          'Quick add message element not found'
        );
        return;
      }

      clearTimeout(messageTimer);

      message.textContent = text;

      message.classList.add('is-visible');

      if (!sticky) {
        messageTimer = setTimeout(function () {
          message.classList.remove(
            'is-visible'
          );
        }, 3000);
      }
    }

    /*
     * Hide message
     */
    function hideMessage() {
      if (!message) {
        return;
      }

      clearTimeout(messageTimer);

      message.classList.remove(
        'is-visible'
      );

      message.textContent = '';
    }

    /*
     * Update selected variant
     *
     * This does NOT add anything to cart.
     */
    function updateVariant(swatch) {
      const variantId =
        swatch.dataset.variantId;

      const variantUrl =
        swatch.dataset.variantUrl;

      const variantImage =
        swatch.dataset.variantImage;

      const variantPrice =
        swatch.dataset.variantPriceFormatted;

      const variantPriceValue =
        Number(
          swatch.dataset.variantPrice || 0
        );

      const variantComparePrice =
        Number(
          swatch.dataset.variantComparePrice || 0
        );

      const variantCompareFormatted =
        swatch.dataset.variantCompareFormatted;

      const available =
        swatch.dataset.variantAvailable ===
        'true';

      /*
       * Store selected variant
       */
      selectedVariantId = variantId;

      selectedVariantAvailable =
        available;

      /*
       * Hide previous message when
       * selecting another variant.
       */
      hideMessage();

      /*
       * Update active swatch
       */
      swatches.forEach(function (item) {
        item.classList.remove(
          'is-active'
        );
      });

      swatch.classList.add(
        'is-active'
      );

      /*
       * Update image
       */
      if (
        image &&
        variantImage
      ) {
        image.src = variantImage;
        image.removeAttribute(
          'srcset'
        );
      }

      /*
       * Update product URL
       */
      links.forEach(function (link) {
        link.href =
          variantUrl ||
          link.href;
      });

      /*
       * Update price
       */
      if (currentPrice) {
        currentPrice.textContent =
          variantPrice;
      }

      /*
       * Update compare-at price
       */
      if (comparePrice) {
        if (
          variantComparePrice >
          variantPriceValue
        ) {
          comparePrice.textContent =
            variantCompareFormatted;

          comparePrice.hidden =
            false;
        } else {
          comparePrice.textContent =
            '';

          comparePrice.hidden =
            true;
        }
      }

      /*
       * Update sold-out text
       */
      if (soldOut) {
        soldOut.hidden =
          available;
      }

      /*
       * Update Quick Add
       *
       * IMPORTANT:
       * Do NOT disable the button.
       * We want the user to be able
       * to click it and see "Sold out".
       */
      if (quickAdd) {
        quickAdd.dataset.variantId =
          variantId;

        quickAdd.dataset.variantAvailable =
          available
            ? 'true'
            : 'false';

        quickAdd.classList.remove(
          'is-loading'
        );

        quickAdd.disabled =
          false;

        quickAdd.setAttribute(
          'aria-label',
          available
            ? 'Add product to cart'
            : 'Product is sold out'
        );

        quickAdd.classList.toggle(
          'is-sold-out',
          !available
        );
      }
    }

    /*
     * Add variant to cart
     */
    async function addToCart(
      variantId
    ) {
      if (
        !variantId ||
        !quickAdd ||
        quickAdd.classList.contains(
          'is-loading'
        )
      ) {
        return;
      }

      /*
       * Protect against double click
       */
      quickAdd.classList.add(
        'is-loading'
      );

      quickAdd.disabled = true;

      const formData =
        new FormData();

      formData.append(
        'items[0][id]',
        variantId
      );

      formData.append(
        'items[0][quantity]',
        '1'
      );

      formData.append(
        'sections',
        'cart-icon-bubble,cart-drawer,cart-notification,cart-live-region-text'
      );

      formData.append(
        'sections_url',
        window.location.pathname
      );

      try {
        /*
         * Add variant
         */
        const response =
          await fetch(
            window.Shopify.routes.root +
              'cart/add.js',
            {
              method: 'POST',
              headers: {
                Accept:
                  'application/json'
              },
              body: formData
            }
          );

        const data =
          await response.json();

        /*
         * Shopify error
         */
        if (!response.ok) {
          throw new Error(
            data.description ||
              data.message ||
              'Unable to add product to cart'
          );
        }

        /*
         * Replace cart sections
         */
        replaceCartSections(
          data.sections
        );

        /*
         * Get updated cart
         */
        const cartResponse =
          await fetch(
            window.Shopify.routes.root +
              'cart.js',
            {
              headers: {
                Accept:
                  'application/json'
              }
            }
          );

        const cart =
          await cartResponse.json();

        /*
         * Update cart count
         */
        updateCartCount(
          cart.item_count
        );

        /*
         * Dispatch cart event
         */
        document.dispatchEvent(
          new CustomEvent(
            'wdm:cart-updated',
            {
              detail: {
                cart: cart
              }
            }
          )
        );

        document.dispatchEvent(
          new CustomEvent(
            'cart:updated',
            {
              detail: {
                cart: cart
              }
            }
          )
        );

        /*
         * Success message
         */
        showMessage(
          'Added to cart',
          false
        );

      } catch (error) {
        console.error(
          'Quick Add Error:',
          error
        );

        /*
         * Error message
         */
        showMessage(
          error.message ||
            'Unable to add to cart',
          false
        );

      } finally {
        /*
         * Restore button according
         * to selected variant.
         */
        quickAdd.classList.remove(
          'is-loading'
        );

        quickAdd.disabled =
          false;

        quickAdd.classList.toggle(
          'is-sold-out',
          !selectedVariantAvailable
        );
      }
    }

    /*
     * Swatch click
     *
     * ONLY selects the variant.
     */
    swatches.forEach(function (
      swatch
    ) {
      swatch.addEventListener(
        'click',
        function () {
          updateVariant(
            swatch
          );
        }
      );
    });

    /*
     * Quick Add click
     */
    if (quickAdd) {
      quickAdd.addEventListener(
        'click',
        function () {
          /*
           * Prevent double click
           */
          if (
            quickAdd.classList.contains(
              'is-loading'
            )
          ) {
            return;
          }

          /*
           * No selected variant
           */
          if (!selectedVariantId) {
            showMessage(
              'Product is sold out',
              true
            );

            return;
          }

          /*
           * Selected variant unavailable
           *
           * Keep this message sticky.
           */
          if (
            !selectedVariantAvailable
          ) {
            showMessage(
              'This variant is sold out',
              true
            );

            return;
          }

          /*
           * Add selected variant
           */
          addToCart(
            selectedVariantId
          );
        }
      );
    }
  }

  /*
   * Initialize product cards
   */
  function initProductCards(root) {
    const scope =
      root || document;

    scope
      .querySelectorAll(
        '[data-product-card]'
      )
      .forEach(function (card) {
        initProductCard(card);
      });
  }

  /*
   * Initial page load
   */
  if (
    document.readyState ===
    'loading'
  ) {
    document.addEventListener(
      'DOMContentLoaded',
      function () {
        initProductCards();
      }
    );
  } else {
    initProductCards();
  }

  /*
   * Shopify Theme Editor
   */
  document.addEventListener(
    'shopify:section:load',
    function (event) {
      initProductCards(
        event.target
      );
    }
  );

  document.addEventListener(
    'shopify:section:reorder',
    function () {
      initProductCards();
    }
  );

  document.addEventListener(
    'shopify:block:select',
    function (event) {
      initProductCards(
        event.target
      );
    }
  );
})();