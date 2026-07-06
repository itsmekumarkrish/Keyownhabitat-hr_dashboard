const Jimp = require('jimp');

async function createFavicon() {
  try {
    const image = await Jimp.read('Keyown_habitat_new_logo-removebg-preview.png');
    // Original size is 707x353. The symbol is roughly on the right side.
    
    // We'll crop the right half (353x353)
    const size = Math.min(image.bitmap.width, image.bitmap.height);
    const x = image.bitmap.width - size;
    const y = 0;
    
    image.crop(x, y, size, size);
    
    // Find true bounding box of the symbol to remove extra padding
    let minX = size, minY = size, maxX = 0, maxY = 0;
    
    image.scan(0, 0, image.bitmap.width, image.bitmap.height, function(sx, sy, idx) {
        const alpha = this.bitmap.data[idx + 3];
        if (alpha > 10) {
            minX = Math.min(minX, sx);
            minY = Math.min(minY, sy);
            maxX = Math.max(maxX, sx);
            maxY = Math.max(maxY, sy);
        }
    });
    
    const cropW = maxX - minX;
    const cropH = maxY - minY;
    
    image.crop(minX, minY, cropW, cropH);
    
    // Make it perfectly square again by padding it
    const newSize = Math.max(cropW, cropH) + 10; // add a little padding
    
    const squareImg = new Jimp(newSize, newSize, 0x00000000); // transparent
    const pasteX = Math.floor((newSize - cropW) / 2);
    const pasteY = Math.floor((newSize - cropH) / 2);
    
    squareImg.composite(image, pasteX, pasteY);
    
    // Resize and save
    const fav32 = squareImg.clone().resize(32, 32);
    await fav32.writeAsync('favicon-32x32.png');
    
    const fav192 = squareImg.clone().resize(192, 192);
    await fav192.writeAsync('favicon-192x192.png');
    
    console.log("Successfully generated awesome favicons!");
  } catch(e) {
    console.error(e);
  }
}

createFavicon();
