st_push = document.getElementsByClassName("st-push");
st_push[0].style.backgroundColor = "#086F6F";
for (let i = 0; i < st_push.length; i++) {
  st_push[i].addEventListener("click", function (e) {
    for (let j = 0; j < st_push.length; j++) {
      st_push[j].style.backgroundColor = "Unset";
    }
    st_push[i].style.backgroundColor = "#086F6F";
    document.querySelector(".st-scroll").style.top =
      "-" + i * window.innerHeight + "px";
  });
}
