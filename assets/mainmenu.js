const showToast = (text) => {
    var snackbar = document.getElementById("snackbar");
    snackbar.textContent = text;
    snackbar.className = "show";
    setTimeout(function () { snackbar.className = snackbar.className.replace("show", ""); }, 3000);
}

const fetchGame = async () => {
    let code = document.getElementById('code').value;
    document.getElementById('maincontent').classList.value = "invisible";
    document.getElementById('loading').classList.value = "loading";

    let response = await fetch('./doesThisGameExist', { method: "POST", body: JSON.stringify({ code }) });
     setTimeout(() => {
        if (!response.ok) {
            document.getElementById('maincontent').classList.value = "game";
            document.getElementById('loading').classList.value = "invisible";
            return showToast(`Žaidimo kambarys nerastas!`);
        }
    
        window.location.href = `/play?code=${code}`;
    }, 700);
}