injectStyles()

const observer = new MutationObserver(injectBlockButtons)
observer.observe(document.body, { childList: true, subtree: true })

function setLoggedInUser() {
    loggedInUser = document.querySelector('a[data-testid="AppTabBar_Profile_Link"]')?.href?.split('/').pop()
}

let loggedInUser
setLoggedInUser()

let isInjecting = false

function injectBlockButtons() {
    if (isInjecting) {
        return
    }

    isInjecting = true

    const tweetArticles = document.querySelectorAll('article[data-testid="tweet"]')

    for (const tweet of tweetArticles) {
        if (!loggedInUser) {
            setLoggedInUser()
        }
        if (tweet.querySelector('.oneClickBlockTwitterButton')) {
            continue
        }

        const screenNameSpan = tweet.querySelector('a[href*="/"][role="link"][tabindex="-1"] span')
        const screenName = screenNameSpan?.textContent?.replace("@", '')?.trim()
        if (screenName === loggedInUser) {
            continue
        }
        const threeDotsMostOuterDiv = tweet.querySelector('button[aria-label="More"][aria-haspopup="menu"][data-testid="caret"]')?.parentElement?.parentElement?.parentElement

        const blockButtonHtmlString = '<svg viewBox="0 0 24 24" aria-hidden="true" fill="rgb(113, 118, 123)" class="oneClickBlockTwitterButton r-4qtqp9 r-yyyyoo r-dnmrzs r-bnwqim r-lrvibr r-m6rgpd r-1xvli5t r-1hdv0qi"><g><path d="M12 3.75c-4.55 0-8.25 3.69-8.25 8.25 0 1.92.66 3.68 1.75 5.08L17.09 5.5C15.68 4.4 13.92 3.75 12 3.75zm6.5 3.17L6.92 18.5c1.4 1.1 3.16 1.75 5.08 1.75 4.56 0 8.25-3.69 8.25-8.25 0-1.92-.65-3.68-1.75-5.08zM1.75 12C1.75 6.34 6.34 1.75 12 1.75S22.25 6.34 22.25 12 17.66 22.25 12 22.25 1.75 17.66 1.75 12z"></path></g></svg>'
        const blockButton = document.createElement('div')
        blockButton.innerHTML = blockButtonHtmlString

        const blockButtonWrapper = document.createElement('div')
        blockButtonWrapper.className = 'blockButtonWrapper'
        blockButtonWrapper.appendChild(blockButton)
        blockButtonWrapper.addEventListener('click', async event => {
            event.stopPropagation()
            const previousStyle = tweet.style.display
            tweet.style.display = 'none'
            try {
                await blockAction(screenName)
                showBlockToast(screenName, tweet, previousStyle)
            } catch (error) {
                tweet.style.display = previousStyle
            }
        })

        threeDotsMostOuterDiv?.insertAdjacentElement('beforebegin', blockButtonWrapper)
    }

    isInjecting = false
}

function showBlockToast(screenName, tweet, previousTweetStyle) {
    const toast = document.createElement('div')
    toast.className = 'block-toast'
    toast.innerHTML = `
        <div class="toast-content">
            <span>@${screenName} has been blocked</span>
            <button class="undo-button">Undo</button>
        </div>
    `
    document.body.appendChild(toast)

    const timeoutId = setTimeout(() => {
        toast.remove()
    }, 5000)

    const undoButton = toast.querySelector('.undo-button')
    undoButton.addEventListener('click', async () => {
        try {
            await blockAction(screenName, 'unblock')
            tweet.style.display = previousTweetStyle
            clearTimeout(timeoutId)
            toast.remove()
        } catch (error) {}
    })
}

const BEARER_TOKEN = "Bearer AAAAAAAAAAAAAAAAAAAAANRILgAAAAAAnNwIzUejRCOuH5E6I8xnZz4puTs%3D1Zv7ttfk8LF81IUq16cHjhLTvJu4FA33AGWWjCpTnA"

/**
 * @param {string} screenName
 * @param {string} action
 * @returns {Promise<object>}
 */
async function blockAction(screenName, action = 'block') {
    const url = `https://api.x.com/1.1/blocks/${action === 'unblock' ? 'destroy' : 'create'}.json?screen_name=${screenName}&skip_status=1`

    //TODO: Refactor without regex
    // eslint-disable-next-line no-restricted-syntax
    const csrfToken = document.cookie.match(/ct0=([^;]+)/)?.[1]

    if (!csrfToken) {
        throw new Error("CSRF token not found")
    }

    return fetch(
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
            throw new Error('HTTP error')
        }
        return response.json()
    })
}

function injectStyles() {
    if (document.getElementById('block-button-styles')) return

    const styleSheet = document.createElement('style')
    styleSheet.id = 'block-button-styles'
    styleSheet.textContent = `
        .blockButtonWrapper {
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
        .blockButtonWrapper:hover {
            background-color: rgba(29, 155, 240, 0.1);
        }

        .blockButtonWrapper .oneClickBlockTwitterButton path {
            fill: rgb(113, 118, 123);
        }
        .blockButtonWrapper:hover .oneClickBlockTwitterButton path {
            fill: rgb(29, 155, 240);
            transition: fill 0.2s ease;
        }
        .block-toast {
            position: fixed;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
            background-color: #1DA1F2;
            color: white;
            padding: 10px 20px;
            border-radius: 20px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.2);
            z-index: 10000;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
        }
        .toast-content {
            display: flex;
            align-items: center;
            gap: 15px;
        }
        .undo-button {
            background: none;
            border: none;
            color: white;
            text-decoration: underline;
            cursor: pointer;
            font-size: 14px;
        }
        .undo-button:hover {
            color: #E1E8ED;
        }
    `
    document.head.appendChild(styleSheet)
}