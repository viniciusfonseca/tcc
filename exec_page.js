!(function() {

    var popover = document.createElement("div")
    window.idiom_gym_user_id = null
    var extensions = typeof browser !== "undefined" ? browser : chrome
    var textNodes = []
    // var API_URL = "http://localhost:8080"
    var API_URL = "https://viniciusfonseca-tcc-api.glitch.me"
    // var EXERCISES_URL = "http://localhost:3000"
    var EXERCISES_URL = "https://idiom-gym.surge.sh"

    addStyles(popover, {
        position: 'absolute',
        width: '250px',
        height: '140px',
        zIndex: 99,
        boxShadow: '0px 0px 14px rgba(0,0,0,.7)',
        backgroundColor: '#FFF',
        borderRadius: '10px',
        opacity: 0,
        overflowY: 'auto'
    })

    function addStyles(element, stylesObj) {
        for (var style in stylesObj)
            element.style[style] = stylesObj[style]
    }

    window.__closeTranslationPopover = function() {
        setTimeout(function() {
            detachPopover()
        })
    }

    console.log(window.__closeTranslationPopover)

    function detachPopover() {

        popover.innerHTML = ""

        addStyles(popover, { opacity: 0 })

        if (popover.parentNode)
            popover.parentNode.removeChild(popover)
    }

    function attachPopover(x, y) {

        //if (!window.__extactive__) { return }

        document.body.appendChild(popover)

        setTimeout(function() {
            y += 20
            x -= popover.offsetWidth / 2

            addStyles(popover, {
                top: y + 'px',
                left: x + 'px',
                opacity: 1
            })
        })
    }

    function translate(text, originNode, context) {

        if (textNodes.indexOf(originNode) === -1) {
            textNodes.push(originNode)
        }

        function parseAsJson(res) {
            return res.json()
        }

        function translationReceived(res) {
            var translated = res.translated

            popover.innerHTML = '' +
                '<div style="padding: 18px">' +
                    '<p style="font-size: 18px; font-weight: bold">' + translated + '</p>' +
                    '<br /> <br />' +
                    // '<a href="javascript:window.__closeTranslationPopover()"> Fechar </a>' +
                '</div>'
        }

        function notificationReceived(res) {
            var notify = res.notify

            if (notify) {
                alert("[IdiomGym] - Você possui uma nova prova a ser feita. Clique no ícone da extensão para fazer.")
                fetch(API_URL + "/user/" + window.idiom_gym_user_id + "/notify_test", { method: "PUT" })
            }
        }

        return new Promise(function(resolve) {
            var headers = { "Content-Type": "application/json" }
            fetch(
                API_URL + "/translate" +
                    "?t=" + text +
                    "&uid=" + window.idiom_gym_user_id +
                    "&ctx=" + context,
                { headers: headers })
                .then(parseAsJson)
                .then(translationReceived)
                .then(resolve)
                .then(function() {
                    setTimeout(function() {
                        fetch(API_URL + "/user/" + window.idiom_gym_user_id + "/notify_test")
                            .then(parseAsJson)
                            .then(notificationReceived)
                    }, 800)
                })
        })
    }

    function onMouseUp(event) {
        setTimeout(function() {
            var selection = getSelection()

            var phrase = selection.toString()

            detachPopover()

            if (phrase.length === 0) {
                return
            }

            attachPopover(event.pageX, event.pageY)

            if (selection.baseNode !== selection.extentNode)
                return translate(phrase, selection.baseNode, "")

            var contextFirstHalf = (function() {
                var dataFirstHalf = selection.baseNode.data.slice(0, selection.baseOffset).trim()
                var words = (dataFirstHalf.match(/\w+/g) || []).slice(-5)
                return words
            })()

            var contextSecondHalf = (function() {
                var dataSecondHalf = selection.baseNode.data.slice(selection.extentOffset).trim()
                var words = (dataSecondHalf.match(/\w+/g) || []).slice(0, 5)
                return words
            })()

            var words = contextFirstHalf.concat('$word$').concat(contextSecondHalf)

            if (words.length < 8) {
                return translate(phrase, selection.baseNode, "")
            }

            var context = words.join(' ')

            translate(phrase, selection.baseNode, context)
        })

        // search phrase
    }

    document.body.addEventListener("mouseup", onMouseUp)
    document.body.addEventListener("touchend", onMouseUp)

    extensions.storage.sync.get(['uid', 'active', 'test_id'], function(item) {
        var local_user_id = item.uid
        if (!local_user_id) {
            var uid = +(new Date())
            extensions.storage.sync.set({ uid: uid }, function() {
                window.idiom_gym_user_id = uid
                console.log('IdiomGym initiated! userId:', window.idiom_gym_user_id)
            })
            return
        }
        else {
            window.idiom_gym_user_id = local_user_id
            console.log('IdiomGym initiated! userId:', window.idiom_gym_user_id)
        }

        fetch(`${API_URL}/test?uid=${local_user_id}`)
            .then(function(r) { return r.json() })
            .then(function(response) {
                var test_id = response.test_id
                if (!test_id) { return }

                extensions.notifications.onClosed.addListener(function() {
                    extensions.notifications.clear("test")

                    window.open(EXERCISES_URL + "?test_id=" + test_id, "_blank")
                })

                if (test_id !== item.test_id) {
                    extensions.notifications.create("test", {
                        title: "IdiomGym - Nova Prova",
                        message: "Você possui uma nova prova para ser feita. Clique para fazer."
                    })

                    extensions.storage.sync.set({ test_id: test_id })
                }
            })

        window.__extactive__ = Boolean(parseInt(item.active))
    })
})()
