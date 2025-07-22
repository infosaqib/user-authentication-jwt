document.addEventListener('DOMContentLoaded', function() {
    var password = document.getElementById("password");
    var eye = document.getElementById("eye");
    var eyeSlash = document.getElementById("eye-slash");
    var toggle = document.querySelector(".toggle-password");
    if (toggle) {
      toggle.addEventListener("click", function() {
        if (password.type === "password") {
          password.type = "text";
          eye.style.display = "inline";
          eyeSlash.style.display = "none";
        } else {
          password.type = "password";
          eye.style.display = "none";
          eyeSlash.style.display = "inline";
        }
      });
    }
  });
  
