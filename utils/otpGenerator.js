module.exports = function otpGenerator() {
  let str1 = "";
  let str2 = "0123456789";
  for (let i = 1; i <= 6; i++) {
    str1 += str2[Math.floor(Math.random() * 10)];
  }
  return str1;
};
