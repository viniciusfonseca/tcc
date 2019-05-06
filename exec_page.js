!(function() {

    var popover = document.createElement("div")
    var user_id = null
    var extensions = typeof browser !== "undefined" ? browser : chrome
    var textNodes = []
    // var API_URL = "https://viniciusfonseca-tcc-api.glitch.me"
    var API_URL = "http://localhost:8080"
    var EXERCISES_URL = "http://localhost:3000"

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

    function translate(text, originNode) {

        var context = ""
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
                '</div>'
        }

        return new Promise(function(resolve) {
            var headers = { "Content-Type": "application/json" }
            fetch(
                API_URL + "/translate" +
                    "?t=" + text +
                    "&uid=" + user_id +
                    "&ctx=" + "",
                { headers: headers })
                .then(parseAsJson)
                .then(translationReceived)
                .then(resolve)
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

            translate(phrase, selection.baseNode)

            if (selection.baseNode !== selection.extentNode) { return }

            var length = selection.baseOffset - selection.extentOffset

            var contextFirstHalf = (function() {
                var dataFirstHalf = selection.baseNode.data.trim().slice(0, selection.baseOffset)
                var words = dataFirstHalf.match(/\w+/g).slice(-5)
                return words
            })()

            var contextSecondHalf = (function() {
                var dataSecondHalf = selection.baseNode.data.trim().slice(selection.extentOffset)
                var words = dataSecondHalf.match(/\w+/g).slice(5)
                return words
            })()

            var words = contextFirstHalf.concat('%word%').concat(contextSecondHalf)

            if (words.length < 8) { return }

            
        })

        // search phrase
    }

    document.body.addEventListener("mouseup", onMouseUp)
    document.body.addEventListener("touchend", onMouseUp)

    console.log('IdiomGym initiated!')

    extensions.storage.sync.get(['uid', 'active', 'test_id'], function(item) {
        user_id = item.user_id
        if (!user_id) {
            var uid = +(new Date())
            extensions.storage.sync.set({ uid: uid }, function() {
                user_id = uid
            })
        }

        fetch(`/${API_URL}/test`)
            .then(r => r.json())
            .then(response => {
                var test_id = response.test_id
                if (!test_id) { return }

                extensions.notifications.onClicked.addListener(function() {
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
