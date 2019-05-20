// var API_URL = "http://localhost:8080"
var API_URL = "https://viniciusfonseca-tcc-api.glitch.me"
// var EXERCISES_URL = "http://localhost:3000"
var EXERCISES_URL = "https://idiom-gym.surge.sh"

var popup = document.getElementById("__ext-popup__")
var extensions = typeof browser !== "undefined" ? browser : chrome
window.test_id = null

function sendFeedback() {

}

function rateExt() {

}

function fetchTest() {

    extensions.storage.sync.get(['uid', 'active', 'test_id'], function(item) {
        var local_user_id = item.uid

        document.querySelector('.dict-button').addEventListener('click', function() {
            window.open(EXERCISES_URL + "?user_id=" + local_user_id, "_blank")
        })

        document.querySelector('#uid').value = local_user_id

        fetch(`${API_URL}/test?uid=${local_user_id}`)
            .then(function(r) { return r.json() })
            .then(function(response) {
                var test_id = response.test_id
                if (!test_id) { return }

                var notif_container = popup.getElementsByClassName('test-notification')[0]
                    notif_container.innerHTML = "" +
                        '<span class="notification"> ! </span>' +
                        '<span class="flex">' +
                            'Você possui uma prova pronta para ser feita.' +
                            '<a href="' + EXERCISES_URL + '?test_id=' + test_id + '" target="_blank"> Clique aqui </a>' +
                        '</span>'

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

    })
}


document.addEventListener('DOMContentLoaded', fetchTest)

var form = popup.querySelector('form')