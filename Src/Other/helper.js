
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
