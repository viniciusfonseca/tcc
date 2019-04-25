!(function() {

    var popover = document.createElement("div")
    var user_id = null
    var extensions = typeof browser !== "undefined" ? browser : chrome
    var textNodes = []

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
                "http://localhost:8080/translate" +
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
            const selection = getSelection()

            console.log(selection)

            var phrase = selection.toString()

            detachPopover()

            if (phrase.length === 0) {
                return
            }

            attachPopover(event.pageX, event.pageY)

            translate(phrase, selection.baseNode)

            if (selection.baseNode !== selection.extentNode) { return }
        })

        // search phrase
    }

    document.body.addEventListener("mouseup", onMouseUp)
    document.body.addEventListener("touchend", onMouseUp)

    console.log('IdiomGym initiated!')

    extensions.storage.sync.get(['uid', 'active'], function(item) {
        user_id = item.user_id
        if (!user_id) {
            var uid = +(new Date())
            chrome.storage.sync.set({ uid: uid }, function() {
                user_id = uid
            })
        }

        window.__extactive__ = Boolean(parseInt(item.active))
    })
})()
