
function colorAlpha(p5Color, newAlpha = 255) {
    // Extract the red, green, and blue components from the p5 color
    let redValue = red(p5Color);
    let greenValue = green(p5Color);
    let blueValue = blue(p5Color);
  
    // Create a new color with the updated alpha
    let updatedColor = color(redValue, greenValue, blueValue, newAlpha);
  
    return updatedColor;
}

Array.prototype.remove = function(element) {
    const index = this.indexOf(element);
    if (index !== -1) {
      this.splice(index, 1);
    }
};

function transformValue(x, y, m = 1, k = 1) {
  return y * (1 - Math.exp(-k * x / m));
}

function randString() {
  return (Math.random() + 1).toString(36).substring(7);
}

function checkIfFileExists(url, callback) {
  var xhr = new XMLHttpRequest();
  xhr.open('HEAD', url, true);
  xhr.onreadystatechange = function () {
      if (xhr.readyState === 4) {
          if (xhr.status == 200) {
              callback(true);
          } else {
              callback(false);
          }
      }
  };
  xhr.send();
}

function lerpAngle(A, B, w){
  let CS = (1-w)*Math.cos(A) + w*Math.cos(B);
  let SN = (1-w)*Math.sin(A) + w*Math.sin(B);
  return Math.atan2(SN,CS);
}

function romanNumeral(num) {
  if (isNaN(num))
      return NaN;
  var digits = String(+num).split(""),
      key = ["","C","CC","CCC","CD","D","DC","DCC","DCCC","CM",
             "","X","XX","XXX","XL","L","LX","LXX","LXXX","XC",
             "","I","II","III","IV","V","VI","VII","VIII","IX"],
      roman = "",
      i = 3;
  while (i--)
      roman = (key[+digits.pop() + (i * 10)] || "") + roman;
  return Array(+digits.join("") + 1).join("M") + roman;
}
