// Get the button that opens the modal
let mergeButton = document.querySelector('.merge')

// Get the <span> element that closes the modal
let closeModal = document.getElementsByClassName("close")[0];

// When the user clicks on the button, open the modal

function openWindow(evt) {
    console.log('function accessed')
    let modal = document.getElementById("myModal");
    modal.style.display = "block";
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