injectStyles()

const observer = new MutationObserver(injectBlockButtons)
observer.observe(document.body, { childList: true, subtree: true })

function injectBlockButtons() {
    const tweetArticles = document.querySelectorAll('article[data-testid="tweet"]')

    for (const tweet of tweetArticles) {
        if (tweet.querySelector('.oneClickBlockTwitterButton')) {
            continue
        }

        const screenNameSpan = tweet.querySelector('a[href*="/"][role="link"][tabindex="-1"] span')
        const screenName = screenNameSpan?.textContent?.replace("@", '')?.trim()
        const threeDotsMostOuterDiv = tweet.querySelector('button[aria-label="More"][aria-haspopup="menu"][data-testid="caret"]').parentElement.parentElement.parentElement

        const blockButtonHtmlString = '<svg viewBox="0 0 24 24" aria-hidden="true" fill="rgb(113, 118, 123)" class="oneClickBlockTwitterButton r-4qtqp9 r-yyyyoo r-dnmrzs r-bnwqim r-lrvibr r-m6rgpd r-1xvli5t r-1hdv0qi"><g><path d="M12 3.75c-4.55 0-8.25 3.69-8.25 8.25 0 1.92.66 3.68 1.75 5.08L17.09 5.5C15.68 4.4 13.92 3.75 12 3.75zm6.5 3.17L6.92 18.5c1.4 1.1 3.16 1.75 5.08 1.75 4.56 0 8.25-3.69 8.25-8.25 0-1.92-.65-3.68-1.75-5.08zM1.75 12C1.75 6.34 6.34 1.75 12 1.75S22.25 6.34 22.25 12 17.66 22.25 12 22.25 1.75 17.66 1.75 12z"></path></g></svg>'
        const blockButton = document.createElement('div')
        blockButton.innerHTML = blockButtonHtmlString
        blockButton.addEventListener('click', async event => {
            event.stopPropagation()
            tweet.style.display = 'none'
            blockUser(screenName)
        })
        const blockButtonWrapper = document.createElement('div')
        blockButtonWrapper.id = 'blockButtonWrapper'
        blockButtonWrapper.appendChild(blockButton)

        threeDotsMostOuterDiv.insertAdjacentElement('beforebegin', blockButtonWrapper)
    }
}

function injectStyles() {
    if (document.getElementById('block-button-styles')) return

    const styleSheet = document.createElement('style')
    styleSheet.id = 'block-button-styles'
    styleSheet.textContent = `
        #blockButtonWrapper {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 34px;
            height: 34px;
            border-radius: 9999px;
            cursor: pointer;
            background-color: transparent;
            transition: background-color 0.2s ease;
            pointer-events: auto;
            z-index: 10;
            position: relative;
        }
        #blockButtonWrapper:hover {
            background-color: rgba(29, 155, 240, 0.1);
        }

        #blockButtonWrapper .oneClickBlockTwitterButton path {
            fill: rgb(113, 118, 123);
        }
        #blockButtonWrapper:hover .oneClickBlockTwitterButton path {
            fill: rgb(29, 155, 240);
            transition: fill 0.2s ease;
        }
    `
    document.head.appendChild(styleSheet)
}

const BEARER_TOKEN = "Bearer AAAAAAAAAAAAAAAAAAAAANRILgAAAAAAnNwIzUejRCOuH5E6I8xnZz4puTs%3D1Zv7ttfk8LF81IUq16cHjhLTvJu4FA33AGWWjCpTnA"

/**
 * @param {string} screenName
 * @returns {Promise<object>}
 */
function blockUser(screenName) {
    const url = `https://api.x.com/1.1/blocks/create.json?screen_name=${screenName}&skip_status=1`

    //TODO: Refactor without regex
    // eslint-disable-next-line no-restricted-syntax
    const csrfToken = document.cookie.match(/ct0=([^;]+)/)?.[1]

    if (!csrfToken) {
        // eslint-disable-next-line no-console
        console.error("CSRF token not found")
        return
    }

    fetch(
        url,
        {
            method: "POST",
            headers: {
                "Authorization": BEARER_TOKEN,
                "x-csrf-token": csrfToken,
                "Content-Type": "application/x-www-form-urlencoded"
            },
            credentials: "include"
        }
    )
    .then(response => {
        if (!response.ok) {
            return response.json().then(errData => {
                throw new Error(`HTTP error! Status: ${response.status}, Message: ${JSON.stringify(errData)}`)
            })
        }
        return response.json()
    })
}