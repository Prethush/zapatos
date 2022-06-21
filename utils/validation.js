function formValidation(fname, lname, mail, passwd, cPasswd) {
  let pattern = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
  let regEx = /^[A-Za-z]+$/;
  let nameError, mailError, passwdError;
  if (fname.length < 3) {
    nameError = "First Name should be atleast 3 characeters";
    return nameError;
  }
  if (!regEx.test(fname) || !regEx.test(lname)) {
    nameError = "First Name  and Last Name should contain only alphabets";
    return nameError;
  }
  if (!pattern.test(mail)) {
    emailError = "Email is invalid";
    return emailError;
  }
  if (passwd.length < 6) {
    passwdError = "Password should be atleat 6 characters";
    return passwdError;
  }
  if (passwd !== cPasswd) {
    passwdError = "Password is wrong";
    return passwdError;
  }
}

module.exports = formValidation;
