const guessGrid = document.querySelector("[data-guess-grid]")
const keyboard = document.querySelector("[data-keyboard]")
const alertContainer = document.querySelector("[data-alert-container]")
const WORD_LENGTH = 5
const FLIP_ANIMATION_DURATION = 500
const DANCE_ANIMATION_DURATION = 500

startInteraction()

function startInteraction() {
    document.addEventListener("click", handleMouseClick)
    document.addEventListener("keydown", handleKeyPress)
}

function stopInteraction() {
    document.removeEventListener("click", handleMouseClick)
    document.removeEventListener("keydown", handleKeyPress)
}

function handleMouseClick(event) {
    if (event.target.matches("[data-key]")) {
        pressKey(event.target.dataset.key)
        return
    }

    if (event.target.matches("[data-enter]")) {
        submitGuess()
        return
    }

    if (event.target.matches("[data-delete]")) {
        deleteKey()
    }
}

function handleKeyPress(event) {
    if (event.key === "Enter") {
        submitGuess()
        return
    }

    if (event.key === "Backspace" || event.key === "Delete") {
        deleteKey()
        return
    }

    if (event.key.match(/^[a-z]$/)) {
        pressKey(event.key)
    }
}

function pressKey(key) {
    const activeTiles = getActiveTiles()
    if (activeTiles.length >= WORD_LENGTH) return
    const nextTile = guessGrid.querySelector(":not([data-letter])")
    nextTile.dataset.letter = key.toLowerCase()
    nextTile.textContent = key
    nextTile.dataset.state = "active"
}

function getActiveTiles() {
    return guessGrid.querySelectorAll('[data-state="active"]')
}

function submitGuess() {
    const activeTiles = [...getActiveTiles()]

    const guess = activeTiles.reduce((word, tile) => {
        return word + tile.dataset.letter
    }, "")

    let xhr = new XMLHttpRequest()
    xhr.open('GET', 'http://localhost:8080/wordle_web3_war_exploded/check-guess?guess=' + guess)

    xhr.onload = function() {
        if (xhr.status === 200) {
            const responses = xhr.responseXML.getElementsByTagName("status")
            stopInteraction()
            flipTiles(activeTiles, responses, guess)
        } else if (xhr.status === 422) {
            showAlert(xhr.getResponseHeader("message"))
            shakeTiles(activeTiles)
        }
    }

    xhr.send()
}

function flipTiles(tiles, responses, guess) {
    const lettersStatus = []
    for (let index = 0; index < tiles.length; index++) {
        const tile = tiles[index]
        const letter = tile.dataset.letter
        const key = keyboard.querySelector(`[data-key="${letter}"i]`)
        setTimeout(() => {
            tile.classList.add("flip")
        }, index * FLIP_ANIMATION_DURATION / 2)

        const letterStatus = responses[index].firstChild.nodeValue
        lettersStatus[index] = letterStatus

        tile.addEventListener("transitionend", () => {
            tile.classList.remove("flip")
            if (letterStatus === "correct") {
                tile.dataset.state = "correct"
                key.classList.add("correct")
            } else if (letterStatus === "wrong_place") {
                tile.dataset.state = "wrong-location"
                key.classList.add("wrong-location")
            } else if (letterStatus === "wrong") {
                tile.dataset.state = "wrong"
                key.classList.add("wrong")
            }

            if (index === tiles.length - 1) {
                tile.addEventListener("transitionend", () => {
                    startInteraction()
                    checkWinLose(guess, tiles, lettersStatus)
                }, { once: true })
            }
        }, { once: true })
    }
}

function deleteKey() {
    const activeTiles = getActiveTiles()
    const lastActiveTile = activeTiles[activeTiles.length - 1]
    if (lastActiveTile == null) return
    lastActiveTile.textContent = ""
    delete lastActiveTile.dataset.state
    delete lastActiveTile.dataset.letter
}

function showAlert(message, duration = 1000) {
    const alert = document.createElement("div")
    alert.textContent = message
    alert.classList.add("alert")
    alertContainer.prepend(alert)
    if (duration == null) return
    setTimeout(() => {
        alert.classList.add("hide")
        alert.addEventListener("transitionend", () => {
            alert.remove()
        })
    }, duration)
}

function shakeTiles(tiles) {
    tiles.forEach(tile => {
        tile.classList.add("shake")
        tile.addEventListener("animationend", () => {
            tile.classList.remove("shake")
        }, { once: true })
    })
}

function checkWinLose(guess, tiles, lettersStatus) {
    if (lettersStatus.every(value => value === "correct")) {
        showAlert("Magnificient!", 5000)
        danceTiles(tiles)
        stopInteraction()
        return
    }

    const remainingTiles = guessGrid.querySelectorAll(":not([data-letter])")
    if (remainingTiles.length === 0) {
        let xhr = new XMLHttpRequest()
        xhr.open('GET', 'http://localhost:8080/wordle_web3_war_exploded/check-guess')
        xhr.onload = () => {
            if (xhr.status === 200) {
                const dailyWord = xhr.responseXML.getElementsByTagName("word")[0].firstChild.nodeValue
                showAlert("You lose! The correct word was: " + dailyWord, null)
            }
        }
        xhr.send()
        stopInteraction()
    }
}

function danceTiles(tiles) {
    tiles.forEach((tile, index) => {
        setTimeout(() => {
            tile.classList.add("dance")
            tile.addEventListener("animationend", () => {
                tile.classList.remove("dance")
            }, { once: true })
        }, index * DANCE_ANIMATION_DURATION / 5)
    })
}
