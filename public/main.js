// const { trusted } = require("mongoose");

// Get the button that opens the modal
let mergeButton = document.querySelector('.merge')

// Get the <span> element that closes the modal
let closeModal = document.getElementsByClassName("close")[0];

// When the user clicks on the button, open the modal

function openWindow(evt) {
    let modal = document.getElementById("myModal");
    evt.preventDefault();
    let button = evt.target
    let url = button.closest('[data-url]').dataset.url
    navigator.clipboard.writeText(url).then(() => {
    modal.style.display = "block";
    }, () => {
        alert('something went wrong...')
    });
}

// When the user clicks on <span> (x), close the modal
closeModal.onclick = function () {
    let modal = document.getElementById("myModal");
    modal.style.display = "none";
}

// When the user clicks anywhere outside of the modal, close it
window.onclick = function (event) {
    let modal = document.getElementById("myModal");
    if (event.target == modal) {
        modal.style.display = "none";
    }
}

// Get the button that opens the modal
let openLists = document.querySelector('.openList')

// Get the <span> element that closes the modal
let exitModal = document.getElementsByClassName("exit")[0];

// When the user clicks on the button, open the modal

function openList(evt) {
    let modal = document.getElementById("listModal");
    modal.style.display = "block";
}

// When the user clicks on <span> (x), close the modal
exitModal.onclick = function () {
    let modal = document.getElementById("listModal");
    modal.style.display = "none";
}

// When the user clicks anywhere outside of the modal, close it
window.onclick = function (event) {
    let modal = document.getElementById("listModal");
    if (event.target == modal) {
        modal.style.display = "none";
    }
}

document.getElementById('submit').addEventListener('click', submitNames)

function submitNames() {
    let selectedPlaylists = []
    const select = document.getElementById('names')
    var options = select && select.options;
    var opt;

    for (var i = 0, iLen = options.length; i < iLen; i++) {
        opt = options[i];

        if (opt.selected === true) {
            selectedPlaylists.push({ name: opt.innerText, id: opt.value })
        }
    }

    console.log(selectedPlaylists)

    fetch('merged', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            'newPlaylistName': document.getElementById('newPlaylistName').value,
            selectedPlaylists
        })
    }).then(function (response) {
        window.location.reload()
    })
}